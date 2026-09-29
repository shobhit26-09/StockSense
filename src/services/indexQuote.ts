import type { StockQuote } from '@/services/multiSourceDataService';
import type { HistorySeries } from '@/services/historyService';

/** Interim quote repair before the revised edge function is deployed.
 * Yahoo daily history has yesterday's completed close. Never use chartPreviousClose
 * from an intraday result, which can be an extra session old. */
export const correctIndexQuote = (quote: StockQuote, history: HistorySeries, now = Date.now()): StockQuote => {
  if (quote.source !== 'yahoo' || history.source !== 'yahoo' || !quote.price || !history.points.length) return quote;
  const day = (t: number) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
  const currentDay = day(now);
  const prev = [...history.points].reverse().find(p => day(p.t) < currentDay && now - p.t < 8 * 86_400_000 && Number.isFinite(p.c) && p.c > 0)?.c;
  if (!prev) return { ...quote, change: Number.NaN, changePercent: Number.NaN, previousClose: Number.NaN };
  const change = quote.price - prev;
  return { ...quote, change, changePercent: 100 * change / prev, previousClose: prev };
};
