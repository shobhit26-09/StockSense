// Explainable-radar helpers for the Trade agent.
// Pure functions: they clean and enrich the smart-trade-agent response so the UI
// can show trigger time, invalidation, evidence and data freshness without
// depending on a redeploy of the edge function.

export interface RadarTradeIdea {
  symbol: string; name: string;
  action: 'BUY' | 'SHORT';
  entry: number; stopLoss: number; target: number;
  timeframe: string; confidence: number; catalyst?: string; reasoning: string;
}
export interface RadarNews {
  headline: string; source: string;
  impact: 'bullish' | 'bearish' | 'neutral';
  affects: string; rationale: string;
}
export interface FiiDiiLatest {
  date: string; fiiNet: number; diiNet: number;
  last5: { date: string; fii: number; dii: number }[];
}

/** Number of stocks the edge function scans (its fixed UNIVERSE list). */
export const RADAR_SCAN_SIZE = 75;
export const SEARCH_UNIVERSE_SIZE = 755;

/** Strip CDATA remnants, tags and HTML entities that leak out of RSS titles. */
export function cleanHeadline(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[/gi, '')
    .replace(/\]\]>/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#8217;/g, '\u2019')
    .replace(/\s+/g, ' ')
    .trim();
}

// Whole-word matching only. The old logic used substring checks, so "IT" matched
// inside words like "entities", "profit" and "provisions".
const SECTOR_RULES: { label: string; re: RegExp }[] = [
  { label: 'Regulation', re: /\b(sebi|rbi|regulator|penalty|penalt(y|ies)|circular|tribunal)\b/i },
  { label: 'Mutual funds', re: /\b(mutual funds?|amc|sip|nfo|\w+ mf)\b/i },
  { label: 'Indices', re: /\b(nifty|sensex|bank nifty|dalal street|stock market|market action)\b/i },
  { label: 'Macro', re: /\b(rupee|inflation|cpi|gdp|fed|repo rate|crude|oil prices?|tariffs?)\b/i },
  { label: 'Banking & finance', re: /\b(banks?|nbfc|lender|loans?|credit|sbi|hdfc|icici|axis bank|kotak|finance|financial services|insurance|msme)\b/i },
  { label: 'IT', re: /\b(infosys|tcs|wipro|hcl\s?tech|tech mahindra|software|it services|it stocks|it sector|ai)\b/i },
  { label: 'Auto', re: /\b(auto|automobile|maruti|tata motors|mahindra|bajaj auto|eicher|tvs|two-?wheelers?|ev)\b/i },
  { label: 'Pharma', re: /\b(pharma|drug|cipla|sun pharma|dr reddy|usfda|hospital|healthcare)\b/i },
  { label: 'Energy & metals', re: /\b(ongc|reliance|power|coal|steel|metals?|oil|gas|energy|adani|ntpc)\b/i },
  { label: 'Consumer & retail', re: /\b(fmcg|retail|consumption|consumer|bata|titan|dmart|nexus select|footwear|apparel)\b/i },
  { label: 'Capital markets', re: /\b(mcx|nse|bse|exchange|brokerage|motilal|ipo|listing|derivatives)\b/i },
];

export function mapHeadlineAffects(title: string, knownSymbols: string[] = []): string {
  const t = cleanHeadline(title);
  const upper = t.toUpperCase();
  const hits: string[] = [];
  for (const sym of knownSymbols) {
    const base = sym.replace('.NS', '').replace('&', '');
    if (base.length >= 4 && new RegExp(`\\b${base}\\b`).test(upper)) hits.push(base);
  }
  if (hits.length) return hits.slice(0, 3).join(', ');
  const sectors = SECTOR_RULES.filter((r) => r.re.test(t)).map((r) => r.label);
  if (sectors.length) return sectors.slice(0, 2).join(', ');
  return 'Broad market';
}

const BULL = ['surge', 'surges', 'rally', 'rallies', 'jump', 'jumps', 'gain', 'gains', 'beat', 'beats', 'record', 'upgrade', 'rise', 'rises', 'rockets', 'soars', 'strong', 'outperform', 'profit rises', 'raises'];
const BEAR = ['fall', 'falls', 'drop', 'drops', 'crash', 'plunge', 'plunges', 'decline', 'declines', 'loss', 'losses', 'cut', 'cuts', 'downgrade', 'slump', 'slide', 'tumble', 'fraud', 'probe', 'ban', 'penalty', 'levies', 'front-running', 'weak', 'miss', 'misses'];

export function classifyHeadline(title: string): 'bullish' | 'bearish' | 'neutral' {
  const words = cleanHeadline(title).toLowerCase().match(/[a-z-]+/g) ?? [];
  const text = ` ${words.join(' ')} `;
  let b = 0;
  let s = 0;
  for (const w of BULL) if (text.includes(` ${w} `)) b++;
  for (const w of BEAR) if (text.includes(` ${w} `)) s++;
  // "fall in provisions" is good news for a lender
  if (/ fall in (provisions|npas?|losses|inflation) /.test(text)) { s = Math.max(0, s - 1); b++; }
  if (b > s) return 'bullish';
  if (s > b) return 'bearish';
  return 'neutral';
}

export function enrichNews(items: RadarNews[], knownSymbols: string[] = []): RadarNews[] {
  return items.map((n) => {
    const headline = cleanHeadline(n.headline);
    const impact = classifyHeadline(headline);
    const affects = mapHeadlineAffects(headline, knownSymbols);
    const rationale =
      impact === 'bullish' ? `Positive wording - relevant to ${affects}.`
      : impact === 'bearish' ? `Negative wording - relevant to ${affects}.`
      : `No clear direction in the headline - relevant to ${affects}.`;
    return { ...n, headline, impact, affects, rationale };
  });
}

export const scoreLabel = (score: number) => `Setup score ${score}/100`;

export interface IdeaExplanation {
  evidence: string[];
  trigger: string;
  invalidation: string;
  asOf: string;
}

const istTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  });

/**
 * Turn the agent's terse reasoning into discrete evidence, plus honest scan-time,
 * quote and risk-level lines. The feed gives no quote timestamp, so we say so.
 */
export function explainIdea(t: RadarTradeIdea, timestamp: string, session?: string): IdeaExplanation {
  const evidence = t.reasoning
    .split(/\.\s+/)
    .map((s) => s.replace(/\.$/, '').trim())
    .filter((s) => s && !/^R:R/i.test(s));
  const long = t.action === 'BUY';
  const fmt = (v: number) => `\u20B9${v.toFixed(2)}`;
  const asOf = istTime(timestamp);
  const open = session === 'live';
  const quote = open
    ? 'Quote time is not reported by the free feed; it is delayed.'
    : 'Market is closed, so this is the last close or last trade, not a live price.';
  const trigger = `Scanned ${asOf} IST. Reference price ${fmt(t.entry)}. ${quote} The scan does not confirm that a breakout happened or that the price held.`;
  const slPct = Math.abs((t.stopLoss - t.entry) / t.entry) * 100;
  const tgtPct = Math.abs((t.target - t.entry) / t.entry) * 100;
  const invalidation =
    `Stop ${fmt(t.stopLoss)} (${slPct.toFixed(1)}% ${long ? 'below' : 'above'} the reference price) and target ${fmt(t.target)} (${tgtPct.toFixed(1)}%, about ${(tgtPct / slPct).toFixed(1)}x the stop). ` +
    'Both are fixed percentages from recent daily volatility, not support or resistance levels. Treat them as a sizing aid, not a verified invalidation.';
  return { evidence, trigger, invalidation, asOf };
}

/** Compose a clearer data-quality line for missing inputs. */
export function dataGaps(opts: { breadth: unknown; fiiDii: unknown }): string[] {
  const gaps: string[] = [];
  if (!opts.breadth) gaps.push('Market breadth is unavailable right now (NSE blocks the data request).');
  if (!opts.fiiDii) gaps.push('Live FII/DII feed is unavailable.');
  return gaps;
}

/** Fallback FII/DII from the site's own dated daily table (public/data/fii-dii.json). */
export function fiiDiiFromStatic(json: any): FiiDiiLatest | null {
  const fii: { l: string; v: number }[] = json?.fii?.daily;
  const dii: { l: string; v: number }[] = json?.dii?.daily;
  if (!Array.isArray(fii) || !Array.isArray(dii) || !fii.length) return null;
  const diiBy = new Map(dii.map((d) => [d.l, d.v]));
  const rows = fii.filter((f) => diiBy.has(f.l)).slice(0, 5).map((f) => ({ date: f.l, fii: f.v, dii: diiBy.get(f.l) as number }));
  if (!rows.length) return null;
  return { date: rows[0].date, fiiNet: rows[0].fii, diiNet: rows[0].dii, last5: rows };
}

/** Rebuild the summary text without the broken "Breadth breadth pending" / "unavailable" wording. */
export function cleanSummary(summary: string, hasFii: boolean): string {
  let s = summary
    .replace(/Breadth breadth pending\.?/i, 'Market breadth is unavailable.')
    .replace(/Breadth\s+breadth/i, 'Breadth');
  if (hasFii) s = s.replace(/\s*FII\/DII data unavailable\.?/i, '');
  return s.replace(/\s+/g, ' ').trim();
}
