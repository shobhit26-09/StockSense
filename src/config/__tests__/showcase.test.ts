import { describe, expect, it } from 'vitest';
import { isSimulatedSource, SHOWCASE_DISCLOSURE } from '../showcase';

describe('showcase disclosure', () => {
  it('keeps the portfolio-demo label explicit', () => {
    expect(SHOWCASE_DISCLOSURE.label).toBe('Portfolio showcase');
    expect(SHOWCASE_DISCLOSURE.summary).toMatch(/simulated fallbacks/i);
  });

  it.each(['Fallback (API unavailable)', 'simulated', 'Demo data', 'sample dataset'])(
    'recognises simulated sources: %s',
    (source) => expect(isSimulatedSource(source)).toBe(true),
  );

  it('does not mark live providers as simulated', () => {
    expect(isSimulatedSource('Yahoo Finance')).toBe(false);
  });
});
