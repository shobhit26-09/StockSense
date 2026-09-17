import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Plus, X } from 'lucide-react';
import { fetchMultipleQuotesRacing } from '@/services/multiSourceDataService';

const STORAGE_KEY = 'sf_watchlist_v1';
const DEFAULT = ['RELIANCE.NS', 'HDFCBANK.NS', 'TCS.NS', 'INFY.NS', 'ICICIBANK.NS', 'TATAMOTORS.NS'];

const loadList = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT;
};

const QuickWatchlist = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<string[]>(loadList());
  const [data, setData] = useState<Map<string, any>>(new Map());
  const [input, setInput] = useState('');

  const fetchAll = useCallback(async () => {
    if (list.length === 0) return;
    const r = await fetchMultipleQuotesRacing(list, 8000);
    setData(r);
  }, [list]);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 12000);
    return () => clearInterval(t);
  }, [fetchAll]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, [list]);

  const add = () => {
    let s = input.trim().toUpperCase();
    if (!s) return;
    if (!s.includes('.NS') && !s.includes('.BO') && !s.startsWith('^')) s = `${s}.NS`;
    if (!list.includes(s)) setList([...list, s]);
    setInput('');
  };

  const remove = (s: string) => setList(list.filter(x => x !== s));

  return (
    <div className="premium-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Watchlist</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">{list.length}</span>
      </div>

      <div className="flex gap-1 mb-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Add ticker (e.g. SBIN)"
          className="flex-1 bg-secondary/30 border border-border/40 rounded px-2 py-1 text-[11px] font-mono outline-none focus:border-primary/50"
        />
        <button onClick={add} className="px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors">
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 -mx-1 px-1">
        {list.map(sym => {
          const q = data.get(sym);
          const pct = q?.changePercent ?? 0;
          const pos = pct >= 0;
          const display = sym.replace('.NS', '').replace('.BO', '');
          return (
            <div
              key={sym}
              className="group flex items-center justify-between py-1.5 px-2 rounded hover:bg-secondary/30 transition-colors cursor-pointer"
              onClick={() => navigate(`/stock/${sym}`)}
            >
              <div className="text-[11px] font-semibold text-foreground truncate">{display}</div>
              <div className="flex items-center gap-2">
                <div className="text-[11px] font-mono text-foreground">
                  {q ? q.price.toFixed(2) : '—'}
                </div>
                <div className={`text-[10px] font-mono w-12 text-right ${pos ? 'text-success' : 'text-destructive'}`}>
                  {q ? `${pos ? '+' : ''}${pct.toFixed(2)}%` : ''}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); remove(sym); }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="text-center text-[11px] text-muted-foreground py-6">No stocks yet. Add one above.</div>
        )}
      </div>
    </div>
  );
};

export default QuickWatchlist;