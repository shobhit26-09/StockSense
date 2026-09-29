import { describe, expect, it } from 'vitest';
import { resolvePreviousClose } from '../../../supabase/functions/fetch-market-data/previous-close';
const sec = (d: string) => Date.parse(d) / 1000;
describe('previous close from completed daily candles', () => {
  it('chooses prior trading session, not stale Yahoo chartPreviousClose', () => {
    const times = ['2026-09-25T03:45:00Z','2026-09-28T03:45:00Z','2026-09-29T03:45:00Z'].map(sec);
    expect(resolvePreviousClose(times,[23140.5,22780.25,22656],sec('2026-09-29T07:54:00Z'),'Asia/Kolkata')).toBe(22780.25);
  });
  it('never treats current candle as previous close and handles closed weekend', () => {
    const times = ['2026-09-25T03:45:00Z','2026-09-28T03:45:00Z'].map(sec);
    expect(resolvePreviousClose(times,[23140.5,22780.25],sec('2026-09-28T09:54:00Z'),'Asia/Kolkata')).toBe(23140.5);
    expect(resolvePreviousClose(times,[23140.5,22780.25],sec('2026-09-29T07:54:00Z'),'Asia/Kolkata')).toBe(22780.25);
  });
  it('shows no change when there is no verified completed candle', () => {
    expect(resolvePreviousClose([sec('2026-09-29T03:45:00Z')],[22656],sec('2026-09-29T07:54:00Z'),'Asia/Kolkata')).toBeNull();
    expect(resolvePreviousClose([],[],sec('2026-09-29T07:54:00Z'),'Asia/Kolkata')).toBeNull();
  });
});
