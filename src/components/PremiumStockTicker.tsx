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
      <div className="mt-2 h-8 border-y border-border/70 bg-background/80 backdrop-blur flex items-center px-4 gap-3 overflow-hidden">
        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse shrink-0" />
        <div className="ticker-mask flex flex-1 items-center gap-6 overflow-hidden">
          {[96, 128, 80, 112, 96, 136].map((w, i) => (
            <span key={i} className="shimmer h-2.5 rounded-full shrink-0" style={{ width: w }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ticker-viewport ticker-mask mt-2 h-8 border-y border-border/70 bg-background/80 backdrop-blur overflow-hidden relative">
      <div className="ticker-scroll flex items-center h-full whitespace-nowrap">
        {duplicatedData.map((item, index) => (
          <div
            key={`${item.symbol}-${index}`}
            className="inline-flex items-center gap-2 px-4 h-full"
          >
            <span className="text-[11px] font-semibold tracking-tight text-foreground">{item.name}</span>
            <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
              ₹{item.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
            <span className={`text-[11px] font-mono font-medium flex items-center gap-1 tabular-nums ${
              item.change >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {item.change >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
            </span>
            <div className="ml-2 w-px h-3 bg-border/80" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PremiumStockTicker;
