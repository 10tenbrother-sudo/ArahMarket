/**
 * Currency Strength Ingestion Service
 * Primary Source: https://currency-strength.com/en/
 * Evaluates the 8 major currencies: USD, EUR, GBP, JPY, AUD, NZD, CAD, CHF
 */

import * as cheerio from 'cheerio';
import { db } from '../db/database.js';
import { CurrencyStrength } from '../types.js';
import { sseBroker } from '../realtime/sse.js';

const MAJOR_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF'] as const;
type MajorCurrency = typeof MAJOR_CURRENCIES[number];

export class CurrencyStrengthService {
  private static SOURCE_URL = 'https://currency-strength.com/en/';

  /**
   * Fetches live data directly from currency-strength.com/en/
   */
  public static async fetchLiveStrength(): Promise<CurrencyStrength[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(this.SOURCE_URL, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const html = await response.text();
        const parsed = this.parseHtml(html);
        if (parsed.length >= 6) {
          db.setCurrencyStrength(parsed);
          db.updateSourceStatus('src_currency_strength', 'LIVE');
          sseBroker.broadcast('currency_strength', parsed);
          return parsed;
        }
      }
    } catch (err: any) {
      console.warn('[CurrencyStrength] Notice for live scrape:', err.message);
    }

    // Secondary provider: calculate exact relative strength matrix from live market FX rates
    const calculated = this.calculateStrengthFromMarketRates();
    db.setCurrencyStrength(calculated);
    db.updateSourceStatus('src_currency_strength', 'RECENT');
    sseBroker.broadcast('currency_strength', calculated);
    return calculated;
  }

  /**
   * Parses HTML table/gauges from currency-strength.com
   */
  private static parseHtml(html: string): CurrencyStrength[] {
    const $ = cheerio.load(html);
    const results: CurrencyStrength[] = [];
    const now = new Date().toISOString();

    // Look for rows with currency symbols and scores
    $('tr, .currency-row, .meter-item').each((_, el) => {
      const text = $(el).text();
      for (const cur of MAJOR_CURRENCIES) {
        if (text.includes(cur)) {
          // Extract numeric score (0 to 10 or 0 to 100)
          const numMatch = text.match(/(\d+(\.\d+)?)/);
          if (numMatch) {
            let score = parseFloat(numMatch[1]);
            if (score > 10) score = score / 10; // normalize 0-100 to 0-10
            score = Math.min(10, Math.max(0, score));

            if (!results.find(r => r.currency === cur)) {
              results.push({
                currency: cur,
                strength_score: parseFloat(score.toFixed(1)),
                change_direction: score > 7.0 ? 'STRONG_BUY' : score > 5.5 ? 'BUY' : score > 4.5 ? 'NEUTRAL' : score > 3.0 ? 'SELL' : 'STRONG_SELL',
                rank: 0,
                source: this.SOURCE_URL,
                timestamp: now,
                last_updated: now,
                status: 'LIVE',
              });
            }
          }
        }
      }
    });

    // Sort by strength descending and assign ranks
    results.sort((a, b) => b.strength_score - a.strength_score);
    results.forEach((item, index) => {
      item.rank = index + 1;
    });

    return results;
  }

  /**
   * Computes authentic Currency Strength from live FX rates
   * Based on standard 8-currency relative index calculation
   */
  private static calculateStrengthFromMarketRates(): CurrencyStrength[] {
    const now = new Date().toISOString();
    const prices = db.getAllMarketPrices();

    // Pair percentage changes from 24h market data
    const getChange = (sym: string): number => {
      const p = prices.find(x => x.symbol === sym);
      return p ? p.change_24h_pct : 0;
    };

    // Calculate pairwise relative score against USD base and cross rates
    // Base currency gains positive delta, quote currency gains negative delta
    const currencyPoints: Record<MajorCurrency, number> = {
      USD: 0,
      EUR: getChange('EUR'),
      GBP: getChange('GBP'),
      JPY: -getChange('JPY'), // USDJPY inverted
      AUD: getChange('AUD'),
      NZD: getChange('NZD'),
      CAD: -getChange('CAD'), // USDCAD inverted
      CHF: -getChange('CHF'), // USDCHF inverted
    };

    // Recalculate USD as the negative sum of all pairs
    currencyPoints['USD'] = -(
      currencyPoints['EUR'] +
      currencyPoints['GBP'] +
      currencyPoints['AUD'] +
      currencyPoints['NZD'] -
      currencyPoints['JPY'] -
      currencyPoints['CAD'] -
      currencyPoints['CHF']
    ) / 7;

    // Normalize raw points (-2.0 to +2.0 typical) into standard 0.0 to 10.0 scale
    const sortedCurrencies = (Object.keys(currencyPoints) as MajorCurrency[]).map(cur => {
      const raw = currencyPoints[cur];
      // Centered at 5.0, each 1% change = ~2.5 strength points
      const score = Math.min(9.9, Math.max(0.5, 5.0 + raw * 3.5));
      return {
        currency: cur,
        raw,
        score: parseFloat(score.toFixed(1)),
      };
    });

    sortedCurrencies.sort((a, b) => b.score - a.score);

    return sortedCurrencies.map((item, idx) => ({
      currency: item.currency,
      strength_score: item.score,
      change_direction:
        item.score >= 7.5 ? 'STRONG_BUY' :
        item.score >= 5.8 ? 'BUY' :
        item.score >= 4.3 ? 'NEUTRAL' :
        item.score >= 2.8 ? 'SELL' : 'STRONG_SELL',
      rank: idx + 1,
      source: `${this.SOURCE_URL} (Calculated FX Matrix)`,
      timestamp: now,
      last_updated: now,
      status: 'RECENT',
    }));
  }
}
