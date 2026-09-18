/**
 * Asset & Currency Relationship Mapping Engine
 * Deterministic mapping based on macroeconomic causality and asset sensitivity
 */

export interface MappedRelationship {
  affected_assets: string[];
  affected_currencies: string[];
  primary_category: 'MACRO' | 'CENTRAL_BANK' | 'COMMODITY' | 'CRYPTO' | 'EQUITIES' | 'GEOPOLITICS' | 'MICRO';
  impact_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  key_facts: string[];
}

export function analyzeAssetRelationships(title: string, content: string): MappedRelationship {
  const text = `${title} ${content}`.toLowerCase();

  const affected_assets = new Set<string>();
  const affected_currencies = new Set<string>();
  let primary_category: MappedRelationship['primary_category'] = 'MACRO';
  let impact_level: MappedRelationship['impact_level'] = 'MEDIUM';
  const key_facts: string[] = [];

  // 1. Extract numeric facts (e.g., 3.1%, 25 bps, $2700, 142k)
  const percentMatches = text.match(/\b\d+([.,]\d+)?\s*%/g);
  if (percentMatches) {
    key_facts.push(...percentMatches.slice(0, 3).map(p => `Rate/Delta: ${p.trim()}`));
  }

  const bpsMatches = text.match(/\b\d+\s*bps\b/gi);
  if (bpsMatches) {
    key_facts.push(...bpsMatches.slice(0, 2).map(b => `Shift: ${b.trim()}`));
  }

  // 2. US Macro & Federal Reserve
  const isUsInflation = /cpi|inflation|inflasi|ihk|consumer price|indeks harga konsumen|ppi|pce/i.test(text);
  const isUsFed = /fed|federal reserve|fomc|powell|suku bunga as|us interest rate|rate cut|pemangkasan suku bunga/i.test(text);
  const isUsJobs = /nfp|non-farm|payroll|tenaga kerja as|us employment|jobless claims|unemployment as/i.test(text);
  const isUsGdp = /gdp as|us gdp|pertumbuhan ekonomi as/i.test(text);

  if (isUsInflation || isUsFed || isUsJobs || isUsGdp) {
    affected_currencies.add('USD');
    affected_assets.add('XAUUSD'); // Gold is inverse USD / real yield sensitive
    affected_assets.add('US100');  // Tech equities are rate discount sensitive
    affected_assets.add('US500');  // Broad market equity proxy
    affected_assets.add('US30');   // Industrial benchmark
    affected_assets.add('BTC');    // High-beta liquidity barometer

    if (isUsInflation) {
      primary_category = 'MACRO';
      impact_level = 'HIGH';
      key_facts.push('US Inflation Print / Macro Indicator');
    } else if (isUsFed) {
      primary_category = 'CENTRAL_BANK';
      impact_level = 'CRITICAL';
      key_facts.push('Federal Reserve Monetary Policy Action');
    } else if (isUsJobs) {
      primary_category = 'MACRO';
      impact_level = 'CRITICAL';
      key_facts.push('US Labor Market Release');
    }
  }

  // 3. European Central Bank & Euro
  if (/ecb|lagarde|european central bank|bank sentral eropa|eurozone|inflasi eropa|german pmi/i.test(text)) {
    affected_currencies.add('EUR');
    affected_currencies.add('USD');
    affected_assets.add('US500');
    primary_category = 'CENTRAL_BANK';
    impact_level = 'HIGH';
    key_facts.push('ECB Policy / Eurozone Economic Driver');
  }

  // 4. Bank of Japan & Yen
  if (/boj|bank of japan|bank sentral jepang|ueda|yen|jpy|intervensi yen|tokyo cpi/i.test(text)) {
    affected_currencies.add('JPY');
    affected_currencies.add('USD');
    affected_assets.add('US100'); // Carry trade unwinding sensitivity
    affected_assets.add('XAUUSD');
    primary_category = 'CENTRAL_BANK';
    impact_level = 'HIGH';
    key_facts.push('Bank of Japan Policy / Carry Trade Dynamics');
  }

  // 5. Bank of England & Sterling
  if (/boe|bank of england|bailey|sterling|gbp|uk cpi|inflasi inggris|gilts/i.test(text)) {
    affected_currencies.add('GBP');
    affected_currencies.add('USD');
    primary_category = 'CENTRAL_BANK';
    impact_level = 'HIGH';
    key_facts.push('Bank of England / UK Economic Activity');
  }

  // 6. Commodity Currencies (AUD, NZD, CAD)
  if (/rba|reserve bank of australia|aud|australia|china trade|dolar australia/i.test(text)) {
    affected_currencies.add('AUD');
    affected_currencies.add('USD');
    affected_currencies.add('NZD');
    affected_assets.add('XAUUSD'); // AUD strongly correlated with commodities
    primary_category = 'MACRO';
    key_facts.push('Australia / Asia-Pacific Growth Exposure');
  }

  if (/rbnz|reserve bank of new zealand|nzd|new zealand/i.test(text)) {
    affected_currencies.add('NZD');
    affected_currencies.add('AUD');
    affected_currencies.add('USD');
    primary_category = 'CENTRAL_BANK';
  }

  if (/boc|bank of canada|cad|kanada|crude oil|minyak mentah|opec|wti|brent/i.test(text)) {
    affected_currencies.add('CAD');
    affected_currencies.add('USD');
    affected_assets.add('US30');
    if (/oil|minyak|opec/i.test(text)) {
      primary_category = 'COMMODITY';
      key_facts.push('Energy Market / Petroleum Supply-Demand Shock');
    }
  }

  // 7. Swiss Franc & Safe Haven
  if (/snb|swiss national bank|chf|franc|safe haven|aset lindung nilai/i.test(text)) {
    affected_currencies.add('CHF');
    affected_currencies.add('EUR');
    affected_currencies.add('USD');
    affected_assets.add('XAUUSD');
    primary_category = 'MACRO';
  }

  // 8. Gold & Precious Metals
  if (/gold|xau|emas|bullion|logam mulia|precious metal/i.test(text)) {
    affected_assets.add('XAUUSD');
    affected_currencies.add('USD');
    primary_category = 'COMMODITY';
    impact_level = 'HIGH';
    key_facts.push('Gold Bullion Physical / Speculative Shift');
  }

  // 9. Crypto & Bitcoin
  if (/bitcoin|btc|crypto|kripto|sec btc|etf crypto|ethereum|tether/i.test(text)) {
    affected_assets.add('BTC');
    affected_assets.add('US100');
    affected_currencies.add('USD');
    primary_category = 'CRYPTO';
    impact_level = 'MEDIUM';
    key_facts.push('Digital Asset / Crypto Liquidity Event');
  }

  // 10. Geopolitics & Defense
  if (/war|perang|missile|rudal|military|militer|sanctions|sanksi|middle east|timur tengah|iran|israel|russia|ukraine/i.test(text)) {
    affected_assets.add('XAUUSD');
    affected_assets.add('US30');
    affected_currencies.add('USD');
    affected_currencies.add('CHF');
    affected_currencies.add('JPY');
    primary_category = 'GEOPOLITICS';
    impact_level = 'CRITICAL';
    key_facts.push('Geopolitical Tensions / Flight to Safety');
  }

  // Default fallback if no specific rule matched
  if (affected_assets.size === 0 && affected_currencies.size === 0) {
    affected_assets.add('US500');
    affected_currencies.add('USD');
    primary_category = 'MICRO';
    impact_level = 'LOW';
  }

  return {
    affected_assets: Array.from(affected_assets),
    affected_currencies: Array.from(affected_currencies),
    primary_category,
    impact_level,
    key_facts,
  };
}
