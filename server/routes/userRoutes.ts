import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { requireAuth, AuthenticatedRequest } from '../auth/authService.js';
import { UserWatchlist } from '../types.js';

export const userRouter = Router();

// GET watchlist
userRouter.get('/watchlist', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const list = db.getUserWatchlist(userId);
  const prices = db.getAllMarketPrices();

  // Enhance with live prices
  const enhanced = list.map(item => {
    const p = prices.find(x => x.symbol === item.symbol);
    return {
      ...item,
      market_data: p || null,
    };
  });

  res.json({ watchlist: enhanced });
});

// POST add to watchlist
userRouter.post('/watchlist', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { symbol, asset_type, notes } = req.body;
  if (!symbol) {
    res.status(400).json({ error: 'Symbol is required.' });
    return;
  }

  const item: UserWatchlist = {
    id: `wl_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    user_id: userId,
    symbol: symbol.toUpperCase(),
    asset_type: asset_type || 'ASSET',
    notes: notes || '',
    added_at: new Date().toISOString(),
  };

  db.addToWatchlist(item);
  res.json({ success: true, item });
});

// DELETE remove from watchlist
userRouter.delete('/watchlist/:symbol', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const symbol = req.params.symbol.toUpperCase();
  const removed = db.removeFromWatchlist(userId, symbol);
  res.json({ success: removed, symbol });
});

// GET user settings / preferences
userRouter.get('/preferences', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const prefs = db.getUserPreferences(userId);
  res.json({ preferences: prefs });
});

// POST update user subscription plan
userRouter.post('/subscription', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { plan } = req.body;
  if (!['FREE', 'PRO', 'INSTITUTIONAL'].includes(plan)) {
    res.status(400).json({ error: 'Invalid plan selected. Must be FREE, PRO, or INSTITUTIONAL.' });
    return;
  }

  const updated = db.updateUser(userId, {
    plan,
    subscription_status: 'active',
  });

  if (!updated) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  res.json({
    success: true,
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      is_verified: updated.is_verified,
      avatar_url: updated.avatar_url,
      plan: updated.plan,
      subscription_status: updated.subscription_status,
      subscription_expires_at: updated.subscription_expires_at,
    },
  });
});

