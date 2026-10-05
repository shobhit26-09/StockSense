import { describe, expect, it } from 'vitest';
import { intradaySessionDomain } from '../MarketHero';

describe('index 1D session axis', () => {
  const open = Date.parse('2026-10-05T09:15:00+05:30');
  const close = Date.parse('2026-10-05T15:30:00+05:30');
  it.each(['09:20', '10:45', '12:00', '15:25', '16:00'])('keeps the full session at %s IST', (time) => {
    expect(intradaySessionDomain(Date.parse(`2026-10-05T${time}:00+05:30`))).toEqual([open, close]);
  });
  it('anchors a previous-session feed to its own date', () => {
    expect(intradaySessionDomain(Date.parse('2026-10-02T15:25:00+05:30'))).toEqual([
      Date.parse('2026-10-02T09:15:00+05:30'), Date.parse('2026-10-02T15:30:00+05:30'),
    ]);
  });
  it('places a 10:45 endpoint at 24% of the session, not the right edge', () => {
    const t = Date.parse('2026-10-05T10:45:00+05:30');
    const [start, end] = intradaySessionDomain(t);
    expect((t - start) / (end - start)).toBeCloseTo(0.24);
  });
});
