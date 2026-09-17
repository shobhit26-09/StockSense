import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { fetchMultipleQuotesRacing } from '@/services/multiSourceDataService';

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const indices = [
  { symbol: '^NSEI', name: 'NIFTY 50' },
  { symbol: '^BSESN', name: 'SENSEX' },
  { symbol: '^NSEBANK', name: 'BANK NIFTY' },
  { symbol: '^CNXIT', name: 'NIFTY IT' },
];

const stocks = [
  { symbol: 'RELIANCE.NS', name: 'RELIANCE' },
  { symbol: 'TCS.NS', name: 'TCS' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC BANK' },
  { symbol: 'INFY.NS', name: 'INFOSYS' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI BANK' },
  { symbol: 'SBIN.NS', name: 'SBI' },
  { symbol: 'BHARTIARTL.NS', name: 'AIRTEL' },
  { symbol: 'ITC.NS', name: 'ITC' },
  { symbol: 'LT.NS', name: 'L&T' },
  { symbol: 'AXISBANK.NS', name: 'AXIS BANK' },
];

const allSymbols = [...indices, ...stocks];

const PremiumStockTicker = () => {
  const [tickerData, setTickerData] = useState<TickerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickerData = async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);
      
      const symbols = allSymbols.map(s => s.symbol);
      const results = await fetchMultipleQuotesRacing(symbols, 6000);
      
      const validData: TickerItem[] = [];
      
      results.forEach((quote, symbol) => {
        const itemInfo = allSymbols.find(s => s.symbol === symbol);
        if (quote && quote.price > 0 && itemInfo) {
          validData.push({
            symbol,
            name: itemInfo.name,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
          });
        }
      });
      
      setTickerData(validData);
    } catch (error) {
      console.error('Error fetching ticker data:', error);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickerData(true);
    const interval = setInterval(() => fetchTickerData(false), 12000);
    return () => clearInterval(interval);
  }, []);

  const duplicatedData = useMemo(() => {
    if (tickerData.length === 0) return [];
    return [...tickerData, ...tickerData];
  }, [tickerData]);

  if (isLoading || tickerData.length === 0) {
    return (
      <div className="h-9 bg-background border-y border-border flex items-center justify-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse" />
          <span className="text-xs text-muted-foreground font-mono">Connecting to markets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-9 bg-background border-y border-border overflow-hidden relative shadow-sm">
      <div className="ticker-scroll flex items-center h-full whitespace-nowrap">
        {duplicatedData.map((item, index) => (
          <div
            key={`${item.symbol}-${index}`}
            className="inline-flex items-center gap-2.5 px-5 h-full"
          >
            <span className="text-[11px] font-semibold text-foreground tracking-tight">{item.name}</span>
            <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
              ₹{item.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
            <span className={`text-[11px] font-mono font-medium flex items-center gap-1 tabular-nums ${
              item.change >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {item.change >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
            </span>
            <div className="w-px h-3 bg-border" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PremiumStockTicker;
