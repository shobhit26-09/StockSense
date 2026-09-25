import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, RefreshCw } from 'lucide-react';
import CompanyLogo from '@/components/CompanyLogo';
import Sparkline from '@/components/Sparkline';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { fetchHistory, type HistorySeries } from '@/services/historyService';
import {
  INDEX_OPTIONS, fetchAvgVolumes, fetchIndexSnapshot,
  type IndexKey, type IndexSnapshot, type MoverRow,
} from '@/services/indexMoversService';

type Tab = 'gainers' | 'losers' | 'volume';
const TABS: { key: Tab; label: string }[] = [
  { key: 'gainers', label: 'Gainers' },
  { key: 'losers', label: 'Losers' },
  { key: 'volume', label: 'Volume shockers' },
];

const isLiveSession = (d = new Date()) => {
  const day = d.getDay();
  const m = d.getHours() * 60 + d.getMinutes();
  return day > 0 && day < 6 && m >= 555 && m < 930;
};

const fmtVol = (n: number) =>
  n >= 1e7 ? `${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `${(n / 1e5).toFixed(2)} L` : n.toLocaleString('en-IN');

interface Props { limit?: number; expandable?: boolean }

const PremiumTopMovers = ({ limit = 6, expandable = false }: Props) => {
  const [tab, setTab] = useState<Tab>('gainers');
  const [index, setIndex] = useState<IndexKey>('n100');
  const [snap, setSnap] = useState<IndexSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [avg, setAvg] = useState<Record<string, number>>({});
  const [avgLoading, setAvgLoading] = useState(false);
  const [sparks, setSparks] = useState<Record<string, HistorySeries>>({});
  const [shown, setShown] = useState(limit);
  const navigate = useNavigate();

  const load = useCallback(async (key: IndexKey, force = false) => {
    if (force) setRefreshing(true); else setLoading(true);
    const s = await fetchIndexSnapshot(key, force);
    setSnap(s);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    setShown(limit);
    load(index);
    const t = setInterval(() => load(index, true), 60_000);
    return () => clearInterval(t);
  }, [index, limit, load]);

  // Volume shockers need a baseline: 20-session average volume, fetched once a day.
  const volCandidates = useMemo(
    () => (snap ? [...snap.rows].sort((a, b) => b.volume * b.price - a.volume * a.price).slice(0, 100).map((r) => r.symbol) : []),
    [snap],
  );
  useEffect(() => {
    if (tab !== 'volume' || !volCandidates.length) return;
    let alive = true;
    setAvgLoading(true);
    fetchAvgVolumes(volCandidates).then((a) => { if (alive) { setAvg(a); setAvgLoading(false); } });
    return () => { alive = false; };
  }, [tab, volCandidates]);

  const list: (MoverRow & { ratio?: number })[] = useMemo(() => {
    if (!snap) return [];
    if (tab === 'gainers') return snap.rows.filter((r) => r.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent);
    if (tab === 'losers') return snap.rows.filter((r) => r.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent);
    return snap.rows
      .filter((r) => avg[r.symbol] > 0)
      .map((r) => ({ ...r, ratio: r.volume / avg[r.symbol] }))
      .sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0));
  }, [snap, tab, avg]);

  const visible = list.slice(0, shown);

  useEffect(() => {
    const missing = visible.map((r) => r.symbol).filter((s) => !sparks[s]);
    if (!missing.length) return;
    let alive = true;
    Promise.all(missing.map((s) => fetchHistory(s, '1mo'))).then((all) => {
      if (!alive) return;
      setSparks((prev) => {
        const next = { ...prev };
        all.forEach((h) => { if (h.source === 'yahoo') next[h.symbol] = h; });
        return next;
      });
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.map((r) => r.symbol).join(',')]);

  const indexLabel = INDEX_OPTIONS.find((o) => o.key === index)?.label;
  const live = isLiveSession();
  const busy = loading || (tab === 'volume' && avgLoading && !list.length);

  return (
    <div className="premium-card overflow-hidden p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="no-scrollbar -mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setShown(limit); }}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-semibold transition-all ${
                tab === t.key
                  ? 'border-foreground/80 bg-foreground/[0.06] text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1.5 rounded-full border border-foreground/70 px-3.5 py-1.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted/50 data-[state=open]:bg-muted/60">
                {indexLabel}
                <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-60 rounded-2xl border-border/70 p-1.5">
              {INDEX_OPTIONS.map((o) => (
                <DropdownMenuItem
                  key={o.key}
                  onSelect={() => setIndex(o.key)}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium"
                >
                  <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 ${index === o.key ? 'border-success' : 'border-success/50'}`}>
                    {index === o.key && <span className="h-2 w-2 rounded-full bg-success" />}
                  </span>
                  {o.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => load(index, true)}
            disabled={refreshing}
            aria-label="Refresh movers"
            className="rounded-full p-2 text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border/60">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 bg-muted/40 px-4 py-2.5 text-[11px] font-medium text-muted-foreground sm:grid-cols-[minmax(0,1fr)_100px_auto] md:grid-cols-[minmax(0,1fr)_100px_150px_110px]">
          <span>Company</span>
          <span className="hidden text-right sm:block">1M trend</span>
          <span className="text-right">Market price (1D)</span>
          <span className="hidden text-right md:block">{tab === 'volume' ? 'Volume vs avg' : 'Volume'}</span>
        </div>

        <div className="divide-y divide-border/40">
          {busy ? (
            [...Array(Math.min(limit, 6))].map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="shimmer h-9 w-9 rounded-xl" />
                  <div className="space-y-1.5"><div className="shimmer h-3.5 w-36 rounded" /><div className="shimmer h-2.5 w-16 rounded" /></div>
                </div>
                <div className="shimmer h-4 w-24 rounded" />
              </div>
            ))
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-4 py-12 text-center">
              <span className="text-sm font-medium text-foreground">
                {!snap?.rows.length ? 'Quotes are unavailable right now'
                  : tab === 'gainers' ? `No gainers in ${indexLabel} this session`
                  : tab === 'losers' ? `No losers in ${indexLabel} this session`
                  : 'Not enough volume history yet'}
              </span>
              <span className="text-xs text-muted-foreground">
                {!snap?.rows.length ? 'The free feed did not respond. Try refresh in a minute.' : 'Every stock moved the other way. Try the other tab.'}
              </span>
            </div>
          ) : (
            visible.map((r) => {
              const pos = r.changePercent >= 0;
              const sp = sparks[r.symbol];
              return (
                <button
                  key={r.symbol}
                  onClick={() => navigate(`/stock/${encodeURIComponent(r.symbol)}.NS`)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 py-3 text-left transition-colors hover:bg-muted/30 sm:grid-cols-[minmax(0,1fr)_100px_auto] md:grid-cols-[minmax(0,1fr)_100px_150px_110px]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <CompanyLogo symbol={r.symbol} name={r.name} size="md" />
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-foreground">{r.name}</div>
                      <div className="truncate text-[11px] text-muted-foreground"><span className="font-mono">{r.symbol}</span> · {r.industry}</div>
                    </div>
                  </div>
                  <div className="hidden justify-end sm:flex">
                    {sp ? <Sparkline values={sp.points.map((p) => p.c)} positive={sp.points[sp.points.length - 1].c >= sp.points[0].c} width={92} height={28} /> : <span className="h-7 w-[92px]" />}
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[13px] text-foreground">₹{r.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className={`font-mono text-[11px] font-medium ${pos ? 'text-success' : 'text-destructive'}`}>
                      {pos ? '+' : ''}{r.change.toFixed(2)} ({pos ? '+' : ''}{r.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                  <div className="hidden text-right md:block">
                    {tab === 'volume' && r.ratio ? (
                      <>
                        <div className="font-mono text-[13px] font-semibold text-warning">{r.ratio.toFixed(1)}×</div>
                        <div className="font-mono text-[10.5px] text-muted-foreground">{fmtVol(r.volume)}</div>
                      </>
                    ) : (
                      <div className="font-mono text-[12px] text-muted-foreground">{fmtVol(r.volume)}</div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {expandable && list.length > shown && (
        <div className="mt-3 flex justify-center">
          <button onClick={() => setShown((n) => n + 20)} className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/50">
            Show more ({list.length - shown} left)
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-[10.5px] text-muted-foreground">
        <span>
          {snap ? `${snap.rows.length} of ${snap.total} ${indexLabel} stocks priced` : `Loading ${indexLabel}`}
          {tab === 'volume' && snap ? ' · volume vs 20-session average, checked for the 100 most-traded' : ''}
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-success live-indicator' : 'bg-muted-foreground/50'}`} />
          {live ? 'Live' : 'Last session'} · Yahoo Finance{snap ? ` · ${snap.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}
        </span>
      </div>
    </div>
  );
};

export default PremiumTopMovers;
