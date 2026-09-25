import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const features = [
  { to: '/macro',   img: '/showcase/macro.webp',   eyebrow: 'Macro',        title: 'World Pulse map',   desc: 'Global benchmarks on a live map, with the events moving them.' },
  { to: '/heatmap', img: '/showcase/heatmap.webp', eyebrow: 'Breadth',      title: 'Index heatmap',     desc: 'Sector and index breadth across NIFTY at a glance.' },
  { to: '/agent',   img: '/showcase/agent.webp',   eyebrow: 'Intelligence', title: 'Trade agent',       desc: 'A momentum scanner over live quotes, FII/DII flow and ATR risk.' },
  { to: '/sectors', img: '/showcase/sectors.webp', eyebrow: 'Allocation',   title: 'Sector ideas',      desc: 'Sector calls scored on macro drivers, policy news and flows.' },
  { to: '/movers',  img: '/showcase/movers.webp',  eyebrow: 'Momentum',     title: 'Top movers',        desc: 'Leaders and laggards across the NIFTY 500, refreshed live.' },
  { to: '/news',    img: '/showcase/news.webp',    eyebrow: 'Tape',         title: 'News & bulk deals', desc: 'Headlines and institutional block prints as they land.' },
];

const FeatureGrid = () => (
  <div>
    <div className="mb-5 flex items-end justify-between gap-4 px-1">
      <div>
        <div className="section-eyebrow">Inside StockSense</div>
        <h2 className="font-display mt-1 text-2xl font-semibold tracking-tight text-foreground">Six views, one terminal</h2>
      </div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((f) => (
        <Link
          key={f.to}
          to={f.to}
          className="group relative flex flex-col overflow-hidden rounded-[1.4rem] border border-border bg-card/70 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-lg"
        >
          <div className="relative m-2 mb-0 aspect-[16/10] overflow-hidden rounded-[1rem] border border-white/[0.06] bg-[#0b0b0d]">
            <img
              src={f.img}
              alt={`${f.title} screen in StockSense`}
              loading="lazy"
              className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
          <div className="flex flex-1 items-start justify-between gap-3 p-5 pt-4">
            <div>
              <div className="section-eyebrow">{f.eyebrow}</div>
              <h3 className="font-display mt-1 text-[17px] font-semibold tracking-tight text-foreground">{f.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
            <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 group-hover:border-foreground group-hover:bg-foreground group-hover:text-background">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export default FeatureGrid;
