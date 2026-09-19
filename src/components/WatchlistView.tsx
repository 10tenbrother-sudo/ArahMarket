import React, { useState } from 'react';
import { UserWatchlist, MarketPrice, User } from '../types';
import { Star, Trash2, Plus, TrendingUp, TrendingDown, Minus, LogIn, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { getUserLimits } from '../lib/plans';

interface WatchlistViewProps {
  watchlist: UserWatchlist[];
  prices: MarketPrice[];
  onRemove: (symbol: string) => void;
  onAdd: (symbol: string, assetType: string) => void;
  onSelectSymbol: (symbol: string) => void;
  user?: User | null;
  onOpenAuth?: () => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  watchlist,
  prices,
  onRemove,
  onAdd,
  onSelectSymbol,
  user,
  onOpenAuth,
}) => {
  const [newSymbol, setNewSymbol] = useState('');
  const [newType, setNewType] = useState('ASSET');

  const limits = getUserLimits(user as any);
  const isAtLimit = watchlist.length >= limits.watchlistLimit;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol) return;
    if (isAtLimit) {
      return;
    }
    onAdd(newSymbol.toUpperCase().trim(), newType);
    setNewSymbol('');
  };

  const commonAssets = ['XAUUSD', 'BTC', 'US30', 'US500', 'US100', 'EUR', 'GBP', 'JPY'];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              TRADER PERSONAL WATCHLIST ({watchlist.length}/{limits.watchlistLimit})
            </h2>
            {isAtLimit && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                PLAN QUOTA REACHED
              </span>
            )}
          </div>
          <p className="text-[10px] font-mono text-slate-500 mt-0.5">
            Private tracking list with real-time price updates & correlation monitoring
          </p>
        </div>

        {/* Add custom symbol form */}
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Add Symbol (e.g. XAUUSD)"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-xs font-mono text-slate-200 placeholder:text-slate-600 outline-none w-44"
          />
          <button
            type="submit"
            className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono transition cursor-pointer"
          >
            + Add
          </button>
        </form>
      </div>

      {/* Guest Mode Notice */}
      {!user && (
        <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-cyan-300">
            <LogIn className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Mode Tamu Aktif: Masuk akun Trader untuk menyimpan watchlist ini secara permanen ke Cloud.
            </span>
          </div>
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[11px] transition cursor-pointer shrink-0"
            >
              Trader Login
            </button>
          )}
        </div>
      )}

      {/* Quick Add Pills */}
      <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
        <span className="text-slate-500 text-[10px]">QUICK ADD:</span>
        {commonAssets.map(sym => {
          const isAdded = watchlist.some(w => w.symbol === sym);
          return (
            <button
              key={sym}
              disabled={isAdded}
              onClick={() => onAdd(sym, 'ASSET')}
              className={`px-2 py-0.5 rounded border text-[11px] transition cursor-pointer ${
                isAdded
                  ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-default'
                  : 'bg-slate-900/60 hover:bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {isAdded ? `✓ ${sym}` : `+ ${sym}`}
            </button>
          );
        })}
      </div>

      {/* Watchlist Table */}
      {watchlist.length === 0 ? (
        <div className="py-12 text-center text-xs font-mono text-slate-500 bg-slate-900/20 rounded-lg border border-slate-800/60">
          Your watchlist is currently empty. Click the star on any market instrument to track it here.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px]">
                <th className="py-2 px-2.5">Symbol / Asset</th>
                <th className="py-2 px-2.5 text-right">Price</th>
                <th className="py-2 px-2.5 text-right">24h Change</th>
                <th className="py-2 px-2.5 text-right">24h High</th>
                <th className="py-2 px-2.5 text-right">24h Low</th>
                <th className="py-2 px-2.5 text-center">Status</th>
                <th className="py-2 px-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {watchlist.map(item => {
                const price = prices.find(p => p.symbol === item.symbol) || item.market_data;
                const isPos = price ? price.change_24h_pct > 0 : false;
                const isNeg = price ? price.change_24h_pct < 0 : false;

                return (
                  <tr
                    key={item.symbol}
                    onClick={() => onSelectSymbol(item.symbol)}
                    className="hover:bg-slate-900/40 transition cursor-pointer"
                  >
                    <td className="py-2.5 px-2.5">
                      <div className="font-bold text-slate-100">{item.symbol}</div>
                      <div className="text-[10px] text-slate-500">{price?.display_name || item.asset_type}</div>
                    </td>

                    <td className="py-2.5 px-2.5 text-right font-bold text-slate-100 tabular-nums">
                      {price ? price.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                    </td>

                    <td className="py-2.5 px-2.5 text-right tabular-nums">
                      {price ? (
                        <span className={`inline-flex items-center gap-0.5 font-bold ${
                          isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-slate-400'
                        }`}>
                          {isPos ? '+' : ''}{price.change_24h_pct.toFixed(2)}%
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-2.5 px-2.5 text-right text-slate-400 tabular-nums">
                      {price?.high_24h.toFixed(1) || '—'}
                    </td>

                    <td className="py-2.5 px-2.5 text-right text-slate-400 tabular-nums">
                      {price?.low_24h.toFixed(1) || '—'}
                    </td>

                    <td className="py-2.5 px-2.5 text-center">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        price?.status === 'LIVE' ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-800' : 'text-slate-400'
                      }`}>
                        {price?.status || 'SAVED'}
                      </span>
                    </td>

                    <td className="py-2.5 px-2.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(item.symbol);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
