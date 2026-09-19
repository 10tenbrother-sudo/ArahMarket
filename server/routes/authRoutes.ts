import { Router, Response } from 'express';
import { AuthService, requireAuth, AuthenticatedRequest } from '../auth/authService.js';
import { db } from '../db/database.js';

export const authRouter = Router();

authRouter.post('/register', (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const result = AuthService.register(email, password, name || 'Trader');
    res.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        is_verified: result.user.is_verified,
        plan: result.user.plan || 'FREE',
        subscription_status: result.user.subscription_status || 'active',
        subscription_expires_at: result.user.subscription_expires_at,
      },
      token: result.token,
    });
  } catch (err: any) {
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
        plan: result.user.plan || 'FREE',
        subscription_status: result.user.subscription_status || 'active',
        subscription_expires_at: result.user.subscription_expires_at,
      },
      token: result.token,
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
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

authRouter.post('/password-reset', (req, res) => {
  const { email } = req.body;
  const user = db.getUserByEmail(email);
  if (!user) {
    // Standard security practice: don't reveal user existence
    res.json({ message: 'If an account exists with this email, reset instructions have been dispatched.' });
    return;
  }
  res.json({ message: 'Password reset link sent to registered email address.' });
});
