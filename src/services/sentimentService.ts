import type { StockQuote } from '@/services/multiSourceDataService';

/**
 * Market sentiment engine.
 * Six independent, sourced signals are each mapped to a 0-100 score (50 = neutral),
 * then blended with fixed weights. A signal with no valid live input is dropped and
 * the remaining weights are rebalanced - nothing is ever filled in with a made-up number.
 */

export type Tone = 'positive' | 'negative' | 'neutral';
export type SignalKey = 'breadth' | 'trend' | 'volatility' | 'flows' | 'global' | 'news';

export interface SentimentHeadline {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  description?: string;
  dataMode?: string;
}
export interface HeadlineSignal extends SentimentHeadline { tone: Tone; score: number; matched: string[]; ageHours: number }

export interface SignalResult {
  key: SignalKey;
  label: string;
  /** 0-100, 50 neutral. */
  score: number;
  weight: number;
  /** Short plain-text reading shown in the table, e.g. "34 up / 16 down". */
  reading: string;
  /** Where the number comes from. */
  source: string;
}

export interface SentimentResult {
  score: number | null;
  label: SentimentLabel;
  signals: SignalResult[];
  missing: { key: SignalKey; label: string }[];
  headlines: HeadlineSignal[];
  /** Share of the full weight that had live data (0-1). */
  confidence: number;
  topDriver: SignalResult | null;
  topDrag: SignalResult | null;
  updatedAt: number;
}
export type SentimentLabel = 'Bullish' | 'Constructive' | 'Neutral' | 'Cautious' | 'Bearish' | 'Unavailable';

export const WEIGHTS: Record<SignalKey, number> = { breadth: 0.22, trend: 0.2, volatility: 0.14, flows: 0.16, global: 0.14, news: 0.14 };
export const SIGNAL_LABELS: Record<SignalKey, string> = {
  breadth: 'Market breadth', trend: 'Index trend', volatility: 'Volatility (India VIX)',
  flows: 'Institutional flows', global: 'Global cues', news: 'News tone',
};

const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const sma = (v: number[], n: number) => v.length >= n ? v.slice(-n).reduce((a, b) => a + b, 0) / n : null;
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
/** Smooth squash: maps x (in units where `scale` is a "strong" move) into 0-100 around 50. */
const squash = (x: number, scale: number) => 50 + 50 * Math.tanh(x / scale);

export const labelFor = (score: number | null): SentimentLabel =>
  score === null ? 'Unavailable' : score >= 70 ? 'Bullish' : score >= 56 ? 'Constructive' : score > 44 ? 'Neutral' : score > 30 ? 'Cautious' : 'Bearish';

/* ---------- 1. Breadth: index-weighted advance/decline plus average move ---------- */
export interface BreadthInput { quotes: Map<string, StockQuote>; members: { symbol: string; w: number }[]; now?: number }
export const breadthSignal = ({ quotes, members, now = Date.now() }: BreadthInput): SignalResult | null => {
  const live = members
    .map(m => ({ m, q: quotes.get(m.symbol) }))
    .filter((x): x is { m: { symbol: string; w: number }; q: StockQuote } => Boolean(x.q && x.q.source === 'yahoo' && finite(x.q.changePercent) && x.q.price > 0 && now >= x.q.timestamp && now - x.q.timestamp < 15 * 60_000));
  if (live.length < 12) return null;
  const totalW = live.reduce((s, x) => s + x.m.w, 0);
  const up = live.filter(x => x.q.changePercent > 0.05);
  const down = live.filter(x => x.q.changePercent < -0.05);
  const wUp = up.reduce((s, x) => s + x.m.w, 0), wDown = down.reduce((s, x) => s + x.m.w, 0);
  const ad = (wUp - wDown) / totalW; // -1..1 by index weight
  const avg = live.reduce((s, x) => s + x.m.w * x.q.changePercent, 0) / totalW;
  const score = clamp(0.55 * (50 + 50 * ad) + 0.45 * squash(avg, 1.2));
  return { key: 'breadth', label: SIGNAL_LABELS.breadth, score: Math.round(score), weight: WEIGHTS.breadth, reading: `${up.length} up / ${down.length} down, weighted move ${pct(avg)}`, source: `NIFTY heavyweights, ${live.length} live Yahoo quotes` };
};

/* ---------- 2. Trend: NIFTY vs its 20/50-day averages and 1-month return ---------- */
export const trendSignal = (closes: number[] | null): SignalResult | null => {
  if (!closes || closes.length < 55) return null;
  const last = closes[closes.length - 1];
  const m20 = sma(closes, 20)!, m50 = sma(closes, 50)!;
  const d20 = 100 * (last / m20 - 1), d50 = 100 * (last / m50 - 1);
  const r1m = 100 * (last / closes[closes.length - 22] - 1);
  const slope = 100 * (m20 / (sma(closes.slice(0, -5), 20) ?? m20) - 1); // is the 20DMA rising?
  const score = clamp(0.35 * squash(d20, 2.5) + 0.3 * squash(d50, 4) + 0.2 * squash(r1m, 5) + 0.15 * squash(slope, 1));
  return { key: 'trend', label: SIGNAL_LABELS.trend, score: Math.round(score), weight: WEIGHTS.trend, reading: `${pct(d20)} vs 20DMA, ${pct(d50)} vs 50DMA, 1M ${pct(r1m)}`, source: 'NIFTY 50 daily closes, Yahoo' };
};

/* ---------- 3. Volatility: VIX level vs its own 6M range, plus today's jump ---------- */
export const volatilitySignal = (closes: number[] | null): SignalResult | null => {
  if (!closes || closes.length < 40) return null;
  const last = closes[closes.length - 1], prev = closes[closes.length - 2];
  const below = closes.filter(c => c <= last).length / closes.length; // percentile 0-1
  const day = 100 * (last / prev - 1);
  const score = clamp(0.7 * (100 - 100 * below) + 0.3 * (50 - 50 * Math.tanh(day / 6)));
  return { key: 'volatility', label: SIGNAL_LABELS.volatility, score: Math.round(score), weight: WEIGHTS.volatility, reading: `${last.toFixed(2)} (${pct(day)} today), ${Math.round(100 * below)}th percentile of 6M`, source: 'India VIX daily closes, Yahoo' };
};

/* ---------- 4. Flows: FII and DII net cash-market buying ---------- */
export interface FlowRow { l: string; v: number }
export interface FlowInput { fii: FlowRow[]; dii: FlowRow[]; updatedAt?: string }
const crore = (n: number) => `${n < 0 ? '-' : '+'}₹${Math.abs(Math.round(n)).toLocaleString('en-IN')} cr`;
export const flowsSignal = (flows: FlowInput | null, now = Date.now()): SignalResult | null => {
  if (!flows) return null;
  const take = (rows: FlowRow[]) => rows.filter(r => finite(r.v) && /^\d{4}-\d{2}-\d{2}$/.test(r.l)).sort((a, b) => b.l.localeCompare(a.l));
  const fii = take(flows.fii), dii = take(flows.dii);
  if (fii.length < 5 || dii.length < 5) return null;
  if (now - Date.parse(`${fii[0].l}T00:00:00+05:30`) > 6 * 86_400_000) return null; // stale feed is not a signal
  const f5 = fii.slice(0, 5).reduce((s, r) => s + r.v, 0), d5 = dii.slice(0, 5).reduce((s, r) => s + r.v, 0);
  const f1 = fii[0].v;
  const fSeries = fii.slice(0, 20), mean = fSeries.reduce((s, r) => s + r.v, 0) / fSeries.length;
  const sd = Math.sqrt(fSeries.reduce((s, r) => s + (r.v - mean) ** 2, 0) / fSeries.length) || 5000;
  const net5 = f5 + 0.5 * d5; // DII cushions FII selling, but only partly
  const score = clamp(0.6 * squash(net5, 5 * sd * 0.8) + 0.4 * squash(f1, 1.5 * sd));
  return { key: 'flows', label: SIGNAL_LABELS.flows, score: Math.round(score), weight: WEIGHTS.flows, reading: `FII ${crore(f5)}, DII ${crore(d5)} over 5 sessions`, source: `NSE/BSE provisional data via StockEdge, to ${fii[0].l}` };
};

/* ---------- 5. Global cues: US, Japan, Hong Kong, crude and the rupee ---------- */
export interface GlobalMove { key: 'spx' | 'nikkei' | 'hsi' | 'brent' | 'inr'; name: string; changePct: number }
const GLOBAL_RULES: Record<GlobalMove['key'], { sign: 1 | -1; scale: number; w: number }> = {
  spx: { sign: 1, scale: 1.2, w: 0.35 }, nikkei: { sign: 1, scale: 1.5, w: 0.15 }, hsi: { sign: 1, scale: 1.8, w: 0.15 },
  brent: { sign: -1, scale: 2.5, w: 0.2 }, inr: { sign: -1, scale: 0.5, w: 0.15 }, // USDINR up = rupee weaker = negative
};
export const globalSignal = (moves: GlobalMove[]): SignalResult | null => {
  const ok = moves.filter(m => finite(m.changePct));
  if (ok.length < 3 || !ok.some(m => m.key === 'spx')) return null;
  const tw = ok.reduce((s, m) => s + GLOBAL_RULES[m.key].w, 0);
  const score = ok.reduce((s, m) => { const r = GLOBAL_RULES[m.key]; return s + r.w * squash(r.sign * m.changePct, r.scale); }, 0) / tw;
  return { key: 'global', label: SIGNAL_LABELS.global, score: Math.round(clamp(score)), weight: WEIGHTS.global, reading: ok.map(m => `${m.name} ${pct(m.changePct)}`).join(', '), source: 'Last daily close vs prior close, Yahoo' };
};

/* ---------- 6. News: weighted finance lexicon, negation-aware, recency-decayed ---------- */
const LEX: [RegExp, number][] = [
  [/\b(record high|all-time high|fresh high|52-week high)\b/, 3], [/\b(surges?|soars?|skyrockets?|jumps?|zooms?|bull run)\b/, 2.5], [/\b(rall(?:y|ies|ied)|rebounds?|recovers?|climbs?|gains?|advances?|rises?|rose)\b/, 1.5],
  [/\b(beats?|upgrades?|outperform\w*|buy rating|strong (?:results?|earnings|demand)|profit (?:jumps?|rises?|growth)|inflows?|net buyers?|buying)\b/, 1.5],
  [/\b(rate cuts?|cuts? (?:repo|rates?)|eases?|cools?|softens?|ceasefire|trade deal|stimulus|relief)\b/, 1.5], [/\b(optimis\w+|bullish|upbeat|positive|resilient|robust)\b/, 1],
  [/\b(crash(?:es|ed)?|plunges?|plummets?|tanks?|collapses?|meltdown|bloodbath|rout)\b/, -3], [/\b(sell-?off|slumps?|tumbles?|sinks?|slides?|nosedives?|panic)\b/, -2.5],
  [/\b(falls?|fell|drops?|declines?|slips?|dips?|weakens?|retreats?|loses?|losses)\b/, -1.5],
  [/\b(misses?|downgrades?|underperform\w*|sell rating|profit (?:falls?|slumps?|drops?)|weak (?:results?|earnings|demand)|outflows?|net sellers?|selling|dumps?|offloads?)\b/, -1.5],
  [/\b(rate hikes?|hikes? (?:repo|rates?)|tariffs?|sanctions?|war|conflict|escalat\w+|inflation (?:rises?|jumps?|spikes?)|recession|default|fraud|probe|penalty|ban)\b/, -2], [/\b(bearish|worr(?:y|ies|ied)|fears?|concerns?|uncertain\w*|volatil\w+|risk-?off|pressure|headwinds?)\b/, -1],
];
const NEG = /\b(no|not|never|without|fails? to|unlikely to|ends?|snaps?|halts?|stops?)\b(?:\W+\w+){0,2}?\W+$/;
export const scoreHeadline = (title: string): { score: number; matched: string[] } => {
  const text = ` ${title.toLowerCase().replace(/[’']/g, "'")} `;
  let total = 0; const matched: string[] = [];
  const seen = new Set<string>();
  for (const [re, w] of LEX) {
    const g = new RegExp(re.source, 'g');
    for (const m of text.matchAll(g)) {
      const term = m[0].trim();
      if (seen.has(term)) continue;
      seen.add(term);
      const before = text.slice(0, m.index);
      const negated = NEG.test(before.slice(-28));
      total += negated ? -0.6 * w : w;
      matched.push(negated ? `not ${term}` : term);
    }
  }
  return { score: clamp(total, -4, 4) / 4, matched };
};

/** Relevance is separate from tone: a company rally is not a market rally.
 * Check the headline, never the RSS description (often padded with market keywords).
 * Conservative allow-list: unclear stories stay in News, but do not move this gauge.
 */
export const isMarketWideHeadline = (title: string): boolean => {
  const text = title.toLowerCase().replace(/[’']/g, "'").replace(/^(?:taking stock|mid-day mood|global markets?)\s*[:|]\s*/, '');
  const companyStory = /\b(ipo|ipos|gmp|grey market|listing|lists|debut|q[1-4]|quarterly|earnings|results|dividend|buyback|stock split|bonus shares|price target|target price|buy rating|sell rating|upgrade|downgrade|order win|order book|stake sale|merger|acquisition)\b/;
  if (/\b(ipo|ipos|gmp|grey market|listing|lists|debut)\b/.test(text)) return false;
  // A named stock remains a company story even when its explanation mentions RBI,
  // crude or a broad sell-off. Aggregate equity/index subjects are the exception.
  const aggregate = /\b(nifty|sensex|indices|indexes|s&p\s*500|nasdaq|dow jones|nikkei|hang seng|ftse|dax|stoxx|wall street|dalal street|india vix|(?:india|indian|us|u\.s\.)\s+bonds?|(?:global|world|asian|asia|european|europe|us|u\.s\.|indian|india|domestic|emerging|equity|stock|share|financial|broader)\s+(?:stock\s+|equity\s+)?markets?|(?:global|asian|european|us|indian|domestic|emerging|china|chinese|japan|japanese|hong kong)\s+(?:stocks|equities|shares)|stocks? market|market breadth)\b/;
  const firstClause = text.split(/\b(?:as|amid|after|despite|ahead of|on fears of)\b|[;:]/)[0];
  const namedStock = /\b(?:stock|share)\s+(?:price|prices|rallies|rally|surges?|jumps?|falls?|drops?|slips?|dips?|crash\w*|plunges?|tumbles?|gains?|loses?)\b|\bshares\s+(?:of|in)\b|\b(?:itc|paytm|senco(?: gold)?)\b/;
  if (namedStock.test(firstClause) && !aggregate.test(firstClause)) return false;
  if (aggregate.test(firstClause) || /\bmarket\s+(?:rall(?:y|ies)|fails?|falls?|surges?|crash\w*|sell-?off|gains?|slips?|jumps?|rebounds?)\b/.test(firstClause)) return true;
  if (companyStory.test(text)) return false;
  const macro = /\b(rbi|reserve bank of india|repo rate|monetary policy|interest rates?|rate cuts?|rate hikes?|fed|federal reserve|fomc|ecb|boj|central banks?|fii|fiis|dii|diis|fpi|fpis|foreign (?:investors?|inflows?|outflows?)|institutional (?:flows?|buying|selling)|crude|brent|wti|oil prices?|rupee|usd\/?inr|dollar index|inflation|cpi|wpi|gdp|fiscal deficit|union budget|bond yields?|treasury yields?|geopolit\w*|war|ceasefire|sanctions?|tariffs?|trade (?:war|deal)|global sell-?off|global recession)\b/;
  return macro.test(firstClause);
};

export interface NewsInput { articles: SentimentHeadline[]; now?: number }
export const newsSignal = ({ articles, now = Date.now() }: NewsInput): { signal: SignalResult | null; headlines: HeadlineSignal[] } => {
  const unique = new Set<string>();
  const headlines: HeadlineSignal[] = [];
  for (const a of articles) {
    const age = now - Date.parse(a.publishedAt);
    if (!a.title || !isMarketWideHeadline(a.title) || !/^https:\/\//.test(a.url) || a.dataMode !== 'live' || !Number.isFinite(age) || age < -10 * 60_000 || age > 48 * 3_600_000) continue;
    const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 70);
    if (unique.has(key)) continue;
    unique.add(key);
    const { score, matched } = scoreHeadline(a.title);
    headlines.push({ ...a, score, matched, tone: score > 0.12 ? 'positive' : score < -0.12 ? 'negative' : 'neutral', ageHours: Math.max(0, age / 3_600_000) });
  }
  headlines.sort((a, b) => a.ageHours - b.ageHours);
  const used = headlines.slice(0, 24);
  const scored = used.filter(h => h.matched.length);
  if (scored.length < 3) return { signal: null, headlines: used };
  let num = 0, den = 0;
  for (const h of scored) { const w = Math.pow(0.5, h.ageHours / 12); num += w * h.score; den += w; }
  const mean = num / den;
  const shrunk = mean * (scored.length / (scored.length + 3)); // few headlines pull toward neutral
  const pos = used.filter(h => h.tone === 'positive').length, neg = used.filter(h => h.tone === 'negative').length;
  return {
    signal: { key: 'news', label: SIGNAL_LABELS.news, score: Math.round(clamp(50 + 50 * shrunk)), weight: WEIGHTS.news, reading: `${pos} positive / ${neg} negative of ${used.length} macro headlines, last 48h`, source: 'Market-wide publisher RSS only, recency-weighted (12h half-life)' },
    headlines: used,
  };
};

/* ---------- Composite ---------- */
export const combineSignals = (signals: (SignalResult | null)[], headlines: HeadlineSignal[], now = Date.now()): SentimentResult => {
  const live = signals.filter((s): s is SignalResult => s !== null);
  const have = new Set(live.map(s => s.key));
  const missing = (Object.keys(WEIGHTS) as SignalKey[]).filter(k => !have.has(k)).map(k => ({ key: k, label: SIGNAL_LABELS[k] }));
  const tw = live.reduce((s, x) => s + x.weight, 0);
  const confidence = tw; // weights sum to 1 when everything is live
  const score = live.length >= 3 && tw >= 0.5 ? Math.round(live.reduce((s, x) => s + x.score * x.weight, 0) / tw) : null;
  const byImpact = [...live].sort((a, b) => (b.score - 50) * b.weight - (a.score - 50) * a.weight);
  const topDriver = byImpact[0] && byImpact[0].score > 55 ? byImpact[0] : null;
  const last = byImpact[byImpact.length - 1];
  const topDrag = last && last.score < 45 ? last : null;
  return { score, label: labelFor(score), signals: live, missing, headlines, confidence, topDriver, topDrag, updatedAt: now };
};
