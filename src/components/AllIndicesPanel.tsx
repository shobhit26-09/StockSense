import CountryFlag from '@/components/CountryFlag';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import WorldMarketMap, { CountryMarket } from './WorldMarketMap';

interface IndexDef {
  symbol: string;
  label: string;
  flag: string; // emoji or short code
  group: 'IN' | 'GLOBAL';
  country?: string; // ISO numeric 3-digit, country bucket for map
  countryName?: string;
  countryFlag?: string;
  decimals?: number;
}

const INDICES: IndexDef[] = [
  // India
  { symbol: '^NSEI',         label: 'NIFTY 50',     flag: '🇮🇳', group: 'IN', country: '356', countryName: 'India',         countryFlag: '🇮🇳' },
  { symbol: '^BSESN',        label: 'SENSEX',       flag: '🇮🇳', group: 'IN', country: '356', countryName: 'India',         countryFlag: '🇮🇳' },
  { symbol: '^NSEBANK',      label: 'BANK NIFTY',   flag: '🇮🇳', group: 'IN', country: '356', countryName: 'India',         countryFlag: '🇮🇳' },
  { symbol: '^CNXIT',        label: 'NIFTY IT',     flag: '🇮🇳', group: 'IN' },
  { symbol: 'NIFTYAUTO.NS',  label: 'NIFTY Auto',   flag: '🇮🇳', group: 'IN' },
  { symbol: 'NIFTYPHARMA.NS',label: 'NIFTY Pharma', flag: '🇮🇳', group: 'IN' },
  { symbol: 'NIFTYFMCG.NS',  label: 'NIFTY FMCG',   flag: '🇮🇳', group: 'IN' },
  { symbol: 'NIFTYMETAL.NS', label: 'NIFTY Metal',  flag: '🇮🇳', group: 'IN' },
  { symbol: '^INDIAVIX',     label: 'India VIX',    flag: '🇮🇳', group: 'IN', decimals: 2 },
  // Global
  { symbol: '^DJI',          label: 'Dow Jones',    flag: '🇺🇸', group: 'GLOBAL', country: '840', countryName: 'United States', countryFlag: '🇺🇸' },
  { symbol: '^GSPC',         label: 'S&P 500',      flag: '🇺🇸', group: 'GLOBAL', decimals: 2, country: '840', countryName: 'United States', countryFlag: '🇺🇸' },
  { symbol: '^IXIC',         label: 'NASDAQ',       flag: '🇺🇸', group: 'GLOBAL', decimals: 2, country: '840', countryName: 'United States', countryFlag: '🇺🇸' },
  { symbol: '^N225',         label: 'NIKKEI 225',   flag: '🇯🇵', group: 'GLOBAL', country: '392', countryName: 'Japan',         countryFlag: '🇯🇵' },
  { symbol: '^HSI',          label: 'HANG SENG',    flag: '🇭🇰', group: 'GLOBAL', country: '344', countryName: 'Hong Kong',     countryFlag: '🇭🇰' },
  { symbol: '000001.SS',     label: 'SHANGHAI',     flag: '🇨🇳', group: 'GLOBAL', decimals: 2, country: '156', countryName: 'China',         countryFlag: '🇨🇳' },
  { symbol: '^FTSE',         label: 'FTSE 100',     flag: '🇬🇧', group: 'GLOBAL', decimals: 2, country: '826', countryName: 'United Kingdom',countryFlag: '🇬🇧' },
  { symbol: '^GDAXI',        label: 'DAX',          flag: '🇩🇪', group: 'GLOBAL', decimals: 2, country: '276', countryName: 'Germany',       countryFlag: '🇩🇪' },
  { symbol: '^FCHI',         label: 'CAC 40',       flag: '🇫🇷', group: 'GLOBAL', decimals: 2, country: '250', countryName: 'France',        countryFlag: '🇫🇷' },
];

const ISO_CODE: Record<string, string> = {
  '356': 'IN', '840': 'US', '392': 'JP', '344': 'HK',
  '156': 'CN', '826': 'UK', '276': 'DE', '250': 'FR',
};


interface Quote {
  price: number; change: number; changePercent: number;
  previousClose: number; high: number; low: number; open: number;
  fetchedAt: number;
}

const fmt = (n: number, d = 2) =>
  n == null || !isFinite(n) ? '—' : n.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });

const timeStr = (ts: number) => {
  const d = new Date(ts);
  const day = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  const tm = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return { day, tm };
};

const AllIndicesPanel = () => {
  const [tab, setTab] = useState<'IN' | 'GLOBAL'>('IN');
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const symbols = useMemo(
    () => Array.from(new Set(INDICES.map(i => i.symbol))),
    []
  );

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-market-data', {
        body: { type: 'batch-quotes', symbols },
      });
      if (error) throw error;
      const next: Record<string, Quote> = {};
      for (const sym of symbols) {
        const q = data?.[sym];
        if (q && q.price) {
          next[sym] = {
            price: q.price,
            change: q.change ?? 0,
            changePercent: q.changePercent ?? 0,
            previousClose: q.previousClose ?? 0,
            high: q.high ?? 0,
            low: q.low ?? 0,
            open: q.open ?? q.previousClose ?? 0,
            fetchedAt: Date.now(),
          };
        }
      }
      setQuotes(next);
      setLastUpdate(new Date());
    } catch (e) {
      console.error('[AllIndices] load failed', e);
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  const rows = INDICES.filter(i => i.group === tab);

  // Build per-country aggregates for the map
  const countryMarkets: CountryMarket[] = useMemo(() => {
    const buckets = new Map<string, CountryMarket>();
    for (const idx of INDICES) {
      if (!idx.country) continue;
      const q = quotes[idx.symbol];
      if (!q) continue;
      let b = buckets.get(idx.country);
      if (!b) {
        b = {
          iso: idx.country,
          code: idx.country,
          name: idx.countryName ?? idx.label,
          flag: idx.countryFlag ?? idx.flag,
          indices: [],
        };
        buckets.set(idx.country, b);
      }
      b.indices.push({
        symbol: idx.symbol,
        label: idx.label,
        changePercent: q.changePercent,
        price: q.price,
      });
    }
    return Array.from(buckets.values());
  }, [quotes]);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Live interactive world map */}
      <div className="relative px-5 md:px-7 pt-5 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-foreground">All indices</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-1.5 w-1.5 bg-success rounded-full live-indicator" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                Live · {lastUpdate ? lastUpdate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '—'}
              </span>
              <button
                onClick={load}
                className="ml-1 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition"
                aria-label="Refresh"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-success/80" />Up</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-warning/70" />Flat</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-destructive/80" />Down</span>
          </div>
        </div>
        <div className="relative h-[340px] md:h-[440px] rounded-[1.5rem] border border-white/10 overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,.28)]">
          <WorldMarketMap countries={countryMarkets} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 px-5 md:px-7 border-b border-border mt-2">
        {([
          ['IN', 'Indian Indices'],
          ['GLOBAL', 'Global Indices'],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === k
                ? 'border-success text-success'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-medium py-3 pl-5 md:pl-7">Index name</th>
              <th className="text-right font-medium py-3">Last traded</th>
              <th className="text-right font-medium py-3">Day change</th>
              <th className="text-right font-medium py-3 hidden md:table-cell">High</th>
              <th className="text-right font-medium py-3 hidden md:table-cell">Low</th>
              <th className="text-right font-medium py-3 hidden lg:table-cell">Open</th>
              <th className="text-right font-medium py-3 pr-5 md:pr-7 hidden lg:table-cell">Prev. Close</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((idx) => {
              const q = quotes[idx.symbol];
              const dec = idx.decimals ?? 2;
              const pos = q ? q.change >= 0 : true;
              return (
                <tr key={`${idx.group}-${idx.label}`} className="border-t border-border/60 hover:bg-muted/30 transition-colors">
                  <td className="py-4 pl-5 md:pl-7">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <CountryFlag
                        code={ISO_CODE[idx.country ?? ''] ?? (idx.group === 'IN' ? 'IN' : '—')}
                        name={idx.countryName ?? (idx.group === 'IN' ? 'India' : undefined)}
                        width={32}
                        />
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">{idx.label}</div>
                        <div className="text-[11px] text-muted-foreground font-mono whitespace-nowrap">
                          {q ? (<><span className="hidden sm:inline">{timeStr(q.fetchedAt).day}, </span>{timeStr(q.fetchedAt).tm}</>) : (loading ? 'Loading…' : '—')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-right font-mono font-semibold text-foreground tabular-nums">
                    {q ? fmt(q.price, dec) : '—'}
                  </td>
                  <td className={`py-4 pl-3 text-right font-mono tabular-nums whitespace-nowrap ${pos ? 'text-success' : 'text-destructive'}`}>
                    {q ? (
                      <>
                        {pos ? '+' : ''}{fmt(q.change, dec)}{' '}
                        <span className="block sm:inline opacity-80">({pos ? '+' : ''}{q.changePercent.toFixed(2)}%)</span>
                      </>
                    ) : '—'}
                  </td>
                  <td className="py-4 text-right font-mono text-foreground/90 tabular-nums hidden md:table-cell">{q ? fmt(q.high, dec) : '—'}</td>
                  <td className="py-4 text-right font-mono text-foreground/90 tabular-nums hidden md:table-cell">{q ? fmt(q.low, dec) : '—'}</td>
                  <td className="py-4 text-right font-mono text-foreground/90 tabular-nums hidden lg:table-cell">{q ? fmt(q.open, dec) : '—'}</td>
                  <td className="py-4 pr-5 md:pr-7 text-right font-mono text-foreground/90 tabular-nums hidden lg:table-cell">{q ? fmt(q.previousClose, dec) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllIndicesPanel;
