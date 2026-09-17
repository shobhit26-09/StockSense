import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Stock {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  changePercent?: number;
  exchange?: string;
}

interface StockSearchProps {
  onStockSelect: (symbol: string) => void;
}

const StockSearch: React.FC<StockSearchProps> = ({ onStockSelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const popularStocks = [
    // Banking Sector
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries', price: 2450.75, change: 12.50, changePercent: 0.51, exchange: 'NSE' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', price: 3890.20, change: -25.30, changePercent: -0.65, exchange: 'NSE' },
    { symbol: 'INFY.NS', name: 'Infosys Limited', price: 1567.80, change: 18.40, changePercent: 1.19, exchange: 'NSE' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', price: 1678.90, change: 8.75, changePercent: 0.52, exchange: 'NSE' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Limited', price: 1234.56, change: -5.60, changePercent: -0.45, exchange: 'NSE' },
    { symbol: 'SBIN.NS', name: 'State Bank of India', price: 567.89, change: 12.45, changePercent: 2.24, exchange: 'NSE' },
    { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', price: 1890.45, change: -8.90, changePercent: -0.47, exchange: 'NSE' },
    { symbol: 'AXISBANK.NS', name: 'Axis Bank Limited', price: 1123.67, change: 15.78, changePercent: 1.42, exchange: 'NSE' },
    { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank Limited', price: 987.34, change: -12.45, changePercent: -1.24, exchange: 'NSE' },
    { symbol: 'PNB.NS', name: 'Punjab National Bank', price: 105.67, change: 2.34, changePercent: 2.26, exchange: 'NSE' },
    
    // IT Sector
    { symbol: 'WIPRO.NS', name: 'Wipro Limited', price: 456.78, change: 12.30, changePercent: 2.77, exchange: 'NSE' },
    { symbol: 'TECHM.NS', name: 'Tech Mahindra Limited', price: 1234.90, change: -18.45, changePercent: -1.47, exchange: 'NSE' },
    { symbol: 'HCLTECH.NS', name: 'HCL Technologies', price: 1567.23, change: 23.45, changePercent: 1.52, exchange: 'NSE' },
    { symbol: 'LTI.NS', name: 'L&T Infotech', price: 4567.89, change: 67.89, changePercent: 1.51, exchange: 'NSE' },
    { symbol: 'MINDTREE.NS', name: 'Mindtree Limited', price: 3456.78, change: -45.67, changePercent: -1.30, exchange: 'NSE' },
    
    // Auto Sector
    { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India', price: 11234.50, change: -89.75, changePercent: -0.79, exchange: 'NSE' },
    { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Limited', price: 567.89, change: 12.45, changePercent: 2.24, exchange: 'NSE' },
    { symbol: 'M&M.NS', name: 'Mahindra & Mahindra', price: 1456.78, change: 34.56, changePercent: 2.43, exchange: 'NSE' },
    { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto Limited', price: 6789.45, change: -123.45, changePercent: -1.79, exchange: 'NSE' },
    { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp Limited', price: 3456.78, change: 45.67, changePercent: 1.34, exchange: 'NSE' },
    { symbol: 'EICHERMOT.NS', name: 'Eicher Motors Limited', price: 4567.89, change: -67.89, changePercent: -1.46, exchange: 'NSE' },
    
    // Energy Sector
    { symbol: 'ADANIGREEN.NS', name: 'Adani Green Energy', price: 987.65, change: 45.20, changePercent: 4.80, exchange: 'NSE' },
    { symbol: 'ONGC.NS', name: 'Oil & Natural Gas Corp', price: 234.56, change: 5.67, changePercent: 2.48, exchange: 'NSE' },
    { symbol: 'IOC.NS', name: 'Indian Oil Corporation', price: 123.45, change: -2.34, changePercent: -1.86, exchange: 'NSE' },
    { symbol: 'BPCL.NS', name: 'Bharat Petroleum Corp', price: 456.78, change: 12.34, changePercent: 2.78, exchange: 'NSE' },
    { symbol: 'HPCL.NS', name: 'Hindustan Petroleum Corp', price: 345.67, change: -8.90, changePercent: -2.51, exchange: 'NSE' },
    { symbol: 'NTPC.NS', name: 'NTPC Limited', price: 234.56, change: 4.56, changePercent: 1.98, exchange: 'NSE' },
    { symbol: 'POWERGRID.NS', name: 'Power Grid Corp of India', price: 234.78, change: 3.45, changePercent: 1.49, exchange: 'NSE' },
    
    // FMCG Sector
    { symbol: 'NESTLEIND.NS', name: 'Nestle India Limited', price: 23456.78, change: 345.67, changePercent: 1.50, exchange: 'NSE' },
    { symbol: 'ITC.NS', name: 'ITC Limited', price: 456.78, change: 8.90, changePercent: 1.99, exchange: 'NSE' },
    { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever', price: 2567.89, change: -34.56, changePercent: -1.33, exchange: 'NSE' },
    { symbol: 'BRITANNIA.NS', name: 'Britannia Industries', price: 4567.89, change: 67.89, changePercent: 1.51, exchange: 'NSE' },
    { symbol: 'DABUR.NS', name: 'Dabur India Limited', price: 567.89, change: 12.34, changePercent: 2.22, exchange: 'NSE' },
    
    // Pharma Sector
    { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Inds', price: 1234.56, change: 23.45, changePercent: 1.94, exchange: 'NSE' },
    { symbol: 'DRREDDY.NS', name: 'Dr Reddys Laboratories', price: 5678.90, change: -89.12, changePercent: -1.54, exchange: 'NSE' },
    { symbol: 'CIPLA.NS', name: 'Cipla Limited', price: 1123.45, change: 18.90, changePercent: 1.71, exchange: 'NSE' },
    { symbol: 'DIVISLAB.NS', name: 'Divis Laboratories', price: 4567.89, change: -67.89, changePercent: -1.46, exchange: 'NSE' },
    
    // Telecom Sector
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Limited', price: 1234.56, change: 18.90, changePercent: 1.56, exchange: 'NSE' },
    { symbol: 'IDEA.NS', name: 'Vodafone Idea Limited', price: 12.34, change: 0.56, changePercent: 4.75, exchange: 'NSE' },
    
    // Steel & Mining
    { symbol: 'TATASTEEL.NS', name: 'Tata Steel Limited', price: 123.45, change: -2.34, changePercent: -1.86, exchange: 'NSE' },
    { symbol: 'JSWSTEEL.NS', name: 'JSW Steel Limited', price: 789.12, change: 15.67, changePercent: 2.03, exchange: 'NSE' },
    { symbol: 'HINDALCO.NS', name: 'Hindalco Industries', price: 456.78, change: 8.90, changePercent: 1.99, exchange: 'NSE' },
    { symbol: 'VEDL.NS', name: 'Vedanta Limited', price: 345.67, change: -6.78, changePercent: -1.92, exchange: 'NSE' },
    
    // Cement Sector
    { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement Limited', price: 8901.23, change: 134.56, changePercent: 1.54, exchange: 'NSE' },
    { symbol: 'SHREECEM.NS', name: 'Shree Cement Limited', price: 23456.78, change: -345.67, changePercent: -1.45, exchange: 'NSE' },
    { symbol: 'ACC.NS', name: 'ACC Limited', price: 2345.67, change: 34.56, changePercent: 1.50, exchange: 'NSE' },
    
    // Others
    { symbol: 'LT.NS', name: 'Larsen & Toubro Limited', price: 3456.78, change: 45.67, changePercent: 1.34, exchange: 'NSE' },
    { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Limited', price: 3456.78, change: -45.67, changePercent: -1.30, exchange: 'NSE' },
    { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Limited', price: 7890.12, change: 123.45, changePercent: 1.59, exchange: 'NSE' },
    { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv Limited', price: 1567.89, change: -23.45, changePercent: -1.47, exchange: 'NSE' },
    { symbol: 'TITAN.NS', name: 'Titan Company Limited', price: 3456.78, change: 56.78, changePercent: 1.67, exchange: 'NSE' },
    { symbol: 'GRASIM.NS', name: 'Grasim Industries Limited', price: 2345.67, change: -34.56, changePercent: -1.45, exchange: 'NSE' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 1) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        const filtered = popularStocks.filter(stock =>
          stock.name.toLowerCase().includes(query.toLowerCase()) ||
          stock.symbol.toLowerCase().includes(query.toLowerCase())
        );
        setSuggestions(filtered);
        setShowSuggestions(true);
        setIsLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const handleStockSelect = (stock: Stock) => {
    setQuery(stock.symbol);
    setShowSuggestions(false);
    onStockSelect(stock.symbol);
  };

  const handleInputFocus = () => {
    if (query.length > 1) {
      setShowSuggestions(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      setShowSuggestions(false);
      onStockSelect(query.trim());
    }
  };

  const handleSearchClick = () => {
    if (query.trim()) {
      setShowSuggestions(false);
      onStockSelect(query.trim());
    }
  };

  return (
    <div className="flex justify-center w-full">
      <div ref={searchRef} className="relative w-full max-w-lg">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search stocks (e.g., RELIANCE, TCS, HDFCBANK)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={handleInputFocus}
              onKeyPress={handleKeyPress}
              className="pl-12 pr-4 py-3 bg-background/95 backdrop-blur border-border rounded-full text-center hover:border-green-500/50 focus:border-green-500 transition-all duration-300"
            />
          </div>
          <Button 
            onClick={handleSearchClick}
            className="rounded-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white"
            disabled={!query.trim()}
          >
            Search
          </Button>
        </div>

        {showSuggestions && (suggestions.length > 0 || isLoading) && (
          <Card className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto z-[99999] bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl">
            <div className="p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                </div>
              ) : (
                <>
                  {suggestions.map((stock) => (
                    <div
                      key={stock.symbol}
                      onClick={() => handleStockSelect(stock)}
                      className="flex items-center justify-between p-3 hover:bg-accent/50 cursor-pointer rounded-lg transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{stock.symbol.replace('.NS', '')}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {stock.exchange}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {stock.name}
                        </div>
                      </div>
                      {stock.price && (
                        <div className="text-right ml-4">
                          <div className="text-sm font-medium">₹{stock.price.toFixed(2)}</div>
                          <div className={`flex items-center text-xs ${
                            (stock.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {(stock.change || 0) >= 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {(stock.change || 0) >= 0 ? '+' : ''}{stock.change?.toFixed(2)} ({stock.changePercent?.toFixed(2)}%)
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {query.trim() && suggestions.length === 0 && (
                    <div 
                      onClick={() => onStockSelect(query.trim())}
                      className="flex items-center gap-3 p-3 hover:bg-accent/50 cursor-pointer rounded-lg transition-colors border-t border-border/50"
                    >
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Search for "{query.trim()}"</div>
                        <div className="text-xs text-muted-foreground">Press Enter or click to analyze this stock</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StockSearch;
