import PremiumLoader from '@/components/PremiumLoader';

import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Search, Maximize2, RefreshCw } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useRef, useState } from 'react';

// Declare TradingView types
declare global {
  interface Window {
    TradingView: any;
  }
}

interface StockChartProps {
  data: any;
  onSearchClick?: () => void;
}

const StockChart = ({ data, onSearchClick }: StockChartProps) => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [currentSymbol, setCurrentSymbol] = useState('BSE:SENSEX');
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Get stock info with better error handling
  const currentPrice = data?.info?.regularMarketPrice || data?.info?.currentPrice || 0;
  const previousClose = data?.info?.regularMarketPreviousClose || data?.info?.previousClose || 0;
  const priceChange = currentPrice - previousClose;
  const priceChangePercent = previousClose ? ((priceChange / previousClose) * 100) : 0;
  const isPositive = priceChange >= 0;
  const symbol = data?.info?.symbol || 'N/A';
  const companyName = data?.info?.longName || data?.info?.shortName || 'Unknown Company';

  // Enhanced symbol conversion for better TradingView compatibility
  const convertToTradingViewSymbol = (stockSymbol: string): string => {
    if (!stockSymbol || stockSymbol === 'N/A') return 'BSE:SENSEX';
    
    // Clean the symbol
    let baseSymbol = stockSymbol.replace('.NS', '').replace('.BO', '').toUpperCase();
    
    // Popular Indian stocks mapping for better accuracy
    const symbolMapping: { [key: string]: string } = {
      'RELIANCE': 'BSE:RELIANCE',
      'TCS': 'BSE:TCS',
      'INFY': 'BSE:INFY',
      'HDFC': 'BSE:HDFCBANK',
      'HDFCBANK': 'BSE:HDFCBANK',
      'ICICIBANK': 'BSE:ICICIBANK',
      'SBIN': 'BSE:SBIN',
      'BHARTIARTL': 'BSE:BHARTIARTL',
      'ITC': 'BSE:ITC',
      'KOTAKBANK': 'BSE:KOTAKBANK',
      'LT': 'BSE:LT',
      'ASIANPAINT': 'BSE:ASIANPAINT',
      'MARUTI': 'BSE:MARUTI',
      'WIPRO': 'BSE:WIPRO',
      'TECHM': 'BSE:TECHM'
    };
    
    return symbolMapping[baseSymbol] || `BSE:${baseSymbol}`;
  };

  const createTradingViewWidget = () => {
    if (!containerRef.current) return;

    // Clear any existing widget
    if (widgetRef.current) {
      try {
        widgetRef.current.remove();
      } catch (e) {
        console.log('Error removing existing widget:', e);
      }
    }

    containerRef.current.innerHTML = '';
    setIsLoading(true);

    const tradingViewSymbol = data?.info?.symbol ? convertToTradingViewSymbol(data.info.symbol) : 'BSE:SENSEX';
    setCurrentSymbol(tradingViewSymbol);

    console.log('Creating TradingView widget with symbol:', tradingViewSymbol);

    // Enhanced widget configuration
    const isMobile = window.innerWidth < 768;
    const widgetConfig = {
      "width": "100%",
      "height": isFullscreen ? "700" : isMobile ? "400" : "500",
      "symbol": tradingViewSymbol,
      "interval": "D",
      "timezone": "Asia/Kolkata",
      "theme": isDark ? "dark" : "light",
      "style": "1",
      "locale": "en",
      "toolbar_bg": isDark ? "#0a0a0a" : "#ffffff",
      "enable_publishing": false,
      "withdateranges": true,
      "hide_side_toolbar": isMobile,
      "allow_symbol_change": true,
      "popup_width": "1000",
      "popup_height": "650",
      "no_referral_id": true,
      "container_id": "tradingview_widget",
      "studies": [
        "RSI@tv-basicstudies"
      ],
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    };

    // Create widget container
    const widgetDiv = document.createElement('div');
    widgetDiv.id = 'tradingview_widget';
    widgetDiv.style.height = widgetConfig.height + 'px';
    widgetDiv.style.width = '100%';
    widgetDiv.style.borderRadius = '12px';
    widgetDiv.style.overflow = 'hidden';
    containerRef.current.appendChild(widgetDiv);

    // Load TradingView script
    if (!window.TradingView) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.onload = () => initializeWidget(widgetConfig);
      script.onerror = () => {
        console.error('Failed to load TradingView script');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else {
      initializeWidget(widgetConfig);
    }
  };

  const initializeWidget = (config: any) => {
    try {
      if (window.TradingView && window.TradingView.widget) {
        widgetRef.current = new window.TradingView.widget(config);
        
        // Enhanced loading management
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
        
        console.log('TradingView widget initialized successfully');
      } else {
        console.error('TradingView widget not available');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error initializing TradingView widget:', error);
      setIsLoading(false);
    }
  };

  const refreshChart = () => {
    setIsLoading(true);
    createTradingViewWidget();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      createTradingViewWidget();
    }, 100);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      createTradingViewWidget();
    }, 100);

    // Handle window resize for mobile optimization
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setTimeout(createTradingViewWidget, 200);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          console.log('Cleanup error:', e);
        }
      }
    };
  }, [data?.info?.symbol, isDark, isFullscreen]);

  return (
    <div className="p-5">
      {/* Minimal header: ticker label + monospace price + controls */}
      <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-border/40">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="font-mono">{currentSymbol}</span>
            <span className="h-1 w-1 rounded-full bg-success animate-pulse" />
            <span>Live</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground mt-1 tracking-tight">Price Chart</h2>
          {companyName !== 'Unknown Company' && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{companyName}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {currentPrice > 0 && (
            <div className="text-right hidden sm:block">
              <div className="text-xl font-mono font-semibold text-foreground tabular-nums">
                ₹{currentPrice.toFixed(2)}
              </div>
              <div className={`flex items-center justify-end gap-1 text-xs font-mono ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {isPositive ? '+' : ''}{priceChange.toFixed(2)} · {isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%
              </div>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Button onClick={refreshChart} variant="ghost" size="sm" disabled={isLoading} className="h-8 w-8 p-0">
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={toggleFullscreen} variant="ghost" size="sm" className="h-8 w-8 p-0 hidden sm:flex">
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            {onSearchClick && (
              <Button onClick={onSearchClick} variant="outline" size="sm" className="h-8 ml-1">
                <Search className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline text-xs">Search</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile price */}
      {currentPrice > 0 && (
        <div className="flex items-center justify-between sm:hidden mb-4">
          <div className="text-xl font-mono font-semibold text-foreground">₹{currentPrice.toFixed(2)}</div>
          <div className={`text-xs font-mono ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
          </div>
        </div>
      )}

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg z-10">
            <PremiumLoader size="sm" text="Loading chart" className="py-0" />
          </div>
        )}

        <div
          ref={containerRef}
          className={`w-full rounded-lg overflow-hidden border border-border/40 bg-background ${
            isFullscreen ? 'min-h-[700px]' : 'min-h-[420px] sm:min-h-[500px]'
          }`}
        />

        <p className="mt-3 text-[10px] text-muted-foreground/70 text-center font-mono uppercase tracking-wider">
          Charting by TradingView · RSI overlay enabled
        </p>
      </div>
    </div>
  );
};

export default StockChart;
