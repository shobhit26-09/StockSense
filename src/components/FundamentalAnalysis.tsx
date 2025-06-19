
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Target, Building, Shield, Info, CheckCircle, AlertTriangle, Star } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface FundamentalAnalysisProps {
  data: any;
}

const FundamentalAnalysis: React.FC<FundamentalAnalysisProps> = ({ data }) => {
  const { isDark } = useTheme();

  // Helper function to safely extract numeric values
  const safeNumber = (value: any, fallback: number = 0): number => {
    if (value === null || value === undefined) return fallback;
    
    if (typeof value === 'object' && value.raw !== undefined) {
      const num = parseFloat(value.raw);
      return isNaN(num) ? fallback : num;
    }
    
    const num = typeof value === 'number' ? value : parseFloat(value);
    return isNaN(num) ? fallback : num;
  };

  const info = data?.info || {};
  
  const fundamentalMetrics = {
    currentPrice: safeNumber(info.currentPrice) || safeNumber(info.regularMarketPrice),
    change: safeNumber(info.regularMarketChange),
    changePercent: safeNumber(info.regularMarketChangePercent),
    
    fiftyTwoWeekHigh: safeNumber(info.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: safeNumber(info.fiftyTwoWeekLow),
    dayHigh: safeNumber(info.regularMarketDayHigh),
    dayLow: safeNumber(info.regularMarketDayLow),
    volume: safeNumber(info.regularMarketVolume),
    
    marketCap: safeNumber(info.marketCap),
    pe: safeNumber(info.trailingPE) || safeNumber(info.forwardPE),
    pb: safeNumber(info.priceToBook),
    dividendYield: safeNumber(info.dividendYield),
    roe: safeNumber(info.returnOnEquity),
    currentRatio: safeNumber(info.currentRatio),
    debtToEquity: safeNumber(info.debtToEquity),
    eps: safeNumber(info.trailingEps),
    beta: safeNumber(info.beta),
    
    longName: info.longName || 'N/A',
    sector: info.sector || 'N/A',
    industry: info.industry || 'N/A',
    country: info.country || 'India',
    
    isEstimated: info.isEstimated || false
  };

  const formatCurrency = (value: number) => {
    if (!value || value === 0) return 'N/A';
    if (value >= 1e12) return `₹${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `₹${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)}Cr`;
    if (value >= 1e5) return `₹${(value / 1e5).toFixed(2)}L`;
    return `₹${value.toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    if (!value || value === 0) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatNumber = (value: number, suffix: string = '') => {
    if (!value || value === 0) return 'N/A';
    return `${value.toFixed(2)}${suffix}`;
  };

  const getInvestmentRating = (metric: string, value: number) => {
    if (!value || value === 0) {
      return { 
        score: 0, 
        label: 'N/A', 
        color: 'gray', 
        investment: 'Insufficient Data',
        reason: 'Data not available for analysis'
      };
    }
    
    switch (metric) {
      case 'pe':
        if (value <= 10) return { 
          score: 95, label: 'Excellent', color: 'emerald', 
          investment: 'Strong Buy', 
          reason: 'Significantly undervalued with strong earnings potential'
        };
        if (value <= 15) return { 
          score: 85, label: 'Very Good', color: 'emerald', 
          investment: 'Buy', 
          reason: 'Undervalued with good earnings growth'
        };
        if (value <= 20) return { 
          score: 70, label: 'Good', color: 'blue', 
          investment: 'Buy', 
          reason: 'Fairly valued with decent earnings'
        };
        if (value <= 25) return { 
          score: 55, label: 'Average', color: 'yellow', 
          investment: 'Hold', 
          reason: 'Moderately valued, monitor for better entry'
        };
        if (value <= 35) return { 
          score: 35, label: 'Poor', color: 'orange', 
          investment: 'Avoid', 
          reason: 'Overvalued relative to earnings'
        };
        return { 
          score: 20, label: 'Very Poor', color: 'red', 
          investment: 'Strong Sell', 
          reason: 'Extremely overvalued or negative earnings'
        };
      
      case 'pb':
        if (value <= 1.0) return { 
          score: 95, label: 'Excellent', color: 'emerald', 
          investment: 'Strong Buy', 
          reason: 'Trading below book value - exceptional value'
        };
        if (value <= 1.5) return { 
          score: 85, label: 'Very Good', color: 'emerald', 
          investment: 'Buy', 
          reason: 'Great value relative to assets'
        };
        if (value <= 2.5) return { 
          score: 70, label: 'Good', color: 'blue', 
          investment: 'Buy', 
          reason: 'Reasonable price relative to book value'
        };
        if (value <= 3.5) return { 
          score: 55, label: 'Average', color: 'yellow', 
          investment: 'Hold', 
          reason: 'Moderately priced, consider timing'
        };
        if (value <= 5.0) return { 
          score: 35, label: 'Poor', color: 'orange', 
          investment: 'Avoid', 
          reason: 'Expensive relative to tangible assets'
        };
        return { 
          score: 20, label: 'Very Poor', color: 'red', 
          investment: 'Strong Sell', 
          reason: 'Severely overpriced relative to book value'
        };
      
      case 'roe':
        if (value >= 0.25) return { 
          score: 95, label: 'Excellent', color: 'emerald', 
          investment: 'Strong Buy', 
          reason: 'Exceptional returns - highly profitable company'
        };
        if (value >= 0.20) return { 
          score: 85, label: 'Very Good', color: 'emerald', 
          investment: 'Buy', 
          reason: 'Outstanding returns on shareholder equity'
        };
        if (value >= 0.15) return { 
          score: 70, label: 'Good', color: 'blue', 
          investment: 'Buy', 
          reason: 'Strong returns indicate good management'
        };
        if (value >= 0.10) return { 
          score: 55, label: 'Average', color: 'yellow', 
          investment: 'Hold', 
          reason: 'Moderate returns, industry dependent'
        };
        if (value >= 0.05) return { 
          score: 35, label: 'Poor', color: 'orange', 
          investment: 'Avoid', 
          reason: 'Weak returns on equity'
        };
        return { 
          score: 20, label: 'Very Poor', color: 'red', 
          investment: 'Strong Sell', 
          reason: 'Very poor or negative returns'
        };
      
      case 'currentRatio':
        if (value >= 2.5) return { 
          score: 90, label: 'Excellent', color: 'emerald', 
          investment: 'Low Risk', 
          reason: 'Excellent liquidity - very safe investment'
        };
        if (value >= 2.0) return { 
          score: 80, label: 'Very Good', color: 'emerald', 
          investment: 'Low Risk', 
          reason: 'Strong liquidity position'
        };
        if (value >= 1.5) return { 
          score: 70, label: 'Good', color: 'blue', 
          investment: 'Medium Risk', 
          reason: 'Adequate liquidity to meet obligations'
        };
        if (value >= 1.2) return { 
          score: 55, label: 'Average', color: 'yellow', 
          investment: 'Medium Risk', 
          reason: 'Moderate liquidity - monitor closely'
        };
        if (value >= 1.0) return { 
          score: 40, label: 'Poor', color: 'orange', 
          investment: 'High Risk', 
          reason: 'Tight liquidity - financial stress possible'
        };
        return { 
          score: 25, label: 'Very Poor', color: 'red', 
          investment: 'Very High Risk', 
          reason: 'Severe liquidity concerns'
        };
      
      case 'debtToEquity':
        if (value <= 10) return { 
          score: 95, label: 'Excellent', color: 'emerald', 
          investment: 'Low Risk', 
          reason: 'Very conservative debt levels'
        };
        if (value <= 20) return { 
          score: 85, label: 'Very Good', color: 'emerald', 
          investment: 'Low Risk', 
          reason: 'Conservative debt management'
        };
        if (value <= 40) return { 
          score: 70, label: 'Good', color: 'blue', 
          investment: 'Medium Risk', 
          reason: 'Manageable debt levels'
        };
        if (value <= 60) return { 
          score: 55, label: 'Average', color: 'yellow', 
          investment: 'Medium Risk', 
          reason: 'Moderate debt burden - monitor'
        };
        if (value <= 80) return { 
          score: 35, label: 'Poor', color: 'orange', 
          investment: 'High Risk', 
          reason: 'High debt levels - financial risk'
        };
        return { 
          score: 20, label: 'Very Poor', color: 'red', 
          investment: 'Very High Risk', 
          reason: 'Excessive debt - avoid investment'
        };
      
      default:
        return { score: 50, label: 'N/A', color: 'gray', investment: 'Unknown', reason: 'Unable to evaluate' };
    }
  };

  const getOverallInvestmentRating = () => {
    const peRating = getInvestmentRating('pe', fundamentalMetrics.pe);
    const pbRating = getInvestmentRating('pb', fundamentalMetrics.pb);
    const roeRating = getInvestmentRating('roe', fundamentalMetrics.roe);
    const currentRating = getInvestmentRating('currentRatio', fundamentalMetrics.currentRatio);
    const debtRating = getInvestmentRating('debtToEquity', fundamentalMetrics.debtToEquity);
    
    const validRatings = [peRating, pbRating, roeRating, currentRating, debtRating].filter(r => r.score > 0);
    if (validRatings.length === 0) return { 
      score: 0, 
      label: 'Insufficient Data', 
      color: 'gray',
      investment: 'Cannot Recommend',
      confidence: 0
    };
    
    const avgScore = validRatings.reduce((sum, r) => sum + r.score, 0) / validRatings.length;
    const confidence = Math.min(95, (validRatings.length / 5) * 100);
    
    if (avgScore >= 85) return { 
      score: avgScore, 
      label: 'Strong Buy', 
      color: 'emerald',
      investment: 'Excellent Investment Opportunity',
      confidence
    };
    if (avgScore >= 70) return { 
      score: avgScore, 
      label: 'Buy', 
      color: 'blue',
      investment: 'Good Investment Opportunity',
      confidence
    };
    if (avgScore >= 55) return { 
      score: avgScore, 
      label: 'Hold', 
      color: 'yellow',
      investment: 'Average Investment - Monitor',
      confidence
    };
    if (avgScore >= 40) return { 
      score: avgScore, 
      label: 'Avoid', 
      color: 'orange',
      investment: 'Below Average Investment',
      confidence
    };
    return { 
      score: avgScore, 
      label: 'Strong Sell', 
      color: 'red',
      investment: 'Poor Investment - High Risk',
      confidence
    };
  };

  const overallRating = getOverallInvestmentRating();

  return (
    <div className="space-y-6">
      {/* Data Quality Notice */}
      {fundamentalMetrics.isEstimated && (
        <Card className={`${isDark ? 'bg-amber-950/30' : 'bg-amber-50'} border-amber-200 dark:border-amber-800/50`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Financial Data Notice
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Some financial metrics are estimated based on sector averages. Price data is real-time and accurate.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Investment Decision Summary */}
      <Card className={`${isDark ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-sm border-0 shadow-xl`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-${overallRating.color}-500 shadow-lg`}>
                {overallRating.label === 'Strong Buy' ? <CheckCircle className="h-6 w-6 text-white" /> :
                 overallRating.label === 'Buy' ? <TrendingUp className="h-6 w-6 text-white" /> :
                 overallRating.label === 'Hold' ? <Target className="h-6 w-6 text-white" /> :
                 <AlertTriangle className="h-6 w-6 text-white" />}
              </div>
              <div>
                <h3 className="text-xl font-bold">Investment Recommendation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Based on 5 fundamental metrics</p>
              </div>
            </div>
            <div className="text-right">
              <Badge className={`bg-${overallRating.color}-500 text-white border-0 text-lg px-4 py-2`}>
                <Star className="h-4 w-4 mr-2" />
                {overallRating.label}
              </Badge>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {overallRating.confidence.toFixed(0)}% Data Confidence
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Progress value={overallRating.score} className="flex-1" />
              <span className="text-2xl font-bold">{overallRating.score.toFixed(0)}/100</span>
            </div>
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} border border-gray-200/50 dark:border-gray-700/50`}>
              <h4 className="font-semibold text-lg mb-2">{overallRating.investment}</h4>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                This recommendation is based on comprehensive analysis of valuation metrics, profitability ratios, and financial health indicators.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Overview with Key Metrics */}
      <Card className={`${isDark ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-sm border-0 shadow-xl`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <Building className="h-6 w-6 text-white" />
            </div>
            {fundamentalMetrics.longName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Price</p>
              <p className="text-3xl font-bold text-blue-600">₹{fundamentalMetrics.currentPrice.toFixed(2)}</p>
              <div className="flex items-center gap-2">
                {fundamentalMetrics.change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${fundamentalMetrics.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {fundamentalMetrics.change >= 0 ? '+' : ''}{fundamentalMetrics.change.toFixed(2)} ({formatPercentage(fundamentalMetrics.changePercent / 100)})
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Market Cap</p>
              <p className="text-2xl font-bold">{formatCurrency(fundamentalMetrics.marketCap)}</p>
              <p className="text-xs text-gray-500">Company Size Indicator</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Sector</p>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                {fundamentalMetrics.sector}
              </Badge>
              <p className="text-xs text-gray-500">Industry Classification</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">52W Range</p>
              <div className="text-sm">
                <div>High: ₹{fundamentalMetrics.fiftyTwoWeekHigh.toFixed(2)}</div>
                <div>Low: ₹{fundamentalMetrics.fiftyTwoWeekLow.toFixed(2)}</div>
              </div>
              <p className="text-xs text-gray-500">Price Range Analysis</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Valuation Analysis with Investment Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            name: "P/E Ratio",
            value: formatNumber(fundamentalMetrics.pe, 'x'),
            metric: 'pe',
            description: "Price to Earnings - Valuation multiple",
            insight: "Lower ratios typically indicate better value"
          },
          {
            name: "P/B Ratio", 
            value: formatNumber(fundamentalMetrics.pb, 'x'),
            metric: 'pb',
            description: "Price to Book - Asset valuation",
            insight: "Values below 1.0 may indicate undervaluation"
          }
        ].map((item, index) => {
          const rating = getInvestmentRating(item.metric, item.metric === 'pe' ? fundamentalMetrics.pe : fundamentalMetrics.pb);
          return (
            <Card key={index} className={`${isDark ? 'bg-gray-900/70' : 'bg-white/70'} backdrop-blur-sm border-gray-200/20 dark:border-gray-700/20`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                  </div>
                  <Badge className={`bg-${rating.color}-500 text-white border-0`}>
                    {rating.investment}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-emerald-400">
                  {item.value}
                </div>
                
                <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50/50'} border border-gray-200/50 dark:border-gray-700/50`}>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Investment Insight:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {rating.reason}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.insight}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Investment Grade</span>
                    <span className={`font-medium text-${rating.color}-600 dark:text-${rating.color}-400`}>
                      {rating.label}
                    </span>
                  </div>
                  <Progress value={rating.score} className="h-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Financial Health & Risk Assessment */}
      <Card className={`${isDark ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-sm border-0 shadow-xl`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            Financial Health & Risk Analysis
            {fundamentalMetrics.isEstimated && (
              <Badge variant="outline" className="text-xs">
                Estimated data
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Return on Equity",
                value: formatPercentage(fundamentalMetrics.roe),
                metric: 'roe',
                description: "Profitability measure",
                insight: "Higher ROE indicates efficient use of shareholder funds"
              },
              {
                name: "Current Ratio",
                value: formatNumber(fundamentalMetrics.currentRatio, 'x'),
                metric: 'currentRatio', 
                description: "Liquidity measure",
                insight: "Ratio above 1.5 indicates good short-term financial health"
              },
              {
                name: "Debt to Equity",
                value: formatNumber(fundamentalMetrics.debtToEquity, '%'),
                metric: 'debtToEquity',
                description: "Leverage measure", 
                insight: "Lower debt ratios indicate lower financial risk"
              }
            ].map((item, index) => {
              const rating = getInvestmentRating(item.metric, 
                item.metric === 'roe' ? fundamentalMetrics.roe :
                item.metric === 'currentRatio' ? fundamentalMetrics.currentRatio :
                fundamentalMetrics.debtToEquity
              );
              return (
                <Card key={index} className={`${isDark ? 'bg-gray-800/30' : 'bg-gray-50/30'} border border-gray-200/30 dark:border-gray-700/30`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-semibold">
                          {item.name}
                        </CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                      </div>
                      <Badge className={`bg-${rating.color}-500 text-white border-0 text-xs`}>
                        {rating.investment}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-2xl font-bold text-emerald-400">
                      {item.value}
                    </div>
                    
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-900/50' : 'bg-white/50'} border border-gray-200/50 dark:border-gray-700/50`}>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {rating.reason}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.insight}
                      </p>
                    </div>
                    
                    <Progress value={rating.score} className="h-2" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Additional Investment Metrics */}
      <Card className={`${isDark ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-sm border-0 shadow-xl`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            Key Investment Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Earnings Per Share",
                value: `₹${formatNumber(fundamentalMetrics.eps)}`,
                insight: "Company's profit per share"
              },
              {
                label: "Beta (Volatility)",
                value: formatNumber(fundamentalMetrics.beta),
                insight: "Risk relative to market (1.0 = market risk)"
              },
              {
                label: "Dividend Yield",
                value: formatPercentage(fundamentalMetrics.dividendYield),
                insight: "Annual dividend as % of stock price"
              },
              {
                label: "Daily Volume",
                value: fundamentalMetrics.volume.toLocaleString(),
                insight: "Trading liquidity indicator"
              }
            ].map((item, index) => (
              <div key={index} className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/30' : 'bg-gray-50/30'} border border-gray-200/30 dark:border-gray-700/30`}>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{item.label}</p>
                <p className="text-xl font-bold mb-2">{item.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FundamentalAnalysis;
