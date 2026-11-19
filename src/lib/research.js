export const MAX_RESEARCH_BACKUP_BYTES = 4 * 1024 * 1024;
export const RESEARCH_KEY = 'stocksense.research.v1';
const statuses = new Set(['researching', 'review', 'parked']);
export const emptyResearch = () => ({ thesis: '', risk: '', next: '', status: 'researching' });
export function quoteState(quote, now = Date.now()) {
  if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) return { kind: 'unavailable', label: 'Quote unavailable', display: false, source: 'No provider response' };
  const source = typeof quote.source === 'string' ? quote.source.trim() : '';
  if (/fallback|simulated|demo|sample|backup|estimated/i.test(source)) return { kind: 'illustrative', label: 'Illustrative fallback hidden', display: false, source: source || 'Unidentified' };
  if (!source || /^unknown$/i.test(source)) return { kind: 'unknown', label: 'Source not identified', display: false, source: 'Unidentified' };
  const timestamp = Number(quote.timestamp);
  const age = Number.isFinite(timestamp) && timestamp > 0 && timestamp <= now + 60000 ? Math.max(0, now - timestamp) : null;
  return { kind: age === null ? 'undated' : age > 15 * 60000 ? 'older' : 'provider', label: age === null ? 'Undated provider quote' : age > 15 * 60000 ? 'Older received quote' : 'Provider quote, may be delayed', display: true, source, receivedAt: age === null ? null : timestamp };
}
export function readResearch(storage) {
  try {
    const raw = storage.getItem(RESEARCH_KEY); if (raw === null) return { notes: {}, error: '' };
    const data = JSON.parse(raw);
    if (!data || data.version !== 1 || !data.notes || typeof data.notes !== 'object' || Array.isArray(data.notes) || Object.keys(data.notes).length > 200) throw new Error();
    const notes = {};
    for (const [symbol, entry] of Object.entries(data.notes)) {
      if (!/^[A-Z0-9&^._-]{1,40}$/.test(symbol) || ['__proto__', 'constructor', 'prototype'].includes(symbol) || !entry || !statuses.has(entry.status)) throw new Error();
      if (!['thesis', 'risk', 'next'].every(key => typeof entry[key] === 'string' && entry[key].length <= 1500)) throw new Error();
      notes[symbol] = { thesis: entry.thesis, risk: entry.risk, next: entry.next, status: entry.status };
    }
    return { notes, error: '' };
  } catch { return { notes: {}, error: 'Saved research could not be loaded and has not been overwritten. Editing a note starts a new saved research notebook.' }; }
}
export function writeResearch(storage, notes) {
  try { storage.setItem(RESEARCH_KEY, JSON.stringify({ version: 1, notes })); return ''; }
  catch { return 'Research is not saved on this device. Download your research before leaving this page.'; }
}
export function exportResearch(symbols, notes, quotes, now = Date.now()) {
  return JSON.stringify({ format: 'stocksense-research', version: 1, exportedAt: new Date(now).toISOString(), notebook: notes, notice: 'Personal research notes, not investment advice or a trade instruction. Quotes may be delayed. Received time is not exchange trade time. Verify with the exchange or issuer before acting.', stocks: symbols.map(symbol => { const quote = quotes.get(symbol), state = quoteState(quote, now); return { symbol, research: notes[symbol] || emptyResearch(), quote: state.display ? { price: quote.price, changePercent: Number.isFinite(quote.changePercent) ? quote.changePercent : null, source: state.source, receivedAt: state.receivedAt } : null, quoteStatus: state.label }; }) }, null, 2);
}

export async function quoteDeadline(promise, fallback, milliseconds = 10000) {
  let timer;
  try { return await Promise.race([promise, new Promise(resolve => { timer = setTimeout(() => resolve(fallback), milliseconds); })]); }
  finally { clearTimeout(timer); }
}
export function scheduledSession(date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date).map(part => [part.type, part.value]));
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  if (parts.weekday === 'Sat' || parts.weekday === 'Sun') return { label: 'Weekend · IST', tone: 'muted' };
  if (minutes >= 540 && minutes < 555) return { label: 'Scheduled pre-market · IST', tone: 'warning' };
  if (minutes >= 555 && minutes < 930) return { label: 'Scheduled session · IST', tone: 'success' };
  if (minutes >= 930 && minutes < 960) return { label: 'Scheduled post-market · IST', tone: 'warning' };
  return { label: 'Outside scheduled session · IST', tone: 'muted' };
}

export function parseResearchBackup(raw) {
  if (typeof raw !== 'string' || new TextEncoder().encode(raw).byteLength > MAX_RESEARCH_BACKUP_BYTES) throw new Error('Choose a StockSense research backup smaller than 4 MB.');
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error('This file is not readable JSON. Your current notebook has not changed.'); }
  if (!data || data.format !== 'stocksense-research' || data.version !== 1 || !Array.isArray(data.stocks) || data.stocks.length > 30) throw new Error('This is not a supported StockSense research backup. Your current notebook has not changed.');
  const symbols = [], oldNotes = {};
  for (const entry of data.stocks) {
    if (!entry || typeof entry.symbol !== 'string' || !/^[A-Z0-9&^._-]{1,40}$/.test(entry.symbol) || ['__proto__', 'constructor', 'prototype'].includes(entry.symbol) || symbols.includes(entry.symbol)) throw new Error('The backup contains an invalid or repeated stock symbol.');
    symbols.push(entry.symbol);
    Object.defineProperty(oldNotes, entry.symbol, { value: entry.research, enumerable: true });
  }
  const research = readResearch({ getItem: () => JSON.stringify({ version: 1, notes: data.notebook ?? oldNotes }) });
  if (research.error) throw new Error('The backup contains invalid or oversized notes. Your current notebook has not changed.');
  return { symbols, notes: research.notes };
}

export function restoreResearchBackup(storage, backup, watchlistKey) {
  const changes = [[RESEARCH_KEY, JSON.stringify({ version: 1, notes: backup.notes })], [watchlistKey, JSON.stringify(backup.symbols)]];
  const previous = [];
  try {
    for (const [key] of changes) previous.push([key, storage.getItem(key)]);
    for (const [key, value] of changes) storage.setItem(key, value);
    return '';
  } catch {
    let rollbackFailed = false;
    for (const [key, value] of previous) {
      try { if (value === null) storage.removeItem(key); else storage.setItem(key, value); } catch { rollbackFailed = true; }
    }
    return rollbackFailed ? 'Restore could not be saved completely. Your imported notebook is open here. Download it before leaving, and check saved data before reloading.' : 'Restore is open here but could not be saved. Previous saved data was preserved. Download this notebook before leaving.';
  }
}
