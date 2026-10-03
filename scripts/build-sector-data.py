"""Builds public/data/sectors.json: sector performance and an *estimated* money-flow
proxy from free NSE bhavcopy data (tejhq/indian-markets on Hugging Face).
Usage: python3 scripts/build-sector-data.py [--force]; no-op if the data has no newer trading day.   (needs duckdb, pandas, numpy)
Flow is price x volume pressure (turnover on up days minus down days). It is NOT FII/DII data."""
import json, math, datetime as dt
import os, sys, urllib.request, http.cookiejar
import duckdb, numpy as np, pandas as pd

def fetch_fii_dii():
    """Official NSE cash-market FII/FPI and DII net (Rs crore), market-wide. None on any failure."""
    try:
        ua = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
        op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        op.addheaders = [("User-Agent", ua), ("Accept", "application/json"), ("Referer", "https://www.nseindia.com/reports/fii-dii")]
        try: op.open("https://www.nseindia.com/", timeout=20).read()
        except Exception: pass  # homepage may 403; the cookie jar is still seeded
        rows = json.load(op.open("https://www.nseindia.com/api/fiidiiTradeReact", timeout=20))
        out = {"date": rows[0]["date"], "source": "NSE"}
        for r in rows:
            net = round(float(r["netValue"]))
            if r["category"].upper().startswith("FII"): out["fii"] = net
            elif r["category"].upper().startswith("DII"): out["dii"] = net
        return out if "fii" in out and "dii" in out else None
    except Exception as e:
        print("FII/DII fetch failed:", e)
        return None

URL = "https://huggingface.co/datasets/tejhq/indian-markets/resolve/main/prices_adjusted/nse_2026.parquet"
uni = json.load(open("src/data/nseUniverse.json"))["u"]
sector_of = {s: sec for s, _, sec in uni}
name_of = {s: n for s, n, _ in uni}

c = duckdb.connect(); c.execute("install httpfs; load httpfs")
df = c.execute(f"""select date, symbol, adj_close as close, volume, turnover
                   from read_parquet('{URL}') where series='EQ' and adj_close>0""").df()
df = df[df.symbol.isin(sector_of)]
df["date"] = pd.to_datetime(df["date"])
close = df.pivot(index="date", columns="symbol", values="close").sort_index()
turn = df.pivot(index="date", columns="symbol", values="turnover").sort_index()
close = close.ffill(limit=3)
ret = close.pct_change()
dates = close.index
asof = dates[-1]
# liquid universe: 20d avg turnover > Rs 2 cr, fully listed over 21 sessions
t20 = turn.rolling(20, min_periods=15).mean()
liquid = (t20.iloc[-1] > 2e7) & close.iloc[-22:].notna().all()
syms = [s for s in close.columns if liquid.get(s, False)]
print("asof", asof.date(), "liquid stocks", len(syms), "sessions", len(dates))
OUT = "public/data/sectors.json"
fii = fetch_fii_dii()
prev = {}
if os.path.exists(OUT):
    try: prev = json.load(open(OUT))
    except Exception: prev = {}
fii = fii or prev.get("fiiDii")  # keep the last good figure if NSE is unreachable
if "--force" not in sys.argv and prev.get("asOf") == str(asof.date()):
    if fii and fii != prev.get("fiiDii"):
        prev["fiiDii"] = fii
        json.dump(prev, open(OUT, "w"), separators=(",", ":"))
        print("Updated FII/DII only:", fii)
    else:
        print("No new trading day in the dataset; leaving", OUT, "unchanged.")
    sys.exit(0)

def basket(cols):
    w = t20.shift(1)[cols]
    w = w.div(w.sum(axis=1), axis=0)
    r = (ret[cols] * w).sum(axis=1, min_count=1)
    return (1 + r.fillna(0)).cumprod()

def chg(idx, n): return float(idx.iloc[-1] / idx.iloc[-1 - n] - 1) * 100
mkt = basket(syms)
out = []
for sec in sorted(set(sector_of[s] for s in syms)):
    cols = [s for s in syms if sector_of[s] == sec]
    if len(cols) < 4: continue
    idx = basket(cols)
    cl = close[cols]
    r10 = ret[cols].iloc[-10:]; t10 = turn[cols].iloc[-10:]
    signed = (np.sign(r10) * t10)
    net_daily = signed.sum(axis=1) / 1e7  # Rs crore
    pressure = float(signed.sum().sum() / t10.sum().sum()) * 100
    tr = float(turn[cols].iloc[-5:].sum(axis=1).mean() / turn[cols].iloc[-60:].sum(axis=1).mean())
    sma50 = cl.rolling(50).mean().iloc[-1]
    breadth50 = float((cl.iloc[-1] > sma50).mean()) * 100
    adv = float((ret[cols].iloc[-1] > 0).mean()) * 100
    r21 = cl.iloc[-1] / cl.iloc[-22] - 1
    rows = pd.DataFrame({"r21": r21 * 100, "r1": ret[cols].iloc[-1] * 100,
                         "t20": t20[cols].iloc[-1] / 1e7, "p": cl.iloc[-1],
                         "surge": turn[cols].iloc[-5:].mean() / t20[cols].iloc[-1]}).dropna()
    def pick(d): return [{"s": s, "n": name_of[s], "p": round(float(r.p), 2), "r1": round(float(r.r1), 2),
                         "r21": round(float(r.r21), 1)} for s, r in d.iterrows()]
    top = rows.sort_values("r21", ascending=False)
    spark = (idx / idx.iloc[-61]).iloc[-60:] * 100
    mspark = (mkt / mkt.iloc[-61]).iloc[-60:] * 100
    out.append({
        "sector": sec, "stocks": len(cols),
        "chg": {k: round(chg(idx, n), 2) for k, n in [("1d", 1), ("1w", 5), ("1m", 21), ("3m", 63), ("6m", 126)]},
        "rs": {"1m": round(chg(idx, 21) - chg(mkt, 21), 2), "3m": round(chg(idx, 63) - chg(mkt, 63), 2)},
        "breadth50": round(breadth50), "adv": round(adv),
        "flow": {"net10": round(float(net_daily.sum()), 0), "pressure": round(pressure, 1),
                 "turnTrend": round((tr - 1) * 100, 1), "daily": [round(float(x), 0) for x in net_daily],
                 "avgTurnCr": round(float(turn[cols].iloc[-20:].sum(axis=1).mean() / 1e7), 0)},
        "spark": [round(float(x), 2) for x in spark], "leaders": pick(top.head(3)),
        "laggards": pick(top.tail(3).iloc[::-1]),
        "surge": pick(rows[rows.t20 > 5].sort_values("surge", ascending=False).head(2)),
    })
mk = {"chg": {k: round(chg(mkt, n), 2) for k, n in [("1d", 1), ("1w", 5), ("1m", 21), ("3m", 63), ("6m", 126)]},
      "spark": [round(float(x), 2) for x in (mkt / mkt.iloc[-61]).iloc[-60:] * 100]}
json.dump({"asOf": str(asof.date()), "generatedAt": dt.datetime.utcnow().isoformat() + "Z",
           "source": "NSE bhavcopy via tejhq/indian-markets; sectors per niftyindices.com lists",
           "universe": len(syms), "fiiDii": fii, "market": mk, "sectors": out}, open(OUT, "w"), separators=(",", ":"))
for s in sorted(out, key=lambda x: -x["flow"]["pressure"]):
    print(f'{s["sector"][:34]:34} n={s["stocks"]:3} 1m={s["chg"]["1m"]:6} 3m={s["chg"]["3m"]:6} rs3m={s["rs"]["3m"]:6} press={s["flow"]["pressure"]:6} net={s["flow"]["net10"]:8} tt={s["flow"]["turnTrend"]}')
