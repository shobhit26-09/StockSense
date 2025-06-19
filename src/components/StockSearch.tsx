import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { searchStocks, getPopularStocks, getStocksByCategory, StockInfo } from '@/services/stockSearchService';

interface StockSearchProps {
  onStockSelect: (symbol: string) => void;
  loading: boolean;
}

const categories = ['IT', 'Banking', 'Pharma', 'Auto', 'FMCG', 'Energy', 'Infrastructure'];

const StockSearch: React.FC<StockSearchProps> = ({ onStockSelect, loading }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<StockInfo[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { isDark } = useTheme();

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setSuggestions(getStocksByCategory(selectedCategory));
    } else if (query.trim() === '') {
      setSuggestions(getPopularStocks());
    } else {
      setSuggestions(searchStocks(query, 10));
    }
  }, [query, selectedCategory]);

  const handleStockSelect = (symbol: string) => {
    setQuery(symbol.replace('.NS', ''));
    setShowSuggestions(false);
    setSelectedCategory(null);
    onStockSelect(symbol);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const formattedSymbol = query.includes('.') ? query : `${query.toUpperCase()}.NS`;
      handleStockSelect(formattedSymbol);
    }
  };

  const handleCategoryFilter = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
      setQuery('');
      setShowSuggestions(true);
    }
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setQuery('');
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-3xl mx-auto z-0">
      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {categories.map((category) => (
          <Button
            key={category}
            size="sm"
            variant="ghost"
            className={`rounded-full px-4 h-auto py-1 text-sm font-light transition-all border ${
              selectedCategory === category
                ? isDark
                  ? "border-white bg-white/10 text-white"
                  : "border-black bg-black/10 text-black"
                : isDark
                ? "border-neutral-700 text-gray-400 hover:text-white hover:border-white"
                : "border-neutral-300 text-gray-600 hover:text-black hover:border-black"
            }`}
            onClick={() => handleCategoryFilter(category)}
            type="button"
          >
            {category}
          </Button>
        ))}
        {selectedCategory && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full px-4 h-auto py-1 text-sm font-light text-red-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent"
            onClick={clearFilters}
            type="button"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-20" />
          <Input
            placeholder="Search stocks"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value.toUpperCase());
              setShowSuggestions(true);
              setSelectedCategory(null);
            }}
            onFocus={() => setShowSuggestions(true)}
            className={`pl-12 h-12 rounded-full text-lg font-light border-2 transition-all relative z-10 ${
              isDark 
                ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-white focus:bg-gray-900/70'
                : 'bg-white/90 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-gray-900 focus:bg-white'
            }`}
            autoComplete="off"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className={`h-12 px-8 rounded-full font-light text-lg transition-all z-10 ${
            isDark
              ? 'bg-white text-black hover:bg-gray-100'
              : 'bg-black text-white hover:bg-gray-900'
          }`}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </Button>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[9999]">
          <Card className={`max-h-80 overflow-y-auto rounded-2xl shadow-2xl z-[9999] ${
            isDark 
              ? 'bg-black/50 backdrop-blur-md border border-white/10' 
              : 'bg-white/95 backdrop-blur-sm border-gray-200'
          }`}>
            <CardContent className="p-0">
              {selectedCategory && (
                <div className={`py-3 px-4 text-sm font-medium border-b ${
                  isDark 
                    ? 'text-gray-400 border-gray-700/50' 
                    : 'text-gray-500 border-gray-200/50'
                }`}>
                  {selectedCategory} Stocks ({suggestions.length})
                </div>
              )}
              <div className="py-2">
                {suggestions.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleStockSelect(stock.symbol)}
                    className={`block w-full text-left px-4 py-3 transition-all hover:scale-[1.02] ${
                      isDark
                        ? 'hover:bg-gray-800/50 text-gray-100'
                        : 'hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    <div className="font-medium text-base">
                      {stock.symbol.replace('.NS', '')}
                    </div>
                    <div className={`text-sm font-light ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {stock.name}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StockSearch;
