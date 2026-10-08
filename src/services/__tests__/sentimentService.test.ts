import { describe, expect, it } from 'vitest';
import { breadthSignal, combineSignals, flowsSignal, globalSignal, labelFor, isMarketWideHeadline, newsSignal, scoreHeadline, trendSignal, volatilitySignal } from '../sentimentService';
import type { StockQuote } from '../multiSourceDataService';

const now = Date.parse('2026-10-08T06:00:00Z');
const q = (changePercent: number, source = 'yahoo', timestamp = now): StockQuote => ({ symbol: 'X', name: 'X', price: 100, change: changePercent, changePercent, previousClose: 99, source, timestamp });
const members = Array.from({ length: 20 }, (_, i) => ({ symbol: `S${i}`, w: 5 }));
const rising = (n: number, step = 0.4) => Array.from({ length: n }, (_, i) => 100 + i * step);

describe('breadth', () => {
  it('scores weighted advance/decline and ignores backup or stale quotes', () => {
    const up = new Map(members.map(m => [m.symbol, q(1)]));
    expect(breadthSignal({ quotes: up, members, now })!.score).toBeGreaterThan(75);
    const down = new Map(members.map(m => [m.symbol, q(-1)]));
    expect(breadthSignal({ quotes: down, members, now })!.score).toBeLessThan(25);
    const bad = new Map(members.map(m => [m.symbol, q(1, 'backup')]));
    expect(breadthSignal({ quotes: bad, members, now })).toBeNull();
    const stale = new Map(members.map(m => [m.symbol, q(1, 'yahoo', now - 16 * 60_000)]));
    expect(breadthSignal({ quotes: stale, members, now })).toBeNull();
  });
});
describe('trend and volatility', () => {
  it('rewards an uptrend, punishes a downtrend, needs history', () => {
    expect(trendSignal(rising(120))!.score).toBeGreaterThan(60);
    expect(trendSignal(rising(120, -0.4))!.score).toBeLessThan(40);
    expect(trendSignal(rising(30))).toBeNull();
  });
  it('scores a calm VIX high and a spiking VIX low', () => {
    const base = Array.from({ length: 120 }, (_, i) => 14 + (i % 7));
    expect(volatilitySignal([...base, 12])!.score).toBeGreaterThan(70);
    expect(volatilitySignal([...base, 30])!.score).toBeLessThan(25);
  });
});
describe('flows', () => {
  const rows = (v: number) => Array.from({ length: 20 }, (_, i) => ({ l: `2026-10-${String(7 - (i % 7)).padStart(2, '0')}`, v })).map((r, i) => ({ ...r, l: new Date(Date.parse('2026-10-07') - i * 86_400_000).toISOString().slice(0, 10) }));
  it('FII selling with weak DII is negative; stale data is dropped', () => {
    expect(flowsSignal({ fii: rows(-6000), dii: rows(1000) }, now)!.score).toBeLessThan(35);
    expect(flowsSignal({ fii: rows(5000), dii: rows(2000) }, now)!.score).toBeGreaterThan(65);
    expect(flowsSignal({ fii: rows(-6000), dii: rows(1000) }, now + 30 * 86_400_000)).toBeNull();
  });
});
describe('global cues', () => {
  it('treats weaker rupee and dearer crude as negative', () => {
    const m = (spx: number, brent: number, inr: number) => [{ key: 'spx' as const, name: 'S&P', changePct: spx }, { key: 'nikkei' as const, name: 'N', changePct: spx }, { key: 'brent' as const, name: 'B', changePct: brent }, { key: 'inr' as const, name: 'I', changePct: inr }];
    expect(globalSignal(m(1, -2, -0.3))!.score).toBeGreaterThan(70);
    expect(globalSignal(m(-1, 3, 0.4))!.score).toBeLessThan(30);
    expect(globalSignal([{ key: 'nikkei', name: 'N', changePct: 1 }, { key: 'hsi', name: 'H', changePct: 1 }, { key: 'brent', name: 'B', changePct: 1 }])).toBeNull();
  });
});
describe('headline lexicon', () => {
  it('reads direction, magnitude and negation', () => {
    expect(scoreHeadline('Sensex crashes 900 points as FIIs dump shares').score).toBeLessThan(-0.5);
    expect(scoreHeadline('Nifty hits record high on strong earnings').score).toBeGreaterThan(0.5);
    expect(scoreHeadline('RBI rate hike worries markets').score).toBeLessThan(-0.3);
    expect(scoreHeadline('Market does not fall despite weak cues').score).toBeGreaterThan(-0.2);
    expect(scoreHeadline('Company announces board meeting').matched).toHaveLength(0);
  });
  it.each([
    'ITC dips 4% as markets fall', 'Paytm crashes after RBI action',
    'Senco Gold surges 10%', 'New IPO listing jumps 30%',
    'ABC stock price rises after RBI rate cut', 'XYZ shares fall amid global selloff',
    'Reliance quarterly results beat estimates', 'Broker upgrades Infosys as Nifty rallies',
    'Company announces a dividend', 'ABC shares soar after crude prices fall',
  ])('excludes company story: %s', title => expect(isMarketWideHeadline(title)).toBe(false));
  it.each([
    'Global selloff sparks fears', 'RBI rate hike worries markets',
    'Nifty falls 200 points', 'Sensex rallies at open', 'FII outflows rise',
    'DII buying cushions markets', 'Asian stocks plunge', 'Wall Street rebounds',
    'Brent crude surges amid war', 'Rupee falls against dollar',
    'Inflation jumps above target', 'Federal Reserve cuts interest rates',
    'Bond yields surge', 'Tariffs spark global trade war', 'Ceasefire brings relief',
  ])('includes market-wide story: %s', title => expect(isMarketWideHeadline(title)).toBe(true));
  it('company headlines cannot change the news signal, even with macro descriptions', () => {
    const h = (title: string) => ({ title, description: 'RBI rate hike and global markets', source: 'P', url: 'https://e.com/' + encodeURIComponent(title), publishedAt: new Date(now).toISOString(), dataMode: 'live' });
    const macro = ['Global markets fall', 'RBI rate hike worries markets', 'FII outflows rise'].map(h);
    const companies = ['ITC dips 4%', 'Paytm crash', 'Senco Gold surges', 'IPO listing jumps'].map(h);
    const baseline = newsSignal({ articles: macro, now });
    const mixed = newsSignal({ articles: [...companies, ...macro], now });
    expect(mixed.signal).toEqual(baseline.signal);
    expect(mixed.headlines.map(h => h.title)).toEqual(macro.map(h => h.title));
    expect(newsSignal({ articles: companies, now }).signal).toBeNull();
  });
  it('uses only sourced recent headlines and needs three scored ones', () => {
    const h = (title: string, hoursAgo = 1) => ({ title, source: 'P', url: `https://e.com/${title.length}${hoursAgo}`, publishedAt: new Date(now - hoursAgo * 3_600_000).toISOString(), dataMode: 'live' });
    const few = newsSignal({ articles: [h('Global stocks rally'), h('Indian stocks fall on losses')], now });
    expect(few.signal).toBeNull();
    const many = newsSignal({ articles: [h('Global stocks rally on relief'), h('RBI rate cut lifts markets'), h('Nifty jumps at open'), h('Old crash', 70)], now });
    expect(many.signal!.score).toBeGreaterThan(60);
    expect(many.headlines).toHaveLength(3);
  });
});
describe('composite', () => {
  it('rebalances missing signals, refuses to score on thin data, labels bands', () => {
    const mk = (key: any, score: number, weight: number) => ({ key, label: key, score, weight, reading: '', source: '' });
    const r = combineSignals([mk('breadth', 80, 0.22), mk('trend', 60, 0.2), mk('flows', 40, 0.16), null, null, null], [], now);
    expect(r.score).toBe(Math.round((80 * 0.22 + 60 * 0.2 + 40 * 0.16) / 0.58));
    expect(r.missing).toHaveLength(3);
    expect(combineSignals([mk('breadth', 80, 0.22), mk('trend', 60, 0.2), null, null, null, null], [], now).score).toBeNull();
    expect([labelFor(75), labelFor(60), labelFor(50), labelFor(40), labelFor(20), labelFor(null)]).toEqual(['Bullish', 'Constructive', 'Neutral', 'Cautious', 'Bearish', 'Unavailable']);
  });
});
