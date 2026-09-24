import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import CompanyLogo from '@/components/CompanyLogo';
import Sparkline from '@/components/Sparkline';
import { fetchTopMovers, type TopMover, type TopMoversData } from '@/services/topMoversService';
import { fetchHistory, type HistorySeries } from '@/services/historyService';
import { isSimulatedSource } from '@/config/showcase';
import { useNavigate } from 'react-router-dom';

const PremiumTopMovers = () => {
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers'>('gainers');
  const [userPicked, setUserPicked] = useState(false);
  const [data, setData] = useState<TopMoversData | null>(null);
  const [sparks, setSparks] = useState<Record<string, HistorySeries>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async (force = false) => {
    if (force) setIsRefreshing(true); else setIsLoading(true);
    try {
      const result = await fetchTopMovers(force);
      setData(result);
    } catch (e) {
      console.error('[TopMovers]', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load(), 60000);
    return () => clearInterval(t);
  }, [load]);

  // On a one-sided day, open the side that actually has stocks.
  useEffect(() => {
    if (!data || userPicked) return;
    if (!data.gainers.length && data.losers.length) setActiveTab('losers');
    else if (!data.losers.length && data.gainers.length) setActiveTab('gainers');
  }, [data, userPicked]);

  const list: TopMover[] = data ? (activeTab === 'gainers' ? data.gainers : data.losers).slice(0, 6) : [];

  useEffect(() => {
    const missing = list.map((s) => s.symbol).filter((s) => !sparks[s]);
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
  }, [data, activeTab]);

  const pickTab = (t: 'gainers' | 'losers') => { setUserPicked(true); setActiveTab(t); };
  const handleRowClick = (symbol: string) => navigate(`/stock/${symbol.includes('.NS') ? symbol : `${symbol}.NS`}`);
  const simulated = isSimulatedSource(data?.source);
  const counts = { gainers: data?.gainers.length ?? 0, losers: data?.losers.length ?? 0 };

  return (
    <div className="premium-card overflow-hidden p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex rounded-full bg-muted/40 p-1">
          {(['gainers', 'losers'] as const).map((t) => (
            <button
              key={t}
              onClick={() => pickTab(t)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === t
                  ? t === 'gainers' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'gainers' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {t === 'gainers' ? 'Gainers' : 'Losers'}
              {data && <span className="font-mono text-[10px] opacity-70">{counts[t]}</span>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <span className="hidden font-mono text-[10.5px] text-muted-foreground sm:inline">
              {data.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {simulated ? 'Sample data' : data.source}
            </span>
          )}
          <button
            onClick={() => load(true)}
            disabled={isRefreshing}
            aria-label="Refresh movers"
            className="rounded-full p-2 text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {simulated && (
        <div className="mb-3 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-[11px] text-warning">
          Live movers feed is unavailable. Showing sample rows.
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-4 border-b border-border/50 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <span>Company</span>
        <span className="hidden text-right sm:block">1M trend</span>
        <span className="text-right">Price · Day</span>
      </div>

      <div className="divide-y divide-border/30">
        {isLoading && !data ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="shimmer h-9 w-9 rounded-xl" />
                <div className="shimmer h-4 w-32 rounded" />
              </div>
              <div className="shimmer hidden h-6 w-24 rounded sm:block" />
              <div className="shimmer h-4 w-20 rounded" />
            </div>
          ))
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-10 text-center">
            <span className="text-sm font-medium text-foreground">
              {activeTab === 'gainers' ? 'No gainers today' : 'No losers today'}
            </span>
            <span className="text-xs text-muted-foreground">
              Every tracked stock moved the other way.{' '}
              <button className="font-semibold text-foreground underline-offset-2 hover:underline" onClick={() => pickTab(activeTab === 'gainers' ? 'losers' : 'gainers')}>
                See {activeTab === 'gainers' ? 'losers' : 'gainers'}
              </button>
            </span>
          </div>
        ) : (
          list.map((stock) => {
            const pos = stock.changePercent >= 0;
            const sp = sparks[stock.symbol];
            const rangePct = stock.high && stock.low && stock.high > stock.low
              ? ((stock.price - stock.low) / (stock.high - stock.low)) * 100 : null;
            return (
              <button
                key={stock.symbol}
                onClick={() => handleRowClick(stock.symbol)}
                className="-mx-2 grid w-[calc(100%+1rem)] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 rounded-xl px-2 py-3 text-left transition-colors hover:bg-muted/30"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <CompanyLogo symbol={stock.symbol} name={stock.name} size="md" />
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-foreground">{stock.name}</div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10.5px] text-muted-foreground">{stock.symbol}</span>
                      {rangePct !== null && (
                        <span className="relative hidden h-1 w-14 rounded-full bg-muted md:inline-block" title="Position in today's range">
                          <span className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/80" style={{ left: `${Math.max(4, Math.min(96, rangePct))}%` }} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="hidden sm:block">
                  {sp ? (
                    <Sparkline values={sp.points.map((p) => p.c)} positive={sp.points[sp.points.length - 1].c >= sp.points[0].c} width={96} height={30} />
                  ) : (
                    <span className="block h-[30px] w-24" />
                  )}
                </div>
                <div className="text-right">
                  <div className="font-mono text-[13px] text-foreground">
                    ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                  <span className={`mt-0.5 inline-block rounded-md px-1.5 py-0.5 font-mono text-[10.5px] font-medium ${pos ? 'status-positive' : 'status-negative'}`}>
                    {pos ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="mt-3 border-t border-border/40 pt-3 text-center text-[10.5px] text-muted-foreground">
        NIFTY 500 basket · tap a row to analyze
      </div>
    </div>
  );
};

export default PremiumTopMovers;
