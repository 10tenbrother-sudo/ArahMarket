export type SourceStatus = 'LIVE' | 'RECENT' | 'DELAYED' | 'HISTORICAL' | 'UNAVAILABLE' | 'ERROR';
export type ImpactLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type NewsCategory = 'MACRO' | 'MICRO' | 'CENTRAL_BANK' | 'COMMODITIES' | 'CRYPTO' | 'GEOPOLITICS';

export interface MarketPrice {
  symbol: string;
  display_name: string;
  asset_type: 'FOREX' | 'CRYPTO' | 'INDEX' | 'COMMODITY';
  price: number;
  change_24h: number;
  change_24h_pct: number;
  high_24h: number;
  low_24h: number;
  volume_24h: number;
  source: string;
  timestamp: string;
  last_updated: string;
  status: SourceStatus;
  sparkline_1h: number[];
  tv_symbol?: string;
  tradingview_url?: string;
  is_delayed?: boolean;
}

export interface CurrencyStrength {
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'NZD' | 'CAD' | 'CHF';
  strength_score: number;
  change_direction: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  rank: number;
  source: string;
  timestamp: string;
  last_updated: string;
  status: SourceStatus;
}

export interface MarketEvent {
  id: string;
  title: string;
  summary: string;
  primary_category: NewsCategory;
  impact_level: ImpactLevel;
  first_detected_at: string;
  last_updated_at: string;
  source_count: number;
  source_names: string[];
  affected_assets: string[];
  affected_currencies: string[];
  key_facts: string[];
  ai_analysis_id?: string;
  is_duplicate_resolved?: boolean;
}

export interface EventSource {
  id: string;
  event_id: string;
  news_id: string;
  source_name: string;
  source_url: string;
  language: string;
  original_title: string;
  original_content: string;
  published_at: string;
  matched_reason: string;
  similarity_score: number;
  created_at: string;
}

export interface EconomicEvent {
  id: string;
  event_name: string;
  country_code: string;
  currency: string;
  impact: ImpactLevel;
  date_time_utc: string;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  status: 'UPCOMING' | 'RELEASED';
  source: string;
  last_updated: string;
  data_status?: 'LIVE' | 'DELAYED' | 'UNAVAILABLE';
  // Measurable Intelligence fields
  surprise?: string | null; // Actual vs Forecast: e.g. "+0.2% (BEAT)", "-15K (MISS)", "IN-LINE"
  change?: string | null; // Actual vs Previous: e.g. "+0.1%", "-0.2%"
  confidence?: number; // 0 - 100
  freshness?: string; // age of data: e.g. "12m ago", "2h ago", "Upcoming"
  market_reaction?: {
    primary_asset: string;
    r1m?: string; // reaction after 1m e.g. "+14 pips" or "+0.18%"
    r5m?: string; // reaction after 5m
    r15m?: string; // reaction after 15m
    r1h?: string; // reaction after 1h
    r4h?: string; // reaction after 4h
  };
  fundamental_implication?: string; // Theoretical fundamental meaning
  actual_market_reaction?: string; // Real observed market reaction
}

export type CentralBankTone = 'HAWKISH' | 'DOVISH' | 'NEUTRAL' | 'MIXED';

export interface CentralBankSpeech {
  id: string;
  speaker: string;
  central_bank: 'FED' | 'ECB' | 'BOE' | 'BOJ' | 'RBA' | 'RBNZ' | 'BOC' | 'SNB';
  currency: string;
  title: string;
  date_time_utc: string;
  tone: CentralBankTone;
  what_was_said: string;
  what_changed: string;
  why_it_matters: string;
  currency_impact: string;
  asset_relevance: string;
  previous_stance: string;
  confidence: number;
  source: string;
  timestamp: string;
}

export type MacroConditionStatus = 'STRONG' | 'WEAK' | 'MIXED';

export interface CurrencyMacroContext {
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'NZD' | 'CAD' | 'CHF';
  status: MacroConditionStatus;
  score: number;
  inflation: {
    value: string;
    assessment: 'ELEVATED' | 'TARGET' | 'COOLING' | 'SUB_TARGET';
    evidence: string;
  };
  employment: {
    value: string;
    assessment: 'ROBUST' | 'BALANCED' | 'SOFTENING' | 'WEAK';
    evidence: string;
  };
  growth: {
    value: string;
    assessment: 'EXPANSION' | 'STABLE' | 'SLOWDOWN' | 'CONTRACTION';
    evidence: string;
  };
  pmi: {
    value: string;
    assessment: 'EXPANSION' | 'NEUTRAL' | 'CONTRACTION';
    evidence: string;
  };
  interest_rate: {
    value: string;
    assessment: 'RESTRICTIVE' | 'NEUTRAL' | 'ACCOMMODATIVE';
    evidence: string;
  };
  central_bank_tone: {
    value: CentralBankTone;
    evidence: string;
  };
  currency_strength: {
    score: number;
    rank: number;
    direction: string;
  };
  evidence_summary: string;
  causal_chain: string;
  confidence: number;
  last_updated: string;
  source: string;
}

export interface UnifiedMarketContext {
  regime: string;
  sentiment: 'RISK_ON' | 'RISK_OFF' | 'MIXED' | 'NEUTRAL';
  summary: string;
  pillars: {
    news_wire_summary: string;
    macro_data_summary: string;
    central_bank_summary: string;
    currency_strength_summary: string;
    market_data_summary: string;
  };
  causal_conclusions: Array<{
    title: string;
    steps: string[];
    source: string;
    timestamp: string;
    evidence: string;
    confidence: number;
    status: 'BULLISH' | 'BEARISH' | 'MIXED' | 'INSUFFICIENT_CURRENT_DATA';
  }>;
  asset_outlook: Array<{
    asset: string;
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'MIXED';
    fundamental_implication: string;
    actual_market_reaction: string;
    confidence: number;
  }>;
  confidence: number;
  timestamp: string;
}

export interface AIAnalysis {
  id: string;
  event_id?: string;
  analysis_type: 'EVENT_ANALYSIS' | 'MARKET_OVERVIEW' | 'THEME_ANALYSIS';
  title: string;
  summary: string;
  context_data_used: {
    news_titles: string[];
    market_prices: Record<string, number>;
    currency_strength: Record<string, number>;
    macro_releases: string[];
  };
  key_implications: string[];
  affected_assets_outlook: Array<{
    asset: string;
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    rationale: string;
  }>;
  confidence: number;
  disclaimer: string;
  created_at: string;
  is_insufficient_data?: boolean;
}

export interface MarketTheme {
  id: string;
  title: string;
  description: string;
  driver?: string;
  sentiment: string;
  primary_assets?: string[];
  affected_assets?: string[];
  affected_currencies?: string[];
  updated_at?: string;
  active_since?: string;
}

export interface TelegramChannel {
  id: string;
  handle: string;
  title: string;
  source_id: string;
  is_enabled: boolean;
  language: string;
  last_ingested_at: string | null;
  status: SourceStatus;
  error_count: number;
}

export type SubscriptionPlan = 'FREE' | 'PRO' | 'INSTITUTIONAL';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  is_verified: boolean;
  avatar_url?: string;
  plan?: SubscriptionPlan;
  subscription_status?: 'active' | 'trialing' | 'canceled' | 'none';
  subscription_expires_at?: string;
}

export interface UserWatchlist {
  id: string;
  user_id: string;
  symbol: string;
  asset_type: string;
  notes?: string;
  added_at: string;
  market_data?: MarketPrice | null;
}

export type MarketDirectionBias = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'MIXED';

export interface IntradayAssetBias {
  symbol: string; // 'XAUUSD', 'BTC', 'US30', 'US500', 'US100', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF'
  display_name: string;
  asset_type: 'COMMODITY' | 'CRYPTO' | 'INDEX' | 'FOREX';
  price: number;
  change_24h_pct: number;
  sparkline_1h?: number[];
  
  // Overall Intraday Bias
  overall_bias: MarketDirectionBias;
  direction_score: number; // -100 to +100
  confidence: number; // 0 - 100%

  // Separated Biases
  fundamental_bias: MarketDirectionBias;
  fundamental_score: number; // -100 to +100
  price_action_bias: MarketDirectionBias;
  price_action_score: number; // -100 to +100

  // Evidence & Drivers
  top_drivers: string[]; // 3-5 specific drivers grounded in real data
  conflicting_factors: string[]; // Countervailing evidence
  today_key_catalyst: string; // Key event/speech/release impacting today
  current_market_reaction: string; // Actual intraday reaction observed
  conditions_to_change_bias: string; // Invalidation / pivot trigger
  
  // Data Integrity & Provenance
  source: string;
  timestamp: string;
  last_updated: string;
  status: SourceStatus;
  tv_symbol?: string;
  tradingview_url?: string;
}

export interface TodayCatalyst {
  id: string;
  event_name: string;
  date_time_utc: string;
  country_code: string;
  currency: string;
  importance: ImpactLevel;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  surprise: string | null; // e.g. "+0.2% (BEAT)", "-15K (MISS)", "IN-LINE"
  change: string | null; // e.g. "+0.1%"
  related_assets: string[];
  status: 'UPCOMING' | 'RELEASED' | 'DELAYED';
  actual_market_reaction: string;
  fundamental_implication: string;
  source: string;
  last_updated: string;
  data_status: 'LIVE' | 'RECENT' | 'DELAYED' | 'UNAVAILABLE';
}
