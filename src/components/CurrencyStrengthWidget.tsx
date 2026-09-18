import React from 'react';
import { CurrencyStrength } from '../types';
import { TrendingUp, RefreshCw, ExternalLink, ShieldCheck, Activity } from 'lucide-react';

interface CurrencyStrengthWidgetProps {
  strengths: CurrencyStrength[];
  onRefresh: () => void;
  isRefreshing: boolean;
  onSelectCurrency?: (currency: string) => void;
}

export const CurrencyStrengthWidget: React.FC<CurrencyStrengthWidgetProps> = ({
  strengths,
  onRefresh,
  isRefreshing,
  onSelectCurrency,
}) => {
  const getMeterColor = (score: number) => {
    if (score >= 7.0) return 'from-emerald-600 to-emerald-400';
    if (score >= 5.5) return 'from-emerald-700 to-teal-500';
    if (score >= 4.5) return 'from-cyan-700 to-cyan-500';
    if (score >= 3.0) return 'from-amber-600 to-rose-500';
    return 'from-rose-700 to-rose-500';
  };

  const getDirectionBadge = (dir: string) => {
    switch (dir) {
      case 'STRONG_BUY':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'BUY':
        return 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60';
      case 'NEUTRAL':
        return 'bg-slate-900 text-slate-400 border-slate-800';
      case 'SELL':
        return 'bg-rose-950/50 text-rose-400 border-rose-800/60';
      case 'STRONG_SELL':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col h-full">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              CURRENCY STRENGTH MATRIX
            </h2>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-slate-500">
            <span>Provider:</span>
            <a
              href="https://currency-strength.com/en/"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-0.5"
            >
              <span>currency-strength.com</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh currency strength scores"
          className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {/* 8-Major Currencies Table & Meter */}
      <div className="space-y-2 flex-1 overflow-y-auto pr-1">
        {strengths.map(item => {
          const pct = Math.min(100, Math.max(5, (item.strength_score / 10) * 100));

          return (
            <div
              key={item.currency}
              onClick={() => onSelectCurrency?.(item.currency)}
              className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-4 text-[10px] font-bold text-slate-500 text-center">
                    #{item.rank}
                  </span>
                  <span className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition">
                    {item.currency}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border uppercase tracking-wider ${getDirectionBadge(item.change_direction)}`}>
                    {item.change_direction.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200 tabular-nums text-sm">
                    {item.strength_score.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-500">/ 10</span>
                </div>
              </div>

              {/* Strength Visual Meter */}
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/60">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${getMeterColor(item.strength_score)} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1.5 pt-1 border-t border-slate-900/80">
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'LIVE' ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                  {item.status}
                </span>
                <span>Updated: {new Date(item.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Relative Currency Pairing Quick Insight */}
      {strengths.length >= 2 && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
          <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
            <span>DISPERSION SPREAD:</span>
            <span className="text-cyan-400 font-bold">
              {strengths[0]?.currency} / {strengths[strengths.length - 1]?.currency}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Strongest ({strengths[0]?.currency} @ {strengths[0]?.strength_score}) vs Weakest ({strengths[strengths.length - 1]?.currency} @ {strengths[strengths.length - 1]?.strength_score}) creates highest probability directional divergence.
          </p>
        </div>
      )}
    </div>
  );
};
