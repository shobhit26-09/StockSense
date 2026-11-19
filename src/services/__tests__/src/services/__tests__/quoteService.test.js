import { beforeEach, describe, expect, it, vi } from 'vitest';
const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke } } }));
import { clearQuoteCache, fetchQuoteRacing, fetchMultipleQuotesRacing } from '../multiSourceDataService';
const quote = { price: 100, previousClose: 99, change: 1, changePercent: 1.01, source: 'yahoo' };
beforeEach(() => { clearQuoteCache(); invoke.mockReset(); });
describe('shared quote service integrity', () => {
  it('passes its actual requested deadline to the SDK', async () => { invoke.mockResolvedValue({data:{'TCS.NS':quote}}); expect((await fetchQuoteRacing('TCS',6000)).source).toBe('yahoo'); expect(invoke.mock.calls[0][1].timeout).toBe(6000); });
  it.each(['backup','unknown',''])('rejects %s in single and batch calls',async source=>{ invoke.mockResolvedValue({data:{'TCS.NS':{...quote,source}}}); expect(await fetchQuoteRacing('TCS')).toBe(null); expect((await fetchMultipleQuotesRacing(['TCS'])).size).toBe(0); });
  it('ignores unsolicited returned symbols and applies batch deadline', async () => { invoke.mockResolvedValue({data:{'TCS.NS':quote,'UNASKED.NS':quote}}); const result=await fetchMultipleQuotesRacing(['TCS'],8000); expect([...result.keys()]).toEqual(['TCS']); expect(invoke.mock.calls[0][1].timeout).toBe(8000); });
  it('does not cache rejected data as a successful quote', async () => { invoke.mockResolvedValueOnce({data:{'TCS.NS':{...quote,source:'backup'}}}).mockResolvedValueOnce({data:{'TCS.NS':quote}}); expect(await fetchQuoteRacing('TCS')).toBe(null); expect((await fetchQuoteRacing('TCS')).price).toBe(100); expect(invoke).toHaveBeenCalledTimes(2); });
});
