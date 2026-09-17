import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMultipleQuotesRacing } from '@/services/multiSourceDataService';
import { ArrowRight, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';

const sessionInfo = (d: Date) => {
  const day = d.getDay();
  const m = d.getHours() * 60 + d.getMinutes();
  if (day === 0 || day === 6) return { label: 'Markets closed · Weekend', tone: 'muted' as const };
  if (m >= 540 && m < 555)  return { label: 'Pre-market', tone: 'warning' as const };
  if (m >= 555 && m < 930)  return { label: 'Live · NSE · BSE', tone: 'success' as const };
  if (m >= 930 && m < 960)  return { label: 'Post-market', tone: 'warning' as const };
  return { label: 'Markets closed', tone: 'muted' as const };
};

const toneColor = (t: 'success' | 'warning' | 'muted') =>
  t === 'success' ? 'text-success' : t === 'warning' ? 'text-warning' : 'text-muted-foreground';

const MarketHero = () => {
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

  return (
    <section className="glass-panel rounded-[2rem] overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="p-7 py-12 md:p-12 lg:p-14">
          <div className="section-eyebrow mb-5 text-primary">Indian markets · Decision intelligence</div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[62px] leading-[1.02] font-bold text-foreground max-w-3xl">
            Your market,<br />in one clear view.
          </h1>
          <p className="mt-6 max-w-xl text-[15px] text-muted-foreground leading-relaxed">
            Live NSE and BSE signals, sector outlooks, macro events and an auditable
            trade engine—structured for faster, better-informed decisions.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild variant="premium" size="default">
              <Link to="/agent">Open trade agent <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
            <Button asChild variant="outline" size="default">
              <Link to="/sectors">Explore sector ideas</Link>
            </Button>
          </div>
        </div>

        <aside className="m-3 mt-0 lg:mt-3 lg:ml-0 rounded-[1.5rem] bg-foreground text-background p-6 md:p-8 shadow-lg">
          <div className="flex items-center justify-between pb-5 border-b border-background/15">
            <div className="flex items-center gap-2">
              <Radio className={`h-3.5 w-3.5 ${toneColor(s.tone)}`} />
              <span className={`text-xs font-semibold ${toneColor(s.tone)}`}>{s.label}</span>
            </div>
            <span className="font-mono text-[11px] text-background/55">
              {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })} IST
            </span>
          </div>
          <div className="divide-y divide-background/15">
            <IndexRow label="NIFTY 50" q={quotes.get('^NSEI')} />
            <IndexRow label="SENSEX" q={quotes.get('^BSESN')} />
            <IndexRow label="BANK NIFTY" q={quotes.get('^NSEBANK')} />
            <IndexRow label="INDIA VIX" q={quotes.get('^INDIAVIX')} invert />
          </div>
          <Link to="/macro" className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-background/60 hover:text-background transition-colors">
            Global market context <ArrowRight className="h-3 w-3" />
          </Link>
        </aside>
      </div>
    </section>
  );
};

const IndexRow = ({ label, q, invert }: { label: string; q: any; invert?: boolean }) => {
  if (!q) {
    return (
      <div className="flex items-center justify-between py-4 text-[11px] font-medium">
        <span className="text-background/50">{label}</span>
        <span className="h-4 w-24 bg-background/10 animate-pulse rounded-full" />
      </div>
    );
  }
  const pos = q.changePercent >= 0;
  const good = invert ? !pos : pos;
  return (
    <div className="flex items-center justify-between py-4 text-[11px] font-medium">
      <span className="text-background/50">{label}</span>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-sm text-background normal-case tracking-normal">
          {q.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </span>
        <span className={`font-mono normal-case tracking-normal min-w-14 text-right ${good ? 'text-success' : 'text-destructive'}`}>
          {pos ? '+' : ''}{q.changePercent.toFixed(2)}%
        </span>
      </div>
    </div>
  );
};

export default MarketHero;
