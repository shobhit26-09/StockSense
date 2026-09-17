import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, BarChart3, Activity, Building2, Calculator, Target, TrendingUp } from 'lucide-react';

interface FundamentalAnalysisProps {
  data: any;
}

const FundamentalAnalysis: React.FC<FundamentalAnalysisProps> = ({ data }) => {
  // Extract real data from the API response
  const getFinancialData = () => {
    const info = data?.info || {};
    
    console.log('Raw financial data received:', info);

    return {
      // Basic company info
      companyName: info.longName || info.shortName || 'Stock Analysis',
      sector: info.sector || 'Unknown Sector',
      industry: info.industry || 'Unknown Industry',
      employees: info.fullTimeEmployees || null,
      logo: info.logo || null, // Company logo from FMP
      
      // Price and market data
      currentPrice: info.regularMarketPrice || info.currentPrice || 0,
      marketCap: info.marketCap || null,
      enterpriseValue: info.enterpriseValue || null,
      
      // Valuation ratios
      peRatio: info.trailingPE || null,
      pegRatio: info.pegRatio || null,
      pbRatio: info.priceToBook || null,
      psRatio: info.priceToSalesTrailing12Months || null,
      
      // Financial health
      debtToEquity: info.debtToEquity || null,
      currentRatio: info.currentRatio || null,
      quickRatio: info.quickRatio || null,
      
      // Profitability (handle both percentage and decimal formats)
      grossMargin: info.grossMargins || null,
      operatingMargin: info.operatingMargins || null,
      netMargin: info.profitMargins || null,
      roe: info.returnOnEquity || null,
      roa: info.returnOnAssets || null,
      
      // Growth
      revenueGrowth: info.revenueGrowth || null,
      earningsGrowth: info.earningsGrowth || null,
      
      // Dividend
      dividendYield: info.dividendYield || null,
      dividendRate: info.dividendRate || null,
      payoutRatio: info.payoutRatio || null,
      
      // Other metrics
      beta: info.beta || null,
      bookValue: info.bookValue || null,
      earningsPerShare: info.trailingEps || null,
      fiftyTwoWeekHigh: info.fiftyTwoWeekHigh || null,
      fiftyTwoWeekLow: info.fiftyTwoWeekLow || null,
      
      // Data quality indicator
      isEstimated: info.isEstimated || false
    };
  };

  const fundamentals = getFinancialData();

  // Format functions
  const formatLargeNumber = (num: number | null): string => {
    if (!num || num === 0) return 'N/A';
    if (num >= 1e12) return `₹${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `₹${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)}Cr`;
    if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)}L`;
    return `₹${num.toFixed(2)}`;
  };

  const formatPercentage = (num: number | null): string => {
    if (num === null || num === undefined) return 'N/A';
    return `${num.toFixed(2)}%`;
  };

  const formatRatio = (num: number | null): string => {
    if (num === null || num === undefined) return 'N/A';
    return num.toFixed(2);
  };

  const formatNumber = (num: number | null): string => {
    if (num === null || num === undefined) return 'N/A';
    return num.toFixed(2);
  };

  // Enhanced scoring system using real data
  const getFundamentalScore = (): number => {
    let score = 0;
    let factors = 0;

    // PE Ratio scoring (only if available and not estimated)
    if (fundamentals.peRatio !== null && !fundamentals.isEstimated) {
      if (fundamentals.peRatio > 0 && fundamentals.peRatio < 15) { score += 25; }
      else if (fundamentals.peRatio <= 25) { score += 20; }
      else if (fundamentals.peRatio <= 35) { score += 15; }
      else { score += 5; }
      factors++;
    }

    // ROE scoring (only if available and not estimated)
    if (fundamentals.roe !== null && !fundamentals.isEstimated) {
      if (fundamentals.roe > 20) { score += 25; }
      else if (fundamentals.roe > 15) { score += 20; }
      else if (fundamentals.roe > 10) { score += 15; }
      else { score += 5; }
      factors++;
    }

    // Debt to Equity (only if available and not estimated)
    if (fundamentals.debtToEquity !== null && !fundamentals.isEstimated) {
      if (fundamentals.debtToEquity < 50) { score += 25; }
      else if (fundamentals.debtToEquity < 100) { score += 15; }
      else { score += 5; }
      factors++;
    }

    // Current Ratio (only if available and not estimated)
    if (fundamentals.currentRatio !== null && !fundamentals.isEstimated) {
      if (fundamentals.currentRatio >= 1.5 && fundamentals.currentRatio <= 3) { score += 25; }
      else if (fundamentals.currentRatio >= 1) { score += 15; }
      else { score += 5; }
      factors++;
    }

    // Operating Margin (only if available and not estimated)
    if (fundamentals.operatingMargin !== null && !fundamentals.isEstimated) {
      if (fundamentals.operatingMargin > 20) { score += 25; }
      else if (fundamentals.operatingMargin > 15) { score += 20; }
      else if (fundamentals.operatingMargin > 10) { score += 15; }
      else { score += 5; }
      factors++;
    }

    // If no real factors available, use estimated data with lower weight
    if (factors === 0) {
      // Use estimated data but with reduced confidence
      if (fundamentals.peRatio !== null) { score += 10; factors++; }
      if (fundamentals.roe !== null) { score += 10; factors++; }
      if (fundamentals.currentRatio !== null) { score += 10; factors++; }
      
      if (factors === 0) return 50; // Default if no data
      return Math.round(score / factors);
    }

    return Math.round(score / factors);
  };

  const fundamentalScore = getFundamentalScore();

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBadge = (score: number): { variant: any, text: string } => {
    if (score >= 80) return { variant: 'default', text: 'Strong' };
    if (score >= 60) return { variant: 'secondary', text: 'Moderate' };
    return { variant: 'destructive', text: 'Weak' };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-md bg-primary/10 border border-primary/20 shrink-0">
            <Calculator className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground truncate">Fundamental Analysis</h2>
            <p className="text-xs text-muted-foreground truncate">{fundamentals.companyName}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-2xl font-bold font-mono ${getScoreColor(fundamentalScore)}`}>
            {fundamentalScore}<span className="text-sm text-muted-foreground">/100</span>
          </div>
          <Badge variant="outline" className="text-[10px] mt-1">
            {getScoreBadge(fundamentalScore).text}
          </Badge>
        </div>
      </div>

      {fundamentals.isEstimated && (
        <div className="text-[11px] text-warning bg-warning/5 border border-warning/20 rounded-md px-3 py-2 flex items-center gap-2">
          <Activity className="h-3 w-3 shrink-0" />
          Some metrics are estimated where real-time data is unavailable.
        </div>
      )}

      {/* Key Metrics — clean strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCell icon={<DollarSign className="h-3.5 w-3.5" />} label="Market Cap" value={formatLargeNumber(fundamentals.marketCap)} />
        <KpiCell icon={<BarChart3 className="h-3.5 w-3.5" />} label="P/E Ratio" value={formatRatio(fundamentals.peRatio)} />
        <KpiCell icon={<Target className="h-3.5 w-3.5" />} label="ROE" value={formatPercentage(fundamentals.roe)} />
        <KpiCell icon={<Activity className="h-3.5 w-3.5" />} label="Op. Margin" value={formatPercentage(fundamentals.operatingMargin)} />
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MetricGroup
          title="Valuation"
          icon={<DollarSign className="h-4 w-4" />}
          rows={[
            { label: 'P/E Ratio', value: formatRatio(fundamentals.peRatio), desc: 'Price to Earnings' },
            { label: 'P/B Ratio', value: formatRatio(fundamentals.pbRatio), desc: 'Price to Book' },
            { label: 'P/S Ratio', value: formatRatio(fundamentals.psRatio), desc: 'Price to Sales' },
            { label: 'PEG Ratio', value: formatRatio(fundamentals.pegRatio), desc: 'P/E to Growth' },
            { label: 'Enterprise Value', value: formatLargeNumber(fundamentals.enterpriseValue), desc: 'Total company value' },
          ]}
        />
        <MetricGroup
          title="Financial Health"
          icon={<Building2 className="h-4 w-4" />}
          rows={[
            { label: 'Current Ratio', value: formatRatio(fundamentals.currentRatio), desc: 'Short-term liquidity' },
            { label: 'Quick Ratio', value: formatRatio(fundamentals.quickRatio), desc: 'Immediate liquidity' },
            { label: 'Debt to Equity', value: formatRatio(fundamentals.debtToEquity), desc: 'Leverage' },
            { label: 'Beta', value: formatRatio(fundamentals.beta), desc: 'Market risk' },
            { label: 'Book Value', value: formatNumber(fundamentals.bookValue), desc: 'Per share' },
          ]}
        />
        <MetricGroup
          title="Profitability"
          icon={<TrendingUp className="h-4 w-4" />}
          rows={[
            { label: 'Gross Margin', value: formatPercentage(fundamentals.grossMargin), desc: 'Revenue efficiency' },
            { label: 'Operating Margin', value: formatPercentage(fundamentals.operatingMargin), desc: 'Operational' },
            { label: 'Net Margin', value: formatPercentage(fundamentals.netMargin), desc: 'Bottom line' },
            { label: 'ROE', value: formatPercentage(fundamentals.roe), desc: 'Return on Equity' },
            { label: 'ROA', value: formatPercentage(fundamentals.roa), desc: 'Return on Assets' },
          ]}
        />
        <MetricGroup
          title="Growth & Dividends"
          icon={<Activity className="h-4 w-4" />}
          rows={[
            { label: 'Revenue Growth', value: formatPercentage(fundamentals.revenueGrowth), desc: 'YoY' },
            { label: 'Earnings Growth', value: formatPercentage(fundamentals.earningsGrowth), desc: 'YoY' },
            { label: 'Dividend Yield', value: formatPercentage(fundamentals.dividendYield), desc: 'Annual yield' },
            { label: 'Dividend Rate', value: fundamentals.dividendRate ? `₹${fundamentals.dividendRate.toFixed(2)}` : 'N/A', desc: 'Per share/yr' },
            { label: 'EPS', value: fundamentals.earningsPerShare ? `₹${fundamentals.earningsPerShare.toFixed(2)}` : 'N/A', desc: 'Earnings per share' },
          ]}
        />
      </div>

      {/* Company snapshot */}
      <div className="rounded-md border border-border/50 bg-card/40 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Company Snapshot</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <SnapItem label="Sector" value={fundamentals.sector} />
          <SnapItem label="Industry" value={fundamentals.industry} />
          <SnapItem label="Employees" value={fundamentals.employees ? fundamentals.employees.toLocaleString() : 'N/A'} />
        </div>
        {fundamentals.fiftyTwoWeekHigh && fundamentals.fiftyTwoWeekLow && (
          <div className="mt-4 pt-4 border-t border-border/40">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">52-Week Range</div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-destructive">Low ₹{fundamentals.fiftyTwoWeekLow.toFixed(2)}</span>
              <span className="text-success">High ₹{fundamentals.fiftyTwoWeekHigh.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Score */}
      <div className="rounded-md border border-border/50 bg-card/40 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Overall Score</span>
          <span className={`text-sm font-bold font-mono ${getScoreColor(fundamentalScore)}`}>{fundamentalScore}/100</span>
        </div>
        <Progress value={fundamentalScore} className="h-1.5" />
        <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          Composite score based on PE, ROE, debt, liquidity, and operating margin.
        </p>
      </div>
    </div>
  );
};

const KpiCell = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-md border border-border/40 bg-card/30 p-3">
    <div className="flex items-center justify-between mb-1.5 text-muted-foreground">
      <span>{icon}</span>
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-base font-mono font-semibold text-foreground">{value}</div>
  </div>
);

const MetricGroup = ({ title, icon, rows }: { title: string; icon: React.ReactNode; rows: { label: string; value: string; desc: string }[] }) => (
  <div className="rounded-md border border-border/50 bg-card/40 p-4">
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/40">
      <span className="text-muted-foreground">{icon}</span>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    <div className="space-y-2">
      {rows.map((m, i) => (
        <div key={i} className="flex justify-between items-center py-1.5 text-xs">
          <div>
            <div className="font-medium text-foreground">{m.label}</div>
            <div className="text-[10px] text-muted-foreground">{m.desc}</div>
          </div>
          <div className="font-mono font-semibold text-foreground">{m.value}</div>
        </div>
      ))}
    </div>
  </div>
);

const SnapItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded bg-muted/20 p-2.5">
    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
    <div className="text-xs font-medium text-foreground mt-0.5 truncate">{value}</div>
  </div>
);

export default FundamentalAnalysis;
