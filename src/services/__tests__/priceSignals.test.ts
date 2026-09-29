import { describe, expect, it } from 'vitest';
import { computePriceSignals } from '../priceSignals';
import type { HistorySeries } from '../historyService';
const now = Date.parse('2026-09-29T06:00:00Z');
const series = (count: number, source: HistorySeries['source'] = 'yahoo'): HistorySeries => ({ symbol: 'X.NS', source, points: Array.from({ length: count }, (_, i) => ({ t: now - (count - 1 - i) * 86_400_000, c: 100 + i })) });
describe('historical price signals', () => {
  it('calculates past returns, moving averages and 20-session close range', () => {
    const s = computePriceSignals(series(251), now)!;
    expect(s.price).toBe(350);
    expect(s.sma20).toBe(340.5);
    expect(s.sma50).toBe(325.5);
    expect(s.sma200).toBe(250.5);
    expect(s.high20).toBe(350);
    expect(s.low20).toBe(331);
    expect(s.return20).toBeCloseTo((350 / 330 - 1) * 100);
    expect(s.state).toBe('Above trend');
    expect(s.points).toHaveLength(126);
    expect(s.points.at(19)?.average).not.toBeNull();
  });
  it('refuses samples, stale series, or too little history', () => {
    expect(computePriceSignals(series(251, 'sample'), now)).toBeNull();
    expect(computePriceSignals(series(51), now + 6 * 86_400_000)).toBeNull();
    expect(computePriceSignals(series(50), now)).toBeNull();
  });
  it('can show mixed and below-trend conditions without a prediction', () => {
    const d = series(100); d.points[d.points.length - 1].c = 50;
    expect(computePriceSignals(d, now)?.state).toBe('Below trend');
    expect(computePriceSignals(series(51), now)?.sma200).toBeNull();
  });
});
