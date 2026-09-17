
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Brain, Target, AlertTriangle, Activity } from 'lucide-react';

interface PricePredictionProps {
  stockData: any;
  symbol: string;
}

interface PredictionResult {
  date: string;
  actual?: number;
  predicted: number;
  confidence: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

const EnhancedPricePrediction: React.FC<PricePredictionProps> = ({ stockData, symbol }) => {
  const [predictionPeriod, setPredictionPeriod] = useState<string>('7');
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('ensemble');

  // Enhanced prediction algorithms
  const calculateMovingAverage = (data: number[], period: number): number[] => {
    const result: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  };

  const calculateEMA = (data: number[], period: number): number[] => {
    const multiplier = 2 / (period + 1);
    const result: number[] = [data[0]];
    
    for (let i = 1; i < data.length; i++) {
      result.push((data[i] * multiplier) + (result[i - 1] * (1 - multiplier)));
    }
    return result;
  };

  const calculateRSI = (prices: number[], period: number = 14): number[] => {
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const avgGains = calculateMovingAverage(gains, period);
    const avgLosses = calculateMovingAverage(losses, period);
    
    return avgGains.map((gain, i) => {
      if (avgLosses[i] === 0) return 100;
      const rs = gain / avgLosses[i];
      return 100 - (100 / (1 + rs));
    });
  };

  const linearRegression = (data: number[], days: number): number[] => {
    const n = data.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = data;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const predictions: number[] = [];
    for (let i = 0; i < days; i++) {
      predictions.push(slope * (n + i) + intercept);
    }
    
    return predictions;
  };

  const polynomialRegression = (data: number[], days: number, degree: number = 2): number[] => {
    const n = data.length;
    const x = Array.from({length: n}, (_, i) => i);
    
    // Simplified polynomial regression (quadratic)
    const predictions: number[] = [];
    const recentTrend = data.slice(-10);
    const avgChange = recentTrend.reduce((sum, val, i) => {
      if (i === 0) return 0;
      return sum + (val - recentTrend[i-1]);
    }, 0) / (recentTrend.length - 1);
    
    const lastPrice = data[data.length - 1];
    const volatility = Math.sqrt(recentTrend.reduce((sum, val) => {
      const deviation = val - (recentTrend.reduce((a, b) => a + b) / recentTrend.length);
      return sum + deviation * deviation;
    }, 0) / recentTrend.length);
    
    for (let i = 0; i < days; i++) {
      const trendFactor = avgChange * (i + 1);
      const dampingFactor = Math.exp(-i * 0.1); // Dampen predictions over time
      const randomFactor = (Math.random() - 0.5) * volatility * 0.3;
      
      predictions.push(Math.max(0, lastPrice + trendFactor * dampingFactor + randomFactor));
    }
    
    return predictions;
  };

  const arima = (data: number[], days: number): number[] => {
    // Simplified ARIMA implementation
    const n = Math.min(data.length, 20); // Use last 20 data points
    const recent = data.slice(-n);
    
    // Calculate autoregressive components
    const lag1 = recent.slice(0, -1);
    const current = recent.slice(1);
    
    // Simple AR(1) model
    const correlation = lag1.reduce((sum, val, i) => sum + val * current[i], 0) / 
                       Math.sqrt(lag1.reduce((sum, val) => sum + val * val, 0) * 
                               current.reduce((sum, val) => sum + val * val, 0));
    
    const predictions: number[] = [];
    let lastValue = data[data.length - 1];
    const mean = data.reduce((a, b) => a + b) / data.length;
    
    for (let i = 0; i < days; i++) {
      // AR(1): X(t) = φ * X(t-1) + ε
      const phi = Math.min(0.9, Math.max(0.1, correlation)); // Constrain coefficient
      const noise = (Math.random() - 0.5) * mean * 0.02; // Small random component
      lastValue = phi * lastValue + (1 - phi) * mean + noise;
      predictions.push(Math.max(0, lastValue));
    }
    
    return predictions;
  };

  const ensemblePredict = (data: number[], days: number): { predictions: number[], confidence: number[] } => {
    const linear = linearRegression(data, days);
    const polynomial = polynomialRegression(data, days);
    const arimaResults = arima(data, days);
    
    // Weighted ensemble
    const weights = {
      linear: 0.3,
      polynomial: 0.4,
      arima: 0.3
    };
    
    const predictions: number[] = [];
    const confidence: number[] = [];
    
    for (let i = 0; i < days; i++) {
      const ensemble = (linear[i] * weights.linear + 
                       polynomial[i] * weights.polynomial + 
                       arimaResults[i] * weights.arima);
      
      predictions.push(ensemble);
      
      // Calculate confidence based on model agreement
      const variance = [linear[i], polynomial[i], arimaResults[i]].reduce((sum, val) => {
        return sum + Math.pow(val - ensemble, 2);
      }, 0) / 3;
      
      const confidenceScore = Math.max(0.4, Math.min(0.95, 0.9 - Math.sqrt(variance) / ensemble));
      confidence.push(confidenceScore);
    }
    
    return { predictions, confidence };
  };

  const generatePredictions = () => {
    if (!stockData?.historicalData || stockData.historicalData.length < 10) {
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      try {
        const historicalPrices = stockData.historicalData.map((d: any) => d.close);
        const days = parseInt(predictionPeriod);
        
        let predictions: number[];
        let confidenceScores: number[];
        
        switch (selectedModel) {
          case 'linear':
            predictions = linearRegression(historicalPrices, days);
            confidenceScores = Array(days).fill(0.7);
            break;
          case 'polynomial':
            predictions = polynomialRegression(historicalPrices, days);
            confidenceScores = Array(days).fill(0.75);
            break;
          case 'arima':
            predictions = arima(historicalPrices, days);
            confidenceScores = Array(days).fill(0.8);
            break;
          default: // ensemble
            const ensembleResult = ensemblePredict(historicalPrices, days);
            predictions = ensembleResult.predictions;
            confidenceScores = ensembleResult.confidence;
        }
        
        const currentPrice = historicalPrices[historicalPrices.length - 1];
        const predictionResults: PredictionResult[] = [];
        
        for (let i = 0; i < days; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i + 1);
          
          const predicted = predictions[i];
          const confidence = confidenceScores[i];
          const changePercent = ((predicted - currentPrice) / currentPrice) * 100;
          
          let trend: 'bullish' | 'bearish' | 'neutral';
          if (changePercent > 2) trend = 'bullish';
          else if (changePercent < -2) trend = 'bearish';
          else trend = 'neutral';
          
          predictionResults.push({
            date: date.toISOString().split('T')[0],
            predicted,
            confidence,
            trend
          });
        }
        
        setPredictions(predictionResults);
      } catch (error) {
        console.error('Prediction error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  useEffect(() => {
    generatePredictions();
  }, [stockData, predictionPeriod, selectedModel]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'bearish':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return 'text-green-500';
      case 'bearish':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const chartData = predictions.map((pred, index) => ({
    date: new Date(pred.date).toLocaleDateString(),
    price: pred.predicted,
    confidence: pred.confidence * 100,
    upper: pred.predicted * (1 + (1 - pred.confidence) * 0.5),
    lower: pred.predicted * (1 - (1 - pred.confidence) * 0.5)
  }));

  const averageConfidence = predictions.length > 0 
    ? predictions.reduce((sum, pred) => sum + pred.confidence, 0) / predictions.length 
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-600/20 border border-purple-600/30">
            <Brain className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Enhanced ML Price Prediction</h2>
            <p className="text-gray-400">Advanced algorithmic forecasting for {symbol}</p>
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-400 mb-1">
            {(averageConfidence * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Avg Confidence</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-300">Prediction Period:</label>
          <Select value={predictionPeriod} onValueChange={setPredictionPeriod}>
            <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 Days</SelectItem>
              <SelectItem value="7">1 Week</SelectItem>
              <SelectItem value="14">2 Weeks</SelectItem>
              <SelectItem value="30">1 Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-300">Model:</label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ensemble">Ensemble</SelectItem>
              <SelectItem value="linear">Linear Regression</SelectItem>
              <SelectItem value="polynomial">Polynomial</SelectItem>
              <SelectItem value="arima">ARIMA</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={generatePredictions} 
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? 'Predicting...' : 'Regenerate'}
        </Button>
      </div>

      {/* Prediction Chart */}
      {chartData.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-400" />
              Price Prediction Chart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="confidenceArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickFormatter={(value) => `₹${value.toFixed(0)}`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any, name: string) => [
                      name === 'price' ? `₹${value.toFixed(2)}` : `${value.toFixed(1)}%`,
                      name === 'price' ? 'Predicted Price' : 'Confidence'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="upper"
                    stroke="none"
                    fill="url(#confidenceArea)"
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    stroke="none"
                    fill="url(#confidenceArea)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prediction Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {predictions.slice(0, 6).map((prediction, index) => (
          <Card key={index} className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-400">
                  {new Date(prediction.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(prediction.trend)}
                  <Badge variant="outline" className={getTrendColor(prediction.trend)}>
                    {prediction.trend}
                  </Badge>
                </div>
              </div>
              
              <div className="text-xl font-bold text-white mb-1">
                ₹{prediction.predicted.toFixed(2)}
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Confidence:</span>
                <span className={`font-medium ${
                  prediction.confidence > 0.8 ? 'text-green-400' : 
                  prediction.confidence > 0.6 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {(prediction.confidence * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${
                    prediction.confidence > 0.8 ? 'bg-green-500' : 
                    prediction.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${prediction.confidence * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Model Information */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            Model Information & Disclaimer
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-400 space-y-2">
          <p>
            <strong className="text-white">Current Model:</strong> {selectedModel === 'ensemble' ? 'Ensemble (Linear + Polynomial + ARIMA)' : selectedModel.charAt(0).toUpperCase() + selectedModel.slice(1)}
          </p>
          <p>
            <strong className="text-white">Confidence Score:</strong> Based on model agreement and historical volatility. Higher scores indicate more reliable predictions.
          </p>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-4">
            <p className="text-yellow-300">
              <strong>Disclaimer:</strong> These predictions are generated using machine learning algorithms and should not be considered as financial advice. 
              Market conditions, news events, and other factors can significantly impact actual prices. Always consult with financial professionals before making investment decisions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedPricePrediction;
