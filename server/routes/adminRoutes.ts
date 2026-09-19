import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { TelegramChannel, Source } from '../types.js';
import { TelegramIngestionService } from '../ingestion/telegram.js';
import { MarketDataService } from '../ingestion/marketData.js';
import { CurrencyStrengthService } from '../ingestion/currencyStrength.js';
import { MacroDataService } from '../ingestion/macroData.js';
import { processNewsThroughPipeline } from '../ingestion/pipeline.js';
import { sseBroker } from '../realtime/sse.js';
import { requireAdmin, AuthenticatedRequest } from '../auth/authService.js';

export const adminRouter = Router();

// Enforce ADMIN role authentication across all admin endpoints
adminRouter.use(requireAdmin as any);

// 1. GET System Health & Database Metrics
adminRouter.get('/system-health', (req, res) => {
  const stats = db.getDatabaseStats();
  const sources = db.getAllSources();
  const errorSources = sources.filter(s => s.status === 'ERROR' || s.error_count > 0);

  res.json({
    uptime_seconds: process.uptime(),
    memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    db_status: 'HEALTHY',
    active_sse_connections: sseBroker.getActiveCount(),
    database_stats: stats,
    sources_summary: {
      total: sources.length,
      live: sources.filter(s => s.status === 'LIVE').length,
      delayed: sources.filter(s => s.status === 'DELAYED').length,
      error: errorSources.length,
    },
    timestamp: new Date().toISOString(),
  });
});

// 2. Sources Management
adminRouter.get('/sources', (req, res) => {
  const sources = db.getAllSources();
  res.json({ sources, count: sources.length });
});

adminRouter.patch('/sources/:id', (req, res) => {
  const { id } = req.params;
  const { is_enabled, status } = req.body;
  const src = db.getSourceById(id);
  if (!src) {
    res.status(404).json({ error: 'Source not found.' });
    return;
  }
  const updated = db.upsertSource({
    ...src,
    is_enabled: is_enabled !== undefined ? Boolean(is_enabled) : src.is_enabled,
    status: status || src.status,
  });
  res.json({ success: true, source: updated });
});

// 3. Telegram Channels Management
adminRouter.get('/telegram', (req, res) => {
  const channels = db.getAllTelegramChannels();
  res.json({ channels, count: channels.length });
});

adminRouter.post('/telegram', (req, res) => {
  const { handle, title, language } = req.body;
  if (!handle) {
    res.status(400).json({ error: 'Telegram channel handle (e.g. @channel_name) is required.' });
    return;
  }

  const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
  const existing = db.getTelegramChannel(cleanHandle);
  if (existing) {
    res.status(400).json({ error: `Channel ${cleanHandle} already registered.` });
    return;
  }

  // Also create linked Source record
  const sourceId = `src_tg_${cleanHandle.replace('@', '').toLowerCase()}`;
  db.upsertSource({
    id: sourceId,
    name: title || `Telegram: ${cleanHandle}`,
    type: 'TELEGRAM',
    endpoint_url: `https://t.me/s/${cleanHandle.replace('@', '')}`,
    is_enabled: true,
    status: 'LIVE',
    last_success_at: new Date().toISOString(),
    last_error_at: null,
    last_error_message: null,
    error_count: 0,
    interval_seconds: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const newChannel: TelegramChannel = {
    id: `tg_${Date.now()}`,
    handle: cleanHandle,
    title: title || cleanHandle,
    source_id: sourceId,
    is_enabled: true,
    language: language || 'en',
    last_ingested_at: null,
    status: 'LIVE',
    error_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.upsertTelegramChannel(newChannel);
  res.json({ success: true, channel: newChannel });
});

adminRouter.patch('/telegram/:handle', (req, res) => {
  const cleanHandle = req.params.handle.startsWith('@') ? req.params.handle : `@${req.params.handle}`;
  const channel = db.getTelegramChannel(cleanHandle);
  if (!channel) {
    res.status(404).json({ error: 'Telegram channel not found.' });
    return;
  }

  const { is_enabled, title, language } = req.body;
  const updated = db.upsertTelegramChannel({
    ...channel,
    is_enabled: is_enabled !== undefined ? Boolean(is_enabled) : channel.is_enabled,
    title: title || channel.title,
    language: language || channel.language,
  });

  res.json({ success: true, channel: updated });
});

adminRouter.delete('/telegram/:handle', (req, res) => {
  const cleanHandle = req.params.handle.startsWith('@') ? req.params.handle : `@${req.params.handle}`;
  const deleted = db.deleteTelegramChannel(cleanHandle);
  res.json({ success: deleted });
});

// Trigger manual scrape of specific channel
adminRouter.post('/telegram/:handle/scrape', async (req, res) => {
  const cleanHandle = req.params.handle.startsWith('@') ? req.params.handle : `@${req.params.handle}`;
  const channel = db.getTelegramChannel(cleanHandle);
  if (!channel) {
    res.status(404).json({ error: 'Channel not found.' });
    return;
  }

  try {
    const result = await TelegramIngestionService.scrapeChannel(channel);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Ingest & Duplicate Inspector
adminRouter.get('/duplicates', (req, res) => {
  const events = db.getAllEvents(50);
  const deduplicatedEvents = events.filter(e => e.source_count > 1 || e.is_duplicate_resolved);

  const report = deduplicatedEvents.map(e => {
    const sources = db.getEventSources(e.id);
    return {
      event_id: e.id,
      title: e.title,
      summary: e.summary,
      source_count: e.source_count,
      languages: Array.from(new Set(sources.map(s => s.language))),
      sources: sources.map(s => ({
        source_name: s.source_name,
        language: s.language,
        original_title: s.original_title,
        matched_reason: s.matched_reason,
        similarity_score: s.similarity_score,
        published_at: s.published_at,
      })),
    };
  });

  res.json({
    total_deduplicated_events: report.length,
    events: report,
    timestamp: new Date().toISOString(),
  });
});

// 5. Manual Ingestion Simulator / Feed Injector (for custom testing & instant verification)
adminRouter.post('/ingest/test-article', async (req, res) => {
  const { title, content, source_name, language } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  try {
    const newsItem = {
      id: `test_${Date.now()}`,
      title,
      content: content || title,
      source_id: 'src_manual_test',
      source_name: source_name || 'Admin Wire Test',
      source_url: 'https://marketintel.pro/internal/wire',
      language: language || 'en',
      published_at: new Date().toISOString(),
      received_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      event_id: null,
      affected_assets: [],
      affected_currencies: [],
      category: 'MACRO' as const,
      status: 'RAW' as const,
    };

    const outcome = await processNewsThroughPipeline(newsItem);
    res.json({
      success: true,
      outcome,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Trigger global ingestion sweep across all systems
adminRouter.post('/ingest/run-all', async (req, res) => {
  try {
    const tgResult = await TelegramIngestionService.runAllChannels();
    const csResult = await CurrencyStrengthService.fetchLiveStrength();
    const mktResult = await MarketDataService.updateMarketPrices();
    const macroResult = await MacroDataService.fetchEconomicCalendar();

    res.json({
      success: true,
      results: {
        telegram: tgResult,
        currency_strength: { count: csResult.length },
        market_prices: { count: mktResult.length },
        macro_calendar: { count: macroResult.length },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. User & Subscription Management (Admin Only)
adminRouter.get('/users', (req: Request, res: Response) => {
  const users = db.getAllUsers().map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    is_verified: u.is_verified,
    plan: u.plan || 'FREE',
    subscription_status: u.subscription_status || 'active',
    subscription_expires_at: u.subscription_expires_at,
    created_at: u.created_at,
    updated_at: u.updated_at,
  }));
  res.json({ users, count: users.length });
});

adminRouter.patch('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, plan, subscription_status } = req.body;

  const target = db.getUserById(id);
  if (!target) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const updates: any = {};
  if (role && ['USER', 'ADMIN'].includes(role)) {
    updates.role = role;
  }
  if (plan && ['FREE', 'PRO', 'INSTITUTIONAL'].includes(plan)) {
    updates.plan = plan;
  }
  if (subscription_status && ['active', 'trialing', 'canceled', 'expired'].includes(subscription_status)) {
    updates.subscription_status = subscription_status;
  }

  const updated = db.updateUser(id, updates);
  res.json({
    success: true,
    user: {
      id: updated?.id,
      email: updated?.email,
      name: updated?.name,
      role: updated?.role,
      is_verified: updated?.is_verified,
      plan: updated?.plan,
      subscription_status: updated?.subscription_status,
      created_at: updated?.created_at,
      updated_at: updated?.updated_at,
    },
  });
});

