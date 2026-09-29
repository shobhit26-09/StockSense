import type { HistorySeries } from '@/services/historyService';

export interface ForecastResult {
  from: number;
  asOf: number;
  target: number;
  lower: number;
  upper: number;
  predictedReturn: number;
  holdoutMae: number;
  baselineMae: number;
  directionAccuracy: number;
  trainCount: number;
  testCount: number;
  residualCoverage: number;
  provisionalExcluded: boolean;
  availableFor: string;
}
const dayIST = (t: number) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
const isOpenIST = (t: number) => {
  const d = new Date(t);
  const time = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d).replace(':', ''));
  const weekday = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short' }).format(d);
  return weekday !== 'Sat' && weekday !== 'Sun' && time >= 915 && time < 1535;
};
const rawFeatures = (close: number[], i: number): number[] => {
  const logs = (lag: number) => Math.log(close[i] / close[i - lag]);
  const daily = Array.from({ length: 10 }, (_, n) => Math.log(close[i - n] / close[i - n - 1]));
  const mean = daily.reduce((a, b) => a + b, 0) / daily.length;
  const vol = Math.sqrt(daily.reduce((a, b) => a + (b - mean) ** 2, 0) / daily.length);
  return [logs(1), logs(5), logs(20), vol];
};
// Standardized ridge regression, unpenalized intercept. Solve a tiny 5x5
// normal equation with partial pivoting; no server, API key, or pretrained claim.
const fit = (x: number[][], y: number[]) => {
  const n = x.length, p = x[0].length;
  const means = Array.from({ length: p }, (_, j) => x.reduce((s, r) => s + r[j], 0) / n);
  const scales = means.map((m, j) => Math.sqrt(x.reduce((s, r) => s + (r[j] - m) ** 2, 0) / n) || 1);
  const norm = (r: number[]) => [1, ...r.map((v, j) => (v - means[j]) / scales[j])];
  const z = x.map(norm), dim = p + 1;
  const mat = Array.from({ length: dim }, (_, i) => Array.from({ length: dim + 1 }, (_, j) => {
    if (j === dim) return z.reduce((sum, row, k) => sum + row[i] * y[k], 0);
    return z.reduce((sum, row) => sum + row[i] * row[j], 0) + (i === j && i > 0 ? 30 : 0);
  }));
  for (let col = 0; col < dim; col++) {
    let pivot = col;
    for (let k = col + 1; k < dim; k++) if (Math.abs(mat[k][col]) > Math.abs(mat[pivot][col])) pivot = k;
    if (Math.abs(mat[pivot][col]) < 1e-12) return null;
    [mat[col], mat[pivot]] = [mat[pivot], mat[col]];
    const divisor = mat[col][col];
    for (let j = col; j <= dim; j++) mat[col][j] /= divisor;
    for (let k = 0; k < dim; k++) if (k !== col) {
      const factor = mat[k][col];
      for (let j = col; j <= dim; j++) mat[k][j] -= factor * mat[col][j];
    }
  }
  const beta = mat.map(row => row[dim]);
  return (row: number[]) => norm(row).reduce((s, v, j) => s + v * beta[j], 0);
};

export const trainForecast = (series: HistorySeries, now = Date.now()): ForecastResult | null => {
  if (series.source !== 'yahoo') return null;
  const byDay = new Map<string, { t: number; c: number }>();
  for (const point of series.points) if (point.t <= now && point.c > 0 && Number.isFinite(point.c)) byDay.set(dayIST(point.t), point);
  const ordered = [...byDay.values()].sort((a, b) => a.t - b.t);
  const provisionalExcluded = ordered.length > 0 && dayIST(ordered.at(-1)!.t) === dayIST(now) && isOpenIST(now);
  if (provisionalExcluded) ordered.pop();
  if (ordered.length < 151 || now - ordered.at(-1)!.t > 7 * 86_400_000) return null;
  const latest = ordered.slice(-260), closes = latest.map(p => p.c);
  const x: number[][] = [], y: number[] = [];
  for (let i = 20; i < closes.length - 1; i++) {
    x.push(rawFeatures(closes, i));
    y.push(Math.log(closes[i + 1] / closes[i]));
  }
  const testCount = 30, split = x.length - testCount;
  if (split < 100) return null;
  const model = fit(x.slice(0, split), y.slice(0, split));
  if (!model) return null;
  const errors: number[] = [], absErr: number[] = [], naiveErr: number[] = [];
  let directions = 0;
  for (let j = split; j < x.length; j++) {
    const predicted = model(x[j]);
    errors.push(y[j] - predicted);
    absErr.push(Math.abs(Math.exp(predicted) - Math.exp(y[j])));
    naiveErr.push(Math.abs(1 - Math.exp(y[j])));
    if ((predicted > 0) === (y[j] > 0)) directions++;
  }
  const finalModel = fit(x, y);
  if (!finalModel) return null;
  const predictedReturn = finalModel(rawFeatures(closes, closes.length - 1));
  // Out-of-sample residual interval, empirical 10th/90th quantiles. Descriptive
  // only: with 30 holdout observations, this is NOT a guaranteed 80% interval.
  errors.sort((a, b) => a - b);
  const quantile = (q: number) => { const pos = q * (errors.length - 1), a = Math.floor(pos); return errors[a] + (errors[Math.ceil(pos)] - errors[a]) * (pos - a); };
  const from = closes.at(-1)!;
  return {
    from, asOf: latest.at(-1)!.t, target: from * Math.exp(predictedReturn),
    lower: from * Math.exp(predictedReturn + quantile(0.1)), upper: from * Math.exp(predictedReturn + quantile(0.9)),
    predictedReturn: (Math.exp(predictedReturn) - 1) * 100,
    holdoutMae: absErr.reduce((a, b) => a + b, 0) / testCount * 100,
    baselineMae: naiveErr.reduce((a, b) => a + b, 0) / testCount * 100,
    directionAccuracy: directions / testCount * 100,
    trainCount: x.length, testCount, provisionalExcluded,
    availableFor: provisionalExcluded ? 'Next session after today closes' : 'Next trading session',
    residualCoverage: errors.filter(e => e >= quantile(0.1) && e <= quantile(0.9)).length / testCount * 100,
  };
};
