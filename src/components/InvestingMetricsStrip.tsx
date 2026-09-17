import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Target, BarChart2, DollarSign, Percent } from 'lucide-react';
import { fetchMultipleQuotesRacing } from '@/services/multiSourceDataService';

interface MetricItem {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  icon: React.ReactNode;
}

const InvestingMetricsStrip = () => {
  const [metrics, setMetrics] = useState<MetricItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const results = await fetchMultipleQuotesRacing(['^NSEI', '^INDIAVIX', '^NSEBANK'], 8000);
      const nifty = results.get('^NSEI');
      const vix   = results.get('^INDIAVIX');
      const bank  = results.get('^NSEBANK');

      const m: MetricItem[] = [
        {
          label: 'NIFTY 50',
          value: nifty ? `₹${nifty.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—',
          sub: nifty ? `${nifty.changePercent >= 0 ? '+' : ''}${nifty.changePercent.toFixed(2)}%` : '',
          positive: nifty ? nifty.changePercent >= 0 : undefined,
          icon: <BarChart2 className="w-4 h-4" />,
        },
        {
          label: 'Bank NIFTY',
          value: bank ? `₹${bank.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—',
          sub: bank ? `${bank.changePercent >= 0 ? '+' : ''}${bank.changePercent.toFixed(2)}%` : '',
          positive: bank ? bank.changePercent >= 0 : undefined,
          icon: <DollarSign className="w-4 h-4" />,
        },
        {
          label: 'India VIX',
          value: vix ? vix.price.toFixed(2) : '—',
          sub: vix
            ? vix.price < 15 ? 'Low Volatility' : vix.price < 20 ? 'Moderate' : 'High Volatility'
            : '',
          positive: vix ? vix.price < 15 : undefined,
          icon: <Target className="w-4 h-4" />,
        },
        {
          label: 'Advance/Decline',
          value: '—',
          sub: 'Breadth indicator',
          icon: <TrendingUp className="w-4 h-4" />,
        },
        {
          label: 'FII Activity',
          value: '—',
          sub: 'Net buying/selling',
          icon: <Percent className="w-4 h-4" />,
        },
      ];
      setMetrics(m);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="premium-card p-4 h-16 animate-pulse bg-muted/10" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {metrics.map((m) => (
        <div key={m.label} className="premium-card p-4 flex items-center gap-3">
          <span className="text-muted-foreground/60">{m.icon}</span>
          <div className="min-w-0">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{m.label}</div>
            <div className="text-sm font-mono font-semibold text-foreground">{m.value}</div>
            {m.sub && (
              <div className={`text-[10px] font-mono ${
                m.positive === true ? 'text-success' : m.positive === false ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                {m.sub}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default InvestingMetricsStrip;
