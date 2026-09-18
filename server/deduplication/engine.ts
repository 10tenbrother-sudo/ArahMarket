/**
 * Multi-Factor Semantic & Entity Event Deduplication Engine
 * Combines cross-language semantic tokenization, numeric fact comparison,
 * entity extraction, currency/asset overlap, and timestamp proximity window.
 */

import { MarketEvent, NewsItem, EventSource } from '../types.js';
import { db } from '../db/database.js';

interface DeduplicationResult {
  isDuplicate: boolean;
  matchedEvent: MarketEvent | null;
  similarityScore: number;
  matchReason: string;
}

// Multilingual token mapping (Indonesian / Malay / German / etc. -> canonical English financial concepts)
const TRANSLATION_MAP: Record<string, string> = {
  // Indonesian / Malay
  'inflasi': 'inflation',
  'ihk': 'cpi',
  'indeks': 'index',
  'harga': 'price',
  'konsumen': 'consumer',
  'as': 'us',
  'amerika': 'us',
  'serikat': 'states',
  'naik': 'rises',
  'melonjak': 'rises',
  'turun': 'falls',
  'merosot': 'falls',
  'suku': 'rate',
  'bunga': 'rate',
  'pemangkasan': 'cut',
  'kenaikan': 'hike',
  'tenaga': 'labor',
  'kerja': 'employment',
  'pengangguran': 'unemployment',
  'emas': 'gold',
  'minyak': 'oil',
  'mentah': 'crude',
  'dolar': 'dollar',
  'jepang': 'japan',
  'eropa': 'europe',
  'bank': 'bank',
  'sentral': 'central',
  'kebijakan': 'policy',
  'moneter': 'monetary',
  'terhadap': 'against',
  'menguat': 'strengthens',
  'melemah': 'weakens',
  'perang': 'war',
  'timur': 'east',
  'tengah': 'middle',
  'rudal': 'missile',
  'sanksi': 'sanctions',
};

export class DeduplicationEngine {
  /**
   * Normalizes text into canonical concept tokens for cross-language comparison
   */
  public static normalizeSemanticTokens(text: string): { tokens: Set<string>; numbers: Set<string> } {
    const cleaned = text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const rawWords = cleaned.split(' ');
    const tokens = new Set<string>();

    for (const word of rawWords) {
      if (!word || word.length < 2) continue;
      const canonical = TRANSLATION_MAP[word] || word;
      tokens.add(canonical);
    }

    // Extract all numbers and percentages (e.g. 3.1, 3,1 -> 3.1)
    const numbers = new Set<string>();
    const numMatches = text.match(/\b\d+([.,]\d+)?\b/g);
    if (numMatches) {
      for (const m of numMatches) {
        // Standardize 3,1 to 3.1
        const std = m.replace(',', '.');
        // Filter out small single-digit noise unless followed by %
        numbers.add(std);
      }
    }

    return { tokens, numbers };
  }

  /**
   * Computes Jaccard similarity between two token sets
   */
  public static computeJaccard(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 || setB.size === 0) return 0;
    let intersection = 0;
    for (const item of setA) {
      if (setB.has(item)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }

  /**
   * Evaluates if incoming news matches any active event within the deduplication window
   */
  public static evaluateDuplicate(
    incoming: NewsItem,
    candidateEvents: MarketEvent[]
  ): DeduplicationResult {
    const incomingTokens = this.normalizeSemanticTokens(`${incoming.title} ${incoming.content}`);
    const incomingTime = new Date(incoming.published_at).getTime();
    // 36 hours deduplication window
    const WINDOW_MS = 36 * 60 * 60 * 1000;

    let highestScore = 0;
    let bestEvent: MarketEvent | null = null;
    let bestReason = '';

    for (const event of candidateEvents) {
      const eventTime = new Date(event.first_detected_at).getTime();
      const timeDiff = Math.abs(incomingTime - eventTime);
      if (timeDiff > WINDOW_MS) {
        continue;
      }

      const eventTokens = this.normalizeSemanticTokens(`${event.title} ${event.summary}`);

      // 1. Check numeric fact match (e.g., "3.1%" in both English and Indonesian)
      let sharedNumbers = 0;
      for (const num of incomingTokens.numbers) {
        if (eventTokens.numbers.has(num)) {
          sharedNumbers++;
        }
      }

      // 2. Check semantic token overlap
      const tokenSimilarity = this.computeJaccard(incomingTokens.tokens, eventTokens.tokens);

      // 3. Check affected asset / currency overlap
      const incomingCurrs = new Set(incoming.affected_currencies);
      const incomingAssets = new Set(incoming.affected_assets);
      let currOverlap = 0;
      for (const c of event.affected_currencies) {
        if (incomingCurrs.has(c)) currOverlap++;
      }
      let assetOverlap = 0;
      for (const a of event.affected_assets) {
        if (incomingAssets.has(a)) assetOverlap++;
      }

      // Composite scoring formula
      let score = tokenSimilarity * 0.55;
      if (sharedNumbers > 0) score += 0.25;
      if (currOverlap > 0) score += 0.1;
      if (assetOverlap > 0) score += 0.1;

      // Special high-confidence triggers:
      // (a) Both mention US CPI / Inflation + same percentage (e.g. 3.1)
      const hasInflationA = incomingTokens.tokens.has('inflation') || incomingTokens.tokens.has('cpi');
      const hasInflationB = eventTokens.tokens.has('inflation') || eventTokens.tokens.has('cpi');
      if (hasInflationA && hasInflationB && sharedNumbers > 0) {
        score = Math.max(score, 0.88);
      }

      // (b) Both mention Fed rate cut / hike + basis points or rate
      const hasFedA = incomingTokens.tokens.has('fed') || incomingTokens.tokens.has('rate');
      const hasFedB = eventTokens.tokens.has('fed') || eventTokens.tokens.has('rate');
      if (hasFedA && hasFedB && sharedNumbers > 0) {
        score = Math.max(score, 0.85);
      }

      // (c) Both mention NFP / Jobs + number
      const hasJobsA = incomingTokens.tokens.has('nfp') || incomingTokens.tokens.has('labor') || incomingTokens.tokens.has('employment');
      const hasJobsB = eventTokens.tokens.has('nfp') || eventTokens.tokens.has('labor') || eventTokens.tokens.has('employment');
      if (hasJobsA && hasJobsB && sharedNumbers > 0) {
        score = Math.max(score, 0.86);
      }

      if (score > highestScore) {
        highestScore = score;
        bestEvent = event;
        if (hasInflationA && hasInflationB && sharedNumbers > 0) {
          bestReason = `Cross-language inflation print match (identical numeric data: ${Array.from(incomingTokens.numbers).join(', ')})`;
        } else if (hasFedA && hasFedB) {
          bestReason = 'Central bank policy action entity & target rate convergence';
        } else if (sharedNumbers > 0) {
          bestReason = `Multi-factor semantic similarity (${(score * 100).toFixed(0)}%) with identical numeric facts`;
        } else {
          bestReason = `High semantic context similarity (${(score * 100).toFixed(0)}%) within active time window`;
        }
      }
    }

    const DUPLICATE_THRESHOLD = 0.60;
    if (highestScore >= DUPLICATE_THRESHOLD && bestEvent) {
      return {
        isDuplicate: true,
        matchedEvent: bestEvent,
        similarityScore: highestScore,
        matchReason: bestReason,
      };
    }

    return {
      isDuplicate: false,
      matchedEvent: null,
      similarityScore: highestScore,
      matchReason: 'Novel distinct market event',
    };
  }

  /**
   * Attaches an incoming news item to an existing event as an additional source,
   * maintaining ONE SOURCE OF TRUTH.
   */
  public static linkNewsToEvent(news: NewsItem, event: MarketEvent, matchReason: string, score: number): void {
    news.event_id = event.id;
    news.status = 'EVENT_LINKED';
    db.updateNewsItem(news.id, { event_id: event.id, status: 'EVENT_LINKED' });

    const sourceRecord: EventSource = {
      id: `es_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      event_id: event.id,
      news_id: news.id,
      source_name: news.source_name,
      source_url: news.source_url,
      language: news.language,
      original_title: news.title,
      original_content: news.content,
      published_at: news.published_at,
      matched_reason: matchReason,
      similarity_score: score,
      created_at: new Date().toISOString(),
    };
    db.addEventSource(sourceRecord);

    // Update parent event source count and source names
    const existingNames = new Set(event.source_names);
    existingNames.add(news.source_name);

    // Merge any new affected assets or currencies
    const mergedAssets = new Set([...event.affected_assets, ...news.affected_assets]);
    const mergedCurrs = new Set([...event.affected_currencies, ...news.affected_currencies]);

    db.updateEvent(event.id, {
      source_count: event.source_count + 1,
      source_names: Array.from(existingNames),
      affected_assets: Array.from(mergedAssets),
      affected_currencies: Array.from(mergedCurrs),
      is_duplicate_resolved: true,
      last_updated_at: new Date().toISOString(),
    });
  }
}
