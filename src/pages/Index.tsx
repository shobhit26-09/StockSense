import PremiumNavbar from '@/components/PremiumNavbar';
import PremiumStockTicker from '@/components/PremiumStockTicker';
import MarketHero from '@/components/MarketHero';
import FeatureGrid from '@/components/FeatureGrid';
import MarketMap from '@/components/MarketMap';
import MarketSentiment from '@/components/MarketSentiment';
import PremiumTopMovers from '@/components/PremiumTopMovers';
import PremiumNewsFeed from '@/components/PremiumNewsFeed';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Seo from '@/components/Seo';
import FaqSection from '@/components/FaqSection';
import ShowcaseNotice from '@/components/ShowcaseNotice';

const SectionHead = ({ title, to }: { title: string; to?: string }) => (
  <div className="mb-5 flex items-center gap-4 px-1">
    <h2 className="font-display shrink-0 text-xl font-semibold tracking-tight text-foreground">{title}</h2>
    <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
    {to && (
      <Link to={to} className="group inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-light">
        View all
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </Link>
    )}
  </div>
);

const Index = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Seo
      title="StockSense — Indian Stock Market Dashboard for NSE & BSE"
      description="StockSense is a free Indian stock market dashboard: live NSE and BSE quotes, top movers, sector outlooks, market breadth, macro events and news in one clear view."
      path="/"
    />
    <div className="fixed top-0 left-0 right-0 z-50">
      <PremiumNavbar />
      <PremiumStockTicker />
    </div>

    <main className="pt-[112px] pb-24">
      <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
        <ShowcaseNotice />
        <MarketHero />

        <div className="mt-5"><MarketSentiment /></div>

        <section className="mt-5">
          <MarketMap />
        </section>

        <section className="mt-14 grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 min-w-0">
            <SectionHead title="Today's movers" />
            <PremiumTopMovers limit={8} />
          </div>
          <div className="min-w-0">
            <SectionHead title="Live news" to="/news" />
            <PremiumNewsFeed />
          </div>
        </section>

        <section className="mt-16">
          <FeatureGrid />
        </section>

        <FaqSection />
      </div>
    </main>
  </div>
);

export default Index;
