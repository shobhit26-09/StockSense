import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowUpRight, ArrowDownRight, Minus, ExternalLink } from 'lucide-react';

interface Driver { label: string; detail: string; impact: number }
interface Headline { title: string; link?: string; source?: string }
interface Sector {
  key: string; name: string; symbol: string; leaders: string[];
  price: number | null; change1d: number | null; change1w: number | null;
  change1m: number | null; change3m: number | null; rs1m: number | null; rsi: number | null;
  score: number; stance: string; conviction: number; horizon: string; thesis: string;
  breakdown: { momentum: number; macro: number; news: number; flows: number };
  drivers: Driver[]; headlines: Headline[];
}
interface Payload {
  generatedAt: string; regime: string; bullCount: number; bearCount: number;
  niftyMonth: number; vix: number | null;
  macro: { key: string; label: string; unit: string; price: number; change1d: number; change1m: number }[];
  flow: { fii5d: number; diiNet: number; date: string } | null;
  sectors: Sector[];
}

const num = (v: number | null | undefined, d = 2) =>
  v === null || v === undefined || Number.isNaN(v) ? '—' : v.toFixed(d);
const pct = (v: number | null | undefined) =>
  v === null || v === undefined || Number.isNaN(v) ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

const toneFor = (stance: string) =>
  stance === 'bullish' || stance === 'accumulate'
    ? 'text-success'
    : stance === 'bearish' || stance === 'avoid'
    ? 'text-destructive'
    : 'text-muted-foreground';

const Delta = ({ v }: { v: number | null }) => (
  <span className={`data-cell ${v == null ? 'text-muted-foreground' : v >= 0 ? 'text-success' : 'text-destructive'}`}>
    {pct(v)}
  </span>
);

const ScoreBar = ({ score }: { score: number }) => {
  const w = Math.min(Math.abs(score), 100) / 2; // % of half-width
  return (
    <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div className="absolute left-1/2 top-0 h-full w-px bg-border" />
      <div
        className={`absolute top-0 h-full ${score >= 0 ? 'bg-success' : 'bg-destructive'}`}
        style={score >= 0 ? { left: '50%', width: `${w}%` } : { right: '50%', width: `${w}%` }}
      />
    </div>
  );
};

const SectorIdeas = () => {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: err } = await supabase.functions.invoke('sector-outlook');
      if (err) throw err;
      if ((res as { error?: string })?.error) throw new Error((res as { error: string }).error);
      setData(res as Payload);
      setOpen((prev) => prev ?? (res as Payload)?.sectors?.[0]?.key ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sector outlook');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  if (loading && !data) {
    return (
      <div className="premium-card p-10 flex items-center justify-center gap-3 text-sm text-muted-foreground">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Scanning sectors, macro drivers and policy news…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="premium-card p-8 text-center">
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button onClick={load} className="text-xs font-medium text-foreground underline underline-offset-4">Retry</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Regime + macro strip */}
      <div className="premium-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <div className="section-eyebrow mb-1.5">Market regime</div>
            <p className="text-[15px] font-medium text-foreground leading-snug">{data.regime}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {data.bullCount} sectors constructive · {data.bearCount} under pressure · NIFTY 1M {pct(data.niftyMonth)}
              {data.vix != null && ` · India VIX ${num(data.vix)}`}
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {new Date(data.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </button>
        </div>

        {data.macro.length > 0 && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border rounded-lg overflow-hidden">
            {data.macro.map((m) => (
              <div key={m.key} className="bg-card p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{m.label}</div>
                <div className="data-cell text-foreground mt-1">{num(m.price)}{m.unit}</div>
                <Delta v={m.change1d} />
              </div>
            ))}
          </div>
        )}

        {data.flow && (
          <div className="mt-3 text-xs text-muted-foreground">
            FII 5-day net <span className="data-cell text-foreground">₹{(data.flow.fii5d / 100).toFixed(0)} cr</span>
            {' · '}DII <span className="data-cell text-foreground">₹{(data.flow.diiNet / 100).toFixed(0)} cr</span>
            {' · '}{data.flow.date}
          </div>
        )}
      </div>

      {/* Sector list */}
      <div className="premium-card divide-y divide-border overflow-hidden">
        {data.sectors.map((s) => {
          const isOpen = open === s.key;
          const Icon = s.score >= 10 ? ArrowUpRight : s.score <= -10 ? ArrowDownRight : Minus;
          return (
            <div key={s.key}>
              <button
                onClick={() => setOpen(isOpen ? null : s.key)}
                className="w-full text-left p-4 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 shrink-0 ${toneFor(s.stance)}`} />
                      <span className="font-medium text-[15px] text-foreground truncate">{s.name}</span>
                      <span className={`text-[10px] uppercase tracking-wider font-semibold ${toneFor(s.stance)}`}>
                        {s.stance}
                      </span>
                    </div>
                    <div className="mt-2 max-w-md"><ScoreBar score={s.score} /></div>
                  </div>

                  <div className="hidden sm:grid grid-cols-3 gap-6 text-right shrink-0">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">1D</div>
                      <Delta v={s.change1d} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">RS 1M</div>
                      <Delta v={s.rs1m} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Conviction</div>
                      <div className="data-cell text-foreground">{s.conviction}%</div>
                    </div>
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-5 -mt-1 space-y-4">
                  <p className="text-[13px] text-muted-foreground leading-relaxed max-w-3xl">{s.thesis}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden">
                    {(['momentum', 'macro', 'news', 'flows'] as const).map((k) => (
                      <div key={k} className="bg-card p-3">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
                        <div className={`data-cell ${s.breakdown[k] >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {s.breakdown[k] >= 0 ? '+' : ''}{s.breakdown[k]}
                        </div>
                      </div>
                    ))}
                  </div>

                  {s.drivers.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="section-eyebrow">What's driving it</div>
                      {s.drivers.slice(0, 5).map((d, i) => (
                        <div key={i} className="flex items-start gap-2 text-[13px]">
                          <span className={`data-cell w-12 shrink-0 ${d.impact >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {d.impact >= 0 ? '+' : ''}{d.impact.toFixed(1)}
                          </span>
                          <span className="text-muted-foreground">
                            <span className="text-foreground">{d.label}</span> — {d.detail}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {s.headlines.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="section-eyebrow">Policy & news feed</div>
                      {s.headlines.slice(0, 4).map((h, i) => (
                        <a
                          key={i}
                          href={h.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 mt-1 shrink-0" />
                          <span className="line-clamp-2">{h.title}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] text-muted-foreground mr-1">Leaders · {s.horizon}</span>
                    {s.leaders.map((l) => (
                      <Link
                        key={l}
                        to={`/stock/${l}`}
                        className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        {l}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Deterministic scoring engine: relative momentum, macro elasticities (crude, USD/INR, US 10Y, DXY, gold, Nasdaq),
        policy/news sentiment and institutional flows. Educational use only — not investment advice.
      </p>
    </div>
  );
};

export default SectorIdeas;
