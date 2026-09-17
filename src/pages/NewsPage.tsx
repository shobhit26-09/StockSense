import PageShell from '@/components/PageShell';
import BulkBlockDeals from '@/components/BulkBlockDeals';
import PremiumNewsFeed from '@/components/PremiumNewsFeed';

const NewsPage = () => (
  <PageShell
    eyebrow="Tape"
    title="Bulk deals & live news"
    sub="Institutional flow and breaking headlines from across the Indian market."
  >
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-7"><BulkBlockDeals /></div>
      <div className="lg:col-span-5"><PremiumNewsFeed /></div>
    </div>
  </PageShell>
);

export default NewsPage;