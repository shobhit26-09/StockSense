import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3, Search } from 'lucide-react';
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

  // Get stock info
  const currentPrice = data?.info?.regularMarketPrice || 0;
  const previousClose = data?.info?.regularMarketPreviousClose || 0;
  const priceChange = currentPrice - previousClose;
  const priceChangePercent = previousClose ? ((priceChange / previousClose) * 100) : 0;
  const isPositive = priceChange >= 0;
  const symbol = data?.info?.symbol || 'N/A';

  // Convert symbol to TradingView format, prioritizing BSE for better compatibility
  const convertToTradingViewSymbol = (stockSymbol: string): string => {
    if (!stockSymbol || stockSymbol === 'N/A') return 'BSE:SENSEX';
    
    // Extract base symbol by removing exchange suffixes
    let baseSymbol = stockSymbol.replace('.NS', '').replace('.BO', '').toUpperCase();
    
    // The free TradingView widget has better support for BSE symbols.
    // We will default to using the BSE prefix for broader compatibility.
    // For example, both 'RELIANCE.NS' and 'RELIANCE.BO' will be converted to 'BSE:RELIANCE'.
    return `BSE:${baseSymbol}`;
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

    // Clear container
    containerRef.current.innerHTML = '';
    setIsLoading(true);

    const tradingViewSymbol = data?.info?.symbol ? convertToTradingViewSymbol(data.info.symbol) : 'BSE:SENSEX';
    setCurrentSymbol(tradingViewSymbol);

    console.log('Creating TradingView widget with symbol:', tradingViewSymbol);

    // Create the widget with proper configuration
    const widgetConfig = {
      "width": "100%",
      "height": "600",
      "symbol": tradingViewSymbol,
      "interval": "D",
      "timezone": "Asia/Kolkata",
      "theme": isDark ? "dark" : "light",
      "style": "1",
      "locale": "en",
      "toolbar_bg": isDark ? "#1f2937" : "#ffffff",
      "enable_publishing": false,
      "withdateranges": true,
      "hide_side_toolbar": false,
      "allow_symbol_change": true,
      "show_popup_button": true,
      "popup_width": "1000",
      "popup_height": "650",
      "no_referral_id": true,
      "container_id": "tradingview_widget"
    };

    // Create widget container with ID
    const widgetDiv = document.createElement('div');
    widgetDiv.id = 'tradingview_widget';
    widgetDiv.style.height = '600px';
    widgetDiv.style.width = '100%';
    containerRef.current.appendChild(widgetDiv);

    // Load TradingView script if not already loaded
    if (!window.TradingView) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.onload = () => {
        initializeWidget(widgetConfig);
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
        
        // Set loading to false after widget is created
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
        
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

  useEffect(() => {
    const timer = setTimeout(() => {
      createTradingViewWidget();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          console.log('Cleanup error:', e);
        }
      }
    };
  }, [data?.info?.symbol, isDark]);

  return (
    <Card className={`${
      isDark 
        ? 'bg-gray-900/70 border-gray-700/50 backdrop-blur-xl' 
        : 'bg-white/90 border-gray-200/50 backdrop-blur-xl shadow-xl'
    } transition-all duration-300`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-3 text-xl ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            TradingView Chart
            <Badge variant="outline" className={`ml-2 ${
              isDark 
                ? 'bg-gray-800 text-gray-300 border-gray-600' 
                : 'bg-gray-50 text-gray-700 border-gray-300'
            }`}>
              {currentSymbol} • Interactive
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-4">
            {onSearchClick && (
              <Button
                onClick={onSearchClick}
                variant="outline"
                size="sm"
                className={`${
                  isDark 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white' 
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Search className="h-4 w-4 mr-2" />
                Search New Stock
              </Button>
            )}
            
            {currentPrice > 0 && (
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  ₹{currentPrice.toFixed(2)}
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  isPositive 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  <TrendingUp className={`h-4 w-4 ${!isPositive ? 'rotate-180' : ''}`} />
                  {isPositive ? '+' : ''}₹{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Loading TradingView Chart...
                </p>
              </div>
            </div>
          )}
          
          <div 
            ref={containerRef}
            className="w-full rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 min-h-[600px]"
          />
          
          <div className="mt-4 text-center">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Use the search icon in the top toolbar of the chart to search for any stock symbol.
              Click on the symbol name to change it or use the search functionality within the widget.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockChart;
