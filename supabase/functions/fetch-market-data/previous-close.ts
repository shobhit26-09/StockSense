/** Yahoo's chartPreviousClose can lag one trading session for indices.
 * Prefer the last completed daily candle, only when its date precedes the
 * current India trading date. A current daily candle is never a baseline. */
export function resolvePreviousClose(
  timestamps: number[], closes: (number | null)[],
  marketTime: number, timezone: string,
): number | null {
  if (!Number.isFinite(marketTime) || !timestamps.length || timestamps.length !== closes.length) return null;
  let currentDate: string;
  try { currentDate = new Intl.DateTimeFormat('en-CA', { timeZone: timezone || 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(marketTime * 1000)); }
  catch { return null; }
  for (let i = timestamps.length - 1; i >= 0; i--) {
    const close = closes[i];
    if (!Number.isFinite(close) || !(close! > 0) || !Number.isFinite(timestamps[i])) continue;
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: timezone || 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(timestamps[i] * 1000));
    if (date < currentDate && marketTime - timestamps[i] < 8 * 86_400) return close!;
  }
  return null;
}
