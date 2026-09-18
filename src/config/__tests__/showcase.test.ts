import { describe, expect, it } from 'vitest';
import { isSimulatedSource, SHOWCASE_DISCLOSURE } from '../showcase';

describe('market data disclosure', () => {
  it('states the site-wide accuracy limitation', () => {
    expect(SHOWCASE_DISCLOSURE.label).toBe('Market data notice');
    expect(SHOWCASE_DISCLOSURE.summary).toMatch(/delayed or inaccurate/i);
  });
  it.each(['Fallback (API unavailable)', 'simulated', 'Demo data', 'sample dataset', 'backup', 'Estimated'])(
    'recognises non-live sources: %s', (source) => expect(isSimulatedSource(source)).toBe(true),
  );
  it('does not mark live providers as simulated', () => expect(isSimulatedSource('Yahoo Finance')).toBe(false));
});
