import { Router } from 'express';
import { db } from '../db/database.js';
import { MacroDataService } from '../ingestion/macroData.js';
import { IntradayMarketMapEngine } from '../intelligence/intradayMarketMap.js';

export const macroRouter = Router();

// GET Today's Key Catalysts
macroRouter.get('/today-catalysts', (req, res) => {
  const catalysts = IntradayMarketMapEngine.getTodayKeyCatalysts();
  res.json({
    catalysts,
    count: catalysts.length,
    timestamp: new Date().toISOString(),
  });
});

// GET economic calendar releases
macroRouter.get('/calendar', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 200;
  const status = (req.query.status as any) || 'ALL';
  const currency = (req.query.currency as string) || 'ALL';

  const events = db.getEconomicEvents(limit, { status, currency });

  const nowMs = Date.now();
  const allEvents = db.getEconomicEvents(300);
  const totalUpcoming = allEvents.filter(
    e => e.status === 'UPCOMING' || new Date(e.date_time_utc).getTime() >= nowMs
  );
  const totalReleased = allEvents.filter(
    e => e.status === 'RELEASED' && new Date(e.date_time_utc).getTime() < nowMs
  );

  const nextUpcoming = totalUpcoming.sort(
    (a, b) => new Date(a.date_time_utc).getTime() - new Date(b.date_time_utc).getTime()
  )[0] || null;

  res.json({
    calendar: events,
    count: events.length,
    upcoming_count: totalUpcoming.length,
    released_count: totalReleased.length,
    next_event: nextUpcoming,
    timestamp: new Date().toISOString(),
  });
});

// Force refresh economic calendar
macroRouter.post('/refresh', async (req, res) => {
  try {
    const updated = await MacroDataService.fetchEconomicCalendar();
    res.json({
      success: true,
      count: updated.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
