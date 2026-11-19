import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { fetchQuoteRacing } from '@/services/multiSourceDataService';
import { quoteState, quoteDeadline } from '@/lib/research.js';
export default function SourcedPriceDisplay({ symbol }) {
  const [quote, setQuote] = useState(null), [loading, setLoading] = useState(false);
  const request = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++request.current; setLoading(true);
    try { const result = await quoteDeadline(fetchQuoteRacing(symbol), null); if (request.current === current) setQuote(result); }
    catch { if (request.current === current) setQuote(null); }
    finally { if (request.current === current) setLoading(false); }
  }, [symbol]);
  useEffect(() => { setQuote(null); refresh(); return () => { request.current++; }; }, [refresh]);
  const state = quoteState(quote);
  return <section className="rounded-xl border border-border bg-card p-5" aria-label="Sourced reference quote"><div className="flex items-start justify-between gap-4 flex-wrap"><div><p className="text-[10px] font-semibold tracking-widest text-muted-foreground mb-2">REFERENCE QUOTE</p><p className="text-2xl font-mono font-semibold text-foreground">{state.display ? quote.price.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : loading ? 'Loading quote…' : 'No sourced quote available'}</p><p className="mt-2 text-xs text-muted-foreground">{state.label} · Source: {state.source}</p>{state.receivedAt && <p className="mt-1 text-xs text-muted-foreground">Received {new Date(state.receivedAt).toLocaleString('en-IN')}. Exchange trade time not supplied.</p>}</div><button className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs" disabled={loading} onClick={refresh}><RefreshCw size={13}/>{loading ? 'Fetching…' : 'Refresh quote'}</button></div><p className="mt-4 text-[11px] text-muted-foreground">Free-provider quotes may be delayed. Illustrative fallback values are hidden. Verify with the exchange or issuer before acting.</p></section>;
}
