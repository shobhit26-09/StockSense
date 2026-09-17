import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const YAHOO_HEADERS = { "User-Agent": UA, Accept: "application/json" };

const UNIVERSE = [
  "RELIANCE.NS","TCS.NS","HDFCBANK.NS","INFY.NS","ICICIBANK.NS","SBIN.NS","BHARTIARTL.NS","ITC.NS","LT.NS",
  "AXISBANK.NS","KOTAKBANK.NS","HINDUNILVR.NS","BAJFINANCE.NS","MARUTI.NS","SUNPHARMA.NS","TATAMOTORS.NS",
  "WIPRO.NS","ULTRACEMCO.NS","TITAN.NS","POWERGRID.NS","ADANIPORTS.NS","COALINDIA.NS","TATASTEEL.NS",
  "JSWSTEEL.NS","M&M.NS","NTPC.NS","ONGC.NS","ASIANPAINT.NS","HCLTECH.NS","TECHM.NS",
  // Swing-favourite mid/large caps
  "TRENT.NS","DIVISLAB.NS","CIPLA.NS","DRREDDY.NS","BAJAJFINSV.NS","HDFCLIFE.NS","SBILIFE.NS",
  "ADANIENT.NS","BEL.NS","HAL.NS","SIEMENS.NS","ABB.NS","CUMMINSIND.NS","BOSCHLTD.NS",
  "TVSMOTOR.NS","BAJAJ-AUTO.NS","EICHERMOT.NS","HEROMOTOCO.NS","ASHOKLEY.NS",
  "DMART.NS","NAUKRI.NS","ZOMATO.NS","POLYCAB.NS","HAVELLS.NS",
  "PIDILITIND.NS","BERGEPAINT.NS","GRASIM.NS","JINDALSTEL.NS","HINDALCO.NS","VEDL.NS",
  "GAIL.NS","BPCL.NS","HINDPETRO.NS","PFC.NS","RECLTD.NS","IRFC.NS",
  "INDIGO.NS","DLF.NS","GODREJPROP.NS","OBEROIRLTY.NS","LODHA.NS",
  "PERSISTENT.NS","COFORGE.NS","LTIM.NS","MPHASIS.NS","TATAELXSI.NS",
  "CHOLAFIN.NS","SHRIRAMFIN.NS","MUTHOOTFIN.NS","ICICIGI.NS","ICICIPRULI.NS",
];

function getISTNow() {
  const now = new Date();
  return new Date(now.getTime() + (5.5 * 60 - now.getTimezoneOffset()) * 60000);
}
function getMarketSession() {
  const ist = getISTNow();
  const day = ist.getUTCDay();
  const mins = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  const istStr = ist.toISOString().replace("T", " ").slice(0, 16) + " IST";
  if (day === 0 || day === 6) return { session: "closed" as const, label: "Markets closed (weekend)", ist: istStr };
  if (mins < 9 * 60 + 15) return { session: "pre" as const, label: "Pre-market", ist: istStr };
  if (mins <= 15 * 60 + 30) return { session: "live" as const, label: "Live market", ist: istStr };
  return { session: "post" as const, label: "Post-market", ist: istStr };
}

async function fetchQuoteFull(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`;
    const res = await fetch(url, { headers: YAHOO_HEADERS });
    if (!res.ok) return null;
    const data = await res.json();
    const r = data?.chart?.result?.[0];
    const meta = r?.meta;
    if (!meta?.regularMarketPrice) return null;
    const closes: number[] = (r?.indicators?.quote?.[0]?.close || []).filter((v: any) => typeof v === "number");
    const volumes: number[] = (r?.indicators?.quote?.[0]?.volume || []).filter((v: any) => typeof v === "number");
    const highs: number[] = (r?.indicators?.quote?.[0]?.high || []).filter((v: any) => typeof v === "number");
    const lows: number[] = (r?.indicators?.quote?.[0]?.low || []).filter((v: any) => typeof v === "number");
    const price = meta.regularMarketPrice;
    // IMPORTANT: with range=3mo, meta.chartPreviousClose is the close ~3 months ago.
    // Use regularMarketPreviousClose / previousClose for actual *daily* change. Fall back to
    // the second-to-last close in the series, then chartPreviousClose only as last resort.
    const prev =
      meta.regularMarketPreviousClose ??
      meta.previousClose ??
      (closes.length >= 2 ? closes[closes.length - 2] : meta.chartPreviousClose) ??
      price;
    const change = price - prev;
    const changePct = prev ? (change / prev) * 100 : 0;
    const high52 = meta.fiftyTwoWeekHigh || Math.max(...closes, price);
    const low52 = meta.fiftyTwoWeekLow || Math.min(...closes, price);
    const sma20 = closes.length >= 20 ? closes.slice(-20).reduce((a, b) => a + b, 0) / 20 : price;
    const sma50 = closes.length >= 50 ? closes.slice(-50).reduce((a, b) => a + b, 0) / 50 : price;
    const avgVol = volumes.length ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0;
    const vol = meta.regularMarketVolume || 0;
    const volRatio = avgVol ? vol / avgVol : 1;
    let rsi = 50;
    if (closes.length >= 15) {
      const slice = closes.slice(-15);
      let gains = 0, losses = 0;
      for (let i = 1; i < slice.length; i++) {
        const d = slice[i] - slice[i - 1];
        if (d >= 0) gains += d; else losses -= d;
      }
      const rs = losses === 0 ? 100 : gains / losses;
      rsi = 100 - 100 / (1 + rs);
    }
    const perf1m = closes.length >= 22 ? ((price - closes[closes.length - 22]) / closes[closes.length - 22]) * 100 : 0;
    const perf3m = closes.length >= 60 ? ((price - closes[closes.length - 60]) / closes[closes.length - 60]) * 100 : 0;
    const perf1w = closes.length >= 6 ? ((price - closes[closes.length - 6]) / closes[closes.length - 6]) * 100 : 0;
    // ATR proxy: average daily range %
    let atrPct = 2;
    if (closes.length >= 14) {
      const ranges: number[] = [];
      for (let i = closes.length - 14; i < closes.length - 1; i++) {
        ranges.push(Math.abs(closes[i + 1] - closes[i]) / closes[i] * 100);
      }
      atrPct = ranges.reduce((a, b) => a + b, 0) / ranges.length;
    }
    // Intraday position in day's range (0 = at low, 1 = at high)
    const dayHigh = meta.regularMarketDayHigh ?? (highs.length ? highs[highs.length - 1] : price);
    const dayLow = meta.regularMarketDayLow ?? (lows.length ? lows[lows.length - 1] : price);
    const dayRangePos = dayHigh > dayLow ? (price - dayLow) / (dayHigh - dayLow) : 0.5;
    return {
      symbol, price, change, changePct, high52, low52,
      pctFrom52H: ((price - high52) / high52) * 100,
      pctFrom52L: ((price - low52) / low52) * 100,
      sma20, sma50, volRatio, rsi: Math.round(rsi),
      perf1w, perf1m, perf3m, atrPct,
      dayHigh, dayLow, dayRangePos,
      distSma20Pct: ((price - sma20) / sma20) * 100,
    };
  } catch { return null; }
}

async function fetchNews() {
  const feeds = [
    { url: "https://www.moneycontrol.com/rss/marketreports.xml", source: "Moneycontrol" },
    { url: "https://www.livemint.com/rss/markets", source: "Mint" },
    { url: "https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms", source: "ET Markets" },
  ];
  const out: Array<{ title: string; source: string; published: string; link: string }> = [];
  await Promise.all(feeds.map(async (f) => {
    try {
      const r = await fetch(f.url, { headers: { "User-Agent": UA } });
      if (!r.ok) return;
      const xml = await r.text();
      const items = xml.split(/<item[\s>]/i).slice(1, 11);
      for (const item of items) {
        const title = (item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] || "").trim();
        const link = (item.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || "").trim();
        const pub = (item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || "").trim();
        if (title) out.push({ title, source: f.source, published: pub, link });
      }
    } catch {}
  }));
  return out.slice(0, 25);
}

async function fetchFiiDii() {
  try {
    const r = await fetch("https://webapi.niftytrader.in/webapi/Resource/fii-dii-activity-data", { headers: { "User-Agent": UA } });
    if (!r.ok) return null;
    const j = await r.json();
    const rows = j?.resultData?.fii_dii_data || [];
    if (!rows.length) return null;
    const latest = rows[0];
    return {
      date: latest.created_at?.slice(0, 10),
      fiiNet: Number(latest.fii_net_value),
      diiNet: Number(latest.dii_net_value),
      last5: rows.slice(0, 5).map((x: any) => ({
        date: x.created_at?.slice(0, 10),
        fii: Number(x.fii_net_value),
        dii: Number(x.dii_net_value),
      })),
    };
  } catch { return null; }
}

async function fetchAdvanceDecline() {
  try {
    const warm = await fetch("https://www.nseindia.com/", { headers: { "User-Agent": UA, Accept: "text/html" } });
    const cookies = warm.headers.get("set-cookie") || "";
    const cookieHeader = cookies.split(",").map((c) => c.split(";")[0]).join("; ");
    const r = await fetch("https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20500", {
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
        Referer: "https://www.nseindia.com/market-data/live-equity-market",
        Cookie: cookieHeader,
      },
    });
    if (!r.ok) return null;
    const j = await r.json();
    const adv = j?.advance;
    if (!adv) return null;
    return {
      advances: Number(adv.advances),
      declines: Number(adv.declines),
      unchanged: Number(adv.unchanged),
      ratio: Number(adv.advances) / Math.max(1, Number(adv.declines)),
      universe: "NIFTY 500",
      marketStatus: j?.marketStatus?.marketStatus,
    };
  } catch { return null; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const sessionInfo = getMarketSession();

    const [quotesArr, news, vixRes, niftyRes, bnkRes, fiiDii, advDec] = await Promise.all([
      Promise.all(UNIVERSE.map((s) => fetchQuoteFull(s))),
      fetchNews(),
      fetchQuoteFull("^INDIAVIX"),
      fetchQuoteFull("^NSEI"),
      fetchQuoteFull("^NSEBANK"),
      fetchFiiDii(),
      fetchAdvanceDecline(),
    ]);
    const quotes = quotesArr.filter(Boolean) as any[];
    if (quotes.length < 5) throw new Error("Could not fetch market data");

    // Pre-rank for swing momentum quality
    const scored = quotes.map((q) => {
      const above20 = q.price > q.sma20;
      const above50 = q.price > q.sma50;
      const trendUp = above20 && above50 ? 40 : above20 || above50 ? 15 : 0;
      const trendDown = !above20 && !above50 ? 25 : 0;
      const rsiSweet = q.rsi >= 52 && q.rsi <= 72 ? 25 : q.rsi <= 35 ? 15 : 0;
      const mom1m = Math.max(-15, Math.min(40, q.perf1m * 1.2));
      const volSpike = Math.max(0, Math.min(30, (q.volRatio - 1) * 35));
      const near52H = q.pctFrom52H > -8 && q.pctFrom52H <= 0 ? 18 : 0;
      const breakout = q.changePct > 1.5 && q.volRatio > 1.3 ? 20 : 0;
      const overext = q.pctFrom52H > -1 && q.rsi > 78 ? -25 : 0;
      const score = trendUp + trendDown + rsiSweet + mom1m + volSpike + near52H + breakout + overext;
      return { ...q, score };
    });
    const candidates = scored.sort((a, b) => b.score - a.score).slice(0, 22);

    // ===== Built-in deterministic analyst engine (no external AI) =====
    const analysis = buildAnalysis({
      sessionInfo, scored, niftyRes, bnkRes, vixRes, fiiDii, advDec, news,
    });

    return new Response(
      JSON.stringify({
        ...analysis,
        session: sessionInfo,
        nifty: niftyRes ? { price: niftyRes.price, changePct: niftyRes.changePct } : null,
        bankNifty: bnkRes ? { price: bnkRes.price, changePct: bnkRes.changePct } : null,
        vix: vixRes ? { price: vixRes.price, changePct: vixRes.changePct } : null,
        fiiDii,
        breadth: advDec,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("smart-trade-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ====================================================================
// BUILT-IN MARKET ANALYST ENGINE
// Generates structured trading analysis from scraped market data using
// deterministic rules — no external AI required.
// ====================================================================

const BULL_WORDS = ["surge","rally","jump","gain","beat","record","high","upgrade","buy","strong","profit","rise","rises","outperform","bullish","positive","raises","hike"];
const BEAR_WORDS = ["fall","drop","crash","plunge","decline","loss","losses","cut","downgrade","sell","weak","miss","bearish","slump","slide","negative","probe","fraud","ban","strike","tumble"];

function classifyNews(title: string): "bullish" | "bearish" | "neutral" {
  const t = title.toLowerCase();
  let b = 0, s = 0;
  for (const w of BULL_WORDS) if (t.includes(w)) b++;
  for (const w of BEAR_WORDS) if (t.includes(w)) s++;
  if (b > s) return "bullish";
  if (s > b) return "bearish";
  return "neutral";
}

function detectTickers(title: string, universe: string[]): string {
  const t = title.toUpperCase();
  const hits: string[] = [];
  for (const sym of universe) {
    const base = sym.replace(".NS", "").replace("&", "");
    if (base.length >= 4 && t.includes(base)) hits.push(base);
  }
  if (hits.length) return hits.slice(0, 3).join(", ");
  if (/NIFTY|SENSEX/.test(t)) return "Indices";
  if (/RBI|RUPEE|INFLATION|CPI|GDP|FED/.test(t)) return "Macro";
  if (/BANK/.test(t)) return "Banking";
  if (/IT|TECH/.test(t)) return "IT";
  if (/AUTO|MOTOR/.test(t)) return "Auto";
  if (/PHARMA|CIPLA|SUN/.test(t)) return "Pharma";
  if (/OIL|CRUDE|ONGC/.test(t)) return "Energy";
  return "Broad market";
}

function roundLevel(v: number, step: number) {
  return Math.round(v / step) * step;
}

function buildAnalysis(ctx: {
  sessionInfo: any; scored: any[];
  niftyRes: any; bnkRes: any; vixRes: any;
  fiiDii: any; advDec: any; news: any[];
}) {
  const { sessionInfo, scored, niftyRes, bnkRes, vixRes, fiiDii, advDec, news } = ctx;

  // ----- Regime detection -----
  const niftyChg = niftyRes?.changePct ?? 0;
  const vixVal = vixRes?.price ?? 14;
  const breadthRatio = advDec?.ratio ?? 1;
  const fiiNet = fiiDii?.fiiNet ?? 0;

  let regimeScore = 0;
  regimeScore += niftyChg * 8;
  regimeScore += (breadthRatio - 1) * 25;
  regimeScore += fiiNet > 0 ? 10 : fiiNet < -1000 ? -15 : -5;
  regimeScore += vixVal > 18 ? -10 : vixVal < 12 ? 5 : 0;

  let marketRegime: "bullish" | "bearish" | "neutral" | "volatile" =
    vixVal > 20 ? "volatile"
    : regimeScore > 12 ? "bullish"
    : regimeScore < -12 ? "bearish"
    : "neutral";

  // ----- Key levels (pivot-based, rounded) -----
  const niftyPx = niftyRes?.price ?? 0;
  const bnkPx = bnkRes?.price ?? 0;
  // Use actual ATR% when available, blended with VIX-implied 1-day move (VIX/sqrt(252)).
  const vixDaily = (vixVal / 100) / Math.sqrt(252); // implied 1σ daily move
  const niftyAtrPct = Math.max(0.4, Math.min(1.5, (niftyRes?.atrPct ?? 0.6)));
  const bnkAtrPct   = Math.max(0.5, Math.min(1.8, (bnkRes?.atrPct ?? 0.8)));
  const niftyBandPct = Math.max(niftyAtrPct, vixDaily * 100);
  const bnkBandPct   = Math.max(bnkAtrPct,   vixDaily * 100 * 1.15);
  const niftyAtr = niftyPx * (niftyBandPct / 100);
  const bnkAtr   = bnkPx   * (bnkBandPct / 100);
  const keyLevels = {
    niftySupport: roundLevel(niftyPx - niftyAtr, 25),
    niftyResistance: roundLevel(niftyPx + niftyAtr, 25),
    bankNiftySupport: roundLevel(bnkPx - bnkAtr, 50),
    bankNiftyResistance: roundLevel(bnkPx + bnkAtr, 50),
  };
  const expectedMove = {
    niftyPct: Number(niftyBandPct.toFixed(2)),
    bankNiftyPct: Number(bnkBandPct.toFixed(2)),
  };

  // ----- Flows commentary -----
  let flowsCommentary = "FII/DII data unavailable.";
  if (fiiDii) {
    const trend = fiiDii.last5.reduce((a: number, x: any) => a + x.fii, 0);
    const diiTrend = fiiDii.last5.reduce((a: number, x: any) => a + x.dii, 0);
    const fiiSide = fiiNet >= 0 ? "buyers" : "sellers";
    const diiSide = (fiiDii.diiNet ?? 0) >= 0 ? "absorbing" : "selling alongside";
    flowsCommentary = `FIIs were net ${fiiSide} at ₹${Math.abs(fiiNet).toFixed(0)} Cr on ${fiiDii.date} with DIIs ${diiSide} (₹${Math.abs(fiiDii.diiNet).toFixed(0)} Cr). 5-day FII tally ${trend >= 0 ? "+" : ""}${trend.toFixed(0)} Cr vs DII ${diiTrend >= 0 ? "+" : ""}${diiTrend.toFixed(0)} Cr — ${trend > 0 && diiTrend > 0 ? "broad institutional support" : trend < 0 && diiTrend < 0 ? "double-sided distribution, stay defensive" : "mixed positioning, expect rotation"}.`;
  }

  // ----- Market summary tailored to session -----
  const breadthLine = advDec
    ? `${advDec.advances} adv vs ${advDec.declines} dec (ratio ${advDec.ratio.toFixed(2)}, ${advDec.ratio > 1.5 ? "strongly positive" : advDec.ratio > 1 ? "mildly positive" : advDec.ratio > 0.66 ? "mildly negative" : "broadly weak"})`
    : "breadth pending";
  const indexLine = `NIFTY ${niftyPx.toFixed(0)} (${niftyChg >= 0 ? "+" : ""}${niftyChg.toFixed(2)}%), BANK NIFTY ${bnkPx.toFixed(0)} (${(bnkRes?.changePct ?? 0) >= 0 ? "+" : ""}${(bnkRes?.changePct ?? 0).toFixed(2)}%), India VIX ${vixVal.toFixed(2)}.`;
  // Today's actual leaders/laggards (by daily % change), not by composite score
  const byDay = [...scored].sort((a, b) => b.changePct - a.changePct);
  const leaders  = byDay.slice(0, 3).map((q) => `${q.symbol.replace(".NS", "")} ${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%`).join(", ");
  const laggards = byDay.slice(-3).reverse().map((q) => `${q.symbol.replace(".NS", "")} ${q.changePct.toFixed(2)}%`).join(", ");
  const moveBand = `Expected 1-day band: NIFTY ±${expectedMove.niftyPct}% (${keyLevels.niftySupport}-${keyLevels.niftyResistance}), BNF ±${expectedMove.bankNiftyPct}% (${keyLevels.bankNiftySupport}-${keyLevels.bankNiftyResistance}).`;

  const sessionIntro: Record<string, string> = {
    pre: `Pre-market read for ${sessionInfo.ist}. Yesterday closed with ${indexLine} Breadth ${breadthLine}.`,
    live: `Live tape at ${sessionInfo.ist}. ${indexLine} Breadth ${breadthLine}.`,
    post: `Post-market wrap for ${sessionInfo.ist}. ${indexLine} Breadth ${breadthLine}.`,
    closed: `Markets closed. Last print: ${indexLine} Breadth ${breadthLine}.`,
  };
  const sessionOutlook: Record<string, string> = {
    pre: `${moveBand} ${marketRegime === "bullish" ? "Bias: buy dips toward support" : marketRegime === "bearish" ? "Bias: sell rallies into resistance" : marketRegime === "volatile" ? "VIX elevated — cut size, widen stops" : "Range-bound — trade the band edges"}.`,
    live: `Today's leaders: ${leaders}. Laggards: ${laggards}. ${moveBand} ${niftyRes?.dayRangePos != null ? `NIFTY trading at ${(niftyRes.dayRangePos * 100).toFixed(0)}% of day's range — ${niftyRes.dayRangePos > 0.7 ? "strength near highs" : niftyRes.dayRangePos < 0.3 ? "weakness near lows" : "mid-range, no edge"}.` : ""} ${marketRegime === "volatile" ? "Scale exposure down." : ""}`,
    post: `Today's leaders: ${leaders}. Drag: ${laggards}. ${moveBand} ${marketRegime} regime persists unless breadth flips.`,
    closed: `Last-session leaders: ${leaders}. Laggards: ${laggards}. ${moveBand} Build watchlist on relative strength; reassess at next open.`,
  };
  const marketSummary = `${sessionIntro[sessionInfo.session]} ${flowsCommentary} ${sessionOutlook[sessionInfo.session]}`;

  // ----- Trade ideas -----
  const longCands = scored.filter((q) =>
    q.price > q.sma20 && q.price > q.sma50 && q.rsi >= 50 && q.rsi <= 72 && q.volRatio >= 0.9 && !(q.pctFrom52H > -1 && q.rsi > 78)
  ).sort((a, b) => b.score - a.score);

  const shortCands = scored.filter((q) =>
    q.price < q.sma20 && q.price < q.sma50 && q.rsi >= 28 && q.rsi <= 48 && q.volRatio >= 0.9
  ).sort((a, b) => a.score - b.score);

  const allowShorts = marketRegime === "bearish" || marketRegime === "volatile";
  const longCount = allowShorts ? 4 : 6;
  const shortCount = allowShorts ? 2 : 0;

  const mkTrade = (q: any, action: "BUY" | "SHORT") => {
    const atrPct = Math.max(2, Math.min(8, q.atrPct * 1.5));
    const slPct = Math.min(6, Math.max(3, atrPct));
    const tgtPct = slPct * 2.2;
    const entry = q.price;
    const stopLoss = action === "BUY" ? entry * (1 - slPct / 100) : entry * (1 + slPct / 100);
    const target = action === "BUY" ? entry * (1 + tgtPct / 100) : entry * (1 - tgtPct / 100);
    const confidence = Math.min(92, Math.max(55, Math.round(60 + q.score * 0.25)));
    const trendTag = action === "BUY"
      ? `Above 20/50 SMA, RSI ${q.rsi}, ${q.pctFrom52H.toFixed(1)}% from 52w high`
      : `Below 20/50 SMA, RSI ${q.rsi}, ${q.pctFrom52L.toFixed(1)}% from 52w low`;
    const catalyst = action === "BUY"
      ? (q.changePct > 1.5 && q.volRatio > 1.3 ? "Volume breakout" : q.pctFrom52H > -5 ? "Near 52w high — base breakout setup" : q.perf1m > 5 ? "1-month momentum continuation" : "Trend pullback to moving average")
      : (q.changePct < -1.5 && q.volRatio > 1.3 ? "Distribution day — high volume breakdown" : "Trend resumption short");
    const reasoning = `${trendTag}. 1m ${q.perf1m.toFixed(1)}%, 3m ${q.perf3m.toFixed(1)}%, vol ${q.volRatio.toFixed(2)}x avg. R:R 1:2.2 with ${slPct.toFixed(1)}% stop, ${tgtPct.toFixed(1)}% target.`;
    return {
      symbol: q.symbol,
      name: q.symbol.replace(".NS", ""),
      action,
      entry: Number(entry.toFixed(2)),
      stopLoss: Number(stopLoss.toFixed(2)),
      target: Number(target.toFixed(2)),
      timeframe: "swing",
      confidence,
      catalyst,
      reasoning,
    };
  };

  const tradeIdeas = [
    ...longCands.slice(0, longCount).map((q) => mkTrade(q, "BUY")),
    ...shortCands.slice(0, shortCount).map((q) => mkTrade(q, "SHORT")),
  ];

  // ----- Bull / Bear lists -----
  // Lead with TODAY's % change (daily). Filter for genuine strength/weakness.
  const bullSrc = [...scored]
    .filter((q) => q.changePct > 0)
    .sort((a, b) => (b.changePct + b.score * 0.05) - (a.changePct + a.score * 0.05))
    .slice(0, 5);
  const bullish = (bullSrc.length ? bullSrc : byDay.slice(0, 5)).map((q) => ({
    symbol: q.symbol,
    reason: `Today ${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}% · 1w ${q.perf1w >= 0 ? "+" : ""}${q.perf1w.toFixed(1)}% · RSI ${q.rsi} · ${q.volRatio.toFixed(2)}x vol${q.pctFrom52H > -3 ? " · near 52w high" : ""}.`,
  }));
  const bearSrc = [...scored]
    .filter((q) => q.changePct < 0)
    .sort((a, b) => (a.changePct - b.changePct))
    .slice(0, 5);
  const bearish = (bearSrc.length ? bearSrc : byDay.slice(-5).reverse()).map((q) => ({
    symbol: q.symbol,
    reason: `Today ${q.changePct.toFixed(2)}% · 1w ${q.perf1w >= 0 ? "+" : ""}${q.perf1w.toFixed(1)}% · RSI ${q.rsi}${q.price < q.sma20 ? " · below 20 SMA" : ""}${q.pctFrom52L < 5 ? " · near 52w low" : ""}.`,
  }));

  // ----- News impact -----
  const universe = scored.map((q) => q.symbol);
  const newsImpact = news.slice(0, 8).map((n: any) => {
    const impact = classifyNews(n.title);
    const affects = detectTickers(n.title, universe);
    const rationale = impact === "bullish"
      ? `Positive tone — supportive for ${affects.toLowerCase()}.`
      : impact === "bearish"
      ? `Negative tone — pressure on ${affects.toLowerCase()}.`
      : `Informational; monitor follow-through on ${affects.toLowerCase()}.`;
    return { headline: n.title, source: n.source, impact, affects, rationale };
  });

  return { marketRegime, marketSummary, keyLevels, expectedMove, flowsCommentary, tradeIdeas, bullish, bearish, newsImpact };
}
