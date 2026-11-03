"""Builds public/data/screener.json: per-stock metrics for the screener presets, from free NSE
bhavcopy data (tejhq/indian-markets on Hugging Face). Same source and liquidity filter as
build-sector-data.py. End-of-day data only. Usage: python3 scripts/build-screener-data.py
(needs duckdb, pandas, numpy). No-op when the dataset has no newer trading day."""
import json, math, os, datetime as dt
import duckdb, numpy as np, pandas as pd

URL = "https://huggingface.co/datasets/tejhq/indian-markets/resolve/main/prices_adjusted/nse_2026.parquet"
OUT = "public/data/screener.json"
uni = json.load(open("src/data/nseUniverse.json"))["u"]
sector_of = {s: sec for s, _, sec in uni}
name_of = {s: n for s, n, _ in uni}

c = duckdb.connect(); c.execute("install httpfs; load httpfs")
df = c.execute(f"""select date, symbol, adj_close as close, turnover
                   from read_parquet('{URL}') where series='EQ' and adj_close>0""").df()
df = df[df.symbol.isin(sector_of)]
df["date"] = pd.to_datetime(df["date"])
close = df.pivot(index="date", columns="symbol", values="close").sort_index().ffill(limit=3)
turn = df.pivot(index="date", columns="symbol", values="turnover").sort_index()
asof = close.index[-1]
if os.path.exists(OUT):
    try:
        if json.load(open(OUT)).get("asOf") == str(asof.date()):
            print("No new trading day; leaving", OUT, "unchanged."); raise SystemExit(0)
    except (ValueError, OSError):
        pass
t20 = turn.rolling(20, min_periods=15).mean()
liquid = (t20.iloc[-1] > 2e7) & close.iloc[-64:].notna().all()
syms = [s for s in close.columns if liquid.get(s, False)]
cl = close[syms]
delta = cl.diff()
gain = delta.clip(lower=0).rolling(14).mean().iloc[-1]
loss = (-delta.clip(upper=0)).rolling(14).mean().iloc[-1]
rsi = 100 - 100 / (1 + gain / loss.replace(0, np.nan))
rsi = rsi.fillna(100)
sma50 = cl.rolling(50).mean().iloc[-1]
last = cl.iloc[-1]
hi = cl.max()
rows = []
for s in syms:
    rows.append({
        "s": s, "n": name_of[s], "sec": sector_of[s], "p": round(float(last[s]), 2),
        "r1": round(float(last[s] / cl[s].iloc[-2] - 1) * 100, 2),
        "r21": round(float(last[s] / cl[s].iloc[-22] - 1) * 100, 1),
        "r63": round(float(last[s] / cl[s].iloc[-64] - 1) * 100, 1),
        "hi": round(float(last[s] / hi[s] - 1) * 100, 1),
        "rsi": int(round(float(rsi[s]))),
        "ma50": round(float(last[s] / sma50[s] - 1) * 100, 1),
        "vx": round(float(turn[s].iloc[-1] / t20[s].iloc[-1]), 2),
        "tcr": round(float(t20[s].iloc[-1] / 1e7), 1),
    })
# JSON has no NaN: drop any stock with a missing metric rather than write invalid JSON.
rows = [r for r in rows if all(math.isfinite(v) for v in r.values() if isinstance(v, float))]
json.dump({"asOf": str(asof.date()), "generatedAt": dt.datetime.utcnow().isoformat() + "Z",
           "source": "NSE bhavcopy via tejhq/indian-markets (end of day)",
           "sessions": int(len(close)), "universe": len(rows), "rows": rows},
          open(OUT, "w"), separators=(",", ":"), allow_nan=False)
print("asof", asof.date(), "stocks", len(rows), "sessions", len(close))
