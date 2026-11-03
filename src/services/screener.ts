// Screener presets over end-of-day data (public/data/screener.json).
// Every preset is a plain rule on dated numbers. Nothing here predicts anything.

export interface ScreenRow {
  s: string; n: string; sec: string; p: number;
  r1: number;   // 1-day change %
  r21: number;  // ~1 month change %
  r63: number;  // ~3 month change %
  hi: number;   // % from highest close in the dataset window (<= 0)
  rsi: number;  // RSI(14)
  ma50: number; // % above(+)/below(-) 50-day average
  vx: number;   // last session turnover / 20-day average turnover
  tcr: number;  // 20-day average turnover, Rs crore
}
export interface ScreenData {
  asOf: string; generatedAt: string; source: string; sessions: number; universe: number; rows: ScreenRow[];
}
export interface Preset {
  id: string; label: string; rule: string; caveat: string;
  test: (r: ScreenRow) => boolean;
  sort: (a: ScreenRow, b: ScreenRow) => number;
  why: (r: ScreenRow) => string;
}

const sgn = (v: number, d = 1) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}%`;

export const PRESETS: Preset[] = [
  {
    id: 'near-high', label: 'Near highs on volume',
    rule: 'Within 3% of its highest close this year, above its 50-day average, last session turnover at least 1.5x the 20-day average.',
    caveat: 'Strength can already be priced in. A move near a high can reverse.',
    test: (r) => r.hi >= -3 && r.ma50 > 0 && r.vx >= 1.5,
    sort: (a, b) => b.vx - a.vx,
    why: (r) => `${sgn(r.hi)} from high, ${sgn(r.ma50)} vs 50-day, turnover ${r.vx.toFixed(1)}x`,
  },
  {
    id: 'volume-surge', label: 'Volume surge',
    rule: 'Last session turnover at least 2.5x the 20-day average, and a price move of 2% or more in either direction.',
    caveat: 'Volume spikes often come from news, block deals or index changes. Check why.',
    test: (r) => r.vx >= 2.5 && Math.abs(r.r1) >= 2,
    sort: (a, b) => b.vx - a.vx,
    why: (r) => `turnover ${r.vx.toFixed(1)}x, day ${sgn(r.r1, 2)}`,
  },
  {
    id: 'uptrend-pullback', label: 'Pullback in an uptrend',
    rule: 'Up 10% or more over 3 months, still above its 50-day average (by at most 5%), RSI between 40 and 55.',
    caveat: 'A pullback can become a trend change. This rule has no stop or exit.',
    test: (r) => r.r63 >= 10 && r.ma50 > 0 && r.ma50 <= 5 && r.rsi >= 40 && r.rsi <= 55,
    sort: (a, b) => b.r63 - a.r63,
    why: (r) => `3m ${sgn(r.r63)}, ${sgn(r.ma50)} vs 50-day, RSI ${r.rsi}`,
  },
  {
    id: 'oversold', label: 'Oversold',
    rule: 'RSI(14) at or below 30 with turnover over Rs 5 crore a day.',
    caveat: 'Oversold can stay oversold. This is a watch list, not a buy signal.',
    test: (r) => r.rsi <= 30 && r.tcr >= 5,
    sort: (a, b) => a.rsi - b.rsi,
    why: (r) => `RSI ${r.rsi}, 1m ${sgn(r.r21)}, ${sgn(r.hi)} from high`,
  },
  {
    id: 'momentum', label: 'Steady momentum',
    rule: 'Up 15% or more over 3 months and 3% or more over 1 month, above its 50-day average, RSI between 55 and 72.',
    caveat: 'Past momentum does not carry forward reliably.',
    test: (r) => r.r63 >= 15 && r.r21 >= 3 && r.ma50 > 0 && r.rsi >= 55 && r.rsi <= 72,
    sort: (a, b) => b.r63 - a.r63,
    why: (r) => `3m ${sgn(r.r63)}, 1m ${sgn(r.r21)}, RSI ${r.rsi}`,
  },
];

export function runPreset(data: ScreenRow[], preset: Preset, limit = 25): { total: number; rows: ScreenRow[] } {
  const hit = data.filter(preset.test).sort(preset.sort);
  return { total: hit.length, rows: hit.slice(0, limit) };
}

/** Whole-day age of the dataset relative to a date string (YYYY-MM-DD). */
export function dataAgeDays(asOf: string, today = new Date()): number {
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.round((t - a) / 86400000));
}
