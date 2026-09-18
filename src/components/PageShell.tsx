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
    <main className="pt-[124px] pb-24">
      <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
        <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to markets
        </Link>
        <header className="mb-10 border-b border-border pb-8">
          <div className="section-eyebrow mb-3">{eyebrow}</div>
          <h1 className="font-display max-w-3xl text-4xl font-bold tracking-[-0.02em] text-foreground md:text-5xl">{title}</h1>
          {sub && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{sub}</p>}
        </header>
        {children}
      </div>
    </main>
  </div>
);

export default PageShell;
