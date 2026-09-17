import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, StarOff, TrendingUp, TrendingDown, Trash2, Plus } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  addedAt: string;
}

interface WatchlistProps {
  currentStock?: any;
  onStockSelect: (symbol: string) => void;
}

const Watchlist: React.FC<WatchlistProps> = ({ currentStock, onStockSelect }) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const { isDark } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('stockWatchlist');
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch (error) {
        console.error('Error parsing watchlist from localStorage:', error);
        setWatchlist([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('stockWatchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const addToWatchlist = () => {
    console.log('Adding to watchlist - currentStock:', currentStock);
    
    if (!currentStock) {
      toast({
        title: "No stock selected",
        description: "Please analyze a stock first to add it to your watchlist",
        variant: "destructive",
      });
      return;
    }

    // Extract stock data from different possible structures
    const stockSymbol = currentStock.symbol || 
                       currentStock.info?.symbol || 
                       (typeof currentStock === 'string' ? currentStock : null);
    
    const stockName = currentStock.info?.longName || 
                     currentStock.info?.shortName || 
                     currentStock.name ||
                     stockSymbol || 
                     'Unknown Stock';
    
    const stockPrice = currentStock.info?.currentPrice || 
                      currentStock.info?.regularMarketPrice || 
                      currentStock.price ||
                      0;
    
    const stockChange = currentStock.info?.regularMarketChange || 
                       currentStock.change ||
                       0;
    
    const stockChangePercent = currentStock.info?.regularMarketChangePercent || 
                              currentStock.changePercent ||
                              0;

    if (!stockSymbol) {
      toast({
        title: "Invalid stock data",
        description: "Unable to extract stock information",
        variant: "destructive",
      });
      return;
    }

    console.log('Extracted stock data:', { stockSymbol, stockName, stockPrice, stockChange, stockChangePercent });

    const newItem: WatchlistItem = {
      symbol: stockSymbol,
      name: stockName,
      price: stockPrice,
      change: stockChange,
      changePercent: stockChangePercent,
      addedAt: new Date().toISOString(),
    };

    const isAlreadyInWatchlist = watchlist.some(item => 
      item.symbol.toLowerCase() === newItem.symbol.toLowerCase()
    );
    
    if (isAlreadyInWatchlist) {
      toast({
        title: "Already in Watchlist",
        description: "This stock is already in your watchlist",
        variant: "destructive",
      });
      return;
    }

    setWatchlist(prev => {
      const updated = [newItem, ...prev];
      console.log('Updated watchlist:', updated);
      return updated;
    });
    
    toast({
      title: "Added to Watchlist",
      description: `${newItem.name} has been added to your watchlist`,
    });
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(item => 
      item.symbol.toLowerCase() !== symbol.toLowerCase()
    ));
    toast({
      title: "Removed from Watchlist",
      description: "Stock has been removed from your watchlist",
    });
  };

  const getCurrentStockSymbol = () => {
    return currentStock?.symbol || 
           currentStock?.info?.symbol || 
           (typeof currentStock === 'string' ? currentStock : null);
  };

  const isInWatchlist = currentStock && watchlist.some(item => {
    const currentSymbol = getCurrentStockSymbol();
    return currentSymbol && item.symbol.toLowerCase() === currentSymbol.toLowerCase();
  });

  return (
    <Card className={`backdrop-blur-xl rounded-2xl shadow-xl border ${
      isDark 
        ? 'bg-gray-900/50 border-gray-800/50' 
        : 'bg-white/50 border-gray-200/50'
    }`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-3 text-xl ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600">
              <Star className="h-5 w-5 text-black" />
            </div>
            My Watchlist
          </CardTitle>
          {currentStock && (
            <Button
              onClick={addToWatchlist}
              disabled={isInWatchlist}
              variant={isInWatchlist ? "secondary" : "default"}
              size="sm"
              className={`${
                isInWatchlist 
                  ? "opacity-60" 
                  : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-black"
              } transition-all duration-200`}
            >
              {isInWatchlist ? (
                <>
                  <StarOff className="h-4 w-4 mr-2" />
                  In Watchlist
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stock
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {watchlist.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <div className={`p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center ${
              isDark 
                ? 'bg-gradient-to-br from-gray-800 to-gray-700' 
                : 'bg-gradient-to-br from-gray-100 to-gray-200'
            }`}>
              <Star className={`h-10 w-10 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your watchlist is empty</h3>
            <p className="text-sm opacity-80">Analyze a stock and add it to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {watchlist.map((item, index) => (
              <div
                key={`${item.symbol}-${index}`}
                className={`group p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                  isDark 
                    ? 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70' 
                    : 'bg-white/70 border-gray-200/50 hover:bg-white/90'
                }`}
                onClick={() => onStockSelect(item.symbol)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`font-bold text-lg ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {item.symbol.replace('.NS', '')}
                      </span>
                      <Badge variant="outline" className={`text-xs ${
                        isDark 
                          ? 'bg-green-900/30 text-green-400 border-green-500/30' 
                          : 'bg-green-100 text-green-800 border-green-300'
                      }`}>
                        NSE
                      </Badge>
                    </div>
                    <p className={`text-sm truncate ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {item.name}
                    </p>
                  </div>
                  <div className="text-right mr-4">
                    <div className={`font-bold text-lg ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      ₹{item.price.toFixed(2)}
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      item.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {item.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {item.changePercent.toFixed(2)}%
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWatchlist(item.symbol);
                    }}
                    variant="ghost"
                    size="sm"
                    className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-700 ${
                      isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Watchlist;
