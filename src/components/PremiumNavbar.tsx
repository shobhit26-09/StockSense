import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import ThemeToggle from './ThemeToggle';
import { searchStocks } from '@/services/stockSearchService';

const PremiumNavbar = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => (q.trim() ? searchStocks(q, 8) : []), [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (symbol: string) => {
    navigate(`/stock/${symbol}`);
    setQ('');
    setOpen(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      go(suggestions[Math.min(active, suggestions.length - 1)].symbol);
      return;
    }
    let s = q.trim().toUpperCase();
    if (!s) return;
    if (!s.includes('.NS') && !s.includes('.BO') && !s.startsWith('^')) s = `${s}.NS`;
    go(s);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % suggestions.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + suggestions.length) % suggestions.length); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <nav className="w-full pt-3 px-3">
      <div className="glass-panel mx-auto max-w-[1200px] rounded-2xl px-4 lg:px-5">
        <div className="flex items-center justify-between h-14">
          {/* Wordmark */}
          <button
            onClick={() => navigate('/')}
            className="font-display text-lg font-bold text-foreground"
          >
            StockSense
          </button>

          {/* Right */}
          <div className="flex items-center gap-3">
            <div ref={wrapRef} className="hidden sm:block relative">
              <form onSubmit={submit} className="glass-control flex items-center gap-2 px-3 h-9 rounded-full focus-within:ring-2 focus-within:ring-primary/25 transition-shadow w-72">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
                  onFocus={() => q && setOpen(true)}
                  onKeyDown={onKey}
                  placeholder="Search symbols, sectors, news…"
                  className="bg-transparent outline-none text-[13px] flex-1 text-foreground placeholder:text-muted-foreground"
                  autoComplete="off"
                />
                <kbd className="hidden lg:inline text-[10px] font-mono text-muted-foreground border border-border rounded-md px-1.5 py-0.5">⌘K</kbd>
              </form>

              {open && suggestions.length > 0 && (
                <div className="glass-panel absolute right-0 mt-2 w-[360px] rounded-2xl overflow-hidden z-50">

                  <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                    {suggestions.length} match{suggestions.length > 1 ? 'es' : ''}
                  </div>
                  <ul className="max-h-[360px] overflow-y-auto">
                    {suggestions.map((s, i) => (
                      <li key={s.symbol}>
                        <button
                          type="button"
                          onMouseEnter={() => setActive(i)}
                          onClick={() => go(s.symbol)}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors ${
                            i === active ? 'bg-muted' : 'hover:bg-muted/60'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium text-foreground truncate">{s.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {s.sector ?? 'Equity'} · {s.exchange}
                            </div>
                          </div>
                          <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                            {s.symbol.replace('.NS', '').replace('.BO', '')}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PremiumNavbar;
