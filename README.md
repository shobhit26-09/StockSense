# 🧠 StockSense

**One‑stop solution for smarter stock analysis. Tailored for Indian equity markets and enhanced with AI-powered insights.**

---

## 🚀 Table of Contents

- [Overview](#overview)  
- [🎯 Key Features](#key-features)  
- [⚙️ Tech Stack](#tech-stack)  
- [📐 Architecture & Flow](#architecture--flow)  
- [💾 Installation & Setup](#installation--setup)  
- [🔐 Environment & Secrets](#environment--secrets)  
- [🧪 Usage](#usage)  
- [📈 Screenshots](#screenshots)  
- [📊 Live Demo](#live-demo)  
- [🛠️ Future Roadmap](#future-roadmap)  
- [🙋 Contributing](#contributing)  
- [📄 License](#license)  
- [✉️ Contact](#contact)  

---

## Overview

StockSense empowers investors with deep insight into Indian stocks through:

- **Historical & real-time data** for NSE/ BSE tickers.  
- **Financial, technical & AI-driven** analysis modules.  
- **Live market indices** including Nifty, BankNifty, Sensex.  
- **Customizable watchlists** with persistent tracking.  
- **Real-time news** sentiment analysis.

Crafted with a sleek, Apple-style UI and seamless dark/light themes.

---

## 🎯 Key Features

| Feature                    | Description |
|---------------------------|-------------|
| **🔍 Stock Search**        | Query any NSE/BSE symbol for in-depth analysis. |
| **📊 Charts**              | Candlestick & line visuals with interactive controls. |
| **💰 Fundamentals**        | Key metrics—P/E, ROE, market cap, margins, more. |
| **📈 Technical Analysis**  | Includes indicators like RSI, MACD, moving averages. |
| **🤖 AI Analysis**         | Gemini-powered strengths, risks, price targets, JSON format. |
| **🎯 Price Forecast**      | Future price predictions via proprietary model. |
| **📋 Watchlist**           | Store & review manually curated equity lists. |
| **📰 News Feed**           | Live news, categories, sentiment, with time tags. |
| **⏱️ Live Market Clock**   | Displays trading hours, dynamically. |
| **🌗 Dark & Light Theme**  | Switch with a smooth, animated toggle. |
| **🖥️ Responsive UI**       | Optimized for desktop browsers. |

---

## ⚙️ Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Recharts  
- **State Management**: React Context, Hooks  
- **Icons**: Heroicons, Lucide  
- **AI Integration**: Gemini via serverless API  
- **Live Data**: YahooFinance + proxy fetcher  
- **Persistence**: `localStorage` for watchlist  
- **Deployment**: Vercel / Netlify (front-end), API key hidden via `.env.local`

---

## 📐 Architecture & Flow

```
[User UI] → [Stock Search]   
    ↳ call `/api/stock/:symbol` → Yarn fetch from YahooFinance  
    ↳ Updates React state → Renders components: StockChart, Fundamentals, Technical, AI, Prediction  
  
[AI Analysis] → prompt-built JSON → fetched via Gemini API (server-side)  
  
[NewsFeed] → subscribed to `/api/news?symbol=...` service, refreshed every 30s  
[Watchlist] → Persisted in localStorage + toast notifications  
[Live Indices] → Auto-updates every 30s during market hours
```

---

## 💾 Installation & Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/shobhit26-09/StockSense.git
   cd StockSense
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env.local`**
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the dev server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

Your app runs at [http://localhost:3000](http://localhost:3000).

---

## 🔐 Environment & Secrets

- All sensitive keys (like Gemini API) should be added to `.env.local` and **never** committed.
- Example entry:
  ```
  NEXT_PUBLIC_GEMINI_API_KEY=YOUR_KEY_HERE
  ```
- CI/CD pipelines (Netlify, Vercel) should add the variable via their settings UI.

---

## 🧪 Usage

1. Search for a stock symbol (e.g. `RELIANCE.NS`).  
2. View full Dashboard with charts, financials, technical indicators, AI insights, and forecasts.  
3. Add to the Watchlist to track performance.  
4. Use the “Theme Toggle” in Navbar to switch between light/dark.  
5. Monitor live news and watchlist metrics in real-time.

---

## 📈 Screenshots

![Hero section with AI analysis](./screenshots/hero.png)  
![Watchlist & Market Indices](./screenshots/indices-watchlist.png)  
![AI Analysis Module](./screenshots/ai-analysis.png)  
*Ensure `.png` files are placed under `screenshots/` directory*

---

## 📊 Live Demo

> 🔗 Coming soon — deployed version via Netlify or Vercel

---

## 🛠️ Future Roadmap

- ✅ Gemini **AI Analysis** module rollout  
- 🔜 Save user preferences (theme, default indices)  
- 🔜 Add **alert triggers** & **price notifications**  
- 🔜 Extend **multi-symbol dashboard views**  
- 🔜 Introduce **auth & profile management**  
- 🔜 Explore **mobile-responsive layout**

---

## 🙋 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository  
2. **Create a branch** for your feature: `git checkout -b feature/YourFeature`  
3. **Commit changes**, push, and open a **Pull Request**  
4. We’ll review and merge once the PR is approved!

---

## 📄 License

Released under the **MIT License** — see [LICENSE](LICENSE) for details.

---

## ✉️ Contact

- **Maintainer**: Shobhit — [shobhit26-09@github.com](mailto:shobhit26-09@github.com)  
- **Project repo**: https://github.com/shobhit26-09/StockSense

---

*Built with ❤️ and JavaScript / React.*

