/**
 * Authentication and Session Management Service
 * Supports Register, Login, Token generation/verification,
 * RBAC (USER, ADMIN), and Protected Route Middlewares.
 */

import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database.js';
import { User, UserRole, UserPreferences } from '../types.js';
import { mailService, EmailSendResult } from '../services/mailService.js';

const PBKDF2_ITERATIONS = 210_000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';

function resolveSecret(): string {
  const fromEnv = process.env.APP_SECRET;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[FATAL] APP_SECRET tidak diset (atau kurang dari 32 karakter). ' +
      'Set di environment variable sebelum menjalankan production.'
    );
  }
  console.warn('[Auth] APP_SECRET belum diset — memakai secret sementara khusus development.');
  return 'dev-only-insecure-secret-do-not-use-in-production';
}

const JWT_SECRET = resolveSecret();

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export class AuthService {
  public static hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const s = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, s, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
      .toString('hex');
    return { hash, salt: s };
  }

  public static verifyPassword(password: string, hash: string, salt: string): boolean {
    if (!password || !hash || !salt) return false;
    try {
      const derived = crypto.pbkdf2Sync(
        password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST
      );
      const stored = Buffer.from(hash, 'hex');
      if (derived.length !== stored.length) return false;
      return crypto.timingSafeEqual(derived, stored);
    } catch {
      return false;
    }
  }

  /**
   * Issues stateless signed authorization token
   */
  public static generateToken(user: User): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        userId: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      })
    ).toString('base64url');

    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    return `${header}.${payload}.${signature}`;
  }

  /**
   * Validates token and returns decoded payload
   */
  public static verifyToken(token: string): AuthTokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [header, payload, signature] = parts;

      const expectedSig = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${payload}`)
        .digest('base64url');

      if (signature !== expectedSig) return null;

      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as AuthTokenPayload;
      if (decoded.exp < Math.floor(Date.now() / 1000)) return null;

      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Registers a new user in 'pending_verification' status and dispatches verification link
   */
  public static async register(
    email: string,
    password: string,
    name: string,
    baseUrl: string
  ): Promise<{
    user: User;
    status: 'pending_verification';
    message: string;
    mailResult: EmailSendResult;
    verificationUrl?: string;
  }> {
    const cleanEmail = email.toLowerCase().trim();
    const existing = db.getUserByEmail(cleanEmail);
    if (existing) {
      if (!existing.is_verified || existing.verification_status === 'pending_verification') {
        const err: any = new Error('ALREADY_REGISTERED_UNVERIFIED: Email ini sudah terdaftar tetapi belum diverifikasi. Silakan periksa inbox Anda atau minta kirim ulang tautan.');
        err.code = 'ALREADY_REGISTERED_UNVERIFIED';
        err.email = existing.email;
        throw err;
      }
      throw new Error('User already exists with this email address.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const { hash, salt } = this.hashPassword(password);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newUser: User = {
      id: userId,
      email: cleanEmail,
      password_hash: hash,
      salt,
      name: name.trim() || 'Trader',
      role: 'USER',
      is_verified: false,
      verification_status: 'pending_verification',
      plan: 'FREE',
      subscription_status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.insertUser(newUser);

    const defaultPrefs: UserPreferences = {
      user_id: userId,
      timezone: 'UTC',
      language: 'en',
      theme: 'dark',
      default_market_view: 'XAUUSD',
      density: 'compact',
      audio_alerts: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.upsertUserPreferences(defaultPrefs);

    // Create temporary verification token in database (valid 24h)
    const tokenRecord = db.createVerificationToken(userId, cleanEmail, 24);

    // Send verification email via node-mailer service
    const mailResult = await mailService.sendVerificationEmail(
      cleanEmail,
      newUser.name,
      tokenRecord.token,
      baseUrl
    );

    return {
      user: newUser,
      status: 'pending_verification',
      message: 'Registrasi berhasil. Tautan aktivasi akun telah dikirim ke email Anda.',
      mailResult,
      verificationUrl: mailResult.devMode ? mailResult.verificationUrl : undefined,
    };
  }

  /**
   * Authenticates user credentials with verification check
   */
  public static login(email: string, password: string): { user: User; token: string } {
    const cleanEmail = email.toLowerCase().trim();
    const user = db.getUserByEmail(cleanEmail);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isValid = this.verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      throw new Error('Invalid email or password.');
    }

    // Enforce email verification
    if (!user.is_verified || user.verification_status === 'pending_verification') {
      const err: any = new Error('EMAIL_NOT_VERIFIED: Akun Anda belum diverifikasi. Silakan periksa inbox email Anda untuk mengklik tautan aktivasi.');
      err.code = 'EMAIL_NOT_VERIFIED';
      err.email = user.email;
      throw err;
    }

    const token = this.generateToken(user);
    return { user, token };
  }

  /**
   * Verifies an email token from verification_tokens table and activates user
   */
  public static verifyEmail(token: string): { success: boolean; user?: User; token?: string; error?: string } {
    const res = db.consumeVerificationToken(token);
    if (!res.success || !res.user) {
      return { success: false, error: res.error || 'Token verifikasi tidak valid atau telah kedaluwarsa.' };
    }

    const sessionToken = this.generateToken(res.user);
    return {
      success: true,
      user: res.user,
      token: sessionToken,
    };
  }

  /**
   * Resends verification email for unverified user
   */
  public static async resendVerification(
    email: string,
    baseUrl: string
  ): Promise<{ success: boolean; message: string; mailResult: EmailSendResult; verificationUrl?: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const user = db.getUserByEmail(cleanEmail);
    if (!user) {
      throw new Error('Akun dengan alamat email ini tidak ditemukan.');
    }

    if (user.is_verified && user.verification_status !== 'pending_verification') {
      throw new Error('Akun Anda sudah terverifikasi sebelumnya. Silakan langsung masuk ke terminal.');
    }

    const tokenRecord = db.createVerificationToken(user.id, user.email, 24);
    const mailResult = await mailService.sendVerificationEmail(
      user.email,
      user.name,
      tokenRecord.token,
      baseUrl
    );

    return {
      success: true,
      message: 'Tautan verifikasi baru telah dikirimkan ke email Anda.',
      mailResult,
      verificationUrl: mailResult.devMode ? mailResult.verificationUrl : undefined,
    };
  }
}

/**
 * Express Middleware: Require Authentication
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : queryToken;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
    return;
  }

  const payload = AuthService.verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return;
  }

  const user = db.getUserById(payload.userId);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized: User not found' });
    return;
  }

  if (!user.is_verified || user.verification_status === 'pending_verification') {
    res.status(403).json({
      error: 'EMAIL_NOT_VERIFIED',
      message: 'Akun Anda belum diverifikasi via email. Silakan periksa inbox Anda.',
      email: user.email,
    });
    return;
  }

  req.user = user;
  next();
}

/**
 * Express Middleware: Require ADMIN Role
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }
    next();
  });
}

/**
 * Express Middleware: Optional Authentication (sets req.user if valid token provided)
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : queryToken;

  if (token) {
    const payload = AuthService.verifyToken(token);
    if (payload) {
      const user = db.getUserById(payload.userId);
      if (user) req.user = user;
    }
  }
  next();
}
