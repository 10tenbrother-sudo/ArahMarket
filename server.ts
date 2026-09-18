import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

import { seedDatabase } from './server/db/seed.js';
import { authRouter } from './server/routes/authRoutes.js';
import { marketRouter } from './server/routes/marketRoutes.js';
import { newsRouter } from './server/routes/newsRoutes.js';
import { eventRouter } from './server/routes/eventRoutes.js';
import { currencyRouter } from './server/routes/currencyRoutes.js';
import { macroRouter } from './server/routes/macroRoutes.js';
import { intelligenceRouter } from './server/routes/intelligenceRoutes.js';
import { userRouter } from './server/routes/userRoutes.js';
import { adminRouter } from './server/routes/adminRoutes.js';
import { streamRouter } from './server/routes/streamRoutes.js';

import { MarketDataService } from './server/ingestion/marketData.js';
import { TelegramIngestionService } from './server/ingestion/telegram.js';
import { CurrencyStrengthService } from './server/ingestion/currencyStrength.js';
import { MacroDataService } from './server/ingestion/macroData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Core middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logger for diagnostic tracing
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        if (res.statusCode >= 400) {
          console.warn(`[HTTP] ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
        }
      });
    }
    next();
  });

  // 1. Mount API Routes FIRST
  app.use('/api/auth', authRouter);
  app.use('/api/markets', marketRouter);
  app.use('/api/news', newsRouter);
  app.use('/api/events', eventRouter);
  app.use('/api/currency-strength', currencyRouter);
  app.use('/api/macro', macroRouter);
  app.use('/api/intelligence', intelligenceRouter);
  app.use('/api/user', userRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/stream', streamRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Market Intelligence Platform API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // 2. Initialize Seed & Baseline Ingestion
  try {
    seedDatabase();
    console.log('[System] Database seeded and initialized.');

    // Run initial ingestion routines asynchronously without blocking server boot
    setTimeout(async () => {
      console.log('[System] Launching initial real-time data synchronization pass...');
      try {
        await Promise.allSettled([
          MarketDataService.updateMarketPrices(),
          MacroDataService.fetchEconomicCalendar(),
          CurrencyStrengthService.fetchLiveStrength(),
          TelegramIngestionService.runAllChannels(),
        ]);
        console.log('[System] Initial real-time data synchronization complete.');
      } catch (e: any) {
        console.warn('[System] Initial sync notice:', e.message);
      }
    }, 500);

    // Schedule background periodic ingestion
    // High-frequency real market data ticks (every 10 seconds)
    setInterval(() => {
      MarketDataService.updateMarketPrices().catch(err => {
        console.warn('[Scheduler] Market tick notice:', err.message);
      });
    }, 10000);

    // Telegram channels scraper (every 60 seconds)
    setInterval(() => {
      TelegramIngestionService.runAllChannels().catch(err => {
        console.warn('[Scheduler] Telegram scrape notice:', err.message);
      });
    }, 60000);

    // Currency strength refresh (every 45 seconds)
    setInterval(() => {
      CurrencyStrengthService.fetchLiveStrength().catch(err => {
        console.warn('[Scheduler] Currency strength notice:', err.message);
      });
    }, 45000);

    // Economic calendar live refresh (every 60 seconds)
    setInterval(() => {
      MacroDataService.fetchEconomicCalendar().catch(err => {
        console.warn('[Scheduler] Macro calendar notice:', err.message);
      });
    }, 60000);
  } catch (err: any) {
    console.error('[System] Error during server initialization:', err);
  }

  // 3. Vite Middleware (SPA handling)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Real-Time Market Intelligence Platform listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
