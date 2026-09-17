import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { fetchMultipleQuotesRacing } from '@/services/multiSourceDataService';

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'index' | 'gainer' | 'loser';
  source?: string;
}

const indices = [
  { symbol: '^NSEI', name: 'NIFTY 50' },
  { symbol: '^BSESN', name: 'SENSEX' },
  { symbol: '^NSEBANK', name: 'BANK NIFTY' },
];

const stocks = [
  { symbol: 'RELIANCE.NS', name: 'RELIANCE' },
  { symbol: 'TCS.NS', name: 'TCS' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC BANK' },
  { symbol: 'INFY.NS', name: 'INFOSYS' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI BANK' },
  { symbol: 'HINDUNILVR.NS', name: 'HUL' },
  { symbol: 'SBIN.NS', name: 'SBI' },
  { symbol: 'BHARTIARTL.NS', name: 'BHARTI AIRTEL' },
  { symbol: 'ITC.NS', name: 'ITC' },
  { symbol: 'KOTAKBANK.NS', name: 'KOTAK BANK' },
  { symbol: 'LT.NS', name: 'L&T' },
  { symbol: 'AXISBANK.NS', name: 'AXIS BANK' },
];

const allSymbols = [...indices, ...stocks];

const EnhancedStockTicker = () => {
  const [tickerData, setTickerData] = useState<TickerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickerData = async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);
      
      const symbols = allSymbols.map(s => s.symbol);
      const results = await fetchMultipleQuotesRacing(symbols, 8000);
      
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
            type: symbol.startsWith('^') ? 'index' : (quote.changePercent >= 0 ? 'gainer' : 'loser'),
            source: quote.source
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
    const interval = setInterval(() => fetchTickerData(false), 10000);
    return () => clearInterval(interval);
  }, []);

  const duplicatedData = useMemo(() => {
    if (tickerData.length === 0) return [];
    return [...tickerData, ...tickerData];
  }, [tickerData]);

  if (isLoading || tickerData.length === 0) {
    return (
      <div className="h-8 bg-card border-b border-border flex items-center justify-center">
        <span className="text-xs text-muted-foreground font-mono">Loading market data...</span>
      </div>
    );
  }

  return (
    <div className="h-8 bg-card border-b border-border overflow-hidden">
      <div className="ticker-scroll flex items-center h-full whitespace-nowrap">
        {duplicatedData.map((item, index) => (
          <div
            key={`${item.symbol}-${index}`}
            className="inline-flex items-center gap-2 px-4 h-full border-r border-border/50"
          >
            <span className="text-xs font-mono text-muted-foreground">{item.name}</span>
            <span className="text-xs font-mono font-medium text-foreground">
              ₹{item.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
            <span className={`text-xs font-mono flex items-center gap-0.5 ${
              item.change >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {item.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedStockTicker;