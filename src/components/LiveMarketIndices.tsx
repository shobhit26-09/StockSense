
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';

interface IndexData {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  chartData: Array<{ time: string; price: number }>;
  lastUpdate: Date;
}

const LiveMarketIndices = () => {
  const { isDark } = useTheme();
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  const getMarketStatus = () => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const day = istTime.getDay();
    const totalMinutes = hours * 60 + minutes;

    const marketOpenTime = 9 * 60 + 15; // 9:15 AM
    const marketCloseTime = 15 * 60 + 30; // 3:30 PM

    const isWeekend = day === 0 || day === 6;
    const isMarketHours = totalMinutes >= marketOpenTime && totalMinutes <= marketCloseTime;
    const isWeekday = day >= 1 && day <= 5;

    if (isWeekend) return { status: 'Closed', color: 'red', text: 'Weekend', isOpen: false };
    if (isWeekday && isMarketHours) return { status: 'Open', color: 'green', text: 'Live Trading', isOpen: true };
    if (hours < 9) return { status: 'Pre-Market', color: 'yellow', text: 'Before Market', isOpen: false };
    return { status: 'Closed', color: 'red', text: 'After Market', isOpen: false };
  };

  const fetchRealIndexData = async (symbol: string): Promise<IndexData | null> => {
    try {
      const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
      const YFINANCE_API_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';

      // Use correct Yahoo Finance symbols for Indian indices
      let yfinanceSymbol = symbol;
      if (symbol === 'NIFTY') yfinanceSymbol = '^NSEI';
      if (symbol === 'BANKNIFTY') yfinanceSymbol = '^NSEBANK';
      if (symbol === 'SENSEX') yfinanceSymbol = '^BSESN';

      const chartUrl = `${YFINANCE_API_BASE}${yfinanceSymbol}?interval=1m&range=1d&includePrePost=false`;
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(chartUrl)}`);

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        throw new Error('Invalid chart data received');
      }

      const chartResult = data.chart.result[0];
      const meta = chartResult.meta;
      const timestamps = chartResult.timestamp || [];
      const prices = chartResult.indicators?.quote?.[0] || {};

      const currentPrice = meta.regularMarketPrice || 0;
      const previousClose = meta.chartPreviousClose || meta.previousClose || 0;
      const change = currentPrice - previousClose;
      const changePercent = previousClose ? (change / previousClose) * 100 : 0;

      console.log(`${symbol} - Current: ${currentPrice}, Previous: ${previousClose}, Change: ${change}`);

      // Build chart data from recent timestamps and prices
      const chartData = timestamps.slice(-10).map((timestamp: number, index: number) => {
        const priceIndex = timestamps.length - 10 + index;
        const price = prices.close?.[priceIndex] || currentPrice;
        return {
          time: new Date(timestamp * 1000).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          price: price
        };
      }).filter((item: any) => item.price && !isNaN(item.price) && item.price > 0);

      // If no valid chart data, create a single point with current price
      if (chartData.length === 0) {
        chartData.push({
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          price: currentPrice
        });
      }

      return {
        name: symbol === 'NIFTY' ? 'Nifty 50' : symbol === 'BANKNIFTY' ? 'Bank Nifty' : 'Sensex',
        symbol,
        price: currentPrice,
        change,
        changePercent,
        high: meta.regularMarketDayHigh || currentPrice,
        low: meta.regularMarketDayLow || currentPrice,
        volume: meta.regularMarketVolume || 0,
        chartData,
        lastUpdate: new Date()
      };
    } catch (error) {
      console.error(`Error fetching ${symbol} data:`, error);
      throw error;
    }
  };

  const updateIndices = async () => {
    const marketStatus = getMarketStatus();

    console.log(`Updating indices - Market Status: ${marketStatus.status}`);

    try {
      setError(null);
      const symbols = ['NIFTY', 'BANKNIFTY', 'SENSEX'];
      const promises = symbols.map(symbol => fetchRealIndexData(symbol));
      const results = await Promise.allSettled(promises);

      const validIndices = results
        .filter((result): result is PromiseFulfilledResult<IndexData> =>
          result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);

      if (validIndices.length > 0) {
        setIndices(validIndices);
        console.log('Updated indices:', validIndices.map(i => `${i.symbol}: ${i.price}`));
      } else {
        setError('Failed to fetch market data');
        console.error('No valid indices data received');
      }

      setLastUpdateTime(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Error updating indices:', error);
      setError('Failed to update market data');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    updateIndices();

    // Set up interval for updates
    const interval = setInterval(() => {
      const marketStatus = getMarketStatus();

      if (marketStatus.isOpen) {
        // Update every 30 seconds during market hours
        updateIndices();
      } else {
        // Just update the time display when market is closed
        console.log('Market closed, not updating prices');
        setLastUpdateTime(new Date());
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const formatTooltip = (value: number) => [`₹${value?.toFixed(2)}`, 'Price'];

  const marketStatus = getMarketStatus();

  if (loading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && indices.length === 0) {
    return (
      <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-red-500 mb-2">{error}</p>
            <button
              onClick={updateIndices}
              className="text-blue-500 hover:text-blue-600 text-sm"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-gray-900 dark:text-white">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
              <Activity className="h-6 w-6 text-white" />
            </div>
            Market Indices (Live)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              className={`text-sm py-1 px-2 border ${marketStatus.status === 'Open'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300 border-green-300/40'
                  : marketStatus.status === 'Pre-Market'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-300 border-yellow-300/40'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300 border-red-300/40'
                }`}
            >
              <span className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${marketStatus.status === 'Open'
                      ? 'bg-green-500 animate-pulse'
                      : marketStatus.status === 'Pre-Market'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                ></div>
                {marketStatus.text}
              </span>
            </Badge>
            {marketStatus.status === 'Open' ? (
              <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
            ) : (
              <div className="h-4 w-4 text-gray-400">⏸</div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {indices.map((index) => (
          <div
            key={index.symbol}
            className="group p-5 rounded-2xl border dark:border-gray-800 border-gray-200 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 transition hover:scale-[1.015] hover:shadow-xl"
          >
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{index.name}</h3>
                  <Badge
                    variant="outline"
                    className="text-xs font-medium bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                  >
                    {index.symbol}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₹{index.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                  <div
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${index.change >= 0
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}
                  >
                    {index.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {index.change >= 0 ? '+' : ''}
                    {index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 text-xs text-gray-600 dark:text-gray-400 pt-2">
                  <div>
                    <div className="text-gray-500">High</div>
                    <div className="font-medium text-sm">
                      ₹{index.high.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Low</div>
                    <div className="font-medium text-sm">
                      ₹{index.low.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Volume</div>
                    <div className="font-medium text-sm">{(index.volume / 100000).toFixed(1)}L</div>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-56 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={index.chartData}>
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={['dataMin - 20', 'dataMax + 20']} />
                    <Tooltip
                      formatter={formatTooltip}
                      labelFormatter={(label) => `Time: ${label}`}
                      contentStyle={{
                        backgroundColor: isDark ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.95)',
                        border: isDark ? '1px solid rgba(75,85,99,0.3)' : '1px solid rgba(229,231,235,0.8)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={index.change >= 0 ? '#10b981' : '#ef4444'}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{
                        r: 4,
                        stroke: index.change >= 0 ? '#10b981' : '#ef4444',
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ))}

        <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-5 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${marketStatus.status === 'Open' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}
            ></div>
            {marketStatus.isOpen
              ? 'Live data refreshing every 30s'
              : `Market ${marketStatus.status.toLowerCase()} - showing last traded price`} • Last updated: {lastUpdateTime.toLocaleTimeString('en-IN')}
          </div>
        </div>
      </CardContent>
    </Card>

  );
};

export default LiveMarketIndices;
