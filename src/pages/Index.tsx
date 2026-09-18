import PremiumNavbar from '@/components/PremiumNavbar';
import PremiumStockTicker from '@/components/PremiumStockTicker';
import MarketHero from '@/components/MarketHero';
import FeatureGrid from '@/components/FeatureGrid';
import PremiumTopMovers from '@/components/PremiumTopMovers';
import PremiumNewsFeed from '@/components/PremiumNewsFeed';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import Seo from '@/components/Seo';
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
      title="Stocksense — Live NSE & BSE market dashboard"
      description="Live Indian market quotes, top movers, sector outlooks, breadth and news in one clear dashboard."
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

        <section className="mt-5">
          <FeatureGrid />
        </section>

        <section className="mt-14 grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 min-w-0">
            <SectionHead title="Today's movers" to="/movers" />
            <PremiumTopMovers />
          </div>
          <div className="min-w-0">
            <SectionHead title="Live news" to="/news" />
            <PremiumNewsFeed />
          </div>
        </section>

        <footer className="mt-20 border-t border-border pt-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <span className="font-display text-sm font-bold tracking-tight">StockSense</span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
                A focused decision terminal for Indian markets—live context, transparent signals,
                and fewer distractions.
              </p>
            </div>
            <div>
              <div className="section-eyebrow mb-3">Data</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>NSE · BSE · Indices</li>
                <li>Sector outlook · Macro drivers</li>
                <li>Breadth · FII/DII flows</li>
                <li>Bulk &amp; block deals</li>
              </ul>
            </div>
            <div>
              <div className="section-eyebrow mb-3">Platform</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Live multi-source quotes</li>
                <li>Deterministic signal engine</li>
                <li>Resilient edge delivery</li>
                <li>60-second market refresh</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-t border-border py-6 text-[11px] text-muted-foreground">
            <span>© {new Date().getFullYear()} Stocksense — educational use, not financial advice.</span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success live-indicator" />
              Live · Yahoo Finance
            </span>
          </div>
        </footer>
      </div>
    </main>
  </div>
);

export default Index;
