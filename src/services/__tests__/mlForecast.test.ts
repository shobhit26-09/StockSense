import { describe, expect, it } from 'vitest';
import { trainForecast } from '../mlForecast';
import type { HistorySeries } from '../historyService';
const start = Date.parse('2025-10-02T10:00:00Z');
const series = (count: number, source: HistorySeries['source'] = 'yahoo'): HistorySeries => ({ symbol: 'TEST.NS', source, points: Array.from({ length: count }, (_, i) => ({ t: start + i * 86_400_000, c: 100 + 0.15 * i + 3 * Math.sin(i / 6) })) });
describe('trained ML forecast', () => {
  it('fits ridge model, tests held-out sessions and produces finite estimates', () => {
    const data = series(220); const f = trainForecast(data, data.points.at(-1)!.t + 86_400_000)!;
    expect(f.trainCount).toBe(199); expect(f.testCount).toBe(30);
    expect(f.target).toBeGreaterThan(0); expect(f.lower).toBeLessThan(f.upper);
    expect(Number.isFinite(f.holdoutMae)).toBe(true);
    expect(f.directionAccuracy).toBeGreaterThanOrEqual(0);
    expect(f.directionAccuracy).toBeLessThanOrEqual(100);
  });
  it('rejects sample data and insufficient or stale history', () => {
    const data = series(220);const now=data.points.at(-1)!.t + 86_400_000;
    expect(trainForecast(series(220, 'sample'), now)).toBeNull();
    expect(trainForecast(series(100), now)).toBeNull();
    expect(trainForecast(data, now + 8 * 86_400_000)).toBeNull();
  });
});
