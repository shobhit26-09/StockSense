import PageShell from '@/components/PageShell';
import SectorBoard from '@/components/SectorBoard';

const SectorPage = () => (
  <PageShell
    eyebrow="Sectors"
    title="Sector flows and performance"
    sub="Which sectors are attracting money, which are losing it, and who is leading, ranked from real NSE closing data."
    seoTitle="Sector flows and performance - NSE sectors | StockSense"
  >
    <SectorBoard />
  </PageShell>
);

export default SectorPage;
