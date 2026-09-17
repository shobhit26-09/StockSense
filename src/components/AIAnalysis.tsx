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

  const generateAIAnalysis = () => {
    setAnalysis({
      overallScore: 0,
      recommendation: 'HOLD',
      confidence: 0,
      targetPrice: data?.info?.currentPrice || data?.info?.regularMarketPrice || 0,
      riskLevel: 'High',
      timeHorizon: 'Unavailable',
      error: 'AI analysis is currently disabled.'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    if (score >= 60) return 'text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    if (score >= 40) return 'text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-300 border-orange-200 dark:border-orange-800';
    return 'text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800';
  };

  const getRecommendationStyle = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY': return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 dark:shadow-emerald-900/50';
      case 'HOLD': return 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-blue-900/50';
      case 'SELL': return 'bg-red-600 hover:bg-red-700 text-white shadow-red-200 dark:shadow-red-900/50';
      default: return 'bg-slate-600 hover:bg-slate-700 text-white';
    }
  };

  if (!analysis && !loading) {
    return (
      <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">AI-Powered Investment Analysis</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Advanced AI analysis using Google Gemini to analyze market data, financial metrics, 
            technical indicators, and sentiment to provide comprehensive investment insights.
          </p>
          <Button 
            onClick={generateAIAnalysis}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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
      <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Brain className="h-8 w-8 text-white animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">AI Analysis in Progress</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Gemini AI is analyzing market data, financial metrics, and technical indicators...
            </p>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (analysis?.error) {
    return (
      <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Analysis Failed</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{analysis.error}</p>
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
      <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-white">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              Gemini AI Investment Assessment
            </CardTitle>
            <Button 
              onClick={generateAIAnalysis}
              variant="outline"
              size="sm"
              className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Brain className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">{analysis.overallScore}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">Overall Score</div>
              <Progress value={analysis.overallScore} className="mb-3 h-2" />
              <Badge className={`${getScoreColor(analysis.overallScore)} border`}>
                {analysis.overallScore >= 70 ? 'Strong' : analysis.overallScore >= 50 ? 'Moderate' : 'Weak'}
              </Badge>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-semibold mb-2 text-slate-900 dark:text-white">{analysis.recommendation}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">AI Recommendation</div>
              <Badge className={`${getRecommendationStyle(analysis.recommendation)} text-lg px-4 py-2 shadow-lg border-0`}>
                {analysis.recommendation}
              </Badge>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-semibold mb-2 text-slate-900 dark:text-white">₹{analysis.targetPrice?.toFixed(2) || 'N/A'}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">Target Price</div>
              {analysis.targetPrice && (
                <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  {((analysis.targetPrice / (data?.info?.currentPrice || data?.info?.regularMarketPrice || 1400) - 1) * 100).toFixed(1)}% potential
                </div>
              )}
            </div>
            
            <div className="text-center p-6 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-semibold mb-2 text-slate-900 dark:text-white">{analysis.confidence}%</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">Confidence Level</div>
              <Progress value={analysis.confidence} className="mb-2 h-2" />
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">{analysis.timeHorizon}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {analysis.marketPosition && analysis.financialHealth && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white">
                <Target className="h-5 w-5 text-blue-600" />
                Market Position
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Market Cap Rank</span>
                <Badge className="bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  #{analysis.marketPosition.marketCapRank}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Competitive Advantage</span>
                <span className="font-medium text-slate-900 dark:text-white">{analysis.marketPosition.competitiveAdvantage}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Moat Strength</span>
                  <span className="font-medium text-slate-900 dark:text-white">{analysis.marketPosition.moatStrength}%</span>
                </div>
                <Progress value={analysis.marketPosition.moatStrength} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                Financial Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">ROE</span>
                <span className="font-medium text-slate-900 dark:text-white">{analysis.financialHealth.roe?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Debt/Equity</span>
                <span className="font-medium text-slate-900 dark:text-white">{analysis.financialHealth.debtToEquity?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Liquidity Ratio</span>
                <span className="font-medium text-slate-900 dark:text-white">{analysis.financialHealth.liquidityRatio?.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Interest Coverage</span>
                <span className="font-medium text-slate-900 dark:text-white">{analysis.financialHealth.interestCoverage?.toFixed(1)}x</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {(analysis.fundamentalScore || analysis.technicalScore || analysis.sentimentScore || analysis.momentumScore || analysis.valueScore) && (
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-white">
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
                <div key={metric.label} className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <metric.icon className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-xl font-semibold mb-1 text-slate-900 dark:text-white">{metric.score?.toFixed(0)}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{metric.label}</div>
                  <Progress value={metric.score} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {analysis.technicalSignals && analysis.technicalSignals.length > 0 && (
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-white">
              <Activity className="h-6 w-6 text-purple-600" />
              Technical Analysis Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysis.technicalSignals.map((signal: any, index: number) => (
                <div key={index} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{signal.indicator}</span>
                    <Badge className={`${getScoreColor(signal.signal === 'Buy' ? 80 : signal.signal === 'Sell' ? 20 : 60)} border`}>
                      {signal.signal}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">{signal.value}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">Strength: {signal.strength}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(analysis.strengths || analysis.concerns) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analysis.strengths && (
            <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle className="h-5 w-5" />
                  Key Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.strengths.map((strength: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{strength}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analysis.concerns && (
            <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-orange-700 dark:text-orange-400">
                  <AlertTriangle className="h-5 w-5" />
                  Key Concerns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.concerns.map((concern: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{concern}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {analysis.catalysts && (
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-white">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              Growth Catalysts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.catalysts.map((catalyst: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                  <Zap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{catalyst}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {analysis.riskFactors && (
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-white">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-600 to-pink-600 shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysis.riskFactors.map((risk: any, index: number) => (
                <div key={index} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{risk.factor}</span>
                    <Badge className={`${getScoreColor(risk.score)} border`}>
                      {risk.level}
                    </Badge>
                  </div>
                  <Progress value={risk.score} className="mb-2" />
                  <div className="text-xs text-slate-600 dark:text-slate-400">{risk.description}</div>
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
