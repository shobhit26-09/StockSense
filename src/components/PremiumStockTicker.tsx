import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { fetchMultipleQuotesRacing } from '@/services/multiSourceDataService';

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const indices = [
  { symbol: '^NSEI', name: 'NIFTY 50' },
  { symbol: '^BSESN', name: 'SENSEX' },
  { symbol: '^NSEBANK', name: 'BANK NIFTY' },
  { symbol: '^CNXIT', name: 'NIFTY IT' },
];

const stocks = [
  { symbol: 'RELIANCE.NS', name: 'RELIANCE' },
  { symbol: 'TCS.NS', name: 'TCS' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC BANK' },
  { symbol: 'INFY.NS', name: 'INFOSYS' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI BANK' },
  { symbol: 'SBIN.NS', name: 'SBI' },
  { symbol: 'BHARTIARTL.NS', name: 'AIRTEL' },
  { symbol: 'ITC.NS', name: 'ITC' },
  { symbol: 'LT.NS', name: 'L&T' },
  { symbol: 'AXISBANK.NS', name: 'AXIS BANK' },
];

const allSymbols = [...indices, ...stocks];

const PX_PER_SEC = 38;

/**
 * Continuous marquee. The scroll offset lives in a ref and advances on
 * requestAnimationFrame, so quote refreshes only swap numbers in place:
 * the tape never remounts, reorders or jumps back to the start.
 */
const PremiumStockTicker = () => {
  const [quotes, setQuotes] = useState<Record<string, TickerItem>>({});
  const [ready, setReady] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const firstCopyRef = useRef<HTMLDivElement>(null);
  const offset = useRef(0);
  const copyWidth = useRef(0);
  const paused = useRef(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const results = await fetchMultipleQuotesRacing(allSymbols.map((s) => s.symbol), 6000);
        if (!alive) return;
        setQuotes((prev) => {
          const next = { ...prev };
          results.forEach((q, symbol) => {
            const info = allSymbols.find((s) => s.symbol === symbol);
            if (q && q.price > 0 && info) next[symbol] = { symbol, name: info.name, price: q.price, change: q.change, changePercent: q.changePercent };
          });
          return next;
        });
      } catch (e) {
        console.error('Error fetching ticker data:', e);
      } finally {
        if (alive) setReady(true);
      }
    };
    load();
    const t = setInterval(load, 12000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  // Fixed order, keeps last known value when a refresh misses a symbol.
  const items = allSymbols.map((s) => quotes[s.symbol]).filter(Boolean) as TickerItem[];

  useLayoutEffect(() => {
    if (firstCopyRef.current) copyWidth.current = firstCopyRef.current.offsetWidth;
  });

  useEffect(() => {
    if (!items.length) return;
    let raf = 0;
    let last = performance.now();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const step = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      if (!paused.current && !reduce && copyWidth.current > 0) {
        offset.current = (offset.current + (PX_PER_SEC * dt) / 1000) % copyWidth.current;
        if (trackRef.current) trackRef.current.style.transform = `translate3d(${-offset.current}px,0,0)`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [items.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready && items.length === 0) {
    return (
      <div className="mt-2 h-8 border-y border-border/70 bg-background/80 backdrop-blur flex items-center px-4 gap-3 overflow-hidden">
        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse shrink-0" />
        <div className="ticker-mask flex flex-1 items-center gap-6 overflow-hidden">
          {[96, 128, 80, 112, 96, 136].map((w, i) => (
            <span key={i} className="shimmer h-2.5 rounded-full shrink-0" style={{ width: w }} />
          ))}
        </div>
      </div>
    );
  }

  const renderCopy = (key: string, refEl?: React.Ref<HTMLDivElement>, hidden?: boolean) => (
    <div key={key} ref={refEl} aria-hidden={hidden} className="flex h-full shrink-0 items-center">
      {items.map((item) => (
        <div key={item.symbol} className="inline-flex items-center gap-2 px-4 h-full">
          <span className="text-[11px] font-semibold tracking-tight text-foreground">{item.name}</span>
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
            {item.symbol.startsWith('^') ? '' : '₹'}{item.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
          <span className={`text-[11px] font-mono font-medium flex items-center gap-1 tabular-nums ${item.change >= 0 ? 'text-success' : 'text-destructive'}`}>
            {item.change >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
          </span>
          <div className="ml-2 w-px h-3 bg-border/80" />
        </div>
      ))}
    </div>
  );

  return (
    <div
      className="ticker-mask mt-2 h-8 border-y border-border/70 bg-background/80 backdrop-blur overflow-hidden relative"
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
    >
      <div ref={trackRef} className="flex h-full w-max items-center whitespace-nowrap will-change-transform">
        {renderCopy('a', firstCopyRef)}
        {renderCopy('b', undefined, true)}
        {renderCopy('c', undefined, true)}
      </div>
    </div>
  );
};

export default PremiumStockTicker;
