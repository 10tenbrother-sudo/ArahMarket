/**
 * Authentication and Session Management Service
 * Supports Register, Login, Token generation/verification,
 * RBAC (USER, ADMIN), and Protected Route Middlewares.
 */

import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database.js';
import { User, UserRole, UserPreferences } from '../types.js';

const JWT_SECRET = process.env.APP_SECRET || 'market-intelligence-terminal-secret-key-prod-9988';

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
  /**
   * Hashes password using PBKDF2 with unique salt
   */
  public static hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const s = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, s, 1000, 64, 'sha512').toString('hex');
    return { hash, salt: s };
  }

  /**
   * Verifies password against stored hash and salt
   */
  public static verifyPassword(password: string, hash: string, salt: string): boolean {
    const derived = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(derived, 'utf-8'), Buffer.from(hash, 'utf-8'));
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
   * Registers a new user with default preferences
   */
  public static register(email: string, password: string, name: string): { user: User; token: string } {
    const existing = db.getUserByEmail(email);
    if (existing) {
      throw new Error('User already exists with this email address.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const { hash, salt } = this.hashPassword(password);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newUser: User = {
      id: userId,
      email: email.toLowerCase().trim(),
      password_hash: hash,
      salt,
      name: name.trim() || 'Trader',
      role: 'USER',
      is_verified: true, // Auto-verified for seamless UX
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

    const token = this.generateToken(newUser);
    return { user: newUser, token };
  }

  /**
   * Authenticates user credentials
   */
  public static login(email: string, password: string): { user: User; token: string } {
    const user = db.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isValid = this.verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      throw new Error('Invalid email or password.');
    }

    const token = this.generateToken(user);
    return { user, token };
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
