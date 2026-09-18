import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Zap, RefreshCw } from 'lucide-react';
import CompanyLogo from '@/components/CompanyLogo';
import { fetchTopMovers, type TopMover, type TopMoversData } from '@/services/topMoversService';
import { useNavigate } from 'react-router-dom';

const SparklineChart = ({ data, isPositive }: { data: number[]; isPositive: boolean }) => {
  const w = 64, h = 20, p = 2;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const points = data.map((v, i) => {
    const x = p + (i / (data.length - 1)) * (w - p * 2);
    const y = h - p - ((v - min) / range) * (h - p * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline fill="none" stroke={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

const generateSparkline = (isPositive: boolean): number[] => {
  let v = 50;
  return Array.from({ length: 20 }, () => {
    v += (Math.random() - 0.5 + (isPositive ? 0.3 : -0.3)) * 5;
    return Math.max(20, Math.min(80, v));
  });
};

const formatVolume = (n: number) =>
  n >= 10000000 ? (n / 10000000).toFixed(1) + 'Cr' :
  n >= 100000  ? (n / 100000).toFixed(1) + 'L' :
  n.toLocaleString('en-IN');

interface StockRow extends TopMover { sparkline: number[] }

const PremiumTopMovers = () => {
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers'>('gainers');
  const [data, setData] = useState<TopMoversData | null>(null);
  const [rows, setRows] = useState<{ gainers: StockRow[]; losers: StockRow[] }>({ gainers: [], losers: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const enrich = (stocks: TopMover[], pos: boolean): StockRow[] =>
    stocks.map(s => ({ ...s, sparkline: generateSparkline(pos) }));

  const load = useCallback(async (force = false) => {
    if (force) setIsRefreshing(true); else setIsLoading(true);
    try {
      const result = await fetchTopMovers(force);
      setData(result);
      setRows({ gainers: enrich(result.gainers, true), losers: enrich(result.losers, false) });
    } catch (e) {
      console.error('[TopMovers]', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load(), 60000);
    return () => clearInterval(t);
  }, [load]);

  const display = activeTab === 'gainers' ? rows.gainers.slice(0, 6) : rows.losers.slice(0, 6);

  const handleRowClick = (symbol: string) => {
    const formatted = symbol.includes('.NS') ? symbol : `${symbol}.NS`;
    navigate(`/stock/${formatted}`);
  };

  return (
    <div className="premium-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Top Market Movers</h2>
          {data && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {data.timestamp.toLocaleTimeString()} · {data.source}
            </span>
          )}
        </div>
        <button
          onClick={() => load(true)}
          disabled={isRefreshing}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tab toggle */}
      <div className="flex bg-muted/20 rounded-lg p-1 mb-4 w-fit gap-1">
        <button
          onClick={() => setActiveTab('gainers')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'gainers'
              ? 'bg-success/15 text-success'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp className="w-3 h-3" /> Gainers
        </button>
        <button
          onClick={() => setActiveTab('losers')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'losers'
              ? 'bg-destructive/15 text-destructive'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingDown className="w-3 h-3" /> Losers
        </button>
      </div>

      {/* Table */}
      <div>
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 pb-2 border-b border-border/40 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          <span>Company</span>
          <span className="text-right hidden sm:block">7D Trend</span>
          <span className="text-right">Price / Change</span>
        </div>

        <div className="divide-y divide-border/20">
          {isLoading && display.length === 0 ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-x-4 py-3 items-center">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-muted/20 animate-pulse" />
                  <div className="h-4 w-28 bg-muted/20 rounded animate-pulse" />
                </div>
                <div className="h-5 w-16 bg-muted/10 rounded animate-pulse hidden sm:block" />
                <div className="h-4 w-24 bg-muted/20 rounded animate-pulse" />
              </div>
            ))
          ) : display.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs">No data available</div>
          ) : (
            display.map((stock) => {
              const pos = stock.changePercent >= 0;
              return (
                <button
                  key={stock.symbol}
                  onClick={() => handleRowClick(stock.symbol)}
                  className="w-full grid grid-cols-[1fr_auto_auto] gap-x-4 py-3 items-center hover:bg-muted/10 transition-colors text-left rounded-lg -mx-2 px-2"
                >
                  {/* Name */}
                  <div className="flex min-w-0 items-center gap-2.5">
                    <CompanyLogo symbol={stock.symbol} name={stock.name} size="sm" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">{stock.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{stock.symbol}</div>
                    </div>
                  </div>
                  {/* Sparkline */}
                  <div className="hidden sm:block">
                    <SparklineChart data={stock.sparkline} isPositive={pos} />
                  </div>
                  {/* Price */}
                  <div className="text-right">
                    <div className="text-xs font-mono text-foreground">
                      ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-[10px] font-mono font-medium ${pos ? 'text-success' : 'text-destructive'}`}>
                      {pos ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border/40 text-[10px] text-muted-foreground text-center">
        NIFTY 500 basket · Click row to analyze
      </div>
    </div>
  );
};

export default PremiumTopMovers;
