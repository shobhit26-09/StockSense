import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Search, UserRound } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import ThemeToggle from './ThemeToggle';
import { searchStocks } from '@/services/stockSearchService';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import StockSenseMark from './StockSenseMark';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/movers', label: 'Movers' },
  { to: '/sectors', label: 'Sectors' },
  { to: '/heatmap', label: 'Heatmap' },
  { to: '/macro', label: 'Macro' },
  { to: '/news', label: 'News' },
];

const Wordmark = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="flex items-center gap-2.5 shrink-0">
    <StockSenseMark className="h-7 w-7 text-[#151518] dark:text-[#f5f5f6]" />
    <span className="font-display text-[17px] font-bold tracking-tight text-foreground">
      StockSense
    </span>
  </button>
);

const PremiumNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
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

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate('/');
  };

  const userInitial = (user?.email ?? '').charAt(0).toUpperCase();

  return (
    <nav className="w-full pt-3 px-3">
      <div className="glass-panel mx-auto max-w-[1200px] rounded-2xl px-4 lg:px-5">
        <div className="flex items-center justify-between gap-4 h-14">
          <div className="flex items-center gap-8 min-w-0">
            <Wordmark onClick={() => navigate('/')} />

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-6">
              {NAV_LINKS.map((l) => (
                <button
                  key={l.to}
                  onClick={() => navigate(l.to)}
                  data-active={isActive(l.to)}
                  className="nav-link text-[13px] font-medium text-muted-foreground hover:text-foreground"
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2.5">
            <div ref={wrapRef} className="hidden sm:block relative">
              <form onSubmit={submit} className="glass-control flex items-center gap-2 px-3 h-9 rounded-full focus-within:ring-2 focus-within:ring-primary/30 transition-shadow w-64 xl:w-72">
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
                  <div className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border/60">
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

            <button
              onClick={() => navigate('/agent')}
              className="hidden md:inline-flex items-center h-9 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-all hover:bg-primary-light"
            >
              Trade agent
            </button>

            <ThemeToggle />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Account menu"
                    className="glass-control flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-foreground"
                  >
                    {userInitial || <UserRound className="h-4 w-4" />}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <div className="truncate px-2 py-1.5 text-xs text-muted-foreground">{user.email}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/account')}>
                    <UserRound className="mr-2 h-4 w-4" />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="hidden sm:inline-flex h-9 items-center rounded-full border border-border px-4 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Sign in
              </button>
            )}

            {/* Mobile menu */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Open menu"
                  className="lg:hidden glass-control flex h-9 w-9 items-center justify-center rounded-full text-foreground"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-background/95 backdrop-blur-xl border-l-border p-0">
                <SheetTitle className="sr-only">Site navigation</SheetTitle>
                <div className="flex items-center px-5 h-16 border-b border-border">
                  <Wordmark onClick={() => { setMenuOpen(false); navigate('/'); }} />
                </div>
                <div className="flex flex-col px-3 py-4">
                  {NAV_LINKS.map((l) => (
                    <button
                      key={l.to}
                      onClick={() => { setMenuOpen(false); navigate(l.to); }}
                      className={`flex items-center justify-between rounded-xl px-3 py-3 text-left font-display text-[15px] font-semibold transition-colors ${
                        isActive(l.to)
                          ? 'bg-accent text-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {l.label}
                      {isActive(l.to) && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </button>
                  ))}
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/agent'); }}
                    className="mt-3 inline-flex h-11 items-center justify-center rounded-xl bg-primary font-display text-[15px] font-semibold text-primary-foreground"
                   
                  >
                    Open trade agent
                  </button>
                  <div className="my-3 h-px bg-border" />
                  {user ? (
                    <>
                      <div className="truncate px-3 pb-2 text-xs text-muted-foreground">{user.email}</div>
                      <button
                        onClick={() => { setMenuOpen(false); navigate('/account'); }}
                        className="flex items-center rounded-xl px-3 py-3 text-left font-display text-[15px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        Account
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center rounded-xl px-3 py-3 text-left font-display text-[15px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        Sign out
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setMenuOpen(false); navigate('/auth'); }}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-border font-display text-[15px] font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      Sign in / Create account
                    </button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PremiumNavbar;
