import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
};

// Fetch a single Yahoo Finance quote
async function fetchYahooQuote(symbol: string): Promise<{
  symbol: string; name: string; price: number; change: number;
  changePercent: number; previousClose: number; volume: number;
  high: number; low: number; open: number; source: string;
} | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const res = await fetch(url, { headers: YAHOO_HEADERS });
    if (!res.ok) return null;
    const data = await res.json();
    const q = data?.chart?.result?.[0];
    if (!q?.meta?.regularMarketPrice) return null;
    const price = q.meta.regularMarketPrice;
    const prev = q.meta.chartPreviousClose || q.meta.previousClose || price;
    const change = price - prev;
    const opens = q?.indicators?.quote?.[0]?.open || [];
    const firstOpen = opens.find((x: any) => x != null);
    return {
      symbol,
      name: q.meta.shortName || q.meta.symbol || symbol,
      price,
      change,
      changePercent: prev > 0 ? (change / prev) * 100 : 0,
      previousClose: prev,
      volume: q.meta.regularMarketVolume || 0,
      high: q.meta.regularMarketDayHigh || price,
      low: q.meta.regularMarketDayLow || price,
      open: q.meta.regularMarketOpen || firstOpen || prev,
      source: 'yahoo',
    };
  } catch {
    return null;
  }
}

// Backup data for when Yahoo fails
const BACKUP: Record<string, { price: number; name: string }> = {
  '^NSEI': { price: 23500, name: 'NIFTY 50' },
  '^NSEBANK': { price: 49500, name: 'Bank NIFTY' },
  '^CNXIT': { price: 38000, name: 'NIFTY IT' },
  '^BSESN': { price: 77500, name: 'SENSEX' },
  '^INDIAVIX': { price: 13.5, name: 'India VIX' },
  'NIFTYMETAL.NS': { price: 9200, name: 'NIFTY Metal' },
  'NIFTYREALTY.NS': { price: 1050, name: 'NIFTY Realty' },
  'NIFTYENERGY.NS': { price: 38000, name: 'NIFTY Energy' },
  'NIFTYFMCG.NS': { price: 56000, name: 'NIFTY FMCG' },
  'NIFTYPHARMA.NS': { price: 20500, name: 'NIFTY Pharma' },
  'NIFTYAUTO.NS': { price: 22000, name: 'NIFTY Auto' },
  '^NSEMDCP50': { price: 14500, name: 'NIFTY Midcap 50' },
  'RELIANCE.NS': { price: 1395, name: 'Reliance Industries' },
  'TCS.NS': { price: 3175, name: 'TCS' },
  'HDFCBANK.NS': { price: 930, name: 'HDFC Bank' },
  'INFY.NS': { price: 1580, name: 'Infosys' },
  'ICICIBANK.NS': { price: 1280, name: 'ICICI Bank' },
  'SBIN.NS': { price: 820, name: 'SBI' },
  'BHARTIARTL.NS': { price: 1650, name: 'Bharti Airtel' },
  'ITC.NS': { price: 465, name: 'ITC' },
  'LT.NS': { price: 3650, name: 'L&T' },
  'AXISBANK.NS': { price: 1120, name: 'Axis Bank' },
  'KOTAKBANK.NS': { price: 1780, name: 'Kotak Bank' },
  'HINDUNILVR.NS': { price: 2350, name: 'HUL' },
};

function getBackup(symbol: string) {
  const b = BACKUP[symbol];
  if (!b) return null;
  const cp = (Math.random() - 0.5) * 3;
  const price = b.price * (1 + (Math.random() - 0.5) * 0.02);
  return {
    symbol, name: b.name, price,
    change: b.price * cp / 100,
    changePercent: Math.round(cp * 100) / 100,
    previousClose: b.price,
    volume: Math.floor(Math.random() * 10000000) + 1000000,
    high: price * 1.01, low: price * 0.99, open: b.price,
    source: 'backup',
  };
}


const NEWS_SOURCES = [
  { url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', name: 'Economic Times' },
  { url: 'https://www.moneycontrol.com/rss/marketreports.xml', name: 'Moneycontrol' },
  { url: 'https://www.livemint.com/rss/markets', name: 'Mint' },
];

const decodeXml = (value: string) => value
  .replace(/<!\[CDATA\[|\]\]>/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

const xmlValue = (item: string, tag: string) => {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1]) : '';
};

async function handleNews() {
  const settled = await Promise.allSettled(NEWS_SOURCES.map(async (source) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(source.url, { headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/xml, text/xml' }, signal: controller.signal });
      if (!response.ok) throw new Error(`${source.name} returned ${response.status}`);
      const xml = await response.text();
      return [...xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)].slice(0, 6).map((match, index) => {
        const title = xmlValue(match[1], 'title');
        const url = xmlValue(match[1], 'link');
        const publishedAt = xmlValue(match[1], 'pubDate');
        return { id: `${source.name}-${index}-${title.slice(0, 24)}`, title, description: xmlValue(match[1], 'description'), url, source: source.name, publishedAt: publishedAt || new Date().toISOString(), dataMode: 'live' };
      }).filter((item) => item.title && /^https:\/\//.test(item.url));
    } finally { clearTimeout(timeout); }
  }));
  const seen = new Set<string>();
  const articles = settled.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
    .filter((article) => { const key = article.title.toLowerCase().replace(/\W/g, '').slice(0, 60); if (seen.has(key)) return false; seen.add(key); return true; })
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 20);
  if (!articles.length) throw new Error('All news providers are unavailable');
  return { articles, fetchedAt: new Date().toISOString(), source: 'Publisher RSS feeds' };
}

// Batch quote handler
async function handleBatchQuotes(symbols: string[]) {
  const results: Record<string, any> = {};
  const promises = symbols.map(async (sym) => {
    const quote = await fetchYahooQuote(sym);
    results[sym] = quote || getBackup(sym) || null;
  });
  await Promise.allSettled(promises);
  return results;
}

// Top movers: fetch a broad basket of NSE stocks from Yahoo Finance and sort by change%
const TOP_MOVERS_SYMBOLS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
  { symbol: 'TCS.NS', name: 'TCS' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
  { symbol: 'INFY.NS', name: 'Infosys' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
  { symbol: 'SBIN.NS', name: 'SBI' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
  { symbol: 'ITC.NS', name: 'ITC' },
  { symbol: 'LT.NS', name: 'L&T' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Bank' },
  { symbol: 'HINDUNILVR.NS', name: 'HUL' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki' },
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharma' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors' },
  { symbol: 'WIPRO.NS', name: 'Wipro' },
  { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement' },
  { symbol: 'NESTLEIND.NS', name: 'Nestle India' },
  { symbol: 'DRREDDY.NS', name: "Dr. Reddy's Labs" },
  { symbol: 'TITAN.NS', name: 'Titan Company' },
  { symbol: 'POWERGRID.NS', name: 'Power Grid Corp' },
  { symbol: 'ADANIPORTS.NS', name: 'Adani Ports' },
  { symbol: 'COALINDIA.NS', name: 'Coal India' },
  { symbol: 'HINDZINC.NS', name: 'Hindustan Zinc' },
  { symbol: 'TATACONSUM.NS', name: 'TATA Consumer' },
];

async function handleTopMovers() {
  const quotes = await Promise.all(
    TOP_MOVERS_SYMBOLS.map(async (s) => {
      const q = await fetchYahooQuote(s.symbol);
      if (q && q.price > 0 && q.change !== 0) {
        return { symbol: s.symbol.replace('.NS', ''), name: s.name, price: q.price, change: q.change, changePercent: q.changePercent, volume: q.volume, high: q.high, low: q.low };
      }
      return null;
    })
  );

  const valid = quotes.filter(Boolean) as any[];

  if (valid.length >= 4) {
    const sorted = [...valid].sort((a, b) => b.changePercent - a.changePercent);
    return {
      gainers: sorted.filter(s => s.changePercent > 0).slice(0, 7),
      losers: sorted.filter(s => s.changePercent < 0).reverse().slice(0, 7),
      mostActive: [...valid].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 7),
      source: 'Yahoo Finance',
      timestamp: new Date().toISOString(),
    };
  }

  // Minimal fallback — only if Yahoo completely fails
  return {
    gainers: [],
    losers: [],
    mostActive: [],
    source: 'Unavailable',
    timestamp: new Date().toISOString(),
  };
}

// MMI handler — uses ^INDIAVIX (correct Yahoo Finance symbol)
async function handleMMI() {
  let mmi = 52, label = 'Neutral', zone = 'neutral', source = 'Estimated';
  try {
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EINDIAVIX?interval=1d&range=1d', { headers: YAHOO_HEADERS });
    if (res.ok) {
      const d = await res.json();
      const vix = d?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (vix) {
        mmi = Math.max(15, Math.min(85, 100 - vix * 2));
        source = 'VIX-based';
      }
    }
  } catch {}
  if (mmi < 30) { zone = 'extreme_fear'; label = 'Extreme Fear'; }
  else if (mmi < 50) { zone = 'fear'; label = 'Fear'; }
  else if (mmi < 70) { zone = 'greed'; label = 'Greed'; }
  else { zone = 'extreme_greed'; label = 'Extreme Greed'; }
  return { mmi: Math.round(mmi * 100) / 100, label, zone, source, timestamp: new Date().toISOString() };
}

// ===== NSE helpers (cookie warming) =====
const NSE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.nseindia.com/',
};

let _nseCookie = '';
let _nseCookieAt = 0;
async function nseCookie(): Promise<string> {
  if (_nseCookie && Date.now() - _nseCookieAt < 5 * 60 * 1000) return _nseCookie;
  try {
    const r = await fetch('https://www.nseindia.com/option-chain', { headers: NSE_HEADERS });
    const sc = r.headers.get('set-cookie') || '';
    _nseCookie = sc.split(',').map(c => c.split(';')[0]).join('; ');
    _nseCookieAt = Date.now();
  } catch { _nseCookie = ''; }
  return _nseCookie;
}

async function nseFetch(url: string): Promise<any | null> {
  try {
    const cookie = await nseCookie();
    const r = await fetch(url, { headers: { ...NSE_HEADERS, Cookie: cookie } });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

// ===== Options chain handler (NIFTY / BANKNIFTY / FINNIFTY) =====
async function handleOptionsChain(symbol: string = 'NIFTY') {
  const sym = (symbol || 'NIFTY').toUpperCase();
  const url = `https://www.nseindia.com/api/option-chain-indices?symbol=${encodeURIComponent(sym)}`;
  const data = await nseFetch(url);
  if (!data?.records?.data) return { error: 'unavailable', symbol: sym };

  const spot = data.records.underlyingValue || 0;
  const expiries: string[] = data.records.expiryDates || [];
  const expiry = expiries[0];

  const rows = data.records.data.filter((r: any) => r.expiryDate === expiry);
  let totalCallOI = 0, totalPutOI = 0, totalCallVol = 0, totalPutVol = 0;
  let totalCallChgOI = 0, totalPutChgOI = 0;
  const strikes: any[] = [];

  rows.forEach((r: any) => {
    const ce = r.CE, pe = r.PE;
    totalCallOI += ce?.openInterest || 0;
    totalPutOI += pe?.openInterest || 0;
    totalCallVol += ce?.totalTradedVolume || 0;
    totalPutVol += pe?.totalTradedVolume || 0;
    totalCallChgOI += ce?.changeinOpenInterest || 0;
    totalPutChgOI += pe?.changeinOpenInterest || 0;
    strikes.push({
      strike: r.strikePrice,
      callOI: ce?.openInterest || 0,
      callChgOI: ce?.changeinOpenInterest || 0,
      putOI: pe?.openInterest || 0,
      putChgOI: pe?.changeinOpenInterest || 0,
    });
  });

  // Max pain — strike that minimizes total payout to option holders
  const strikePrices = strikes.map(s => s.strike).sort((a, b) => a - b);
  let maxPain = strikePrices[0], minPayout = Infinity;
  for (const k of strikePrices) {
    let pay = 0;
    for (const s of strikes) {
      if (k > s.strike) pay += (k - s.strike) * s.callOI;
      else pay += (s.strike - k) * s.putOI;
    }
    if (pay < minPayout) { minPayout = pay; maxPain = k; }
  }

  // Top OI walls — strongest support (Put OI) / resistance (Call OI) near spot
  const near = strikes.filter(s => Math.abs(s.strike - spot) < spot * 0.05);
  const topCallOI = [...near].sort((a, b) => b.callOI - a.callOI).slice(0, 3);
  const topPutOI = [...near].sort((a, b) => b.putOI - a.putOI).slice(0, 3);

  const pcr = totalCallOI > 0 ? totalPutOI / totalCallOI : 0;

  return {
    symbol: sym,
    spot,
    expiry,
    pcr: Math.round(pcr * 1000) / 1000,
    maxPain,
    totalCallOI,
    totalPutOI,
    totalCallVol,
    totalPutVol,
    totalCallChgOI,
    totalPutChgOI,
    resistance: topCallOI.map(s => ({ strike: s.strike, oi: s.callOI, chg: s.callChgOI })),
    support: topPutOI.map(s => ({ strike: s.strike, oi: s.putOI, chg: s.putChgOI })),
    timestamp: new Date().toISOString(),
  };
}

// ===== Bulk / Block deals =====
async function handleBulkDeals() {
  const url = 'https://www.nseindia.com/api/snapshot-capital-market-largedeal';
  const data = await nseFetch(url);
  if (!data) return { bulk: [], block: [], short: [], source: 'unavailable' };
  const map = (arr: any[] = []) => arr.slice(0, 20).map(d => ({
    symbol: d.symbol,
    name: d.name || d.symbol,
    clientName: d.clientName,
    type: d.buySell || d.txnType,
    qty: Number(d.qty) || 0,
    price: Number(d.watp || d.price) || 0,
    date: d.date,
  }));
  return {
    bulk: map(data.BULK_DEALS_DATA || data.bulkDeals || []),
    block: map(data.BLOCK_DEALS_DATA || data.blockDeals || []),
    short: map(data.SHORT_DEALS_DATA || data.shortDeals || []),
    source: 'NSE',
    timestamp: new Date().toISOString(),
  };
}

// ===== Sector rotation: compute 1D / 1W / 1M perf =====
const SECTOR_INDICES = [
  { symbol: '^NSEBANK',         name: 'Bank Nifty' },
  { symbol: '^CNXIT',           name: 'IT' },
  { symbol: 'NIFTYAUTO.NS',     name: 'Auto' },
  { symbol: 'NIFTYPHARMA.NS',   name: 'Pharma' },
  { symbol: 'NIFTYFMCG.NS',     name: 'FMCG' },
  { symbol: 'NIFTYMETAL.NS',    name: 'Metal' },
  { symbol: 'NIFTYENERGY.NS',   name: 'Energy' },
  { symbol: 'NIFTYREALTY.NS',   name: 'Realty' },
  { symbol: '^NSEMDCP50',       name: 'Midcap 50' },
];

async function fetchYahooHistory(symbol: string, range: string): Promise<number[]> {
  try {
    const u = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`;
    const r = await fetch(u, { headers: YAHOO_HEADERS });
    if (!r.ok) return [];
    const j = await r.json();
    return j?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter((x: any) => x != null) || [];
  } catch { return []; }
}

async function handleStockHistory(symbol: string, range = '1y', interval = '1d') {
  const safeSymbol = String(symbol || '').trim().toUpperCase();
  const allowedRanges = new Set(['1mo', '3mo', '6mo', '1y', '2y', '5y']);
  const allowedIntervals = new Set(['1d', '1wk', '1mo']);
  if (!safeSymbol || safeSymbol.length > 30) throw new Error('Invalid symbol');
  const safeRange = allowedRanges.has(range) ? range : '1y';
  const safeInterval = allowedIntervals.has(interval) ? interval : '1d';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(safeSymbol)}?interval=${safeInterval}&range=${safeRange}&includePrePost=false`;
  const response = await fetch(url, { headers: YAHOO_HEADERS });
  if (!response.ok) throw new Error(`History provider returned ${response.status}`);
  return await response.json();
}

// Yahoo now requires a cookie + crumb pair for quoteSummary
let cachedCrumb: { crumb: string; cookie: string; ts: number } | null = null;
async function getYahooCrumb(): Promise<{ crumb: string; cookie: string } | null> {
  if (cachedCrumb && Date.now() - cachedCrumb.ts < 30 * 60 * 1000) return cachedCrumb;
  try {
    const seed = await fetch('https://fc.yahoo.com', { headers: YAHOO_HEADERS, redirect: 'follow' });
    const setCookie = seed.headers.get('set-cookie') || '';
    const cookie = setCookie.split(',').map(c => c.split(';')[0].trim()).filter(Boolean).join('; ');
    if (!cookie) return null;
    const res = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: { ...YAHOO_HEADERS, Accept: 'text/plain', Cookie: cookie },
    });
    if (!res.ok) return null;
    const crumb = (await res.text()).trim();
    if (!crumb || crumb.includes('<')) return null;
    cachedCrumb = { crumb, cookie, ts: Date.now() };
    return cachedCrumb;
  } catch (_e) {
    return null;
  }
}

async function handleQuoteSummary(symbol: string) {
  const safeSymbol = String(symbol || '').trim().toUpperCase();
  if (!safeSymbol || safeSymbol.length > 30) throw new Error('Invalid symbol');
  const modules = 'summaryDetail,defaultKeyStatistics,financialData,assetProfile,summaryProfile,price';
  const base = `/v10/finance/quoteSummary/${encodeURIComponent(safeSymbol)}?modules=${modules}`;

  const auth = await getYahooCrumb();
  const attempts: Array<{ url: string; headers: Record<string, string> }> = [];
  if (auth) {
    attempts.push({
      url: `https://query2.finance.yahoo.com${base}&crumb=${encodeURIComponent(auth.crumb)}`,
      headers: { ...YAHOO_HEADERS, Cookie: auth.cookie },
    });
    attempts.push({
      url: `https://query1.finance.yahoo.com${base}&crumb=${encodeURIComponent(auth.crumb)}`,
      headers: { ...YAHOO_HEADERS, Cookie: auth.cookie },
    });
  }
  attempts.push({ url: `https://query1.finance.yahoo.com${base}`, headers: YAHOO_HEADERS });

  for (const a of attempts) {
    try {
      const res = await fetch(a.url, { headers: a.headers });
      if (!res.ok) continue;
      const json = await res.json();
      if (json?.quoteSummary?.result?.length) return json;
    } catch (_e) { /* try next */ }
  }

  // Graceful degradation: never blank the stock page
  cachedCrumb = null;
  return { quoteSummary: { result: [], error: null }, warning: 'Fundamentals temporarily unavailable' };
}

async function handleSectorRotation() {
  const out = await Promise.all(SECTOR_INDICES.map(async (s) => {
    const closes = await fetchYahooHistory(s.symbol, '3mo');
    if (closes.length < 5) return null;
    const last = closes[closes.length - 1];
    const d1 = closes[closes.length - 2] ?? last;
    const d5 = closes[closes.length - 6] ?? closes[0];
    const d20 = closes[closes.length - 21] ?? closes[0];
    return {
      symbol: s.symbol,
      name: s.name,
      price: last,
      change1d: ((last - d1) / d1) * 100,
      change1w: ((last - d5) / d5) * 100,
      change1m: ((last - d20) / d20) * 100,
    };
  }));
  const sectors = out.filter(Boolean) as any[];
  // Relative strength vs NIFTY 50
  const niftyCloses = await fetchYahooHistory('^NSEI', '3mo');
  const nLast = niftyCloses[niftyCloses.length - 1];
  const nD20 = niftyCloses[niftyCloses.length - 21] ?? niftyCloses[0];
  const niftyMonth = nLast && nD20 ? ((nLast - nD20) / nD20) * 100 : 0;
  sectors.forEach(s => { s.rs1m = s.change1m - niftyMonth; });
  sectors.sort((a, b) => b.rs1m - a.rs1m);
  return { sectors, niftyMonth, timestamp: new Date().toISOString() };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { type, symbols, symbol, range, interval } = await req.json();
    console.log('[MarketData] Request type:', type);

    let result: any;
    if (type === 'batch-quotes' && Array.isArray(symbols)) {
      result = await handleBatchQuotes(symbols);
    } else if (type === 'news') {
      result = await handleNews();
    } else if (type === 'top-movers') {
      result = await handleTopMovers();
    } else if (type === 'mmi') {
      result = await handleMMI();
    } else if (type === 'options-chain') {
      result = await handleOptionsChain(symbol);
    } else if (type === 'bulk-deals') {
      result = await handleBulkDeals();
    } else if (type === 'sector-rotation') {
      result = await handleSectorRotation();
    } else if (type === 'stock-history') {
      result = await handleStockHistory(symbol, range, interval);
    } else if (type === 'quote-summary') {
      result = await handleQuoteSummary(symbol);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ...result, providerPolicy: 'free-public-sources', fetchedAt: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('[MarketData] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
