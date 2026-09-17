/**
 * Multi-Source Market Data Service
 * Routes all requests through the backend edge function to avoid CORS issues
 */

import { supabase } from '@/integrations/supabase/client';

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  volume?: number;
  source: string;
  timestamp: number;
}

export interface DataSourceStats {
  yahoo: { successCount: number; avgLatency: number; lastSuccess: number };
  google: { successCount: number; avgLatency: number; lastSuccess: number };
  backup: { successCount: number; avgLatency: number; lastSuccess: number };
}

let sourceStats: DataSourceStats = {
  yahoo: { successCount: 0, avgLatency: 1000, lastSuccess: 0 },
  google: { successCount: 0, avgLatency: 1000, lastSuccess: 0 },
  backup: { successCount: 0, avgLatency: 1000, lastSuccess: 0 },
};

// Cache for quotes
const quoteCache = new Map<string, { quote: StockQuote; timestamp: number }>();
const CACHE_TTL = 15000; // 15 seconds

// Index symbol mappings
const INDEX_MAPPINGS: Record<string, { yahoo: string; name: string }> = {
  '^NSEI': { yahoo: '^NSEI', name: 'NIFTY 50' },
  '^NSEBANK': { yahoo: '^NSEBANK', name: 'Bank NIFTY' },
  '^CNXIT': { yahoo: '^CNXIT', name: 'NIFTY IT' },
  '^CNXPHARMA': { yahoo: 'NIFTYPHARMA.NS', name: 'NIFTY Pharma' },
  '^CNXAUTO': { yahoo: 'NIFTYAUTO.NS', name: 'NIFTY Auto' },
  '^CNXMETAL': { yahoo: 'NIFTYMETAL.NS', name: 'NIFTY Metal' },
  '^CNXREALTY': { yahoo: 'NIFTYREALTY.NS', name: 'NIFTY Realty' },
  '^CNXENERGY': { yahoo: 'NIFTYENERGY.NS', name: 'NIFTY Energy' },
  '^CNXFMCG': { yahoo: 'NIFTYFMCG.NS', name: 'NIFTY FMCG' },
  '^CNXINFRA': { yahoo: 'NIFTY_INFRA.NS', name: 'NIFTY Infra' },
  '^CNXPSUBANK': { yahoo: 'NIFTY_PSU_BANK.NS', name: 'NIFTY PSU Bank' },
  '^CNXMEDIA': { yahoo: 'NIFTY_MEDIA.NS', name: 'NIFTY Media' },
  '^INDIAVIX': { yahoo: '^INDIAVIX', name: 'India VIX' },
  '^BSESN': { yahoo: '^BSESN', name: 'SENSEX' },
};

const getYahooSymbol = (symbol: string): string => {
  const mapping = INDEX_MAPPINGS[symbol];
  if (mapping) return mapping.yahoo;
  if (symbol.includes('.NS') || symbol.includes('.BO') || symbol.startsWith('^')) return symbol;
  return `${symbol}.NS`;
};

/**
 * Fetch a single quote via the edge function
 */
export const fetchQuoteRacing = async (symbol: string, _timeout?: number): Promise<StockQuote | null> => {
  const cached = quoteCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.quote;
  }

  try {
    const yahooSymbol = getYahooSymbol(symbol);
    const { data, error } = await supabase.functions.invoke('fetch-market-data', {
      body: { type: 'batch-quotes', symbols: [yahooSymbol] },
    });

    if (error) throw error;

    const quoteData = data?.[yahooSymbol];
    if (quoteData && quoteData.price) {
      const mapping = INDEX_MAPPINGS[symbol];
      const result: StockQuote = {
        symbol,
        name: mapping?.name || quoteData.name || symbol,
        price: quoteData.price,
        change: quoteData.change,
        changePercent: quoteData.changePercent,
        previousClose: quoteData.previousClose,
        volume: quoteData.volume,
        source: quoteData.source || 'yahoo',
        timestamp: Date.now(),
      };
      quoteCache.set(symbol, { quote: result, timestamp: Date.now() });
      
      const src = quoteData.source as 'yahoo' | 'backup';
      if (src === 'yahoo' || src === 'backup') {
        sourceStats[src].successCount++;
        sourceStats[src].lastSuccess = Date.now();
      }
      
      return result;
    }
  } catch (err) {
    console.error(`[MultiSource] Edge function failed for ${symbol}:`, err);
  }

  return null;
};

export const fetchQuoteWithFallback = async (symbol: string): Promise<StockQuote | null> => {
  return fetchQuoteRacing(symbol);
};

/**
 * Batch fetch multiple symbols via the edge function
 */
export const fetchMultipleQuotesRacing = async (
  symbols: string[],
  _timeout?: number
): Promise<Map<string, StockQuote>> => {
  const results = new Map<string, StockQuote>();
  
  // Check cache first, collect uncached symbols
  const uncachedSymbols: string[] = [];
  const yahooToOriginal = new Map<string, string>();
  
  for (const symbol of symbols) {
    const cached = quoteCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      results.set(symbol, cached.quote);
    } else {
      const yahooSym = getYahooSymbol(symbol);
      uncachedSymbols.push(yahooSym);
      yahooToOriginal.set(yahooSym, symbol);
    }
  }

  if (uncachedSymbols.length === 0) return results;

  try {
    const { data, error } = await supabase.functions.invoke('fetch-market-data', {
      body: { type: 'batch-quotes', symbols: uncachedSymbols },
    });

    if (error) throw error;

    for (const [yahooSym, quoteData] of Object.entries(data || {})) {
      const originalSymbol = yahooToOriginal.get(yahooSym) || yahooSym;
      const qd = quoteData as any;
      if (qd && qd.price) {
        const mapping = INDEX_MAPPINGS[originalSymbol];
        const result: StockQuote = {
          symbol: originalSymbol,
          name: mapping?.name || qd.name || originalSymbol,
          price: qd.price,
          change: qd.change,
          changePercent: qd.changePercent,
          previousClose: qd.previousClose,
          volume: qd.volume,
          source: qd.source || 'yahoo',
          timestamp: Date.now(),
        };
        quoteCache.set(originalSymbol, { quote: result, timestamp: Date.now() });
        results.set(originalSymbol, result);
      }
    }
  } catch (err) {
    console.error('[MultiSource] Batch fetch error:', err);
  }

  return results;
};

export const getSourceStats = (): DataSourceStats => ({ ...sourceStats });

export const resetSourceStats = () => {
  sourceStats = {
    yahoo: { successCount: 0, avgLatency: 1000, lastSuccess: 0 },
    google: { successCount: 0, avgLatency: 1000, lastSuccess: 0 },
    backup: { successCount: 0, avgLatency: 1000, lastSuccess: 0 },
  };
};

export const clearQuoteCache = () => { quoteCache.clear(); };

// Legacy exports for compatibility
export const fetchFromYahoo = async () => null;
export const fetchFromYahooWithProxy = async () => null;
export const getBackupQuote = () => null;
