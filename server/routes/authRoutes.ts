import { Router, Response } from 'express';
import { AuthService, requireAuth, AuthenticatedRequest } from '../auth/authService.js';
import { db } from '../db/database.js';

export const authRouter = Router();

function getBaseUrl(req: any): string {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  return `${protocol}://${host}`;
}

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const baseUrl = getBaseUrl(req);
    const result = await AuthService.register(email, password, name || 'Trader', baseUrl);

    res.status(201).json({
      success: true,
      status: 'pending_verification',
      message: result.message,
      email: result.user.email,
      verificationUrl: result.verificationUrl, // Exposed in dev mode for swift testing
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        is_verified: false,
        verification_status: 'pending_verification',
      },
    });
  } catch (err: any) {
    if (err.code === 'ALREADY_REGISTERED_UNVERIFIED') {
      res.status(409).json({
        error: err.message,
        code: 'ALREADY_REGISTERED_UNVERIFIED',
        email: err.email,
      });
      return;
    }
    res.status(400).json({ error: err.message });
  }
});

authRouter.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const result = AuthService.login(email, password);
    res.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        is_verified: result.user.is_verified,
        verification_status: result.user.verification_status,
        plan: result.user.plan || 'FREE',
        subscription_status: result.user.subscription_status || 'active',
        subscription_expires_at: result.user.subscription_expires_at,
      },
      token: result.token,
    });
  } catch (err: any) {
    if (err.code === 'EMAIL_NOT_VERIFIED') {
      res.status(403).json({
        error: err.message,
        code: 'EMAIL_NOT_VERIFIED',
        email: err.email,
      });
      return;
    }
    res.status(401).json({ error: err.message });
  }
});

/**
 * Verifies email via GET (direct click from email client)
 * If opened in browser (Accept: text/html), serves a stylized redirect card.
 * If requested via API/Fetch, responds with JSON.
 */
authRouter.get('/verify-email', (req, res) => {
  const token = req.query.token as string | undefined;

  if (!token) {
    if (req.accepts('html')) {
      res.status(400).send(renderVerificationResultHtml(false, 'Parameter token verifikasi tidak ditemukan.'));
      return;
    }
    res.status(400).json({ error: 'Parameter token verifikasi wajib disertakan.' });
    return;
  }

  const result = AuthService.verifyEmail(token);

  if (!result.success || !result.user || !result.token) {
    const errorMsg = result.error || 'Token verifikasi tidak valid atau telah kedaluwarsa.';
    if (req.accepts('html')) {
      res.status(400).send(renderVerificationResultHtml(false, errorMsg));
      return;
    }
    res.status(400).json({ error: errorMsg });
    return;
  }

  if (req.accepts('html')) {
    res.send(renderVerificationResultHtml(true, 'Alamat email Anda berhasil diverifikasi!', result.token, result.user.name));
    return;
  }

  res.json({
    success: true,
    message: 'Email berhasil diverifikasi. Akun Anda telah aktif.',
    token: result.token,
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      is_verified: true,
      verification_status: 'verified',
    },
  });
});

/**
 * Verifies email via POST (programmatic verification from UI)
 */
authRouter.post('/verify-email', (req, res) => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ error: 'Token verifikasi wajib disertakan.' });
    return;
  }

  const result = AuthService.verifyEmail(token);
  if (!result.success || !result.user || !result.token) {
    res.status(400).json({ error: result.error || 'Token tidak valid atau telah kedaluwarsa.' });
    return;
  }

  res.json({
    success: true,
    message: 'Email berhasil diverifikasi. Akun Anda telah aktif.',
    token: result.token,
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      is_verified: true,
      verification_status: 'verified',
    },
  });
});

/**
 * Resends verification email for a registered user pending verification
 */
authRouter.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Alamat email wajib diisi.' });
      return;
    }

    const baseUrl = getBaseUrl(req);
    const result = await AuthService.resendVerification(email, baseUrl);

    res.json({
      success: true,
      message: result.message,
      verificationUrl: result.verificationUrl,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const preferences = db.getUserPreferences(user.id);
  const watchlist = db.getUserWatchlist(user.id);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_verified: user.is_verified,
      verification_status: user.verification_status,
      avatar_url: user.avatar_url,
      plan: user.plan || (user.role === 'ADMIN' ? 'INSTITUTIONAL' : 'FREE'),
      subscription_status: user.subscription_status || 'active',
      subscription_expires_at: user.subscription_expires_at,
    },
    preferences,
    watchlist,
  });
});

authRouter.patch('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { name, avatar_url } = req.body;
  const updated = db.updateUser(user.id, { name, avatar_url });
  res.json({ user: updated });
});

authRouter.put('/preferences', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { timezone, language, theme, default_market_view, density, audio_alerts } = req.body;
  const prefs = db.upsertUserPreferences({
    user_id: user.id,
    timezone: timezone || 'UTC',
    language: language || 'en',
    theme: theme || 'dark',
    default_market_view: default_market_view || 'XAUUSD',
    density: density || 'compact',
    audio_alerts: Boolean(audio_alerts),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  res.json({ preferences: prefs });
});

authRouter.post('/password-reset', (_req, res) => {
  res.status(501).json({
    error: 'Password reset belum tersedia. Hubungi admin untuk reset manual.',
  });
});

function renderVerificationResultHtml(success: boolean, message: string, token?: string, userName?: string): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${success ? 'Email Terverifikasi' : 'Verifikasi Gagal'} • ArahMarket</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #020617;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background-color: #0f172a;
      border: 1px solid ${success ? '#06b6d4' : '#ef4444'};
      border-radius: 16px;
      padding: 36px 32px;
      max-width: 480px;
      width: 90%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .icon {
      width: 60px;
      height: 60px;
      margin: 0 auto 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      background-color: ${success ? 'rgba(6, 182, 212, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
      color: ${success ? '#06b6d4' : '#ef4444'};
    }
    h1 {
      font-size: 22px;
      margin: 0 0 12px;
      font-weight: 700;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 28px;
    }
    .btn {
      display: inline-block;
      background-color: ${success ? '#06b6d4' : '#334155'};
      color: ${success ? '#020617' : '#f8fafc'};
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 12px 28px;
      border-radius: 8px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? '✓' : '✕'}</div>
    <h1>${success ? 'Verifikasi Berhasil' : 'Verifikasi Gagal'}</h1>
    <p>${message}</p>
    <a href="/" id="action-btn" class="btn">${success ? 'Buka Terminal Trading' : 'Kembali ke Beranda'}</a>
  </div>
  ${
    success && token
      ? `
  <script>
    try {
      localStorage.setItem('auth_token', ${JSON.stringify(token)});
      setTimeout(function() {
        window.location.href = '/';
      }, 1800);
    } catch(e) {}
  </script>
  `
      : ''
  }
</body>
</html>
  `.trim();
}
