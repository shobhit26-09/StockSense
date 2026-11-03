import { describe, it, expect } from 'vitest';
import { PRESETS, runPreset, dataAgeDays, type ScreenRow } from '../screener';

const base: ScreenRow = { s: 'X', n: 'X Ltd', sec: 'IT', p: 100, r1: 0, r21: 0, r63: 0, hi: -20, rsi: 50, ma50: -1, vx: 1, tcr: 10 };
const mk = (o: Partial<ScreenRow>) => ({ ...base, ...o });
const P = (id: string) => PRESETS.find((p) => p.id === id)!;

describe('screener presets', () => {
  it('near-high needs all three conditions', () => {
    const t = P('near-high').test;
    expect(t(mk({ hi: -1, ma50: 2, vx: 2 }))).toBe(true);
    expect(t(mk({ hi: -5, ma50: 2, vx: 2 }))).toBe(false);
    expect(t(mk({ hi: -1, ma50: -2, vx: 2 }))).toBe(false);
    expect(t(mk({ hi: -1, ma50: 2, vx: 1.2 }))).toBe(false);
  });
  it('volume surge works for down moves too', () => {
    expect(P('volume-surge').test(mk({ vx: 3, r1: -2.5 }))).toBe(true);
    expect(P('volume-surge').test(mk({ vx: 3, r1: 0.5 }))).toBe(false);
  });
  it('oversold ignores illiquid names', () => {
    expect(P('oversold').test(mk({ rsi: 25, tcr: 10 }))).toBe(true);
    expect(P('oversold').test(mk({ rsi: 25, tcr: 1 }))).toBe(false);
  });
  it('runPreset sorts, limits and reports the total', () => {
    const rows = [mk({ s: 'A', rsi: 28 }), mk({ s: 'B', rsi: 20 }), mk({ s: 'C', rsi: 60 })];
    const r = runPreset(rows, P('oversold'), 1);
    expect(r.total).toBe(2);
    expect(r.rows.map((x) => x.s)).toEqual(['B']);
  });
  it('every preset has a rule and a caveat', () => {
    for (const p of PRESETS) { expect(p.rule.length).toBeGreaterThan(20); expect(p.caveat.length).toBeGreaterThan(10); }
  });
  it('computes data age', () => {
    expect(dataAgeDays('2026-11-02', new Date(2026, 10, 3))).toBe(1);
    expect(dataAgeDays('2026-11-02', new Date(2026, 10, 2))).toBe(0);
  });
});
