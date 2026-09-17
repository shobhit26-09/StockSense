import { AlertTriangle, Brain, LockKeyhole } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AIAnalysisProps {
  data: unknown;
  symbol: string;
}

const AIAnalysis = ({ symbol }: AIAnalysisProps) => (
  <Card className="border border-border bg-card shadow-sm">
    <CardContent className="p-8 md:p-10">
      <div className="flex flex-col md:flex-row md:items-start gap-5">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0">
          <Brain className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
            AI analysis disabled
          </div>
          <h3 className="mt-2 text-xl font-semibold text-foreground">No generated investment call for {symbol}</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            StockSense does not currently send market data to an AI model or generate AI buy, sell, target-price, or confidence claims. Use the sourced market data and deterministic indicators on this page instead.
          </p>
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            Educational information only. Verify prices with your broker or exchange before making a decision.
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default AIAnalysis;
