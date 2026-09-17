import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PremiumNavbar from './PremiumNavbar';
import PremiumStockTicker from './PremiumStockTicker';
import Seo from './Seo';

interface Props {
  eyebrow: string;
  title: string;
  sub?: string;
  seoTitle?: string;
  seoDescription?: string;
  children: ReactNode;
}

const PageShell = ({ eyebrow, title, sub, seoTitle, seoDescription, children }: Props) => (
  <div className="min-h-screen bg-background text-foreground">
    <Seo
      title={seoTitle ?? `${title} — Stocksense`}
      description={seoDescription ?? sub ?? `${title} for Indian markets on Stocksense.`}
    />
    <div className="fixed top-0 left-0 right-0 z-50">
      <PremiumNavbar />
      <PremiumStockTicker />
    </div>
    <main className="pt-[126px] pb-24">
      <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to markets
        </Link>
        <div className="glass-panel mb-8 flex flex-col gap-2 max-w-4xl rounded-3xl p-6 md:p-8">
          <span className="section-eyebrow">{eyebrow}</span>
          <h1 className="font-display text-3xl md:text-[42px] leading-tight font-semibold text-foreground">{title}</h1>
          {sub && <p className="text-[15px] text-muted-foreground leading-relaxed">{sub}</p>}
        </div>
        {children}
      </div>
    </main>
  </div>
);

export default PageShell;