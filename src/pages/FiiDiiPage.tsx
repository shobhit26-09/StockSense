import PageShell from '@/components/PageShell';
import FiiDiiBoard from '@/components/FiiDiiBoard';

const FiiDiiPage = () => (
  <PageShell
    eyebrow="Institutions"
    title="FII and DII activity"
    sub="What foreign and domestic institutions bought and sold, day by day, in cash, futures and options. Official NSE data."
    seoTitle="FII DII data today - daily net buy and sell | StockSense"
  >
    <FiiDiiBoard />
  </PageShell>
);

export default FiiDiiPage;
