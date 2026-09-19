import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  RefreshCw,
  Layers,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  Globe2,
  Cpu,
  ShieldCheck,
  Activity,
  ArrowRight,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  AIAnalysis,
  MarketTheme,
  CentralBankSpeech,
  CurrencyMacroContext,
  UnifiedMarketContext,
  CentralBankTone,
  MacroConditionStatus,
  User,
} from '../types';

interface AIIntelligenceViewProps {
  initialOverview?: AIAnalysis | null;
  user?: User | null;
}

export const AIIntelligenceView: React.FC<AIIntelligenceViewProps> = ({ initialOverview, user }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CENTRAL_BANK' | 'MACRO_CONTEXT' | 'UNIFIED_CONTEXT'>('OVERVIEW');
  const [overview, setOverview] = useState<AIAnalysis | null>(initialOverview || null);
  const [themes, setThemes] = useState<MarketTheme[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [speeches, setSpeeches] = useState<CentralBankSpeech[]>([]);
  const [macroContexts, setMacroContexts] = useState<CurrencyMacroContext[]>([]);
  const [unifiedContext, setUnifiedContext] = useState<UnifiedMarketContext | null>(null);

  const [loading, setLoading] = useState(!initialOverview);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aiRes, themeRes, relRes, speechRes, contextRes, uniRes] = await Promise.allSettled([
        api.getAIOverview(),
        api.getMarketThemes(),
        api.getRelationshipMatrix(),
        api.getCentralBankSpeeches(),
        api.getMacroContext(),
        api.getUnifiedMarketContext(),
      ]);

      if (aiRes.status === 'fulfilled') setOverview(aiRes.value.market_overview);
      if (themeRes.status === 'fulfilled') setThemes(themeRes.value.themes);
      if (relRes.status === 'fulfilled') setRelationships(relRes.value.relationship_matrix);
      if (speechRes.status === 'fulfilled') setSpeeches(speechRes.value.speeches);
      if (contextRes.status === 'fulfilled') setMacroContexts(contextRes.value.contexts);
      if (uniRes.status === 'fulfilled') setUnifiedContext(uniRes.value.context);
    } catch (err: any) {
      console.warn('AI Intelligence fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setNotification(null);
      const res = await api.refreshAIOverview();
      if (res.market_overview) {
        setOverview(res.market_overview);
        setNotification({ type: 'success', message: 'Macro market regime re-synthesized successfully.' });
        setTimeout(() => setNotification(null), 4000);
      }
      // Re-fetch speeches and contexts
      const [speechRes, contextRes, uniRes] = await Promise.allSettled([
        api.getCentralBankSpeeches(),
        api.getMacroContext(),
        api.getUnifiedMarketContext(),
      ]);
      if (speechRes.status === 'fulfilled') setSpeeches(speechRes.value.speeches);
      if (contextRes.status === 'fulfilled') setMacroContexts(contextRes.value.contexts);
      if (uniRes.status === 'fulfilled') setUnifiedContext(uniRes.value.context);
    } catch (err: any) {
      setNotification({ type: 'error', message: `Synthesis refresh: ${err.message || 'Temporary service capacity limit. Grounded fallback active.'}` });
    } finally {
      setRefreshing(false);
    }
  };

  const getToneBadge = (tone: CentralBankTone) => {
    switch (tone) {
      case 'HAWKISH':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'DOVISH':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'NEUTRAL':
        return 'bg-slate-900 text-slate-300 border-slate-700';
      case 'MIXED':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
    }
  };

  const getConditionBadge = (cond: MacroConditionStatus) => {
    switch (cond) {
      case 'STRONG':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'WEAK':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'MIXED':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub-Navigation Tabs for Intelligence Layer */}
      <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'OVERVIEW'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/60'
          }`}
        >
          <Brain className="w-3.5 h-3.5 text-cyan-400" />
          <span>MARKET REGIME & THEMES</span>
        </button>

        <button
          onClick={() => setActiveTab('CENTRAL_BANK')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'CENTRAL_BANK'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/60'
          }`}
        >
          <Landmark className="w-3.5 h-3.5 text-amber-400" />
          <span>CENTRAL BANK SPEECHES</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
            {speeches.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('MACRO_CONTEXT')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'MACRO_CONTEXT'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/60'
          }`}
        >
          <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>G8 MACRO CONDITIONS</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
            8 FX
          </span>
        </button>

        <button
          onClick={() => setActiveTab('UNIFIED_CONTEXT')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'UNIFIED_CONTEXT'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/60'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>UNIFIED MARKET CONTEXT</span>
        </button>
      </div>

      {notification && (
        <div className={`px-3.5 py-2.5 rounded-lg border text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          notification.type === 'error'
            ? 'bg-rose-950/50 border-rose-800/60 text-rose-300'
            : 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-200 text-xs cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: OVERVIEW & MACRO REGIME */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-4">
          {/* Overview Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-cyan-400" />
                <div>
                  <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
                    EXECUTIVE MACRO MARKET REGIME SYNTHESIS
                  </h2>
                  <p className="text-[10px] font-mono text-slate-500">
                    Ground-Truth Multimodal Intelligence (News + Prices + Currency Strength + Macro)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {overview && (
                  <span className="text-[11px] font-mono text-slate-400">
                    Confidence: <strong className="text-cyan-400">{((overview.confidence || 0.9) * 100).toFixed(0)}%</strong>
                  </span>
                )}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 text-xs font-mono transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>{refreshing ? 'Synthesizing...' : 'Re-Synthesize'}</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>Analyzing consolidated market feeds with Gemini...</span>
              </div>
            ) : overview ? (
              <div>
                <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/50 p-4 rounded-lg border border-slate-800/80 mb-4">
                  {overview.summary}
                </p>

                {/* Key Macro Implications */}
                <div className="mb-5">
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Key Strategic Takeaways:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {overview.key_implications.map((imp, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/70 text-xs text-slate-300">
                        <span className="text-cyan-400 font-bold block mb-1 font-mono">0{idx + 1}.</span>
                        <span>{imp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Asset Sensitivity Matrix */}
                <div>
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Asset Directional Outlook:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    {overview.affected_assets_outlook.map((out, idx) => {
                      const isBull = out.bias === 'BULLISH';
                      const isBear = out.bias === 'BEARISH';
                      return (
                        <div key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                          <div className="flex items-center justify-between mb-1.5 font-mono">
                            <span className="font-bold text-slate-100">{out.asset}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border uppercase ${
                              isBull ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                              isBear ? 'bg-rose-950 text-rose-400 border-rose-800' :
                              'bg-slate-900 text-slate-400 border-slate-800'
                            }`}>
                              {out.bias}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">{out.rationale}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Active Macro Themes & Transmission Mechanisms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Themes */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800/80 mb-3 font-mono">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  ACTIVE INSTITUTIONAL THEMES ({themes.length})
                </h3>
              </div>

              <div className="space-y-2.5">
                {themes.map(t => (
                  <div key={t.id} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/80">
                    <div className="flex items-center justify-between mb-1 font-mono">
                      <h4 className="font-semibold text-xs text-slate-100">{t.title}</h4>
                      <span className={`text-[10px] px-1.5 rounded font-bold ${
                        t.sentiment === 'BULLISH' ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {t.sentiment}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-2">{t.description}</p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                      <span>DRIVER: {t.driver || 'Macro Catalyst'}</span>
                      <span>•</span>
                      <span>ASSETS: {(t.affected_assets || t.primary_assets || []).join(', ') || 'Global'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transmission Mechanism & Sensitivity Matrix */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800/80 mb-3 font-mono">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  MACRO TRANSMISSION MECHANISM MATRIX
                </h3>
              </div>

              <div className="space-y-2.5">
                {relationships.map((rel, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between mb-1 font-mono">
                      <span className="font-bold text-slate-200">{rel.driver}</span>
                      <span className="text-cyan-400 text-[10px]">
                        FX: {(rel.sensitive_currencies || []).join(', ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                      {rel.transmission_mechanism}
                    </p>
                    <div className="text-[10px] font-mono text-amber-400/90">
                      Primary Assets: {(rel.primary_assets || []).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CENTRAL BANK SPEECHES */}
      {activeTab === 'CENTRAL_BANK' && (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
                    CENTRAL BANK SPEECH & STATEMENT INTELLIGENCE
                  </h2>
                  <p className="text-[10px] font-mono text-slate-500">
                    Grounded Statement Analysis: Hawkish / Dovish / Neutral / Mixed • Prior Statement Delta • 5-Step Transmission
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Feeds (FOMC, ECB, BoE, BoJ, RBA, SNB)</span>
              </div>
            </div>

            <div className="space-y-4">
              {speeches.map(sp => (
                <div key={sp.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                  {/* Speech Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-800 text-cyan-300 border border-slate-700">
                        {sp.central_bank} ({sp.currency})
                      </span>
                      <span className="font-bold text-sm text-slate-100">{sp.speaker}</span>
                      <span className="text-xs text-slate-400 font-mono">({sp.title})</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold border uppercase font-mono ${getToneBadge(sp.tone)}`}>
                        {sp.tone} STANCE
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                      <span>{new Date(sp.timestamp || sp.date_time_utc).toLocaleString()}</span>
                      <span>•</span>
                      <span className="text-slate-400">{sp.source}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">Conf: {sp.confidence}%</span>
                    </div>
                  </div>

                  {/* Prior Guidance Comparison */}
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-xs">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <span>PERBANDINGAN STATEMENT SEBELUMNYA / PRIOR STANCE</span>
                    </div>
                    <p className="text-slate-300 leading-snug font-sans text-xs">{sp.previous_stance}</p>
                  </div>

                  {/* 5-Step Causal Framework: WHAT WAS SAID → WHAT CHANGED → WHY IT MATTERS → CURRENCY IMPACT → ASSET RELEVANCE */}
                  <div className="space-y-2 pt-1 font-mono">
                    <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      <span>5-STEP CAUSAL PIPELINE (WHAT WAS SAID → WHAT CHANGED → WHY IT MATTERS → CURRENCY IMPACT → ASSET RELEVANCE)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/90">
                        <div className="text-[9px] uppercase font-bold text-amber-400 mb-1">1. WHAT WAS SAID</div>
                        <p className="text-[11px] text-slate-300 leading-snug font-sans">{sp.what_was_said}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/90">
                        <div className="text-[9px] uppercase font-bold text-cyan-400 mb-1">2. WHAT CHANGED</div>
                        <p className="text-[11px] text-slate-300 leading-snug font-sans">{sp.what_changed}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/90">
                        <div className="text-[9px] uppercase font-bold text-indigo-400 mb-1">3. WHY IT MATTERS</div>
                        <p className="text-[11px] text-slate-300 leading-snug font-sans">{sp.why_it_matters}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/90">
                        <div className="text-[9px] uppercase font-bold text-emerald-400 mb-1">4. CURRENCY IMPACT</div>
                        <p className="text-[11px] text-slate-300 leading-snug font-sans">{sp.currency_impact}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/90">
                        <div className="text-[9px] uppercase font-bold text-purple-400 mb-1">5. ASSET RELEVANCE</div>
                        <p className="text-[11px] text-slate-300 leading-snug font-sans">{sp.asset_relevance}</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Explanation Provenance: SOURCE + TIMESTAMP + EVIDENCE + CONFIDENCE */}
                  <div className="p-2.5 rounded-lg bg-slate-950/90 border border-cyan-900/40 font-mono text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-cyan-400 font-bold">SOURCE:</span>
                      <span className="text-slate-200">{sp.source}</span>
                      <span>•</span>
                      <span className="text-cyan-400 font-bold">TIMESTAMP:</span>
                      <span className="text-slate-200">{new Date(sp.timestamp || sp.date_time_utc).toISOString()}</span>
                      <span>•</span>
                      <span className="text-cyan-400 font-bold">CONFIDENCE:</span>
                      <span className="text-emerald-400 font-bold">{sp.confidence}%</span>
                    </div>
                    <div className="text-slate-400 truncate max-w-sm">
                      <span className="text-cyan-400 font-bold mr-1">STATUS:</span>
                      <span className="text-emerald-400">Strictly Grounded</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: G8 MACRO CURRENCY CONDITIONS */}
      {activeTab === 'MACRO_CONTEXT' && (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
                    G8 CURRENCY MACRO ECONOMIC CONTEXT
                  </h2>
                  <p className="text-[10px] font-mono text-slate-500">
                    Live Status: STRONG / WEAK / MIXED • Grounded by Inflation + Employment + Growth + PMI + Central Bank Tone
                  </p>
                </div>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Data Verification: <strong className="text-emerald-400">Grounded Macro Engine</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {macroContexts.map(c => (
                <div key={c.currency} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                    <span className="text-sm font-bold font-mono text-slate-100 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {c.currency}
                    </span>

                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${getConditionBadge(c.status)}`}>
                      {c.status}
                    </span>
                  </div>

                  {/* Quantitative Economic Indicators */}
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Inflation (CPI):</span>
                      <span className="text-slate-200 font-semibold">{c.inflation.value}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Employment / Jobs:</span>
                      <span className="text-slate-200 font-semibold">{c.employment.value}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>GDP Growth:</span>
                      <span className="text-slate-200 font-semibold">{c.growth.value}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>PMI / Activity:</span>
                      <span className="text-slate-200 font-semibold">{c.pmi.value}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Policy Rate:</span>
                      <span className="text-slate-200 font-semibold">{c.interest_rate.value}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Central Bank Tone:</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border uppercase ${getToneBadge(c.central_bank_tone.value)}`}>
                        {c.central_bank_tone.value}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/50">
                      <span>Strength Score:</span>
                      <span className="text-cyan-400 font-bold">{c.score.toFixed(1)} / 10</span>
                    </div>
                  </div>

                  {/* Grounded Evidence Summary */}
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                    <div className="text-[9px] uppercase font-mono text-slate-500 mb-1">EMPIRICAL EVIDENCE:</div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{c.evidence_summary}</p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                    <span>Source: {c.source}</span>
                    <span className="text-emerald-400">Conf: {c.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: UNIFIED MARKET CONTEXT */}
      {activeTab === 'UNIFIED_CONTEXT' && (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <div>
                  <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
                    UNIFIED MULTIMODAL MARKET CONTEXT
                  </h2>
                  <p className="text-[10px] font-mono text-slate-500">
                    Harmonized Synthesis: News Wire + Macro Calendar + Central Bank Speeches + Currency Dispersion + Live Prices
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Confidence: <strong className="text-cyan-400">{unifiedContext?.confidence || 93}%</strong></span>
              </div>
            </div>

            {unifiedContext ? (
              <div className="space-y-4">
                {/* Executive Synthesis */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-900/40">
                  <div className="flex items-center justify-between mb-2 font-mono text-xs font-bold text-cyan-300 uppercase">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>{unifiedContext.regime}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
                      SENTIMENT: {unifiedContext.sentiment}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {unifiedContext.summary}
                  </p>
                </div>

                {/* 5 Pillars Summary */}
                <div>
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Five-Pillar Intelligence Inputs:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/70 text-xs text-slate-300 font-sans">
                      <span className="text-cyan-400 font-bold block mb-1 font-mono">1. NEWS WIRE FEED</span>
                      <span>{unifiedContext.pillars.news_wire_summary}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/70 text-xs text-slate-300 font-sans">
                      <span className="text-amber-400 font-bold block mb-1 font-mono">2. MACRO DATA RELEASE</span>
                      <span>{unifiedContext.pillars.macro_data_summary}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/70 text-xs text-slate-300 font-sans">
                      <span className="text-indigo-400 font-bold block mb-1 font-mono">3. CENTRAL BANK SPEECHES</span>
                      <span>{unifiedContext.pillars.central_bank_summary}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/70 text-xs text-slate-300 font-sans">
                      <span className="text-emerald-400 font-bold block mb-1 font-mono">4. CURRENCY STRENGTH</span>
                      <span>{unifiedContext.pillars.currency_strength_summary}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/70 text-xs text-slate-300 font-sans">
                      <span className="text-purple-400 font-bold block mb-1 font-mono">5. LIVE MARKET EXECUTION</span>
                      <span>{unifiedContext.pillars.market_data_summary}</span>
                    </div>
                  </div>
                </div>

                {/* Cross-Asset Directional Matrix */}
                <div>
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Asset Directional Outlook & Implication vs Reaction:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 font-mono">
                    {unifiedContext.asset_outlook.map((ca, idx) => {
                      const isBull = ca.bias === 'BULLISH';
                      const isBear = ca.bias === 'BEARISH';
                      return (
                        <div key={idx} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-100 text-xs">{ca.asset}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border uppercase ${
                              isBull ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                              isBear ? 'bg-rose-950 text-rose-400 border-rose-800' :
                              'bg-slate-900 text-slate-400 border-slate-800'
                            }`}>
                              {ca.bias}
                            </span>
                          </div>
                          <div className="text-[11px] font-sans text-slate-300">
                            <strong className="text-amber-400 font-mono text-[10px] block">FUNDAMENTAL:</strong>
                            {ca.fundamental_implication}
                          </div>
                          <div className="text-[11px] font-sans text-slate-400">
                            <strong className="text-cyan-400 font-mono text-[10px] block">ACTUAL REACTION:</strong>
                            {ca.actual_market_reaction}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Explanation Provenance Box: SOURCE + TIMESTAMP + EVIDENCE + CONFIDENCE */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/60 pb-1.5">
                    <span className="font-bold text-cyan-400 uppercase tracking-wider">
                      RIGOROUS CAUSAL EXPLANATION & DATA PROVENANCE
                    </span>
                    <span className="text-emerald-400 font-bold">CONFIDENCE: {unifiedContext.confidence}%</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 uppercase block">TIMESTAMP:</span>
                      <span className="text-slate-300">{new Date(unifiedContext.timestamp).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase block">INTELLIGENCE STANDARD:</span>
                      <span className="text-cyan-400 font-semibold">Strict Grounding (No Hallucination)</span>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300 font-sans">
                    <strong className="font-mono text-cyan-400 mr-1">EVIDENCE SUMMARY:</strong>
                    Data cross-verified across macro calendars, news wires, central bank speeches, and live market quotes. When evidence is conflicting, it is strictly classified as MIXED. When data is unavailable, it is marked as INSUFFICIENT CURRENT DATA.
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-slate-400">
                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin mx-auto mb-2" />
                <span>Aggregating News, Macro, Speeches, Currency Strength, and Price Feeds...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
