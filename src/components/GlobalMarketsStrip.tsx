import { useEffect, useState, useCallback } from 'react';
import { fetchMultipleQuotesRacing } from '@/services/multiSourceDataService';
import { Globe2 } from 'lucide-react';

interface Item { label: string; symbol: string; fmt?: 'price' | 'idx' }

const ITEMS: Item[] = [
  { label: 'GIFT NIFTY', symbol: '^NSEI', fmt: 'idx' },
  { label: 'DOW', symbol: '^DJI', fmt: 'idx' },
  { label: 'NASDAQ', symbol: '^IXIC', fmt: 'idx' },
  { label: 'S&P 500', symbol: '^GSPC', fmt: 'idx' },
  { label: 'FTSE', symbol: '^FTSE', fmt: 'idx' },
  { label: 'NIKKEI', symbol: '^N225', fmt: 'idx' },
  { label: 'HANG SENG', symbol: '^HSI', fmt: 'idx' },
  { label: 'CRUDE', symbol: 'CL=F', fmt: 'price' },
  { label: 'GOLD', symbol: 'GC=F', fmt: 'price' },
  { label: 'USD/INR', symbol: 'INR=X', fmt: 'price' },
  { label: 'BTC', symbol: 'BTC-USD', fmt: 'price' },
];

const GlobalMarketsStrip = () => {
  const [data, setData] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetchMultipleQuotesRacing(ITEMS.map(i => i.symbol), 8000);
      setData(r);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="premium-card p-3">
      <div className="flex items-center gap-2 mb-2">
        <Globe2 className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
          Global Markets · Commodities · FX
        </span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-thin">
        {ITEMS.map((it) => {
          const q = data.get(it.symbol);
          const pct = q?.changePercent ?? 0;
          const pos = pct >= 0;
          return (
            <div key={it.label} className="flex-shrink-0 min-w-[110px]">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground/80">{it.label}</div>
              <div className="text-xs font-mono text-foreground">
                {loading || !q ? '—' : q.price.toLocaleString('en-IN', { maximumFractionDigits: it.fmt === 'price' ? 2 : 0 })}
              </div>
              <div className={`text-[10px] font-mono ${pos ? 'text-success' : 'text-destructive'}`}>
                {q ? `${pos ? '+' : ''}${pct.toFixed(2)}%` : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GlobalMarketsStrip;