import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, TrendingDown, TrendingUp, Flame, Snowflake } from 'lucide-react';

type Frame = '1d' | '1w' | '1m' | '3m' | '6m';
interface Pick { s: string; n: string; p: number; r1: number; r21: number }
interface SectorRow {
  sector: string; stocks: number;
  chg: Record<Frame, number>; rs: { '1m': number; '3m': number };
  breadth50: number; adv: number;
  flow: { net10: number; pressure: number; turnTrend: number; daily: number[]; avgTurnCr: number };
  spark: number[]; leaders: Pick[]; laggards: Pick[]; surge: Pick[];
}
interface Payload {
  asOf: string; universe: number; source: string;
  market: { chg: Record<Frame, number>; spark: number[] };
  sectors: SectorRow[];
}

const FRAMES: { key: Frame; label: string }[] = [
  { key: '1d', label: '1D' }, { key: '1w', label: '1W' }, { key: '1m', label: '1M' },
  { key: '3m', label: '3M' }, { key: '6m', label: '6M' },
];

const SHORT: Record<string, string> = {
  'Automobile and Auto Components': 'Auto & Components',
  'Fast Moving Consumer Goods': 'FMCG',
  'Media Entertainment & Publication': 'Media & Entertainment',
  'Oil Gas & Consumable Fuels': 'Oil, Gas & Fuels',
  'Construction Materials': 'Cement & Materials',
  'Telecommunication': 'Telecom',
};
const colVis = (k: Frame, sel: Frame) => (k === sel || k === '1m' || k === '3m' ? '' : 'hidden md:table-cell');
const label = (s: string) => SHORT[s] ?? s;

const FLOW_EDGE = 8; // pressure % beyond which we call it inflow / outflow
type FlowState = 'inflow' | 'outflow' | 'flat';
const flowState = (p: number): FlowState => (p >= FLOW_EDGE ? 'inflow' : p <= -FLOW_EDGE ? 'outflow' : 'flat');

const pct = (v: number, d = 1) => `${v >= 0 ? '+' : '\u2212'}${Math.abs(v).toFixed(d)}%`;
const cr = (v: number) => {
  const a = Math.abs(v);
  const t = a >= 1000 ? `${(a / 1000).toFixed(1)}k` : `${a.toFixed(0)}`;
  return `${v >= 0 ? '+' : '\u2212'}\u20B9${t} cr`;
};
const tone = (v: number) => (v >= 0 ? 'text-success' : 'text-destructive');
const tint = (v: number, max: number) => {
  const a = Math.min(Math.abs(v) / max, 1) * 0.22;
  return { backgroundColor: `hsl(var(${v >= 0 ? '--success' : '--destructive'}) / ${a.toFixed(3)})` };
};

const Spark = ({ data, up }: { data: number[]; up: boolean }) => {
  const w = 84, h = 26;
  const lo = Math.min(...data), hi = Math.max(...data);
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - lo) / (hi - lo || 1)) * (h - 4)).toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="block">
      <polyline points={pts} fill="none" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"
        stroke={`hsl(var(${up ? '--success' : '--destructive'}))`} />
    </svg>
  );
};

const FlowBars = ({ daily }: { daily: number[] }) => {
  const max = Math.max(...daily.map(Math.abs), 1);
  return (
    <div className="flex h-14 items-center gap-[3px]" aria-label="Estimated net flow, last 10 sessions">
      {daily.map((v, i) => (
        <div key={i} className="relative h-full flex-1">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
          <div
            className="absolute left-0 right-0 rounded-[2px]"
            style={{
              height: `${(Math.abs(v) / max) * 50}%`,
              [v >= 0 ? 'bottom' : 'top']: '50%',
              backgroundColor: `hsl(var(${v >= 0 ? '--success' : '--destructive'}))`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

const FlowChip = ({ s, p }: { s: FlowState; p: number }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
      s === 'inflow' ? 'bg-success/15 text-success' : s === 'outflow' ? 'bg-destructive/15 text-destructive' : 'bg-muted text-muted-foreground'
    }`}
  >
    {s === 'flat' ? <>Balanced</> : s} {s !== 'flat' && <span className="ml-1 hidden font-mono normal-case tracking-normal sm:inline">{pct(p, 0)}</span>}
  </span>
);

const FlowList = ({ title, icon, rows, empty }: { title: string; icon: React.ReactNode; rows: SectorRow[]; empty: string }) => {
  const max = Math.max(...rows.map((r) => Math.abs(r.flow.net10)), 1);
  return (
    <div className="premium-card p-5">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
      </div>
      {rows.length === 0 && <p className="text-sm text-muted-foreground">{empty}</p>}
      <ul className="space-y-3.5">
        {rows.map((r) => {
          const up = r.flow.net10 >= 0;
          const diverge = (r.chg['1m'] < -2 && r.flow.pressure >= FLOW_EDGE) || (r.chg['1m'] > 2 && r.flow.pressure <= -FLOW_EDGE);
          return (
            <li key={r.sector}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[13px] font-medium text-foreground">{label(r.sector)}</span>
                <span className={`shrink-0 font-mono text-[13px] ${tone(r.flow.net10)}`}>{cr(r.flow.net10)}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{
                  width: `${Math.max((Math.abs(r.flow.net10) / max) * 100, 4)}%`,
                  backgroundColor: `hsl(var(${up ? '--success' : '--destructive'}))`,
                }} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                <span>1M <span className={`font-mono ${tone(r.chg['1m'])}`}>{pct(r.chg['1m'])}</span></span>
                <span>Volume trend <span className={`font-mono ${tone(r.flow.turnTrend)}`}>{pct(r.flow.turnTrend, 0)}</span></span>
                {diverge && (
                  <span className="font-medium text-warning">{up ? 'Buying into weakness' : 'Selling into strength'}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const Stat = ({ k, v, sub, good }: { k: string; v: string; sub: string; good?: boolean }) => (
  <div className="bg-card p-4">
    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k}</div>
    <div className="mt-1.5 line-clamp-2 font-display text-balance text-lg font-semibold text-foreground">{v}</div>
    <div className={`mt-0.5 font-mono text-xs ${good === undefined ? 'text-muted-foreground' : good ? 'text-success' : 'text-destructive'}`}>{sub}</div>
  </div>
);

const SectorBoard = () => {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState(false);
  const [frame, setFrame] = useState<Frame>('1m');
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/sectors.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Payload) => { setData(d); })
      .catch(() => setErr(true));
  }, []);

  const view = useMemo(() => {
    if (!data) return null;
    const byFlow = [...data.sectors].sort((a, b) => b.flow.pressure - a.flow.pressure);
    const inflow = byFlow.filter((s) => flowState(s.flow.pressure) === 'inflow').sort((a, b) => b.flow.net10 - a.flow.net10).slice(0, 6);
    const outflow = byFlow.filter((s) => flowState(s.flow.pressure) === 'outflow').sort((a, b) => a.flow.net10 - b.flow.net10).slice(0, 6);
    const sorted = [...data.sectors].sort((a, b) => b.chg[frame] - a.chg[frame]);
    const m1 = [...data.sectors].sort((a, b) => b.chg['1m'] - a.chg['1m']);
    const rs = [...data.sectors].sort((a, b) => b.rs['3m'] - a.rs['3m']);
    const maxChg = Math.max(...data.sectors.map((s) => Math.abs(s.chg[frame])), 1);
    return { inflow, outflow, sorted, m1, rs, maxChg, nIn: data.sectors.filter((s) => flowState(s.flow.pressure) === 'inflow').length,
      nOut: data.sectors.filter((s) => flowState(s.flow.pressure) === 'outflow').length };
  }, [data, frame]);

  if (err) return <div className="premium-card p-8 text-center text-sm text-muted-foreground">Sector data could not be loaded. Try again in a moment.</div>;
  if (!data || !view) return <div className="premium-card h-72 animate-pulse" />;

  const best = view.m1[0], worst = view.m1[view.m1.length - 1];
  const asOf = new Date(data.asOf + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Closing data as of <span className="font-medium text-foreground">{asOf}</span> &middot; {data.universe} NSE stocks in {data.sectors.length} sectors</span>
        <span>Broad market 1M <span className={`font-mono ${tone(data.market.chg['1m'])}`}>{pct(data.market.chg['1m'])}</span></span>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
        <Stat k="Money flow" v={`${view.nIn} in \u00B7 ${view.nOut} out`} sub="sectors, last 10 sessions" />
        <Stat k="Best 1M" v={label(best.sector)} sub={pct(best.chg['1m'])} good={best.chg['1m'] >= 0} />
        <Stat k="Weakest 1M" v={label(worst.sector)} sub={pct(worst.chg['1m'])} good={worst.chg['1m'] >= 0} />
        <Stat k="Strongest vs market (3M)" v={label(view.rs[0].sector)} sub={`${pct(view.rs[0].rs['3m'])} relative`} good={view.rs[0].rs['3m'] >= 0} />
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="section-eyebrow">Where the money is moving</div>
            <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">
              Estimated net flow: value traded on up days minus down days over the last 10 sessions, summed across each sector&rsquo;s stocks.
              This is a price-and-volume estimate, not FII/DII or fund-level data.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FlowList title="Seeing inflows" icon={<TrendingUp className="h-4 w-4 text-success" />} rows={view.inflow} empty="No sector shows clear net buying right now." />
          <FlowList title="Seeing outflows" icon={<TrendingDown className="h-4 w-4 text-destructive" />} rows={view.outflow} empty="No sector shows clear net selling right now." />
        </div>
      </section>

      <section className="premium-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <div className="section-eyebrow">Sector performance</div>
            <p className="mt-1 text-[13px] text-muted-foreground">Turnover-weighted sector baskets. Tap a row for leaders, laggards and flow.</p>
          </div>
          <div className="inline-flex rounded-lg bg-muted p-0.5" role="tablist" aria-label="Sort by timeframe">
            {FRAMES.map((f) => (
              <button key={f.key} role="tab" aria-selected={frame === f.key} onClick={() => setFrame(f.key)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${frame === f.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full md:min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2.5 md:px-4">Sector</th>
                <th className="hidden px-2 py-2.5 md:table-cell">60D</th>
                {FRAMES.map((f) => <th key={f.key} className={`${colVis(f.key, frame)} px-2 py-2.5 text-right ${f.key === frame ? 'text-foreground' : ''}`}>{f.label}</th>)}
                <th className="hidden px-2 py-2.5 text-right md:table-cell">vs mkt 3M</th>
                <th className="hidden px-2 py-2.5 text-right md:table-cell">&gt;50DMA</th>
                <th className="px-3 py-2.5 text-right md:px-4">Flow</th>
              </tr>
            </thead>
            <tbody>
              {view.sorted.map((s) => {
                const isOpen = open === s.sector;
                return (
                  <Fragment key={s.sector}>
                    <tr onClick={() => setOpen(isOpen ? null : s.sector)} className="cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/40">
                      <td className="px-3 py-2.5 md:px-4">
                        <div className="flex items-center gap-2">
                          <ChevronDown className={`hidden h-3.5 w-3.5 shrink-0 sm:block text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          <div>
                            <div className="text-[13px] font-medium text-foreground">{label(s.sector)}</div>
                            <div className="text-[10px] text-muted-foreground">{s.stocks} stocks</div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-2 py-2.5 md:table-cell"><Spark data={s.spark} up={s.spark[s.spark.length - 1] >= s.spark[0]} /></td>
                      {FRAMES.map((f) => (
                        <td key={f.key} className={`${colVis(f.key, frame)} px-1 py-1.5 text-right`}>
                          <div className={`rounded-md px-2 py-1 font-mono text-xs ${tone(s.chg[f.key])}`} style={tint(s.chg[f.key], f.key === '1d' ? 2 : f.key === '1w' ? 4 : f.key === '1m' ? 8 : 15)}>
                            {pct(s.chg[f.key])}
                          </div>
                        </td>
                      ))}
                      <td className={`hidden px-2 py-2.5 text-right font-mono text-xs md:table-cell ${tone(s.rs['3m'])}`}>{pct(s.rs['3m'])}</td>
                      <td className="hidden px-2 py-2.5 text-right font-mono text-xs text-foreground md:table-cell">{s.breadth50}%</td>
                      <td className="px-3 py-2.5 text-right md:px-4"><FlowChip s={flowState(s.flow.pressure)} p={s.flow.pressure} /></td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-border/60 bg-muted/30">
                        <td colSpan={10} className="px-4 py-5">
                          <div className="grid gap-6 md:grid-cols-3">
                            <div>
                              <div className="section-eyebrow mb-2">Leaders &middot; 1M</div>
                              <StockList rows={s.leaders} />
                              {s.surge.length > 0 && (
                                <>
                                  <div className="section-eyebrow mb-2 mt-4">Volume surge &middot; 5D vs 20D</div>
                                  <StockList rows={s.surge} />
                                </>
                              )}
                            </div>
                            <div>
                              <div className="section-eyebrow mb-2">Laggards &middot; 1M</div>
                              <StockList rows={s.laggards} />
                            </div>
                            <div>
                              <div className="section-eyebrow mb-2">Estimated net flow, 10 sessions</div>
                              <FlowBars daily={s.flow.daily} />
                              <div className="mt-2 text-xs text-muted-foreground">
                                Net <span className={`font-mono ${tone(s.flow.net10)}`}>{cr(s.flow.net10)}</span>
                                {' \u00B7 '}{s.adv}% of stocks up on the last session
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Source: NSE end-of-day bhavcopy (via the open tejhq/indian-markets dataset), sectors from NIFTY index constituent lists. Stocks with under &#8377;2 cr average daily turnover are excluded.
        Flow is an estimate derived from price and traded value; real institutional flow is not freely available at sector level. Educational use only, not investment advice.
      </p>
    </div>
  );
};

const StockList = ({ rows }: { rows: Pick[] }) => (
  <ul className="space-y-1.5">
    {rows.map((r) => (
      <li key={r.s}>
        <Link to={`/stock/${r.s}`} className="flex items-baseline justify-between gap-3 rounded-md px-1 py-0.5 text-[13px] hover:bg-muted">
          <span className="truncate font-medium text-foreground">{r.s}</span>
          <span className="shrink-0 font-mono text-xs">
            <span className="text-muted-foreground">{'\u20B9'}{r.p.toLocaleString('en-IN')}</span>{' '}
            <span className={tone(r.r21)}>{pct(r.r21)}</span>
          </span>
        </Link>
      </li>
    ))}
  </ul>
);

export default SectorBoard;
