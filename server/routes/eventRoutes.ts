import { Router } from 'express';
import { db } from '../db/database.js';
import { analyzeMarketEventWithGemini } from '../intelligence/gemini.js';

export const eventRouter = Router();

// GET all canonical market events
eventRouter.get('/', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 30;
  const offset = parseInt(req.query.offset as string) || 0;
  const events = db.getAllEvents(limit, offset);

  res.json({
    events,
    count: events.length,
    timestamp: new Date().toISOString(),
  });
});

// GET full single event detail (ONE EVENT -> ONE EVENT ID -> MULTIPLE SOURCES -> MULTIPLE ASSETS -> ONE ANALYSIS)
eventRouter.get('/:id', async (req, res) => {
  const eventId = req.params.id;
  const event = db.getEventById(eventId);
  if (!event) {
    res.status(404).json({ error: `Event [${eventId}] not found.` });
    return;
  }

  // 1. Fetch all linked sources
  const sources = db.getEventSources(eventId);
  // Sort timeline chronologically (oldest to newest)
  const timeline = sources.slice().sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime());

  // 2. Fetch live relevant market prices
  const allPrices = db.getAllMarketPrices();
  const relevantPrices = allPrices.filter(p =>
    event.affected_assets.includes(p.symbol) || event.affected_currencies.includes(p.symbol)
  );

  // 3. Fetch live relevant currency strengths
  const allStrengths = db.getCurrencyStrength();
  const relevantStrengths = allStrengths.filter(s =>
    event.affected_currencies.includes(s.currency)
  );

  // 4. Fetch or generate consolidated AI Analysis
  let aiAnalysis = db.getAIAnalysisForEvent(eventId);
  if (!aiAnalysis) {
    try {
      aiAnalysis = await analyzeMarketEventWithGemini(event);
    } catch (err: any) {
      console.warn(`[Event] AI analysis generation on read: ${err.message}`);
    }
  }

  res.json({
    event,
    sources,
    timeline,
    affected_markets: relevantPrices,
    affected_currencies: relevantStrengths,
    ai_analysis: aiAnalysis,
    timestamp: new Date().toISOString(),
  });
});

// POST trigger re-analysis of single event with Gemini
eventRouter.post('/:id/analyze', async (req, res) => {
  const eventId = req.params.id;
  const event = db.getEventById(eventId);
  if (!event) {
    res.status(404).json({ error: 'Event not found.' });
    return;
  }

  try {
    const analysis = await analyzeMarketEventWithGemini(event);
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
