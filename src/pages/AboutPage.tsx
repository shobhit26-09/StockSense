import { Link } from 'react-router-dom';
import PageShell from '@/components/PageShell';

const AboutPage = () => (
  <PageShell
    eyebrow="About"
    title="About StockSense"
    sub="A free dashboard for Indian stock markets, built as an independent open project."
    seoTitle="About StockSense — Indian Stock Market Dashboard"
    seoDescription="What StockSense is, where its data comes from. A free, independent dashboard for NSE and BSE markets."
  >
    <div className="max-w-3xl space-y-10 text-sm leading-relaxed text-muted-foreground">
      <section>
        <h2 className="text-base font-semibold text-foreground">What it is</h2>
        <p className="mt-3">
          StockSense puts the Indian market on one screen: NIFTY, Sensex and Bank NIFTY charts, gainers, losers and volume shockers, 20 sector views with estimated money flow, FII and DII activity, a market sentiment score, global markets and news. It is a free project by Shobhit Gupta, a frontend developer in India, and the code is public on{' '}
          <a className="text-foreground underline" href="https://github.com/shobhit26-09/StockSense" rel="noopener noreferrer">GitHub</a>.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Where the data comes from</h2>
        <p className="mt-3">
          Quotes and charts use Yahoo Finance and other free public feeds. Constituent lists come from NSE Indices. FII and DII history is compiled from NSE and BSE provisional data through StockEdge's public feed. Free feeds can be delayed, revised or blocked, so some figures are estimates and the page says so where it applies.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">More</h2>
        <p className="mt-3">
          Read the <Link className="text-foreground underline" to="/terms">terms of use</Link> and <Link className="text-foreground underline" to="/privacy">privacy policy</Link>, or <Link className="text-foreground underline" to="/contact">get in touch</Link>.
        </p>
      </section>
    </div>
  </PageShell>
);

export default AboutPage;
