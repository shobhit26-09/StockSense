import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Wifi } from 'lucide-react';
import { fetchMultipleQuotesRacing, getSourceStats, type StockQuote } from '@/services/multiSourceDataService';

interface StockMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  source?: string;
}

// Cache for movers data
let cachedMovers: { gainers: StockMover[]; losers: StockMover[] } | null = null;
let lastMoversUpdate = 0;
const MOVERS_CACHE_DURATION = 15000; // 15 seconds

const stocks = [
  { symbol: 'RELIANCE.NS', name: 'Reliance' },
  { symbol: 'TCS.NS', name: 'TCS' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
  { symbol: 'INFY.NS', name: 'Infosys' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
  { symbol: 'HINDUNILVR.NS', name: 'HUL' },
  { symbol: 'SBIN.NS', name: 'SBI' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
  { symbol: 'ITC.NS', name: 'ITC' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Bank' },
  { symbol: 'LT.NS', name: 'L&T' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank' },
];

const TopMovers = () => {
  const [gainers, setGainers] = useState<StockMover[]>([]);
  const [losers, setLosers] = useState<StockMover[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activeSource, setActiveSource] = useState<string>('—');

  const fetchTopMovers = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Use cached data if available and not expired
    if (!force && cachedMovers && now - lastMoversUpdate < MOVERS_CACHE_DURATION) {
      setGainers(cachedMovers.gainers);
      setLosers(cachedMovers.losers);
      setIsLoading(false);
      return;
    }

    const symbols = stocks.map(s => s.symbol);
    const results = await fetchMultipleQuotesRacing(symbols, 4000);
    
    // Determine most used source
    const stats = getSourceStats();
    const bestSource = Object.entries(stats)
      .sort((a, b) => b[1].successCount - a[1].successCount)[0];
    setActiveSource(bestSource?.[0] || 'yahoo');

    const validStocks: StockMover[] = [];
    
    results.forEach((quote: StockQuote, symbol: string) => {
      const stockInfo = stocks.find(s => s.symbol === symbol);
      if (quote && quote.price > 0 && stockInfo) {
        validStocks.push({
          symbol,
          name: stockInfo.name,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          source: quote.source
        });
      }
    });
    
    const sorted = [...validStocks].sort((a, b) => b.changePercent - a.changePercent);
    
    const newGainers = sorted.slice(0, 5);
    const newLosers = sorted.slice(-5).reverse();
    
    cachedMovers = { gainers: newGainers, losers: newLosers };
    lastMoversUpdate = now;
    
    setGainers(newGainers);
    setLosers(newLosers);
    setLastUpdate(new Date());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTopMovers();
    const interval = setInterval(() => fetchTopMovers(), 15000);
    return () => clearInterval(interval);
  }, [fetchTopMovers]);

  const renderTable = (data: StockMover[], type: 'gainer' | 'loser') => (
    <table className="w-full">
      <thead>
        <tr className="text-left text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border">
          <th className="pb-2 font-medium">Symbol</th>
          <th className="pb-2 font-medium text-right">Price</th>
          <th className="pb-2 font-medium text-right">Change</th>
        </tr>
      </thead>
      <tbody className="font-mono text-sm">
        {data.length === 0 ? (
          <tr>
            <td colSpan={3} className="py-4 text-center text-muted-foreground text-xs">
              Loading...
            </td>
          </tr>
        ) : (
          data.map((stock) => (
            <tr key={stock.symbol} className="border-b border-border/30 last:border-0">
              <td className="py-2">
                <span className="text-foreground text-xs">{stock.name}</span>
              </td>
              <td className="py-2 text-right text-foreground text-xs">
                ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
              </td>
              <td className="py-2 text-right">
                <span className={`inline-flex items-center gap-0.5 text-xs ${
                  type === 'gainer' ? 'text-success' : 'text-destructive'
                }`}>
                  {type === 'gainer' ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  if (isLoading && gainers.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="terminal-card p-4">
            <div className="h-4 w-20 bg-muted/30 rounded mb-3 animate-pulse" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="h-6 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Gainers */}
      <div className="terminal-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-success" />
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Top Gainers</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Wifi className="w-2.5 h-2.5" />
              <span className="capitalize">{activeSource}</span>
            </div>
            <button 
              onClick={() => fetchTopMovers(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        {renderTable(gainers, 'gainer')}
      </div>

      {/* Losers */}
      <div className="terminal-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-3.5 h-3.5 text-destructive" />
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Top Losers</h3>
          </div>
          {lastUpdate && (
            <span className="text-[9px] font-mono text-muted-foreground">
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
        {renderTable(losers, 'loser')}
      </div>
    </div>
  );
};

export default TopMovers;