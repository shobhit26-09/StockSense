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
      setWatchlist(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('stockWatchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const addToWatchlist = () => {
    if (!currentStock) return;

    const newItem: WatchlistItem = {
      symbol: currentStock.symbol,
      name: currentStock.info.longName || currentStock.symbol,
      price: currentStock.info.currentPrice || 0,
      change: currentStock.info.regularMarketChange || 0,
      changePercent: currentStock.info.regularMarketChangePercent || 0,
      addedAt: new Date().toISOString(),
    };

    if (watchlist.some(item => item.symbol === newItem.symbol)) {
      toast({
        title: 'Already in Watchlist',
        description: 'This stock is already in your watchlist',
        variant: 'destructive',
      });
      return;
    }

    setWatchlist(prev => [newItem, ...prev]);
    toast({
      title: 'Added to Watchlist',
      description: `${newItem.name} has been added to your watchlist`,
    });
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(item => item.symbol !== symbol));
    toast({
      title: 'Removed from Watchlist',
      description: 'Stock has been removed from your watchlist',
    });
  };

  const isInWatchlist = currentStock && watchlist.some(item => item.symbol === currentStock.symbol);

  return (
    <Card
      className={`${
        isDark
          ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/60 border-gray-700'
          : 'bg-gradient-to-br from-white/90 to-blue-50/50 border-gray-200'
      } backdrop-blur-md shadow-xl`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle
            className={`flex items-center gap-3 text-xl ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg">
              <Star className="h-5 w-5 text-white" />
            </div>
            My Watchlist
          </CardTitle>
          {currentStock && (
            <Button
              onClick={addToWatchlist}
              disabled={isInWatchlist}
              variant={isInWatchlist ? 'secondary' : 'default'}
              size="sm"
              className={`transition-all duration-200 ${
                isInWatchlist
                  ? 'opacity-60 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700'
              }`}
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
            <div className="p-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-md">
              <Star className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your watchlist is empty</h3>
            <p className="text-sm opacity-80">Analyze a stock and add it to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {watchlist.map((item, index) => (
              <div
                key={item.symbol}
                className={`group p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                  isDark
                    ? 'bg-gradient-to-r from-gray-800/80 to-gray-700/60 border-gray-600 hover:border-gray-500'
                    : 'bg-gradient-to-r from-white/80 to-gray-50/60 border-gray-200 hover:border-gray-300'
                } backdrop-blur-sm`}
                onClick={() => onStockSelect(item.symbol)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`font-bold text-lg ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {item.symbol.replace('.NS', '')}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                      >
                        NSE
                      </Badge>
                    </div>
                    <p
                      className={`text-sm truncate ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      {item.name}
                    </p>
                  </div>

                  <div className="text-right mr-4">
                    <div
                      className={`font-bold text-lg ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      ₹{item.price.toFixed(2)}
                    </div>
                    <div
                      className={`flex items-center gap-1 text-sm font-medium ${
                        item.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                      }`}
                    >
                      {item.change >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
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
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
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
