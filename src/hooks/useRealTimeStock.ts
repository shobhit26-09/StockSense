
import { useState, useEffect, useRef } from 'react';
import { fetchStockData } from '@/utils/stockApi';

interface UseRealTimeStockProps {
  symbol: string;
  interval?: number; // in milliseconds
  enabled?: boolean;
}

interface RealTimeStockData {
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdated: string;
  high: number;
  low: number;
}

export const useRealTimeStock = ({ 
  symbol, 
  interval = 15000, // 15 seconds default
  enabled = true 
}: UseRealTimeStockProps) => {
  const [data, setData] = useState<RealTimeStockData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isMarketOpen = () => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const day = istTime.getDay();
    const totalMinutes = hours * 60 + minutes;
    
    const marketOpenTime = 9 * 60 + 15; // 9:15 AM
    const marketCloseTime = 15 * 60 + 30; // 3:30 PM
    
    const isWeekend = day === 0 || day === 6;
    const isMarketHours = totalMinutes >= marketOpenTime && totalMinutes <= marketCloseTime;
    const isWeekday = day >= 1 && day <= 5;
    
    return isWeekday && isMarketHours && !isWeekend;
  };

  const fetchRealTimeData = async () => {
    if (!symbol || !enabled) return;

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching real-time stock data for:', symbol, 'Market open:', isMarketOpen());
      
      // Use a more direct approach for real-time data
      const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
      const YFINANCE_API_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';
      
      const formattedSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
      const chartUrl = `${YFINANCE_API_BASE}${formattedSymbol}?interval=1m&range=1d&includePrePost=false`;
      
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(chartUrl)}`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const chartData = await response.json();
      
      if (!chartData.chart || !chartData.chart.result || chartData.chart.result.length === 0) {
        throw new Error('Invalid chart data received');
      }

      const chartResult = chartData.chart.result[0];
      const meta = chartResult.meta;
      
      const currentPrice = meta.regularMarketPrice || 0;
      const previousClose = meta.chartPreviousClose || meta.previousClose || 0;
      const change = currentPrice - previousClose;
      const changePercent = previousClose ? (change / previousClose) * 100 : 0;
      
      const newData = {
        price: currentPrice,
        change: change,
        changePercent: changePercent,
        volume: meta.regularMarketVolume || 0,
        high: meta.regularMarketDayHigh || currentPrice,
        low: meta.regularMarketDayLow || currentPrice,
        lastUpdated: new Date().toLocaleTimeString('en-IN')
      };
      
      console.log('Updated real-time stock data:', newData);
      setData(newData);
    } catch (err) {
      setError('Failed to fetch real-time data');
      console.error('Real-time stock fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled || !symbol) return;

    // Initial fetch
    fetchRealTimeData();

    // Set up polling - only during market hours for frequent updates
    const setupPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        if (isMarketOpen()) {
          fetchRealTimeData();
        } else {
          console.log('Market closed, skipping real-time update for:', symbol);
        }
      }, interval);
    };

    setupPolling();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [symbol, interval, enabled]);

  const startPolling = () => fetchRealTimeData();
  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return {
    data,
    isLoading,
    error,
    startPolling,
    stopPolling,
    refetch: fetchRealTimeData,
    isMarketOpen: isMarketOpen()
  };
};
