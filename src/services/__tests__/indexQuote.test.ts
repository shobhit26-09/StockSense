import { describe, expect, it } from 'vitest';
import { correctIndexQuote } from '../indexQuote';
import type { StockQuote } from '../multiSourceDataService';
import type { HistorySeries } from '../historyService';
const now = Date.parse('2026-09-29T08:00:00Z');
const q: StockQuote = { symbol: '^NSEI', name: 'NIFTY 50', price: 22663.6, change: -476.9, changePercent: -2.06, previousClose: 23140.5, source: 'yahoo', timestamp: now };
const h: HistorySeries = { symbol: '^NSEI', source: 'yahoo', points: [
  { t: Date.parse('2026-09-25T03:45:00Z'), c: 23140.5 },
  { t: Date.parse('2026-09-28T03:45:00Z'), c: 22780.25 },
  { t: Date.parse('2026-09-29T03:45:00Z'), c: 22663.6 },
] };
describe('index quote correction from daily history', () => {
  it('uses last completed session, never the stale meta field', () => {
    const corrected = correctIndexQuote(q, h, now);
    expect(corrected.previousClose).toBe(22780.25);
    expect(corrected.change).toBeCloseTo(-116.65);
    expect(corrected.changePercent).toBeCloseTo(-0.512, 2);
  });
  it('never corrects from simulated or missing history', () => {
    expect(correctIndexQuote(q, { ...h, source: 'sample' }, now)).toEqual(q);
    expect(correctIndexQuote(q, { ...h, points: [] }, now)).toEqual(q);
  });
});
