
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Radio, Pause, Play, Clock } from 'lucide-react';
import { useRealTimeStock } from '@/hooks/useRealTimeStock';

interface RealTimePriceDisplayProps {
  symbol: string;
  companyName?: string;
}

const RealTimePriceDisplay: React.FC<RealTimePriceDisplayProps> = ({ 
  symbol, 
  companyName 
}) => {
  const [isEnabled, setIsEnabled] = React.useState(true);
  
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

  const baseSymbol = symbol.replace('.NS', '').replace('.BO', '');

  if (!data && !isLoading) {
    return null;
  }

  return (
    <div className="rounded-md border border-border/50 bg-card/40 p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {data && (
                <span className="text-3xl font-mono font-bold text-foreground tabular-nums">
                  ₹{data.price.toFixed(2)}
                </span>
              )}
              {data && (
                <span className={`flex items-center gap-0.5 text-sm font-mono font-medium ${data.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {data.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} ({data.changePercent.toFixed(2)}%)
                </span>
              )}
              {isMarketOpen ? (
                isEnabled && (
                  <Badge variant="outline" className="text-[10px] border-success/30 text-success bg-success/5">
                    <Radio className="h-2.5 w-2.5 mr-1 animate-pulse" /> LIVE
                  </Badge>
                )
              ) : (
                <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                  <Clock className="h-2.5 w-2.5 mr-1" /> CLOSED
                </Badge>
              )}
            </div>
            {data?.lastUpdated && (
              <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                Updated {data.lastUpdated}{!isMarketOpen && ' · Market closed'}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {data?.volume && (
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Volume</div>
              <div className="text-sm font-mono text-foreground">{data.volume.toLocaleString()}</div>
            </div>
          )}
          <Button
            onClick={toggleRealTime}
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={!isMarketOpen}
          >
            {isEnabled ? <><Pause className="h-3 w-3 mr-1.5" />Pause</> : <><Play className="h-3 w-3 mr-1.5" />Resume</>}
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="mt-3 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
};

export default RealTimePriceDisplay;
