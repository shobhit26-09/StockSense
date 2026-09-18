import { useState, useEffect, useCallback } from 'react';
import { Grid3X3, RefreshCw, Wifi } from 'lucide-react';
import { fetchMultipleQuotesRacing, getSourceStats, type StockQuote } from '@/services/multiSourceDataService';

interface SectorData {
  name: string;
  symbol: string;
  change: number;
  value?: number;
  source?: string;
}

// Use actual Yahoo Finance sector ETF/index symbols that work
const sectors: { name: string; symbol: string; displayName: string }[] = [
  { name: 'NIFTY 50', symbol: '^NSEI', displayName: 'NIFTY' },
  { name: 'Bank NIFTY', symbol: '^NSEBANK', displayName: 'Bank' },
  { name: 'NIFTY IT', symbol: '^CNXIT', displayName: 'IT' },
  { name: 'Reliance', symbol: 'RELIANCE.NS', displayName: 'RIL' },
  { name: 'TCS', symbol: 'TCS.NS', displayName: 'TCS' },
  { name: 'HDFC Bank', symbol: 'HDFCBANK.NS', displayName: 'HDFC' },
  { name: 'Infosys', symbol: 'INFY.NS', displayName: 'INFY' },
  { name: 'ICICI Bank', symbol: 'ICICIBANK.NS', displayName: 'ICICI' },
  { name: 'SBI', symbol: 'SBIN.NS', displayName: 'SBI' },
  { name: 'ITC', symbol: 'ITC.NS', displayName: 'ITC' },
  { name: 'L&T', symbol: 'LT.NS', displayName: 'L&T' },
  { name: 'Axis Bank', symbol: 'AXISBANK.NS', displayName: 'Axis' },
];

// Cache for sector data to avoid rate limiting
let cachedData: SectorData[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

const SectorHeatmap = () => {
  const [sectorData, setSectorData] = useState<SectorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activeSource, setActiveSource] = useState<string>('—');

  const fetchSectorData = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Use cached data if available and not expired
    if (!force && cachedData && now - lastFetchTime < CACHE_DURATION) {
      setSectorData(cachedData);
      setIsLoading(false);
      return;
    }

    const symbols = sectors.map(s => s.symbol);
    const results = await fetchMultipleQuotesRacing(symbols, 4000);
    
    // Determine most used source
    const stats = getSourceStats();
    const bestSource = Object.entries(stats)
      .sort((a, b) => b[1].successCount - a[1].successCount)[0];
    setActiveSource(bestSource?.[0] || 'yahoo');

    const processedResults: SectorData[] = sectors.map((sector) => {
      const quote = results.get(sector.symbol);
      if (quote && quote.price > 0) {
        return {
          name: sector.displayName,
          symbol: sector.symbol,
          change: quote.changePercent,
          value: quote.price,
          source: quote.source
        };
      }
      // Keep a stale real quote when available; otherwise show a neutral tile.
      const cached = cachedData?.find(s => s.symbol === sector.symbol);
      return cached || { name: sector.displayName, symbol: sector.symbol, change: 0 };
    });
    
    cachedData = processedResults;
    lastFetchTime = now;
    setSectorData(processedResults);
    setLastUpdate(new Date());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSectorData();
    const interval = setInterval(() => fetchSectorData(), 30000);
    return () => clearInterval(interval);
  }, [fetchSectorData]);

  const getHeatmapColor = (change: number) => {
    if (change >= 2) return 'bg-emerald-500';
    if (change >= 1) return 'bg-emerald-600';
    if (change >= 0.5) return 'bg-emerald-700';
    if (change >= 0) return 'bg-emerald-900/50';
    if (change >= -0.5) return 'bg-red-900/50';
    if (change >= -1) return 'bg-red-700';
    if (change >= -2) return 'bg-red-600';
    return 'bg-red-500';
  };

  const getTextColor = (change: number) => {
    if (Math.abs(change) >= 0.5) return 'text-white';
    return 'text-muted-foreground';
  };

  if (isLoading && sectorData.length === 0) {
    return (
      <div className="terminal-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Grid3X3 className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sector Heatmap</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-[2/1] bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sector Heatmap</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Wifi className="w-3 h-3" />
            <span className="capitalize">{activeSource}</span>
          </div>
          {lastUpdate && (
            <span className="text-[10px] font-mono text-muted-foreground">
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button 
            onClick={() => fetchSectorData(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {sectorData.map((sector) => (
          <div
            key={sector.symbol}
            className={`${getHeatmapColor(sector.change)} rounded-md p-3 transition-all duration-300 cursor-default min-h-[60px] flex flex-col justify-center`}
          >
            <div className={`text-xs font-medium truncate ${getTextColor(sector.change)}`}>
              {sector.name}
            </div>
            <div className={`text-sm font-mono font-bold ${getTextColor(sector.change)}`}>
              {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-1 mt-4">
        <span className="text-[10px] text-muted-foreground">-2%</span>
        <div className="flex gap-0.5">
          <div className="w-3 h-2 bg-red-500 rounded-sm" />
          <div className="w-3 h-2 bg-red-600 rounded-sm" />
          <div className="w-3 h-2 bg-red-700 rounded-sm" />
          <div className="w-3 h-2 bg-red-900/50 rounded-sm" />
          <div className="w-3 h-2 bg-emerald-900/50 rounded-sm" />
          <div className="w-3 h-2 bg-emerald-700 rounded-sm" />
          <div className="w-3 h-2 bg-emerald-600 rounded-sm" />
          <div className="w-3 h-2 bg-emerald-500 rounded-sm" />
        </div>
        <span className="text-[10px] text-muted-foreground">+2%</span>
      </div>
    </div>
  );
};

export default SectorHeatmap;
