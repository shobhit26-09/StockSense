"""Builds public/data/fii-dii.json: FII and DII cash-market net buy/(sell) with Nifty close, daily / monthly / yearly.
Source: StockEdge's public API (api.stockedge.com), which compiles NSE/BSE provisional cash-market figures.
NSE itself only publishes the latest day, so there is no official history to read. Daily rows are kept and extended
run by run, so history grows beyond what the API returns. Monthly and yearly come straight from the API.
No-op safe: any failure keeps the existing file; nothing is rewritten unless the data changed.
Usage: python3 scripts/build-fii-dii.py   (stdlib only)"""
import json, os, sys, datetime as dt, urllib.request

OUT = "public/data/fii-dii.json"
API = "https://api.stockedge.com/Api/FIIDashboardApi/GetFIIDIIProvisional?FiiDiiType=%s&TimeSpan=%s"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
MON = {m: i + 1 for i, m in enumerate("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split())}

def get(who, span):
    req = urllib.request.Request(API % (who, span), headers={"User-Agent": UA})
    rows = json.load(urllib.request.urlopen(req, timeout=40))
    if not isinstance(rows, list) or not rows: raise ValueError("empty response")
    return rows

def row(r, label):
    n = r.get("NiftyCZG")
    return {"l": label, "v": round(float(r["NetValue"]), 2), "n": r.get("NiftyC"), "c": None if n is None else round(float(n), 2)}

def daily_dates(rows, today):
    """API gives 'Oct 1' without a year, newest first. Walk back and step the year when the month jumps up."""
    out, year, last_m = [], today.year, None
    for r in rows:
        m, d = r["DateText"].split()
        m = MON[m]
        if last_m is not None and m > last_m: year -= 1
        last_m = m
        out.append(dt.date(year, m, int(d)).isoformat())
    return out

prev = {}
if os.path.exists(OUT):
    try: prev = json.load(open(OUT))
    except Exception: pass
today = dt.date.today()
try:
    new = {}
    for who in ("fii", "dii"):
        d = get(who, "D")
        dates = daily_dates(d, today)
        old = {r["l"]: r for r in prev.get(who, {}).get("daily", [])}
        for k, r in zip(dates, d): old[k] = row(r, k)
        new[who] = {
            "daily": [old[k] for k in sorted(old, reverse=True)],
            "monthly": [row(r, r["DateText"]) for r in get(who, "M")],
            "yearly": [row(r, r["DateText"]) for r in get(who, "Y")],
        }
except Exception as e:
    print("fetch failed, keeping existing file:", e); sys.exit(0)

# Daily change % is only supplied for the days the API returns; recompute for older stored rows from Nifty closes.
for who in new:
    rows = new[who]["daily"]
    for i, r in enumerate(rows[:-1]):
        if r["c"] is None and r["n"] and rows[i + 1]["n"]:
            r["c"] = round((r["n"] / rows[i + 1]["n"] - 1) * 100, 2)

out = {"source": "StockEdge public API, compiled from NSE/BSE provisional cash-market data",
       "unit": "Rs crore, net buy/(sell)", **new}
if all(out.get(k) == prev.get(k) for k in ("fii", "dii")):
    print("No change."); sys.exit(0)
out["updatedAt"] = dt.datetime.utcnow().strftime("%Y-%m-%dT%H:%MZ")
json.dump(out, open(OUT, "w"), separators=(",", ":"))
print("daily", len(new["fii"]["daily"]), "latest", new["fii"]["daily"][0])
