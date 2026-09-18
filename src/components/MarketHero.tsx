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
    <section className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card/60">
      <div aria-hidden className="hero-ambient-v2 pointer-events-none absolute inset-0" />
      <div aria-hidden className="hero-grid pointer-events-none absolute inset-0" />

      <div className="relative grid lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="p-7 py-12 md:p-12 lg:p-16">
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-border bg-background/60 px-3.5 py-1.5 backdrop-blur">
            <span className={`h-1.5 w-1.5 rounded-full ${s.tone === 'success' ? 'bg-success live-indicator' : s.tone === 'warning' ? 'bg-warning' : 'bg-muted-foreground/60'}`} />
            <span className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${toneColor(s.tone)}`}>{s.label}</span>
            <span className="h-3 w-px bg-border" />
            <span className="font-mono text-[11px] text-muted-foreground">
              {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })} IST
            </span>
          </div>

          <h1 className="font-display max-w-2xl text-[42px] leading-[1.0] font-bold tracking-[-0.03em] text-foreground sm:text-6xl lg:text-[72px]">
            Your market,<br />
            in <span className="text-accent-gradient">one clear view.</span>
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Live NSE and BSE signals, sector outlooks, macro events and an auditable
            trade engine—structured for faster, better-informed decisions.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild variant="premium" size="default" className="rounded-full">
              <Link to="/agent">Open trade agent <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
            <Button asChild variant="outline" size="default" className="rounded-full">
              <Link to="/sectors">Explore sector ideas</Link>
            </Button>
          </div>
        </div>

        <aside className="terminal-shell relative m-3 mt-0 rounded-3xl p-6 md:p-7 lg:m-4 lg:ml-0">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Radio className={`h-3.5 w-3.5 ${toneColor(s.tone)}`} />
              <span className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${toneColor(s.tone)}`}>{s.label}</span>
            </div>
            <span className="font-mono text-[11px] text-white/45">
              {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} IST
            </span>
          </div>

          <div className="divide-y divide-white/[0.07]">
            <IndexRow label="NIFTY 50" q={quotes.get('^NSEI')} />
            <IndexRow label="SENSEX" q={quotes.get('^BSESN')} />
            <IndexRow label="BANK NIFTY" q={quotes.get('^NSEBANK')} />
            <IndexRow label="INDIA VIX" q={quotes.get('^INDIAVIX')} invert />
          </div>

          <Link to="/macro" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 transition-colors hover:text-white">
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
      <div className="flex items-center justify-between py-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">{label}</span>
        <span className="shimmer h-4 w-28 rounded-full" />
      </div>
    );
  }
  const pos = q.changePercent >= 0;
  const good = invert ? !pos : pos;
  const barWidth = Math.min(100, Math.abs(q.changePercent) * 60);
  return (
    <div className="py-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">{label}</span>
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[15px] text-white">
            {q.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
          <span className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] font-medium ${good ? 'status-positive' : 'status-negative'}`}>
            {pos ? '+' : ''}{q.changePercent.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full transition-all duration-700 ${good ? 'bg-success' : 'bg-destructive'}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
};

export default MarketHero;
