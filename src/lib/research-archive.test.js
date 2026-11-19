import { describe, expect, it } from 'vitest';
import { archivedResearch, emptyResearch } from './research.js';
describe('saved notes outside watchlist', () => {
  it('does not confuse watched stocks with saved notebooks', () => { expect(archivedResearch(['TCS.NS'], { 'TCS.NS': emptyResearch(), 'INFY.NS': emptyResearch() })).toEqual(['INFY.NS']); });
  it('includes notebooks when no stocks remain watched', () => { expect(archivedResearch([], { 'TCS.NS': emptyResearch() })).toEqual(['TCS.NS']); });
  it('searches tickers case-insensitively and trims input', () => { expect(archivedResearch([], { 'TCS.NS': emptyResearch(), 'INFY.NS': emptyResearch() }, ' tCs ')).toEqual(['TCS.NS']); });
  it('does not search private note bodies or fabricate results', () => { expect(archivedResearch([], { 'TCS.NS': { ...emptyResearch(), thesis: 'INFY' } }, 'INFY')).toEqual([]); });
  it('sorts tickers without changing the notebook or watchlist', () => { const symbols = ['INFY.NS'], notes = { 'TCS.NS': emptyResearch(), 'HDFCBANK.NS': emptyResearch() }; const before = JSON.stringify({symbols, notes}); expect(archivedResearch(symbols, notes)).toEqual(['HDFCBANK.NS', 'TCS.NS']); expect(JSON.stringify({symbols, notes})).toBe(before); });
  it('handles an empty notebook', () => { expect(archivedResearch([], {})).toEqual([]); });
});
