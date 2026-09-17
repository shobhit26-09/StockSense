import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Star, StarOff, Plus } from 'lucide-react';
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

interface WatchlistButtonProps {
  currentStock?: any;
}

const WatchlistButton: React.FC<WatchlistButtonProps> = ({ currentStock }) => {
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
    if (!currentStock) {
      toast({
        title: "No stock selected",
        description: "Please analyze a stock first to add it to your watchlist",
        variant: "destructive",
      });
      return;
    }

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
      removeFromWatchlist(stockSymbol);
      return;
    }

    setWatchlist(prev => [newItem, ...prev]);
    
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

  if (!currentStock) {
    return null;
  }

  return (
    <Button
      onClick={addToWatchlist}
      variant={isInWatchlist ? "outline" : "default"}
      size="lg"
      className={`${
        isInWatchlist 
          ? isDark 
            ? "border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10" 
            : "border-yellow-500 text-yellow-600 hover:bg-yellow-50"
          : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black"
      } transition-all duration-200 px-6 py-3 rounded-xl font-semibold`}
    >
      {isInWatchlist ? (
        <>
          <Star className="h-5 w-5 mr-2 fill-current" />
          In Watchlist
        </>
      ) : (
        <>
          <Plus className="h-5 w-5 mr-2" />
          Add to Watchlist
        </>
      )}
    </Button>
  );
};

export default WatchlistButton;