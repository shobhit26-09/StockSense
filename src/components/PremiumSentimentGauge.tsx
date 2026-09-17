import { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MarketMoodData {
  mmi: number;
  label: string;
  zone: 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';
  recommendation: string;
  action: string;
  source: string;
  lastUpdated: Date;
}

let cachedMMIData: MarketMoodData | null = null;
let lastMMIFetch = 0;
const MMI_CACHE_DURATION = 300000;

const ZONE_CONFIG = {
  extreme_fear: {
    label: 'Extreme Fear',
    recommendation: 'Strong buying opportunity — market oversold',
    action: 'Accumulate',
    color: 'text-destructive',
    bg: 'bg-destructive/8',
  },
  fear: {
    label: 'Fear',
    recommendation: 'Consider adding quality positions gradually',
    action: 'Consider Buying',
    color: 'text-orange-400',
    bg: 'bg-orange-500/8',
  },
  neutral: {
    label: 'Neutral',
    recommendation: 'Hold existing positions, stay watchful',
    action: 'Hold',
    color: 'text-warning',
    bg: 'bg-warning/8',
  },
  greed: {
    label: 'Greed',
    recommendation: 'Take partial profits, reduce risk exposure',
    action: 'Trim Positions',
    color: 'text-success',
    bg: 'bg-success/8',
  },
  extreme_greed: {
    label: 'Extreme Greed',
    recommendation: 'Market overheated — protect capital',
    action: 'Sell & Protect',
    color: 'text-primary',
    bg: 'bg-primary/8',
  },
};

const PremiumSentimentGauge = () => {
  const [data, setData] = useState<MarketMoodData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMMI = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cachedMMIData && now - lastMMIFetch < MMI_CACHE_DURATION) {
      setData(cachedMMIData);
      setIsLoading(false);
      return;
    }
    setIsRefreshing(true);
    try {
      const { data: mmiData, error } = await supabase.functions.invoke('fetch-market-data', {
        body: { type: 'mmi' },
      });
      if (error) throw error;
      if (mmiData) {
        const zone = mmiData.zone as MarketMoodData['zone'];
        const cfg = ZONE_CONFIG[zone] || ZONE_CONFIG.neutral;
        const result: MarketMoodData = {
          mmi: mmiData.mmi,
          label: cfg.label,
          zone,
          recommendation: cfg.recommendation,
          action: cfg.action,
          source: mmiData.source,
          lastUpdated: new Date(mmiData.timestamp || Date.now()),
        };
        cachedMMIData = result;
        lastMMIFetch = now;
        setData(result);
      }
    } catch {
      if (!cachedMMIData) {
        const fallback = generateFallback();
        setData(fallback);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const generateFallback = (): MarketMoodData => {
    const mmi = 52;
    const zone: MarketMoodData['zone'] = 'neutral';
    const cfg = ZONE_CONFIG[zone];
    return { mmi, label: cfg.label, zone, recommendation: cfg.recommendation, action: cfg.action, source: 'Estimated', lastUpdated: new Date() };
  };

  useEffect(() => {
    fetchMMI();
    const interval = setInterval(() => fetchMMI(), 300000);
    return () => clearInterval(interval);
  }, [fetchMMI]);

  if (isLoading && !data) {
    return (
      <div className="premium-card p-5 h-full flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Market Mood</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const cfg = ZONE_CONFIG[data.zone];
  // Gauge needle position 0–100 → left %
  const needlePos = Math.min(Math.max(data.mmi, 3), 97);

  return (
    <div className="premium-card p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Market Mood</h3>
        </div>
        <button
          onClick={() => fetchMMI(true)}
          disabled={isRefreshing}
          className="p-1.5 hover:bg-muted/50 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Score */}
      <div className="flex items-baseline gap-3 mb-1">
        <span className={`text-5xl font-mono font-bold ${cfg.color}`}>
          {data.mmi.toFixed(0)}
        </span>
        <span className={`text-sm font-semibold ${cfg.color}`}>{data.label}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{data.recommendation}</p>

      {/* Gauge bar */}
      <div className="relative mb-1">
        <div className="h-2 rounded-full overflow-hidden" style={{
          background: 'linear-gradient(to right, hsl(var(--destructive)), hsl(var(--warning)), hsl(var(--success)))'
        }}>
        </div>
        {/* Needle */}
        <div
          className="absolute -top-1 w-0.5 h-4 bg-foreground rounded-full shadow transition-all duration-700 ease-out"
          style={{ left: `calc(${needlePos}% - 1px)` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground/60 mb-5">
        <span>Fear</span>
        <span>Neutral</span>
        <span>Greed</span>
      </div>

      {/* Zones reference */}
      <div className="space-y-1.5 mb-5">
        {(Object.entries(ZONE_CONFIG) as [MarketMoodData['zone'], typeof ZONE_CONFIG.neutral][]).map(([zone, config]) => (
          <div key={zone} className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
            data.zone === zone ? `${config.bg} border border-current/10` : 'opacity-40'
          }`}>
            <span className={`text-xs font-medium ${data.zone === zone ? config.color : 'text-muted-foreground'}`}>
              {config.label}
            </span>
            <span className={`text-[10px] font-mono ${data.zone === zone ? config.color : 'text-muted-foreground'}`}>
              {config.action}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">Source: {data.source}</span>
        <a
          href="https://stocker.co.in/market-mood-index"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
        >
          Details <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
};

export default PremiumSentimentGauge;
