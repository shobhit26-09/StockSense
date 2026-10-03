"""Builds public/data/fii-dii.json from official NSE sources (free, no key):
 - cash market FII/FPI and DII net: NSE fiidiiTradeReact (latest day only; history accumulates run by run)
 - FII derivatives (index futures/options, stock futures/options): NSE archives fii_stats_DD-Mon-YYYY.xls (dated, backfilled)
No-op safe: network failures keep the existing file; nothing is rewritten unless data changed.
Usage: python3 scripts/build-fii-dii.py   (needs pandas, xlrd)"""
import json, os, sys, datetime as dt, urllib.request, urllib.error, http.cookiejar, io
import pandas as pd

OUT = "public/data/fii-dii.json"
KEEP_DAYS = 120
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
jar = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
op.addheaders = [("User-Agent", UA), ("Referer", "https://www.nseindia.com/reports/fii-dii")]

def iso(s): return dt.datetime.strptime(s, "%d-%b-%Y").date().isoformat()

def fetch_cash():
    try:
        try: op.open("https://www.nseindia.com/", timeout=20).read()
        except Exception: pass
        rows = json.load(op.open("https://www.nseindia.com/api/fiidiiTradeReact", timeout=20))
        out = {"d": iso(rows[0]["date"])}
        for r in rows:
            k = "fii" if r["category"].upper().startswith("FII") else "dii" if r["category"].upper().startswith("DII") else None
            if k:
                out[k + "Cash"] = round(float(r["netValue"]), 2)
                out[k + "CashBuy"] = round(float(r["buyValue"]), 2)
                out[k + "CashSell"] = round(float(r["sellValue"]), 2)
        return out if "fiiCash" in out and "diiCash" in out else None
    except Exception as e:
        print("cash fetch failed:", e); return None

def fetch_deriv(day):
    """Returns (dict|None, status) where status is 'ok', 'missing' (404: holiday/not yet published) or 'error'."""
    url = f"https://nsearchives.nseindia.com/content/fo/fii_stats_{day.strftime('%d-%b-%Y')}.xls"
    try:
        raw = op.open(url, timeout=25).read()
    except urllib.error.HTTPError as e:
        return None, ("missing" if e.code in (403, 404) else "error")
    except Exception:
        return None, "error"
    try:
        df = pd.read_excel(io.BytesIO(raw), header=None)
        lab = df[0].astype(str).str.strip().str.upper()
        def net(name):
            r = df[lab == name].iloc[0]
            return round(float(r[2]) - float(r[4]), 2)  # buy amt - sell amt, Rs crore
        return {"d": day.isoformat(), "idxFut": net("INDEX FUTURES"), "idxOpt": net("INDEX OPTIONS"),
                "stkFut": net("STOCK FUTURES"), "stkOpt": net("STOCK OPTIONS")}, "ok"
    except Exception as e:
        print("parse failed", day, e); return None, "error"

prev = {"days": [], "noData": []}
if os.path.exists(OUT):
    try: prev = json.load(open(OUT))
    except Exception: pass
days = {r["d"]: r for r in prev.get("days", [])}
nodata = set(prev.get("noData", []))
today = dt.date.today()

c = fetch_cash()
if c: days.setdefault(c["d"], {"d": c["d"]}).update(c)

for i in range(0, 75):
    d = today - dt.timedelta(days=i)
    if d.weekday() >= 5 or (today - d).days > KEEP_DAYS: continue
    k = d.isoformat()
    if "idxFut" in days.get(k, {}): continue
    if k in nodata and i > 2: continue  # settled holidays are not retried; the last 3 days are (late publication)
    r, st = fetch_deriv(d)
    if st == "ok": days.setdefault(k, {"d": k}).update(r); nodata.discard(k)
    elif st == "missing": nodata.add(k)

cut = (today - dt.timedelta(days=KEEP_DAYS)).isoformat()
rows = [days[k] for k in sorted(days) if k >= cut]
out = {"source": "NSE (fiidiiTradeReact for cash; archives fii_stats for derivatives)", "unit": "Rs crore, net buy/(sell)",
       "days": rows, "noData": sorted(k for k in nodata if k >= cut)}
if out["days"] == prev.get("days") and out["noData"] == prev.get("noData"):
    print("No change."); sys.exit(0)
out["updatedAt"] = dt.datetime.utcnow().strftime("%Y-%m-%dT%H:%MZ")
json.dump(out, open(OUT, "w"), separators=(",", ":"))
print("days", len(rows), "latest", rows[-1] if rows else None)
