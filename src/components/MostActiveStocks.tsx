import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, RefreshCw } from 'lucide-react';
import { fetchTopMovers, type TopMover } from '@/services/topMoversService';

const formatVolume = (n?: number) => {
  if (!n) return '—';
  if (n >= 1e7) return (n / 1e7).toFixed(1) + ' Cr';
  if (n >= 1e5) return (n / 1e5).toFixed(1) + ' L';
  return n.toLocaleString('en-IN');
};

const MostActiveStocks = () => {
  const [rows, setRows] = useState<TopMover[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    try {
      const r = await fetchTopMovers(force);
      setRows((r.mostActive || []).slice(0, 6));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load(), 60000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="premium-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Most Active by Volume</h2>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 pb-2 border-b border-border/40 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
        <span>Stock</span>
        <span className="text-right">Volume</span>
        <span className="text-right">Price</span>
      </div>
      <div className="divide-y divide-border/20">
        {loading && rows.length === 0 ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse bg-muted/10 my-2 rounded" />
          ))
        ) : rows.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">No data</div>
        ) : (
          rows.map((s) => {
            const pos = s.changePercent >= 0;
            return (
              <button
                key={s.symbol}
                onClick={() => navigate(`/stock/${s.symbol.includes('.NS') ? s.symbol : s.symbol + '.NS'}`)}
                className="w-full grid grid-cols-[1fr_auto_auto] gap-x-4 py-2.5 items-center hover:bg-muted/10 -mx-2 px-2 rounded transition-colors text-left"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{s.name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{s.symbol}</div>
                </div>
                <div className="text-right text-xs font-mono text-foreground">{formatVolume(s.volume)}</div>
                <div className="text-right">
                  <div className="text-xs font-mono text-foreground">₹{s.price.toFixed(2)}</div>
                  <div className={`text-[10px] font-mono ${pos ? 'text-success' : 'text-destructive'}`}>
                    {pos ? '+' : ''}{s.changePercent.toFixed(2)}%
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MostActiveStocks;