import { describe, it, expect, vi } from 'vitest';
import { WATCHLIST_KEY, WATCHLIST_EVENT, loadWatchlistState, saveWatchlist, subscribeWatchlist } from '../watchlist-storage.js';
const storage = initial => {
  const map = new Map(Object.entries(initial));
  return { getItem: key => map.has(key) ? map.get(key) : null, setItem: (key, value) => map.set(key, value) };
};
describe('durable watchlist choices', () => {
  it('keeps a deliberately empty current list, even with a legacy list', () => {
    const store = storage({ [WATCHLIST_KEY]: '[]', sf_watchlist_v1: '["TCS"]' });
    expect(loadWatchlistState(['DEFAULT'], store).symbols).toEqual([]);
  });
  it('round-trips removing the last stock', () => {
    const store = storage({}); saveWatchlist([], store, () => {});
    expect(loadWatchlistState(['DEFAULT'], store).symbols).toEqual([]);
  });
  it('migrates empty legacy lists instead of resurrecting defaults', () => {
    const store = storage({ sf_watchlist_v1: '[]' });
    expect(loadWatchlistState(['DEFAULT'], store).symbols).toEqual([]);
    expect(store.getItem(WATCHLIST_KEY)).toBe('[]');
  });
  it('normalizes, deduplicates and bounds stored data', () => {
    const store = storage({ [WATCHLIST_KEY]: JSON.stringify([' tcs ', 'TCS.NS', { symbol: 'sbin' }, null, { symbol: 4 }]) });
    expect(loadWatchlistState([], store).symbols).toEqual(['TCS.NS', 'SBIN.NS']);
    saveWatchlist(Array.from({ length: 40 }, (_, i) => `STOCK${i}`), store, () => {});
    expect(loadWatchlistState([], store).symbols).toHaveLength(30);
  });
  it('falls back through corrupt keys to a usable legacy list', () => {
    const store = storage({ [WATCHLIST_KEY]: '{', sf_watchlist_v1: '["SBIN"]' });
    expect(loadWatchlistState([], store).symbols).toEqual(['SBIN.NS']);
  });
  it('does not mistake a corrupt nonempty list for an intentional empty one', () => {
    expect(loadWatchlistState(['DEFAULT'], storage({ [WATCHLIST_KEY]: '[null,42]' })).symbols).toEqual(['DEFAULT']);
  });
  it('keeps a recovered legacy list even if migration cannot write', () => {
    const store = storage({ sf_watchlist_v1: '["SBIN"]' }); store.setItem = () => { throw new Error('Quota'); };
    const state = loadWatchlistState([], store);
    expect(state.symbols).toEqual(['SBIN.NS']); expect(state.error).toMatch(/cannot be saved/);
  });
  it('reports blocked reads and returns a copy of fallback', () => {
    const fallback = ['TCS.NS'];
    const state = loadWatchlistState(fallback, { getItem: () => { throw new Error('Blocked'); } });
    expect(state.symbols).toEqual(fallback); expect(state.symbols).not.toBe(fallback); expect(state.error).toMatch(/could not be read/);
  });
  it('does not notify successful persistence when a write fails', () => {
    const notify = vi.fn();
    expect(() => saveWatchlist(['TCS'], { setItem: () => { throw new Error('Quota'); } }, notify)).toThrow('Quota');
    expect(notify).not.toHaveBeenCalled();
  });
  it('notifies with the exact normalized persisted list', () => {
    const notify = vi.fn(); const store = storage({});
    saveWatchlist(['tcs', 'TCS.NS'], store, notify);
    expect(notify).toHaveBeenCalledWith(['TCS.NS']); expect(store.getItem(WATCHLIST_KEY)).toBe('["TCS.NS"]');
  });
  it('handles current-key, storage-clear and same-tab events, not unrelated keys, and cleans up', () => {
    const target = new EventTarget(); const listener = vi.fn();
    const off = subscribeWatchlist(listener, target);
    const event = key => { const e = new Event('storage'); Object.defineProperty(e, 'key', { value: key }); return e; };
    target.dispatchEvent(event('unrelated')); target.dispatchEvent(event(WATCHLIST_KEY)); target.dispatchEvent(event(null)); target.dispatchEvent(new Event(WATCHLIST_EVENT));
    expect(listener).toHaveBeenCalledTimes(3); off(); target.dispatchEvent(event(WATCHLIST_KEY)); target.dispatchEvent(new Event(WATCHLIST_EVENT)); expect(listener).toHaveBeenCalledTimes(3);
  });
});
