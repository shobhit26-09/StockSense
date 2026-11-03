import PageShell from '@/components/PageShell';
import SmartTradeAgent from '@/components/SmartTradeAgent';
import QuickWatchlist from '@/components/QuickWatchlist';
import { Link } from 'react-router-dom';

const AgentPage = () => (
  <PageShell
    eyebrow="Intelligence"
    title="Algorithmic trade agent"
    sub="Heuristic momentum scanner over live NSE quotes, FII/DII flows, breadth and ATR-based risk. Every signal is auditable — no black-box models."
  >
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-8"><SmartTradeAgent /></div>
      <div className="lg:col-span-4 space-y-4">
        <QuickWatchlist />
        <Link to="/screener" className="block rounded-lg border border-border/50 bg-card/50 p-4 text-xs text-muted-foreground hover:border-border transition-colors">
          <span className="block text-foreground font-semibold mb-1">Screener presets</span>
          Near highs, volume surge, pullbacks and more, each with its exact rule.
        </Link>
      </div>
    </div>
  </PageShell>
);

export default AgentPage;
