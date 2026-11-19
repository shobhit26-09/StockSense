import { describe, expect, it } from 'vitest';
import { isSourcedQuote, requestTimeout } from '../quote-integrity.js';
const valid = { price: 100, previousClose: 99, change: 1, changePercent: 1.01, source: 'yahoo' };
describe('quote boundary validation', () => {
  it('accepts identified finite provider quotes', () => expect(isSourcedQuote(valid)).toBe(true));
  it.each(['backup', 'unknown', '', 'simulated', 'DEMO', 'estimated public feed'])('rejects %s prices before any widget can display them', source => expect(isSourcedQuote({ ...valid, source })).toBe(false));
  it.each([Infinity, NaN, -1, 0, '100'])('rejects invalid price %s', price => expect(isSourcedQuote({ ...valid, price })).toBe(false));
  it('requires a usable baseline and finite movement', () => { expect(isSourcedQuote({ ...valid, previousClose: 0 })).toBe(false); expect(isSourcedQuote({ ...valid, change: Infinity })).toBe(false); });
  it('bounds network timeouts and respects normal requested deadlines', () => { expect(requestTimeout(6000)).toBe(6000); expect(requestTimeout()).toBe(10000); expect(requestTimeout(Infinity)).toBe(10000); expect(requestTimeout(600000)).toBe(30000); });
});
