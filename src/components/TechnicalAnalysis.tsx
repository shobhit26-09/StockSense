
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Activity, BarChart3, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface TechnicalAnalysisProps {
  data: any;
}

const TechnicalAnalysis = ({ data }: TechnicalAnalysisProps) => {
  const { isDark } = useTheme();
  const indicators = data.technicalIndicators || {};
  const currentPrice = data.info?.currentPrice || 0;

  const getRSISignal = (rsi: number) => {
    if (rsi > 70) return { 
      signal: "Strong Sell", 
      color: "bg-red-500", 
      icon: <TrendingDown className="h-4 w-4" />,
      action: "Consider selling - stock is overbought",
      strength: "Strong"
    };
    if (rsi > 60) return { 
      signal: "Sell", 
      color: "bg-orange-500", 
      icon: <TrendingDown className="h-4 w-4" />,
      action: "Watch for selling opportunities",
      strength: "Medium"
    };
    if (rsi < 30) return { 
      signal: "Strong Buy", 
      color: "bg-emerald-500", 
      icon: <TrendingUp className="h-4 w-4" />,
      action: "Consider buying - stock is oversold",
      strength: "Strong"
    };
    if (rsi < 40) return { 
      signal: "Buy", 
      color: "bg-blue-500", 
      icon: <TrendingUp className="h-4 w-4" />,
      action: "Good buying opportunity emerging",
      strength: "Medium"
    };
    return { 
      signal: "Hold", 
      color: "bg-yellow-500", 
      icon: <Activity className="h-4 w-4" />,
      action: "Neutral zone - monitor closely",
      strength: "Neutral"
    };
  };

  const getSMASignal = (price: number, sma: number, period: number) => {
    const deviation = ((price - sma) / sma) * 100;
    if (deviation > 5) return { 
      signal: "Strong Buy", 
      color: "bg-emerald-500", 
      icon: <TrendingUp className="h-4 w-4" />,
      action: `Price ${deviation.toFixed(1)}% above ${period}-day average`,
      strength: "Strong"
    };
    if (deviation > 2) return { 
      signal: "Buy", 
      color: "bg-blue-500", 
      icon: <TrendingUp className="h-4 w-4" />,
      action: `Price trending above ${period}-day average`,
      strength: "Medium"
    };
    if (deviation < -5) return { 
      signal: "Strong Sell", 
      color: "bg-red-500", 
      icon: <TrendingDown className="h-4 w-4" />,
      action: `Price ${Math.abs(deviation).toFixed(1)}% below ${period}-day average`,
      strength: "Strong"
    };
    if (deviation < -2) return { 
      signal: "Sell", 
      color: "bg-orange-500", 
      icon: <TrendingDown className="h-4 w-4" />,
      action: `Price trending below ${period}-day average`,
      strength: "Medium"
    };
    return { 
      signal: "Hold", 
      color: "bg-yellow-500", 
      icon: <Activity className="h-4 w-4" />,
      action: `Price near ${period}-day average`,
      strength: "Neutral"
    };
  };

  const getMACDSignal = (macd: any) => {
    if (!macd || !macd.line || !macd.signal) return { 
      signal: "No Data", 
      color: "bg-gray-500", 
      icon: <Activity className="h-4 w-4" />,
      action: "Insufficient data for analysis",
      strength: "N/A"
    };
    
    const crossover = macd.line - macd.signal;
    if (crossover > 0.5) return { 
      signal: "Strong Buy", 
      color: "bg-emerald-500", 
      icon: <TrendingUp className="h-4 w-4" />,
      action: "MACD line strongly above signal - bullish momentum",
      strength: "Strong"
    };
    if (crossover > 0) return { 
      signal: "Buy", 
      color: "bg-blue-500", 
      icon: <TrendingUp className="h-4 w-4" />,
      action: "MACD line above signal - positive momentum",
      strength: "Medium"
    };
    if (crossover < -0.5) return { 
      signal: "Strong Sell", 
      color: "bg-red-500", 
      icon: <TrendingDown className="h-4 w-4" />,
      action: "MACD line strongly below signal - bearish momentum",
      strength: "Strong"
    };
    if (crossover < 0) return { 
      signal: "Sell", 
      color: "bg-orange-500", 
      icon: <TrendingDown className="h-4 w-4" />,
      action: "MACD line below signal - negative momentum",
      strength: "Medium"
    };
    return { 
      signal: "Hold", 
      color: "bg-yellow-500", 
      icon: <Activity className="h-4 w-4" />,
      action: "MACD signals are mixed",
      strength: "Neutral"
    };
  };

  const rsiSignal = getRSISignal(indicators.rsi || 50);
  const sma20Signal = getSMASignal(currentPrice, indicators.sma20 || currentPrice, 20);
  const sma50Signal = getSMASignal(currentPrice, indicators.sma50 || currentPrice, 50);
  const macdSignal = getMACDSignal(indicators.macd);

  const getOverallSignal = () => {
    const signals = [rsiSignal, sma20Signal, sma50Signal, macdSignal];
    const strongBuyCount = signals.filter(s => s.signal === "Strong Buy").length;
    const buyCount = signals.filter(s => s.signal === "Buy").length;
    const strongSellCount = signals.filter(s => s.signal === "Strong Sell").length;
    const sellCount = signals.filter(s => s.signal === "Sell").length;
    
    const bullishSignals = strongBuyCount + buyCount;
    const bearishSignals = strongSellCount + sellCount;
    
    if (strongBuyCount >= 2 || bullishSignals >= 3) {
      return { 
        signal: "Strong Buy", 
        color: "bg-emerald-500", 
        icon: <CheckCircle className="h-5 w-5" />,
        confidence: Math.min(95, 60 + (bullishSignals * 10)),
        action: "Multiple indicators suggest strong buying opportunity"
      };
    }
    if (bullishSignals > bearishSignals) {
      return { 
        signal: "Buy", 
        color: "bg-blue-500", 
        icon: <TrendingUp className="h-5 w-5" />,
        confidence: 55 + (bullishSignals * 5),
        action: "Majority of indicators suggest buying"
      };
    }
    if (strongSellCount >= 2 || bearishSignals >= 3) {
      return { 
        signal: "Strong Sell", 
        color: "bg-red-500", 
        icon: <AlertTriangle className="h-5 w-5" />,
        confidence: Math.min(95, 60 + (bearishSignals * 10)),
        action: "Multiple indicators suggest strong selling pressure"
      };
    }
    if (bearishSignals > bullishSignals) {
      return { 
        signal: "Sell", 
        color: "bg-orange-500", 
        icon: <TrendingDown className="h-5 w-5" />,
        confidence: 55 + (bearishSignals * 5),
        action: "Majority of indicators suggest selling"
      };
    }
    return { 
      signal: "Hold", 
      color: "bg-yellow-500", 
      icon: <Activity className="h-5 w-5" />,
      confidence: 50,
      action: "Mixed signals - maintain current position"
    };
  };

  const overall = getOverallSignal();

  return (
    <div className="space-y-6">
      {/* Investment Decision Summary */}
      <Card className={`${isDark ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-sm border-0 shadow-xl`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${overall.color} shadow-lg`}>
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Technical Decision</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Based on 4 key indicators</p>
              </div>
            </div>
            <div className="text-right">
              <Badge className={`${overall.color} text-white border-0 text-lg px-4 py-2`}>
                {overall.icon}
                {overall.signal}
              </Badge>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {overall.confidence}% Confidence
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Progress value={overall.confidence} className="flex-1" />
              <span className="text-2xl font-bold">{overall.confidence}%</span>
            </div>
            <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {overall.action}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Individual Indicators with Investment Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            name: "RSI Momentum",
            value: indicators.rsi?.toFixed(1) || 'N/A',
            signal: rsiSignal,
            progress: indicators.rsi || 50,
            description: "Measures if stock is overbought or oversold"
          },
          {
            name: "20-Day Trend",
            value: indicators.sma20 ? `₹${indicators.sma20.toFixed(2)}` : 'N/A',
            signal: sma20Signal,
            progress: currentPrice && indicators.sma20 ? Math.min(100, (currentPrice / indicators.sma20) * 100) : 100,
            description: "Short-term price trend analysis"
          },
          {
            name: "50-Day Trend",
            value: indicators.sma50 ? `₹${indicators.sma50.toFixed(2)}` : 'N/A',
            signal: sma50Signal,
            progress: currentPrice && indicators.sma50 ? Math.min(100, (currentPrice / indicators.sma50) * 100) : 100,
            description: "Medium-term price trend analysis"
          },
          {
            name: "MACD Momentum",
            value: indicators.macd?.line?.toFixed(4) || 'N/A',
            signal: macdSignal,
            progress: 50,
            description: "Momentum and trend direction indicator"
          }
        ].map((indicator, index) => (
          <Card key={index} className={`${isDark ? 'bg-gray-900/70' : 'bg-white/70'} backdrop-blur-sm border-gray-200/20 dark:border-gray-700/20`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {indicator.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{indicator.description}</p>
                </div>
                <Badge className={`${indicator.signal.color} text-white border-0`}>
                  {indicator.signal.icon}
                  {indicator.signal.signal}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold text-emerald-400">
                {indicator.value}
              </div>
              
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50/50'} border border-gray-200/50 dark:border-gray-700/50`}>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Investment Action:
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {indicator.signal.action}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Signal Strength</span>
                  <span>{indicator.signal.strength}</span>
                </div>
                <Progress value={indicator.progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Price Levels for Trading */}
      <Card className={`${isDark ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-sm border-0 shadow-xl`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            Key Trading Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-4 rounded-xl ${isDark ? 'bg-red-900/20' : 'bg-red-50'} border border-red-200/50 dark:border-red-800/50`}>
              <h4 className="font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Resistance Levels
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">52W High:</span>
                  <span className="font-medium">₹{data.info?.fiftyTwoWeekHigh?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">SMA 50:</span>
                  <span className="font-medium">₹{indicators.sma50?.toFixed(2) || 'N/A'}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Sell signals if price approaches these levels
                </p>
              </div>
            </div>
            
            <div className={`p-4 rounded-xl ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} border border-blue-200/50 dark:border-blue-800/50`}>
              <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Current Price
              </h4>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  ₹{currentPrice.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Real-time market price
                </p>
              </div>
            </div>
            
            <div className={`p-4 rounded-xl ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'} border border-emerald-200/50 dark:border-emerald-800/50`}>
              <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Support Levels
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">SMA 20:</span>
                  <span className="font-medium">₹{indicators.sma20?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">52W Low:</span>
                  <span className="font-medium">₹{data.info?.fiftyTwoWeekLow?.toFixed(2) || 'N/A'}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Buy signals if price approaches these levels
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicalAnalysis;
