import { useEffect, useState } from 'react';

interface Row { l: string; v: number; n: number | null; c: number | null }
interface Side { daily: Row[]; monthly: Row[]; yearly: Row[] }
interface Payload { source: string; updatedAt?: string; fii: Side; dii: Side }

type Who = 'fii' | 'dii';
type Span = 'daily' | 'monthly' | 'yearly';
const SPANS: { key: Span; label: string; head: string; first: number }[] = [
  { key: 'daily', label: 'Daily', head: 'Date', first: 20 },
  { key: 'monthly', label: 'Monthly', head: 'Month', first: 24 },
  { key: 'yearly', label: 'Yearly', head: 'Year', first: 99 },
];

const num = (v: number) => Math.abs(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const label = (l: string, span: Span) => {
  if (span !== 'daily') return l;
  return new Date(l + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const Seg = ({ items, value, onChange, name }: { items: { key: string; label: string }[]; value: string; onChange: (k: string) => void; name: string }) => (
  <div role="tablist" aria-label={name} className="inline-flex rounded-full border border-border bg-card p-0.5">
    {items.map((i) => (
      <button key={i.key} role="tab" aria-selected={value === i.key} onClick={() => onChange(i.key)}
        className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${value === i.key ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
        {i.label}
      </button>
    ))}
  </div>
);

const FiiDiiBoard = () => {
  const [data, setData] = useState<Payload | null>(null);
  const [failed, setFailed] = useState(false);
  const [who, setWho] = useState<Who>('fii');
  const [span, setSpan] = useState<Span>('daily');
  const [all, setAll] = useState(false);

  useEffect(() => {
    fetch('/data/fii-dii.json').then((r) => (r.ok ? r.json() : Promise.reject())).then(setData).catch(() => setFailed(true));
  }, []);
  useEffect(() => setAll(false), [span]);

  if (failed) return <p className="py-16 text-center text-sm text-muted-foreground">FII / DII data is not available right now.</p>;
  if (!data) return <div className="h-96 animate-pulse rounded-2xl border border-border bg-card" />;

  const cfg = SPANS.find((s) => s.key === span)!;
  const rows = data[who][span];
  const shown = all ? rows : rows.slice(0, cfg.first);
  const maxNeg = Math.max(...shown.map((r) => (r.v < 0 ? -r.v : 0)), 1);
  const maxPos = Math.max(...shown.map((r) => (r.v > 0 ? r.v : 0)), 1);
  const negShare = (maxNeg / (maxNeg + maxPos)) * 100;
  const grid = 'grid items-center gap-x-3 sm:gap-x-5 grid-cols-[3.25rem_5.5rem_minmax(0,1fr)_4.5rem] sm:grid-cols-[6rem_8rem_minmax(0,1fr)_7rem_4.5rem]';

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Seg name="Investor type" value={who} onChange={(k) => setWho(k as Who)} items={[{ key: 'fii', label: 'FII' }, { key: 'dii', label: 'DII' }]} />
        <Seg name="Period" value={span} onChange={(k) => setSpan(k as Span)} items={SPANS.map((s) => ({ key: s.key, label: s.label }))} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className={`${grid} border-b border-border px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:px-6`}>
          <div>{cfg.head}</div>
          <div className="text-right">Net, {'\u20B9'} cr</div>
          <div className="text-center">Buy / (sell)</div>
          <div className="text-right">Nifty</div>
          <div className="hidden text-right sm:block">Chg %</div>
        </div>
        {shown.map((r) => {
          const w = r.v < 0 ? (-r.v / maxNeg) * negShare : (r.v / maxPos) * (100 - negShare);
          const up = r.v >= 0;
          const cup = (r.c ?? 0) >= 0;
          return (
            <div key={r.l} className={`${grid} border-b border-border/60 px-4 py-3 text-sm last:border-b-0 sm:px-6`}>
              <div className="text-foreground">{label(r.l, span)}</div>
              <div className={`text-right font-mono tabular-nums ${up ? 'text-success' : 'text-destructive'}`}>{up ? '+' : '\u2212'}{num(r.v)}</div>
              <div className="relative h-4" aria-hidden>
                <div className="absolute inset-y-0 w-px bg-border" style={{ left: `${negShare}%` }} />
                <div className={`absolute inset-y-0.5 rounded-[3px] ${up ? 'bg-success' : 'bg-destructive'}`}
                  style={up ? { left: `${negShare}%`, width: `${w}%` } : { left: `${negShare - w}%`, width: `${w}%` }} />
              </div>
              <div className="text-right font-mono tabular-nums text-foreground">
                {r.n ? r.n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '\u2014'}
                {r.c !== null && <div className={`text-[11px] sm:hidden ${cup ? 'text-success' : 'text-destructive'}`}>{cup ? '\u25B2' : '\u25BC'} {Math.abs(r.c).toFixed(1)}%</div>}
              </div>
              <div className={`hidden text-right font-mono tabular-nums sm:block ${r.c === null ? 'text-muted-foreground' : cup ? 'text-success' : 'text-destructive'}`}>
                {r.c === null ? '\u2014' : `${cup ? '\u25B2' : '\u25BC'} ${Math.abs(r.c).toFixed(1)}%`}
              </div>
            </div>
          );
        })}
        {rows.length > shown.length && (
          <button onClick={() => setAll(true)} className="w-full border-t border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Show all {rows.length}
          </button>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Cash-market net buy/(sell), {'\u20B9'} crore. Figures are provisional. History is compiled from NSE/BSE data via StockEdge{'\u2019'}s public feed, because NSE publishes only the latest day. Updated each trading evening.
      </p>
    </section>
  );
};

export default FiiDiiBoard;
