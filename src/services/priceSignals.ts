import type { HistorySeries } from '@/services/historyService';

export interface PriceSignal {
  price: number;
  asOf: number;
  closes: number;
  sma20: number;
  sma50: number;
  sma200: number | null;
  return20: number;
  return60: number | null;
  high20: number;
  low20: number;
  volatility20: number;
  distance20: number;
  state: 'Above trend' | 'Below trend' | 'Mixed';
  points: { t: number; close: number; average: number | null }[];
}
const mean = (values: number[]) => values.reduce((s, v) => s + v, 0) / values.length;
export const computePriceSignals = (series: HistorySeries, referenceTime = Date.now()): PriceSignal | null => {
  if (series.source !== 'yahoo') return null;
  const points = series.points.filter(p => Number.isFinite(p.t) && Number.isFinite(p.c) && p.c > 0 && p.t <= referenceTime).sort((a, b) => a.t - b.t);
  const unique = points.filter((p, i) => i === points.length - 1 || p.t !== points[i + 1].t);
  if (unique.length < 51 || referenceTime - unique.at(-1)!.t > 5 * 86_400_000 || referenceTime < unique.at(-1)!.t) return null;
  const close = unique.map(p => p.c);
  const last = close.at(-1)!;
  const sma20 = mean(close.slice(-20));
  const sma50 = mean(close.slice(-50));
  const sma200 = close.length >= 200 ? mean(close.slice(-200)) : null;
  const window20 = close.slice(-20);
  const returns = window20.slice(1).map((n, i) => Math.log(n / window20[i]));
  const avgReturn = mean(returns);
  const variance = returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / (returns.length - 1);
  const volatility20 = Math.sqrt(variance) * Math.sqrt(252) * 100;
  const above20 = last >= sma20;
  const above50 = last >= sma50;
  return {
    price: last, asOf: unique.at(-1)!.t, closes: close.length, sma20, sma50, sma200,
    return20: (last / close.at(-21)! - 1) * 100,
    return60: close.length >= 61 ? (last / close.at(-61)! - 1) * 100 : null,
    high20: Math.max(...window20), low20: Math.min(...window20), volatility20,
    distance20: (last / sma20 - 1) * 100,
    state: above20 && above50 ? 'Above trend' : !above20 && !above50 ? 'Below trend' : 'Mixed',
    points: unique.slice(-126).map((p, i, sample) => ({
      t: p.t, close: p.c,
      average: i >= 19 ? mean(sample.slice(i - 19, i + 1).map(x => x.c)) : null,
    })),
  };
};
