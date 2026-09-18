import React, { useState, useMemo } from 'react';
import { CurrencyStrength } from '../types';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  BarChart2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface PairOpportunity {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  baseScore: number;
  quoteScore: number;
  delta: number; // base - quote
  absDelta: number;
  action: 'STRONG_BUY' | 'BUY' | 'NEUTRAL_CHOP' | 'SELL' | 'STRONG_SELL';
  tier: 'PRIME' | 'MODERATE' | 'CHOP_AVOID';
  tradeStyle: string;
  catalyst: string;
  sessionSuitability: string;
}

interface CurrencyPairOpportunityMatrixProps {
  strengths: CurrencyStrength[];
  onOpenChart?: (symbol: string) => void;
  onSelectSymbol?: (symbol: string) => void;
}

const TRADABLE_PAIRS: Array<{
  symbol: string;
  base: string;
  quote: string;
  catalyst: string;
  session: string;
}> = [
  { symbol: 'GBPJPY', base: 'GBP', quote: 'JPY', catalyst: 'BoE terminal rate resilience vs BoJ ultra-dovish yield suppression', session: 'London / Tokyo Overlap' },
  { symbol: 'AUDJPY', base: 'AUD', quote: 'JPY', catalyst: 'Commodity/Risk-on carry beta vs Yen funding liquidation', session: 'Asian / Early London' },
  { symbol: 'GBPUSD', base: 'GBP', quote: 'USD', catalyst: 'UK services inflation persistence vs softening US Treasury yields & Fed rate cut expectations', session: 'London / New York Overlap' },
  { symbol: 'EURJPY', base: 'EUR', quote: 'JPY', catalyst: 'ECB yield plateau vs negative real rate differential in Japan', session: 'London Session' },
  { symbol: 'EURUSD', base: 'EUR', quote: 'USD', catalyst: 'Eurozone industrial stabilization vs DXY dollar index consolidation', session: 'London / New York Overlap' },
  { symbol: 'AUDUSD', base: 'AUD', quote: 'USD', catalyst: 'RBA hawkish hold & commodities demand vs cooling US labor market', session: 'Asian / New York' },
  { symbol: 'NZDUSD', base: 'NZD', quote: 'USD', catalyst: 'Dairy terms-of-trade vs Fed monetary easing trajectory', session: 'Asian Session' },
  { symbol: 'USDCAD', base: 'USD', quote: 'CAD', catalyst: 'Crude oil correlation vs BoC interest rate easing cycle', session: 'New York Session' },
  { symbol: 'USDCHF', base: 'USD', quote: 'CHF', catalyst: 'SNB negative intervention bias vs US dollar safe-haven yields', session: 'European / US Session' },
  { symbol: 'EURGBP', base: 'EUR', quote: 'GBP', catalyst: 'UK vs Eurozone gilt spread and economic momentum differential', session: 'London Session' },
  { symbol: 'CADJPY', base: 'CAD', quote: 'JPY', catalyst: 'Energy export terms vs Japanese trade deficit flow', session: 'Tokyo / NY Session' },
  { symbol: 'CHFJPY', base: 'CHF', quote: 'JPY', catalyst: 'Swiss Franc defensive appreciation vs weak Yen carry flows', session: 'European Session' },
  { symbol: 'NZDCAD', base: 'NZD', quote: 'CAD', catalyst: 'Cross-commodity parity with minimal macro divergence', session: 'Pacific Session' },
];

export const CurrencyPairOpportunityMatrix: React.FC<CurrencyPairOpportunityMatrixProps> = ({
  strengths,
  onOpenChart,
  onSelectSymbol,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PRIME_LONGS' | 'PRIME_SHORTS' | 'AVOID'>('ALL');

  // Compute map of currency scores
  const scoreMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of strengths) {
      map[s.currency] = s.strength_score;
    }
    return map;
  }, [strengths]);

  // Compute live pair rankings with divergence deltas
  const pairOpportunities = useMemo<PairOpportunity[]>(() => {
    return TRADABLE_PAIRS.map(p => {
      const baseScore = scoreMap[p.base] ?? 5.0;
      const quoteScore = scoreMap[p.quote] ?? 5.0;
      const delta = parseFloat((baseScore - quoteScore).toFixed(1));
      const absDelta = Math.abs(delta);

      let action: PairOpportunity['action'] = 'NEUTRAL_CHOP';
      let tier: PairOpportunity['tier'] = 'CHOP_AVOID';
      let tradeStyle = 'Rangebound / Scalp Only';

      if (delta >= 4.0) {
        action = 'STRONG_BUY';
        tier = 'PRIME';
        tradeStyle = 'Trend Follow / Buy Dips';
      } else if (delta >= 2.0) {
        action = 'BUY';
        tier = 'MODERATE';
        tradeStyle = 'Bullish Continuation';
      } else if (delta <= -4.0) {
        action = 'STRONG_SELL';
        tier = 'PRIME';
        tradeStyle = 'Trend Follow / Sell Rallies';
      } else if (delta <= -2.0) {
        action = 'SELL';
        tier = 'MODERATE';
        tradeStyle = 'Bearish Continuation';
      } else {
        action = 'NEUTRAL_CHOP';
        tier = 'CHOP_AVOID';
        tradeStyle = 'High Whipsaw / Avoid Breakouts';
      }

      return {
        symbol: p.symbol,
        baseCurrency: p.base,
        quoteCurrency: p.quote,
        baseScore,
        quoteScore,
        delta,
        absDelta,
        action,
        tier,
        tradeStyle,
        catalyst: p.catalyst,
        sessionSuitability: p.session,
      };
    }).sort((a, b) => b.absDelta - a.absDelta);
  }, [scoreMap]);

  // Filter pairs according to user view
  const filteredPairs = useMemo(() => {
    if (filter === 'PRIME_LONGS') {
      return pairOpportunities.filter(p => p.delta >= 2.5);
    }
    if (filter === 'PRIME_SHORTS') {
      return pairOpportunities.filter(p => p.delta <= -2.5);
    }
    if (filter === 'AVOID') {
      return pairOpportunities.filter(p => p.absDelta < 1.8);
    }
    return pairOpportunities;
  }, [pairOpportunities, filter]);

  // Top prime opportunities
  const topLong = pairOpportunities.find(p => p.delta > 3.0);
  const topShort = pairOpportunities.find(p => p.delta < -3.0);
  const topAvoid = pairOpportunities.find(p => p.absDelta < 1.2);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm font-sans" id="currency-pair-opportunities">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
              WORTH-IT PAIRS TO TRADE RIGHT NOW (LIVE DIVERGENCE)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Analisis pair dengan probabilitas tertinggi berdasarkan disparitas mata uang terkuat vs terlemah.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono shrink-0">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
              filter === 'ALL'
                ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Pairs
          </button>
          <button
            onClick={() => setFilter('PRIME_LONGS')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
              filter === 'PRIME_LONGS'
                ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/80'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
            <span>Top Longs</span>
          </button>
          <button
            onClick={() => setFilter('PRIME_SHORTS')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
              filter === 'PRIME_SHORTS'
                ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800/80'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <ArrowDownRight className="w-3 h-3 text-rose-400" />
            <span>Top Shorts</span>
          </button>
          <button
            onClick={() => setFilter('AVOID')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
              filter === 'AVOID'
                ? 'bg-amber-950 text-amber-300 font-bold border border-amber-800/80'
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Hindari (Chop)</span>
          </button>
        </div>
      </div>

      {/* Top 3 Executive Decision Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Prime Long */}
        {topLong && (
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/60 font-mono">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                PRIME LONG BIAS
              </span>
              <span className="text-emerald-300 font-bold text-xs">+{topLong.delta} DELTA</span>
            </div>
            <div className="text-base font-bold text-slate-100 mt-1 flex items-baseline gap-2">
              <span>{topLong.symbol}</span>
              <span className="text-xs font-normal text-slate-400">
                ({topLong.baseCurrency} {topLong.baseScore} vs {topLong.quoteCurrency} {topLong.quoteScore})
              </span>
            </div>
            <p className="text-[10px] text-slate-300 font-sans mt-1.5 leading-snug">
              {topLong.catalyst}
            </p>
            <div className="mt-2 text-[10px] text-emerald-400 font-mono">
              Action: Buy the dips / Trend-following
            </div>
          </div>
        )}

        {/* Second Prime Opportunity (Next High Divergence) */}
        {pairOpportunities[1] && pairOpportunities[1] !== topLong && (
          <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/60 font-mono">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                HIGH DIVERGENCE #2
              </span>
              <span className="text-cyan-300 font-bold text-xs">
                {pairOpportunities[1].delta > 0 ? `+${pairOpportunities[1].delta}` : pairOpportunities[1].delta} DELTA
              </span>
            </div>
            <div className="text-base font-bold text-slate-100 mt-1 flex items-baseline gap-2">
              <span>{pairOpportunities[1].symbol}</span>
              <span className="text-xs font-normal text-slate-400">
                ({pairOpportunities[1].baseCurrency} {pairOpportunities[1].baseScore} vs {pairOpportunities[1].quoteCurrency} {pairOpportunities[1].quoteScore})
              </span>
            </div>
            <p className="text-[10px] text-slate-300 font-sans mt-1.5 leading-snug">
              {pairOpportunities[1].catalyst}
            </p>
            <div className="mt-2 text-[10px] text-cyan-400 font-mono">
              Action: {pairOpportunities[1].tradeStyle}
            </div>
          </div>
        )}

        {/* Avoid Chop Warning */}
        {topAvoid && (
          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/60 font-mono">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                HINDARI / LOW SPREAD
              </span>
              <span className="text-amber-300 font-bold text-xs">{topAvoid.delta} DELTA</span>
            </div>
            <div className="text-base font-bold text-slate-100 mt-1 flex items-baseline gap-2">
              <span>{topAvoid.symbol}</span>
              <span className="text-xs font-normal text-slate-400">
                ({topAvoid.baseCurrency} {topAvoid.baseScore} vs {topAvoid.quoteCurrency} {topAvoid.quoteScore})
              </span>
            </div>
            <p className="text-[10px] text-slate-300 font-sans mt-1.5 leading-snug">
              Kekuatan mata uang hampir seimbang. Potensi konsolidasi menyempit, false breakout, dan resiko sideways tinggi.
            </p>
            <div className="mt-2 text-[10px] text-amber-400 font-mono">
              Rekomendasi: Jangan ambil posisi breakout
            </div>
          </div>
        )}
      </div>

      {/* Ranked Pair Opportunity Table */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Pair</th>
                <th className="py-2.5 px-3">Status / Bias</th>
                <th className="py-2.5 px-3">Divergence Delta</th>
                <th className="py-2.5 px-3 hidden md:table-cell">Base vs Quote</th>
                <th className="py-2.5 px-3 hidden lg:table-cell">Fundamental / Macro Driver</th>
                <th className="py-2.5 px-3 hidden sm:table-cell">Trading Style</th>
                <th className="py-2.5 px-3 text-right">Chart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPairs.map((p) => {
                const isLong = p.delta >= 2.0;
                const isShort = p.delta <= -2.0;
                const isChop = p.tier === 'CHOP_AVOID';

                return (
                  <tr
                    key={p.symbol}
                    className="hover:bg-slate-900/50 transition cursor-pointer group"
                    onClick={() => onSelectSymbol?.(p.symbol)}
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-100 flex items-center gap-1.5">
                      <span className="text-cyan-400 group-hover:text-cyan-300 transition text-sm">
                        {p.symbol}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold border uppercase tracking-wider inline-flex items-center gap-1 ${
                          p.action === 'STRONG_BUY'
                            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700 shadow-xs'
                            : p.action === 'BUY'
                            ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60'
                            : p.action === 'STRONG_SELL'
                            ? 'bg-rose-950/90 text-rose-300 border-rose-700 shadow-xs'
                            : p.action === 'SELL'
                            ? 'bg-rose-950/50 text-rose-400 border-rose-800/60'
                            : 'bg-amber-950/40 text-amber-400 border-amber-800/60'
                        }`}
                      >
                        {p.action === 'STRONG_BUY' && <ArrowUpRight className="w-2.5 h-2.5" />}
                        {p.action === 'STRONG_SELL' && <ArrowDownRight className="w-2.5 h-2.5" />}
                        {p.action === 'NEUTRAL_CHOP' && <AlertTriangle className="w-2.5 h-2.5" />}
                        {p.action.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold tabular-nums text-sm ${
                            isLong ? 'text-emerald-400' : isShort ? 'text-rose-400' : 'text-slate-400'
                          }`}
                        >
                          {p.delta > 0 ? `+${p.delta}` : p.delta}
                        </span>
                        {/* Visual divergence bar */}
                        <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 hidden sm:block">
                          <div
                            className={`h-full ${
                              isLong ? 'bg-emerald-400' : isShort ? 'bg-rose-400' : 'bg-amber-400'
                            }`}
                            style={{
                              width: `${Math.min(100, (p.absDelta / 8.0) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 hidden md:table-cell text-slate-400 text-[11px]">
                      <span className="font-semibold text-slate-200">{p.baseCurrency}</span> ({p.baseScore}) vs{' '}
                      <span className="font-semibold text-slate-200">{p.quoteCurrency}</span> ({p.quoteScore})
                    </td>

                    <td className="py-2.5 px-3 hidden lg:table-cell text-slate-300 font-sans text-xs max-w-xs truncate">
                      {p.catalyst}
                    </td>

                    <td className="py-2.5 px-3 hidden sm:table-cell text-[11px] text-slate-400">
                      {p.tradeStyle}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      {onOpenChart && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenChart(p.symbol);
                          }}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition cursor-pointer"
                          title={`Open ${p.symbol} Chart`}
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trader Discipline Guide */}
      <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg text-xs text-slate-400 font-sans flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-slate-200 font-mono">Golden Rule Currency Strength:</strong> Pasangkan mata uang terkuat (Skor &gt; 7.0) dengan mata uang terlemah (Skor &lt; 3.0) untuk memaksimalkan momentum tren dan meminimalkan resiko drawdown.
          </span>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 shrink-0">DISPERSION MATRIX ACTIVE</span>
      </div>
    </div>
  );
};
