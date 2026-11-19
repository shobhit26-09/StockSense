// Keep existing imports stable; device-local persistence is implemented in plain JS.
export {
  WATCHLIST_KEY, WATCHLIST_EVENT, DEFAULT_WATCHLIST,
  normalizeSymbol, loadWatchlistState, loadWatchlist, saveWatchlist, subscribeWatchlist,
} from './watchlist-storage.js';
