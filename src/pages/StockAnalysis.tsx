
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import PremiumNavbar from '@/components/PremiumNavbar';
import StockChart from '@/components/StockChart';
import FundamentalAnalysis from '@/components/FundamentalAnalysis';
import TechnicalAnalysis from '@/components/TechnicalAnalysis';
import AIAnalysis from '@/components/AIAnalysis';
import PricePrediction from '@/components/PricePrediction';
import RealTimePriceDisplay from '@/components/RealTimePriceDisplay';
import WatchlistButton from '@/components/WatchlistButton';
import { fetchStockData } from '@/utils/stockApi';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, BarChart3, Brain, Activity, Zap, ArrowLeft } from 'lucide-react';
import CompanyLogo from '@/components/CompanyLogo';
import PremiumLoader from '@/components/PremiumLoader';
import Seo from '@/components/Seo';

const StockAnalysis = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chart');
  const { toast } = useToast();

  useEffect(() => {
    if (symbol) {
      loadStockData(symbol);
    }
  }, [symbol]);

  const loadStockData = async (stockSymbol: string) => {
    setLoading(true);
    try {
      const data = await fetchStockData(stockSymbol);
      console.log('Loaded stock data:', data);
      setStockData(data);
    } catch (error) {
      toast({
        title: "Stock not found",
        description: "Please check the symbol and try again",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleStockSelect = (newSymbol: string) => {
    navigate(`/stock/${newSymbol}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PremiumNavbar />
        <div className="pt-32 flex items-center justify-center min-h-[60vh]">
          <PremiumLoader size="lg" text={`Loading ${symbol?.replace('.NS', '')}`} />
        </div>
      </div>
    );
  }

  if (!stockData) {
    return (
      <div className="min-h-screen bg-background">
        <PremiumNavbar />
        <div className="pt-32 px-6 max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-3 text-foreground">Stock Not Found</h1>
          <p className="text-muted-foreground mb-6">No data available for "{symbol}".</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const plainSymbol = symbol?.replace('.NS', '').replace('.BO', '') ?? '';
  const companyName = stockData.info?.longName || plainSymbol;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title={`${companyName} (${plainSymbol}) share price & analysis — Stocksense`}
        description={`Live price, chart, fundamentals and technical analysis for ${companyName} (${plainSymbol}) on NSE.`}
      />
      <div className="fixed top-0 left-0 right-0 z-50">
        <PremiumNavbar />
      </div>

      <main className="pt-24">
        {/* Header */}
        <section className="px-5 lg:px-8 pt-6 pb-4">
          <div className="glass-panel max-w-[1200px] mx-auto rounded-[2rem] p-6 md:p-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="mb-4 -ml-2 text-muted-foreground hover:text-foreground h-8"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Dashboard
            </Button>

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex min-w-0 items-center gap-3.5">
                <CompanyLogo symbol={plainSymbol} name={stockData.info?.longName} size="lg" />
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                    {stockData.info?.longName || symbol?.replace('.NS', '')}
                  </h1>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {symbol?.replace('.NS', '')} · NSE
                  </p>
                </div>
              </div>
              <WatchlistButton currentStock={{ ...stockData, symbol }} />
            </div>

            <div className="mt-4">
              <RealTimePriceDisplay symbol={symbol || ''} companyName={stockData.info?.longName} />
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="px-5 lg:px-8 py-6">
          <div className="max-w-[1200px] mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="glass-control h-11 p-1 mb-5 inline-flex max-w-full overflow-x-auto rounded-full">
                {[
                  { value: 'chart', icon: BarChart3, label: 'Chart' },
                  { value: 'fundamentals', icon: TrendingUp, label: 'Fundamentals' },
                  { value: 'technical', icon: Activity, label: 'Technical' },
                  { value: 'ai-analysis', icon: Brain, label: 'AI Insight' },
                  { value: 'prediction', icon: Zap, label: 'Prediction' },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="text-xs h-9 px-4 gap-1.5 rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm"
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {[
                { value: 'chart', component: <StockChart data={stockData} onSearchClick={() => navigate('/')} /> },
                { value: 'fundamentals', component: <FundamentalAnalysis data={stockData} /> },
                { value: 'technical', component: <TechnicalAnalysis data={stockData} /> },
                { value: 'ai-analysis', component: <AIAnalysis data={stockData} symbol={symbol || ''} /> },
                { value: 'prediction', component: <PricePrediction data={stockData} symbol={symbol || ''} /> },
              ].map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="mt-0">
                  <div className="premium-card overflow-hidden">{tab.component}</div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StockAnalysis;
