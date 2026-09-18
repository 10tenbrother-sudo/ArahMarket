import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Clock,
  Compass,
  Layers,
  BarChart2,
  ChevronRight,
  Filter,
  Search,
  Activity,
  Maximize2,
  Eye,
} from 'lucide-react';
import { IntradayAssetBias, MarketDirectionBias } from '../types';

interface IntradayMarketMapViewProps {
  data: IntradayAssetBias[];
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenChart: (symbol: string) => void;
}

export const IntradayMarketMapView: React.FC<IntradayMarketMapViewProps> = ({
  data,
  onRefresh,
  isRefreshing,
  onOpenChart,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'COMMODITY' | 'CRYPTO' | 'INDEX' | 'FOREX'>('ALL');
  const [selectedBias, setSelectedBias] = useState<'ALL' | MarketDirectionBias>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  // Statistics Summary
  const stats = useMemo(() => {
    let bullish = 0;
    let bearish = 0;
    let neutral = 0;
    let mixed = 0;

    data.forEach(item => {
      if (item.overall_bias === 'BULLISH') bullish++;
      else if (item.overall_bias === 'BEARISH') bearish++;
      else if (item.overall_bias === 'NEUTRAL') neutral++;
      else if (item.overall_bias === 'MIXED') mixed++;
    });

    return { total: data.length, bullish, bearish, neutral, mixed };
  }, [data]);

  // Filtered Assets
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (selectedCategory !== 'ALL' && item.asset_type !== selectedCategory) return false;
      if (selectedBias !== 'ALL' && item.overall_bias !== selectedBias) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSymbol = item.symbol.toLowerCase().includes(q);
        const matchName = item.display_name.toLowerCase().includes(q);
        const matchCatalyst = item.today_key_catalyst.toLowerCase().includes(q);
        const matchDrivers = item.top_drivers.some(d => d.toLowerCase().includes(q));
        return matchSymbol || matchName || matchCatalyst || matchDrivers;
      }
      return true;
    });
  }, [data, selectedCategory, selectedBias, searchQuery]);

  const getBiasColor = (bias: MarketDirectionBias) => {
    switch (bias) {
      case 'BULLISH':
        return {
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          text: 'text-emerald-400',
          bg: 'bg-emerald-500',
          border: 'border-emerald-500/40',
          pill: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
        };
      case 'BEARISH':
        return {
          badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          text: 'text-rose-400',
          bg: 'bg-rose-500',
          border: 'border-rose-500/40',
          pill: 'bg-rose-950/60 text-rose-300 border-rose-800/60',
        };
      case 'MIXED':
        return {
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          text: 'text-purple-400',
          bg: 'bg-purple-500',
          border: 'border-purple-500/40',
          pill: 'bg-purple-950/60 text-purple-300 border-purple-800/60',
        };
      case 'NEUTRAL':
      default:
        return {
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          text: 'text-amber-400',
          bg: 'bg-amber-500',
          border: 'border-amber-500/40',
          pill: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
        };
    }
  };

  const getBiasIcon = (bias: MarketDirectionBias) => {
    switch (bias) {
      case 'BULLISH':
        return <TrendingUp className="w-3.5 h-3.5" />;
      case 'BEARISH':
        return <TrendingDown className="w-3.5 h-3.5" />;
      case 'MIXED':
        return <Compass className="w-3.5 h-3.5" />;
      case 'NEUTRAL':
      default:
        return <Minus className="w-3.5 h-3.5" />;
    }
  };

  const formatAssetPrice = (symbol: string, price: number) => {
    if (symbol === 'XAUUSD' || symbol === 'US30' || symbol === 'US500' || symbol === 'US100') {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (symbol === 'BTC') {
      return price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    if (symbol === 'USD') {
      return price.toFixed(2);
    }
    if (symbol === 'JPY') {
      return price.toFixed(2);
    }
    return price.toFixed(5);
  };

  return (
    <div className="space-y-4" id="intraday-market-map-root">
      {/* 1. Header Ribbon & Terminal Control */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Compass className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-100 tracking-wide">
              TODAY'S INTRADAY MARKET MAP
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
              13 CORE ASSETS
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SYNCHRONIZED
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Multi-factor synthesis connecting <strong>Macro Data + Central Bank Speeches + Currency Strength + Yields + Real-time Price Action</strong> into continuous intraday directional bias.
          </p>
        </div>

        {/* Global Bias Balance Counters */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400 text-[11px]">BIAS RATIO:</span>
            <span className="text-emerald-400 font-bold">{stats.bullish}B</span>
            <span className="text-slate-600">/</span>
            <span className="text-rose-400 font-bold">{stats.bearish}S</span>
            <span className="text-slate-600">/</span>
            <span className="text-amber-400 font-bold">{stats.neutral}N</span>
            <span className="text-slate-600">/</span>
            <span className="text-purple-400 font-bold">{stats.mixed}M</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-50"
            title="Recalculate Intraday Biases"
            id="refresh-intraday-map-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar & View Mode Toggle */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] font-mono mr-1">CLASS:</span>
          {[
            { id: 'ALL', label: 'All (13)' },
            { id: 'COMMODITY', label: 'Commodity (1)' },
            { id: 'CRYPTO', label: 'Crypto (1)' },
            { id: 'INDEX', label: 'Indices (3)' },
            { id: 'FOREX', label: 'Currencies (8)' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Bias Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] font-mono mr-1">BIAS:</span>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'BULLISH', label: 'Bullish' },
            { id: 'BEARISH', label: 'Bearish' },
            { id: 'NEUTRAL', label: 'Neutral' },
            { id: 'MIXED', label: 'Mixed' },
          ].map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBias(b.id as any)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                selectedBias === b.id
                  ? 'bg-slate-700 text-slate-100 border border-slate-600'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Search & Layout View Toggles */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-52">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search asset, catalyst..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="flex items-center rounded bg-slate-950 border border-slate-800 p-0.5">
            <button
              onClick={() => setViewMode('CARDS')}
              className={`px-2 py-1 rounded text-xs font-medium cursor-pointer ${
                viewMode === 'CARDS' ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Card View"
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-2 py-1 rounded text-xs font-medium cursor-pointer ${
                viewMode === 'TABLE' ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Dense Terminal Table"
            >
              Scanner
            </button>
          </div>
        </div>
      </div>

      {/* 3. Mandatory Institutional Disclaimer Pill */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-lg px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong>DIRECTIONAL CONTEXT:</strong> Institutional macro bias only. NOT a buy/sell execution signal and NOT a guaranteed forecast.
          </span>
        </div>
        <span className="text-[10px] text-slate-500 hidden sm:inline">
          Last Synced: {new Date().toLocaleTimeString()} UTC
        </span>
      </div>

      {/* 4. Display: Grid Cards Mode */}
      {viewMode === 'CARDS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredData.map(asset => {
            const colors = getBiasColor(asset.overall_bias);
            const isExpanded = expandedSymbol === asset.symbol;

            return (
              <div
                key={asset.symbol}
                id={`market-map-card-${asset.symbol}`}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-lg p-4 transition duration-150 flex flex-col justify-between space-y-3.5 shadow-sm"
              >
                {/* Card Header: Symbol, Price, Overall Bias Badge */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-slate-100">{asset.symbol}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {asset.asset_type}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        asset.status === 'LIVE' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50' : 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                      }`}>
                        {asset.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">
                      {asset.display_name}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-slate-100">
                      {asset.asset_type === 'COMMODITY' || asset.asset_type === 'CRYPTO' ? '$' : ''}
                      {formatAssetPrice(asset.symbol, asset.price)}
                    </div>
                    <div className={`text-xs font-mono font-semibold flex items-center justify-end gap-0.5 ${
                      asset.change_24h_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {asset.change_24h_pct >= 0 ? '+' : ''}{asset.change_24h_pct.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Overall Bias Banner & Score Meter */}
                <div className={`rounded-md p-2.5 border ${colors.badge} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-slate-950/50">
                      {getBiasIcon(asset.overall_bias)}
                    </span>
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        OVERALL INTRADAY BIAS
                      </div>
                      <div className="font-mono font-bold text-sm tracking-wide">
                        {asset.overall_bias}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-slate-200">
                      Score: <span className={colors.text}>{asset.direction_score > 0 ? '+' : ''}{asset.direction_score}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Confidence: <span className="text-cyan-300 font-semibold">{asset.confidence}%</span>
                    </div>
                  </div>
                </div>

                {/* Separated Biases: Fundamental vs Price Action */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-950/60 rounded p-2 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">FUNDAMENTAL BIAS</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`font-bold ${getBiasColor(asset.fundamental_bias).text}`}>
                        {asset.fundamental_bias}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {asset.fundamental_score > 0 ? '+' : ''}{asset.fundamental_score}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 rounded p-2 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">PRICE ACTION BIAS</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`font-bold ${getBiasColor(asset.price_action_bias).text}`}>
                        {asset.price_action_bias}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {asset.price_action_score > 0 ? '+' : ''}{asset.price_action_score}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Today's Key Catalyst */}
                <div className="bg-slate-950/40 rounded p-2.5 border border-slate-800/60 space-y-1">
                  <div className="text-[10px] font-mono font-semibold text-cyan-400 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span>TODAY'S KEY CATALYST</span>
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    {asset.today_key_catalyst}
                  </div>
                </div>

                {/* Current Market Reaction */}
                <div className="text-xs text-slate-300 bg-slate-950/30 rounded p-2 border border-slate-800/50">
                  <span className="text-[10px] font-mono text-slate-400 block mb-0.5">CURRENT MARKET REACTION:</span>
                  <p className="leading-snug text-slate-200">{asset.current_market_reaction}</p>
                </div>

                {/* Top Drivers (Bulleted) */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                    <span>TOP MACRO & FLOW DRIVERS</span>
                    <button
                      onClick={() => setExpandedSymbol(isExpanded ? null : asset.symbol)}
                      className="text-cyan-400 hover:text-cyan-300 cursor-pointer text-[10px]"
                    >
                      {isExpanded ? 'Show Less' : `View All (${asset.top_drivers.length})`}
                    </button>
                  </div>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {(isExpanded ? asset.top_drivers : asset.top_drivers.slice(0, 2)).map((driver, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-snug">
                        <span className="text-cyan-400 text-[10px] mt-1 shrink-0">•</span>
                        <span>{driver}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Expanded Details: Conflicting Factors & Conditions to Change */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-800 space-y-2.5 text-xs animate-in fade-in duration-200">
                    {asset.conflicting_factors.length > 0 && (
                      <div className="bg-amber-950/20 rounded p-2 border border-amber-900/30 space-y-1">
                        <div className="text-[10px] font-mono text-amber-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>CONFLICTING / RISK FACTORS</span>
                        </div>
                        <ul className="space-y-0.5 text-slate-300 text-[11px]">
                          {asset.conflicting_factors.map((factor, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-amber-400">▹</span>
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="bg-slate-950/70 rounded p-2 border border-slate-800 space-y-1">
                      <div className="text-[10px] font-mono text-slate-400 font-semibold">
                        CONDITIONS THAT COULD CHANGE BIAS:
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {asset.conditions_to_change_bias}
                      </p>
                    </div>

                    <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between">
                      <span>Source: {asset.source}</span>
                      <span>Updated: {new Date(asset.last_updated).toLocaleTimeString()} UTC</span>
                    </div>
                  </div>
                )}

                {/* Card Action Footer */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <button
                    onClick={() => setExpandedSymbol(isExpanded ? null : asset.symbol)}
                    className="text-slate-400 hover:text-slate-200 text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Collapse' : 'Details & Invalidation'}</span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  <button
                    onClick={() => onOpenChart(asset.symbol)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] transition cursor-pointer"
                    id={`open-chart-${asset.symbol}`}
                  >
                    <BarChart2 className="w-3 h-3" />
                    <span>Chart View</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 5. Display: Dense Terminal Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-3">Price</th>
                <th className="py-3 px-3">24h Chg</th>
                <th className="py-3 px-3">Intraday Bias</th>
                <th className="py-3 px-3 text-center">Score</th>
                <th className="py-3 px-3 text-center">Confidence</th>
                <th className="py-3 px-3">Fundamental</th>
                <th className="py-3 px-3">Price Action</th>
                <th className="py-3 px-4 min-w-[280px]">Today's Catalyst</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredData.map(asset => {
                const colors = getBiasColor(asset.overall_bias);
                return (
                  <tr key={asset.symbol} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-100 flex items-center gap-2">
                      <span>{asset.symbol}</span>
                      <span className="text-[9px] font-normal px-1 rounded bg-slate-800 text-slate-400">
                        {asset.asset_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">
                      {asset.asset_type === 'COMMODITY' || asset.asset_type === 'CRYPTO' ? '$' : ''}
                      {formatAssetPrice(asset.symbol, asset.price)}
                    </td>
                    <td className={`py-2.5 px-3 font-semibold ${
                      asset.change_24h_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {asset.change_24h_pct >= 0 ? '+' : ''}{asset.change_24h_pct.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${colors.badge}`}>
                        {getBiasIcon(asset.overall_bias)}
                        {asset.overall_bias}
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 text-center font-bold ${colors.text}`}>
                      {asset.direction_score > 0 ? '+' : ''}{asset.direction_score}
                    </td>
                    <td className="py-2.5 px-3 text-center text-cyan-300">
                      {asset.confidence}%
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-semibold ${getBiasColor(asset.fundamental_bias).text}`}>
                        {asset.fundamental_bias} ({asset.fundamental_score > 0 ? '+' : ''}{asset.fundamental_score})
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-semibold ${getBiasColor(asset.price_action_bias).text}`}>
                        {asset.price_action_bias} ({asset.price_action_score > 0 ? '+' : ''}{asset.price_action_score})
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 truncate max-w-xs font-sans text-xs">
                      {asset.today_key_catalyst}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        {asset.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onOpenChart(asset.symbol)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition cursor-pointer"
                        title="Open Interactive Chart"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
