import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Wifi } from 'lucide-react';
import { fetchMultipleQuotesRacing, getSourceStats, type StockQuote } from '@/services/multiSourceDataService';

interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  source?: string;
}

// Cache for indices data
let cachedIndices: MarketIndex[] | null = null;
let lastIndicesUpdate = 0;
const INDICES_CACHE_DURATION = 15000; // 15 seconds

const indices = [
  { name: 'NIFTY 50', symbol: '^NSEI' },
  { name: 'BANK NIFTY', symbol: '^NSEBANK' },
  { name: 'NIFTY IT', symbol: '^CNXIT' },
];

const LiveMarketIndices = () => {
  const [indicesData, setIndicesData] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activeSource, setActiveSource] = useState<string>('—');

  const fetchRealTimeIndices = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Use cached data if available and not expired
    if (!force && cachedIndices && now - lastIndicesUpdate < INDICES_CACHE_DURATION) {
      setIndicesData(cachedIndices);
      setLoading(false);
      return;
    }

    const symbols = indices.map(i => i.symbol);
    const results = await fetchMultipleQuotesRacing(symbols, 4000);
    
    // Determine most used source
    const stats = getSourceStats();
    const bestSource = Object.entries(stats)
      .sort((a, b) => b[1].successCount - a[1].successCount)[0];
    setActiveSource(bestSource?.[0] || 'yahoo');

    const processedResults: MarketIndex[] = indices.map((index) => {
      const quote = results.get(index.symbol);
      if (quote && quote.price > 0) {
        return {
          name: index.name,
          symbol: index.symbol,
          value: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          source: quote.source
        };
      }
      // Fallback to cached
      const cached = cachedIndices?.find(i => i.symbol === index.symbol);
      return cached || { 
        name: index.name, 
        symbol: index.symbol, 
        value: 0, 
        change: 0, 
        changePercent: 0 
      };
    });
    
    cachedIndices = processedResults;
    lastIndicesUpdate = now;
    setIndicesData(processedResults);
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRealTimeIndices();
    const interval = setInterval(() => fetchRealTimeIndices(), 15000);
    return () => clearInterval(interval);
  }, [fetchRealTimeIndices]);

  if (loading && indicesData.length === 0) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-muted/30 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-success rounded-full live-indicator"></div>
          <span className="font-mono">{lastUpdate?.toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Wifi className="w-2.5 h-2.5" />
            <span className="capitalize">{activeSource}</span>
          </div>
          <button 
            onClick={() => fetchRealTimeIndices(true)}
            className="hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Indices list */}
      {indicesData.map((index) => (
        <div 
          key={index.symbol} 
          className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
        >
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-foreground truncate">{index.name}</div>
            <div className="text-base font-mono font-semibold text-foreground">
              {index.value > 0 ? index.value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}
            </div>
          </div>
          <div className="text-right ml-2">
            <div className={`flex items-center gap-1 justify-end text-xs font-mono ${
              index.change >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {index.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%</span>
            </div>
            <div className={`text-[10px] font-mono ${
              index.change >= 0 ? 'text-success/70' : 'text-destructive/70'
            }`}>
              {index.change >= 0 ? '+' : ''}{index.change.toFixed(0)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LiveMarketIndices;