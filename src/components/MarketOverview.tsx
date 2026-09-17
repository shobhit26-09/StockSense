import { useState, useEffect, useCallback } from 'react';
import { Clock, Zap, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { fetchQuoteRacing } from '@/services/multiSourceDataService';

interface MarketData {
  tradingSession: string;
  vix: number;
  vixChange: number;
  nextEvent: string;
}

const MarketOverview = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [data, setData] = useState<MarketData>({
    tradingSession: 'Closed',
    vix: 0,
    vixChange: 0,
    nextEvent: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  const getMarketSession = useCallback((date: Date) => {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const day = date.getDay();
    const timeInMinutes = hour * 60 + minute;
    
    // Weekend check
    if (day === 0 || day === 6) {
      return { session: 'Closed', next: 'Opens Mon 9:15 AM' };
    }
    
    const preMarketStart = 9 * 60;
    const marketOpen = 9 * 60 + 15;
    const marketClose = 15 * 60 + 30;
    const postMarketEnd = 16 * 60;
    
    if (timeInMinutes >= preMarketStart && timeInMinutes < marketOpen) {
      return { session: 'Pre-Market', next: 'Opens at 9:15 AM' };
    } else if (timeInMinutes >= marketOpen && timeInMinutes < marketClose) {
      return { session: 'Live Trading', next: 'Closes at 3:30 PM' };
    } else if (timeInMinutes >= marketClose && timeInMinutes < postMarketEnd) {
      return { session: 'Post-Market', next: 'Opens tomorrow 9:15 AM' };
    }
    return { session: 'Closed', next: 'Opens tomorrow 9:15 AM' };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const { session, next } = getMarketSession(now);
      setData(prev => ({
        ...prev,
        tradingSession: session,
        nextEvent: next
      }));
    }, 1000);

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const quote = await fetchQuoteRacing('^INDIAVIX', 5000);
        if (quote) {
          setData(prev => ({
            ...prev,
            vix: quote.price,
            vixChange: quote.changePercent
          }));
        }
      } catch (err) {
        console.error('Error fetching VIX:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);

    return () => {
      clearInterval(timer);
      clearInterval(interval);
    };
  }, [getMarketSession]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getSessionStyles = (session: string) => {
    switch (session) {
      case 'Live Trading': 
        return { 
          text: 'text-success', 
          bg: 'bg-success/10', 
          border: 'border-success/20',
          icon: 'text-success'
        };
      case 'Pre-Market': 
      case 'Post-Market': 
        return { 
          text: 'text-warning', 
          bg: 'bg-warning/10', 
          border: 'border-warning/20',
          icon: 'text-warning'
        };
      default: 
        return { 
          text: 'text-muted-foreground', 
          bg: 'bg-muted', 
          border: 'border-border',
          icon: 'text-muted-foreground'
        };
    }
  };

  const getVixStatus = (vix: number) => {
    if (vix > 20) return { text: 'High Volatility', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' };
    if (vix > 15) return { text: 'Moderate', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' };
    return { text: 'Low Volatility', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' };
  };

  const sessionStyles = getSessionStyles(data.tradingSession);
  const vixStatus = getVixStatus(data.vix);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Time & Date */}
      <div className="premium-card p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Clock className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-2xl font-mono font-bold text-foreground tracking-tight">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatDate(currentTime)} • IST
          </div>
        </div>
      </div>

      {/* Session Status */}
      <div className={`premium-card p-5 flex items-center gap-4 border ${sessionStyles.border}`}>
        <div className={`w-12 h-12 rounded-xl ${sessionStyles.bg} flex items-center justify-center`}>
          <Zap className={`w-6 h-6 ${sessionStyles.icon}`} />
        </div>
        <div className="flex-1">
          <div className={`text-xl font-bold ${sessionStyles.text}`}>
            {data.tradingSession}
          </div>
          <div className="text-sm text-muted-foreground">
            {data.nextEvent || 'NSE • BSE'}
          </div>
        </div>
        {data.tradingSession === 'Live Trading' && (
          <div className="w-3 h-3 bg-success rounded-full live-indicator" />
        )}
      </div>

      {/* India VIX */}
      <div className={`premium-card p-5 flex items-center gap-4 border ${vixStatus.border}`}>
        <div className={`w-12 h-12 rounded-xl ${vixStatus.bg} flex items-center justify-center`}>
          <BarChart3 className={`w-6 h-6 ${vixStatus.color}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-mono font-bold ${vixStatus.color}`}>
              {isLoading ? '—' : data.vix.toFixed(2)}
            </span>
            {!isLoading && data.vixChange !== 0 && (
              <span className={`flex items-center gap-0.5 text-xs font-mono px-1.5 py-0.5 rounded ${
                data.vixChange >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
              }`}>
                {data.vixChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {data.vixChange >= 0 ? '+' : ''}{data.vixChange.toFixed(2)}%
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            India VIX
            <span className={`text-[10px] px-2 py-0.5 rounded-md ${vixStatus.bg} ${vixStatus.color} font-medium`}>
              {vixStatus.text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;
