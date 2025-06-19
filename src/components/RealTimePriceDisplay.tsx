import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Radio, Pause, Play, Clock } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useRealTimeStock } from '@/hooks/useRealTimeStock';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface RealTimePriceDisplayProps {
  symbol: string;
  companyName?: string;
}

const RealTimePriceDisplay: React.FC<RealTimePriceDisplayProps> = ({ 
  symbol, 
  companyName 
}) => {
  const { isDark } = useTheme();
  const [isEnabled, setIsEnabled] = React.useState(true);
  const [logoError, setLogoError] = React.useState(false);

  const { data, isLoading, error, startPolling, stopPolling, isMarketOpen } = useRealTimeStock({
    symbol,
    interval: 10000, // Update every 10 seconds
    enabled: isEnabled
  });

  const toggleRealTime = () => {
    if (isEnabled) {
      stopPolling();
    } else {
      startPolling();
    }
    setIsEnabled(!isEnabled);
  };

  // Extract base symbol (remove exchange suffixes like .NS, .BO)
  const baseSymbol = symbol.replace(/\.(NS|BO)$/, '').toUpperCase();
  
  // Logo URL (using Screener.in or alternative service)
  const logoUrl = `https://financialmodelingprep.com/image-stock/${symbol}.png`;

  // Fallback initials for Avatar
  const getInitials = (name?: string): string => {
    if (!name || name.trim() === '') {
      return baseSymbol.substring(0, 2);
    }
    return name
      .split(' ')
      .map((word) => word[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (!data && !isLoading) {
    return null;
  }

  return (
    <Card className={`${
      isDark 
        ? 'bg-gray-900/50 border-gray-700' 
        : 'bg-white/80 border-gray-200'
    } shadow-lg mb-4`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Avatar with Logo */}
            <Avatar className="h-12 w-12">
              {!logoError ? (
                <AvatarImage 
                  src={logoUrl} 
                  alt={`${companyName || baseSymbol} logo`} 
                  className="object-contain bg-white"
                  onError={() => setLogoError(true)} // Fallback to initials if image fails
                />
              ) : null}
              <AvatarFallback className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                {getInitials(companyName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {companyName || baseSymbol}
                </h2>
                {isMarketOpen ? (
                  isEnabled && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <Radio className="h-3 w-3 mr-1 animate-pulse" />
                      LIVE
                    </Badge>
                  )
                ) : (
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                    <Clock className="h-3 w-3 mr-1" />
                    CLOSED
                  </Badge>
                )}
              </div>
              
              {/* Price and Change */}
              {data && (
                <div className="flex items-center gap-4">
                  <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    ₹{data.price.toFixed(2)}
                  </div>
                  <div className={`flex items-center gap-1 ${
                    data.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {data.change >= 0 ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                    <span className="text-lg font-semibold">
                      {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} 
                      ({data.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              )}
              
              {/* Last Updated */}
              {data?.lastUpdated && (
                <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Last updated: {data.lastUpdated}
                  {!isMarketOpen && ' (Market Closed)'}
                </p>
              )}
            </div>
          </div>
          
          {/* Volume and Toggle Button */}
          <div className="flex items-center gap-2">
            {data?.volume && (
              <div className={`text-right ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <p className="text-sm">Volume</p>
                <p className="font-semibold">
                  {data.volume.toLocaleString()}
                </p>
              </div>
            )}
            
            <Button
              onClick={toggleRealTime}
              variant={isEnabled ? "default" : "outline"}
              size="sm"
              className={`ml-4 ${isEnabled ? "bg-green-500 hover:bg-green-600" : ""}`}
              disabled={!isMarketOpen}
            >
              {isEnabled ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Loading/Error States */}
        {isLoading && isMarketOpen && (
          <div className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Updating price...
          </div>
        )}
        
        {!isMarketOpen && (
          <div className={`mt-2 text-sm ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
            Market is closed - prices will not update
          </div>
        )}
        
        {error && (
          <div className="mt-2 text-sm text-red-500">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimePriceDisplay;