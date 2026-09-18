import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MarketPrice,
  CurrencyStrength,
  MarketEvent,
  EconomicEvent,
  AIAnalysis,
  User,
  UserWatchlist,
  IntradayAssetBias,
  TodayCatalyst,
} from './types';
import { api, setAuthToken } from './lib/api';
import { useSSE } from './lib/useSSE';

import { Sidebar, NavTabId } from './components/Sidebar';
import { Header } from './components/Header';
import { TickerBar } from './components/TickerBar';
import { EventCard } from './components/EventCard';
import { EventDetailModal } from './components/EventDetailModal';
import { CurrencyStrengthWidget } from './components/CurrencyStrengthWidget';
import { MarketDataGrid } from './components/MarketDataGrid';
import { MacroCalendarView } from './components/MacroCalendarView';
import { AIIntelligenceView } from './components/AIIntelligenceView';
import { AdminPanel } from './components/AdminPanel';
import { WatchlistView } from './components/WatchlistView';
import { AuthModal } from './components/AuthModal';
import { TradingViewChartModal } from './components/TradingViewChartModal';
import { IntradayMarketMapView } from './components/IntradayMarketMapView';
import { TodayCatalystsView } from './components/TodayCatalystsView';
import { CurrencyPairOpportunityMatrix } from './components/CurrencyPairOpportunityMatrix';
import { PublicLandingPage } from './components/PublicLandingPage';
import { AuthPage } from './components/AuthPage';
import {
  useLocation,
  isPublicRoute,
  isPrivateRoute,
  routeToTab,
  tabToRoute,
} from './lib/router';

import {
  Layers,
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  Radio,
  RefreshCw,
  Compass,
  Zap,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Activity,
  BarChart2,
} from 'lucide-react';

export default function App() {
  // Router Location
  const { path, navigate } = useLocation();
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<NavTabId>(() => routeToTab(path));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile drawer
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop compact
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [chartModalSymbol, setChartModalSymbol] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Core Data Collections (Single Source of Truth)
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [strengths, setStrengths] = useState<CurrencyStrength[]>([]);
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [calendar, setCalendar] = useState<EconomicEvent[]>([]);
  const [overview, setOverview] = useState<AIAnalysis | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [intradayMap, setIntradayMap] = useState<IntradayAssetBias[]>([]);
  const [todayCatalysts, setTodayCatalysts] = useState<TodayCatalyst[]>([]);

  // User State
  const [user, setUser] = useState<User | null>(null);
  const [watchlist, setWatchlist] = useState<UserWatchlist[]>([]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Loading & Sync States
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshingCS, setIsRefreshingCS] = useState(false);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [isRefreshingMacro, setIsRefreshingMacro] = useState(false);
  const [isRefreshingIntraday, setIsRefreshingIntraday] = useState(false);
  const [isRefreshingCatalysts, setIsRefreshingCatalysts] = useState(false);

  // Tab change handler that updates route
  const handleTabChange = useCallback((newTab: NavTabId) => {
    setActiveTab(newTab);
    const targetRoute = tabToRoute(newTab);
    if (targetRoute !== path) {
      navigate(targetRoute);
    }
  }, [navigate, path]);

  // Server-Sent Events (SSE) Real-Time Hook - only enabled when authenticated
  const { status: sseStatus } = useSSE({
    enabled: !!user,
    onMarketPrices: (updatedPrices: MarketPrice[]) => {
      setPrices(updatedPrices);
      // Auto-recalculate Intraday Market Map on live price ticks
      api.getIntradayMarketMap().then(res => setIntradayMap(res.market_map)).catch(() => {});
    },
    onCurrencyStrength: (updatedStrengths: CurrencyStrength[]) => {
      setStrengths(updatedStrengths);
      api.getIntradayMarketMap().then(res => setIntradayMap(res.market_map)).catch(() => {});
    },
    onEventUpdated: (updatedEvent: MarketEvent) => {
      setEvents(prev => {
        const index = prev.findIndex(e => e.id === updatedEvent.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = updatedEvent;
          return next;
        }
        return [updatedEvent, ...prev];
      });
    },
    onEconomicCalendar: (updatedCalendar: EconomicEvent[]) => {
      setCalendar(updatedCalendar);
      api.getTodayCatalysts().then(res => setTodayCatalysts(res.catalysts)).catch(() => {});
    },
  });

  // Initial Data Load for Authenticated Dashboard
  const loadInitialData = useCallback(async () => {
    try {
      setInitialLoading(true);
      const [mktRes, curRes, evtRes, calRes, sesRes, mapRes, catRes] = await Promise.allSettled([
        api.getMarkets(),
        api.getCurrencyStrength(),
        api.getEvents(40),
        api.getEconomicCalendar(200),
        api.getMarketSessions(),
        api.getIntradayMarketMap(),
        api.getTodayCatalysts(),
      ]);

      if (mktRes.status === 'fulfilled') setPrices(mktRes.value.prices);
      if (curRes.status === 'fulfilled') setStrengths(curRes.value.currency_strength);
      if (evtRes.status === 'fulfilled') setEvents(evtRes.value.events);
      if (calRes.status === 'fulfilled') setCalendar(calRes.value.calendar);
      if (sesRes.status === 'fulfilled') setSessions(sesRes.value.sessions);
      if (mapRes.status === 'fulfilled') setIntradayMap(mapRes.value.market_map);
      if (catRes.status === 'fulfilled') setTodayCatalysts(catRes.value.catalysts);
    } catch (err) {
      console.warn('Initialization notice:', err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  // Check current user session on mount
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('nexus_auth_token');
        if (token) {
          const meRes = await api.getMe();
          if (isMounted) {
            setUser(meRes.user);
            setWatchlist(meRes.watchlist || []);
            loadInitialData();
          }
        } else {
          if (isMounted) setUser(null);
        }
      } catch (err) {
        console.warn('Session verification notice:', err);
        setAuthToken(null);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsAuthChecking(false);
      }
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, [loadInitialData]);

  // Route enforcement & sync
  useEffect(() => {
    if (isAuthChecking) return;

    if (!user) {
      // Unauthenticated user attempting to access private route -> redirect to /login
      if (isPrivateRoute(path)) {
        navigate('/login', true);
      }
    } else {
      // Authenticated user
      if (path === '/' || path === '/login' || path === '/register') {
        navigate('/dashboard', true);
      } else if (isPrivateRoute(path)) {
        const expectedTab = routeToTab(path);
        if (expectedTab !== activeTab) {
          setActiveTab(expectedTab);
        }
      }
    }
  }, [user, path, isAuthChecking, navigate, activeTab]);

  // Global Ingestion Trigger
  const handleTriggerGlobalSync = async () => {
    try {
      setIsSyncing(true);
      await api.runGlobalIngest();
      // Refetch all active streams
      const [eRes, cRes, mRes, mapRes, catRes] = await Promise.allSettled([
        api.getEvents(40),
        api.getCurrencyStrength(),
        api.getMarkets(),
        api.getIntradayMarketMap(),
        api.getTodayCatalysts(),
      ]);
      if (eRes.status === 'fulfilled') setEvents(eRes.value.events);
      if (cRes.status === 'fulfilled') setStrengths(cRes.value.currency_strength);
      if (mRes.status === 'fulfilled') setPrices(mRes.value.prices);
      if (mapRes.status === 'fulfilled') setIntradayMap(mapRes.value.market_map);
      if (catRes.status === 'fulfilled') setTodayCatalysts(catRes.value.catalysts);
    } catch (err) {
      console.error('Manual sync notice:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Watchlist Toggle
  const handleToggleWatchlist = async (symbol: string, assetType: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const exists = watchlist.some(w => w.symbol === symbol);
    if (exists) {
      await api.removeFromWatchlist(symbol);
      setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
    } else {
      const res = await api.addToWatchlist(symbol, assetType);
      if (res.item) setWatchlist(prev => [...prev, res.item]);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setWatchlist([]);
    navigate('/login');
  };

  // Filtered Events for Wire
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (categoryFilter !== 'ALL' && e.primary_category !== categoryFilter) return false;
      if (selectedSymbol && !e.affected_assets.includes(selectedSymbol) && !e.affected_currencies.includes(selectedSymbol)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchSummary = e.summary.toLowerCase().includes(q);
        const matchSources = e.source_names.some(s => s.toLowerCase().includes(q));
        const matchAssets = e.affected_assets.some(a => a.toLowerCase().includes(q));
        const matchCurrs = e.affected_currencies.some(c => c.toLowerCase().includes(q));
        return matchTitle || matchSummary || matchSources || matchAssets || matchCurrs;
      }
      return true;
    });
  }, [events, categoryFilter, selectedSymbol, searchQuery]);

  const watchlistSymbols = useMemo(() => watchlist.map(w => w.symbol), [watchlist]);

  // Screen 1: Session Verification
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-mono">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-cyan-500/20 animate-pulse">
            <Layers className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-base font-bold tracking-wider text-slate-100">
            NEXUS <span className="text-cyan-400">TERMINAL</span>
          </span>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Verifying encrypted terminal session...</span>
        </div>
      </div>
    );
  }

  // Screen 2: Unauthenticated Visitor Flow (Public Landing & Auth Pages)
  if (!user) {
    if (path === '/login') {
      return (
        <AuthPage
          mode="login"
          onNavigate={navigate}
          onSuccess={(u) => {
            setUser(u);
            loadInitialData();
            navigate('/dashboard');
          }}
        />
      );
    }

    if (path === '/register') {
      return (
        <AuthPage
          mode="register"
          onNavigate={navigate}
          onSuccess={(u) => {
            setUser(u);
            loadInitialData();
            navigate('/dashboard');
          }}
        />
      );
    }

    // Default Public View for '/', '/features', '/pricing'
    return (
      <PublicLandingPage
        currentPath={path}
        onNavigate={navigate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Global Responsive Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        marketMapCount={intradayMap.length || 13}
        catalystsCount={todayCatalysts.length}
        user={user}
        onOpenAuth={() => navigate('/login')}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          sseStatus={sseStatus}
          sessions={sessions}
          onTriggerGlobalSync={handleTriggerGlobalSync}
          isSyncing={isSyncing}
          onToggleMobileMenu={() => setIsSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Real-time Ticker Bar */}
        <TickerBar
          prices={prices}
          selectedSymbol={selectedSymbol}
          onSelectSymbol={(sym) => {
            setSelectedSymbol(sym === selectedSymbol ? null : sym);
            if (activeTab !== 'terminal') handleTabChange('terminal');
          }}
          onOpenChart={(sym) => setChartModalSymbol(sym)}
        />

        {/* Active Instrument Filter Strip */}
        {selectedSymbol && (
          <div className="bg-cyan-950/70 border-b border-cyan-800/60 px-4 py-1.5 flex items-center justify-between text-xs font-mono text-cyan-300">
            <div className="flex items-center gap-2">
              <span>FILTERED BY INSTRUMENT:</span>
              <strong className="text-white font-bold bg-cyan-900 px-2 py-0.5 rounded">{selectedSymbol}</strong>
              <span className="text-slate-400 hidden sm:inline">Highlighting events and macro correlations</span>
            </div>
            <button
              onClick={() => setSelectedSymbol(null)}
              className="text-cyan-400 hover:text-white underline cursor-pointer"
            >
              Clear Filter ×
            </button>
          </div>
        )}

        {/* 3. Primary Views Workspace */}
        <main className="flex-1 p-3 sm:p-4 max-w-[1720px] w-full mx-auto space-y-4">
          {/* VIEW 1: TERMINAL / OVERVIEW DASHBOARD
              STRICT INFORMATION HIERARCHY PER SPECIFICATION:
              1. TODAY'S INTRADAY MARKET MAP
              2. TODAY'S KEY CATALYSTS
              3. MARKET OVERVIEW
              4. CURRENCY STRENGTH
              5. IMPORTANT NEWS
              6. ECONOMIC CALENDAR
              7. AI MARKET CONTEXT
          */}
          {activeTab === 'terminal' && (
            <div className="space-y-4" id="terminal-overview-dashboard">
              {/* ======================================================== */}
              {/* 1. TODAY'S INTRADAY MARKET MAP (SUMMARY CAROUSEL / STRIP) */}
              {/* ======================================================== */}
              <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3" id="dash-sec-1-market-map">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Compass className="w-4 h-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                        <span>TODAY'S INTRADAY MARKET MAP</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                          13 ASSETS
                        </span>
                      </h2>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Synchronized directional bias: Macro Data + Central Bank Stances + Currency Strength + Yields + Price Action
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTabChange('intraday_map')}
                      className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 transition cursor-pointer"
                    >
                      <span>Full Scanner View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 13-Asset Horizontal Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2">
                  {intradayMap.map(asset => {
                    const isBullish = asset.overall_bias === 'BULLISH';
                    const isBearish = asset.overall_bias === 'BEARISH';
                    const isMixed = asset.overall_bias === 'MIXED';

                    const badgeClass = isBullish
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/70'
                      : isBearish
                      ? 'bg-rose-950/70 text-rose-300 border-rose-800/70'
                      : isMixed
                      ? 'bg-purple-950/70 text-purple-300 border-purple-800/70'
                      : 'bg-amber-950/70 text-amber-300 border-amber-800/70';

                    return (
                      <div
                        key={asset.symbol}
                        onClick={() => {
                          setSelectedSymbol(asset.symbol);
                          handleTabChange('intraday_map');
                        }}
                        className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer flex flex-col justify-between group space-y-1.5"
                      >
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-xs text-slate-100 group-hover:text-cyan-300 transition">
                            {asset.symbol}
                          </span>
                          <span className={`text-[9px] px-1 py-0.2 rounded font-bold border ${badgeClass}`}>
                            {asset.overall_bias}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between font-mono">
                          <span className="text-xs font-semibold text-slate-200">
                            {asset.asset_type === 'COMMODITY' || asset.asset_type === 'CRYPTO' ? '$' : ''}
                            {asset.symbol === 'JPY' || asset.asset_type === 'FOREX'
                              ? asset.price.toFixed(asset.symbol === 'USD' || asset.symbol === 'JPY' ? 2 : 4)
                              : asset.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </span>
                          <span className={`text-[10px] font-bold ${
                            asset.change_24h_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {asset.change_24h_pct >= 0 ? '+' : ''}{asset.change_24h_pct.toFixed(2)}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-900 pt-1">
                          <span>Score: <strong className="text-slate-200">{asset.direction_score > 0 ? '+' : ''}{asset.direction_score}</strong></span>
                          <span>Conf: <strong className="text-cyan-300">{asset.confidence}%</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ======================================================== */}
              {/* 2. TODAY'S KEY CATALYSTS (CURRENT SESSION DRIVERS)       */}
              {/* ======================================================== */}
              <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3" id="dash-sec-2-catalysts">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Zap className="w-4 h-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                        <span>TODAY'S KEY CATALYSTS</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800/60">
                          HIGH-IMPACT SESSIONS
                        </span>
                      </h2>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Scheduled releases and actual post-release market reaction tracking
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTabChange('today_catalysts')}
                    className="flex items-center gap-1 text-xs font-mono text-amber-400 hover:text-amber-300 font-semibold px-2.5 py-1 rounded bg-amber-950/60 border border-amber-800/60 transition cursor-pointer"
                  >
                    <span>View All Today's Catalysts</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 3-4 Featured Today Catalysts */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {todayCatalysts.slice(0, 3).map(cat => (
                    <div
                      key={cat.id}
                      className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/90 space-y-2"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-cyan-300 px-1.5 py-0.2 rounded bg-slate-800">
                            {cat.currency}
                          </span>
                          <span className="text-xs font-bold text-slate-200 truncate max-w-[180px]">
                            {cat.event_name}
                          </span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          cat.status === 'RELEASED'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                            : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                        }`}>
                          {cat.status}
                        </span>
                      </div>

                      {/* Actual / Forecast / Previous Row */}
                      <div className="grid grid-cols-3 gap-1 bg-slate-900/60 rounded p-1.5 text-center font-mono text-[11px]">
                        <div>
                          <span className="text-[9px] text-slate-500 block">ACTUAL</span>
                          <strong className={cat.actual ? 'text-slate-100' : 'text-slate-500'}>
                            {cat.actual ?? '—'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">FORECAST</span>
                          <span className="text-slate-300">{cat.forecast ?? '—'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">SURPRISE</span>
                          <span className="text-cyan-300 font-semibold">{cat.surprise ?? '—'}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-300 line-clamp-2 leading-snug">
                        <strong className="text-cyan-400 text-[10px] uppercase font-mono block">REACTION:</strong>
                        {cat.actual_market_reaction}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ======================================================== */}
              {/* 3 & 4. MARKET OVERVIEW + CURRENCY STRENGTH (SPLIT GRID) */}
              {/* ======================================================== */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* 3. MARKET OVERVIEW (8 cols) */}
                <div className="lg:col-span-8 space-y-3" id="dash-sec-3-market-overview">
                  <MarketDataGrid
                    prices={prices}
                    watchlistSymbols={watchlistSymbols}
                    intradayMap={intradayMap}
                    onToggleWatchlist={handleToggleWatchlist}
                    onRefresh={async () => {
                      setIsRefreshingPrices(true);
                      await api.refreshMarkets();
                      const res = await api.getMarkets();
                      setPrices(res.prices);
                      setIsRefreshingPrices(false);
                    }}
                    isRefreshing={isRefreshingPrices}
                    onSelectSymbol={(sym) => setSelectedSymbol(sym === selectedSymbol ? null : sym)}
                    onOpenChart={(sym) => setChartModalSymbol(sym)}
                  />
                </div>

                {/* 4. CURRENCY STRENGTH (4 cols) */}
                <div className="lg:col-span-4" id="dash-sec-4-currency-strength">
                  <CurrencyStrengthWidget
                    strengths={strengths}
                    onRefresh={async () => {
                      setIsRefreshingCS(true);
                      const res = await api.refreshCurrencyStrength();
                      setStrengths(res.currency_strength);
                      setIsRefreshingCS(false);
                    }}
                    isRefreshing={isRefreshingCS}
                    onSelectCurrency={(cur) => setSelectedSymbol(cur === selectedSymbol ? null : cur)}
                  />
                </div>
              </div>

              {/* ======================================================== */}
              {/* 5. IMPORTANT NEWS (CANONICAL DEDUPLICATED WIRE FEED)     */}
              {/* ======================================================== */}
              <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3" id="dash-sec-5-news-wire">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Radio className="w-4 h-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                        <span>IMPORTANT NEWS & CANONICAL EVENT WIRE</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-800/60">
                          MULTI-SOURCE VERIFIED
                        </span>
                      </h2>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        One deduplicated event record with correlated source articles, affected assets, and single truth
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTabChange('events')}
                    className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold px-2.5 py-1 rounded bg-slate-950 border border-slate-800 transition cursor-pointer"
                  >
                    <span>Full Event Wire</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* News Feed Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredEvents.slice(0, 6).map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={() => setSelectedEventId(event.id)}
                    />
                  ))}
                </div>
              </section>

              {/* ======================================================== */}
              {/* 6 & 7. ECONOMIC CALENDAR + AI MARKET CONTEXT             */}
              {/* ======================================================== */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* 6. ECONOMIC CALENDAR TEASER (7 cols) */}
                <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3" id="dash-sec-6-calendar">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                        SCHEDULED MACROECONOMIC CALENDAR
                      </h3>
                    </div>
                    <button
                      onClick={() => handleTabChange('macro')}
                      className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>Full Calendar View</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
                    {calendar.slice(0, 6).map(item => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold text-[10px]">
                            {item.currency}
                          </span>
                          <span className="text-slate-200 truncate max-w-xs">{item.event_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[11px]">{new Date(item.date_time_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            item.impact === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {item.impact}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. AI MARKET CONTEXT (5 cols) */}
                <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3" id="dash-sec-7-ai-context">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                        AI MARKET CONTEXT & REGIME
                      </h3>
                    </div>
                    <button
                      onClick={() => handleTabChange('intelligence')}
                      className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>Deep Synthesis</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-300">
                    <div className="bg-slate-950/70 rounded-lg p-3 border border-slate-800/80 leading-relaxed font-sans">
                      <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold block mb-1">
                        SYNTHESIS SUMMARY:
                      </span>
                      {overview?.summary || 'Global markets reflect balanced policy pacing across major central banks with safe-haven support sustaining precious metals and commodity baskets. Consolidated event normalization maintains verified single-source accuracy.'}
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60 font-mono text-[11px] space-y-1">
                      <div className="text-slate-400 font-semibold">VISIBLE EVIDENCE PILLARS:</div>
                      <div className="text-slate-300 flex items-center gap-1.5">
                        <span className="text-cyan-400">•</span>
                        <span>Multi-source news deduplication & canonical resolution</span>
                      </div>
                      <div className="text-slate-300 flex items-center gap-1.5">
                        <span className="text-cyan-400">•</span>
                        <span>Live G8 sovereign rate differential pricing</span>
                      </div>
                      <div className="text-slate-300 flex items-center gap-1.5">
                        <span className="text-cyan-400">•</span>
                        <span>Central bank speech hawkish/dovish classification</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: DEDICATED INTRADAY MARKET MAP (13 ASSETS) */}
          {activeTab === 'intraday_map' && (
            <IntradayMarketMapView
              data={intradayMap}
              onRefresh={async () => {
                setIsRefreshingIntraday(true);
                const res = await api.getIntradayMarketMap();
                setIntradayMap(res.market_map);
                setIsRefreshingIntraday(false);
              }}
              isRefreshing={isRefreshingIntraday}
              onOpenChart={(sym) => setChartModalSymbol(sym)}
            />
          )}

          {/* VIEW 3: TODAY'S KEY CATALYSTS */}
          {activeTab === 'today_catalysts' && (
            <TodayCatalystsView
              catalysts={todayCatalysts}
              onRefresh={async () => {
                setIsRefreshingCatalysts(true);
                const res = await api.getTodayCatalysts();
                setTodayCatalysts(res.catalysts);
                setIsRefreshingCatalysts(false);
              }}
              isRefreshing={isRefreshingCatalysts}
              onSelectAsset={(sym) => setSelectedSymbol(sym)}
              onOpenChart={(sym) => setChartModalSymbol(sym)}
            />
          )}

          {/* VIEW 4: LIVE MARKET SURVEILLANCE GRID */}
          {activeTab === 'markets' && (
            <div className="space-y-4">
              <MarketDataGrid
                prices={prices}
                watchlistSymbols={watchlistSymbols}
                intradayMap={intradayMap}
                onToggleWatchlist={handleToggleWatchlist}
                onRefresh={async () => {
                  setIsRefreshingPrices(true);
                  await api.refreshMarkets();
                  const res = await api.getMarkets();
                  setPrices(res.prices);
                  setIsRefreshingPrices(false);
                }}
                isRefreshing={isRefreshingPrices}
                onSelectSymbol={(sym) => setSelectedSymbol(sym === selectedSymbol ? null : sym)}
                onOpenChart={(sym) => setChartModalSymbol(sym)}
              />
            </div>
          )}

          {/* VIEW 5: CURRENCY MATRIX */}
          {activeTab === 'currency' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5">
                <CurrencyStrengthWidget
                  strengths={strengths}
                  onRefresh={async () => {
                    setIsRefreshingCS(true);
                    const res = await api.refreshCurrencyStrength();
                    setStrengths(res.currency_strength);
                    setIsRefreshingCS(false);
                  }}
                  isRefreshing={isRefreshingCS}
                />
              </div>

              <div className="lg:col-span-7">
                <CurrencyPairOpportunityMatrix
                  strengths={strengths}
                  onOpenChart={(sym) => setChartModalSymbol(sym)}
                  onSelectSymbol={(sym) => setSelectedSymbol(sym === selectedSymbol ? null : sym)}
                />
              </div>
            </div>
          )}

          {/* VIEW 6: MACRO CALENDAR */}
          {activeTab === 'macro' && (
            <MacroCalendarView
              events={calendar}
              onRefresh={async () => {
                setIsRefreshingMacro(true);
                await api.refreshEconomicCalendar();
                const res = await api.getEconomicCalendar();
                setCalendar(res.calendar);
                setIsRefreshingMacro(false);
              }}
              isRefreshing={isRefreshingMacro}
            />
          )}

          {/* VIEW 7: CANONICAL EVENT WIRE */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <h1 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>DEDUPLICATED EVENT ENGINE WIRE</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ONE EVENT → ONE EVENT ID → MULTIPLE SOURCES → MULTIPLE ASSETS → ONE ANALYSIS
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Filter events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-950 border border-slate-800 px-3 py-1 rounded text-xs font-mono text-slate-200 outline-none w-56"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => setSelectedEventId(event.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* VIEW 8: AI INTELLIGENCE */}
          {activeTab === 'intelligence' && (
            <AIIntelligenceView initialOverview={overview} />
          )}

          {/* VIEW 9: WATCHLIST */}
          {activeTab === 'watchlist' && (
            <WatchlistView
              watchlist={watchlist}
              prices={prices}
              user={user}
              onOpenAuth={() => setIsAuthOpen(true)}
              onRemove={async (symbol) => {
                await api.removeFromWatchlist(symbol);
                setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
              }}
              onAdd={async (symbol, assetType) => {
                const res = await api.addToWatchlist(symbol, assetType);
                if (res.item) setWatchlist(prev => [...prev, res.item]);
              }}
              onSelectSymbol={(sym) => {
                setSelectedSymbol(sym);
                handleTabChange('terminal');
              }}
            />
          )}

          {/* VIEW 10: ADMIN PANEL */}
          {activeTab === 'admin' && (
            <AdminPanel />
          )}
        </main>
      </div>

      {/* 4. Event Detail Modal */}
      {selectedEventId && (
        <EventDetailModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
        />
      )}

      {/* 5. Authentication Modal */}
      {isAuthOpen && (
        <AuthModal
          onClose={() => setIsAuthOpen(false)}
          onSuccess={(u) => {
            setUser(u);
            api.getWatchlist().then(w => setWatchlist(w.watchlist || []));
          }}
        />
      )}

      {/* 6. TradingView Interactive Candlestick Chart Modal */}
      {chartModalSymbol && (
        <TradingViewChartModal
          initialSymbol={chartModalSymbol}
          prices={prices}
          onClose={() => setChartModalSymbol(null)}
        />
      )}
    </div>
  );
}
