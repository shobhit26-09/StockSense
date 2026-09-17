import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Brain, RefreshCw, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TradeIdea {
  symbol: string; name: string;
  action: 'BUY' | 'SHORT';
  entry: number; stopLoss: number; target: number;
  timeframe: string; confidence: number; catalyst?: string; reasoning: string;
}
interface NewsImpact { headline: string; source: string; impact: 'bullish' | 'bearish' | 'neutral'; affects: string; rationale: string; }
interface AgentData {
  marketRegime: string;
  marketSummary: string;
  error?: string;
  fallback?: boolean;
  flowsCommentary?: string;
  keyLevels?: { niftySupport?: number; niftyResistance?: number; bankNiftySupport?: number; bankNiftyResistance?: number };
  expectedMove?: { niftyPct?: number; bankNiftyPct?: number };
  tradeIdeas: TradeIdea[];
  bullish: { symbol: string; reason: string }[];
  bearish: { symbol: string; reason: string }[];
  newsImpact: NewsImpact[];
  session?: { session: 'pre' | 'live' | 'post' | 'closed'; label: string; ist: string };
  nifty?: { price: number; changePct: number } | null;
  bankNifty?: { price: number; changePct: number } | null;
  vix?: { price: number; changePct: number } | null;
  fiiDii?: { date: string; fiiNet: number; diiNet: number; last5: { date: string; fii: number; dii: number }[] } | null;
  breadth?: { advances: number; declines: number; unchanged: number; ratio: number; universe: string } | null;
  timestamp: string;
}

const SmartTradeAgent = () => {
  const [data, setData] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);

  const run = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke('smart-trade-agent', { body: {} });
      if (error) throw error;
      setData(res);
      if (res?.error) {
        toast({ title: 'Trade agent paused', description: res.error });
      }
    } catch (e: any) {
      toast({ title: 'Agent error', description: e.message || 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh: every 5 min during live session, every 30 min otherwise
  useEffect(() => {
    run();
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    const interval = data?.session?.session === 'live' ? 5 * 60 * 1000 : 30 * 60 * 1000;
    timerRef.current = window.setInterval(run, interval);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [data?.session?.session]);

  const goToStock = (sym: string) => {
    const s = sym.includes('.NS') ? sym : `${sym}.NS`;
    navigate(`/stock/${s}`);
  };

  const regimeTone: Record<string, string> = {
    bullish: 'text-success', bearish: 'text-destructive',
    neutral: 'text-muted-foreground', volatile: 'text-warning',
  };

  const sessionTitle: Record<string, string> = {
    pre: 'Pre-Market Briefing',
    live: 'Live Market Pulse',
    post: 'Post-Market Wrap',
    closed: 'Market Recap',
  };

  const fmtCr = (v: number) => `${v >= 0 ? '+' : ''}₹${Math.abs(v).toFixed(0)} Cr`;
  const flowTone = (v: number) => (v >= 0 ? 'text-success' : 'text-destructive');

  return (
    <Card className="p-5 bg-card/50 border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Brain className="w-4 h-4 text-primary shrink-0" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground truncate">
            Smart Trade Agent
            {data?.session && (
              <span className="ml-2 text-[10px] font-normal text-muted-foreground uppercase tracking-wider">
                · {sessionTitle[data.session.session]}
              </span>
            )}
          </h3>
          {data?.timestamp && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {new Date(data.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={run} disabled={loading} className="h-7 px-2 text-xs">
          <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Scanning' : 'Refresh'}
        </Button>
      </div>

      {!data && (
        <div className="py-10 text-center text-xs text-muted-foreground">
          {loading ? 'Analyzing live market…' : 'Tap refresh to scan.'}
        </div>
      )}

      {data && (
        <>
          {data.error && (
            <div className="mb-4 p-2.5 rounded-md border border-warning/40 bg-warning/5 text-[11px] text-warning leading-relaxed">
              {data.error}
            </div>
          )}
          {/* Top stat bar — single row of indices */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-[11px] font-mono">
            {data.nifty && (
              <Stat label="NIFTY" value={data.nifty.price.toFixed(2)} pct={data.nifty.changePct} />
            )}
            {data.bankNifty && (
              <Stat label="BANK NIFTY" value={data.bankNifty.price.toFixed(2)} pct={data.bankNifty.changePct} />
            )}
            {data.vix && (
              <Stat label="VIX" value={data.vix.price.toFixed(2)} pct={data.vix.changePct} invert />
            )}
            {data.breadth && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Breadth</div>
                <div>
                  <span className="text-success">{data.breadth.advances}</span>
                  <span className="text-muted-foreground/60"> / </span>
                  <span className="text-destructive">{data.breadth.declines}</span>
                  <span className="text-muted-foreground ml-1">({data.breadth.ratio.toFixed(2)})</span>
                </div>
              </div>
            )}
          </div>

          {/* Regime + Summary */}
          <div className="mb-4 pb-4 border-b border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] uppercase font-semibold tracking-wider ${regimeTone[data.marketRegime] || ''}`}>
                {data.marketRegime}
              </span>
              {data.keyLevels?.niftySupport && data.keyLevels?.niftyResistance && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  · NIFTY {data.keyLevels.niftySupport.toFixed(0)} – {data.keyLevels.niftyResistance.toFixed(0)}
                </span>
              )}
              {data.keyLevels?.bankNiftySupport && data.keyLevels?.bankNiftyResistance && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  · BNF {data.keyLevels.bankNiftySupport.toFixed(0)} – {data.keyLevels.bankNiftyResistance.toFixed(0)}
                </span>
              )}
            </div>
            <p className="text-xs text-foreground/85 leading-relaxed">{data.marketSummary}</p>
          </div>

          {/* FII / DII strip */}
          {data.fiiDii && (
            <div className="mb-4 pb-4 border-b border-border/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Institutional Flows · {data.fiiDii.date}
                </span>
                <div className="text-[11px] font-mono flex gap-4">
                  <span>FII <span className={flowTone(data.fiiDii.fiiNet)}>{fmtCr(data.fiiDii.fiiNet)}</span></span>
                  <span>DII <span className={flowTone(data.fiiDii.diiNet)}>{fmtCr(data.fiiDii.diiNet)}</span></span>
                </div>
              </div>
              {data.flowsCommentary && (
                <p className="text-[11px] text-muted-foreground leading-relaxed">{data.flowsCommentary}</p>
              )}
              <div className="mt-2 flex gap-1.5 overflow-x-auto">
                {data.fiiDii.last5.slice().reverse().map((d, i) => (
                  <div key={i} className="flex-1 min-w-[60px] text-[10px] font-mono text-center">
                    <div className="text-muted-foreground/60">{d.date.slice(5)}</div>
                    <div className={flowTone(d.fii)}>{d.fii >= 0 ? '+' : ''}{d.fii.toFixed(0)}</div>
                    <div className={`${flowTone(d.dii)} opacity-70`}>{d.dii >= 0 ? '+' : ''}{d.dii.toFixed(0)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Tabs defaultValue="trades" className="w-full">
            <TabsList className="h-8 bg-secondary/30 mb-4 p-0.5">
              <TabsTrigger value="trades" className="text-[11px] h-7 px-3">Trades</TabsTrigger>
              <TabsTrigger value="movers" className="text-[11px] h-7 px-3">Bull / Bear</TabsTrigger>
              <TabsTrigger value="news" className="text-[11px] h-7 px-3">News</TabsTrigger>
            </TabsList>

            <TabsContent value="trades" className="space-y-2 mt-0">
              {data.tradeIdeas.map((t, i) => {
                const isLong = t.action === 'BUY';
                const rr = Math.abs((t.target - t.entry) / (t.entry - t.stopLoss));
                const slPct = ((t.stopLoss - t.entry) / t.entry) * 100;
                const tgtPct = ((t.target - t.entry) / t.entry) * 100;
                return (
                  <div
                    key={i}
                    onClick={() => goToStock(t.symbol)}
                    className="group p-3 rounded-md border border-border/40 hover:border-border cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[10px] font-bold ${isLong ? 'text-success' : 'text-destructive'}`}>
                          {isLong ? '↑ LONG' : '↓ SHORT'}
                        </span>
                        <span className="font-semibold text-sm text-foreground truncate">{t.symbol.replace('.NS','')}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">· {t.timeframe}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-muted-foreground">{t.confidence}%</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono mb-2">
                      <span className="text-muted-foreground">Entry <span className="text-foreground">₹{t.entry.toFixed(2)}</span></span>
                      <span className="text-muted-foreground">SL <span className="text-destructive">₹{t.stopLoss.toFixed(2)}</span><span className="text-muted-foreground/60 ml-0.5">({slPct.toFixed(1)}%)</span></span>
                      <span className="text-muted-foreground">Tgt <span className="text-success">₹{t.target.toFixed(2)}</span><span className="text-muted-foreground/60 ml-0.5">({tgtPct >= 0 ? '+' : ''}{tgtPct.toFixed(1)}%)</span></span>
                      <span className="text-muted-foreground ml-auto">R:R <span className="text-foreground">1:{rr.toFixed(1)}</span></span>
                    </div>

                    {t.catalyst && (
                      <p className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold mb-1">{t.catalyst}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{t.reasoning}</p>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="movers" className="mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-wider text-success font-semibold">
                    <TrendingUp className="w-3 h-3" /> Bullish
                  </div>
                  <div className="space-y-1.5">
                    {data.bullish.map((b, i) => (
                      <div key={i} onClick={() => goToStock(b.symbol)} className="cursor-pointer group">
                        <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{b.symbol.replace('.NS','')}</div>
                        <div className="text-[11px] text-muted-foreground leading-snug">{b.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-wider text-destructive font-semibold">
                    <TrendingDown className="w-3 h-3" /> Bearish
                  </div>
                  <div className="space-y-1.5">
                    {data.bearish.map((b, i) => (
                      <div key={i} onClick={() => goToStock(b.symbol)} className="cursor-pointer group">
                        <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{b.symbol.replace('.NS','')}</div>
                        <div className="text-[11px] text-muted-foreground leading-snug">{b.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="news" className="space-y-2.5 mt-0">
              {data.newsImpact.map((n, i) => {
                const dot = n.impact === 'bullish' ? 'bg-success' : n.impact === 'bearish' ? 'bg-destructive' : 'bg-muted-foreground';
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground leading-snug">{n.headline}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{n.source} · {n.affects}</p>
                      <p className="text-[11px] text-muted-foreground/80 mt-1 leading-relaxed">{n.rationale}</p>
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        </>
      )}
    </Card>
  );
};

const Stat = ({ label, value, pct, invert }: { label: string; value: string; pct: number; invert?: boolean }) => {
  const positive = pct >= 0;
  const tone = invert
    ? (positive ? 'text-destructive' : 'text-success')
    : (positive ? 'text-success' : 'text-destructive');
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div>
        <span className="text-foreground">{value}</span>
        <span className={`${tone} ml-1.5`}>{positive ? '+' : ''}{pct.toFixed(2)}%</span>
      </div>
    </div>
  );
};

export default SmartTradeAgent;
