# Project Memory

## Core
StockFlow Markets · India: real-time Indian market dashboard, modern fintech aesthetic (Robinhood/Groww-style).
Surfaces: soft dark `--background 222 18% 6%`, flat cards, single border, radius 0.875rem. Primary emerald `152 64% 48%`.
Forbidden: heavy gradients, glassmorphism, neon glows, 3D, Dhan API, hover-scale animations, mock/fake data.
Tech: Supabase Edge proxy (fetch-market-data, smart-trade-agent), NSE cookie warming, Yahoo Finance, IST session logic, 10-15s refresh on key tiles.

## Memories
- [Search Functionality](mem://features/search-functionality) — Auto .NS/.BO ticker resolution
- [Ticker Tape](mem://features/real-time-ticker-tape) — Infinite loop strip
- [ML Price Prediction](mem://features/ml-price-prediction) — Linear/Poly/ARIMA/Ensemble
- [Fundamental Data](mem://technical/fundamental-data-sourcing) — Yahoo with real vs estimated flags
- [Stock Logos](mem://features/stock-branding-and-logos) — FMP API + initials fallback
- [Market Session Logic](mem://features/market-session-logic) — IST pre/live/post/closed
- [Data Fetching Resilience](mem://technical/data-fetching-resilience) — TTL cache + AbortSignal
- [Data Fetching Strategy](mem://technical/data-fetching-strategy) — Supabase proxy + CORS + fallback
- [Market News](mem://features/market-news-integration) — Indian RSS with sentiment
- [Design System](mem://style/design-system-aesthetic) — Modern fintech minimal, flat cards
- [Smart Trade Agent](mem://features/smart-trade-agent) — Session-aware briefing, FII/DII, breadth, swing ideas
- [Options Insights](mem://features/options-insights) — NIFTY/BNF/FIN PCR, max pain, OI walls
- [Sector Rotation](mem://features/sector-rotation) — 1D/1W/1M perf + RS vs NIFTY
- [Bulk/Block Deals](mem://features/bulk-block-deals) — NSE large-deal snapshot

## Current Design Override
- iOS 26 Spatial Dashboard: Graphite Glass palette, Urbanist headings, Epilogue body, split-screen composition. This supersedes the prior no-glass terminal restriction.
