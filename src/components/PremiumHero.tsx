import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react';
import StockSearch from './StockSearch';

interface PremiumHeroProps {
  onAnalyze: (symbol: string) => void;
}

const PremiumHero = ({ onAnalyze }: PremiumHeroProps) => {
  const [marketStatus, setMarketStatus] = useState<'open' | 'closed' | 'pre' | 'post'>('closed');
  
  useEffect(() => {
    const checkMarketStatus = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const day = now.getDay();
      const timeInMinutes = hour * 60 + minute;
      
      // Closed on weekends
      if (day === 0 || day === 6) {
        setMarketStatus('closed');
        return;
      }
      
      const preMarketStart = 9 * 60;
      const marketOpen = 9 * 60 + 15;
      const marketClose = 15 * 60 + 30;
      const postMarketEnd = 16 * 60;
      
      if (timeInMinutes >= preMarketStart && timeInMinutes < marketOpen) {
        setMarketStatus('pre');
      } else if (timeInMinutes >= marketOpen && timeInMinutes < marketClose) {
        setMarketStatus('open');
      } else if (timeInMinutes >= marketClose && timeInMinutes < postMarketEnd) {
        setMarketStatus('post');
      } else {
        setMarketStatus('closed');
      }
    };
    
    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = () => {
    switch (marketStatus) {
      case 'open':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/20 rounded-full">
            <div className="w-2 h-2 bg-success rounded-full live-indicator" />
            <span className="text-sm font-medium text-success">Market Open</span>
          </div>
        );
      case 'pre':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning/10 border border-warning/20 rounded-full">
            <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
            <span className="text-sm font-medium text-warning">Pre-Market</span>
          </div>
        );
      case 'post':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-full">
            <div className="w-2 h-2 bg-accent rounded-full" />
            <span className="text-sm font-medium text-accent">Post-Market</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 border border-border rounded-full">
            <div className="w-2 h-2 bg-muted-foreground rounded-full" />
            <span className="text-sm font-medium text-muted-foreground">Market Closed</span>
          </div>
        );
    }
  };

  return (
    <section className="relative px-6 py-20 md:py-28 overflow-hidden">
      {/* Subtle gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px] transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/6 rounded-full blur-[100px] transform translate-x-1/2 translate-y-1/2" />
      </div>
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />
      
      <div className="max-w-5xl mx-auto relative">
        <div className="flex flex-col items-center text-center">
          {/* Status badge */}
          <div className="mb-8">
            {getStatusBadge()}
          </div>
          
          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight leading-[1.1]">
            Professional-Grade
            <br />
            <span className="text-gradient-premium">
              Market Intelligence
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed font-light">
            Real-time analytics for NSE & BSE with AI-powered insights, 
            technical analysis, and institutional-grade data visualization.
          </p>
          
          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <FeaturePill icon={<Zap className="w-3.5 h-3.5" />} text="Real-time Data" />
            <FeaturePill icon={<TrendingUp className="w-3.5 h-3.5" />} text="Technical Analysis" />
            <FeaturePill icon={<Sparkles className="w-3.5 h-3.5" />} text="AI Insights" />
            <FeaturePill icon={<Shield className="w-3.5 h-3.5" />} text="Multi-source API" />
          </div>
          
          {/* Search */}
          <div className="w-full max-w-xl mb-8">
            <StockSearch onStockSelect={onAnalyze} />
          </div>
          
          {/* Quick links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">Popular:</span>
            <QuickLink symbol="RELIANCE" onClick={() => onAnalyze('RELIANCE.NS')} />
            <QuickLink symbol="TCS" onClick={() => onAnalyze('TCS.NS')} />
            <QuickLink symbol="HDFCBANK" onClick={() => onAnalyze('HDFCBANK.NS')} />
            <QuickLink symbol="INFY" onClick={() => onAnalyze('INFY.NS')} />
          </div>
        </div>
      </div>
    </section>
  );
};

const FeaturePill = ({ icon, text }: { icon?: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border border-border rounded-full backdrop-blur-sm">
    {icon && <span className="text-primary">{icon}</span>}
    <span className="text-sm font-medium text-foreground/80">{text}</span>
  </div>
);

const QuickLink = ({ symbol, onClick }: { symbol: string; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group px-3 py-1.5 rounded-lg hover:bg-primary/5"
  >
    <span className="font-mono font-medium">{symbol}</span>
    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
  </button>
);

export default PremiumHero;
