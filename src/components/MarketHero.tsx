import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Sparkline from '@/components/Sparkline';
import { fetchMultipleQuotesRacing, type StockQuote } from '@/services/multiSourceDataService';
import { fetchHistory, type HistoryRange, type HistorySeries } from '@/services/historyService';

const sessionInfo = (d: Date) => {
  const day = d.getDay();
  const m = d.getHours() * 60 + d.getMinutes();
  if (day === 0 || day === 6) return { label: 'Markets closed · Weekend', tone: 'muted' as const };
  if (m >= 540 && m < 555) return { label: 'Pre-market', tone: 'warning' as const };
  if (m >= 555 && m < 930) return { label: 'Live · NSE · BSE', tone: 'success' as const };
  if (m >= 930 && m < 960) return { label: 'Post-market', tone: 'warning' as const };
  return { label: 'Markets closed', tone: 'muted' as const };
};

const RANGES: { key: HistoryRange; label: string }[] = [
  { key: '1mo', label: '1M' },
  { key: '3mo', label: '3M' },
  { key: '6mo', label: '6M' },
  { key: '1y', label: '1Y' },
  { key: '5y', label: '5Y' },
];

const INDICES = [
  { symbol: '^NSEI', label: 'NIFTY 50' },
  { symbol: '^BSESN', label: 'SENSEX' },
  { symbol: '^NSEBANK', label: 'BANK NIFTY' },
  { symbol: '^CNXIT', label: 'NIFTY IT' },
  { symbol: '^INDIAVIX', label: 'INDIA VIX', invert: true },
] as { symbol: string; label: string; invert?: boolean }[];

const fmt = (n: number, d = 2) => n.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });

const MarketHero = () => {
  const [now, setNow] = useState(new Date());
  const [quotes, setQuotes] = useState<Map<string, StockQuote>>(new Map());
  const [range, setRange] = useState<HistoryRange>('6mo');
  const [series, setSeries] = useState<HistorySeries | null>(null);
  const [sparks, setSparks] = useState<Record<string, HistorySeries>>({});
  const [selected, setSelected] = useState(INDICES[0]);
  const TILES = INDICES.filter((i) => i.symbol !== selected.symbol);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const load = async () => setQuotes(await fetchMultipleQuotesRacing(INDICES.map((t) => t.symbol), 8000));
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let alive = true;
    setSeries(null);
    fetchHistory(selected.symbol, range).then((s) => alive && setSeries(s));
    return () => { alive = false; };
  }, [range, selected.symbol]);

  useEffect(() => {
    Promise.all(INDICES.map((t) => fetchHistory(t.symbol, '1mo'))).then((all) => {
      const next: Record<string, HistorySeries> = {};
      all.forEach((s) => { next[s.symbol] = s; });
      setSparks(next);
    });
  }, []);

  const s = sessionInfo(now);
  const nifty = quotes.get(selected.symbol);

  const chart = useMemo(() => {
    if (!series) return null;
    const pts = series.points.map((p) => ({ t: p.t, c: p.c }));
    if (nifty && series.source === 'yahoo') {
      const last = pts[pts.length - 1];
      if (last && Math.abs(last.c - nifty.price) / nifty.price < 0.08) last.c = nifty.price;
    }
    const first = pts[0].c;
    const last = pts[pts.length - 1].c;
    const change = last - first;
    return { pts, first, last, change, pct: (change / first) * 100, up: change >= 0 };
  }, [series, nifty]);

  const up = chart ? chart.up : (nifty?.changePercent ?? 0) >= 0;
  const color = up ? 'hsl(var(--success))' : 'hsl(var(--destructive))';
  const rangeLabel = RANGES.find((r) => r.key === range)?.label;

  return (
    <section className="hero-shell relative overflow-hidden rounded-[2rem] border border-border">
      <div aria-hidden className="hero-aurora pointer-events-none absolute inset-0">
        <span className="aurora-a" /><span className="aurora-b" /><span className="aurora-c" />
      </div>
      <div aria-hidden className="hero-grid pointer-events-none absolute inset-0" />

      <div className="relative grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
        <div className="flex flex-col justify-center p-7 pb-4 pt-10 md:p-12 lg:py-14 lg:pl-14 lg:pr-6">
          <div className="mb-6 inline-flex w-fit items-center gap-2.5 rounded-full border border-border bg-background/50 px-3.5 py-1.5 backdrop-blur-xl">
            <span className={`h-1.5 w-1.5 rounded-full ${s.tone === 'success' ? 'bg-success live-indicator' : s.tone === 'warning' ? 'bg-warning' : 'bg-muted-foreground/60'}`} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{s.label}</span>
            <span className="h-3 w-px bg-border" />
            <span className="font-mono text-[11px] text-muted-foreground">
              {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })} IST
            </span>
          </div>

          <h1 className="font-display text-[42px] font-bold leading-[1] tracking-[-0.035em] text-foreground sm:text-6xl lg:text-[58px] xl:text-[60px]">
            Your market,<br />
            <span className="whitespace-nowrap">in <span className="text-brand-gradient">one clear view.</span></span>
          </h1>

          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Live NSE and BSE quotes, a market map of India's largest companies, sector outlooks and
            macro events, on one screen.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild variant="premium" size="default" className="rounded-full px-5">
              <Link to="/agent">Open trade agent <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
            <Button asChild variant="outline" size="default" className="rounded-full bg-background/40 px-5 backdrop-blur-xl">
              <Link to="/heatmap">See the heatmap</Link>
            </Button>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-border/70 pt-6">
            {[
              ['NSE · BSE', 'Exchanges'],
              ['60s', 'Refresh'],
              ['Free', 'No sign-up'],
            ].map(([v, k]) => (
              <div key={k}>
                <dt className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{k}</dt>
                <dd className="font-display mt-1 text-lg font-semibold text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="p-3 pt-0 md:p-4 lg:py-5 lg:pl-0">
          <div className="glass-panel relative overflow-hidden rounded-[1.6rem] p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span key={selected.symbol} className="hero-swap text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">{selected.label}</span>
                  {series?.source === 'sample' && (
                    <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">Sample data · feed offline</span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-display text-[40px] font-semibold leading-none tracking-tight text-white tabular-nums">
                    {nifty ? fmt(nifty.price) : <span className="shimmer inline-block h-9 w-44 rounded-lg align-middle" />}
                  </span>
                  {nifty && (
                    <span className={`inline-flex items-center gap-0.5 font-mono text-sm font-medium ${nifty.changePercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {nifty.changePercent >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      {nifty.change >= 0 ? '+' : ''}{fmt(nifty.change)} ({nifty.changePercent >= 0 ? '+' : ''}{nifty.changePercent.toFixed(2)}%)
                    </span>
                  )}
                </div>
                {chart && (
                  <div className="mt-1 text-[12px] text-white/45">
                    <span className={chart.up ? 'text-success' : 'text-destructive'}>{chart.pct >= 0 ? '+' : ''}{chart.pct.toFixed(2)}%</span> over {rangeLabel}
                  </div>
                )}
              </div>
              <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-0.5">
                {RANGES.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setRange(r.key)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${range === r.key ? 'bg-white text-black' : 'text-white/55 hover:text-white'}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div key={selected.symbol} className="hero-swap relative mt-4 h-[200px] md:h-[220px]">
              {chart ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart.pts} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                        <stop offset="70%" stopColor={color} stopOpacity={0.06} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" hide />
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <ReferenceLine y={chart.first} stroke="rgba(255,255,255,0.22)" strokeDasharray="3 4" />
                    <Tooltip
                      cursor={{ stroke: 'rgba(255,255,255,0.35)', strokeWidth: 1 }}
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="rounded-xl border border-white/10 bg-black/80 px-3 py-2 backdrop-blur-xl">
                            <div className="font-mono text-[13px] text-white">{fmt(payload[0].value as number)}</div>
                            <div className="text-[11px] text-white/50">
                              {new Date(payload[0].payload.t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                        ) : null
                      }
                    />
                    <Area type="monotone" dataKey="c" stroke={color} strokeWidth={2} fill="url(#heroFill)" animationDuration={900} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="shimmer h-full w-full rounded-2xl" />
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {TILES.map((t) => {
                const q = quotes.get(t.symbol);
                const sp = sparks[t.symbol];
                const pos = (q?.changePercent ?? 0) >= 0;
                const good = t.invert ? !pos : pos;
                const trendUp = sp ? sp.points[sp.points.length - 1].c >= sp.points[0].c : pos;
                return (
                  <button
                    type="button"
                    key={t.symbol}
                    onClick={() => setSelected(t)}
                    aria-label={`Show ${t.label} chart`}
                    className="group rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07] active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.1em] text-white/45 sm:text-[10.5px]">{t.label}</span>
                      {q && (
                        <span className={`font-mono text-[11px] ${good ? 'text-success' : 'text-destructive'}`}>
                          {pos ? '+' : ''}{q.changePercent.toFixed(2)}%
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
                      <span className="font-mono text-[15px] text-white tabular-nums">
                        {q ? fmt(q.price) : <span className="shimmer inline-block h-4 w-20 rounded" />}
                      </span>
                      {sp && <Sparkline values={sp.points.map((p) => p.c)} positive={t.invert ? !trendUp : trendUp} width={72} height={26} className="max-sm:h-[22px] max-sm:w-full" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between text-[10.5px] text-white/35">
              <span>Tap an index to chart it · Daily closes · Yahoo Finance{Object.values(sparks).some((x) => x.source === 'sample') ? ' · some sparklines are sample data' : ''}</span>
              <Link to="/macro" className="inline-flex items-center gap-1 font-semibold text-white/55 transition-colors hover:text-white">
                Global context <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketHero;
