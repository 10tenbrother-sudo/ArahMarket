import {
  MarketPrice,
  CurrencyStrength,
  MarketEvent,
  EconomicEvent,
  AIAnalysis,
  MarketTheme,
  TelegramChannel,
  User,
  UserWatchlist,
  CentralBankSpeech,
  CurrencyMacroContext,
  UnifiedMarketContext,
  IntradayAssetBias,
  TodayCatalyst,
  SubscriptionPlan,
} from '../types';

export const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('nexus_auth_token') || localStorage.getItem('auth_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('nexus_auth_token', token);
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('nexus_auth_token');
    localStorage.removeItem('auth_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const err: any = new Error(errorJson.error || errorJson.message || `Request failed with status ${res.status}`);
    err.code = errorJson.code;
    err.email = errorJson.email;
    err.status = res.status;
    throw err;
  }

  return res.json();
}

export const api = {
  // Markets
  getMarkets: () => request<{ prices: MarketPrice[]; count: number }>('/markets'),
  getMarketSessions: () => request<{ sessions: any[]; active_sessions_count: number }>('/markets/status'),
  refreshMarkets: () => request<{ success: boolean }>('/markets/refresh', { method: 'POST' }),

  // Events
  getEvents: (limit = 30) => request<{ events: MarketEvent[]; count: number }>(`/events?limit=${limit}`),
  getEventDetail: (id: string) => request<{
    event: MarketEvent;
    sources: any[];
    timeline: any[];
    affected_markets: MarketPrice[];
    affected_currencies: CurrencyStrength[];
    ai_analysis: AIAnalysis | null;
  }>(`/events/${id}`),
  reanalyzeEvent: (id: string) => request<{ success: boolean; analysis: AIAnalysis }>(`/events/${id}/analyze`, { method: 'POST' }),

  // Currency Strength
  getCurrencyStrength: () => request<{ currency_strength: CurrencyStrength[]; source: string }>('/currency-strength'),
  refreshCurrencyStrength: () => request<{ success: boolean; currency_strength: CurrencyStrength[] }>('/currency-strength/refresh', { method: 'POST' }),

  // Intraday Market Map & Today's Catalysts
  getIntradayMarketMap: () => request<{ market_map: IntradayAssetBias[]; count: number; timestamp: string }>('/intelligence/intraday-map'),
  getTodayCatalysts: () => request<{ catalysts: TodayCatalyst[]; count: number; timestamp: string }>('/macro/today-catalysts'),

  // Macro Calendar
  getEconomicCalendar: (limit = 200, status?: string) =>
    request<{ calendar: EconomicEvent[]; count: number; upcoming_count?: number; released_count?: number; next_event?: EconomicEvent }>(
      `/macro/calendar?limit=${limit}${status ? `&status=${status}` : ''}`
    ),
  refreshEconomicCalendar: () => request<{ success: boolean; count: number }>('/macro/refresh', { method: 'POST' }),

  // Intelligence & AI
  getMarketThemes: () => request<{ themes: MarketTheme[] }>('/intelligence/themes'),
  getCentralBankSpeeches: () => request<{ speeches: CentralBankSpeech[]; count: number }>('/intelligence/central-bank-speeches'),
  getMacroContext: () => request<{ contexts: CurrencyMacroContext[]; count: number }>('/intelligence/macro-context'),
  getUnifiedMarketContext: () => request<{ context: UnifiedMarketContext }>('/intelligence/unified-context'),
  getMarketImpact: () => request<{ high_impact_events: MarketEvent[]; currency_dispersion: CurrencyStrength[]; market_overview_prices: any[] }>('/intelligence/impact'),
  getRelationshipMatrix: () => request<{ relationship_matrix: any[] }>('/intelligence/relationships'),
  getAIOverview: () => request<{ market_overview: AIAnalysis }>('/intelligence/ai'),
  refreshAIOverview: () => request<{ success: boolean; market_overview: AIAnalysis }>('/intelligence/ai/refresh', { method: 'POST' }),

  // Auth & User
  getMe: () => request<{ user: User; preferences: any; watchlist: UserWatchlist[] }>('/auth/me'),
  login: (credentials: { email: string; password: string }) => request<{ user: User; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  register: (payload: { email: string; password: string; name: string }) => request<{
    success: boolean;
    status: 'pending_verification';
    message: string;
    email: string;
    verificationUrl?: string;
    user: User;
  }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  verifyEmail: (token: string) => request<{
    success: boolean;
    message: string;
    token: string;
    user: User;
  }>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  }),
  resendVerification: (email: string) => request<{
    success: boolean;
    message: string;
    verificationUrl?: string;
  }>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  getWatchlist: () => request<{ watchlist: UserWatchlist[] }>('/user/watchlist'),
  addToWatchlist: (symbol: string, asset_type: string) => request<{ success: boolean; item: UserWatchlist }>('/user/watchlist', {
    method: 'POST',
    body: JSON.stringify({ symbol, asset_type }),
  }),
  removeFromWatchlist: (symbol: string) => request<{ success: boolean; symbol: string }>(`/user/watchlist/${symbol}`, {
    method: 'DELETE',
  }),
  updateSubscription: (plan: SubscriptionPlan) => request<{ success: boolean; user: User }>('/user/subscription', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  }),
  getUserEntitlements: () => request<any>('/user/entitlements'),
  createCheckoutSession: (payload: { plan: string; billing_cycle: 'monthly' | 'annual' }) => request<any>('/user/checkout-session', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getPaymentConfig: () => request<{
    isConfigured: boolean;
    clientKey: string;
    isProduction: boolean;
    currency: string;
    pricing: Record<string, { monthly: number; annual: number }>;
    manualBank: {
      bank: string;
      billerCode: string;
      companyName: string;
      accountNumber: string;
      accountName: string;
      qrisMerchantName: string;
    };
  }>('/payments/config'),
  createPaymentCharge: (payload: { plan: string; billing_cycle: 'monthly' | 'annual' }) => request<{
    success: boolean;
    orderId: string;
    token: string;
    redirectUrl: string | null;
    grossAmount: number;
    currency: string;
    plan: string;
    billingCycle: string;
    isSimulated: boolean;
    demoDetails?: {
      mandiriBillerCode: string;
      mandiriBillKey: string;
      companyName: string;
      qrisString: string;
    };
  }>('/payments/charge', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  simulatePaymentSuccess: (payload: { orderId: string; plan: string; billing_cycle: string }) => request<{
    success: boolean;
    message: string;
    user: User;
  }>('/payments/simulate-success', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  submitManualPayment: (payload: {
    plan: string;
    senderName: string;
    senderBank: string;
    transferAmount: number;
    referenceNote?: string;
  }) => request<{
    success: boolean;
    message: string;
  }>('/payments/manual-confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  requestPasswordReset: (email: string) => request<{ message: string }>('/auth/password-reset', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),

  // Admin
  getSystemHealth: () => request<any>('/admin/system-health'),
  getAdminUsers: () => request<{ users: User[]; count: number }>('/admin/users'),
  updateAdminUser: (id: string, updates: { role?: string; plan?: string; subscription_status?: string }) => request<{ success: boolean; user: User }>(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),
  getSources: () => request<{ sources: any[]; count: number }>('/admin/sources'),
  toggleSource: (id: string, is_enabled: boolean) => request<any>(`/admin/sources/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_enabled }),
  }),
  getTelegramChannels: () => request<{ channels: TelegramChannel[]; count: number }>('/admin/telegram'),
  addTelegramChannel: (handle: string, title?: string, language?: string) => request<any>('/admin/telegram', {
    method: 'POST',
    body: JSON.stringify({ handle, title, language }),
  }),
  toggleTelegramChannel: (handle: string, is_enabled: boolean) => request<any>(`/admin/telegram/${handle}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_enabled }),
  }),
  deleteTelegramChannel: (handle: string) => request<any>(`/admin/telegram/${handle}`, {
    method: 'DELETE',
  }),
  triggerTelegramScrape: (handle: string) => request<any>(`/admin/telegram/${handle}/scrape`, {
    method: 'POST',
  }),
  getDuplicates: () => request<{ total_deduplicated_events: number; events: any[] }>('/admin/duplicates'),
  runGlobalIngest: () => request<any>('/admin/ingest/run-all', { method: 'POST' }),
  injectTestArticle: (payload: { title: string; content?: string; source_name?: string; language?: string }) => request<any>('/admin/ingest/test-article', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};
