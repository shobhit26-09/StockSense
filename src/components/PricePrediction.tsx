import React, { useMemo, useState } from 'react';
import { Activity, AlertTriangle, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Props { data: any; symbol: string; }
type Timeframe = '1week' | '1month' | '3months';

const PricePrediction: React.FC<Props> = ({ data, symbol }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1week');
  const history = useMemo(() => (data?.historicalData || []).filter((d: any) => Number.isFinite(d.close) && d.close > 0), [data]);
  const currentPrice = data?.info?.regularMarketPrice || data?.info?.currentPrice || history.at(-1)?.close || 0;
  const days = timeframe === '1week' ? 7 : timeframe === '1month' ? 30 : 90;

  const stats = useMemo(() => {
    const closes = history.slice(-126).map((d: any) => d.close as number);
    if (closes.length < 20 || !currentPrice) return null;
    const returns = closes.slice(1).map((v: number, i: number) => Math.log(v / closes[i]));
    const mean = returns.reduce((a: number, b: number) => a + b, 0) / returns.length;
    const variance = returns.reduce((a: number, r: number) => a + (r - mean) ** 2, 0) / Math.max(1, returns.length - 1);
    const dailyVol = Math.sqrt(variance);
    const drift = Math.max(-0.003, Math.min(0.003, mean));
    const points = Array.from({ length: days + 1 }, (_, i) => {
      const date = new Date(); date.setDate(date.getDate() + i);
      const projected = currentPrice * Math.exp(drift * i);
      const band = 1.645 * dailyVol * Math.sqrt(i);
      return { date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), projected, upper: projected * Math.exp(band), lower: projected * Math.exp(-band) };
    });
    const last = points.at(-1)!;
    return { points, drift, dailyVol, last, move: ((last.projected - currentPrice) / currentPrice) * 100 };
  }, [history, currentPrice, days]);

  if (!stats) return <div className="p-8 text-center"><AlertTriangle className="mx-auto mb-3 h-6 w-6 text-warning" /><h2 className="font-semibold">Historical scenario unavailable</h2><p className="mt-2 text-sm text-muted-foreground">At least 20 real closing prices are needed for a statistical range.</p></div>;
  const rising = stats.move >= 0;
  return <div className="space-y-6 p-6">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/40 pb-4"><div><div className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /><h2 className="font-semibold">Historical range scenario</h2></div><p className="mt-1 text-xs text-muted-foreground">Calculated from up to 126 real daily closes for {symbol.replace('.NS','')}. This is not a price prediction.</p></div><div className="flex gap-1">{(['1week','1month','3months'] as const).map(p => <Button key={p} size="sm" variant={timeframe === p ? 'default' : 'outline'} onClick={() => setTimeframe(p)}>{p === '1week' ? '1W' : p === '1month' ? '1M' : '3M'}</Button>)}</div></div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Metric label="Current" value={`₹${currentPrice.toFixed(2)}`} /><Metric label="Trend scenario" value={`₹${stats.last.projected.toFixed(2)}`} tone={rising ? 'up' : 'down'} /><Metric label="90% low" value={`₹${stats.last.lower.toFixed(2)}`} /><Metric label="90% high" value={`₹${stats.last.upper.toFixed(2)}`} /></div>
    <div className="h-[330px] rounded-xl border border-border/50 p-3"><ResponsiveContainer width="100%" height="100%"><AreaChart data={stats.points}><defs><linearGradient id="scenarioFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.28}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.03}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={28}/><YAxis domain={['auto','auto']} tick={{ fontSize: 10 }} width={65}/><Tooltip formatter={(v: number) => `₹${v.toFixed(2)}`} /><Area type="monotone" dataKey="upper" stroke="hsl(var(--primary))" fill="url(#scenarioFill)" /><Area type="monotone" dataKey="projected" stroke="hsl(var(--foreground))" fill="none" strokeWidth={2}/><Area type="monotone" dataKey="lower" stroke="hsl(var(--primary))" fill="none" /></AreaChart></ResponsiveContainer></div>
    <div className="rounded-lg border border-warning/20 bg-warning/5 px-4 py-3 text-xs text-muted-foreground"><AlertTriangle className="mr-2 inline h-3.5 w-3.5 text-warning" />The centre line extends the recent average log return; the band uses observed daily volatility. Markets can move outside it.</div>
  </div>;
};

const Metric = ({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) => <div className="rounded-lg border border-border/50 bg-card/40 p-4"><div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground"><span>{label}</span>{tone === 'up' ? <TrendingUp className="h-3.5 w-3.5 text-success" /> : tone === 'down' ? <TrendingDown className="h-3.5 w-3.5 text-destructive" /> : <Target className="h-3.5 w-3.5" />}</div><div className="font-mono text-lg font-bold">{value}</div></div>;
export default PricePrediction;
