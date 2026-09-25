import { supabase } from '@/integrations/supabase/client';
import universe from '@/data/nseUniverse.json';

export type IndexKey = 'n100' | 'n500' | 'mid' | 'small' | 'total';

export const INDEX_OPTIONS: { key: IndexKey; label: string }[] = [
  { key: 'n100', label: 'NIFTY 100' },
  { key: 'n500', label: 'NIFTY 500' },
  { key: 'mid', label: 'NIFTY Midcap 100' },
  { key: 'small', label: 'NIFTY Smallcap 100' },
  { key: 'total', label: 'Nifty Total Market' },
];

type Universe = { asOf: string; u: [string, string, string][]; idx: Record<IndexKey, number[]> };
const U = universe as unknown as Universe;

export const constituents = (key: IndexKey) =>
  U.idx[key].map((i) => ({ symbol: U.u[i][0], name: U.u[i][1], industry: U.u[i][2] }));

export interface MoverRow {
  symbol: string;
  name: string;
  industry: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high?: number;
  low?: number;
}

export interface IndexSnapshot {
  key: IndexKey;
  rows: MoverRow[];
  total: number;
  timestamp: Date;
}

const snapCache = new Map<IndexKey, { at: number; data: IndexSnapshot }>();
const inflight = new Map<IndexKey, Promise<IndexSnapshot>>();
const CHUNK = 120;

/** Live quotes for every constituent, batched through the free Yahoo edge path. */
export const fetchIndexSnapshot = (key: IndexKey, force = false): Promise<IndexSnapshot> => {
  const hit = snapCache.get(key);
  if (!force && hit && Date.now() - hit.at < 60_000) return Promise.resolve(hit.data);
  const running = inflight.get(key);
  if (running) return running;

  const list = constituents(key);
  const p = (async () => {
    const chunks: typeof list[] = [];
    for (let i = 0; i < list.length; i += CHUNK) chunks.push(list.slice(i, i + CHUNK));
    const rows: MoverRow[] = [];
    await Promise.all(chunks.map(async (chunk) => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-market-data', {
          body: { type: 'batch-quotes', symbols: chunk.map((c) => `${c.symbol}.NS`) },
        });
        if (error || !data) return;
        for (const c of chunk) {
          const q = data[`${c.symbol}.NS`];
          // Only genuine live quotes; the edge function's static backups are excluded.
          if (!q || q.source !== 'yahoo' || !(q.price > 0)) continue;
          rows.push({
            symbol: c.symbol, name: c.name, industry: c.industry,
            price: q.price, change: q.change, changePercent: q.changePercent,
            volume: q.volume || 0, high: q.high, low: q.low,
          });
        }
      } catch { /* chunk skipped; coverage shown in the UI */ }
    }));
    const snap: IndexSnapshot = { key, rows, total: list.length, timestamp: new Date() };
    if (rows.length) snapCache.set(key, { at: Date.now(), data: snap });
    return snap;
  })().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
};

/* ---- 20-session average volume, for "Volume shockers" ---- */

const AVG_KEY = 'ss-avgvol-v1';
const today = () => new Date().toISOString().slice(0, 10);
const loadAvg = (): Record<string, number> => {
  try {
    const raw = JSON.parse(localStorage.getItem(AVG_KEY) || '{}');
    return raw.d === today() ? raw.v || {} : {};
  } catch { return {}; }
};
const saveAvg = (v: Record<string, number>) => {
  try { localStorage.setItem(AVG_KEY, JSON.stringify({ d: today(), v })); } catch { /* ignore */ }
};

export const fetchAvgVolumes = async (symbols: string[]): Promise<Record<string, number>> => {
  const cache = loadAvg();
  const todo = symbols.filter((s) => !(s in cache));
  let i = 0;
  const worker = async () => {
    while (i < todo.length) {
      const sym = todo[i++];
      try {
        const { data } = await supabase.functions.invoke('fetch-market-data', {
          body: { type: 'stock-history', symbol: `${sym}.NS`, range: '1mo', interval: '1d' },
        });
        const vols: number[] = (data?.chart?.result?.[0]?.indicators?.quote?.[0]?.volume || [])
          .filter((v: number | null) => typeof v === 'number' && v > 0);
        const prior = vols.slice(0, -1).slice(-20);
        cache[sym] = prior.length >= 5 ? prior.reduce((a, b) => a + b, 0) / prior.length : 0;
      } catch { cache[sym] = 0; }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  saveAvg(cache);
  return cache;
};
