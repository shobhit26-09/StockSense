import PageShell from '@/components/PageShell';
import PremiumTopMovers from '@/components/PremiumTopMovers';

const MoversPage = () => (
  <PageShell
    eyebrow="Momentum"
    title="Top movers"
    sub="Today's leaders and laggards across NIFTY indices."
  >
    <PremiumTopMovers />
  </PageShell>
);

export default MoversPage;