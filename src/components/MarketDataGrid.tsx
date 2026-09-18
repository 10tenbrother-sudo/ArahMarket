import React, { useState, useMemo } from 'react';
import { MarketPrice, IntradayAssetBias } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Star,
  Activity,
  LineChart,
  Compass,
} from 'lucide-react';

interface MarketDataGridProps {
  prices: MarketPrice[];
  watchlistSymbols: string[];
  intradayMap?: IntradayAssetBias[];
  onToggleWatchlist: (symbol: string, assetType: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onSelectSymbol: (symbol: string) => void;
  onOpenChart?: (symbol: string) => void;
}

export const MarketDataGrid: React.FC<MarketDataGridProps> = ({
  prices,
  watchlistSymbols,
  intradayMap = [],
  onToggleWatchlist,
  onRefresh,
  isRefreshing,
  onSelectSymbol,
  onOpenChart,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const intradayLookup = useMemo(() => {
    const map = new Map<string, IntradayAssetBias>();
    intradayMap.forEach(item => map.set(item.symbol, item));
    return map;
  }, [intradayMap]);

  const filteredPrices = useMemo(() => {
    return prices.filter(p => {
      if (filterType === 'ALL') return true;
      if (filterType === 'FOREX') return p.asset_type === 'FOREX' || p.symbol === 'USD';
      if (filterType === 'INDICES') return p.asset_type === 'INDEX';
      if (filterType === 'COMMODITIES') return p.symbol === 'XAUUSD' || p.asset_type === 'COMMODITY';
      if (filterType === 'CRYPTO') return p.symbol === 'BTC' || p.asset_type === 'CRYPTO';
      return true;
    });
  }, [prices, filterType]);

  const getBiasBadge = (bias?: string) => {
    switch (bias) {
      case 'BULLISH':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
      case 'BEARISH':
        return 'bg-rose-950/80 text-rose-300 border-rose-800/80';
      case 'MIXED':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/80';
      case 'NEUTRAL':
      default:
        return 'bg-amber-950/80 text-amber-300 border-amber-800/80';
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col shadow-sm" id="market-data-grid-root">
      {/* Header & Asset Class Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80 mb-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            LIVE MARKET SURVEILLANCE
          </h2>
          <span className="text-[10px] font-mono text-slate-500">({prices.length} ASSETS)</span>
          <div className="flex items-center gap-1.5 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border bg-emerald-950/80 text-emerald-300 border-emerald-800/60">
              SYNCHRONIZED
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenChart && (
            <button
              onClick={() => onOpenChart('US30')}
              className="px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 flex items-center gap-1.5 text-xs font-mono font-semibold transition cursor-pointer"
              title="Open TradingView Non-Delayed Real-Time Chart Modal"
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>TV Interactive Chart</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded border border-slate-800 text-[11px] font-mono">
            {['ALL', 'COMMODITIES', 'CRYPTO', 'INDICES', 'FOREX'].map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  filterType === f
                    ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/80'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh real market prices"
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer disabled:opacity-50 flex items-center gap-1 text-xs font-mono"
            id="refresh-surveillance-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid of Market Instrument Cards with Exact Hierarchy:
          Asset → Price → Change → Intraday Bias → Confidence → Mini Chart → Main Drivers → Live Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {filteredPrices.map(item => {
          const isUnavailable = item.status === 'UNAVAILABLE';
          const isPos = item.change_24h_pct > 0;
          const isNeg = item.change_24h_pct < 0;
          const isBookmarked = watchlistSymbols.includes(item.symbol);
          const biasData = intradayLookup.get(item.symbol);

          // Range calculation for 24h High/Low bar
          const range = item.high_24h - item.low_24h;
          const currentPos = range > 0 ? ((item.price - item.low_24h) / range) * 100 : 50;

          // Sparkline points
          const sparkPoints = item.sparkline_1h && item.sparkline_1h.length > 1
            ? item.sparkline_1h
            : [item.price * 0.998, item.price];
          const minSpark = Math.min(...sparkPoints);
          const maxSpark = Math.max(...sparkPoints);
          const sparkRange = maxSpark - minSpark || 1;
          const svgPoints = sparkPoints
            .map((val, idx) => {
              const x = (idx / (sparkPoints.length - 1)) * 64;
              const y = 20 - ((val - minSpark) / sparkRange) * 18;
              return `${x},${y}`;
            })
            .join(' ');

          const formattedTime = item.last_updated
            ? new Date(item.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Live';

          return (
            <div
              key={item.symbol}
              onClick={() => onSelectSymbol(item.symbol)}
              className="p-3 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer flex flex-col justify-between group space-y-2.5"
            >
              <div>
                {/* 1. ASSET: Symbol + Name + TV Symbol + Watchlist */}
                <div className="flex items-center justify-between mb-1 font-mono">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm text-slate-100">{item.symbol}</span>
                    {item.tv_symbol && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-cyan-300 font-mono border border-slate-700 font-medium">
                        {item.tv_symbol}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {onOpenChart && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenChart(item.tv_symbol || item.symbol);
                        }}
                        className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-cyan-300 transition cursor-pointer"
                        title={`Open TradingView Chart (${item.tv_symbol || item.symbol})`}
                      >
                        <LineChart className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatchlist(item.symbol, item.asset_type);
                      }}
                      className={`p-1 rounded hover:bg-slate-800 transition cursor-pointer ${
                        isBookmarked ? 'text-amber-400' : 'text-slate-600 hover:text-slate-300'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 truncate mb-2" title={item.display_name}>
                  {item.display_name}
                </div>

                {/* 2 & 3 & 6. PRICE + CHANGE + MINI CHART */}
                <div className="flex items-center justify-between mb-2">
                  <div>
                    {/* 2. PRICE */}
                    <div className="text-base font-bold text-slate-100 font-mono tabular-nums leading-tight">
                      {isUnavailable ? (
                        <span className="text-rose-400 text-xs">UNAVAILABLE</span>
                      ) : (
                        item.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: item.symbol === 'JPY' || item.asset_type === 'FOREX' ? 4 : 2,
                        })
                      )}
                    </div>
                    {/* 3. CHANGE */}
                    {!isUnavailable && (
                      <div
                        className={`flex items-center gap-1 text-xs font-mono font-semibold tabular-nums mt-0.5 ${
                          isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-slate-400'
                        }`}
                      >
                        {isPos ? <TrendingUp className="w-3 h-3" /> : isNeg ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        <span>{isPos ? '+' : ''}{item.change_24h_pct.toFixed(2)}%</span>
                      </div>
                    )}
                  </div>

                  {/* 6. MINI CHART */}
                  {!isUnavailable && (
                    <svg className="w-16 h-7 shrink-0 overflow-visible" viewBox="0 0 64 22">
                      <polyline
                        fill="none"
                        stroke={isPos ? '#10b981' : isNeg ? '#f43f5e' : '#06b6d4'}
                        strokeWidth="1.5"
                        points={svgPoints}
                      />
                    </svg>
                  )}
                </div>

                {/* 4 & 5. INTRADAY BIAS + CONFIDENCE */}
                {biasData && (
                  <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-950/70 border border-slate-800/80 text-[10px] font-mono mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">BIAS:</span>
                      <span className={`px-1.5 py-0.2 rounded font-bold border ${getBiasBadge(biasData.overall_bias)}`}>
                        {biasData.overall_bias}
                      </span>
                    </div>
                    <div className="text-slate-400">
                      CONF: <span className="text-cyan-300 font-semibold">{biasData.confidence}%</span>
                    </div>
                  </div>
                )}

                {/* 7. MAIN DRIVERS */}
                {biasData && biasData.top_drivers.length > 0 && (
                  <div className="text-[11px] text-slate-300 bg-slate-950/40 rounded p-1.5 border border-slate-800/50 mb-2 leading-tight">
                    <span className="text-[9px] font-mono text-cyan-400 block mb-0.5">MAIN DRIVER:</span>
                    <p className="truncate" title={biasData.top_drivers[0]}>
                      {biasData.top_drivers[0]}
                    </p>
                  </div>
                )}
              </div>

              {/* 8. LIVE STATUS & PROVENANCE */}
              <div className="pt-2 border-t border-slate-800/80 font-mono text-[10px]">
                <div className="flex items-center justify-between text-slate-500 text-[9px]">
                  <span className="truncate max-w-[120px]" title={`${item.source} • Sync: ${formattedTime}`}>
                    {item.source}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">{formattedTime}</span>
                    <span className={`font-bold px-1 py-0.2 rounded text-[8px] border ${
                      item.status === 'LIVE'
                        ? 'text-emerald-400 bg-emerald-950/70 border-emerald-800/60'
                        : 'text-amber-400 bg-amber-950/70 border-amber-800/60'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
