import PageShell from '@/components/PageShell';
import SectorIdeas from '@/components/SectorIdeas';

const SectorPage = () => (
  <PageShell
    eyebrow="Allocation"
    title="Sector investment ideas"
    sub="An algorithmic read on which sectors are set up to lead or lag — scored on relative momentum, macro drivers, government policy and news flow, and institutional positioning."
  >
    <SectorIdeas />
  </PageShell>
);

export default SectorPage;
