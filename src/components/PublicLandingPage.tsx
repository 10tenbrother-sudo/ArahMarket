import React, { useEffect } from 'react';
import {
  Activity,
  Layers,
  TrendingUp,
  Radio,
  Brain,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  BarChart2,
  Globe2,
  Zap,
  Lock,
  ChevronRight,
  Flame,
  Clock,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { User } from '../types';
import { SubscriptionPlans } from './SubscriptionPlans';

interface PublicLandingPageProps {
  currentPath: string;
  onNavigate: (to: string) => void;
  user?: User | null;
  onPlanUpdated?: (u: User) => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({
  currentPath,
  onNavigate,
  user,
  onPlanUpdated,
}) => {
  // Auto-scroll to specific section when path is /features or /pricing
  useEffect(() => {
    if (currentPath === '/features') {
      const el = document.getElementById('features-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (currentPath === '/pricing') {
      const el = document.getElementById('pricing-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPath]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Public Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo / Brand */}
          <div
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition">
              <Layers className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wider font-mono text-slate-100 flex items-center gap-1.5">
                NEXUS <span className="text-cyan-400">TERMINAL</span>
              </div>
              <div className="text-[9px] font-mono text-slate-400 tracking-widest uppercase">
                Macro Intelligence
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-mono">
            <button
              onClick={() => onNavigate('/features')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                currentPath === '/features'
                  ? 'text-cyan-400 bg-slate-900 border border-slate-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Key Features
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('markets-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-md text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              Supported Markets
            </button>
            <button
              onClick={() => onNavigate('/pricing')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                currentPath === '/pricing'
                  ? 'text-cyan-400 bg-slate-900 border border-slate-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pricing
            </button>
          </nav>
        </div>

        {/* Auth Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/login')}
            className="px-3.5 py-1.5 text-xs font-mono text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-900/60 rounded-lg transition cursor-pointer font-medium"
            id="landing-login-btn"
          >
            Sign In
          </button>
          <button
            onClick={() => onNavigate('/register')}
            className="px-4 py-1.5 text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition cursor-pointer shadow-sm shadow-cyan-500/25 flex items-center gap-1.5"
            id="landing-register-btn"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-8 pt-16 pb-20 max-w-6xl mx-auto w-full text-center flex flex-col items-center">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Institutional Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-mono mb-6">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            Institutional Macro Surveillance & Real-Time Wire
          </span>
        </div>

        {/* Clear Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-100 max-w-4xl leading-tight">
          Real-Time Macro Intelligence & Market Surveillance for Serious Traders
        </h1>

        {/* Short Description */}
        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed font-normal">
          Empowering traders with instant central bank telemetry, real-time G8 currency strength dispersion, canonical news wire analysis, and high-probability intraday asset bias.
        </p>

        {/* Call to Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto font-mono">
          <button
            onClick={() => onNavigate('/register')}
            className="w-full sm:w-auto px-7 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Start Free Evaluation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('/login')}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-750 hover:border-slate-600 font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Terminal Login</span>
          </button>
        </div>

        {/* Security & System Trust Points */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Real-time SSE push telemetry</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>G8 cross-rate dispersion matrix</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Central bank speaker tracking</span>
          </div>
        </div>

        {/* Preview / Visual Examples */}
        <div className="mt-14 w-full max-w-5xl rounded-xl border border-slate-800 bg-slate-900/80 shadow-2xl overflow-hidden text-left font-mono">
          {/* Terminal Window Chrome */}
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-slate-300 font-bold ml-2">NEXUS TERMINAL — LIVE MACRO ENGINE</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                STREAM CONNECTED
              </span>
              <span className="text-slate-400">PORT 3000</span>
            </div>
          </div>

          {/* Visual Mock Representation */}
          <div className="p-4 sm:p-6 bg-slate-950/90 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mock Card 1: Intraday Bias Radar */}
            <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                <span className="font-bold flex items-center gap-1.5 text-cyan-400">
                  <Activity className="w-3.5 h-3.5" />
                  INTRADAY BIAS RADAR
                </span>
                <span className="text-[10px] text-slate-400">13 ASSETS LIVE</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-850">
                  <div>
                    <span className="font-bold text-slate-100">GBPJPY</span>
                    <span className="text-[10px] text-slate-400 block font-sans">BoE hold vs BoJ easing</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    STRONG BUY (+6.1)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-850">
                  <div>
                    <span className="font-bold text-slate-100">XAUUSD</span>
                    <span className="text-[10px] text-slate-400 block font-sans">Gold safe-haven momentum</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    BULLISH (+4.5)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-850">
                  <div>
                    <span className="font-bold text-slate-100">USDCHF</span>
                    <span className="text-[10px] text-slate-400 block font-sans">Yield differential compression</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                    CHOP AVOID (0.4)
                  </span>
                </div>
              </div>
            </div>

            {/* Mock Card 2: Currency Strength Dispersion */}
            <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  G8 CURRENCY MATRIX
                </span>
                <span className="text-[10px] text-slate-400">SCORE 0 - 10</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-200 font-bold">GBP (Rank #1)</span>
                    <span className="text-emerald-400 font-bold">8.2 / 10.0</span>
                  </div>
                  <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-emerald-400 w-[82%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-200 font-bold">AUD (Rank #2)</span>
                    <span className="text-emerald-400 font-bold">7.4 / 10.0</span>
                  </div>
                  <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-emerald-400 w-[74%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-200 font-bold">JPY (Rank #8)</span>
                    <span className="text-rose-400 font-bold">2.1 / 10.0</span>
                  </div>
                  <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-rose-400 w-[21%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Card 3: AI Macro & Economic Catalysts */}
            <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                <span className="font-bold flex items-center gap-1.5 text-purple-400">
                  <Brain className="w-3.5 h-3.5" />
                  AI CATALYST ENGINE
                </span>
                <span className="text-[10px] text-slate-400">AUTOMATED</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-850 space-y-1.5 font-sans">
                <div className="text-[11px] font-bold text-slate-100 font-mono">
                  Federal Reserve Rate Cut Repricing
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  US Treasury yields soften post-NFP release. DXY consolidated below 104.20 while non-US currencies gain carry beta.
                </p>
                <div className="pt-1 flex items-center gap-2 text-[10px] font-mono text-cyan-400">
                  <span>HIGH IMPACT</span>
                  <span>•</span>
                  <span>EURUSD, GBPUSD, XAUUSD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terminal Footer Banner */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="text-[11px]">Previewing Nexus Terminal Institutional Architecture</span>
            <button
              onClick={() => onNavigate('/register')}
              className="text-cyan-400 hover:text-cyan-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <span>Unlock full terminal access</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features-section" className="py-16 px-4 sm:px-8 border-t border-slate-900 bg-slate-950/70">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2">
              ENGINEERED FOR ALPHA
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Six Pillars of Institutional Market Surveillance
            </h2>
            <p className="text-sm text-slate-400 mt-2 font-sans">
              Comprehensive telemetry designed to eliminate noise and deliver actionable macroeconomic edges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Feature 1 */}
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 transition space-y-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 font-mono">
                G8 Currency Strength Matrix
              </h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Algorithmic cross-rate scoring across 28 currency pairs. Automatically highlights prime high-divergence trades and warns against chop and low-volatility traps.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 transition space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 font-mono">
                Intraday Market Mapping
              </h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Instant multi-asset bias tracking 13 core liquid instruments with quantitative bias scores, macro catalysts, and optimal trading timeframes.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 transition space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-950 border border-purple-800/80 flex items-center justify-center text-purple-400">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 font-mono">
                Canonical Institutional Wire
              </h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                De-duplicated financial news aggregation with AI impact classification, zero-latency ingestion, and automated market price cross-referencing.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 transition space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-950 border border-amber-800/80 flex items-center justify-center text-amber-400">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 font-mono">
                Central Bank Telemetry
              </h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Comprehensive tracking of FOMC, ECB, BoE, and BoJ rate path expectations, speech sentiment ratings, and global policy divergence indicators.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 transition space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-950 border border-blue-800/80 flex items-center justify-center text-blue-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 font-mono">
                Sub-Second SSE Push
              </h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Persistent server-sent event push stream delivering tick-level quotes and breaking events without resource-heavy client polling.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 transition space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-950 border border-rose-800/80 flex items-center justify-center text-rose-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 font-mono">
                Cloud Watchlist & Persistence
              </h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Authenticated trader profiles with encrypted cloud persistence, custom symbol tracking, and personalized multi-asset surveillance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Markets Section */}
      <section id="markets-section" className="py-16 px-4 sm:px-8 border-t border-slate-900 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2">
              GLOBAL ASSET COVERAGE
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Supported Asset Classes & Instruments
            </h2>
            <p className="text-sm text-slate-400 mt-2 font-sans">
              Real-time pricing, macro drivers, and sentiment telemetry across all major financial arenas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
            {/* Asset Class 1: FX Majors */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5">
              <div className="text-cyan-400 font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
                Foreign Exchange (G8)
              </div>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between"><span>EUR / USD</span><span className="text-slate-400">Euro / US Dollar</span></div>
                <div className="flex justify-between"><span>GBP / USD</span><span className="text-slate-400">British Pound</span></div>
                <div className="flex justify-between"><span>USD / JPY</span><span className="text-slate-400">Japanese Yen</span></div>
                <div className="flex justify-between"><span>AUD / USD</span><span className="text-slate-400">Aussie Dollar</span></div>
                <div className="flex justify-between"><span>USD / CAD</span><span className="text-slate-400">Canadian Dollar</span></div>
                <div className="flex justify-between"><span>USD / CHF</span><span className="text-slate-400">Swiss Franc</span></div>
                <div className="flex justify-between"><span>GBP / JPY</span><span className="text-slate-400">Beast Cross</span></div>
              </div>
            </div>

            {/* Asset Class 2: Commodities */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5">
              <div className="text-amber-400 font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
                Commodities & Energy
              </div>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between"><span>XAU / USD</span><span className="text-slate-400">Spot Gold</span></div>
                <div className="flex justify-between"><span>XAG / USD</span><span className="text-slate-400">Spot Silver</span></div>
                <div className="flex justify-between"><span>WTI CRUDE</span><span className="text-slate-400">US Light Sweet</span></div>
                <div className="flex justify-between"><span>BRENT CRUDE</span><span className="text-slate-400">North Sea Benchmark</span></div>
                <div className="flex justify-between"><span>COPPER</span><span className="text-slate-400">Industrial Metal</span></div>
                <div className="flex justify-between"><span>NATURAL GAS</span><span className="text-slate-400">Henry Hub</span></div>
              </div>
            </div>

            {/* Asset Class 3: Global Indices */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5">
              <div className="text-purple-400 font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
                Equities & Global Indices
              </div>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between"><span>US500</span><span className="text-slate-400">S&P 500 Index</span></div>
                <div className="flex justify-between"><span>NAS100</span><span className="text-slate-400">Nasdaq Tech 100</span></div>
                <div className="flex justify-between"><span>US30</span><span className="text-slate-400">Dow Jones Industrial</span></div>
                <div className="flex justify-between"><span>GER40</span><span className="text-slate-400">German DAX</span></div>
                <div className="flex justify-between"><span>UK100</span><span className="text-slate-400">FTSE 100 Index</span></div>
                <div className="flex justify-between"><span>JP225</span><span className="text-slate-400">Nikkei Average</span></div>
              </div>
            </div>

            {/* Asset Class 4: Crypto & Rates */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5">
              <div className="text-emerald-400 font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
                Rates & Digital Assets
              </div>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between"><span>US10Y</span><span className="text-slate-400">10-Yr US Treasury</span></div>
                <div className="flex justify-between"><span>DXY</span><span className="text-slate-400">US Dollar Index</span></div>
                <div className="flex justify-between"><span>BTC / USD</span><span className="text-slate-400">Bitcoin Core</span></div>
                <div className="flex justify-between"><span>ETH / USD</span><span className="text-slate-400">Ethereum Network</span></div>
                <div className="flex justify-between"><span>SOL / USD</span><span className="text-slate-400">Solana Ecosystem</span></div>
                <div className="flex justify-between"><span>UK10Y</span><span className="text-slate-400">10-Yr UK Gilt Yield</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing-section" className="py-16 px-4 sm:px-8 border-t border-slate-900 bg-slate-950/70">
        <SubscriptionPlans
          user={user}
          onPlanUpdated={onPlanUpdated}
          onOpenAuth={() => onNavigate('/login')}
        />
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 px-4 sm:px-8 py-8 text-slate-400 text-xs font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-cyan-600 flex items-center justify-center text-slate-950 font-bold text-[10px]">
              N
            </div>
            <span className="font-bold text-slate-200">NEXUS TERMINAL</span>
            <span className="text-slate-400">• Real-Time Market Intelligence</span>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <button onClick={() => onNavigate('/')} className="hover:text-slate-200 transition cursor-pointer">
              Home
            </button>
            <button onClick={() => onNavigate('/features')} className="hover:text-slate-200 transition cursor-pointer">
              Features
            </button>
            <button onClick={() => onNavigate('/pricing')} className="hover:text-slate-200 transition cursor-pointer">
              Pricing
            </button>
            <button onClick={() => onNavigate('/login')} className="hover:text-cyan-400 transition cursor-pointer">
              Sign In
            </button>
            <button onClick={() => onNavigate('/register')} className="hover:text-cyan-400 transition cursor-pointer">
              Register
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-6 pt-4 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400 font-sans">
          <div>
            © {new Date().getFullYear()} Nexus Terminal Systems. All rights reserved.
          </div>
          <div>
            Institutional market intelligence platform. For analytical and educational surveillance only.
          </div>
        </div>
      </footer>
    </div>
  );
};
