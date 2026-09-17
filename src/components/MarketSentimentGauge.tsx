import { useState, useEffect, useCallback } from 'react';
import { Gauge, TrendingUp, TrendingDown, Minus, RefreshCw, Wifi } from 'lucide-react';
import { fetchMultipleQuotesRacing, getSourceStats } from '@/services/multiSourceDataService';

interface MarketData {
  advances: number;
  declines: number;
  unchanged: number;
  sentimentScore: number;
  sentimentLabel: string;
}

// Cache for sentiment data
let cachedSentimentData: MarketData | null = null;
let lastSentimentFetch = 0;
const SENTIMENT_CACHE_DURATION = 60000; // 1 minute

const stocks = [
  'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
  'HINDUNILVR.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS',
  'LT.NS', 'AXISBANK.NS'
];

const MarketSentimentGauge = () => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSource, setActiveSource] = useState<string>('—');

  const fetchMarketSentiment = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Use cached data if available and not expired
    if (!force && cachedSentimentData && now - lastSentimentFetch < SENTIMENT_CACHE_DURATION) {
      setMarketData(cachedSentimentData);
      setIsLoading(false);
      return;
    }

    const results = await fetchMultipleQuotesRacing(stocks, 8000);
    
    // Determine most used source
    const stats = getSourceStats();
    const bestSource = Object.entries(stats)
      .sort((a, b) => b[1].successCount - a[1].successCount)[0];
    setActiveSource(bestSource?.[0] || 'yahoo');

    let advances = 0;
    let declines = 0;
    let unchanged = 0;

    results.forEach((quote) => {
      if (quote) {
        const change = quote.changePercent;
        if (change > 0.1) advances++;
        else if (change < -0.1) declines++;
        else unchanged++;
      }
    });

    const total = advances + declines + unchanged;
    const sentimentScore = total > 0 
      ? Math.round(((advances - declines) / total + 1) * 50) 
      : 50;
    
    let sentimentLabel = 'Neutral';
    if (sentimentScore >= 75) sentimentLabel = 'Extreme Greed';
    else if (sentimentScore >= 60) sentimentLabel = 'Greed';
    else if (sentimentScore >= 55) sentimentLabel = 'Mild Greed';
    else if (sentimentScore <= 25) sentimentLabel = 'Extreme Fear';
    else if (sentimentScore <= 40) sentimentLabel = 'Fear';
    else if (sentimentScore <= 45) sentimentLabel = 'Mild Fear';

    const data = {
      advances,
      declines,
      unchanged,
      sentimentScore,
      sentimentLabel
    };

    cachedSentimentData = data;
    lastSentimentFetch = now;
    setMarketData(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchMarketSentiment();
    const interval = setInterval(() => fetchMarketSentiment(), 60000);
    return () => clearInterval(interval);
  }, [fetchMarketSentiment]);

  const getSentimentColor = (score: number) => {
    if (score >= 60) return 'text-success';
    if (score <= 40) return 'text-destructive';
    return 'text-warning';
  };

  const getSentimentGradient = (score: number) => {
    if (score >= 60) return 'from-success/20 to-success/5';
    if (score <= 40) return 'from-destructive/20 to-destructive/5';
    return 'from-warning/20 to-warning/5';
  };

  const getGaugeRotation = (score: number) => {
    return (score - 50) * 1.8;
  };

  if (isLoading && !marketData) {
    return (
      <div className="terminal-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Gauge className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Market Sentiment</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-4">
          <div className="w-24 h-24 bg-muted/30 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  if (!marketData) return null;

  return (
    <div className={`terminal-card p-4 bg-gradient-to-b ${getSentimentGradient(marketData.sentimentScore)}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Market Sentiment</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <Wifi className="w-2.5 h-2.5" />
            <span className="capitalize">{activeSource}</span>
          </div>
          <button 
            onClick={() => fetchMarketSentiment(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Gauge */}
      <div className="flex flex-col items-center py-2">
        <div className="relative w-28 h-14 overflow-hidden">
          {/* Gauge background arc */}
          <div className="absolute inset-0 border-[5px] border-muted rounded-t-full" />
          
          {/* Colored arc segments */}
          <div className="absolute inset-0">
            <div className="absolute left-0 top-0 w-1/3 h-full border-l-[5px] border-t-[5px] border-destructive rounded-tl-full opacity-50" />
            <div className="absolute right-0 top-0 w-1/3 h-full border-r-[5px] border-t-[5px] border-success rounded-tr-full opacity-50" />
          </div>
          
          {/* Needle */}
          <div 
            className="absolute bottom-0 left-1/2 w-0.5 h-12 -ml-0.5 origin-bottom transition-transform duration-700"
            style={{ transform: `rotate(${getGaugeRotation(marketData.sentimentScore)}deg)` }}
          >
            <div className="w-full h-full bg-foreground rounded-t-full" />
          </div>
          
          {/* Center dot */}
          <div className="absolute bottom-0 left-1/2 w-2.5 h-2.5 -ml-1.5 -mb-1 bg-foreground rounded-full border-2 border-background" />
        </div>
        
        {/* Score */}
        <div className={`text-2xl font-bold font-mono mt-2 ${getSentimentColor(marketData.sentimentScore)}`}>
          {marketData.sentimentScore}
        </div>
        <div className={`text-xs font-medium ${getSentimentColor(marketData.sentimentScore)}`}>
          {marketData.sentimentLabel}
        </div>
      </div>
      
      {/* Market Breadth Stats */}
      <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-border/50">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-success">
            <TrendingUp className="w-3 h-3" />
            <span className="text-base font-bold font-mono">{marketData.advances}</span>
          </div>
          <div className="text-[9px] text-muted-foreground uppercase">Advances</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground">
            <Minus className="w-3 h-3" />
            <span className="text-base font-bold font-mono">{marketData.unchanged}</span>
          </div>
          <div className="text-[9px] text-muted-foreground uppercase">Flat</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-destructive">
            <TrendingDown className="w-3 h-3" />
            <span className="text-base font-bold font-mono">{marketData.declines}</span>
          </div>
          <div className="text-[9px] text-muted-foreground uppercase">Declines</div>
        </div>
      </div>
    </div>
  );
};

export default MarketSentimentGauge;