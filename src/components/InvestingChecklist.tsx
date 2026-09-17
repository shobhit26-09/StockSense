import { BookOpen, TrendingUp, Shield, Target, BarChart2, AlertTriangle } from 'lucide-react';

interface CheckItem {
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'analysis' | 'risk' | 'timing';
}

const items: CheckItem[] = [
  {
    label: 'Check Fundamentals',
    description: 'P/E, P/B, ROE, Debt/Equity before entering a stock',
    icon: <BookOpen className="w-4 h-4" />,
    category: 'analysis',
  },
  {
    label: 'Review Technicals',
    description: 'Support/resistance, RSI, MACD for entry timing',
    icon: <BarChart2 className="w-4 h-4" />,
    category: 'analysis',
  },
  {
    label: 'Set Stop Loss',
    description: 'Define maximum loss tolerance before buying (5–8%)',
    icon: <AlertTriangle className="w-4 h-4" />,
    category: 'risk',
  },
  {
    label: 'Position Sizing',
    description: 'Never put more than 5–10% of capital in a single stock',
    icon: <Shield className="w-4 h-4" />,
    category: 'risk',
  },
  {
    label: 'Check Market Mood',
    description: 'Buy during fear, be cautious during extreme greed',
    icon: <TrendingUp className="w-4 h-4" />,
    category: 'timing',
  },
  {
    label: 'Define Target',
    description: 'Have a clear exit price with minimum 2:1 reward/risk',
    icon: <Target className="w-4 h-4" />,
    category: 'timing',
  },
];

const categoryColor: Record<CheckItem['category'], string> = {
  analysis: 'text-primary bg-primary/8',
  risk: 'text-destructive bg-destructive/8',
  timing: 'text-success bg-success/8',
};

const InvestingChecklist = () => {
  return (
    <div className="premium-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Pre-Trade Checklist</h2>
        <span className="ml-auto text-[10px] text-muted-foreground">Before every trade</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/10 border border-border/30 hover:border-border/60 transition-colors">
            <div className={`p-1.5 rounded-md flex-shrink-0 ${categoryColor[item.category]}`}>
              {item.icon}
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground mb-0.5">{item.label}</div>
              <div className="text-[10px] text-muted-foreground leading-relaxed">{item.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvestingChecklist;
