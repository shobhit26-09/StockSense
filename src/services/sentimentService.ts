import type { StockQuote } from '@/services/multiSourceDataService';

export interface SentimentHeadline {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  description?: string;
  dataMode?: string;
}
export type Tone = 'positive' | 'negative' | 'neutral';
export interface HeadlineSignal extends SentimentHeadline { tone: Tone; matched: string[] }
export interface SentimentComponent { score: number; count: number; positive: number; negative: number; neutral: number }
export interface SentimentResult {
  score: number | null;
  label: string;
  breadth: SentimentComponent | null;
  news: SentimentComponent | null;
  macro: SentimentComponent | null;
  headlines: HeadlineSignal[];
  macroHeadlines: HeadlineSignal[];
  coverage: number;
  total: number;
  updatedAt: number;
}

// These are directional headline cues, not article sentiment or measured economic outcomes.
// Negations are deliberately treated as unclassified to avoid false precision.
const UP = /\b(gains?|rall(?:y|ies)|surges?|rises?|rebound(?:s|ed)?|growth|beats?|eases?|cools?|cuts?|upgrades?)\b/gi;
const DOWN = /\b(falls?|drops?|slumps?|declines?|loss(?:es)?|tumbles?|inflation|hikes?|downgrades?|misses?|weakens?|contracts?|tariffs?)\b/gi;
const MACRO = /\b(RBI|SEBI|Fed|FOMC|GDP|CPI|inflation|interest rates?|repo rates?|rate cuts?|rate hikes?|rupee|currency|yields?|tariffs?|jobs|employment|fiscal|budget|crude oil)\b/i;
const NEGATED = /\b(no|not|never|without|less than)\b/i;

export const classifyHeadline = (title: string): { tone: Tone; matched: string[] } => {
  if (NEGATED.test(title)) return { tone: 'neutral', matched: [] };
  const up = [...title.matchAll(UP)].map(m => m[0].toLowerCase());
  const down = [...title.matchAll(DOWN)].map(m => m[0].toLowerCase());
  return { tone: up.length > down.length ? 'positive' : down.length > up.length ? 'negative' : 'neutral', matched: [...up, ...down] };
};

const aggregate = (values: Tone[]): SentimentComponent => {
  const positive = values.filter(v => v === 'positive').length;
  const negative = values.filter(v => v === 'negative').length;
  const neutral = values.length - positive - negative;
  return { score: Math.round(50 + 50 * (positive - negative) / values.length), count: values.length, positive, negative, neutral };
};

export const calculateSentiment = (quotes: Map<string, StockQuote>, symbols: string[], articles: SentimentHeadline[], now = Date.now()): SentimentResult => {
  const freshQuotes = symbols.map(s => quotes.get(s)).filter((q): q is StockQuote => Boolean(q && q.source === 'yahoo' && now - q.timestamp < 15 * 60_000 && now >= q.timestamp && Number.isFinite(q.changePercent) && q.price > 0));
  const breadth = freshQuotes.length >= 8 ? aggregate(freshQuotes.map(q => q.changePercent > 0.05 ? 'positive' : q.changePercent < -0.05 ? 'negative' : 'neutral')) : null;
  const unique = new Set<string>();
  const recent = articles.filter(a => {
    const age = now - Date.parse(a.publishedAt);
    if (!a.title || !/^https:\/\//.test(a.url) || a.dataMode !== 'live' || !Number.isFinite(age) || age < -10 * 60_000 || age > 48 * 60 * 60_000) return false;
    const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 80);
    if (unique.has(key)) return false;
    unique.add(key);
    return true;
  }).slice(0, 20);
  const tagged: HeadlineSignal[] = recent.map(a => ({ ...a, ...classifyHeadline(a.title) }));
  const macroHeadlines = tagged.filter(a => MACRO.test(a.title));
  const headlines = tagged.filter(a => !MACRO.test(a.title));
  const news = headlines.length >= 3 ? aggregate(headlines.map(h => h.tone)) : null;
  const macro = macroHeadlines.length >= 1 ? aggregate(macroHeadlines.map(h => h.tone)) : null;
  const inputs = [{ value: breadth, weight: 0.6 }, { value: news, weight: 0.25 }, { value: macro, weight: 0.15 }].filter(x => x.value !== null);
  const score = inputs.length ? Math.round(inputs.reduce((sum, x) => sum + x.value!.score * x.weight, 0) / inputs.reduce((sum, x) => sum + x.weight, 0)) : null;
  return {
    score,
    label: score === null ? 'Unavailable' : score >= 62 ? 'Positive' : score <= 38 ? 'Negative' : 'Mixed',
    breadth, news, macro, headlines, macroHeadlines,
    coverage: freshQuotes.length, total: symbols.length, updatedAt: now,
  };
};
