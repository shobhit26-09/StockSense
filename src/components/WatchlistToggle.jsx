import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Star } from 'lucide-react';
import { loadWatchlistState, normalizeSymbol, saveWatchlist, subscribeWatchlist } from '@/lib/watchlist';
export default function WatchlistToggle({ currentStock }) {
  const [state, setState] = useState(() => loadWatchlistState());
  const symbol = normalizeSymbol(currentStock?.symbol || '');
  const included = state.symbols.includes(symbol);
  useEffect(() => subscribeWatchlist(() => setState(loadWatchlistState())), []);
  function toggle() {
    if (!symbol) return;
    if (!included && state.symbols.length >= 30) { setState({ ...state, error: 'Watchlist full. Remove a stock in your research workspace first.' }); return; }
    const next = included ? state.symbols.filter(item => item !== symbol) : [...state.symbols, symbol];
    try { saveWatchlist(next); setState({ symbols: next, error: '' }); }
    catch { setState({ symbols: next, error: 'This watchlist change could not be saved on this device.' }); }
  }
  return <div className="flex flex-col items-start gap-2"><button className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground" onClick={toggle} disabled={!symbol}>{included ? <Check size={14}/> : <Star size={14}/>}{included ? 'Saved to watchlist' : 'Save to watchlist'}</button><Link className="text-xs text-primary underline" to="/research">Open your research workspace</Link>{state.error && <p className="max-w-xs text-xs text-destructive" role="alert">{state.error}</p>}</div>;
}
