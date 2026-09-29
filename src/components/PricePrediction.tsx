import { useEffect, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, Info, RefreshCw } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchHistory, type HistorySeries } from '@/services/historyService';
import { computePriceSignals, type PriceSignal } from '@/services/priceSignals';
import { trainForecast, type ForecastResult } from '@/services/mlForecast';

interface Props { symbol: string; data?: unknown }
const money = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
const date = (t: number) => new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
const Metric = ({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: 'up' | 'down' }) => <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
  <p className={`mt-2 font-mono text-xl font-semibold tabular-nums ${tone === 'up' ? 'text-success' : tone === 'down' ? 'text-destructive' : ''}`}>{value}</p>
  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{sub}</p>
</div>;
const PricePrediction = ({ symbol }: Props) => {
  const [series, setSeries] = useState<HistorySeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [signal, setSignal] = useState<PriceSignal | null>(null);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setSeries(null);
    setForecast(null);
    setSignal(null);
    fetchHistory(symbol, '1y').then(s => { if (active) { setSeries(s); setSignal(computePriceSignals(s)); setForecast(trainForecast(s)); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [symbol, reload]);
  return <div className="p-5 md:p-7">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-5">
      <div><span className="section-eyebrow">Price context / {symbol.replace(/\.(NS|BO)$/i, '')}</span><h2 className="font-display mt-1 text-2xl font-semibold tracking-tight">ML prediction</h2><p className="mt-1 text-[13px] text-muted-foreground">A trained one-session model, with measured holdout error. Estimates, not promises.</p></div>
      <button type="button" onClick={() => setReload(n => n + 1)} disabled={loading} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50" aria-label="Refresh price signals"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
    </div>
    {loading ? <div className="py-20 text-center text-sm text-muted-foreground">Training on actual daily prices…</div> : !signal ? <div className="flex flex-col items-center py-16 text-center"><Info className="mb-3 h-6 w-6 text-muted-foreground" /><h3 className="font-semibold">ML prediction unavailable</h3><p className="mt-2 max-w-md text-sm text-muted-foreground">{series?.source === 'sample' ? 'Only sample history is available. We do not train on simulated prices.' : 'At least 51 recent real daily closes are needed. Try again when the free price feed is available.'}</p></div> : <>
      {forecast ? <section className="mt-6 rounded-2xl border border-border/70 bg-background/50 p-4 md:p-5" aria-labelledby="ml-title">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="section-eyebrow">Trained here / no pretrained weights</div><h3 id="ml-title" className="font-display mt-1 text-xl font-semibold">{forecast.availableFor} estimate</h3><p className="mt-1 text-xs text-muted-foreground">Ridge regression on trailing 1-, 5-, 20-session log returns and 10-session volatility. Target: next completed daily close after the last training input.</p></div><span className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground">Model: standardized ridge · λ=30</span></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3"><Metric label="Model estimate" value={money(forecast.target)} sub={`${pct(forecast.predictedReturn)} vs last completed close · ${date(forecast.asOf)}`} tone={forecast.predictedReturn >= 0 ? 'up' : 'down'} /><Metric label="Holdout residual range" value={`${money(forecast.lower)} – ${money(forecast.upper)}`} sub="10th–90th percentile of 30 held-out return errors · not a confidence guarantee" /><Metric label="Holdout error" value={`${forecast.holdoutMae.toFixed(2)}%`} sub={`Mean absolute % error · unchanged-price baseline ${forecast.baselineMae.toFixed(2)}%${forecast.holdoutMae >= forecast.baselineMae ? " · no measured edge" : " · small sample"}`} /></div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground"><span>Training rows: {forecast.trainCount}</span><span>Test: latest {forecast.testCount} out-of-sample sessions</span><span>Direction correct: {forecast.directionAccuracy.toFixed(0)}% on holdout</span>{forecast.provisionalExcluded && <span>Today's unfinished daily candle excluded</span>}</div>
        <p className="mt-4 border-t border-border/70 pt-3 text-[11px] leading-relaxed text-muted-foreground">A real fit to Yahoo daily closes, not an AI narrative. Forecast retrains in this browser on load. The holdout is chronological and uses only earlier data; the displayed model is refit on all complete sessions after testing. The range shows historical residual spread, not a guaranteed probability, and unusual events can exceed it. No extra news or macro inputs. A close match to the unchanged-price baseline is not evidence of predictive skill. This is not trading advice.</p>
      </section> : <div className="mt-6 rounded-2xl border border-border/70 bg-background/50 p-5"><h3 className="font-semibold">ML estimate unavailable</h3><p className="mt-1 text-xs text-muted-foreground">Needs at least 151 recent real daily closes. No forecast is made from sample, stale, or incomplete history.</p></div>}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
        <div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${signal.state === 'Above trend' ? 'bg-success/10 text-success' : signal.state === 'Below trend' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>{signal.state === 'Above trend' ? <ArrowUpRight className="h-5 w-5" /> : signal.state === 'Below trend' ? <ArrowDownRight className="h-5 w-5" /> : <Activity className="h-5 w-5" />}</span><div><p className="font-semibold">{signal.state}</p><p className="text-xs text-muted-foreground">Latest close vs 20- and 50-session averages</p></div></div>
        <span className="text-xs text-muted-foreground">Yahoo Finance · close {date(signal.asOf)} · {signal.closes} sessions</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Latest close" value={money(signal.price)} sub={`Closing price · ${date(signal.asOf)}`} />
        <Metric label="20-session return" value={pct(signal.return20)} sub="Change vs 20 trading sessions ago" tone={signal.return20 >= 0 ? 'up' : 'down'} />
        <Metric label="20-session range" value={`${money(signal.low20)} – ${money(signal.high20)}`} sub="Observed closing-price low to high" />
        <Metric label="Realized volatility" value={`${signal.volatility20.toFixed(1)}%`} sub="20-session daily log returns · annualized" />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(240px,0.8fr)]">
        <div className="min-w-0 rounded-2xl border border-border/70 bg-background/40 p-4"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-sm font-semibold">Price vs 20-session average</h3><span className="text-[11px] text-muted-foreground">Up to 6 months · daily closes</span></div><div className="mt-4 h-[250px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={signal.points} margin={{ top: 5, right: 4, left: -12, bottom: 0 }}><CartesianGrid strokeDasharray="3 5" stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="t" type="number" domain={['dataMin','dataMax']} tickFormatter={date} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} minTickGap={45} /><YAxis domain={['auto','auto']} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={n => `₹${Math.round(n)}`} width={66} /><Tooltip labelFormatter={v => date(Number(v))} formatter={(v: number, key: string) => [money(v), key === 'close' ? 'Close' : '20-session average']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} /><Line type="monotone" dataKey="close" stroke="hsl(var(--foreground))" dot={false} strokeWidth={2} isAnimationActive={false} /><Line type="monotone" dataKey="average" stroke="hsl(var(--success))" dot={false} strokeWidth={1.5} strokeDasharray="5 4" connectNulls={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></div><div className="mt-3 flex items-center gap-5 text-[11px] text-muted-foreground"><span><span className="mr-1.5 inline-block h-0.5 w-4 bg-foreground align-middle" />Close</span><span><span className="mr-1.5 inline-block h-0.5 w-4 bg-success align-middle" />20-session average</span></div></div>
        <div className="rounded-2xl border border-border/70 bg-background/40 p-4"><h3 className="text-sm font-semibold">Trend levels</h3><div className="mt-3 divide-y divide-border/60 text-[12px]"><div className="flex justify-between gap-2 py-3"><span className="text-muted-foreground">20-session average</span><span className="font-mono tabular-nums">{money(signal.sma20)}</span></div><div className="flex justify-between gap-2 py-3"><span className="text-muted-foreground">50-session average</span><span className="font-mono tabular-nums">{money(signal.sma50)}</span></div><div className="flex justify-between gap-2 py-3"><span className="text-muted-foreground">200-session average</span><span className="font-mono tabular-nums">{signal.sma200 ? money(signal.sma200) : 'Not enough data'}</span></div><div className="flex justify-between gap-2 py-3"><span className="text-muted-foreground">Vs 20-session average</span><span className={`font-mono tabular-nums ${signal.distance20 >= 0 ? 'text-success' : 'text-destructive'}`}>{pct(signal.distance20)}</span></div><div className="flex justify-between gap-2 py-3"><span className="text-muted-foreground">60-session return</span><span className="font-mono tabular-nums">{signal.return60 === null ? 'Not enough data' : pct(signal.return60)}</span></div></div></div>
      </div>
      <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">Source: Yahoo Finance daily closes through StockSense's free feed. Averages and ranges use trading sessions, not calendar days. Volatility measures past variation, not a probability band. Prices can be delayed or revised; compare with the exchange before acting. The ML estimate above is a statistical output, not a buy/sell call. Simulated fallback is never used for it.</p>

    </>}
  </div>;
};
export default PricePrediction;
