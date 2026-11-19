export const WATCHLIST_KEY = 'stocksense_watchlist_v2';
export const WATCHLIST_EVENT = 'stocksense:watchlist-change';
// An empty first-use list is honest. Only explicit choices become saved stocks.
export const DEFAULT_WATCHLIST = [];
const LEGACY_KEYS = ['sf_watchlist_v1', 'stockWatchlist'];
export const normalizeSymbol = value => {
  if (typeof value !== 'string') return '';
  const symbol = value.trim().toUpperCase();
  if (!symbol) return '';
  if (symbol.startsWith('^') || symbol.endsWith('.NS') || symbol.endsWith('.BO')) return symbol;
  return `${symbol}.NS`;
};
const symbolsFromUnknown = value => {
  if (!Array.isArray(value)) return null;
  const symbols = [...new Set(value.map(item => typeof item === 'string' ? item : (item && typeof item === 'object' && typeof item.symbol === 'string' ? item.symbol : '')).map(normalizeSymbol).filter(Boolean))].slice(0, 30);
  // A real empty list is a choice; a nonempty list with no valid entries is corrupt.
  return value.length && !symbols.length ? null : symbols;
};
export function loadWatchlistState(fallback = DEFAULT_WATCHLIST, storage) {
  let error = '';
  for (const key of [WATCHLIST_KEY, ...LEGACY_KEYS]) {
    try {
      const store = storage || localStorage;
      const raw = store.getItem(key);
      if (raw === null) continue;
      const symbols = symbolsFromUnknown(JSON.parse(raw));
      if (symbols === null) continue;
      if (key !== WATCHLIST_KEY) {
        try { store.setItem(WATCHLIST_KEY, JSON.stringify(symbols)); }
        catch { error = 'Your watchlist is available here, but changes cannot be saved on this device.'; }
      }
      return { symbols, error };
    } catch {
      error = 'Your saved watchlist could not be read. Changes may not survive a reload.';
    }
  }
  return { symbols: [...fallback], error };
}
export const loadWatchlist = (fallback = DEFAULT_WATCHLIST) => loadWatchlistState(fallback).symbols;
export function saveWatchlist(symbols, storage, notify) {
  const next = symbolsFromUnknown(symbols) || [];
  (storage || localStorage).setItem(WATCHLIST_KEY, JSON.stringify(next));
  if (notify) notify(next);
  else if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(WATCHLIST_EVENT, { detail: next }));
  return next;
}
export function subscribeWatchlist(listener, target = window) {
  const storageChanged = event => {
    if (event.key === WATCHLIST_KEY || event.key === null) listener();
  };
  target.addEventListener('storage', storageChanged);
  target.addEventListener(WATCHLIST_EVENT, listener);
  return () => {
    target.removeEventListener('storage', storageChanged);
    target.removeEventListener(WATCHLIST_EVENT, listener);
  };
}
