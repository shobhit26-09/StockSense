import PageShell from '@/components/PageShell';
import SmartTradeAgent from '@/components/SmartTradeAgent';
import QuickWatchlist from '@/components/QuickWatchlist';

const AgentPage = () => (
  <PageShell
    eyebrow="Intelligence"
    title="Algorithmic trade agent"
    sub="Heuristic momentum scanner over live NSE quotes, FII/DII flows, breadth and ATR-based risk. Every signal is auditable — no black-box models."
  >
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-8"><SmartTradeAgent /></div>
      <div className="lg:col-span-4"><QuickWatchlist /></div>
    </div>
  </PageShell>
);

export default AgentPage;