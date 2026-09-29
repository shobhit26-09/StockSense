import { describe, expect, it } from 'vitest';
import { calculateSentiment, classifyHeadline } from '../sentimentService';
import type { StockQuote } from '../multiSourceDataService';
const now = Date.parse('2026-09-29T05:00:00Z');
const quote = (changePercent: number, source = 'yahoo', timestamp = now): StockQuote => ({ symbol: 'X', name: 'X', price: 100, change: changePercent, changePercent, previousClose: 99, source, timestamp });
const syms = Array.from({ length: 10 }, (_, i) => `S${i}`);
const headline = (title: string, publishedAt = new Date(now).toISOString()) => ({ title, source: 'Publisher', url: 'https://example.com/story', publishedAt, dataMode: 'live' });
describe('market sentiment', () => {
  it('uses actual valid quotes and excludes backup/stale', () => {
    const q = new Map(syms.map((s, i) => [s, quote(i < 7 ? 1 : -1)]));
    expect(calculateSentiment(q, syms, [], now).breadth).toMatchObject({ positive: 7, negative: 3, score: 70 });
    q.set('S0', quote(1, 'backup')); q.set('S1', quote(1, 'yahoo', now - 900_001)); q.set('S2', quote(1, 'yahoo', now + 1));
    expect(calculateSentiment(q, syms, [], now)).toMatchObject({ score: null, breadth: null, coverage: 7, label: 'Unavailable' });
  });
  it('scores only sourced recent news, separates macro, and rebalances', () => {
    const a = [headline('Shares rally on profit growth'), headline('Bank stock surges'), headline('Nifty falls on losses'), headline('RBI rate hike'), headline('Old rally', '2026-09-01T00:00:00Z')];
    const r = calculateSentiment(new Map(), syms, a, now);
    expect(r).toMatchObject({ breadth: null, news: { positive: 2, negative: 1, score: 67 }, macro: { negative: 1, score: 0 }, score: 42 });
    expect(r.headlines).toHaveLength(3);
    expect(r.macroHeadlines).toHaveLength(1);
  });
  it('does not treat negations or unknown headlines as bullish', () => {
    expect(classifyHeadline('No gains after results').tone).toBe('neutral');
    expect(classifyHeadline('Company announces board meeting').tone).toBe('neutral');
  });
});
