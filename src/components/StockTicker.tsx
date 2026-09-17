
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface IndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const StockTicker: React.FC = () => {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRealTimeData = async () => {
    try {
      const symbols = [
        { symbol: '^NSEI', name: 'NIFTY 50' },
        { symbol: '^BSESN', name: 'SENSEX' },
        { symbol: '^NSEBANK', name: 'NIFTY BANK' },
        { symbol: '^CNXIT', name: 'NIFTY IT' },
        { symbol: '^CNXAUTO', name: 'NIFTY AUTO' },
        { symbol: '^CNXPHARMA', name: 'NIFTY PHARMA' }
      ];

      const promises = symbols.map(async ({ symbol, name }) => {
        try {
          const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
          const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
          const response = await fetch(`${CORS_PROXY}${encodeURIComponent(chartUrl)}`);
          
          if (!response.ok) throw new Error('API error');
          
          const data = await response.json();
          const meta = data.chart?.result?.[0]?.meta;
          
          if (!meta) throw new Error('No data');
          
          const currentPrice = meta.regularMarketPrice || 0;
          const previousClose = meta.chartPreviousClose || meta.previousClose || 0;
          const change = currentPrice - previousClose;
          const changePercent = previousClose ? (change / previousClose) * 100 : 0;
          
          return {
            symbol,
            name,
            price: currentPrice,
            change,
            changePercent
          };
        } catch (error) {
          // Return fallback data if fetch fails
          const fallbackData: { [key: string]: IndexData } = {
            '^NSEI': { symbol, name, price: 24631.35, change: 66.00, changePercent: 0.27 },
            '^BSESN': { symbol, name, price: 80599.91, change: -585.69, changePercent: -0.72 },
            '^NSEBANK': { symbol, name, price: 55701.25, change: 83.65, changePercent: 0.15 },
            '^CNXIT': { symbol, name, price: 42890.85, change: 234.15, changePercent: 0.55 },
            '^CNXAUTO': { symbol, name, price: 23145.60, change: -67.30, changePercent: -0.29 },
            '^CNXPHARMA': { symbol, name, price: 22856.45, change: 89.75, changePercent: 0.39 }
          };
          return fallbackData[symbol] || { symbol, name, price: 0, change: 0, changePercent: 0 };
        }
      });

      const results = await Promise.all(promises);
      setIndices(results.filter(index => index.price > 0));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching ticker data:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTimeData();
    
    // Check if market is open and update accordingly
    const getMarketStatus = () => {
      const now = new Date();
      const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      const day = istTime.getDay();
      const totalMinutes = hours * 60 + minutes;
      
      const marketOpenTime = 9 * 60 + 15;
      const marketCloseTime = 15 * 60 + 30;
      const isWeekday = day >= 1 && day <= 5;
      const isMarketHours = totalMinutes >= marketOpenTime && totalMinutes <= marketCloseTime;
      
      return isWeekday && isMarketHours;
    };

    const interval = setInterval(() => {
      if (getMarketStatus()) {
        fetchRealTimeData();
      }
    }, 30000); // Update every 30 seconds during market hours

    return () => clearInterval(interval);
  }, []);

  if (isLoading || indices.length === 0) {
    return (
      <div className="w-full bg-gray-900 border-b border-gray-700 relative z-40 block">
        <div className="overflow-hidden h-10">
          <div className="flex py-2 h-full items-center justify-center">
            <span className="text-gray-400 text-sm">Loading market data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900 border-b border-gray-700 relative z-40 block">
      <div className="overflow-hidden h-10">
        <div className="flex ticker-scroll py-2 h-full items-center">
          {[...indices, ...indices, ...indices].map((index, idx) => (
            <div key={`${index.symbol}-${idx}`} className="flex items-center gap-4 px-6 whitespace-nowrap flex-shrink-0">
              <span className="text-white font-semibold text-sm">{index.name}</span>
              <span className="text-gray-300 text-sm">₹{index.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              <div className={`flex items-center gap-1 ${
                index.change >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {index.change >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="text-xs font-medium">
                  {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockTicker;
