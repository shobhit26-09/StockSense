import { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { fetchMultipleQuotesRacing } from '@/services/multiSourceDataService';

interface IndexData {
  name: string;
  symbol: string;
  displayName: string;
  change: number;
  value?: number;
}

const indices = [
  { name: 'NIFTY 50', symbol: '^NSEI', displayName: 'NIFTY 50' },
  { name: 'SENSEX', symbol: '^BSESN', displayName: 'SENSEX' },
  { name: 'NIFTY Bank', symbol: '^NSEBANK', displayName: 'BANK NIFTY' },
  { name: 'NIFTY IT', symbol: '^CNXIT', displayName: 'NIFTY IT' },
  { name: 'NIFTY Midcap', symbol: '^NSEMDCP50', displayName: 'MIDCAP 50' },
  { name: 'NIFTY Pharma', symbol: 'NIFTYPHARMA.NS', displayName: 'PHARMA' },
  { name: 'NIFTY Auto', symbol: 'NIFTYAUTO.NS', displayName: 'AUTO' },
  { name: 'NIFTY FMCG', symbol: 'NIFTYFMCG.NS', displayName: 'FMCG' },
  { name: 'NIFTY Metal', symbol: 'NIFTYMETAL.NS', displayName: 'METAL' },
  { name: 'NIFTY Realty', symbol: 'NIFTYREALTY.NS', displayName: 'REALTY' },
  { name: 'NIFTY Energy', symbol: 'NIFTYENERGY.NS', displayName: 'ENERGY' },
  { name: 'NIFTY Smallcap', symbol: '^NSEI', displayName: 'SMALLCAP' },
];

let cachedData: IndexData[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 20000;

const IndicesHeatmap = () => {
  const [indexData, setIndexData] = useState<IndexData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchIndexData = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cachedData && now - lastFetchTime < CACHE_DURATION) {
      setIndexData(cachedData);
      setIsLoading(false);
      return;
    }
    const symbols = indices.map(s => s.symbol);
    const results = await fetchMultipleQuotesRacing(symbols, 5000);
    const processed: IndexData[] = indices.map((index) => {
      const quote = results.get(index.symbol);
      if (quote && quote.price > 0) {
        return { name: index.displayName, symbol: index.symbol, displayName: index.displayName, change: quote.changePercent, value: quote.price };
      }
      const cached = cachedData?.find(s => s.symbol === index.symbol);
      return cached || { name: index.displayName, symbol: index.symbol, displayName: index.displayName, change: 0 };
    });
    cachedData = processed;
    lastFetchTime = now;
    setIndexData(processed);
    setLastUpdate(new Date());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchIndexData();
    const t = setInterval(() => fetchIndexData(), 20000);
    return () => clearInterval(t);
  }, [fetchIndexData]);

  const getTileStyle = (change: number) => {
    const intensity = Math.min(Math.abs(change) / 2.5, 1);
    if (change >= 0) {
      return {
        background: `rgba(34,197,94,${0.06 + intensity * 0.18})`,
        borderColor: `rgba(34,197,94,${0.15 + intensity * 0.25})`,
        valueClass: 'text-success',
      };
    }
    return {
      background: `rgba(239,68,68,${0.06 + intensity * 0.18})`,
      borderColor: `rgba(239,68,68,${0.15 + intensity * 0.25})`,
      valueClass: 'text-destructive',
    };
  };

  if (isLoading && indexData.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Sector Overview</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/10 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Sector Overview</h2>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-success/10 rounded-full">
            <div className="w-1.5 h-1.5 bg-success rounded-full live-indicator" />
            <span className="text-[10px] font-medium text-success">Live</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-[10px] font-mono text-muted-foreground hidden sm:block">
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchIndexData(true)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {indexData.map((index) => {
          const s = getTileStyle(index.change);
          const pos = index.change >= 0;
          return (
            <div
              key={index.symbol + index.displayName}
              className="rounded-lg p-3 border transition-colors cursor-default"
              style={{ background: s.background, borderColor: s.borderColor }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-foreground/70 truncate leading-tight">
                  {index.name}
                </span>
                {pos
                  ? <TrendingUp className={`w-3 h-3 ${s.valueClass} flex-shrink-0`} />
                  : <TrendingDown className={`w-3 h-3 ${s.valueClass} flex-shrink-0`} />
                }
              </div>
              {index.value && (
                <div className="text-xs font-mono font-semibold text-foreground mb-0.5">
                  {index.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              )}
              <div className={`text-sm font-mono font-bold ${s.valueClass}`}>
                {pos ? '+' : ''}{index.change.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IndicesHeatmap;
