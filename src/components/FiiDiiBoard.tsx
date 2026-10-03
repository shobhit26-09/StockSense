import { useEffect, useMemo, useState } from 'react';

interface Day {
  d: string;
  fiiCash?: number; diiCash?: number;
  idxFut?: number; idxOpt?: number; stkFut?: number; stkOpt?: number;
}
interface Payload { source: string; days: Day[]; updatedAt?: string }

type Seg = 'cash' | 'idxFut' | 'idxOpt' | 'stkFut';
const SEGS: { key: Seg; label: string; hint: string }[] = [
  { key: 'cash', label: 'Cash market', hint: 'FII/FPI and DII net buying in equities' },
  { key: 'idxFut', label: 'Index futures', hint: 'FII net position taken in index futures that day' },
  { key: 'idxOpt', label: 'Index options', hint: 'FII net premium traded in index options that day' },
  { key: 'stkFut', label: 'Stock futures', hint: 'FII net position taken in stock futures that day' },
];
const RANGES = [10, 20, 50] as const;

const fmt = (v: number | undefined, sign = true) => {
  if (v === undefined) return '\u2014';
  const a = Math.abs(v);
  const t = a >= 1000 ? a.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : a.toFixed(0);
  return `${sign ? (v >= 0 ? '+' : '\u2212') : v < 0 ? '\u2212' : ''}${t}`;
};
const tone = (v: number | undefined) => (v === undefined ? 'text-muted-foreground' : v >= 0 ? 'text-success' : 'text-destructive');
const dShort = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const dLong = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const sum = (xs: (number | undefined)[]) => xs.reduce<number>((a, b) => a + (b ?? 0), 0);

const valOf = (r: Day, seg: Seg, who: 'fii' | 'dii'): number | undefined =>
  seg === 'cash' ? (who === 'fii' ? r.fiiCash : r.diiCash) : who === 'fii' ? r[seg] : undefined;

const Chart = ({ rows, seg }: { rows: Day[]; seg: Seg }) => {
  const dual = seg === 'cash';
  const vals = rows.flatMap((r) => [valOf(r, seg, 'fii'), dual ? valOf(r, seg, 'dii') : undefined]).filter((v): v is number => v !== undefined);
  const max = Math.max(...vals.map(Math.abs), 1);
  const H = 190;
  return (
    <div>
      <div className="relative" style={{ height: H }}>
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-border" />
        <div className="absolute left-0 top-0 text-[10px] text-muted-foreground">{'\u20B9'}{fmt(max, false).replace('\u2212', '')} cr</div>
        <div className="absolute bottom-0 left-0 text-[10px] text-muted-foreground">{'\u2212\u20B9'}{fmt(max, false).replace('\u2212', '')} cr</div>
        <div className="flex h-full items-stretch gap-[3px] px-1 sm:gap-1.5">
          {rows.map((r) => {
            const f = valOf(r, seg, 'fii'), di = dual ? valOf(r, seg, 'dii') : undefined;
            const bar = (v: number | undefined, color?: string) =>
              v === undefined ? <div className="flex-1" /> : (
                <div className="relative flex-1">
                  <div className="absolute inset-x-0 rounded-[2px]" style={{
                    height: `${(Math.abs(v) / max) * 50}%`, [v >= 0 ? 'bottom' : 'top']: '50%',
                    backgroundColor: color ?? `hsl(var(${v >= 0 ? '--success' : '--destructive'}))`,
                  }} />
                </div>
              );
            return (
              <div key={r.d} className="group relative flex min-w-0 flex-1 gap-px" title={`${dLong(r.d)}  FII ${fmt(f)}${dual ? `  DII ${fmt(di)}` : ''} cr`}>
                {bar(f, dual ? 'hsl(var(--warning))' : undefined)}
                {dual && bar(di, 'hsl(199 89% 52%)')}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex justify-between px-1 text-[10px] text-muted-foreground">
        <span>{rows.length ? dShort(rows[0].d) : ''}</span>
        <span>{rows.length ? dShort(rows[rows.length - 1].d) : ''}</span>
      </div>
    </div>
  );
};

const Stat = ({ k, v, sub, t }: { k: string; v: string; sub: string; t?: number }) => (
  <div className="bg-card p-4">
    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k}</div>
    <div className={`mt-1.5 font-mono text-xl font-medium ${t === undefined ? 'text-foreground' : tone(t)}`}>{v}</div>
    <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
  </div>
);

const FiiDiiBoard = () => {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState(false);
  const [seg, setSeg] = useState<Seg | null>(null);
  const [range, setRange] = useState<(typeof RANGES)[number]>(20);

  useEffect(() => {
    fetch('/data/fii-dii.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : Promise.reject())).then(setData).catch(() => setErr(true));
  }, []);

  const days = useMemo(() => data?.days ?? [], [data]);
  const cashDays = days.filter((r) => r.fiiCash !== undefined);
  const active: Seg = seg ?? (cashDays.length >= 8 ? 'cash' : 'idxFut');

  const view = useMemo(() => {
    const has = (r: Day) => (active === 'cash' ? r.fiiCash !== undefined : r[active] !== undefined);
    const series = days.filter(has);
    const rows = series.slice(-range);
    const fii = series.map((r) => valOf(r, active, 'fii'));
    let streak = 0;
    const sign = (fii[fii.length - 1] ?? 0) >= 0 ? 1 : -1;
    for (let i = fii.length - 1; i >= 0 && (fii[i] ?? 0) * sign > 0; i--) streak++;
    const last5 = series.slice(-5), last20 = series.slice(-20);
    return { series, rows, sign, streak, f5: sum(last5.map((r) => valOf(r, active, 'fii'))), f20: sum(last20.map((r) => valOf(r, active, 'fii'))),
      d5: sum(last5.map((r) => valOf(r, active, 'dii'))), d20: sum(last20.map((r) => valOf(r, active, 'dii'))), n5: last5.length, n20: last20.length };
  }, [days, active, range]);

  if (err) return <div className="premium-card p-8 text-center text-sm text-muted-foreground">FII / DII data could not be loaded. Try again in a moment.</div>;
  if (!data) return <div className="premium-card h-72 animate-pulse" />;

  const latest = <T extends keyof Day>(k: T) => [...days].reverse().find((r) => r[k] !== undefined);
  const lc = latest('fiiCash'), lf = latest('idxFut'), lo = latest('idxOpt'), ls = latest('stkFut');
  const dual = active === 'cash';
  const seginfo = SEGS.find((s) => s.key === active)!;
  const table = [...days].reverse().slice(0, 15);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Official NSE figures, {'\u20B9'} crore, net buy / (sell). Latest cash print <span className="font-medium text-foreground">{lc ? dLong(lc.d) : '\u2014'}</span></span>
        <span>{days.length} sessions of history</span>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
        <Stat k="FII / FPI cash" v={fmt(lc?.fiiCash)} sub={lc ? `DII ${fmt(lc.diiCash)} cr` : ''} t={lc?.fiiCash} />
        <Stat k="FII index futures" v={fmt(lf?.idxFut)} sub={lf ? dLong(lf.d) : ''} t={lf?.idxFut} />
        <Stat k="FII index options" v={fmt(lo?.idxOpt)} sub={lo ? dLong(lo.d) : ''} t={lo?.idxOpt} />
        <Stat k="FII stock futures" v={fmt(ls?.stkFut)} sub={ls ? dLong(ls.d) : ''} t={ls?.stkFut} />
      </div>

      <section className="premium-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div className="inline-flex flex-wrap rounded-lg bg-muted p-0.5" role="tablist" aria-label="Segment">
            {SEGS.map((s) => (
              <button key={s.key} role="tab" aria-selected={active === s.key} onClick={() => setSeg(s.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${active === s.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-lg bg-muted p-0.5" role="tablist" aria-label="Range">
            {RANGES.map((n) => (
              <button key={n} role="tab" aria-selected={range === n} onClick={() => setRange(n)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${range === n ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {n}D
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] text-muted-foreground">{seginfo.hint}. Daily bars, oldest to newest.</p>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              {dual ? (
                <>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-warning" />FII / FPI</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: 'hsl(199 89% 52%)' }} />DII</span>
                </>
              ) : (
                <span>FII only &middot; green = net buying, red = net selling</span>
              )}
            </div>
          </div>
          {view.rows.length < 2 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">History for this segment is still building. It adds one day after each close.</p>
          ) : <Chart rows={view.rows} seg={active} />}
        </div>

        {view.series.length > 0 && (
          <div className="grid grid-cols-2 gap-px border-t border-border bg-border lg:grid-cols-4">
            <Stat k="Streak" v={`${view.streak} ${view.streak === 1 ? 'session' : 'sessions'}`}
              sub={view.sign >= 0 ? 'FII net buying in a row' : 'FII net selling in a row'} t={view.sign} />
            <Stat k={`FII last ${view.n5}`} v={fmt(view.f5)} sub="cr, cumulative" t={view.f5} />
            <Stat k={`FII last ${view.n20}`} v={fmt(view.f20)} sub="cr, cumulative" t={view.f20} />
            {dual ? <Stat k={`DII last ${view.n20}`} v={fmt(view.d20)} sub="cr, cumulative" t={view.d20} />
              : <Stat k="Sessions tracked" v={`${view.series.length}`} sub="in this segment" />}
          </div>
        )}
      </section>

      <section className="premium-card overflow-hidden">
        <div className="border-b border-border p-4">
          <div className="section-eyebrow">Day by day</div>
          <p className="mt-1 text-[13px] text-muted-foreground">Net buy / (sell) in {'\u20B9'} crore. A dash means NSE has not published that figure for the day, or our history has not reached it yet.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-2 py-2.5 text-right">FII cash</th>
                <th className="px-2 py-2.5 text-right">DII cash</th>
                <th className="px-2 py-2.5 text-right">Idx fut</th>
                <th className="hidden px-2 py-2.5 text-right md:table-cell">Idx opt</th>
                <th className="hidden px-2 py-2.5 text-right md:table-cell">Stk fut</th>
                <th className="hidden px-4 py-2.5 text-right md:table-cell">Stk opt</th>
              </tr>
            </thead>
            <tbody>
              {table.map((r) => (
                <tr key={r.d} className="border-b border-border/60 text-[13px]">
                  <td className="px-4 py-2.5 font-medium text-foreground">{dShort(r.d)}</td>
                  {[r.fiiCash, r.diiCash, r.idxFut].map((v, i) => <td key={i} className={`px-2 py-2.5 text-right font-mono text-xs ${tone(v)}`}>{fmt(v)}</td>)}
                  <td className={`hidden px-2 py-2.5 text-right font-mono text-xs md:table-cell ${tone(r.idxOpt)}`}>{fmt(r.idxOpt)}</td>
                  <td className={`hidden px-2 py-2.5 text-right font-mono text-xs md:table-cell ${tone(r.stkFut)}`}>{fmt(r.stkFut)}</td>
                  <td className={`hidden px-4 py-2.5 text-right font-mono text-xs md:table-cell ${tone(r.stkOpt)}`}>{fmt(r.stkOpt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Source: NSE cash-market FII/FPI and DII activity, and NSE FII derivatives statistics, both published after the close. Derivatives history is backfilled from NSE archives;
        cash history is recorded daily from the latest NSE print, so it grows one day at a time. Derivative figures are the day's buy value minus sell value, not open positions. Educational use only, not investment advice.
      </p>
    </div>
  );
};

export default FiiDiiBoard;
