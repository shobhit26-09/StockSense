import PageShell from '@/components/PageShell';
import PremiumTopMovers from '@/components/PremiumTopMovers';

const MoversPage = () => (
  <PageShell
    eyebrow="Momentum"
    title="Top movers"
    sub="Gainers, losers and volume shockers across NIFTY 100, 500, Midcap, Smallcap and Total Market."
  >
    <PremiumTopMovers limit={20} expandable />
  </PageShell>
);

export default MoversPage;