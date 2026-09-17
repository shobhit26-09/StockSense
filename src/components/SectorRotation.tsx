import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layers, RefreshCw } from 'lucide-react';

interface Sector {
  symbol: string; name: string; price: number;
  change1d: number; change1w: number; change1m: number; rs1m: number;
}

type View = 'change1d' | 'change1w' | 'change1m' | 'rs1m';

const VIEWS: { key: View; label: string }[] = [
  { key: 'change1d', label: '1D' },
  { key: 'change1w', label: '1W' },
  { key: 'change1m', label: '1M' },
  { key: 'rs1m',     label: 'RS' },
];

const SectorRotation = () => {
  const [data, setData] = useState<Sector[]>([]);
  const [view, setView] = useState<View>('change1m');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await supabase.functions.invoke('fetch-market-data', {
        body: { type: 'sector-rotation' },
      });
      if (res?.sectors) setData(res.sectors);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  const sorted = [...data].sort((a, b) => (b[view] || 0) - (a[view] || 0));
  const max = Math.max(...sorted.map(s => Math.abs(s[view] || 0)), 1);

  return (
    <div className="premium-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="section-eyebrow">Sector Rotation</span>
        </div>
        <div className="flex items-center gap-0.5">
          {VIEWS.map(v => (
            <button key={v.key}
              onClick={() => setView(v.key)}
              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold transition-colors ${
                view === v.key ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}>{v.label}</button>
          ))}
          <button onClick={load} className="ml-1 text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto">
        {sorted.length === 0 && (
          <div className="text-[11px] text-muted-foreground text-center py-6">
            {loading ? 'Loading…' : 'No data'}
          </div>
        )}
        {sorted.map(s => {
          const v = s[view] || 0;
          const pos = v >= 0;
          const w = Math.min(100, (Math.abs(v) / max) * 100);
          return (
            <div key={s.symbol} className="flex items-center gap-2">
              <div className="w-20 text-[11px] text-foreground truncate">{s.name}</div>
              <div className="flex-1 h-5 relative bg-secondary/40 rounded">
                <div
                  className={`absolute top-0 bottom-0 ${pos ? 'left-1/2 bg-success/60' : 'right-1/2 bg-destructive/60'} rounded`}
                  style={{ width: `${w / 2}%` }}
                />
                <div className="absolute top-1/2 left-1/2 w-px h-3 -translate-y-1/2 bg-border" />
              </div>
              <div className={`w-14 text-right text-[11px] font-mono ${pos ? 'text-success' : 'text-destructive'}`}>
                {pos ? '+' : ''}{v.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>

      {view === 'rs1m' && (
        <div className="mt-2 pt-2 border-t border-border/40 text-[10px] text-muted-foreground/70">
          Relative strength vs NIFTY 50 · 1 month
        </div>
      )}
    </div>
  );
};

export default SectorRotation;