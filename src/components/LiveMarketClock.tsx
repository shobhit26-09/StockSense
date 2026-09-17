
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

const LiveMarketClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      
      // Convert to Indian Standard Time
      const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      setCurrentTime(istTime);
      
      // Check if market is open (Monday-Friday, 9:15 AM - 3:30 PM IST)
      const day = istTime.getDay(); // Sunday - 0, Monday - 1, ...
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      const totalMinutes = hours * 60 + minutes;
      
      const marketOpenTime = 9 * 60 + 15; // 9:15 AM
      const marketCloseTime = 15 * 60 + 30; // 3:30 PM
      
      const isWeekday = day >= 1 && day <= 5;
      const isDuringMarketHours = totalMinutes >= marketOpenTime && totalMinutes <= marketCloseTime;
      
      setIsMarketOpen(isWeekday && isDuringMarketHours);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(' ', ''); // Compact AM/PM
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="w-64 p-4 rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline gap-2 text-slate-900 dark:text-white">
          <Clock className="h-4 w-4" />
          <span className="text-2xl font-bold tracking-tight">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">IST</span>
        </div>
        <Badge className={`px-2.5 py-1 text-xs font-semibold rounded-full border-transparent ${
          isMarketOpen 
            ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' 
            : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
        }`}>
          {isMarketOpen ? 'Open' : 'Closed'}
        </Badge>
      </div>
      <div className="text-center text-xs text-slate-600 dark:text-slate-400">
        {formatDate(currentTime)}
      </div>
    </div>
  );
};

export default LiveMarketClock;
