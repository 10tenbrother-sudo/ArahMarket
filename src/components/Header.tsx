import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu,
  Search,
  Globe2,
  RefreshCw,
  Clock,
  X,
} from 'lucide-react';
import { SSEConnectionState } from '../lib/useSSE';
import { NavTabId } from './Sidebar';

interface HeaderProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  sseStatus: SSEConnectionState;
  sessions: any[];
  onTriggerGlobalSync: () => void;
  isSyncing: boolean;
  onToggleMobileMenu: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  sseStatus,
  sessions,
  onTriggerGlobalSync,
  isSyncing,
  onToggleMobileMenu,
  searchQuery = '',
  onSearchChange,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format as compact "HH:MM:SS UTC"
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${hours}:${minutes}:${seconds} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatViewLabel = (tab: NavTabId) => {
    switch (tab) {
      case 'terminal':
        return 'Overview Dashboard';
      case 'intraday_map':
        return 'Intraday Market Map';
      case 'today_catalysts':
        return "Today's Catalysts";
      case 'markets':
        return 'Market Surveillance';
      case 'currency':
        return 'Currency Strength';
      case 'macro':
        return 'Macro Calendar';
      case 'events':
        return 'Canonical News Wire';
      case 'intelligence':
        return 'AI Intelligence';
      case 'watchlist':
        return 'Watchlist';
      case 'admin':
        return 'System & Feeds';
      case 'plans':
        return 'Subscription & Pricing';
      default:
        return tab;
    }
  };

  // Only display currently active / open sessions to eliminate clutter
  const activeSessions = useMemo(() => {
    return (sessions || []).filter(s => s.current_status === 'OPEN');
  }, [sessions]);

  return (
    <header className="border-b border-slate-800/90 bg-slate-950/95 backdrop-blur-md sticky top-0 z-30 shrink-0" id="nexus-header">
      <div className="h-13 px-3 sm:px-5 flex items-center justify-between gap-3">
        {/* Left Section: Mobile Menu + Clean View Title + Live Dot */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onToggleMobileMenu}
            className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 lg:hidden cursor-pointer"
            title="Open Menu"
            id="mobile-menu-toggle-btn"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-sm font-mono font-semibold text-slate-100 tracking-wide">
              {formatViewLabel(activeTab)}
            </h1>

            {/* Minimal Live Stream Dot */}
            <span
              className="relative flex h-2 w-2"
              title={sseStatus === 'CONNECTED' ? 'Live Stream Connected' : 'Reconnecting...'}
            >
              {sseStatus === 'CONNECTED' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              )}
            </span>
          </div>
        </div>

        {/* Center Section: Compact Sleek Search Bar */}
        {onSearchChange && (
          <div className="hidden md:flex items-center relative w-64 lg:w-80 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search assets, news, catalysts..."
              className="w-full bg-slate-900/80 border border-slate-800 focus:border-cyan-500/60 rounded-md pl-9 pr-7 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition font-mono shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Right Section: Active Open Sessions + Clean UTC Time + Sync Button */}
        <div className="flex items-center gap-2 sm:gap-2.5 text-xs font-mono shrink-0">
          {/* Active Trading Session (Only show OPEN sessions, no CLOSED clutter) */}
          {activeSessions.length > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/70 border border-slate-800/80 text-[11px]">
              <Globe2 className="w-3 h-3 text-cyan-400" />
              <span className="text-slate-400">SESSION:</span>
              <div className="flex items-center gap-1">
                {activeSessions.map(s => (
                  <span
                    key={s.session_name}
                    className="px-1.5 py-0.2 rounded font-bold text-[9px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
                  >
                    {s.session_name} OPEN
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Clean UTC Live Time */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 tabular-nums">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{utcTime || 'UTC'}</span>
          </div>

          {/* Global Ingestion Sync Trigger */}
          <button
            onClick={onTriggerGlobalSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 hover:border-slate-700 transition cursor-pointer disabled:opacity-50 text-xs font-mono"
            title="Sync all live market data and news"
            id="global-sync-btn"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline text-[11px]">{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
