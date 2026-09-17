import PageShell from '@/components/PageShell';
import IndicesHeatmap from '@/components/IndicesHeatmap';

const HeatmapPage = () => (
  <PageShell
    eyebrow="Breadth"
    title="Index heatmap"
    sub="Sector and constituent performance at a glance across NIFTY indices."
  >
    <div className="premium-card p-4">
      <IndicesHeatmap />
    </div>
  </PageShell>
);

export default HeatmapPage;