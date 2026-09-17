import PremiumNavbar from '@/components/PremiumNavbar';
import PremiumStockTicker from '@/components/PremiumStockTicker';
import MarketHero from '@/components/MarketHero';
import FeatureGrid from '@/components/FeatureGrid';
import PremiumTopMovers from '@/components/PremiumTopMovers';
import PremiumNewsFeed from '@/components/PremiumNewsFeed';
import { Link } from 'react-router-dom';
import Seo from '@/components/Seo';
import ShowcaseNotice from '@/components/ShowcaseNotice';

const SectionHead = ({ title, to }: { title: string; to?: string }) => (
  <div className="flex items-center justify-between mb-4 px-1">
    <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
    {to && (
      <Link to={to} className="text-xs font-semibold text-primary hover:text-primary/75 transition-colors">
        View all
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

        <footer className="glass-panel rounded-[2rem] mt-16 p-7 md:p-9">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="font-display text-sm font-bold uppercase tracking-tight">Stocksense</div>
              <p className="mt-3 text-sm text-muted-foreground max-w-xs leading-relaxed">
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
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-6 border-t border-border text-[11px] text-muted-foreground">
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
