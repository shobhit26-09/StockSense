import { Link } from 'react-router-dom';
import StockSenseMark from '@/components/StockSenseMark';

const SiteFooter = () => (
  <footer className="border-t border-border bg-background">
    <div className="mx-auto max-w-[1200px] px-5 pb-8 pt-12 lg:px-8">
      <div className="mb-10 grid grid-cols-1 gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <StockSenseMark className="h-7 w-7" />
            <span className="font-display text-sm font-bold tracking-tight">StockSense</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            A free dashboard for Indian markets: indices, movers, sectors, FII/DII flows and news, with the source of every figure shown.
          </p>
        </div>
        <nav aria-label="Explore">
          <h2 className="section-eyebrow mb-3">Explore</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-foreground" to="/sectors">Sectors</Link></li>
            <li><Link className="hover:text-foreground" to="/fii-dii">FII / DII</Link></li>
            <li><Link className="hover:text-foreground" to="/heatmap">Heatmap</Link></li>
            <li><Link className="hover:text-foreground" to="/news">News</Link></li>
          </ul>
        </nav>
        <nav aria-label="About StockSense">
          <h2 className="section-eyebrow mb-3">StockSense</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-foreground" to="/about">About</Link></li>
            <li><Link className="hover:text-foreground" to="/privacy">Privacy policy</Link></li>
            <li><Link className="hover:text-foreground" to="/terms">Terms of use</Link></li>
            <li><Link className="hover:text-foreground" to="/contact">Contact</Link></li>
          </ul>
        </nav>
      </div>
      <div className="space-y-2 border-t border-border pt-6 text-[11px] leading-relaxed text-muted-foreground">
        <p>
          Quotes come from Yahoo Finance and other free public feeds and can be delayed by 15 minutes or more. Closing and flow data (NSE, BSE, StockEdge public feed) updates after market hours.
        </p>
        <p>&copy; {new Date().getFullYear()} StockSense</p>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
