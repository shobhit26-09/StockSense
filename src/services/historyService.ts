import { supabase } from '@/integrations/supabase/client';

export type HistoryRange = '1d' | '1mo' | '3mo' | '6mo' | '1y' | '5y';

export interface HistoryPoint { t: number; c: number }
export interface HistorySeries {
  symbol: string;
  points: HistoryPoint[];
  source: 'yahoo' | 'sample';
  /** Previous session close, when the provider reports it (intraday baseline). */
  prevClose?: number;
}

const cache = new Map<string, { at: number; data: HistorySeries }>();
const inflight = new Map<string, Promise<HistorySeries>>();
const TTL_DAILY = 5 * 60_000;
const TTL_INTRADAY = 60_000; // live line tracks the ~60s quote refresh
const INTRADAY_INTERVAL_MS = 5 * 60_000;

const toYahoo = (symbol: string) =>
  symbol.startsWith('^') || /\.(NS|BO)$/i.test(symbol) ? symbol : `${symbol}.NS`;

/**
 * Deterministic, clearly-labelled sample curve used only when the free feed
 * is unreachable, so charts never render empty. Callers must surface
 * `source === 'sample'` to the user.
 */
const sampleSeries = (symbol: string, n: number, spacingMs = 86_400_000): HistoryPoint[] => {
  let seed = 0;
  for (const ch of symbol) seed = (seed * 31 + ch.charCodeAt(0)) % 9973;
  const now = Date.now();
  let v = 100;
  return Array.from({ length: n }, (_, i) => {
    v += Math.sin((i + seed) / 3.1) * 0.9 + Math.cos((i + seed) / 7.3) * 0.6;
    return { t: now - (n - i) * spacingMs, c: v };
  });
};

export const fetchHistory = async (symbol: string, range: HistoryRange = '1mo'): Promise<HistorySeries> => {
  const key = `${symbol}|${range}`;
  const ttl = range === '1d' ? TTL_INTRADAY : TTL_DAILY;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.data;
  const pending = inflight.get(key);
  if (pending) return pending;

  const intraday = range === '1d';
  const interval = intraday ? '5m' : range === '5y' ? '1wk' : '1d';
  const p = (async (): Promise<HistorySeries> => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-market-data', {
        body: { type: 'stock-history', symbol: toYahoo(symbol), range, interval },
      });
      if (error) throw error;
      const r = data?.chart?.result?.[0];
      const ts: number[] = r?.timestamp ?? [];
      const closes: (number | null)[] = r?.indicators?.quote?.[0]?.close ?? [];
      const points = ts
        .map((t, i) => ({ t: t * 1000, c: closes[i] as number }))
        .filter((p) => typeof p.c === 'number' && Number.isFinite(p.c));
      if (points.length < 2) throw new Error('empty history');
      const prevCloseRaw = r?.meta?.chartPreviousClose;
      const prevClose = typeof prevCloseRaw === 'number' && Number.isFinite(prevCloseRaw) ? prevCloseRaw : undefined;
      const out: HistorySeries = { symbol, points, source: 'yahoo', ...(prevClose ? { prevClose } : {}) };
      cache.set(key, { at: Date.now(), data: out });
      return out;
    } catch {
      const n = intraday ? 75 : range === '1mo' ? 22 : range === '3mo' ? 64 : range === '6mo' ? 126 : range === '1y' ? 250 : 260;
      return {
        symbol,
        points: sampleSeries(symbol, n, intraday ? INTRADAY_INTERVAL_MS : 86_400_000),
        source: 'sample',
      };
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
};
