import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const features = [
  { to: '/agent',   eyebrow: '01 · Intelligence', title: 'Trade agent',       desc: 'Auditable momentum scanner over live quotes, FII/DII flow, breadth and ATR-based risk.' },
  { to: '/sectors', eyebrow: '02 · Allocation',   title: 'Sector ideas',      desc: 'Bullish and bearish sector calls scored on macro drivers, policy news and institutional flow.' },
  { to: '/heatmap', eyebrow: '03 · Breadth',      title: 'Index heatmap',     desc: 'Constituent and sector breadth across NIFTY indices at a glance.' },
  { to: '/movers',  eyebrow: '04 · Momentum',     title: 'Top movers',        desc: 'Leaders and laggards across the NIFTY 500 basket, refreshed live.' },
  { to: '/macro',   eyebrow: '05 · Macro',        title: 'Global & calendar', desc: 'World benchmarks on a live map plus the high-impact events moving them.' },
  { to: '/news',    eyebrow: '06 · Tape',         title: 'News & bulk deals', desc: 'Breaking headlines and institutional block prints as they hit the wire.' },
];

const FeatureGrid = () => (
  <div className="grid md:grid-cols-3 rule-grid">
    {features.map((f) => (
      <Link key={f.to} to={f.to} className="glass-control group rounded-2xl p-6 space-y-4 hover:-translate-y-0.5 hover:shadow-md transition-[transform,box-shadow,background-color]">
        <div className="section-eyebrow">{f.eyebrow}</div>
        <h3 className="font-display text-lg text-foreground">{f.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
        <div className="pt-2">
          <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5">
            <ArrowRight className="w-3 h-3 text-foreground" />
          </div>
        </div>
      </Link>
    ))}
  </div>
);

export default FeatureGrid;
