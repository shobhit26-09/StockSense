import { describe, expect, it } from 'vitest';
import { isSupabaseConfigured, supabase } from '../client';

// Test env has no VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY, so the
// client must take the fallback path instead of crashing at import time.
describe('supabase client fallback (env missing)', () => {
  it('imports without throwing and reports unconfigured', () => {
    expect(isSupabaseConfigured).toBe(false);
    expect(supabase).toBeTruthy();
  });

  it('functions.invoke resolves a failed result instead of throwing', async () => {
    const { data, error } = await supabase.functions.invoke('fetch-market-data', {
      body: { type: 'news' },
    });
    expect(data).toBeNull();
    expect(error).toBeTruthy();
    expect(String(error)).toMatch(/not configured/i);
  });

  it('auth.getSession resolves an empty session instead of throwing', async () => {
    const { data, error } = await supabase.auth.getSession();
    expect(error).toBeNull();
    expect(data.session).toBeNull();
  });

  it('arbitrary chains (from/rpc) resolve a failed result instead of throwing', async () => {
    const chained = (supabase as unknown as { from: (t: string) => { select: (c: string) => Promise<{ data: unknown; error: unknown }> } })
      .from('anything')
      .select('*');
    const { data, error } = await chained;
    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });
});
