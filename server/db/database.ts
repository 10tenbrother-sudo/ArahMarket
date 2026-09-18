/**
 * Relational Database Engine for Market Intelligence Platform
 * Provides strict normalization, foreign key integrity, secondary indices,
 * atomic persistence, and relational query helpers.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  User,
  UserPreferences,
  UserWatchlist,
  UserAlert,
  Source,
  TelegramChannel,
  NewsItem,
  MarketEvent,
  EventSource,
  MarketPrice,
  CurrencyStrength,
  CurrencyStrengthHistory,
  EconomicEvent,
  MarketTheme,
  AIAnalysis,
} from '../types.js';
import { MacroEnricher } from '../intelligence/enrichment.js';

interface DatabaseSchema {
  users: User[];
  user_preferences: UserPreferences[];
  user_watchlists: UserWatchlist[];
  user_alerts: UserAlert[];
  sources: Source[];
  telegram_channels: TelegramChannel[];
  news: NewsItem[];
  events: MarketEvent[];
  event_sources: EventSource[];
  event_assets: Array<{ id: string; event_id: string; asset_symbol: string; correlation_rationale: string }>;
  event_currencies: Array<{ id: string; event_id: string; currency_code: string; impact_direction: string }>;
  market_prices: MarketPrice[];
  currency_strength: CurrencyStrength[];
  currency_strength_history: CurrencyStrengthHistory[];
  economic_events: EconomicEvent[];
  market_themes: MarketTheme[];
  ai_analysis: AIAnalysis[];
}

export class RelationalDatabase {
  private data: DatabaseSchema;
  private filePath: string;
  private saveTimeout: NodeJS.Timeout | null = null;
  private isSaving = false;

  // Secondary indexes for ultra-fast lookup
  private indexes = {
    usersByEmail: new Map<string, User>(),
    usersById: new Map<string, User>(),
    sourcesById: new Map<string, Source>(),
    telegramByHandle: new Map<string, TelegramChannel>(),
    newsById: new Map<string, NewsItem>(),
    newsByEventId: new Map<string, NewsItem[]>(),
    eventsById: new Map<string, MarketEvent>(),
    eventSourcesByEventId: new Map<string, EventSource[]>(),
    pricesBySymbol: new Map<string, MarketPrice>(),
    currencyStrengthByCode: new Map<string, CurrencyStrength>(),
  };

  constructor(filePath?: string) {
    this.filePath = filePath || path.join(process.cwd(), 'data', 'market_intelligence.db.json');
    this.data = this.initializeEmptySchema();
    this.load();
    this.rebuildIndexes();
  }

  private initializeEmptySchema(): DatabaseSchema {
    return {
      users: [],
      user_preferences: [],
      user_watchlists: [],
      user_alerts: [],
      sources: [],
      telegram_channels: [],
      news: [],
      events: [],
      event_sources: [],
      event_assets: [],
      event_currencies: [],
      market_prices: [],
      currency_strength: [],
      currency_strength_history: [],
      economic_events: [],
      market_themes: [],
      ai_analysis: [],
    };
  }

  private load(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = { ...this.initializeEmptySchema(), ...parsed };
      }
    } catch (err) {
      console.error('[DB] Error loading database file, initializing clean state:', err);
      this.data = this.initializeEmptySchema();
    }
  }

  public saveSync(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tempPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('[DB] Error saving database:', err);
    }
  }

  public scheduleSave(): void {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      this.saveSync();
    }, 100);
  }

  public rebuildIndexes(): void {
    this.indexes.usersByEmail.clear();
    this.indexes.usersById.clear();
    this.indexes.sourcesById.clear();
    this.indexes.telegramByHandle.clear();
    this.indexes.newsById.clear();
    this.indexes.newsByEventId.clear();
    this.indexes.eventsById.clear();
    this.indexes.eventSourcesByEventId.clear();
    this.indexes.pricesBySymbol.clear();
    this.indexes.currencyStrengthByCode.clear();

    for (const u of this.data.users) {
      this.indexes.usersByEmail.set(u.email.toLowerCase(), u);
      this.indexes.usersById.set(u.id, u);
    }

    for (const s of this.data.sources) {
      this.indexes.sourcesById.set(s.id, s);
    }

    for (const t of this.data.telegram_channels) {
      this.indexes.telegramByHandle.set(t.handle.toLowerCase(), t);
    }

    for (const n of this.data.news) {
      this.indexes.newsById.set(n.id, n);
      if (n.event_id) {
        const list = this.indexes.newsByEventId.get(n.event_id) || [];
        list.push(n);
        this.indexes.newsByEventId.set(n.event_id, list);
      }
    }

    for (const e of this.data.events) {
      this.indexes.eventsById.set(e.id, e);
    }

    for (const es of this.data.event_sources) {
      const list = this.indexes.eventSourcesByEventId.get(es.event_id) || [];
      list.push(es);
      this.indexes.eventSourcesByEventId.set(es.event_id, list);
    }

    for (const p of this.data.market_prices) {
      this.indexes.pricesBySymbol.set(p.symbol.toUpperCase(), p);
    }

    for (const cs of this.data.currency_strength) {
      this.indexes.currencyStrengthByCode.set(cs.currency.toUpperCase(), cs);
    }
  }

  // ==================== USERS & PREFERENCES ====================
  public getUserByEmail(email: string): User | undefined {
    return this.indexes.usersByEmail.get(email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.indexes.usersById.get(id);
  }

  public insertUser(user: User): User {
    this.data.users.push(user);
    this.indexes.usersByEmail.set(user.email.toLowerCase(), user);
    this.indexes.usersById.set(user.id, user);
    this.scheduleSave();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const user = this.indexes.usersById.get(id);
    if (!user) return null;
    Object.assign(user, updates, { updated_at: new Date().toISOString() });
    this.indexes.usersByEmail.set(user.email.toLowerCase(), user);
    this.scheduleSave();
    return user;
  }

  public getUserPreferences(userId: string): UserPreferences | undefined {
    return this.data.user_preferences.find(p => p.user_id === userId);
  }

  public upsertUserPreferences(pref: UserPreferences): UserPreferences {
    const idx = this.data.user_preferences.findIndex(p => p.user_id === pref.user_id);
    if (idx >= 0) {
      this.data.user_preferences[idx] = { ...pref, updated_at: new Date().toISOString() };
    } else {
      this.data.user_preferences.push(pref);
    }
    this.scheduleSave();
    return pref;
  }

  public getUserWatchlist(userId: string): UserWatchlist[] {
    return this.data.user_watchlists.filter(w => w.user_id === userId);
  }

  public addToWatchlist(item: UserWatchlist): UserWatchlist {
    const exists = this.data.user_watchlists.find(
      w => w.user_id === item.user_id && w.symbol === item.symbol
    );
    if (!exists) {
      this.data.user_watchlists.push(item);
      this.scheduleSave();
    }
    return item;
  }

  public removeFromWatchlist(userId: string, symbol: string): boolean {
    const initialLen = this.data.user_watchlists.length;
    this.data.user_watchlists = this.data.user_watchlists.filter(
      w => !(w.user_id === userId && w.symbol === symbol)
    );
    if (this.data.user_watchlists.length !== initialLen) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  // ==================== SOURCES & TELEGRAM ====================
  public getAllSources(): Source[] {
    return [...this.data.sources];
  }

  public getSourceById(id: string): Source | undefined {
    return this.indexes.sourcesById.get(id);
  }

  public upsertSource(source: Source): Source {
    const idx = this.data.sources.findIndex(s => s.id === source.id);
    if (idx >= 0) {
      this.data.sources[idx] = { ...this.data.sources[idx], ...source, updated_at: new Date().toISOString() };
      this.indexes.sourcesById.set(source.id, this.data.sources[idx]);
    } else {
      this.data.sources.push(source);
      this.indexes.sourcesById.set(source.id, source);
    }
    this.scheduleSave();
    return source;
  }

  public updateSourceStatus(id: string, status: Source['status'], errorMsg: string | null = null): void {
    const src = this.indexes.sourcesById.get(id);
    if (src) {
      src.status = status;
      src.updated_at = new Date().toISOString();
      if (status === 'LIVE' || status === 'RECENT') {
        src.last_success_at = new Date().toISOString();
      } else if (status === 'ERROR') {
        src.last_error_at = new Date().toISOString();
        src.last_error_message = errorMsg;
        src.error_count += 1;
      }
      this.scheduleSave();
    }
  }

  public getAllTelegramChannels(): TelegramChannel[] {
    return [...this.data.telegram_channels];
  }

  public getTelegramChannel(handle: string): TelegramChannel | undefined {
    return this.indexes.telegramByHandle.get(handle.toLowerCase());
  }

  public upsertTelegramChannel(channel: TelegramChannel): TelegramChannel {
    const idx = this.data.telegram_channels.findIndex(c => c.handle.toLowerCase() === channel.handle.toLowerCase());
    if (idx >= 0) {
      this.data.telegram_channels[idx] = { ...this.data.telegram_channels[idx], ...channel, updated_at: new Date().toISOString() };
      this.indexes.telegramByHandle.set(channel.handle.toLowerCase(), this.data.telegram_channels[idx]);
    } else {
      this.data.telegram_channels.push(channel);
      this.indexes.telegramByHandle.set(channel.handle.toLowerCase(), channel);
    }
    this.scheduleSave();
    return channel;
  }

  public deleteTelegramChannel(handle: string): boolean {
    const initialLen = this.data.telegram_channels.length;
    this.data.telegram_channels = this.data.telegram_channels.filter(
      c => c.handle.toLowerCase() !== handle.toLowerCase()
    );
    this.indexes.telegramByHandle.delete(handle.toLowerCase());
    if (this.data.telegram_channels.length !== initialLen) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  // ==================== NEWS & ARTICLES ====================
  public getAllNews(limit = 100, offset = 0, category?: string): NewsItem[] {
    let list = this.data.news;
    if (category) {
      list = list.filter(n => n.category.toUpperCase() === category.toUpperCase());
    }
    return list
      .slice()
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice(offset, offset + limit);
  }

  public getNewsById(id: string): NewsItem | undefined {
    return this.indexes.newsById.get(id);
  }

  public getNewsByEventId(eventId: string): NewsItem[] {
    return this.indexes.newsByEventId.get(eventId) || [];
  }

  public insertNewsItem(item: NewsItem): NewsItem {
    this.data.news.unshift(item);
    this.indexes.newsById.set(item.id, item);
    if (item.event_id) {
      const list = this.indexes.newsByEventId.get(item.event_id) || [];
      list.push(item);
      this.indexes.newsByEventId.set(item.event_id, list);
    }
    this.scheduleSave();
    return item;
  }

  public updateNewsItem(id: string, updates: Partial<NewsItem>): NewsItem | null {
    const item = this.indexes.newsById.get(id);
    if (!item) return null;
    Object.assign(item, updates, { updated_at: new Date().toISOString() });
    this.scheduleSave();
    return item;
  }

  // ==================== EVENTS (ONE SOURCE OF TRUTH) ====================
  public getAllEvents(limit = 50, offset = 0): MarketEvent[] {
    return this.data.events
      .slice()
      .sort((a, b) => new Date(b.last_updated_at).getTime() - new Date(a.last_updated_at).getTime())
      .slice(offset, offset + limit);
  }

  public getEventById(id: string): MarketEvent | undefined {
    return this.indexes.eventsById.get(id);
  }

  public insertEvent(event: MarketEvent): MarketEvent {
    this.data.events.unshift(event);
    this.indexes.eventsById.set(event.id, event);
    this.scheduleSave();
    return event;
  }

  public updateEvent(id: string, updates: Partial<MarketEvent>): MarketEvent | null {
    const ev = this.indexes.eventsById.get(id);
    if (!ev) return null;
    Object.assign(ev, updates, { last_updated_at: new Date().toISOString() });
    this.scheduleSave();
    return ev;
  }

  public addEventSource(sourceRecord: EventSource): void {
    this.data.event_sources.push(sourceRecord);
    const list = this.indexes.eventSourcesByEventId.get(sourceRecord.event_id) || [];
    list.push(sourceRecord);
    this.indexes.eventSourcesByEventId.set(sourceRecord.event_id, list);
    this.scheduleSave();
  }

  public getEventSources(eventId: string): EventSource[] {
    return this.indexes.eventSourcesByEventId.get(eventId) || [];
  }

  // ==================== MARKET PRICES ====================
  public getAllMarketPrices(): MarketPrice[] {
    return [...this.data.market_prices];
  }

  public getMarketPrice(symbol: string): MarketPrice | undefined {
    return this.indexes.pricesBySymbol.get(symbol.toUpperCase());
  }

  public upsertMarketPrice(price: MarketPrice): void {
    const sym = price.symbol.toUpperCase();
    const idx = this.data.market_prices.findIndex(p => p.symbol.toUpperCase() === sym);
    if (idx >= 0) {
      this.data.market_prices[idx] = { ...this.data.market_prices[idx], ...price, last_updated: new Date().toISOString() };
      this.indexes.pricesBySymbol.set(sym, this.data.market_prices[idx]);
    } else {
      this.data.market_prices.push(price);
      this.indexes.pricesBySymbol.set(sym, price);
    }
    this.scheduleSave();
  }

  // ==================== CURRENCY STRENGTH ====================
  public getCurrencyStrength(): CurrencyStrength[] {
    return [...this.data.currency_strength].sort((a, b) => b.strength_score - a.strength_score);
  }

  public setCurrencyStrength(list: CurrencyStrength[]): void {
    this.data.currency_strength = list;
    const now = new Date().toISOString();
    for (const item of list) {
      this.indexes.currencyStrengthByCode.set(item.currency.toUpperCase(), item);
      this.data.currency_strength_history.push({
        id: `csh_${Date.now()}_${item.currency}`,
        currency: item.currency,
        strength_score: item.strength_score,
        timestamp: now,
      });
    }
    // Trim history to prevent unbounded growth
    if (this.data.currency_strength_history.length > 500) {
      this.data.currency_strength_history = this.data.currency_strength_history.slice(-500);
    }
    this.scheduleSave();
  }

  public getCurrencyStrengthHistory(currency?: string): CurrencyStrengthHistory[] {
    if (currency) {
      return this.data.currency_strength_history.filter(h => h.currency.toUpperCase() === currency.toUpperCase());
    }
    return this.data.currency_strength_history;
  }

  // ==================== MACRO & ECONOMIC CALENDAR ====================
  public getEconomicEvents(
    limit = 200,
    filter?: { status?: 'UPCOMING' | 'RELEASED' | 'ALL'; currency?: string }
  ): EconomicEvent[] {
    const nowMs = Date.now();
    const past24hMs = nowMs - 24 * 3600000;

    let all = this.data.economic_events.slice();

    // Re-verify status relative to current timestamp
    all = all.map(e => {
      const eventTime = new Date(e.date_time_utc).getTime();
      const isPast = eventTime < nowMs;
      const status: EconomicEvent['status'] =
        (e.actual !== null && e.actual !== undefined && e.actual !== '') || isPast
          ? 'RELEASED'
          : 'UPCOMING';
      return { ...e, status };
    });

    if (filter?.currency && filter.currency !== 'ALL') {
      all = all.filter(e => e.currency === filter.currency);
    }

    if (filter?.status === 'UPCOMING') {
      return all
        .filter(e => e.status === 'UPCOMING' || new Date(e.date_time_utc).getTime() >= nowMs)
        .sort((a, b) => new Date(a.date_time_utc).getTime() - new Date(b.date_time_utc).getTime())
        .slice(0, limit)
        .map(e => MacroEnricher.enrichEconomicEvent(e, nowMs));
    }

    if (filter?.status === 'RELEASED') {
      return all
        .filter(e => e.status === 'RELEASED' && new Date(e.date_time_utc).getTime() < nowMs)
        .sort((a, b) => new Date(b.date_time_utc).getTime() - new Date(a.date_time_utc).getTime())
        .slice(0, limit)
        .map(e => MacroEnricher.enrichEconomicEvent(e, nowMs));
    }

    // Default ALL:
    // Strongly prioritize UPCOMING events (so they are never crowded out),
    // combined with recent releases from today/past 24h.
    const upcoming = all
      .filter(e => new Date(e.date_time_utc).getTime() >= nowMs)
      .sort((a, b) => new Date(a.date_time_utc).getTime() - new Date(b.date_time_utc).getTime());

    const recentPast = all
      .filter(e => new Date(e.date_time_utc).getTime() >= past24hMs && new Date(e.date_time_utc).getTime() < nowMs)
      .sort((a, b) => new Date(a.date_time_utc).getTime() - new Date(b.date_time_utc).getTime());

    const olderPast = all
      .filter(e => new Date(e.date_time_utc).getTime() < past24hMs)
      .sort((a, b) => new Date(b.date_time_utc).getTime() - new Date(a.date_time_utc).getTime());

    // Keep all or majority of upcoming events (e.g. up to 100)
    const upcomingToTake = upcoming.slice(0, Math.min(upcoming.length, 120));
    const remainingSlots = Math.max(20, limit - upcomingToTake.length);
    const pastToTake = recentPast.slice(-remainingSlots);

    const merged = [...pastToTake, ...upcomingToTake];
    if (merged.length < limit && olderPast.length > 0) {
      const extraNeeded = limit - merged.length;
      const extraPast = olderPast.slice(0, extraNeeded).reverse();
      return [...extraPast, ...merged]
        .sort((a, b) => new Date(a.date_time_utc).getTime() - new Date(b.date_time_utc).getTime())
        .map(e => MacroEnricher.enrichEconomicEvent(e, nowMs));
    }

    return merged
      .sort((a, b) => new Date(a.date_time_utc).getTime() - new Date(b.date_time_utc).getTime())
      .map(e => MacroEnricher.enrichEconomicEvent(e, nowMs));
  }

  public setEconomicEvents(events: EconomicEvent[]): void {
    this.data.economic_events = events;
    this.saveSync();
  }

  public upsertEconomicEvent(event: EconomicEvent): void {
    const idx = this.data.economic_events.findIndex(e => e.id === event.id);
    if (idx >= 0) {
      this.data.economic_events[idx] = { ...this.data.economic_events[idx], ...event };
    } else {
      this.data.economic_events.push(event);
    }
    this.scheduleSave();
  }

  // ==================== MARKET THEMES & INTELLIGENCE ====================
  public getMarketThemes(): MarketTheme[] {
    return [...this.data.market_themes];
  }

  public upsertMarketTheme(theme: MarketTheme): void {
    const idx = this.data.market_themes.findIndex(t => t.id === theme.id);
    if (idx >= 0) {
      this.data.market_themes[idx] = theme;
    } else {
      this.data.market_themes.push(theme);
    }
    this.scheduleSave();
  }

  public getAIAnalysisForEvent(eventId: string): AIAnalysis | undefined {
    return this.data.ai_analysis.find(a => a.event_id === eventId);
  }

  public upsertAIAnalysis(analysis: AIAnalysis): void {
    const idx = this.data.ai_analysis.findIndex(a => a.id === analysis.id);
    if (idx >= 0) {
      this.data.ai_analysis[idx] = analysis;
    } else {
      this.data.ai_analysis.unshift(analysis);
    }
    this.scheduleSave();
  }

  public getLatestMarketOverviewAnalysis(): AIAnalysis | undefined {
    return this.data.ai_analysis.find(a => a.analysis_type === 'MARKET_OVERVIEW');
  }

  // ==================== SYSTEM HEALTH ====================
  public getDatabaseStats() {
    return {
      users_count: this.data.users.length,
      sources_count: this.data.sources.length,
      telegram_channels_count: this.data.telegram_channels.length,
      news_count: this.data.news.length,
      events_count: this.data.events.length,
      event_sources_count: this.data.event_sources.length,
      prices_count: this.data.market_prices.length,
      currency_strength_count: this.data.currency_strength.length,
      economic_events_count: this.data.economic_events.length,
      themes_count: this.data.market_themes.length,
      ai_analysis_count: this.data.ai_analysis.length,
    };
  }
}

// Global Singleton Instance
export const db = new RelationalDatabase();
