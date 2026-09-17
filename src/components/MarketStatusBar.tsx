import { useEffect, useState } from 'react';
import { fetchMultipleQuotesRacing } from '@/services/multiSourceDataService';

const sessionInfo = (d: Date) => {
  const day = d.getDay();
  const m = d.getHours() * 60 + d.getMinutes();
  if (day === 0 || day === 6) return { label: 'Closed · Weekend', tone: 'text-muted-foreground', dot: 'bg-muted-foreground' };
  if (m >= 540 && m < 555)  return { label: 'Pre-Market', tone: 'text-warning', dot: 'bg-warning' };
  if (m >= 555 && m < 930)  return { label: 'Live · NSE/BSE', tone: 'text-success', dot: 'bg-success' };
  if (m >= 930 && m < 960)  return { label: 'Post-Market', tone: 'text-warning', dot: 'bg-warning' };
  return { label: 'Closed', tone: 'text-muted-foreground', dot: 'bg-muted-foreground' };
};

const MarketStatusBar = () => {
  const [now, setNow] = useState(new Date());
  const [quotes, setQuotes] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const load = async () => {
      const r = await fetchMultipleQuotesRacing(['^NSEI', '^NSEBANK', '^BSESN', '^INDIAVIX'], 8000);
      setQuotes(r);
    };
    load();
    const t = setInterval(load, 12000);
    return () => clearInterval(t);
  }, []);

  const s = sessionInfo(now);
  const nifty = quotes.get('^NSEI');
  const bank  = quotes.get('^NSEBANK');
  const sx    = quotes.get('^BSESN');
  const vix   = quotes.get('^INDIAVIX');

  const Stat = ({ label, q, invert }: { label: string; q: any; invert?: boolean }) => {
    if (!q) return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-[11px] font-mono text-muted-foreground">—</span>
      </div>
    );
    const pos = q.changePercent >= 0;
    const tone = invert ? (pos ? 'text-destructive' : 'text-success') : (pos ? 'text-success' : 'text-destructive');
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-[11px] font-mono text-foreground">{q.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        <span className={`text-[11px] font-mono ${tone}`}>{pos ? '+' : ''}{q.changePercent.toFixed(2)}%</span>
      </div>
    );
  };

  return (
    <div className="premium-card px-4 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-2">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${s.dot} live-indicator`} />
        <span className={`text-[11px] font-semibold ${s.tone}`}>{s.label}</span>
        <span className="text-[11px] font-mono text-muted-foreground">
          {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} IST
        </span>
      </div>
      <div className="h-4 w-px bg-border/60" />
      <Stat label="NIFTY" q={nifty} />
      <Stat label="BANK" q={bank} />
      <Stat label="SENSEX" q={sx} />
      <Stat label="VIX" q={vix} invert />
    </div>
  );
};

export default MarketStatusBar;