export const WATCHLIST_KEY = 'stocksense_watchlist_v2';
export const WATCHLIST_EVENT = 'stocksense:watchlist-change';
export const DEFAULT_WATCHLIST = ['RELIANCE.NS', 'HDFCBANK.NS', 'TCS.NS', 'INFY.NS', 'ICICIBANK.NS', 'TATAMOTORS.NS'];
const LEGACY_KEYS = ['sf_watchlist_v1', 'stockWatchlist'];

export const normalizeSymbol = (value: string): string => {
  const symbol = value.trim().toUpperCase();
  if (!symbol) return '';
  if (symbol.startsWith('^') || symbol.endsWith('.NS') || symbol.endsWith('.BO')) return symbol;
  return `${symbol}.NS`;
};

const symbolsFromUnknown = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => typeof item === 'string' ? item : (item && typeof item === 'object' && 'symbol' in item ? String(item.symbol) : ''))
    .map(normalizeSymbol)
    .filter(Boolean);
};

export const loadWatchlist = (fallback = DEFAULT_WATCHLIST): string[] => {
  for (const key of [WATCHLIST_KEY, ...LEGACY_KEYS]) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const symbols = [...new Set(symbolsFromUnknown(JSON.parse(raw)))];
      if (symbols.length > 0) {
        if (key !== WATCHLIST_KEY) saveWatchlist(symbols);
        return symbols;
      }
    } catch {
      // Ignore malformed legacy values and continue migration.
    }
  }
  return fallback;
};

export const saveWatchlist = (symbols: string[]): string[] => {
  const next = [...new Set(symbols.map(normalizeSymbol).filter(Boolean))].slice(0, 30);
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(WATCHLIST_EVENT, { detail: next }));
  return next;
};
