import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, Treemap } from 'recharts';
import { fetchMultipleQuotesRacing, type StockQuote } from '@/services/multiSourceDataService';
import { domainForSymbol } from '@/data/companyDomains';

/**
 * Approximate NIFTY 50 free-float weights (%), used only to size tiles.
 * Colour and figures come from live quotes.
 */
const CONSTITUENTS: { symbol: string; name: string; w: number; sector: string }[] = [
  { symbol: 'HDFCBANK', name: 'HDFC Bank', w: 13, sector: 'Banks' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', w: 9, sector: 'Banks' },
  { symbol: 'RELIANCE', name: 'Reliance', w: 8.5, sector: 'Energy' },
  { symbol: 'INFY', name: 'Infosys', w: 5, sector: 'IT' },
  { symbol: 'BHARTIARTL', name: 'Airtel', w: 4.6, sector: 'Telecom' },
  { symbol: 'LT', name: 'L&T', w: 4, sector: 'Infra' },
  { symbol: 'ITC', name: 'ITC', w: 3.5, sector: 'FMCG' },
  { symbol: 'TCS', name: 'TCS', w: 3, sector: 'IT' },
  { symbol: 'AXISBANK', name: 'Axis Bank', w: 3, sector: 'Banks' },
  { symbol: 'KOTAKBANK', name: 'Kotak Bank', w: 2.8, sector: 'Banks' },
  { symbol: 'SBIN', name: 'SBI', w: 2.8, sector: 'Banks' },
  { symbol: 'M&M', name: 'M&M', w: 2.5, sector: 'Auto' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', w: 2.2, sector: 'Finance' },
  { symbol: 'HINDUNILVR', name: 'HUL', w: 2, sector: 'FMCG' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharma', w: 1.7, sector: 'Pharma' },
  { symbol: 'HCLTECH', name: 'HCL Tech', w: 1.6, sector: 'IT' },
  { symbol: 'ETERNAL', name: 'Eternal', w: 1.6, sector: 'Consumer' },
  { symbol: 'NTPC', name: 'NTPC', w: 1.5, sector: 'Power' },
  { symbol: 'MARUTI', name: 'Maruti', w: 1.5, sector: 'Auto' },
  { symbol: 'TITAN', name: 'Titan', w: 1.3, sector: 'Consumer' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech', w: 1.2, sector: 'Cement' },
  { symbol: 'POWERGRID', name: 'Power Grid', w: 1.1, sector: 'Power' },
  { symbol: 'TATASTEEL', name: 'Tata Steel', w: 1.1, sector: 'Metals' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports', w: 1, sector: 'Infra' },
  { symbol: 'ONGC', name: 'ONGC', w: 0.9, sector: 'Energy' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints', w: 0.9, sector: 'Consumer' },
];

/** Diverging scale: red -> graphite -> green, saturating at +/-3%. */
const tileColor = (pct: number | undefined) => {
  if (pct === undefined) return 'hsl(240 4% 16%)';
  const t = Math.max(-1, Math.min(1, pct / 3));
  const a = Math.abs(t);
  if (t >= 0) return `hsl(158 ${38 + a * 34}% ${16 + a * 17}%)`;
  return `hsl(352 ${40 + a * 34}% ${17 + a * 20}%)`;
};

interface Node { name: string; symbol: string; size: number; pct?: number; price?: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Tile = (props: any) => {
  const { x, y, width, height, symbol, name, pct, onPick, depth } = props;
  if (depth !== 1 || width <= 0 || height <= 0) return null;
  const big = width > 120 && height > 90;
  const mid = width > 64 && height > 44;
  const domain = domainForSymbol(symbol);
  const logo = big ? 26 : 18;
  return (
    <g className="treemap-tile" onClick={() => onPick(symbol)} style={{ cursor: 'pointer' }}>
      <rect x={x + 1.5} y={y + 1.5} width={width - 3} height={height - 3} rx={10} fill={tileColor(pct)} />
      <rect x={x + 1.5} y={y + 1.5} width={width - 3} height={height - 3} rx={10} fill="url(#tileSheen)" />
      {big && domain && (
        <g>
          <rect x={x + 12} y={y + 12} width={logo} height={logo} rx={7} fill="#fff" />
          <image href={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} x={x + 15} y={y + 15} width={logo - 6} height={logo - 6} />
        </g>
      )}
      {mid && (
        <>
          <text x={x + width / 2} y={y + height / 2 - (big ? 2 : 4)} textAnchor="middle" fill="#fff" fontSize={big ? 16 : 11.5} fontWeight={650} style={{ fontFamily: 'Inter, sans-serif' }}>
            {big ? name : symbol.length > 9 ? name : symbol}
          </text>
          <text x={x + width / 2} y={y + height / 2 + (big ? 20 : 11)} textAnchor="middle" fill="rgba(255,255,255,0.78)" fontSize={big ? 13 : 10.5} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {pct === undefined ? '—' : `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`}
          </text>
        </>
      )}
      {!mid && width > 44 && height > 38 && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 2} textAnchor="middle" fill="#fff" fontSize={8.5} fontWeight={650} style={{ fontFamily: 'Inter, sans-serif' }}>
            {symbol.slice(0, 7)}
          </text>
          <text x={x + width / 2} y={y + height / 2 + 9} textAnchor="middle" fill="rgba(255,255,255,0.78)" fontSize={8} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {pct === undefined ? '' : `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`}
          </text>
        </>
      )}
      {!mid && !(width > 44 && height > 38) && width > 30 && height > 30 && (
        <text x={x + width / 2} y={y + height / 2 + 3} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize={8} fontWeight={600} style={{ fontFamily: 'Inter, sans-serif' }}>
          {pct === undefined ? '' : `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`}
        </text>
      )}
    </g>
  );
};

const MarketMap = () => {
  const [quotes, setQuotes] = useState<Map<string, StockQuote>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const r = await fetchMultipleQuotesRacing(CONSTITUENTS.map((c) => c.symbol), 10000);
      setQuotes(r);
      setLoaded(true);
    };
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  const data: Node[] = useMemo(
    () => CONSTITUENTS.map((c) => {
      const q = quotes.get(c.symbol);
      return { name: c.name, symbol: c.symbol, size: c.w, pct: q?.changePercent, price: q?.price };
    }),
    [quotes],
  );

  const live = data.filter((d) => d.pct !== undefined);
  const adv = live.filter((d) => (d.pct as number) > 0).length;
  const dec = live.filter((d) => (d.pct as number) < 0).length;
  const flat = live.length - adv - dec;
  const wAvg = live.length
    ? live.reduce((s, d) => s + (d.pct as number) * d.size, 0) / live.reduce((s, d) => s + d.size, 0)
    : 0;
  const best = [...live].sort((a, b) => (b.pct as number) - (a.pct as number))[0];
  const worst = [...live].sort((a, b) => (a.pct as number) - (b.pct as number))[0];

  const pick = (symbol: string) => navigate(`/stock/${encodeURIComponent(symbol)}.NS`);

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-border bg-card/70">
      <div className="flex flex-col gap-4 border-b border-border/70 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <div className="section-eyebrow">Market map</div>
          <h2 className="font-display mt-1 text-2xl font-semibold tracking-tight text-foreground">India's largest companies, today</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">NIFTY 50 heavyweights sized by approximate index weight, coloured by today's move.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center md:min-w-[330px]">
          <div className="rounded-2xl bg-muted/50 px-3 py-2.5">
            <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">Weighted</div>
            <div className={`font-mono text-sm font-semibold ${wAvg >= 0 ? 'text-success' : 'text-destructive'}`}>{loaded && live.length ? `${wAvg >= 0 ? '+' : ''}${wAvg.toFixed(2)}%` : '—'}</div>
          </div>
          <div className="rounded-2xl bg-muted/50 px-3 py-2.5">
            <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">Best</div>
            <div className="truncate font-mono text-sm font-semibold text-foreground">{best ? best.symbol : '—'}</div>
          </div>
          <div className="rounded-2xl bg-muted/50 px-3 py-2.5">
            <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">Worst</div>
            <div className="truncate font-mono text-sm font-semibold text-foreground">{worst ? worst.symbol : '—'}</div>
          </div>
        </div>
      </div>

      <div className="p-3 md:p-4">
        <div className="h-[380px] md:h-[440px]">
          <svg width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="tileSheen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.10" />
                <stop offset="45%" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          {loaded ? (
            <ResponsiveContainer width="100%" height="100%">
              <Treemap data={data} dataKey="size" aspectRatio={1.4} isAnimationActive={false} content={<Tile onPick={pick} />} />
            </ResponsiveContainer>
          ) : (
            <div className="shimmer h-full w-full rounded-2xl" />
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 px-1 pb-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="shrink-0 text-[12px] font-medium text-success">{adv} up</span>
            <div className="flex h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted sm:max-w-[320px]">
              <span className="bg-success" style={{ width: `${live.length ? (adv / live.length) * 100 : 0}%` }} />
              <span className="bg-muted-foreground/40" style={{ width: `${live.length ? (flat / live.length) * 100 : 0}%` }} />
              <span className="bg-destructive" style={{ width: `${live.length ? (dec / live.length) * 100 : 0}%` }} />
            </div>
            <span className="shrink-0 text-[12px] font-medium text-destructive">{dec} down</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>-3%</span>
            <span className="h-2 w-28 rounded-full" style={{ background: `linear-gradient(90deg, ${tileColor(-3)}, ${tileColor(0)}, ${tileColor(3)})` }} />
            <span>+3%</span>
            <span className="ml-2 hidden md:inline">
              {loaded && !live.length ? 'Quote feed unavailable right now' : 'Live · Yahoo Finance · tap a tile'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketMap;
