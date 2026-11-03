import { describe, it, expect } from 'vitest';
import { cleanHeadline, mapHeadlineAffects, classifyHeadline, explainIdea, fiiDiiFromStatic, cleanSummary, dataGaps } from '../radar';

describe('radar helpers', () => {
  it('strips CDATA artefacts', () => {
    expect(cleanHeadline('Sebi levies penalty]]>')).toBe('Sebi levies penalty');
    expect(cleanHeadline('<![CDATA[Tom &amp; Jerry]]>')).toBe('Tom & Jerry');
  });
  it('does not tag SEBI/Axis MF or SBI loan news as IT', () => {
    const a = mapHeadlineAffects('Sebi levies Rs 40 lakh penalty on four entities in Axis MF front-running case]]>');
    expect(a).not.toMatch(/IT/);
    expect(a).toMatch(/Regulation/);
    expect(mapHeadlineAffects('Loan growth, fall in provisions help SBI profits in Q2')).not.toBe('IT');
    expect(mapHeadlineAffects('MCX Q2 Results: Profit rockets 130% YoY')).not.toBe('IT');
    expect(mapHeadlineAffects('Bata India Q2 Results: Profit rises 30%')).not.toBe('IT');
  });
  it('tags real IT news', () => {
    expect(mapHeadlineAffects('Infosys wins large deal')).toBe('IT');
  });
  it('classifies direction', () => {
    expect(classifyHeadline('MCX Q2 Results: Profit rockets 130% YoY')).toBe('bullish');
    expect(classifyHeadline('Loan growth, fall in provisions help SBI profits in Q2')).toBe('bullish');
    expect(classifyHeadline('Sebi levies Rs 40 lakh penalty on four entities')).toBe('bearish');
    expect(classifyHeadline('Motilal Oswal announces leadership rejig')).toBe('neutral');
  });
  it('explains an idea with trigger and invalidation', () => {
    const e = explainIdea({ symbol: 'X.NS', name: 'X', action: 'BUY', entry: 100, stopLoss: 95, target: 110, timeframe: 'swing', confidence: 80, reasoning: 'Above 20/50 SMA, RSI 60. 1m 5%, vol 1.2x avg. R:R 1:2.2 with 5% stop.' }, '2026-11-03T17:09:40Z');
    expect(e.evidence).toEqual(['Above 20/50 SMA, RSI 60', '1m 5%, vol 1.2x avg']);
    expect(e.trigger).toContain('22:39');
    expect(e.invalidation).toContain('below');
  });
  it('builds FII/DII from static table', () => {
    const r = fiiDiiFromStatic({ fii: { daily: [{ l: '2026-11-02', v: 10 }, { l: '2026-10-30', v: -5 }] }, dii: { daily: [{ l: '2026-11-02', v: 3 }, { l: '2026-10-30', v: 4 }] } });
    expect(r?.date).toBe('2026-11-02');
    expect(r?.last5).toHaveLength(2);
    expect(fiiDiiFromStatic({})).toBeNull();
  });
  it('fixes summary wording', () => {
    expect(cleanSummary('A. Breadth breadth pending. FII/DII data unavailable. B.', true)).toBe('A. Market breadth is unavailable. B.');
    expect(dataGaps({ breadth: null, fiiDii: {} })).toHaveLength(1);
  });
});
