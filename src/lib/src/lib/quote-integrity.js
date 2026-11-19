export function isSourcedQuote(value) {
  if (!value || typeof value !== 'object') return false;
  const source = typeof value.source === 'string' ? value.source.trim() : '';
  return !!source && !/^(unknown|unidentified)$/i.test(source) && !/fallback|simulated|demo|sample|backup|estimated/i.test(source)
    && Number.isFinite(value.price) && value.price > 0
    && Number.isFinite(value.change) && Number.isFinite(value.changePercent)
    && Number.isFinite(value.previousClose) && value.previousClose > 0;
}
export function requestTimeout(value, fallback = 10000) {
  return Number.isFinite(value) && value > 0 ? Math.min(30000, Math.max(1000, value)) : fallback;
}
