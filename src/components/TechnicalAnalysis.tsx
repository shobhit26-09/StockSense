import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Activity, BarChart3, AlertTriangle, CheckCircle, Target } from 'lucide-react';

interface TechnicalAnalysisProps {
  data: any;
}

const TechnicalAnalysis = ({ data }: TechnicalAnalysisProps) => {
  const indicators = data.technicalIndicators || {};
  const currentPrice = data.info?.currentPrice || 0;

  const getRSISignal = (rsi: number) => {
    if (rsi > 70) return { 
      signal: "Strong Sell", 
      tone: "negative" as const,
      icon: <TrendingDown className="h-4 w-4" />,
      action: "Consider selling - stock is overbought",
      strength: "Strong"
    };
    if (rsi > 60) return { 
      signal: "Sell", 
      tone: "negative" as const,
      icon: <TrendingDown className="h-4 w-4" />,
      action: "Watch for selling opportunities",
      strength: "Medium"
    };
    if (rsi < 30) return { 
      signal: "Strong Buy", 
      tone: "positive" as const,
      icon: <TrendingUp className="h-4 w-4" />,
      action: "Consider buying - stock is oversold",
      strength: "Strong"
    };
    if (rsi < 40) return { 
      signal: "Buy", 
      tone: "positive" as const,
      icon: <TrendingUp className="h-4 w-4" />,
      action: "Good buying opportunity emerging",
      strength: "Medium"
    };
    return { 
      signal: "Hold", 
      tone: "neutral" as const,
      icon: <Activity className="h-4 w-4" />,
      action: "Neutral zone - monitor closely",
      strength: "Neutral"
    };
  };

  const getSMASignal = (price: number, sma: number, period: number) => {
    const deviation = ((price - sma) / sma) * 100;
    if (deviation > 5) return { 
      signal: "Strong Buy", tone: "positive" as const,
      icon: <TrendingUp className="h-4 w-4" />,
      action: `Price ${deviation.toFixed(1)}% above ${period}-day average`,
      strength: "Strong"
    };
    if (deviation > 2) return { 
      signal: "Buy", tone: "positive" as const,
      icon: <TrendingUp className="h-4 w-4" />,
      action: `Price trending above ${period}-day average`,
      strength: "Medium"
    };
    if (deviation < -5) return { 
      signal: "Strong Sell", tone: "negative" as const,
      icon: <TrendingDown className="h-4 w-4" />,
      action: `Price ${Math.abs(deviation).toFixed(1)}% below ${period}-day average`,
      strength: "Strong"
    };
    if (deviation < -2) return { 
      signal: "Sell", tone: "negative" as const,
      icon: <TrendingDown className="h-4 w-4" />,
      action: `Price trending below ${period}-day average`,
      strength: "Medium"
    };
    return { 
      signal: "Hold", tone: "neutral" as const,
      icon: <Activity className="h-4 w-4" />,
      action: `Price near ${period}-day average`,
      strength: "Neutral"
    };
  };

  const getMACDSignal = (macd: any) => {
    if (!macd || !macd.line || !macd.signal) return { 
      signal: "No Data", tone: "neutral" as const,
      icon: <Activity className="h-4 w-4" />,
      action: "Insufficient data for analysis",
      strength: "N/A"
    };
    
    const crossover = macd.line - macd.signal;
    if (crossover > 0.5) return { 
      signal: "Strong Buy", tone: "positive" as const,
      icon: <TrendingUp className="h-4 w-4" />,
      action: "MACD line strongly above signal - bullish momentum",
      strength: "Strong"
    };
    if (crossover > 0) return { 
      signal: "Buy", tone: "positive" as const,
      icon: <TrendingUp className="h-4 w-4" />,
      action: "MACD line above signal - positive momentum",
      strength: "Medium"
    };
    if (crossover < -0.5) return { 
      signal: "Strong Sell", tone: "negative" as const,
      icon: <TrendingDown className="h-4 w-4" />,
      action: "MACD line strongly below signal - bearish momentum",
      strength: "Strong"
    };
    if (crossover < 0) return { 
      signal: "Sell", tone: "negative" as const,
      icon: <TrendingDown className="h-4 w-4" />,
      action: "MACD line below signal - negative momentum",
      strength: "Medium"
    };
    return { 
      signal: "Hold", tone: "neutral" as const,
      icon: <Activity className="h-4 w-4" />,
      action: "MACD signals are mixed",
      strength: "Neutral"
    };
  };

  const getOverallSignal = () => {
    const signals = [getRSISignal(indicators.rsi || 50), getSMASignal(currentPrice, indicators.sma20 || currentPrice, 20), getSMASignal(currentPrice, indicators.sma50 || currentPrice, 50), getMACDSignal(indicators.macd)];
    const strongBuyCount = signals.filter(s => s.signal === "Strong Buy").length;
    const buyCount = signals.filter(s => s.signal === "Buy").length;
    const strongSellCount = signals.filter(s => s.signal === "Strong Sell").length;
    const sellCount = signals.filter(s => s.signal === "Sell").length;
    
    const bullishSignals = strongBuyCount + buyCount;
    const bearishSignals = strongSellCount + sellCount;
    
    if (strongBuyCount >= 2 || bullishSignals >= 3) {
      return { 
        signal: "Strong Buy", tone: "positive" as const,
        icon: <CheckCircle className="h-5 w-5" />,
        confidence: Math.min(95, 60 + (bullishSignals * 10)),
        action: "Multiple indicators suggest strong buying opportunity"
      };
    }
    if (bullishSignals > bearishSignals) {
      return { 
        signal: "Buy", tone: "positive" as const,
        icon: <TrendingUp className="h-5 w-5" />,
        confidence: 55 + (bullishSignals * 5),
        action: "Majority of indicators suggest buying"
      };
    }
    if (strongSellCount >= 2 || bearishSignals >= 3) {
      return { 
        signal: "Strong Sell", tone: "negative" as const,
        icon: <AlertTriangle className="h-5 w-5" />,
        confidence: Math.min(95, 60 + (bearishSignals * 10)),
        action: "Multiple indicators suggest strong selling pressure"
      };
    }
    if (bearishSignals > bullishSignals) {
      return { 
        signal: "Sell", tone: "negative" as const,
        icon: <TrendingDown className="h-5 w-5" />,
        confidence: 55 + (bearishSignals * 5),
        action: "Majority of indicators suggest selling"
      };
    }
    return { 
      signal: "Hold", tone: "neutral" as const,
      icon: <Activity className="h-5 w-5" />,
        confidence: 50,
        action: "Mixed signals - maintain current position"
      };
    };

  const rsiSignal = getRSISignal(indicators.rsi || 50);
  const sma20Signal = getSMASignal(currentPrice, indicators.sma20 || currentPrice, 20);
  const sma50Signal = getSMASignal(currentPrice, indicators.sma50 || currentPrice, 50);
  const macdSignal = getMACDSignal(indicators.macd);
  const overall = getOverallSignal();

  return (
    <div className="p-6 space-y-5">
      {/* Decision Summary */}
      <div className="rounded-md border border-border/50 bg-card/40 p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10 border border-primary/20">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Technical Decision</h3>
              <p className="text-xs text-muted-foreground">Based on 4 indicators</p>
            </div>
          </div>
          <div className="text-right">
            <Badge className={toneBadge(overall.tone)}>
              <span className="flex items-center gap-1.5">{overall.icon}{overall.signal}</span>
            </Badge>
            <div className="text-[10px] text-muted-foreground mt-1 font-mono">{overall.confidence}% confidence</div>
          </div>
        </div>
        <Progress value={overall.confidence} className="h-1.5 mb-3" />
        <p className="text-xs text-foreground/80 leading-relaxed">{overall.action}</p>
      </div>

      {/* Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          <div key={index} className="rounded-md border border-border/50 bg-card/40 p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-foreground">{indicator.name}</h4>
                <p className="text-[10px] text-muted-foreground">{indicator.description}</p>
              </div>
              <Badge className={toneBadge(indicator.signal.tone)}>
                <span className="flex items-center gap-1">{indicator.signal.icon}{indicator.signal.signal}</span>
              </Badge>
            </div>
            <div className="text-xl font-mono font-semibold text-foreground mb-3">{indicator.value}</div>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{indicator.signal.action}</p>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
              <span>Signal Strength</span>
              <span>{indicator.signal.strength}</span>
            </div>
            <Progress value={indicator.progress} className="h-1" />
          </div>
        ))}
      </div>

      {/* Price Levels for Trading */}
      <div className="rounded-md border border-border/50 bg-card/40 p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Key Trading Levels</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-md bg-destructive/5 border border-destructive/20 p-4">
            <div className="flex items-center gap-1.5 mb-3 text-destructive">
              <TrendingDown className="h-3.5 w-3.5" />
              <span className="text-[11px] uppercase tracking-wider font-semibold">Resistance</span>
            </div>
            <Row label="52W High" value={`₹${data.info?.fiftyTwoWeekHigh?.toFixed(2) || 'N/A'}`} />
            <Row label="SMA 50" value={`₹${indicators.sma50?.toFixed(2) || 'N/A'}`} />
          </div>
          <div className="rounded-md bg-secondary/40 border border-border/50 p-4 text-center flex flex-col justify-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Current Price</div>
            <div className="text-2xl font-mono font-bold text-foreground">₹{currentPrice.toFixed(2)}</div>
          </div>
          <div className="rounded-md bg-success/5 border border-success/20 p-4">
            <div className="flex items-center gap-1.5 mb-3 text-success">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-[11px] uppercase tracking-wider font-semibold">Support</span>
            </div>
            <Row label="SMA 20" value={`₹${indicators.sma20?.toFixed(2) || 'N/A'}`} />
            <Row label="52W Low" value={`₹${data.info?.fiftyTwoWeekLow?.toFixed(2) || 'N/A'}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

const toneBadge = (tone: 'positive' | 'negative' | 'neutral') => {
  const base = 'border text-[10px] px-2 py-0.5 font-medium';
  if (tone === 'positive') return `${base} bg-success/10 text-success border-success/30`;
  if (tone === 'negative') return `${base} bg-destructive/10 text-destructive border-destructive/30`;
  return `${base} bg-muted/30 text-muted-foreground border-border`;
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-xs py-1 font-mono">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground font-semibold">{value}</span>
  </div>
);

export default TechnicalAnalysis;
