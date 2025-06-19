'use client';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/contexts/ThemeContext';
import Navbar from '@/components/Navbar';
import StockChart from '@/components/StockChart';
import FundamentalAnalysis from '@/components/FundamentalAnalysis';
import TechnicalAnalysis from '@/components/TechnicalAnalysis';
import AIAnalysis from '@/components/AIAnalysis';
import PricePrediction from '@/components/PricePrediction';
import StockSearch from '@/components/StockSearch';
import Watchlist from '@/components/Watchlist';
import NewsFeed from '@/components/NewsFeed';
import LiveMarketIndices from '@/components/LiveMarketIndices';
import LiveMarketClock from '@/components/LiveMarketClock';
import RealTimePriceDisplay from '@/components/RealTimePriceDisplay';
import { fetchStockData } from '@/utils/stockApi';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, TrendingUp, DollarSign, Activity, Brain, Zap } from 'lucide-react';

const Index = () => {
  const [stockSymbol, setStockSymbol] = useState('');
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { isDark } = useTheme();
  const { toast } = useToast();

  const handleAnalyze = async (symbol: string) => {
    if (!symbol.trim()) {
      toast({
        title: 'Enter a stock symbol',
        description: 'Please enter a valid stock symbol to analyze',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setStockSymbol(symbol);

    try {
      const data = await fetchStockData(symbol);
      setStockData(data);
      setActiveTab('chart');
      toast({
        title: 'Stock loaded',
        description: `Analysis ready for ${symbol.replace('.NS', '')}`,
      });
    } catch (error) {
      toast({
        title: 'Stock not found',
        description: 'Please check the symbol and try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFromChart = () => {
    setActiveTab('overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={`min-h-screen overflow-x-hidden transition duration-300 ${
        isDark ? 'bg-black text-white' : 'bg-white text-black'
      }`}
    >
      <Navbar />

      {/* Hero Section */}
      <section
        className={`pt-24 pb-20 relative z-10 bg-cover bg-center bg-no-repeat transition-all duration-300 ${
          isDark
            ? "bg-[url('/bg.png')]"
            : "bg-[url('/bg-light.png')]"
        }`}
      >
        {/* Clock in bottom-right */}
        {isDark && (
          <div className="absolute bottom-6 right-6 z-50">
            <div className="rounded-xl bg-black/70 text-white px-4 py-2 text-sm shadow-lg backdrop-blur">
              <LiveMarketClock />
            </div>
          </div>
        )}

        {/* Optional black overlay */}
        {isDark && <div className="absolute inset-0 bg-black bg-opacity-60 z-0" />}

        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <h1
            className={`text-5xl sm:text-6xl md:text-7xl font-semibold leading-tight mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            Analyze Smarter.<br /> Trade Confidently.
          </h1>

          <p
            className={`text-lg md:text-xl font-normal mb-6 max-w-xl mx-auto ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            AI-powered insights to boost your trading performance.
          </p>

          <button
            className={`backdrop-blur-md font-medium px-6 py-3 rounded-xl transition duration-300 border ${
              isDark
                ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                : 'bg-black/10 border-black/10 text-black hover:bg-black/20'
            } shadow-sm`}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Start Your Analysis Now
          </button>

          
        </div>

        {/* Search Box */}
        <div className="max-w-2xl mx-auto mt-12 relative z-10">
          <div
            className={`rounded-2xl p-8 ${
              isDark
                ? 'bg-black/40 backdrop-blur-sm border border-white/10'
                : 'bg-white border border-gray-200 shadow-2xl'
            }`}
          >
            <StockSearch onStockSelect={handleAnalyze} loading={loading} />
          </div>
        </div>
      </section>

      {/* Real-time Price Display */}
      {stockData && stockSymbol && (
        <div className="max-w-4xl mx-auto mb-12">
          <div
            className={`rounded-2xl p-6 ${
              isDark
                ? 'bg-black/40 backdrop-blur-sm border border-white/10'
                : 'bg-white border border-gray-200 shadow-2xl'
            }`}
          >
            <RealTimePriceDisplay symbol={stockSymbol} companyName={stockData.info?.longName} />
          </div>
        </div>
      )}

      {/* Tabs Section */}
      <div className="max-w-7xl mx-auto px-6 pb-20 relative z-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-center mb-12">
            <TabsList className="bg-transparent p-0 gap-1 flex-wrap justify-center">
              {[
                { value: 'overview', icon: BarChart3, label: 'Overview' },
                { value: 'chart', icon: TrendingUp, label: 'Chart' },
                { value: 'fundamentals', icon: DollarSign, label: 'Financials' },
                { value: 'technical', icon: Activity, label: 'Technical' },
                { value: 'ai-analysis', icon: Brain, label: 'AI Analysis' },
                { value: 'prediction', icon: Zap, label: 'Forecast' },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition ${
                    activeTab === tab.value
                      ? isDark
                        ? 'border-white text-white'
                        : 'border-black text-black'
                      : isDark
                      ? 'border-transparent text-gray-500 hover:text-white'
                      : 'border-transparent text-gray-500 hover:text-black'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[<LiveMarketIndices key="indices" />, <Watchlist key="watchlist" currentStock={stockData} onStockSelect={handleAnalyze} />, <NewsFeed key="news" symbol={stockSymbol} />].map((component, index) => (
                <div
                  key={index}
                  className={`rounded-2xl p-6 ${
                    isDark
                      ? 'bg-black/40 backdrop-blur-sm border border-white/10'
                      : 'bg-white border border-gray-200 shadow-2xl'
                  }`}
                >
                  {component}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Data Tabs */}
          {stockData && (
            <>
              {[
                { value: 'chart', component: <StockChart data={stockData} onSearchClick={handleSearchFromChart} /> },
                { value: 'fundamentals', component: <FundamentalAnalysis data={stockData} /> },
                { value: 'technical', component: <TechnicalAnalysis data={stockData} /> },
                { value: 'ai-analysis', component: <AIAnalysis data={stockData} symbol={stockSymbol} /> },
                { value: 'prediction', component: <PricePrediction data={stockData} symbol={stockSymbol} /> },
              ].map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>
                  <div
                    className={`rounded-2xl p-6 ${
                      isDark
                        ? 'bg-black/40 backdrop-blur-sm border border-white/10'
                        : 'bg-white border border-gray-200 shadow-2xl'
                    }`}
                  >
                    {tab.component}
                  </div>
                </TabsContent>
              ))}
            </>
          )}

          {!stockData && !loading && activeTab !== 'overview' && (
            <div className="text-center py-20">
              <div
                className={`max-w-md mx-auto rounded-2xl p-12 ${
                  isDark
                    ? 'bg-black/40 border border-white/10 text-gray-300'
                    : 'bg-white border border-gray-200 text-gray-600 shadow-2xl'
                }`}
              >
                <BarChart3 className="h-16 w-16 mx-auto mb-6 opacity-60" />
                <h3 className="text-xl font-light mb-2">Select a stock to analyze</h3>
                <p className="text-sm font-light opacity-80">Search for any Indian stock to get detailed insights</p>
              </div>
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
