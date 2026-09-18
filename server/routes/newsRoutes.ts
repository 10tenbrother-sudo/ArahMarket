import { Router } from 'express';
import { db } from '../db/database.js';

export const newsRouter = Router();

// GET news with filters
newsRouter.get('/', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  const category = req.query.category as string | undefined;

  const news = db.getAllNews(limit, offset, category);
  res.json({
    news,
    count: news.length,
    timestamp: new Date().toISOString(),
  });
});

// GET macro news only
newsRouter.get('/macro', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 30;
  const news = db.getAllNews(limit, 0, 'MACRO');
  res.json({ news, count: news.length });
});

// GET micro news only
newsRouter.get('/micro', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 30;
  const news = db.getAllNews(limit, 0, 'MICRO');
  res.json({ news, count: news.length });
});

// GET news by event id
newsRouter.get('/event/:id', (req, res) => {
  const eventId = req.params.id;
  const news = db.getNewsByEventId(eventId);
  res.json({ news, count: news.length, event_id: eventId });
});

// GET single news item
newsRouter.get('/:id', (req, res) => {
  const item = db.getNewsById(req.params.id);
  if (!item) {
    res.status(404).json({ error: 'News item not found.' });
    return;
  }
  const event = item.event_id ? db.getEventById(item.event_id) : null;
  res.json({ news: item, linked_event: event });
});
