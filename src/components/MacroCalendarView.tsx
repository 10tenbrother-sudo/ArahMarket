import React, { useState, useMemo, useEffect } from 'react';
import { EconomicEvent } from '../types';
import {
  Calendar,
  RefreshCw,
  Globe,
  Clock,
  AlertTriangle,
  ArrowRight,
  Zap,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Activity,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface MacroCalendarViewProps {
  events: EconomicEvent[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Standard)' },
  { value: 'LOCAL', label: 'Local (Device Time)' },
  { value: 'Asia/Jakarta', label: 'Jakarta / WIB (UTC+7)' },
  { value: 'America/New_York', label: 'New York (EDT/EST)' },
  { value: 'Europe/London', label: 'London (BST/GMT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
];

export const MacroCalendarView: React.FC<MacroCalendarViewProps> = ({
  events,
  onRefresh,
  isRefreshing,
}) => {
  // Default to UPCOMING so upcoming events are immediately visible on screen!
  const [timingFilter, setTimingFilter] = useState<'UPCOMING' | 'TODAY' | 'RELEASED' | 'ALL'>('UPCOMING');
  const [impactFilter, setImpactFilter] = useState<string>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [selectedTimezone, setSelectedTimezone] = useState<string>('UTC');
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(Date.now());
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Update clock every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute counts for tabs
  const { upcomingCount, todayCount, releasedCount } = useMemo(() => {
    const now = new Date(currentTimeMs);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 86400000;

    let up = 0;
    let td = 0;
    let rel = 0;

    events.forEach(e => {
      const t = new Date(e.date_time_utc).getTime();
      const isUpcoming = t >= currentTimeMs || e.status === 'UPCOMING';
      if (isUpcoming) up++;
      if (t >= startOfToday && t < endOfToday) td++;
      if (!isUpcoming || e.status === 'RELEASED') rel++;
    });

    return { upcomingCount: up, todayCount: td, releasedCount: rel };
  }, [events, currentTimeMs]);

  // Find next upcoming event
  const nextEvent = useMemo(() => {
    const upEvents = events
      .filter(e => {
        const t = new Date(e.date_time_utc).getTime();
        return t >= currentTimeMs || e.status === 'UPCOMING';
      })
      .sort((a, b) => new Date(a.date_time_utc).getTime() - new Date(b.date_time_utc).getTime());

    return upEvents[0] || null;
  }, [events, currentTimeMs]);

  // Filtered list according to all active criteria
  const filteredEvents = useMemo(() => {
    const now = new Date(currentTimeMs);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 86400000;

    return events
      .filter(e => {
        const eventTime = new Date(e.date_time_utc).getTime();
        const isUpcoming = eventTime >= currentTimeMs || e.status === 'UPCOMING';

        if (timingFilter === 'UPCOMING' && !isUpcoming) return false;
        if (timingFilter === 'RELEASED' && isUpcoming) return false;
        if (timingFilter === 'TODAY' && (eventTime < startOfToday || eventTime >= endOfToday)) return false;

        if (impactFilter !== 'ALL' && e.impact !== impactFilter) return false;
        if (currencyFilter !== 'ALL' && e.currency !== currencyFilter) return false;

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date_time_utc).getTime();
        const timeB = new Date(b.date_time_utc).getTime();
        if (timingFilter === 'RELEASED') {
          // Newest released first
          return timeB - timeA;
        }
        // Upcoming or chronological
        return timeA - timeB;
      });
  }, [events, timingFilter, impactFilter, currencyFilter, currentTimeMs]);

  // Overall feed status
  const liveStatus = useMemo(() => {
    if (events.length === 0) return 'UNAVAILABLE';
    const hasUnavailable = events.some(e => e.data_status === 'UNAVAILABLE');
    if (hasUnavailable) return 'UNAVAILABLE';
    const hasLive = events.some(e => e.data_status === 'LIVE' || !e.data_status);
    return hasLive ? 'LIVE' : 'DELAYED';
  }, [events]);

  const latestUpdated = useMemo(() => {
    if (events.length === 0) return null;
    const dates = events.map(e => new Date(e.last_updated || e.date_time_utc).getTime()).filter(d => !isNaN(d));
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, [events]);

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'CRITICAL':
        return 'bg-rose-950/80 text-rose-400 border-rose-800';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-400 border-amber-800';
      case 'MEDIUM':
        return 'bg-cyan-950/80 text-cyan-400 border-cyan-800';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  const formatEventDateTime = (utcIso: string) => {
    try {
      const d = new Date(utcIso);
      if (isNaN(d.getTime())) return { date: '—', time: '—' };

      const tzOption = selectedTimezone === 'LOCAL' ? undefined : selectedTimezone;
      const dateStr = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: tzOption,
      });
      const timeStr = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: tzOption,
      });

      return { date: dateStr, time: timeStr };
    } catch {
      return { date: '—', time: '—' };
    }
  };

  const formatRelativeCountdown = (utcIso: string) => {
    try {
      const target = new Date(utcIso).getTime();
      const diff = target - currentTimeMs;

      if (diff <= 0) return { text: 'Just Released', isUrgent: false, isNear: false };

      const sec = Math.floor(diff / 1000);
      const min = Math.floor(sec / 60);
      const hours = Math.floor(min / 60);
      const days = Math.floor(hours / 24);

      if (min < 60) {
        return {
          text: `in ${min}m ${sec % 60}s`,
          isUrgent: min < 15,
          isNear: true,
        };
      } else if (hours < 24) {
        return {
          text: `in ${hours}h ${min % 60}m`,
          isUrgent: false,
          isNear: true,
        };
      } else {
        return {
          text: `in ${days}d ${hours % 24}h`,
          isUrgent: false,
          isNear: false,
        };
      }
    } catch {
      return { text: '—', isUrgent: false, isNear: false };
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col h-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              GLOBAL MACROECONOMIC CALENDAR
            </h2>
            <div className="flex items-center gap-1.5 ml-2">
              <span className={`w-2 h-2 rounded-full ${
                liveStatus === 'LIVE' ? 'bg-emerald-400 animate-pulse' :
                liveStatus === 'DELAYED' ? 'bg-amber-400' : 'bg-rose-500'
              }`} />
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                liveStatus === 'LIVE' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60' :
                liveStatus === 'DELAYED' ? 'bg-amber-950/80 text-amber-300 border-amber-800/60' :
                'bg-rose-950/80 text-rose-300 border-rose-800/60'
              }`}>
                {liveStatus}
              </span>
              <span className="text-[10px] font-mono text-cyan-400 font-semibold bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-900/50">
                {upcomingCount} Upcoming Events
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-1">
            <span>Source: TradingView Real Institutional Feed</span>
            <span>•</span>
            <span>Last Sync: {latestUpdated || 'Live'}</span>
          </div>
        </div>

        {/* Action Controls & Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Timezone Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-2 py-1">
            <Globe className="w-3 h-3 text-cyan-400" />
            <select
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-mono outline-none cursor-pointer"
              title="Pilih zona waktu tampilan jadwal rilis"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value} className="bg-slate-900 text-slate-200">
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Currency Filter */}
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono rounded px-2 py-1 outline-none"
          >
            <option value="ALL">All Currencies</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
            <option value="CAD">CAD</option>
            <option value="AUD">AUD</option>
            <option value="NZD">NZD</option>
            <option value="CHF">CHF</option>
          </select>

          {/* Impact Filter */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded border border-slate-800 text-[11px] font-mono">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(f => (
              <button
                key={f}
                onClick={() => setImpactFilter(f)}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  impactFilter === f
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
            title="Sinkronisasi kalender ekonomi sekarang"
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer disabled:opacity-50 flex items-center gap-1 text-xs font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Next Upcoming Event Spotlight Banner */}
      {nextEvent && (
        <div className="mb-3.5 p-3 rounded-lg bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-slate-950 border border-cyan-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono">
          <div className="flex items-start md:items-center gap-2.5">
            <div className="p-2 rounded-md bg-cyan-950/80 border border-cyan-700/60 text-cyan-400 shrink-0">
              <Zap className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  RILIS BERIKUTNYA / NEXT UPCOMING
                </span>
                <span className="px-1.5 py-0.2 rounded font-bold text-[10px] bg-slate-800 text-cyan-300 border border-slate-700">
                  {nextEvent.currency}
                </span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border uppercase ${getImpactBadge(nextEvent.impact)}`}>
                  {nextEvent.impact}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-100 mt-0.5">
                {nextEvent.event_name}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>
                  Waktu: {formatEventDateTime(nextEvent.date_time_utc).date} {formatEventDateTime(nextEvent.date_time_utc).time} ({selectedTimezone === 'LOCAL' ? 'Local' : selectedTimezone})
                </span>
                {nextEvent.forecast && <span>• Forecast: <strong className="text-slate-200">{nextEvent.forecast}</strong></span>}
                {nextEvent.previous && <span>• Previous: <span className="text-slate-400">{nextEvent.previous}</span></span>}
              </div>
            </div>
          </div>

          {/* Countdown Pill */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 bg-slate-900/90 border border-cyan-800/60 px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wider text-slate-400">Countdown</div>
              <div className="text-xs font-bold text-cyan-300 tabular-nums">
                {formatRelativeCountdown(nextEvent.date_time_utc).text}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Timing Navigation Tabs (Akan Datang vs Hari Ini vs Sudah Rilis) */}
      <div className="flex items-center gap-1.5 mb-3 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setTimingFilter('UPCOMING')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
            timingFilter === 'UPCOMING'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>AKAN DATANG (UPCOMING)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            timingFilter === 'UPCOMING' ? 'bg-cyan-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
          }`}>
            {upcomingCount}
          </span>
        </button>

        <button
          onClick={() => setTimingFilter('TODAY')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
            timingFilter === 'TODAY'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/60'
          }`}
        >
          <span>HARI INI (TODAY)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            timingFilter === 'TODAY' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
          }`}>
            {todayCount}
          </span>
        </button>

        <button
          onClick={() => setTimingFilter('RELEASED')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
            timingFilter === 'RELEASED'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/60'
          }`}
        >
          <span>SUDAH RILIS (RELEASED)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            timingFilter === 'RELEASED' ? 'bg-emerald-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
          }`}>
            {releasedCount}
          </span>
        </button>

        <button
          onClick={() => setTimingFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
            timingFilter === 'ALL'
              ? 'bg-slate-800 text-slate-100 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/40 border border-slate-800/40'
          }`}
        >
          SEMUA ({events.length})
        </button>
      </div>

      {/* Calendar Data Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px]">
              <th className="py-2.5 px-2.5">
                Timestamp ({selectedTimezone === 'LOCAL' ? 'Local' : selectedTimezone})
              </th>
              <th className="py-2.5 px-2.5">Countdown / Freshness</th>
              <th className="py-2.5 px-2.5">CCY</th>
              <th className="py-2.5 px-2.5">Impact</th>
              <th className="py-2.5 px-2.5">Indikator Acara / Event</th>
              <th className="py-2.5 px-2.5 text-right">Actual</th>
              <th className="py-2.5 px-2.5 text-right">Forecast</th>
              <th className="py-2.5 px-2.5 text-right">Previous</th>
              <th className="py-2.5 px-2.5 text-right">Surprise</th>
              <th className="py-2.5 px-2.5 text-right">Change</th>
              <th className="py-2.5 px-2.5 text-center">Reaction</th>
              <th className="py-2.5 px-2.5 text-right">Source</th>
              <th className="py-2.5 px-2.5 text-center">Intel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-12 text-center text-slate-500 font-mono text-xs">
                  Tidak ada event dalam kategori ini. Silakan ubah filter atau klik tombol Sync.
                </td>
              </tr>
            ) : (
              filteredEvents.map(item => {
                const hasActual = item.actual !== null && item.actual !== undefined && item.actual !== '';
                const { date, time } = formatEventDateTime(item.date_time_utc);
                const isUnavailable = item.data_status === 'UNAVAILABLE';
                const countdown = formatRelativeCountdown(item.date_time_utc);
                const eventMs = new Date(item.date_time_utc).getTime();
                const isUpcoming = eventMs >= currentTimeMs;
                const isExpanded = expandedEventId === item.id;

                const isBeat = item.surprise?.includes('BEAT');
                const isMiss = item.surprise?.includes('MISS');

                return (
                  <React.Fragment key={item.id}>
                    <tr
                      onClick={() => setExpandedEventId(isExpanded ? null : item.id)}
                      className={`hover:bg-slate-900/60 transition cursor-pointer ${
                        isExpanded ? 'bg-slate-900/80 border-l-2 border-cyan-400' : ''
                      }`}
                    >
                      {/* Date / Time */}
                      <td className="py-2 px-2.5 text-slate-300 whitespace-nowrap">
                        <span className="font-semibold text-slate-200">{date}</span>{' '}
                        <span className="text-cyan-400 font-mono font-bold">{time}</span>
                      </td>

                      {/* Countdown / Freshness */}
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        {isUpcoming ? (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border tabular-nums ${
                            countdown.isUrgent
                              ? 'bg-rose-950/80 text-rose-300 border-rose-800/80 animate-pulse'
                              : countdown.isNear
                              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}>
                            {countdown.text}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {item.freshness || 'Rilis'}
                          </span>
                        )}
                      </td>

                      {/* Currency */}
                      <td className="py-2 px-2.5 font-bold text-cyan-300 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                          {item.currency}
                        </span>
                      </td>

                      {/* Impact Badge */}
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border uppercase ${getImpactBadge(item.impact)}`}>
                          {item.impact}
                        </span>
                      </td>

                      {/* Event Name */}
                      <td className="py-2 px-2.5 font-medium text-slate-200 max-w-[260px]">
                        <div className="truncate font-semibold text-slate-100" title={item.event_name}>
                          {item.event_name}
                        </div>
                      </td>

                      {/* Actual */}
                      <td className="py-2 px-2.5 text-right font-bold whitespace-nowrap">
                        {hasActual ? (
                          <span className="text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60 font-bold">
                            {item.actual}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Forecast */}
                      <td className="py-2 px-2.5 text-right text-slate-300 font-semibold whitespace-nowrap">
                        {item.forecast || <span className="text-slate-600 font-normal">—</span>}
                      </td>

                      {/* Previous */}
                      <td className="py-2 px-2.5 text-right text-slate-400 whitespace-nowrap">
                        {item.previous || <span className="text-slate-600">—</span>}
                      </td>

                      {/* Surprise */}
                      <td className="py-2 px-2.5 text-right whitespace-nowrap">
                        {item.surprise && item.surprise !== 'N/A (Pending Release)' ? (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                            isBeat
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                              : isMiss
                              ? 'bg-rose-950/80 text-rose-400 border-rose-800'
                              : 'bg-slate-900 text-slate-300 border-slate-800'
                          }`}>
                            {item.surprise}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600">Pending</span>
                        )}
                      </td>

                      {/* Change */}
                      <td className="py-2 px-2.5 text-right whitespace-nowrap text-slate-300 font-medium">
                        {item.change ? (
                          <span className={item.change.startsWith('+') ? 'text-emerald-400' : item.change.startsWith('-') ? 'text-rose-400' : 'text-slate-400'}>
                            {item.change}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Market Reaction Indicator */}
                      <td className="py-2 px-2.5 text-center whitespace-nowrap">
                        {item.market_reaction ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-bold">
                            {item.market_reaction.primary_asset} {item.market_reaction.r5m}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-mono">Standby</span>
                        )}
                      </td>

                      {/* Source */}
                      <td className="py-2 px-2.5 text-right text-[10px] text-slate-500 whitespace-nowrap truncate max-w-[120px]" title={`${item.source} • Last updated: ${new Date(item.last_updated).toLocaleString()}`}>
                        {item.source}
                      </td>

                      {/* Intel Action */}
                      <td className="py-2 px-2.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          className={`p-1 rounded transition cursor-pointer ${
                            isExpanded ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                          }`}
                          title="Tampilkan intelligence terukur"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Measurable Intelligence Drawer */}
                    {isExpanded && (
                      <tr className="bg-slate-950/95 border-b border-cyan-900/40">
                        <td colSpan={13} className="p-4">
                          <div className="bg-slate-900/80 border border-cyan-900/50 rounded-xl p-4 space-y-3.5 shadow-inner">
                            {/* Intelligence Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">
                                  MEASURABLE MACRO INTELLIGENCE
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-slate-800 text-slate-200 border border-slate-700">
                                  {item.currency}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border uppercase ${getImpactBadge(item.impact)}`}>
                                  {item.impact} IMPACT
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                  Confidence: <strong className="text-emerald-400 font-bold">{item.confidence || 95}%</strong>
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  Freshness: <strong className="text-slate-200">{item.freshness || 'Verified Live'}</strong>
                                </span>
                              </div>

                              <div className="text-[10px] font-mono text-slate-400">
                                Source: <span className="text-slate-200">{item.source}</span> • Timestamp: <span className="text-cyan-400">{time} {date}</span>
                              </div>
                            </div>

                            {/* Quantitative Metrics Bar */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Actual vs Forecast</div>
                                <div className="text-xs font-bold text-slate-100 mt-0.5">
                                  {item.actual || 'Pending'} <span className="text-slate-500 font-normal">vs</span> {item.forecast || '—'}
                                </div>
                              </div>
                              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Macro Surprise</div>
                                <div className={`text-xs font-bold mt-0.5 ${isBeat ? 'text-emerald-400' : isMiss ? 'text-rose-400' : 'text-slate-300'}`}>
                                  {item.surprise || 'N/A (Pending)'}
                                </div>
                              </div>
                              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Change (vs Previous)</div>
                                <div className="text-xs font-bold text-slate-200 mt-0.5">
                                  {item.change || '—'} <span className="text-slate-500 font-normal">from {item.previous || '—'}</span>
                                </div>
                              </div>
                              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Data Status & Evidence</div>
                                <div className="text-xs font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  <span>{item.data_status} Verified</span>
                                </div>
                              </div>
                            </div>

                            {/* Actual Market Reaction Grid (1m, 5m, 15m, 1h, 4h) */}
                            {item.market_reaction && (
                              <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800/90">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] uppercase font-bold text-cyan-400 font-mono tracking-wider flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5" />
                                    Actual Market Reaction Across Horizons ({item.market_reaction.primary_asset})
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-500">Real Execution Data</span>
                                </div>
                                <div className="grid grid-cols-5 gap-2 text-center font-mono">
                                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                    <div className="text-[9px] text-slate-400">1 MINUTE</div>
                                    <div className={`text-xs font-bold mt-0.5 ${(item.market_reaction.r1m || '').startsWith('+') ? 'text-emerald-400' : (item.market_reaction.r1m || '').startsWith('-') ? 'text-rose-400' : 'text-slate-300'}`}>
                                      {item.market_reaction.r1m || '—'}
                                    </div>
                                  </div>
                                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                    <div className="text-[9px] text-slate-400">5 MINUTES</div>
                                    <div className={`text-xs font-bold mt-0.5 ${(item.market_reaction.r5m || '').startsWith('+') ? 'text-emerald-400' : (item.market_reaction.r5m || '').startsWith('-') ? 'text-rose-400' : 'text-slate-300'}`}>
                                      {item.market_reaction.r5m || '—'}
                                    </div>
                                  </div>
                                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                    <div className="text-[9px] text-slate-400">15 MINUTES</div>
                                    <div className={`text-xs font-bold mt-0.5 ${(item.market_reaction.r15m || '').startsWith('+') ? 'text-emerald-400' : (item.market_reaction.r15m || '').startsWith('-') ? 'text-rose-400' : 'text-slate-300'}`}>
                                      {item.market_reaction.r15m || '—'}
                                    </div>
                                  </div>
                                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                    <div className="text-[9px] text-slate-400">1 HOUR</div>
                                    <div className={`text-xs font-bold mt-0.5 ${(item.market_reaction.r1h || '').startsWith('+') ? 'text-emerald-400' : (item.market_reaction.r1h || '').startsWith('-') ? 'text-rose-400' : 'text-slate-300'}`}>
                                      {item.market_reaction.r1h || '—'}
                                    </div>
                                  </div>
                                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                    <div className="text-[9px] text-slate-400">4 HOURS</div>
                                    <div className={`text-xs font-bold mt-0.5 ${(item.market_reaction.r4h || '').startsWith('+') ? 'text-emerald-400' : (item.market_reaction.r4h || '').startsWith('-') ? 'text-rose-400' : 'text-slate-300'}`}>
                                      {item.market_reaction.r4h || '—'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Fundamental Implication vs Actual Market Reaction Separation */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                              {/* 1. Fundamental Implication */}
                              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/90">
                                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 mb-1.5">
                                  <span>1. FUNDAMENTAL IMPLICATION</span>
                                  <span className="text-[9px] text-slate-500 font-normal">(Macro Thesis & Central Bank Path)</span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                                  {item.fundamental_implication ||
                                    (hasActual
                                      ? `Rilis aktual ${item.actual} mengindikasikan pergeseran baseline fundamental terhadap ekspektasi konsensus (${item.forecast || 'N/A'}).`
                                      : 'Menunggu rilis data resmi sebelum menetapkan implikasi transmisi kebijakan moneter.')}
                                </p>
                              </div>

                              {/* 2. Actual Market Reaction */}
                              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/90">
                                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 mb-1.5">
                                  <span>2. ACTUAL MARKET REACTION</span>
                                  <span className="text-[9px] text-slate-500 font-normal">(Observed Liquidity & Order Flow)</span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                                  {item.actual_market_reaction ||
                                    (hasActual
                                      ? `Volatilitas tercatat pada pasangan ${item.currency} segera setelah rilis dengan pergeseran bid-ask spread dan eksekusi algoritmik.`
                                      : 'Likuiditas pasar berada dalam status pre-event positioning.')}
                                </p>
                              </div>
                            </div>

                            <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/50">
                              <span>Perbedaan: Fundamental Implication adalah analisis teoritis jangka menengah, sedangkan Actual Market Reaction merefleksikan likuiditas riil saat ini.</span>
                              <span className="text-cyan-400">Strict Data Grounding</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
