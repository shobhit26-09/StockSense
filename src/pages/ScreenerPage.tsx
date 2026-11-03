import PageShell from '@/components/PageShell';
import ScreenerBoard from '@/components/ScreenerBoard';

const ScreenerPage = () => (
  <PageShell
    eyebrow="Discovery"
    title="Stock screener presets"
    sub="Five plain-rule screens over end-of-day NSE data. Each shows its exact rule and the numbers behind every match."
    seoTitle="NSE stock screener presets - near highs, volume surge, oversold | StockSense"
  >
    <ScreenerBoard />
  </PageShell>
);

export default ScreenerPage;
