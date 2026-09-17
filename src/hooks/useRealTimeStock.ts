
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRealTimeStockProps {
  symbol: string;
  interval?: number;
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
  interval = 10000,
  enabled = true 
}: UseRealTimeStockProps) => {
  const [data, setData] = useState<RealTimeStockData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isMarketOpen = () => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const day = istTime.getDay();
    const totalMinutes = hours * 60 + minutes;
    const marketOpenTime = 9 * 60 + 15;
    const marketCloseTime = 15 * 60 + 30;
    return day >= 1 && day <= 5 && totalMinutes >= marketOpenTime && totalMinutes <= marketCloseTime;
  };

  const fetchRealTimeData = async () => {
    if (!symbol || !enabled) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const formattedSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
      
      const { data: result, error: fnError } = await supabase.functions.invoke('fetch-market-data', {
        body: { type: 'batch-quotes', symbols: [formattedSymbol] },
      });

      if (fnError) throw fnError;

      const quoteData = result?.[formattedSymbol];
      if (!quoteData?.price) throw new Error('No price data');

      setData({
        price: quoteData.price,
        change: quoteData.change,
        changePercent: quoteData.changePercent,
        volume: quoteData.volume || 0,
        high: quoteData.high || quoteData.price,
        low: quoteData.low || quoteData.price,
        lastUpdated: new Date().toLocaleTimeString('en-IN'),
      });
    } catch (err) {
      setError('Failed to fetch real-time data');
      console.error('Real-time stock fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled || !symbol) return;
    fetchRealTimeData();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchRealTimeData, interval);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [symbol, interval, enabled]);

  const startPolling = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchRealTimeData, interval);
    fetchRealTimeData();
  };
  
  const stopPolling = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  return { data, isLoading, error, startPolling, stopPolling, refetch: fetchRealTimeData, isMarketOpen: isMarketOpen() };
};
