import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Activity, RefreshCw } from 'lucide-react';

interface Wall { strike: number; oi: number; chg: number; }
interface Chain {
  symbol: string; spot: number; expiry: string; pcr: number; maxPain: number;
  totalCallOI: number; totalPutOI: number;
  totalCallChgOI: number; totalPutChgOI: number;
  resistance: Wall[]; support: Wall[];
}

const SYMBOLS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY'];

const fmtOI = (n: number) => {
  if (n >= 1e7) return `${(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
};

const OptionsInsights = () => {
  const [sym, setSym] = useState('NIFTY');
  const [data, setData] = useState<Chain | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (s: string) => {
    setLoading(true);
    try {
      const { data: res } = await supabase.functions.invoke('fetch-market-data', {
        body: { type: 'options-chain', symbol: s },
      });
      if (res && !res.error) setData(res as Chain);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load(sym);
    const t = setInterval(() => load(sym), 60000); // option-chain ~1 min
    return () => clearInterval(t);
  }, [sym, load]);

  const pcrTone = data
    ? data.pcr > 1.2 ? 'text-success' : data.pcr < 0.8 ? 'text-destructive' : 'text-warning'
    : '';
  const pcrBias = data
    ? data.pcr > 1.2 ? 'Bullish bias' : data.pcr < 0.8 ? 'Bearish bias' : 'Neutral'
    : '';

  return (
    <div className="premium-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="section-eyebrow">Options Chain</span>
        </div>
        <div className="flex items-center gap-1">
          {SYMBOLS.map(s => (
            <button key={s}
              onClick={() => setSym(s)}
              className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                sym === s ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {s === 'NIFTY' ? 'NIFTY' : s === 'BANKNIFTY' ? 'BNF' : 'FIN'}
            </button>
          ))}
          <button onClick={() => load(sym)} className="ml-1 text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {!data && (
        <div className="flex-1 flex items-center justify-center text-[11px] text-muted-foreground">
          {loading ? 'Loading option chain…' : 'No data'}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Metric label="Spot" value={data.spot.toLocaleString('en-IN', { maximumFractionDigits: 2 })} />
            <Metric label="PCR" value={data.pcr.toFixed(2)} tone={pcrTone} hint={pcrBias} />
            <Metric label="Max Pain" value={data.maxPain.toLocaleString('en-IN')} hint={`Δ ${((data.maxPain - data.spot) / data.spot * 100).toFixed(2)}%`} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3 text-[11px] font-mono">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Call OI</div>
              <div className="text-foreground">{fmtOI(data.totalCallOI)}</div>
              <div className={`text-[10px] ${data.totalCallChgOI >= 0 ? 'text-destructive' : 'text-success'}`}>
                {data.totalCallChgOI >= 0 ? '+' : ''}{fmtOI(data.totalCallChgOI)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Put OI</div>
              <div className="text-foreground">{fmtOI(data.totalPutOI)}</div>
              <div className={`text-[10px] ${data.totalPutChgOI >= 0 ? 'text-success' : 'text-destructive'}`}>
                {data.totalPutChgOI >= 0 ? '+' : ''}{fmtOI(data.totalPutChgOI)}
              </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-3 overflow-hidden">
            <Walls title="Resistance" tone="text-destructive" walls={data.resistance} />
            <Walls title="Support" tone="text-success" walls={data.support} />
          </div>

          <div className="mt-3 pt-2 border-t border-border/40 text-[10px] text-muted-foreground/70 font-mono">
            Expiry {data.expiry}
          </div>
        </>
      )}
    </div>
  );
};

const Metric = ({ label, value, tone, hint }: { label: string; value: string; tone?: string; hint?: string }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className={`text-sm font-mono font-semibold ${tone || 'text-foreground'}`}>{value}</div>
    {hint && <div className="text-[10px] text-muted-foreground/70 font-mono">{hint}</div>}
  </div>
);

const Walls = ({ title, tone, walls }: { title: string; tone: string; walls: Wall[] }) => (
  <div>
    <div className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${tone}`}>{title}</div>
    <div className="space-y-1">
      {walls.map(w => (
        <div key={w.strike} className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-foreground">{w.strike.toLocaleString('en-IN')}</span>
          <span className="text-muted-foreground">{fmtOI(w.oi)}</span>
        </div>
      ))}
    </div>
  </div>
);

export default OptionsInsights;