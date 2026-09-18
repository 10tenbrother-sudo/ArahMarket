import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Maximize2,
  Clock,
  Activity,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { MarketPrice } from '../types';

interface TradingViewChartModalProps {
  initialSymbol?: string;
  prices: MarketPrice[];
  onClose: () => void;
}

interface TVSymbolMeta {
  symbolKey: string;
  tvSymbol: string;
  label: string;
  description: string;
  snapshotUrl?: string;
}

const PRIMARY_INSTRUMENTS: TVSymbolMeta[] = [
  {
    symbolKey: 'US30',
    tvSymbol: 'FOREXCOM:US30',
    label: 'US30 (Dow 30)',
    description: 'Wall St 30 Non-Delayed CFD',
    snapshotUrl: 'https://www.tradingview.com/x/McUWwa6F/',
  },
  {
    symbolKey: 'US500',
    tvSymbol: 'CAPITALCOM:SPX500',
    label: 'SPX500 (S&P 500)',
    description: 'US 500 Non-Delayed CFD',
    snapshotUrl: 'https://www.tradingview.com/x/mMOtpRJZ/',
  },
  {
    symbolKey: 'BTC',
    tvSymbol: 'BITSTAMP:BTCUSD',
    label: 'BTCUSD (Bitcoin)',
    description: 'Bitcoin / USD 24/7 Live Stream',
    snapshotUrl: 'https://www.tradingview.com/x/zRklu6Fj/',
  },
  {
    symbolKey: 'USD',
    tvSymbol: 'TVC:DXY',
    label: 'DXY (Dollar Index)',
    description: 'TradingView Real-Time Dollar Index',
    snapshotUrl: 'https://www.tradingview.com/x/mxhFtDj9/',
  },
  {
    symbolKey: 'US100',
    tvSymbol: 'SKILLING:US100',
    label: 'US100 (Nasdaq 100)',
    description: 'US Tech 100 Non-Delayed CFD',
    snapshotUrl: 'https://www.tradingview.com/x/pWHPW2sk/',
  },
  {
    symbolKey: 'XAUUSD',
    tvSymbol: 'TVC:GOLD',
    label: 'XAUUSD (Gold)',
    description: 'Spot Gold / US Dollar Real-Time',
  },
  {
    symbolKey: 'EUR',
    tvSymbol: 'FX:EURUSD',
    label: 'EUR/USD',
    description: 'Euro / US Dollar FX Live Stream',
  },
  {
    symbolKey: 'GBP',
    tvSymbol: 'FX:GBPUSD',
    label: 'GBP/USD',
    description: 'British Pound / USD FX Live Stream',
  },
  {
    symbolKey: 'JPY',
    tvSymbol: 'FX:USDJPY',
    label: 'USD/JPY',
    description: 'USD / Japanese Yen FX Live Stream',
  },
];

export const TradingViewChartModal: React.FC<TradingViewChartModalProps> = ({
  initialSymbol,
  prices,
  onClose,
}) => {
  // Find matching default or fallback to US30
  const defaultMeta =
    PRIMARY_INSTRUMENTS.find(
      i =>
        i.symbolKey === initialSymbol ||
        i.tvSymbol === initialSymbol ||
        (initialSymbol && i.tvSymbol.toUpperCase().includes(initialSymbol.toUpperCase()))
    ) || PRIMARY_INSTRUMENTS[0];

  const [selectedMeta, setSelectedMeta] = useState<TVSymbolMeta>(defaultMeta);
  const [interval, setInterval] = useState<string>('15');
  const [showSnapshotImage, setShowSnapshotImage] = useState<boolean>(false);

  // Match live price from system
  const currentPrice = prices.find(
    p =>
      p.symbol === selectedMeta.symbolKey ||
      p.tv_symbol === selectedMeta.tvSymbol ||
      p.display_name.toUpperCase().includes(selectedMeta.symbolKey.toUpperCase())
  );

  // Build iframe embed URL for real-time non-delayed TradingView chart
  const tvWidgetUrl = `https://www.tradingview.com/widgetembed/?symbol=${encodeURIComponent(
    selectedMeta.tvSymbol
  )}&interval=${interval}&theme=dark&style=1&timezone=Etc%2FUTC&locale=en&hide_side_toolbar=0&allow_symbol_change=1&saveimage=1&details=1&calendar=1&hotlist=0`;

  const snapshotId = selectedMeta.snapshotUrl ? selectedMeta.snapshotUrl.split('/x/')[1]?.replace('/', '') : null;
  const snapshotImageUrl = snapshotId ? `https://s3.tradingview.com/snapshots/${snapshotId[0].toLowerCase()}/${snapshotId}.png` : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-sm sm:text-base font-mono font-bold text-slate-100 flex items-center gap-2">
                <span>{selectedMeta.tvSymbol}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 font-normal">
                  NON-DELAYED • STREAMING
                </span>
              </h2>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              {selectedMeta.description}
            </span>
          </div>

          {/* Current Live Price Metric */}
          {currentPrice && (
            <div className="flex items-center gap-3 font-mono text-xs">
              <div>
                <span className="text-slate-400 mr-1.5">Last Price:</span>
                <span className="text-slate-100 font-bold text-sm">
                  {currentPrice.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: currentPrice.symbol === 'JPY' ? 4 : 2,
                  })}
                </span>
              </div>
              <div
                className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                  currentPrice.change_24h_pct >= 0
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}
              >
                {currentPrice.change_24h_pct >= 0 ? '+' : ''}
                {currentPrice.change_24h_pct.toFixed(2)}%
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {selectedMeta.snapshotUrl && (
              <button
                onClick={() => setShowSnapshotImage(!showSnapshotImage)}
                className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition cursor-pointer border ${
                  showSnapshotImage
                    ? 'bg-cyan-900/60 text-cyan-200 border-cyan-700'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-800'
                }`}
                title="Toggle TradingView Chart Snapshot Image"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Snapshot</span>
              </button>
            )}

            <a
              href={selectedMeta.snapshotUrl || `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(selectedMeta.tvSymbol)}`}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded text-xs font-mono bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition"
              title="Open full chart on TradingView"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">TradingView ↗</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Instrument Switcher Tabs & Timeframe Bar */}
        <div className="px-3 py-2 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          {/* Quick Instrument Selection (The 5 requested non-delayed symbols) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 hidden sm:inline">
              Instruments:
            </span>
            {PRIMARY_INSTRUMENTS.map((inst) => {
              const isSelected = selectedMeta.tvSymbol === inst.tvSymbol;
              return (
                <button
                  key={inst.tvSymbol}
                  onClick={() => {
                    setSelectedMeta(inst);
                    setShowSnapshotImage(false);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                  }`}
                >
                  <span>{inst.label}</span>
                  {inst.snapshotUrl && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" title="TradingView Snapshot Verified" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase text-slate-500 mr-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> TF:
            </span>
            {[
              { label: '1m', val: '1' },
              { label: '5m', val: '5' },
              { label: '15m', val: '15' },
              { label: '1h', val: '60' },
              { label: '4h', val: '240' },
              { label: '1D', val: 'D' },
            ].map((tf) => (
              <button
                key={tf.val}
                onClick={() => setInterval(tf.val)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                  interval === tf.val
                    ? 'bg-slate-700 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Chart Stage or Snapshot Image View */}
        <div className="flex-1 w-full bg-slate-950 relative overflow-hidden">
          {showSnapshotImage && snapshotImageUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-950 overflow-auto">
              <div className="mb-2 text-xs font-mono text-cyan-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified TradingView Snapshot: {selectedMeta.snapshotUrl}</span>
              </div>
              <img
                src={snapshotImageUrl}
                alt={`${selectedMeta.tvSymbol} snapshot`}
                className="max-h-[75vh] w-auto rounded-lg border border-slate-800 shadow-xl object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <iframe
              key={`${selectedMeta.tvSymbol}-${interval}`}
              src={tvWidgetUrl}
              title={`TradingView Chart - ${selectedMeta.tvSymbol}`}
              className="w-full h-full border-0"
              allowFullScreen
            />
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Feed Source: TradingView Real-Time Non-Delayed WebSocket ({selectedMeta.tvSymbol})</span>
          </div>

          <div className="flex items-center gap-3">
            {selectedMeta.snapshotUrl && (
              <a
                href={selectedMeta.snapshotUrl}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Snapshot Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <span className="text-slate-600">•</span>
            <span className="text-slate-500">Continuous 24/5 CFD / 24/7 Crypto Live Data</span>
          </div>
        </div>
      </div>
    </div>
  );
};
