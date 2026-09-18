import { Router } from 'express';
import { db } from '../db/database.js';
import { CurrencyStrengthService } from '../ingestion/currencyStrength.js';

export const currencyRouter = Router();

// GET current currency strength table
currencyRouter.get('/', (req, res) => {
  const list = db.getCurrencyStrength();
  res.json({
    currency_strength: list,
    source: 'https://currency-strength.com/en/',
    timestamp: new Date().toISOString(),
  });
});

// GET currency strength history
currencyRouter.get('/history', (req, res) => {
  const currency = req.query.currency as string | undefined;
  const history = db.getCurrencyStrengthHistory(currency);
  res.json({
    history,
    count: history.length,
    timestamp: new Date().toISOString(),
  });
});

// POST refresh currency strength from live provider
currencyRouter.post('/refresh', async (req, res) => {
  try {
    const updated = await CurrencyStrengthService.fetchLiveStrength();
    res.json({
      success: true,
      currency_strength: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
