import PageShell from '@/components/PageShell';
import FiiDiiBoard from '@/components/FiiDiiBoard';

const FiiDiiPage = () => (
  <PageShell
    eyebrow="Institutions"
    title="FII and DII activity"
    sub="Net buying and selling by foreign (FII) and domestic (DII) institutions in the cash market, against the Nifty."
    seoTitle="FII DII data today - daily net buy and sell | StockSense"
  >
    <FiiDiiBoard />
  </PageShell>
);

export default FiiDiiPage;
