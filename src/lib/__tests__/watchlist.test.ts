import { describe, expect, it } from 'vitest';
import { normalizeSymbol } from '../watchlist';

describe('normalizeSymbol', () => {
  it.each([['sbin', 'SBIN.NS'], [' tcs.ns ', 'TCS.NS'], ['500325.bo', '500325.BO'], ['^nsei', '^NSEI']])(
    'normalises %s', (input, expected) => expect(normalizeSymbol(input)).toBe(expected),
  );
});
