import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Globe2, Grid3X3, Layers, Newspaper, Zap } from 'lucide-react';

const features = [
  { to: '/agent',   icon: Bot,       eyebrow: '01 · Intelligence', title: 'Trade agent',       desc: 'Auditable momentum scanner over live quotes, FII/DII flow, breadth and ATR-based risk.' },
  { to: '/sectors', icon: Layers,    eyebrow: '02 · Allocation',   title: 'Sector ideas',      desc: 'Bullish and bearish sector calls scored on macro drivers, policy news and institutional flow.' },
  { to: '/heatmap', icon: Grid3X3,   eyebrow: '03 · Breadth',      title: 'Index heatmap',     desc: 'Constituent and sector breadth across NIFTY indices at a glance.' },
  { to: '/movers',  icon: Zap,       eyebrow: '04 · Momentum',     title: 'Top movers',        desc: 'Leaders and laggards across the NIFTY 500 basket, refreshed live.' },
  { to: '/macro',   icon: Globe2,    eyebrow: '05 · Macro',        title: 'Global & calendar', desc: 'World benchmarks on a live map plus the high-impact events moving them.' },
  { to: '/news',    icon: Newspaper, eyebrow: '06 · Tape',         title: 'News & bulk deals', desc: 'Breaking headlines and institutional block prints as they hit the wire.' },
];

const FeatureGrid = () => (
  <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
    {features.map((f) => (
      <Link
        key={f.to}
        to={f.to}
        className="group relative overflow-hidden rounded-2xl border border-border bg-card/70 p-6 backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        <div className="flex items-start justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <f.icon className="h-[18px] w-[18px]" />
          </span>
          <span className="section-eyebrow">{f.eyebrow}</span>
        </div>
        <h3 className="font-display mt-5 text-lg font-semibold tracking-tight text-foreground">{f.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
        <div className="mt-5 flex items-center gap-1.5 text-[13px] font-semibold text-primary opacity-0 transition-all duration-200 group-hover:opacity-100">
          Open
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </div>
      </Link>
    ))}
  </div>
);

export default FeatureGrid;
