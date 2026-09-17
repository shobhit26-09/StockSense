import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const YH = { "User-Agent": UA, Accept: "application/json" };

/* ------------------------------------------------------------------ */
/*  Sector universe + macro sensitivity model                          */
/*  Sensitivities are elasticities: how a +1% move in the driver       */
/*  historically pressures (-) or supports (+) the sector.             */
/* ------------------------------------------------------------------ */

interface SectorDef {
  key: string;
  name: string;
  symbol: string;
  leaders: string[];
  /** driver key -> sensitivity (-1 .. +1) */
  sens: Record<string, number>;
  /** headline keywords that map news to this sector */
  keywords: string[];
  policyNote: string;
}

const SECTORS: SectorDef[] = [
  {
    key: "it", name: "Information Technology", symbol: "^CNXIT",
    leaders: ["TCS", "INFY", "HCLTECH", "LTIM", "PERSISTENT"],
    sens: { usdinr: 0.65, nasdaq: 0.7, ust10y: -0.35, crude: 0, dxy: 0.2, gold: 0 },
    keywords: ["it services", "software", "tcs", "infosys", "wipro", "hcl", "h-1b", "ai deal", "tech spend", "nasdaq", "outsourcing"],
    policyNote: "US discretionary tech spend, H-1B/visa policy and rupee direction dominate earnings.",
  },
  {
    key: "banks", name: "Banks & Financials", symbol: "^NSEBANK",
    leaders: ["HDFCBANK", "ICICIBANK", "SBIN", "AXISBANK", "KOTAKBANK"],
    sens: { ust10y: -0.3, inr10y: -0.55, usdinr: -0.3, crude: -0.15, dxy: -0.25, gold: 0 },
    keywords: ["rbi", "repo rate", "monetary policy", "bank", "credit growth", "npa", "liquidity", "crr", "deposit", "nbfc", "lending"],
    policyNote: "RBI rate path, systemic liquidity and credit-deposit growth set the tone.",
  },
  {
    key: "auto", name: "Automobiles", symbol: "NIFTYAUTO.NS",
    leaders: ["MARUTI", "M&M", "TATAMOTORS", "BAJAJ-AUTO", "EICHERMOT"],
    sens: { crude: -0.4, inr10y: -0.35, usdinr: -0.2, gold: 0, dxy: 0, nasdaq: 0.1 },
    keywords: ["auto sales", "vehicle", "ev", "gst", "maruti", "tata motors", "two-wheeler", "pli scheme", "semiconductor shortage", "fame"],
    policyNote: "GST/EV incentives, fuel costs and rural demand drive volumes.",
  },
  {
    key: "pharma", name: "Pharma & Healthcare", symbol: "NIFTYPHARMA.NS",
    leaders: ["SUNPHARMA", "CIPLA", "DRREDDY", "DIVISLAB", "LUPIN"],
    sens: { usdinr: 0.5, dxy: 0.15, crude: -0.1, ust10y: -0.1, nasdaq: 0.15, gold: 0 },
    keywords: ["pharma", "usfda", "drug", "generic", "api", "healthcare", "tariff on pharma", "price control", "nppa"],
    policyNote: "USFDA outcomes, US generic pricing and any tariff action on drug imports.",
  },
  {
    key: "fmcg", name: "FMCG & Consumer", symbol: "NIFTYFMCG.NS",
    leaders: ["HINDUNILVR", "ITC", "NESTLEIND", "BRITANNIA", "DABUR"],
    sens: { crude: -0.3, gold: -0.05, inr10y: -0.1, usdinr: -0.15, dxy: 0, nasdaq: 0 },
    keywords: ["fmcg", "consumption", "rural demand", "monsoon", "inflation", "cpi", "gst rate", "palm oil", "input cost"],
    policyNote: "Monsoon, food inflation and rural wage cycle decide volume growth.",
  },
  {
    key: "metal", name: "Metals & Mining", symbol: "NIFTYMETAL.NS",
    leaders: ["TATASTEEL", "JSWSTEEL", "HINDALCO", "VEDL", "JINDALSTEL"],
    sens: { dxy: -0.6, china: 0.7, crude: 0.2, ust10y: -0.3, usdinr: 0.2, gold: 0.3 },
    keywords: ["steel", "metal", "china stimulus", "iron ore", "aluminium", "copper", "import duty", "commodity", "mining"],
    policyNote: "China stimulus, global commodity cycle and import-duty tweaks swing margins.",
  },
  {
    key: "energy", name: "Energy & Oil", symbol: "NIFTYENERGY.NS",
    leaders: ["RELIANCE", "ONGC", "NTPC", "POWERGRID", "BPCL"],
    sens: { crude: 0.45, dxy: -0.15, ust10y: -0.15, usdinr: 0.1, gold: 0, nasdaq: 0 },
    keywords: ["crude", "opec", "oil", "gas", "refinery", "power demand", "renewable", "excise duty", "windfall tax"],
    policyNote: "Crude path, OPEC+ supply and marketing-margin/windfall-tax policy.",
  },
  {
    key: "realty", name: "Realty & Infra", symbol: "NIFTYREALTY.NS",
    leaders: ["DLF", "LODHA", "GODREJPROP", "OBEROIRLTY", "PRESTIGE"],
    sens: { inr10y: -0.7, ust10y: -0.25, crude: -0.1, usdinr: -0.2, dxy: 0, gold: 0 },
    keywords: ["real estate", "housing", "home loan", "infrastructure", "capex", "budget allocation", "rera", "property"],
    policyNote: "Domestic rate cycle and government capex allocation are the swing factors.",
  },
];

/* --------------------------- macro drivers -------------------------- */

const DRIVERS: { key: string; symbol: string; label: string; unit?: string }[] = [
  { key: "crude",  symbol: "BZ=F",       label: "Brent crude", unit: "$" },
  { key: "usdinr", symbol: "INR=X",      label: "USD/INR" },
  { key: "dxy",    symbol: "DX-Y.NYB",   label: "Dollar index" },
  { key: "ust10y", symbol: "^TNX",       label: "US 10Y yield", unit: "%" },
  { key: "gold",   symbol: "GC=F",       label: "Gold", unit: "$" },
  { key: "nasdaq", symbol: "^IXIC",      label: "Nasdaq" },
  { key: "china",  symbol: "000001.SS",  label: "Shanghai comp" },
  { key: "vix",    symbol: "^INDIAVIX",  label: "India VIX" },
  { key: "nifty",  symbol: "^NSEI",      label: "NIFTY 50" },
];

async function yahoo(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=6mo`;
    const r = await fetch(url, { headers: YH });
    if (!r.ok) return null;
    const j = await r.json();
    const res = j?.chart?.result?.[0];
    const meta = res?.meta;
    const closes: number[] = (res?.indicators?.quote?.[0]?.close || []).filter((v: any) => typeof v === "number");
    const price = meta?.regularMarketPrice ?? closes[closes.length - 1];
    if (!price) return null;
    const prev = meta?.regularMarketPreviousClose ?? meta?.previousClose ?? closes[closes.length - 2] ?? price;
    const at = (n: number) => closes[closes.length - 1 - n] ?? closes[0] ?? price;
    const pct = (base: number) => (base ? ((price - base) / base) * 100 : 0);
    const sma = (n: number) =>
      closes.length >= n ? closes.slice(-n).reduce((a, b) => a + b, 0) / n : price;
    // RSI(14)
    let rsi = 50;
    if (closes.length >= 15) {
      const s = closes.slice(-15);
      let g = 0, l = 0;
      for (let i = 1; i < s.length; i++) { const d = s[i] - s[i - 1]; d >= 0 ? (g += d) : (l -= d); }
      rsi = 100 - 100 / (1 + (l === 0 ? 100 : g / l));
    }
    return {
      symbol, price,
      change1d: pct(prev === price ? 1 : 0) || ((price - prev) / prev) * 100,
      change1w: pct(at(5)),
      change1m: pct(at(21)),
      change3m: pct(at(63)),
      sma20: sma(20), sma50: sma(50),
      rsi: Math.round(rsi),
      aboveSma20: price > sma(20),
      aboveSma50: price > sma(50),
    };
  } catch { return null; }
}

/* ------------------------------ news -------------------------------- */

const FEEDS = [
  { url: "https://www.moneycontrol.com/rss/economy.xml", source: "Moneycontrol · Economy" },
  { url: "https://www.moneycontrol.com/rss/business.xml", source: "Moneycontrol · Business" },
  { url: "https://www.moneycontrol.com/rss/marketreports.xml", source: "Moneycontrol · Markets" },
  { url: "https://www.livemint.com/rss/markets", source: "Mint · Markets" },
  { url: "https://www.livemint.com/rss/economy", source: "Mint · Economy" },
  { url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", source: "ET Markets" },
  { url: "https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms", source: "ET Economy" },
];

const POSITIVE = ["surge", "jump", "gain", "rally", "record", "beat", "upgrade", "boost", "growth", "stimulus", "cut in rate", "rate cut", "incentive", "approval", "order win", "expansion", "strong demand", "outperform", "profit rises", "tailwind", "revival", "inflow", "ease", "eased", "relief"];
const NEGATIVE = ["fall", "slump", "drop", "decline", "loss", "downgrade", "cut in guidance", "warning", "probe", "ban", "tariff", "duty hike", "penalty", "slowdown", "weak demand", "miss", "default", "outflow", "hike in rate", "rate hike", "layoff", "crisis", "protest", "sanction", "recall", "headwind"];

async function fetchNews() {
  const out: { title: string; source: string; link: string; published: string }[] = [];
  await Promise.all(FEEDS.map(async (f) => {
    try {
      const r = await fetch(f.url, { headers: { "User-Agent": UA } });
      if (!r.ok) return;
      const xml = await r.text();
      for (const item of xml.split(/<item[\s>]/i).slice(1, 16)) {
        const title = (item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] || "").trim();
        const link = (item.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || "").trim();
        const published = (item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || "").trim();
        if (title) out.push({ title, source: f.source, link, published });
      }
    } catch { /* feed offline */ }
  }));
  return out;
}

const scoreHeadline = (t: string) => {
  const s = t.toLowerCase();
  let v = 0;
  for (const w of POSITIVE) if (s.includes(w)) v += 1;
  for (const w of NEGATIVE) if (s.includes(w)) v -= 1;
  return Math.max(-2, Math.min(2, v));
};

/* --------------------------- FII / DII flow -------------------------- */

async function fetchFiiDii() {
  try {
    const r = await fetch("https://webapi.niftytrader.in/webapi/Resource/fii-dii-activity-data", { headers: { "User-Agent": UA } });
    if (!r.ok) return null;
    const j = await r.json();
    const rows = j?.resultData?.fii_dii_data || [];
    if (!rows.length) return null;
    const l = rows[0];
    return {
      date: l.created_at?.slice(0, 10),
      fiiNet: Number(l.fii_net_value),
      diiNet: Number(l.dii_net_value),
      fii5d: rows.slice(0, 5).reduce((a: number, x: any) => a + Number(x.fii_net_value || 0), 0),
    };
  } catch { return null; }
}

/* ------------------------------ engine ------------------------------- */

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const sign = (v: number) => (v > 0 ? "+" : "");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const [driverArr, sectorArr, news, flow] = await Promise.all([
      Promise.all(DRIVERS.map(async (d) => [d.key, await yahoo(d.symbol)] as const)),
      Promise.all(SECTORS.map(async (s) => [s.key, await yahoo(s.symbol)] as const)),
      fetchNews(),
      fetchFiiDii(),
    ]);

    const drivers: Record<string, any> = {};
    for (const [k, v] of driverArr) if (v) drivers[k] = v;
    const quotes: Record<string, any> = {};
    for (const [k, v] of sectorArr) if (v) quotes[k] = v;

    const nifty = drivers.nifty;
    const niftyMonth = nifty?.change1m ?? 0;

    // Domestic 10Y proxy: inverse of the sensex-linked bond ETF is unreliable, so we
    // proxy the domestic rate impulse from US 10Y + crude (imported inflation).
    const inr10yImpulse =
      ((drivers.ust10y?.change1m ?? 0) * 0.5 + (drivers.crude?.change1m ?? 0) * 0.25);

    const driverMoves: Record<string, number> = {
      crude: drivers.crude?.change1m ?? 0,
      usdinr: drivers.usdinr?.change1m ?? 0,
      dxy: drivers.dxy?.change1m ?? 0,
      ust10y: drivers.ust10y?.change1m ?? 0,
      gold: drivers.gold?.change1m ?? 0,
      nasdaq: drivers.nasdaq?.change1m ?? 0,
      china: drivers.china?.change1m ?? 0,
      inr10y: inr10yImpulse,
    };

    const results = SECTORS.map((def) => {
      const q = quotes[def.key];
      const drivers_hit: { label: string; detail: string; impact: number }[] = [];

      /* 1. Price/momentum score (-40 .. +40) */
      let momentum = 0;
      if (q) {
        const rs1m = (q.change1m ?? 0) - niftyMonth;
        const rs3m = (q.change3m ?? 0) - (nifty?.change3m ?? 0);
        momentum += clamp(rs1m * 3, -18, 18);
        momentum += clamp(rs3m * 1.2, -10, 10);
        if (q.aboveSma20) momentum += 5; else momentum -= 5;
        if (q.aboveSma50) momentum += 4; else momentum -= 4;
        if (q.rsi > 70) momentum -= 3;
        if (q.rsi < 35) momentum -= 2;
        momentum = clamp(momentum, -40, 40);
        drivers_hit.push({
          label: "Relative strength",
          detail: `${sign(rs1m)}${rs1m.toFixed(1)}% vs NIFTY over 1M · ${q.aboveSma50 ? "above" : "below"} 50-DMA · RSI ${q.rsi}`,
          impact: momentum,
        });
      }

      /* 2. Macro / global sensitivity score (-35 .. +35) */
      let macro = 0;
      const macroBits: string[] = [];
      for (const [k, sens] of Object.entries(def.sens)) {
        if (!sens) continue;
        const move = driverMoves[k] ?? 0;
        if (!isFinite(move) || Math.abs(move) < 0.4) continue;
        const contrib = clamp(move * sens * 1.6, -12, 12);
        macro += contrib;
        const dlabel = DRIVERS.find((d) => d.key === k)?.label ?? (k === "inr10y" ? "Domestic rate impulse" : k);
        macroBits.push(`${dlabel} ${sign(move)}${move.toFixed(1)}% (1M) → ${contrib >= 0 ? "tailwind" : "headwind"}`);
      }
      macro = clamp(macro, -35, 35);
      if (macroBits.length) {
        drivers_hit.push({ label: "Macro & global", detail: macroBits.slice(0, 3).join(" · "), impact: macro });
      }

      /* 3. News, policy & event score (-25 .. +25) */
      const matched = news.filter((n) => {
        const t = n.title.toLowerCase();
        return def.keywords.some((k) => t.includes(k));
      });
      let newsScore = 0;
      const headlines = matched.slice(0, 6).map((n) => {
        const s = scoreHeadline(n.title);
        newsScore += s * 4;
        return { title: n.title, source: n.source, link: n.link, sentiment: s > 0 ? "positive" : s < 0 ? "negative" : "neutral" };
      });
      newsScore = clamp(newsScore, -25, 25);
      if (matched.length) {
        drivers_hit.push({
          label: "News & policy flow",
          detail: `${matched.length} sector headlines in the last cycle · net tone ${newsScore >= 0 ? "supportive" : "cautious"}`,
          impact: newsScore,
        });
      }

      /* 4. Institutional flow tilt (-10 .. +10), scaled by beta to flows */
      let flowScore = 0;
      if (flow) {
        const beta = def.key === "banks" ? 1 : def.key === "it" ? 0.8 : def.key === "metal" ? 0.7 : 0.45;
        flowScore = clamp((flow.fii5d / 5000) * 10 * beta, -10, 10);
        drivers_hit.push({
          label: "Institutional flows",
          detail: `FII 5-day net ₹${(flow.fii5d / 100).toFixed(0)} cr · DII ₹${(flow.diiNet / 100).toFixed(0)} cr (${flow.date})`,
          impact: flowScore,
        });
      }

      const total = momentum + macro + newsScore + flowScore;      // -110 .. +110
      const score = Math.round(clamp(total, -100, 100));
      const stance =
        score >= 28 ? "bullish" :
        score >= 10 ? "accumulate" :
        score <= -28 ? "bearish" :
        score <= -10 ? "avoid" : "neutral";

      const conviction = Math.round(clamp(
        40 + Math.abs(score) * 0.45 + (matched.length ? 8 : 0) + (q ? 6 : 0), 30, 95));

      const horizon = Math.abs(score) >= 28 ? "1–3 months" : "2–6 weeks";

      const thesis = (() => {
        const rs = q ? (q.change1m ?? 0) - niftyMonth : 0;
        const lead = stance === "bullish" || stance === "accumulate"
          ? `${def.name} is screening constructive`
          : stance === "bearish" || stance === "avoid"
          ? `${def.name} is screening weak`
          : `${def.name} is range-bound`;
        const mo = q
          ? `${sign(rs)}${rs.toFixed(1)}% relative to NIFTY over the last month, trading ${q.aboveSma50 ? "above" : "below"} its 50-day average`
          : "with limited price history available";
        const mac = macroBits[0] ? `Macro: ${macroBits[0].toLowerCase()}.` : "";
        return `${lead} — ${mo}. ${mac} ${def.policyNote}`.replace(/\s+/g, " ").trim();
      })();

      return {
        key: def.key,
        name: def.name,
        symbol: def.symbol,
        leaders: def.leaders,
        price: q?.price ?? null,
        change1d: q?.change1d ?? null,
        change1w: q?.change1w ?? null,
        change1m: q?.change1m ?? null,
        change3m: q?.change3m ?? null,
        rs1m: q ? (q.change1m ?? 0) - niftyMonth : null,
        rsi: q?.rsi ?? null,
        score, stance, conviction, horizon, thesis,
        breakdown: {
          momentum: Math.round(momentum),
          macro: Math.round(macro),
          news: Math.round(newsScore),
          flows: Math.round(flowScore),
        },
        drivers: drivers_hit,
        headlines,
      };
    }).sort((a, b) => b.score - a.score);

    const macroSnapshot = DRIVERS.filter((d) => drivers[d.key]).map((d) => ({
      key: d.key,
      label: d.label,
      unit: d.unit ?? "",
      price: drivers[d.key].price,
      change1d: drivers[d.key].change1d,
      change1m: drivers[d.key].change1m,
    }));

    const bullCount = results.filter((r) => r.score >= 10).length;
    const bearCount = results.filter((r) => r.score <= -10).length;
    const regime =
      bullCount >= bearCount + 3 ? "Risk-on — breadth of sector leadership is widening"
      : bearCount >= bullCount + 3 ? "Risk-off — leadership is narrowing, defensives preferred"
      : "Mixed — rotation market, be selective within sectors";

    return new Response(JSON.stringify({
      generatedAt: new Date().toISOString(),
      regime,
      bullCount, bearCount,
      niftyMonth,
      vix: drivers.vix?.price ?? null,
      macro: macroSnapshot,
      flow,
      sectors: results,
      newsCount: news.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[sector-outlook]", e);
    return new Response(JSON.stringify({ error: "Failed to build sector outlook" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
