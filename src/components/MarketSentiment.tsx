import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { loadSentiment } from '@/services/sentimentFeeds';
import { WEIGHTS, SIGNAL_LABELS, type HeadlineSignal, type SentimentLabel, type SentimentResult, type SignalKey } from '@/services/sentimentService';

const tone = (score: number | null) => score === null ? 'text-muted-foreground' : score >= 56 ? 'text-success' : score <= 44 ? 'text-destructive' : 'text-warning';
const barColor = (score: number) => score >= 56 ? 'bg-success' : score <= 44 ? 'bg-destructive' : 'bg-warning';
const BLURB: Record<SentimentLabel, string> = {
  Bullish: 'Most signals point the same way, up.', Constructive: 'More signals lean positive than negative.', Neutral: 'Signals are balanced. No clear lean.',
  Cautious: 'More signals lean negative than positive.', Bearish: 'Most signals point the same way, down.', Unavailable: 'Not enough live data to score the market.',
};

/** Half-circle gauge. Arc is a red-to-green gradient, the needle sits at the score. */
const Gauge = ({ score }: { score: number | null }) => {
  const r = 92, cx = 110, cy = 108;
  const a = Math.PI * (1 - (score ?? 50) / 100);
  const nx = cx + (r - 14) * Math.cos(a), ny = cy - (r - 14) * Math.sin(a);
  const ticks = [0, 30, 44, 56, 70, 100];
  return (
    <svg viewBox="0 0 220 132" className="w-full max-w-[280px]" role="img" aria-label={score === null ? 'Sentiment unavailable' : `Sentiment score ${score} out of 100`}>
      <defs>
        <linearGradient id="sg" x1="0" x2="1"><stop offset="0" stopColor="hsl(var(--destructive))" /><stop offset="0.5" stopColor="hsl(var(--warning))" /><stop offset="1" stopColor="hsl(var(--success))" /></linearGradient>
      </defs>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="hsl(var(--muted))" strokeWidth="14" strokeLinecap="round" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="url(#sg)" strokeWidth="14" strokeLinecap="round" opacity={score === null ? 0.2 : 1} />
      {ticks.map(t => { const ta = Math.PI * (1 - t / 100); return <line key={t} x1={cx + (r - 22) * Math.cos(ta)} y1={cy - (r - 22) * Math.sin(ta)} x2={cx + (r - 28) * Math.cos(ta)} y2={cy - (r - 28) * Math.sin(ta)} stroke="hsl(var(--muted-foreground))" strokeOpacity="0.5" strokeWidth="1" />; })}
      {score !== null && <><line x1={cx} y1={cy} x2={nx} y2={ny} stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round" style={{ transition: 'all .6s cubic-bezier(.2,.8,.2,1)' }} /><circle cx={cx} cy={cy} r="6" fill="hsl(var(--foreground))" /></>}
      <text x={cx - r} y={cy + 18} textAnchor="middle" className="fill-muted-foreground" fontSize="9">Bearish</text>
      <text x={cx + r} y={cy + 18} textAnchor="middle" className="fill-muted-foreground" fontSize="9">Bullish</text>
    </svg>
  );
};

const age = (h: number) => h < 1 ? `${Math.max(1, Math.round(h * 60))}m` : h < 24 ? `${Math.round(h)}h` : `${Math.round(h / 24)}d`;
const Dot = ({ t }: { t: HeadlineSignal['tone'] }) => <span className={`inline-block h-2 w-2 rounded-full ${t === 'positive' ? 'bg-success' : t === 'negative' ? 'bg-destructive' : 'bg-muted-foreground/40'}`} aria-hidden="true" />;

const MarketSentiment = () => {
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    setRefreshing(true);
    try { setResult(await loadSentiment()); } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => {
    void load();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 120_000);
    return () => clearInterval(timer);
  }, [load]);
  const score = result?.score ?? null;
  const rows = (Object.keys(WEIGHTS) as SignalKey[]).map(k => ({ key: k, signal: result?.signals.find(s => s.key === k) ?? null }));
  const heads = result?.headlines.filter(h => h.matched.length).slice(0, 6) ?? [];

  return <section className="overflow-hidden rounded-[1.6rem] border border-border bg-card/70" aria-labelledby="sentiment-title">
    <div className="relative border-b border-border/70 p-5 md:p-7">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-70" style={{ background: 'radial-gradient(60% 120% at 12% 0%, hsl(var(--success) / 0.10), transparent 60%), radial-gradient(50% 100% at 95% 100%, hsl(var(--destructive) / 0.08), transparent 60%)' }} />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div><div className="section-eyebrow">Market pulse / India</div><h2 id="sentiment-title" className="font-display mt-1 text-2xl font-semibold tracking-tight">Market sentiment</h2><p className="mt-1 text-[13px] text-muted-foreground">Six live signals, one score. Every number below comes from a public feed.</p></div>
        <button type="button" onClick={() => void load()} disabled={refreshing} aria-label="Refresh market sentiment" className="flex items-center gap-1.5 rounded-lg border border-border bg-background/50 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh</button>
      </div>
      <div className="relative mt-6 grid items-center gap-6 md:grid-cols-[minmax(240px,300px)_1fr]">
        <div className="flex flex-col items-center">
          <Gauge score={score} />
          <div className={`mt-3 font-mono text-5xl font-semibold tabular-nums tracking-tighter ${tone(score)}`}>{loading ? '··' : score ?? '—'}</div>
          <div className="mt-1 text-base font-semibold">{loading ? 'Loading' : result?.label}</div>
        </div>
        <div className="space-y-3">
          <p className="text-[15px] leading-snug">{loading ? 'Reading the market…' : BLURB[result?.label ?? 'Unavailable']}</p>
          {result && (result.topDriver || result.topDrag) && <div className="flex flex-wrap gap-2 text-[12px]">
            {result.topDriver && <span className="rounded-full bg-success/10 px-3 py-1 text-success">Biggest lift: {result.topDriver.label}</span>}
            {result.topDrag && <span className="rounded-full bg-destructive/10 px-3 py-1 text-destructive">Biggest drag: {result.topDrag.label}</span>}
          </div>}
          {result && <p className="text-[11px] text-muted-foreground">{result.signals.length} of 6 signals live{result.missing.length ? ` (unavailable: ${result.missing.map(m => m.label).join(', ')}; weights rebalanced)` : ''} · Updated {new Date(result.updatedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} IST</p>}
        </div>
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-[12.5px]">
        <thead><tr className="border-b border-border/70 text-[10.5px] uppercase tracking-wider text-muted-foreground"><th className="px-5 py-2.5 font-medium md:px-7">Signal</th><th className="py-2.5 pr-4 font-medium">Reading</th><th className="w-40 py-2.5 pr-4 font-medium">Score</th><th className="px-5 py-2.5 text-right font-medium md:px-7">Weight</th></tr></thead>
        <tbody>
          {rows.map(({ key, signal }) => <tr key={key} className="border-b border-border/50 last:border-0">
            <td className="px-5 py-3 font-medium md:px-7">{SIGNAL_LABELS[key]}</td>
            <td className="py-3 pr-4 text-muted-foreground" title={signal?.source}>{loading ? '…' : signal ? signal.reading : 'No live data right now'}</td>
            <td className="py-3 pr-4"><div className="flex items-center gap-2"><span className={`w-7 font-mono tabular-nums ${signal ? tone(signal.score) : 'text-muted-foreground'}`}>{signal ? signal.score : '—'}</span><span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><span className="absolute inset-y-0 left-1/2 w-px bg-foreground/25" />{signal && <span className={`absolute inset-y-0 rounded-full ${barColor(signal.score)}`} style={signal.score >= 50 ? { left: '50%', width: `${signal.score - 50}%` } : { right: '50%', width: `${50 - signal.score}%` }} />}</span></div></td>
            <td className="px-5 py-3 text-right font-mono tabular-nums text-muted-foreground md:px-7">{Math.round(WEIGHTS[key] * 100)}%</td>
          </tr>)}
        </tbody>
      </table>
    </div>

    {heads.length > 0 && <div className="border-t border-border/70 p-5 md:p-7">
      <p className="section-eyebrow mb-3">Headlines driving the news score</p>
      <ul className="divide-y divide-border/50">
        {heads.map(h => <li key={h.url}><a href={h.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 py-2.5"><span className="mt-1.5"><Dot t={h.tone} /></span><span className="min-w-0 flex-1"><span className="line-clamp-2 text-[13px] font-medium leading-snug group-hover:underline">{h.title}</span><span className="mt-0.5 block text-[10.5px] text-muted-foreground">{h.source} · {age(h.ageHours)} ago · {h.matched.slice(0, 3).join(', ')}</span></span><ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" /></a></li>)}
      </ul>
    </div>}

    <p className="border-t border-border/70 px-5 py-4 text-[10.5px] leading-relaxed text-muted-foreground md:px-7">A 0-100 read where 50 is neutral. Breadth is weighted by index weight; trend uses NIFTY against its 20 and 50-day averages; low volatility scores higher; flows blend FII and DII 5-day net buying; global cues cover the S&amp;P 500, Nikkei, Hang Seng, Brent and USD/INR; news uses a finance word list with negation and recency decay. Free feeds can be delayed. Context, not a forecast or investment advice.</p>
  </section>;
};
export default MarketSentiment;
