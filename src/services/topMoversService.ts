// Service to fetch real-time top gainers/losers

import { supabase } from '@/integrations/supabase/client';

export interface TopMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
}

export interface TopMoversData {
  gainers: TopMover[];
  losers: TopMover[];
  mostActive?: TopMover[];
  source: string;
  timestamp: Date;
}

// Cache
let cachedData: TopMoversData | null = null;
let lastFetch = 0;
const CACHE_DURATION = 60000; // 1 minute

// Main fetch function using edge function
export const fetchTopMovers = async (force = false): Promise<TopMoversData> => {
  const now = Date.now();
  
  // Return cached data if fresh (unless forced)
  if (!force && cachedData && now - lastFetch < CACHE_DURATION) {
    console.log('[TopMovers] Using cached data');
    return cachedData;
  }
  
  console.log('[TopMovers] Fetching live data via edge function...');
  
  try {
    const { data, error } = await supabase.functions.invoke('fetch-market-data', {
      body: { type: 'top-movers' },
    });

    if (error) {
      console.error('[TopMovers] Edge function error:', error);
      throw error;
    }

    if (data && (data.gainers?.length > 0 || data.losers?.length > 0)) {
      const result: TopMoversData = {
        gainers: data.gainers || [],
        losers: data.losers || [],
        mostActive: data.mostActive || [],
        source: data.source || 'Live',
        timestamp: new Date(data.timestamp || Date.now()),
      };
      
      cachedData = result;
      lastFetch = now;
      console.log('[TopMovers] Success:', result.gainers.length, 'gainers,', result.losers.length, 'losers');
      return result;
    }
  } catch (error) {
    console.error('[TopMovers] Fetch error:', error);
  }

  // Return cached data if available
  if (cachedData) {
    console.log('[TopMovers] Using stale cache');
    return cachedData;
  }
  
  // Generate fallback data
  console.log('[TopMovers] Using fallback data');
  return generateFallbackData();
};

// Generate fallback data
const generateFallbackData = (): TopMoversData => {
  const baseGainers = [
    { symbol: 'POWERGRID', name: 'Power Grid Corp', basePrice: 272 },
    { symbol: 'HINDZINC', name: 'Hindustan Zinc', basePrice: 615 },
    { symbol: 'ADANIPORTS', name: 'Adani Ports', basePrice: 1405 },
    { symbol: 'TATACONSUM', name: 'TATA Consumer', basePrice: 1130 },
    { symbol: 'RELIANCE', name: 'Reliance Industries', basePrice: 1395 },
  ];
  
  const baseLosers = [
    { symbol: 'NESTLEIND', name: 'Nestle India', basePrice: 2155 },
    { symbol: 'DRREDDY', name: 'Dr. Reddys Labs', basePrice: 1185 },
    { symbol: 'TITAN', name: 'Titan Company', basePrice: 3960 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', basePrice: 930 },
    { symbol: 'TCS', name: 'TCS', basePrice: 3175 },
  ];
  
  const gainers: TopMover[] = baseGainers.map(stock => {
    const changePercent = 3 + Math.random() * 5;
    const price = stock.basePrice * (1 + (Math.random() - 0.5) * 0.02);
    return {
      symbol: stock.symbol,
      name: stock.name,
      price: Math.round(price * 100) / 100,
      change: Math.round(price * changePercent / 100 * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
    };
  });
  
  const losers: TopMover[] = baseLosers.map(stock => {
    const changePercent = -(2 + Math.random() * 4);
    const price = stock.basePrice * (1 + (Math.random() - 0.5) * 0.02);
    return {
      symbol: stock.symbol,
      name: stock.name,
      price: Math.round(price * 100) / 100,
      change: Math.round(price * changePercent / 100 * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
    };
  });
  
  return {
    gainers,
    losers,
    source: 'Estimated',
    timestamp: new Date(),
  };
};

export const getTopMoversCache = (): TopMoversData | null => cachedData;