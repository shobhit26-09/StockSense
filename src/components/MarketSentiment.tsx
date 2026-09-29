import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { fetchMultipleQuotesRacing } from '@/services/multiSourceDataService';
import { supabase } from '@/integrations/supabase/client';
import { calculateSentiment, type HeadlineSignal, type SentimentComponent, type SentimentHeadline, type SentimentResult } from '@/services/sentimentService';
import { MARKET_CONSTITUENTS } from '@/data/marketConstituents';

const symbols = MARKET_CONSTITUENTS.map(c => c.symbol);
const toneClass = (tone: string) => tone === 'positive' ? 'text-success' : tone === 'negative' ? 'text-destructive' : 'text-muted-foreground';

const Evidence = ({ title, subtitle, data }: { title: string; subtitle: string; data: SentimentComponent | null }) => (
  <div className="rounded-2xl border border-border/70 bg-background/45 p-4">
    <div className="flex items-baseline justify-between gap-2"><h3 className="text-sm font-semibold">{title}</h3><span className="font-mono text-lg font-semibold tabular-nums">{data ? data.score : '—'}</span></div>
    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{subtitle}</p>
    {data ? <div className="mt-3 flex gap-3 text-[11px] font-mono tabular-nums"><span className="text-success">{data.positive} up</span><span className="text-destructive">{data.negative} down</span><span className="text-muted-foreground">{data.neutral} mixed</span></div> : <p className="mt-3 text-[11px] text-muted-foreground">Insufficient live data</p>}
    <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
      {data && <><span className="bg-success" style={{ width: `${100 * data.positive / data.count}%` }} /><span className="bg-muted-foreground/40" style={{ width: `${100 * data.neutral / data.count}%` }} /><span className="bg-destructive" style={{ width: `${100 * data.negative / data.count}%` }} /></>}
    </div>
  </div>
);

const Headline = ({ item }: { item?: HeadlineSignal }) => item ? (
  <a href={item.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-2 rounded-xl border border-border/70 bg-background/45 px-3 py-2.5 transition-colors hover:border-foreground/30">
    <span className={`mt-1 text-xs ${toneClass(item.tone)}`} aria-hidden="true">●</span>
    <span className="min-w-0 flex-1"><span className="line-clamp-2 text-[12px] font-medium leading-snug group-hover:underline">{item.title}</span><span className="mt-1 block text-[10px] text-muted-foreground">{item.source} · {item.tone === 'neutral' ? 'Unclassified' : `${item.tone} cue`}</span></span>
    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
  </a>
) : <p className="text-xs text-muted-foreground">No recent sourced headline available.</p>;

const MarketSentiment = () => {
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    setRefreshing(true);
    const [quotes, news] = await Promise.allSettled([
      fetchMultipleQuotesRacing(symbols, 10000),
      supabase.functions.invoke('fetch-market-data', { body: { type: 'news' } }),
    ]);
    const quoteMap = quotes.status === 'fulfilled' ? quotes.value : new Map();
    const articles: SentimentHeadline[] = news.status === 'fulfilled' && !news.value.error && Array.isArray(news.value.data?.articles) ? news.value.data.articles : [];
    setResult(calculateSentiment(quoteMap, symbols, articles));
    setLoading(false);
    setRefreshing(false);
  }, []);
  useEffect(() => {
    void load();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 60_000);
    return () => clearInterval(timer);
  }, [load]);
  const score = result?.score;
  return <section className="overflow-hidden rounded-[1.6rem] border border-border bg-card/70 p-5 md:p-7" aria-labelledby="sentiment-title">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><div className="section-eyebrow">Market pulse / India</div><h2 id="sentiment-title" className="font-display mt-1 text-2xl font-semibold tracking-tight">Market sentiment</h2><p className="mt-1 text-[13px] text-muted-foreground">A read of breadth and recent headlines, not a forecast.</p></div>
      <button type="button" onClick={() => void load()} disabled={refreshing} aria-label="Refresh market sentiment" className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh</button>
    </div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(220px,0.72fr)_minmax(0,1.7fr)] lg:items-center">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border/70 bg-background/45 px-5 py-6 text-center">
        <span className="section-eyebrow">Composite / 100</span>
        <div className={`mt-2 font-mono text-6xl font-semibold tabular-nums tracking-tighter ${score === null || score === undefined ? 'text-muted-foreground' : toneClass(score >= 62 ? 'positive' : score <= 38 ? 'negative' : 'neutral')}`}>{loading ? '··' : score ?? '—'}</div>
        <span className="mt-1 text-sm font-semibold">{loading ? 'Loading' : result?.label || 'Unavailable'}</span>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-destructive via-muted-foreground/50 to-success"><span className="block h-full w-0.5 bg-foreground transition-all" style={{ marginLeft: `${score ?? 50}%` }} /></div>
        <span className="mt-3 text-[11px] text-muted-foreground">{result ? `Live quotes: ${result.coverage}/${result.total} · Updated ${new Date(result.updatedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} IST` : 'Fetching public feeds'}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Evidence title="Stock breadth" subtitle={`NIFTY 50 sample · ${result?.coverage ?? 0}/${symbols.length} quotes`} data={result?.breadth ?? null} />
        <Evidence title="Market news" subtitle="Headline words · last 48h" data={result?.news ?? null} />
        <Evidence title="Economic factors" subtitle="Macro headlines · last 48h" data={result?.macro ?? null} />
      </div>
    </div>
    <div className="mt-5 grid gap-4 border-t border-border/70 pt-5 md:grid-cols-2"><div><p className="section-eyebrow mb-2">In the news</p><Headline item={result?.headlines.find(h => h.tone !== 'neutral') || result?.headlines[0]} /></div><div><p className="section-eyebrow mb-2">Macro watch</p><Headline item={result?.macroHeadlines.find(h => h.tone !== 'neutral') || result?.macroHeadlines[0]} /></div></div>
    <p className="mt-5 text-[10.5px] leading-relaxed text-muted-foreground">Method: 60% equal-weighted moves in the available NIFTY sample, 25% market headlines, 15% macro headlines. Missing inputs are excluded and weights rebalanced. Headline direction uses simple word matches, not economic analysis. Yahoo quotes and publisher RSS may be delayed. Backup quotes never count toward breadth. Educational context, not investment advice.</p>
  </section>;
};
export default MarketSentiment;
