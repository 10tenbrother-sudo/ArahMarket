import React from 'react';
import { MarketPrice } from '../types';
import { TrendingUp, TrendingDown, Minus, LineChart } from 'lucide-react';

interface TickerBarProps {
  prices: MarketPrice[];
  selectedSymbol: string | null;
  onSelectSymbol: (symbol: string) => void;
  onOpenChart?: (symbol: string) => void;
}

export const TickerBar: React.FC<TickerBarProps> = ({
  prices,
  selectedSymbol,
  onSelectSymbol,
  onOpenChart,
}) => {
  return (
    <div className="bg-slate-950 border-b border-slate-800/80 overflow-x-auto no-scrollbar py-1.5 px-3 flex items-center gap-3">
      <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-slate-800 text-[11px] font-mono text-slate-500 font-semibold uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>REAL-TIME STREAM</span>
      </div>

      {onOpenChart && (
        <button
          onClick={() => onOpenChart('US30')}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-cyan-800/80 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 text-[11px] font-mono font-medium shrink-0 transition cursor-pointer"
          title="Open Non-Delayed TradingView Charts (US30, SPX500, BTCUSD, DXY, US100)"
        >
          <LineChart className="w-3 h-3" />
          <span>Non-Delayed Charts</span>
        </button>
      )}

      <div className="flex items-center gap-2">
        {prices.map(item => {
          const isSelected = selectedSymbol === item.symbol;
          const isPositive = item.change_24h_pct > 0;
          const isNegative = item.change_24h_pct < 0;

          // Decimal precision based on asset class
          let formattedPrice = item.price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: item.symbol === 'JPY' || item.asset_type === 'FOREX' ? 4 : 2,
          });

          return (
            <button
              key={item.symbol}
              onClick={() => onSelectSymbol(item.symbol)}
              className={`flex items-center gap-2 px-2.5 py-1 rounded border text-xs font-mono transition cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-cyan-950/70 border-cyan-500 text-white shadow-sm'
                  : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-200">{item.symbol}</span>
                <span
                  className={`text-[9px] ${
                    item.status === 'LIVE'
                      ? 'text-emerald-400'
                      : item.status === 'DELAYED'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                  title={`${item.status} • ${item.source}`}
                >
                  ●
                </span>
              </div>

              <span className="font-semibold text-slate-100 tabular-nums">{formattedPrice}</span>

              <div
                className={`flex items-center gap-0.5 text-[11px] font-medium tabular-nums ${
                  isPositive
                    ? 'text-emerald-400'
                    : isNegative
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : isNegative ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                <span>
                  {isPositive ? '+' : ''}
                  {item.change_24h_pct.toFixed(2)}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
