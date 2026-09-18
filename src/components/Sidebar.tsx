import React from 'react';
import {
  LayoutDashboard,
  Compass,
  Zap,
  Activity,
  TrendingUp,
  Calendar,
  Radio,
  Brain,
  Star,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
  Layers,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import { User } from '../types';

export type NavTabId =
  | 'terminal'
  | 'intraday_map'
  | 'today_catalysts'
  | 'markets'
  | 'currency'
  | 'macro'
  | 'events'
  | 'intelligence'
  | 'watchlist'
  | 'admin';

interface SidebarProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  isOpen: boolean; // mobile drawer open state
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  marketMapCount?: number;
  catalystsCount?: number;
  user?: User | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  marketMapCount = 13,
  catalystsCount,
  user,
  onOpenAuth,
  onLogout,
}) => {
  const navGroups = [
    {
      label: 'SURVEILLANCE & BIAS',
      items: [
        {
          id: 'terminal' as NavTabId,
          label: 'Overview Dashboard',
          shortLabel: 'Overview',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          id: 'intraday_map' as NavTabId,
          label: "Today's Market Map",
          shortLabel: 'Market Map',
          icon: Compass,
          badge: `${marketMapCount}`,
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        },
        {
          id: 'today_catalysts' as NavTabId,
          label: "Today's Catalysts",
          shortLabel: 'Catalysts',
          icon: Zap,
          badge: catalystsCount !== undefined ? `${catalystsCount}` : null,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
      ],
    },
    {
      label: 'MARKETS & FLOWS',
      items: [
        {
          id: 'markets' as NavTabId,
          label: 'Market Surveillance',
          shortLabel: 'Markets',
          icon: Activity,
          badge: null,
        },
        {
          id: 'currency' as NavTabId,
          label: 'Currency Strength (G8)',
          shortLabel: 'Currency',
          icon: TrendingUp,
          badge: 'G8',
          badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
        },
      ],
    },
    {
      label: 'INTELLIGENCE & WIRE',
      items: [
        {
          id: 'macro' as NavTabId,
          label: 'Macro Calendar',
          shortLabel: 'Macro',
          icon: Calendar,
          badge: null,
        },
        {
          id: 'events' as NavTabId,
          label: 'Canonical Wire',
          shortLabel: 'News Wire',
          icon: Radio,
          badge: 'LIVE',
          badgeColor: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
        },
        {
          id: 'intelligence' as NavTabId,
          label: 'AI Market Intelligence',
          shortLabel: 'AI Intel',
          icon: Brain,
          badge: null,
        },
      ],
    },
    {
      label: 'ACCOUNT & SYSTEM',
      items: [
        {
          id: 'watchlist' as NavTabId,
          label: 'My Watchlist',
          shortLabel: 'Watchlist',
          icon: Star,
          badge: null,
        },
        {
          id: 'admin' as NavTabId,
          label: 'Feeds & System Health',
          shortLabel: 'Admin',
          icon: Settings,
          badge: null,
        },
      ],
    },
  ];

  const handleSelect = (id: NavTabId) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="nexus-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-950 border-r border-slate-800/90 flex flex-col transition-all duration-200 ease-in-out lg:static ${
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-18' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-14 border-b border-slate-800/90 px-4 flex items-center justify-between shrink-0 bg-slate-950">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shrink-0 shadow-sm">
              <Compass className="w-5 h-5 text-slate-950" />
            </div>
            {(!isCollapsed || isOpen) && (
              <div className="truncate">
                <div className="font-mono font-bold text-sm tracking-wider text-slate-100 flex items-center gap-1.5">
                  <span>NEXUS</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                    TERMINAL
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>MACRO ENGINE</span>
                </div>
              </div>
            )}
          </div>

          {/* Close for mobile, collapse toggle for desktop */}
          <div className="flex items-center">
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-200 lg:hidden cursor-pointer"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition cursor-pointer"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              id="toggle-sidebar-collapse-btn"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5 scrollbar-thin">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {(!isCollapsed || isOpen) && (
                <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  {group.label}
                </div>
              )}

              {group.items.map(item => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition cursor-pointer group relative ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                    }`}
                    title={isCollapsed && !isOpen ? item.label : undefined}
                    id={`nav-item-${item.id}`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition ${
                        isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />

                    {(!isCollapsed || isOpen) && (
                      <span className="truncate flex-1 text-left">
                        {item.label}
                      </span>
                    )}

                    {(!isCollapsed || isOpen) && item.badge && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                          item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Active Indicator Bar on Collapsed View */}
                    {isCollapsed && !isOpen && isActive && (
                      <span className="absolute right-0 top-1.5 bottom-1.5 w-1 rounded-l bg-cyan-400" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer: Feed System & User Profile (Bottom Left Corner) */}
        <div className="p-3 border-t border-slate-800/90 bg-slate-950 shrink-0 font-mono text-[11px] text-slate-400" id="sidebar-footer-corner">
          {(!isCollapsed || isOpen) ? (
            <div className="space-y-2.5">
              {/* Feed System Status */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span className="text-slate-300 font-semibold text-[10px] tracking-wider">FEED: LIVE</span>
                </div>
                <span className="text-[9px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">PORT 3000</span>
              </div>

              {/* User Profile / Auth Control below Feed System */}
              {user ? (
                <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-900/70 border border-slate-800/90" id="sidebar-user-card">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-linear-to-br from-cyan-600 to-blue-700 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs border border-cyan-400/30">
                      {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-100 truncate leading-tight font-sans">
                        {user.name}
                      </div>
                      <div className="text-[9px] text-cyan-400 font-mono leading-tight">
                        {user.role || 'TRADER'}
                      </div>
                    </div>
                  </div>

                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition cursor-pointer shrink-0"
                      title="Sign out"
                      id="sidebar-logout-btn"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-md bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/60 text-xs font-semibold transition cursor-pointer"
                  id="sidebar-login-btn"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Trader Login</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5">
              {/* Collapsed Feed Dot */}
              <div className="flex justify-center pb-2 border-b border-slate-850 w-full" title="Feed: LIVE (Port 3000)">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>

              {/* Collapsed User Avatar or Login Button */}
              {user ? (
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-7 h-7 rounded-md bg-linear-to-br from-cyan-600 to-blue-700 text-white font-bold flex items-center justify-center text-[10px] shrink-0 border border-cyan-400/30 cursor-default"
                    title={`${user.name} (${user.role || 'TRADER'})`}
                  >
                    {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                  </div>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition cursor-pointer"
                      title="Sign out"
                    >
                      <LogOut className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="p-1.5 rounded-md bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 transition cursor-pointer"
                  title="Trader Login"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
