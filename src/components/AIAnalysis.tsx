import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, Zap, BarChart3, PieChart, Activity } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface AIAnalysisProps {
  data: any;
  symbol: string;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ data, symbol }) => {
  const { isDark } = useTheme();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;


  const generateAIAnalysis = async () => {
    setLoading(true);
    
    try {
      // Prepare stock data for Gemini analysis
      const stockData = {
        symbol: symbol,
        currentPrice: data?.info?.currentPrice || data?.info?.regularMarketPrice || 0,
        marketCap: data?.info?.marketCap || 0,
        peRatio: data?.info?.trailingPE || 0,
        pegRatio: data?.info?.pegRatio || 0,
        priceToBook: data?.info?.priceToBook || 0,
        debtToEquity: data?.info?.debtToEquity || 0,
        roe: data?.info?.returnOnEquity || 0,
        roa: data?.info?.returnOnAssets || 0,
        volume: data?.info?.volume || 0,
        averageVolume: data?.info?.averageVolume || 0,
        fiftyTwoWeekHigh: data?.info?.fiftyTwoWeekHigh || 0,
        fiftyTwoWeekLow: data?.info?.fiftyTwoWeekLow || 0,
        dividendYield: data?.info?.dividendYield || 0,
        sector: data?.info?.sector || 'Unknown',
        industry: data?.info?.industry || 'Unknown',
        revenueGrowth: data?.info?.revenueGrowth || 0,
        earningsGrowth: data?.info?.earningsGrowth || 0,
        operatingMargin: data?.info?.operatingMargin || 0,
        profitMargin: data?.info?.profitMargin || 0,
        currentRatio: data?.info?.currentRatio || 0,
        quickRatio: data?.info?.quickRatio || 0,
        totalCash: data?.info?.totalCash || 0,
        totalDebt: data?.info?.totalDebt || 0,
        freeCashflow: data?.info?.freeCashflow || 0,
        enterpriseValue: data?.info?.enterpriseValue || 0,
        beta: data?.info?.beta || 0,
        analystTargetPrice: data?.info?.targetMeanPrice || 0,
        recommendationKey: data?.info?.recommendationKey || 'none'
      };

      const prompt = `You are a professional investment analyst. Analyze the following stock data for ${symbol} and provide a comprehensive investment analysis. 

Stock Data:
${JSON.stringify(stockData, null, 2)}

Please provide a detailed analysis in the following JSON format:
{
  "overallScore": number (0-100),
  "recommendation": "BUY" | "HOLD" | "SELL",
  "confidence": number (0-100),
  "targetPrice": number,
  "riskLevel": "Low" | "Medium" | "High",
  "timeHorizon": string,
  "marketPosition": {
    "marketCapRank": number,
    "sectorLeadership": boolean,
    "competitiveAdvantage": "Strong" | "Moderate" | "Weak",
    "moatStrength": number (0-100)
  },
  "financialHealth": {
    "liquidityRatio": number,
    "debtToEquity": number,
    "roe": number,
    "roa": number,
    "interestCoverage": number
  },
  "growthMetrics": {
    "revenueGrowth": number,
    "earningsGrowth": number,
    "freeCashFlowGrowth": number,
    "bookValueGrowth": number
  },
  "valuation": {
    "peRatio": number,
    "pegRatio": number,
    "priceToBook": number,
    "enterpriseValue": number,
    "discountToPeers": number
  },
  "strengths": [string array of 4-6 key strengths],
  "concerns": [string array of 3-5 key concerns],
  "catalysts": [string array of 3-5 growth catalysts],
  "riskFactors": [
    {
      "factor": string,
      "level": "Low" | "Medium" | "High",
      "score": number (0-100),
      "description": string
    }
  ],
  "technicalSignals": [
    {
      "indicator": string,
      "value": string,
      "signal": "Buy" | "Sell" | "Hold" | "Neutral",
      "strength": "Strong" | "Medium" | "Weak"
    }
  ],
  "analystSentiment": {
    "buyRating": number,
    "holdRating": number,
    "sellRating": number,
    "avgPriceTarget": number,
    "analystCount": number,
    "recentUpgrades": number,
    "recentDowngrades": number
  },
  "fundamentalScore": number (0-100),
  "technicalScore": number (0-100),
  "sentimentScore": number (0-100),
  "momentumScore": number (0-100),
  "valueScore": number (0-100)
}

Analyze the financial ratios, growth metrics, valuation, and market position. Consider sector dynamics, competitive landscape, and current market conditions. Be specific and actionable in your recommendations. Focus on providing insights that would help investors make informed decisions.`;

      console.log('Calling Gemini API for AI analysis...');

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('Gemini API response:', result);

      if (result.candidates && result.candidates[0] && result.candidates[0].content) {
        const analysisText = result.candidates[0].content.parts[0].text;
        
        // Extract JSON from the response
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const aiInsights = JSON.parse(jsonMatch[0]);
            console.log('Parsed AI insights:', aiInsights);
            setAnalysis(aiInsights);
          } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            throw new Error('Failed to parse AI analysis');
          }
        } else {
          throw new Error('No valid JSON found in AI response');
        }
      } else {
        throw new Error('Invalid response from Gemini API');
      }
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      const currentPrice = data?.info?.currentPrice || data?.info?.regularMarketPrice || 0;
      setAnalysis({
        overallScore: 0,
        recommendation: 'HOLD',
        confidence: 0,
        targetPrice: currentPrice,
        riskLevel: 'High',
        timeHorizon: 'Unable to analyze',
        error: 'Failed to generate AI analysis. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
  };

  const getRecommendationStyle = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY': return 'bg-green-500 text-white shadow-green-200 dark:shadow-green-900/50';
      case 'HOLD': return 'bg-yellow-500 text-white shadow-yellow-200 dark:shadow-yellow-900/50';
      case 'SELL': return 'bg-red-500 text-white shadow-red-200 dark:shadow-red-900/50';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (!analysis && !loading) {
    return (
      <Card className="glass-morphism transition-all duration-300">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-light mb-4 text-gray-900 dark:text-white">AI-Powered Investment Analysis</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto font-light">
            Advanced AI analysis using Google Gemini to analyze market data, financial metrics, 
            technical indicators, and sentiment to provide comprehensive investment insights.
          </p>
          <Button 
            onClick={generateAIAnalysis}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Brain className="h-5 w-5 mr-2" />
            Generate AI Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="glass-morphism transition-all duration-300">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Brain className="h-8 w-8 text-white animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">AI Analysis in Progress</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 font-light">
              Gemini AI is analyzing market data, financial metrics, and technical indicators...
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (analysis?.error) {
    return (
      <Card className="glass-morphism transition-all duration-300">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">Analysis Failed</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{analysis.error}</p>
          <Button onClick={generateAIAnalysis} variant="outline">
            <Brain className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Overall Assessment */}
      <Card className="glass-morphism transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl font-medium text-gray-900 dark:text-white">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              Gemini AI Investment Assessment
            </CardTitle>
            <Button 
              onClick={generateAIAnalysis}
              variant="outline"
              size="sm"
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              <Brain className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 transition-all duration-200">
              <div className="text-3xl font-light mb-2 text-gray-900 dark:text-white">{analysis.overallScore}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Overall Score</div>
              <Progress value={analysis.overallScore} className="mb-3 h-2" />
              <Badge className={getScoreColor(analysis.overallScore)}>
                {analysis.overallScore >= 70 ? 'Strong' : analysis.overallScore >= 50 ? 'Moderate' : 'Weak'}
              </Badge>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 transition-all duration-200">
              <div className="text-2xl font-medium mb-2 text-gray-900 dark:text-white">{analysis.recommendation}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">AI Recommendation</div>
              <Badge className={`${getRecommendationStyle(analysis.recommendation)} text-lg px-4 py-2 shadow-lg`}>
                {analysis.recommendation}
              </Badge>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 transition-all duration-200">
              <div className="text-2xl font-light mb-2 text-gray-900 dark:text-white">₹{analysis.targetPrice?.toFixed(2) || 'N/A'}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Target Price</div>
              {analysis.targetPrice && (
                <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                  {((analysis.targetPrice / (data?.info?.currentPrice || data?.info?.regularMarketPrice || 1400) - 1) * 100).toFixed(1)}% potential
                </div>
              )}
            </div>
            
            <div className="text-center p-6 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 transition-all duration-200">
              <div className="text-2xl font-light mb-2 text-gray-900 dark:text-white">{analysis.confidence}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Confidence Level</div>
              <Progress value={analysis.confidence} className="mb-2 h-2" />
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">{analysis.timeHorizon}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Position & Financial Health */}
      {analysis.marketPosition && analysis.financialHealth && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-morphism transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg font-medium text-gray-900 dark:text-white">
                <Target className="h-5 w-5 text-blue-600" />
                Market Position
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Market Cap Rank</span>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  #{analysis.marketPosition.marketCapRank}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Competitive Advantage</span>
                <span className="font-medium text-gray-900 dark:text-white">{analysis.marketPosition.competitiveAdvantage}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Moat Strength</span>
                  <span className="font-medium text-gray-900 dark:text-white">{analysis.marketPosition.moatStrength}%</span>
                </div>
                <Progress value={analysis.marketPosition.moatStrength} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg font-medium text-gray-900 dark:text-white">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Financial Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">ROE</span>
                <span className="font-medium text-gray-900 dark:text-white">{analysis.financialHealth.roe?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Debt/Equity</span>
                <span className="font-medium text-gray-900 dark:text-white">{analysis.financialHealth.debtToEquity?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Liquidity Ratio</span>
                <span className="font-medium text-gray-900 dark:text-white">{analysis.financialHealth.liquidityRatio?.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Interest Coverage</span>
                <span className="font-medium text-gray-900 dark:text-white">{analysis.financialHealth.interestCoverage?.toFixed(1)}x</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Score Breakdown */}
      {(analysis.fundamentalScore || analysis.technicalScore || analysis.sentimentScore || analysis.momentumScore || analysis.valueScore) && (
        <Card className="glass-morphism transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-medium text-gray-900 dark:text-white">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              AI Score Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { label: 'Fundamental', score: analysis.fundamentalScore, icon: Target },
                { label: 'Technical', score: analysis.technicalScore, icon: TrendingUp },
                { label: 'Sentiment', score: analysis.sentimentScore, icon: Activity },
                { label: 'Momentum', score: analysis.momentumScore, icon: Zap },
                { label: 'Value', score: analysis.valueScore, icon: PieChart }
              ].filter(metric => metric.score !== undefined).map((metric) => (
                <div key={metric.label} className="text-center p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 transition-all duration-200">
                  <metric.icon className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-xl font-light mb-1 text-gray-900 dark:text-white">{metric.score?.toFixed(0)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{metric.label}</div>
                  <Progress value={metric.score} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Signals */}
      {analysis.technicalSignals && analysis.technicalSignals.length > 0 && (
        <Card className="glass-morphism transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-medium text-gray-900 dark:text-white">
              <Activity className="h-6 w-6 text-purple-600" />
              Technical Analysis Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysis.technicalSignals.map((signal: any, index: number) => (
                <div key={index} className="p-4 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 transition-all duration-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{signal.indicator}</span>
                    <Badge className={getScoreColor(signal.signal === 'Buy' ? 80 : signal.signal === 'Sell' ? 20 : 60)}>
                      {signal.signal}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{signal.value}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Strength: {signal.strength}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths and Concerns */}
      {(analysis.strengths || analysis.concerns) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analysis.strengths && (
            <Card className="glass-morphism transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle className="h-5 w-5" />
                  Key Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.strengths.map((strength: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-700/50">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analysis.concerns && (
            <Card className="glass-morphism transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg font-bold text-orange-700 dark:text-orange-400">
                  <AlertTriangle className="h-5 w-5" />
                  Key Concerns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.concerns.map((concern: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-orange-50/50 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-700/50">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{concern}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Growth Catalysts */}
      {analysis.catalysts && (
        <Card className="glass-morphism transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              Growth Catalysts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.catalysts.map((catalyst: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50">
                  <Zap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{catalyst}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Analysis */}
      {analysis.riskFactors && (
        <Card className="glass-morphism transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysis.riskFactors.map((risk: any, index: number) => (
                <div key={index} className="p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{risk.factor}</span>
                    <Badge className={getScoreColor(risk.score)}>
                      {risk.level}
                    </Badge>
                  </div>
                  <Progress value={risk.score} className="mb-2" />
                  <div className="text-xs text-gray-600 dark:text-gray-400">{risk.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIAnalysis;
