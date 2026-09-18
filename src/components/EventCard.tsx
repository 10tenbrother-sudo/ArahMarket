import React from 'react';
import { MarketEvent } from '../types';
import { Layers, ShieldAlert, Sparkles, Clock, Globe } from 'lucide-react';

interface EventCardProps {
  event: MarketEvent;
  onClick: () => void;
  isSelected?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onClick, isSelected }) => {
  const getImpactBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-950/80 text-rose-400 border-rose-800/80';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-400 border-amber-800/80';
      case 'MEDIUM':
        return 'bg-cyan-950/80 text-cyan-400 border-cyan-800/80';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div
      onClick={onClick}
      className={`p-3.5 rounded-lg border transition cursor-pointer ${
        isSelected
          ? 'bg-slate-900/90 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/30'
          : 'bg-slate-950/70 hover:bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border uppercase tracking-wider ${getImpactBadge(event.impact_level)}`}>
            {event.impact_level}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono uppercase">
            {event.primary_category}
          </span>
          {event.source_count > 1 && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-mono font-medium">
              <Layers className="w-2.5 h-2.5 text-indigo-400" />
              <span>{event.source_count} SOURCES LINKED</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 shrink-0">
          <Clock className="w-3 h-3" />
          <span>{timeAgo(event.first_detected_at)}</span>
        </div>
      </div>

      {/* Event Title */}
      <h3 className="text-sm font-semibold text-slate-100 hover:text-cyan-300 transition leading-snug mb-1.5">
        {event.title}
      </h3>

      {/* Event Summary */}
      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
        {event.summary}
      </p>

      {/* Sources Consolidated Ribbon */}
      <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
        <span className="text-[10px] font-mono text-slate-500">SOURCES:</span>
        {(event.source_names || []).map((name, i) => (
          <span
            key={i}
            className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800/80"
          >
            {name}
          </span>
        ))}
      </div>

      {/* Bottom Asset & Currency Impact Tags */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-900 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(event.affected_currencies || []).length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-slate-500">FX:</span>
              {event.affected_currencies.map(c => (
                <span key={c} className="text-cyan-400 font-semibold">{c}</span>
              ))}
            </div>
          )}
          {(event.affected_assets || []).length > 0 && (
            <div className="flex items-center gap-1 ml-2">
              <span className="text-slate-500">ASSETS:</span>
              {event.affected_assets.slice(0, 4).map(a => (
                <span key={a} className="text-amber-400 font-semibold">{a}</span>
              ))}
              {event.affected_assets.length > 4 && (
                <span className="text-slate-500">+{event.affected_assets.length - 4}</span>
              )}
            </div>
          )}
        </div>

        <span className="text-[11px] text-cyan-400 hover:underline font-sans font-medium shrink-0">
          Analyze Event →
        </span>
      </div>
    </div>
  );
};
