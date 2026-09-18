import React, { useState, useMemo } from 'react';
import {
  Zap,
  Clock,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight,
  BarChart2,
} from 'lucide-react';
import { TodayCatalyst, ImpactLevel } from '../types';

interface TodayCatalystsViewProps {
  catalysts: TodayCatalyst[];
  onRefresh: () => void;
  isRefreshing: boolean;
  onSelectAsset?: (symbol: string) => void;
  onOpenChart?: (symbol: string) => void;
}

export const TodayCatalystsView: React.FC<TodayCatalystsViewProps> = ({
  catalysts,
  onRefresh,
  isRefreshing,
  onSelectAsset,
  onOpenChart,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'UPCOMING' | 'RELEASED'>('ALL');
  const [filterImportance, setFilterImportance] = useState<'ALL' | 'CRITICAL' | 'HIGH'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return catalysts.filter(c => {
      if (filterStatus === 'UPCOMING' && c.status !== 'UPCOMING') return false;
      if (filterStatus === 'RELEASED' && c.status !== 'RELEASED') return false;
      if (filterImportance === 'CRITICAL' && c.importance !== 'CRITICAL') return false;
      if (filterImportance === 'HIGH' && c.importance !== 'CRITICAL' && c.importance !== 'HIGH') return false;
      return true;
    });
  }, [catalysts, filterStatus, filterImportance]);

  const stats = useMemo(() => {
    let upcoming = 0;
    let released = 0;
    let critical = 0;
    catalysts.forEach(c => {
      if (c.status === 'UPCOMING') upcoming++;
      if (c.status === 'RELEASED') released++;
      if (c.importance === 'CRITICAL') critical++;
    });
    return { total: catalysts.length, upcoming, released, critical };
  }, [catalysts]);

  const formatSurpriseBadge = (surprise: string | null) => {
    if (!surprise) return null;
    const isPositive = surprise.includes('BEAT') || surprise.startsWith('+');
    const isNegative = surprise.includes('MISS') || surprise.startsWith('-');

    if (isPositive) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
          <ArrowUpRight className="w-3 h-3" />
          {surprise}
        </span>
      );
    }
    if (isNegative) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800/60">
          <ArrowDownRight className="w-3 h-3" />
          {surprise}
        </span>
      );
    }
    return (
      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
        {surprise}
      </span>
    );
  };

  const formatCountdown = (dateUtc: string) => {
    const diff = new Date(dateUtc).getTime() - Date.now();
    if (diff > 0) {
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      if (hours > 0) return `In ${hours}h ${mins}m`;
      return `In ${mins}m`;
    } else {
      const pastMin = Math.floor(Math.abs(diff) / 60000);
      if (pastMin < 60) return `${pastMin}m ago`;
      const pastHours = Math.floor(pastMin / 60);
      return `${pastHours}h ago`;
    }
  };

  return (
    <div className="space-y-4" id="today-catalysts-root">
      {/* 1. Header Ribbon */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-100 tracking-wide">
              TODAY'S KEY CATALYSTS
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60">
              CURRENT SESSION
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            High-impact economic data releases, rate announcements, and central bank catalysts scheduled for today with real-time surprise tracking and observed market reactions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400">TODAY:</span>
            <span className="text-cyan-400 font-bold">{stats.upcoming} Upcoming</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold">{stats.released} Released</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-50"
            id="refresh-today-catalysts-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Ribbon */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px] font-mono mr-1">STATUS:</span>
          {(['ALL', 'UPCOMING', 'RELEASED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                filterStatus === st
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px] font-mono mr-1">SEVERITY:</span>
          {(['ALL', 'CRITICAL', 'HIGH'] as const).map(imp => (
            <button
              key={imp}
              onClick={() => setFilterImportance(imp)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                filterImportance === imp
                  ? 'bg-slate-700 text-slate-100 border border-slate-600'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {imp}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Catalyst Cards List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-8 text-center text-slate-400 text-xs">
            No catalysts match the current filters.
          </div>
        ) : (
          filtered.map(item => {
            const isExpanded = expandedId === item.id;
            const isCritical = item.importance === 'CRITICAL';
            const isHigh = item.importance === 'HIGH';

            return (
              <div
                key={item.id}
                id={`catalyst-card-${item.id}`}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-lg p-4 transition shadow-sm space-y-3"
              >
                {/* Top Row: Currency, Time, Event Name, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {item.currency}
                    </span>

                    <div>
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <span>{item.event_name}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          isCritical
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                            : isHigh
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.importance}
                        </span>
                      </h3>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{new Date(item.date_time_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC</span>
                        <span>•</span>
                        <span className="text-cyan-400 font-semibold">{formatCountdown(item.date_time_utc)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      item.status === 'RELEASED'
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                        : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                    }`}>
                      {item.status}
                    </span>

                    {item.surprise && formatSurpriseBadge(item.surprise)}
                  </div>
                </div>

                {/* Macro Release Metrics: Actual / Forecast / Previous / Surprise / Change */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-950/80 rounded-md p-2.5 border border-slate-800/80 text-center font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">ACTUAL</div>
                    <div className={`font-bold text-sm ${item.actual ? 'text-slate-100' : 'text-slate-500'}`}>
                      {item.actual ?? '—'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400">FORECAST</div>
                    <div className="text-slate-300 text-sm font-medium">{item.forecast ?? '—'}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400">PREVIOUS</div>
                    <div className="text-slate-400 text-sm">{item.previous ?? '—'}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400">SURPRISE</div>
                    <div className="font-semibold">{item.surprise ?? '—'}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400">CHANGE</div>
                    <div className="text-slate-300 font-medium">{item.change ?? '—'}</div>
                  </div>
                </div>

                {/* Related Assets (Clickable) */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                  <span className="text-slate-400 text-[11px]">AFFECTED ASSETS:</span>
                  {item.related_assets.map(asset => (
                    <button
                      key={asset}
                      onClick={() => {
                        onSelectAsset?.(asset);
                        onOpenChart?.(asset);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 border border-slate-700/80 text-[11px] transition cursor-pointer flex items-center gap-1"
                      title={`Inspect ${asset}`}
                    >
                      <span>{asset}</span>
                      <BarChart2 className="w-2.5 h-2.5 text-slate-500" />
                    </button>
                  ))}
                </div>

                {/* Actual Market Reaction & Fundamental Implication */}
                <div className="bg-slate-950/40 rounded p-2.5 border border-slate-800/60 space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase block mb-0.5">
                      {item.status === 'RELEASED' ? 'ACTUAL MARKET REACTION:' : 'TRANSMISSION MECHANISM:'}
                    </span>
                    <p className="text-slate-200 leading-relaxed font-sans">
                      {item.actual_market_reaction}
                    </p>
                  </div>

                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 block">
                        FUNDAMENTAL IMPLICATION:
                      </span>
                      <p className="text-slate-300 leading-relaxed font-sans">
                        {item.fundamental_implication}
                      </p>
                      <div className="text-[10px] font-mono text-slate-500 pt-1 flex items-center justify-between">
                        <span>Source: {item.source}</span>
                        <span>Updated: {new Date(item.last_updated).toLocaleTimeString()} UTC</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expand / Collapse Action */}
                <div className="flex items-center justify-end text-xs font-mono">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="text-slate-400 hover:text-cyan-400 transition cursor-pointer flex items-center gap-1 text-[11px]"
                  >
                    <span>{isExpanded ? 'Hide Implication' : 'Deep Dive Implication'}</span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
