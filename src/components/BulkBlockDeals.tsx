import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, RefreshCw } from 'lucide-react';

interface Deal {
  symbol: string; name?: string; clientName?: string;
  type: string; qty: number; price: number; date?: string;
}

type Tab = 'bulk' | 'block';

const fmtQty = (n: number) => {
  if (n >= 1e7) return `${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `${(n / 1e5).toFixed(2)}L`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
};

const BulkBlockDeals = () => {
  const navigate = useNavigate();
  const [bulk, setBulk] = useState<Deal[]>([]);
  const [block, setBlock] = useState<Deal[]>([]);
  const [tab, setTab] = useState<Tab>('bulk');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('fetch-market-data', { body: { type: 'bulk-deals' } });
      if (data) {
        setBulk(data.bulk || []);
        setBlock(data.block || []);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10 * 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  const rows = tab === 'bulk' ? bulk : block;

  return (
    <div className="premium-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="section-eyebrow">Bulk &amp; Block Deals</span>
        </div>
        <div className="flex items-center gap-1">
          {(['bulk', 'block'] as Tab[]).map(t => (
            <button key={t}
              onClick={() => setTab(t)}
              className={`text-[10px] px-2 py-0.5 rounded font-semibold capitalize transition-colors ${
                tab === t ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}>{t}</button>
          ))}
          <button onClick={load} className="ml-1 text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        {rows.length === 0 && (
          <div className="text-[11px] text-muted-foreground text-center py-6">
            {loading ? 'Loading…' : 'No deals reported today'}
          </div>
        )}
        <div className="space-y-1">
          {rows.map((d, i) => {
            const isBuy = (d.type || '').toUpperCase().startsWith('B');
            return (
              <div
                key={i}
                onClick={() => navigate(`/stock/${d.symbol}.NS`)}
                className="group flex items-center gap-2 py-1.5 px-2 rounded hover:bg-secondary/30 cursor-pointer transition-colors"
              >
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  isBuy ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                }`}>{isBuy ? 'BUY' : 'SELL'}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-foreground truncate">{d.symbol}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{d.clientName || d.name || '—'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-mono text-foreground">₹{d.price.toFixed(2)}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{fmtQty(d.qty)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BulkBlockDeals;