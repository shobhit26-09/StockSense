import { fetchHistory } from '@/services/historyService';
import { fetchMultipleQuotesRacing } from '@/services/multiSourceDataService';
import { supabase } from '@/integrations/supabase/client';
import { MARKET_CONSTITUENTS } from '@/data/marketConstituents';
import {
  breadthSignal, combineSignals, flowsSignal, globalSignal, newsSignal, trendSignal, volatilitySignal,
  type FlowInput, type GlobalMove, type SentimentHeadline, type SentimentResult,
} from '@/services/sentimentService';

const closesOf = async (symbol: string, range: '1mo' | '6mo') => {
  const s = await fetchHistory(symbol, range);
  return s.source === 'yahoo' ? s.points.map(p => p.c) : null; // never score the labelled sample curve
};
const dailyMove = (name: string, key: GlobalMove['key']) => async (symbol: string): Promise<GlobalMove | null> => {
  const c = await closesOf(symbol, '1mo');
  if (!c || c.length < 2) return null;
  return { key, name, changePct: 100 * (c[c.length - 1] / c[c.length - 2] - 1) };
};
const settledValue = <T,>(r: PromiseSettledResult<T>): T | null => (r.status === 'fulfilled' ? r.value : null);

const loadFlows = async (): Promise<FlowInput | null> => {
  const r = await fetch('/data/fii-dii.json');
  if (!r.ok) return null;
  const d = await r.json();
  return { fii: d?.fii?.daily ?? [], dii: d?.dii?.daily ?? [], updatedAt: d?.updatedAt };
};

export const loadSentiment = async (): Promise<SentimentResult> => {
  const [quotes, nifty, vix, news, flows, spx, nikkei, hsi, brent, inr] = await Promise.allSettled([
    fetchMultipleQuotesRacing(MARKET_CONSTITUENTS.map(c => c.symbol), 10000),
    closesOf('^NSEI', '6mo'),
    closesOf('^INDIAVIX', '6mo'),
    supabase.functions.invoke('fetch-market-data', { body: { type: 'news' } }),
    loadFlows(),
    dailyMove('S&P 500', 'spx')('^GSPC'),
    dailyMove('Nikkei', 'nikkei')('^N225'),
    dailyMove('Hang Seng', 'hsi')('^HSI'),
    dailyMove('Brent', 'brent')('BZ=F'),
    dailyMove('USD/INR', 'inr')('INR=X'),
  ]);
  const newsRes = settledValue(news);
  const articles: SentimentHeadline[] = newsRes && !newsRes.error && Array.isArray(newsRes.data?.articles) ? newsRes.data.articles : [];
  const n = newsSignal({ articles });
  const moves = [spx, nikkei, hsi, brent, inr].map(settledValue).filter((m): m is GlobalMove => m !== null);
  return combineSignals([
    breadthSignal({ quotes: settledValue(quotes) ?? new Map(), members: MARKET_CONSTITUENTS }),
    trendSignal(settledValue(nifty)),
    volatilitySignal(settledValue(vix)),
    flowsSignal(settledValue(flows)),
    globalSignal(moves),
    n.signal,
  ], n.headlines);
};
