import { MARKET_CONSTITUENTS } from '@/data/marketConstituents';

export const SITE_URL = 'https://stocksensee.netlify.app';

export interface SeoRoute {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  changefreq: 'hourly' | 'daily' | 'weekly' | 'monthly';
  priority: string;
}

export const SEO_ROUTES: SeoRoute[] = [
  {
    path: '/',
    title: 'StockSense — Indian Stock Market Dashboard for NSE & BSE',
    description:
      'StockSense is a free Indian stock market dashboard: live NIFTY and Sensex charts, market movers, sector flows, FII/DII data, sentiment and news for NSE and BSE stocks.',
    h1: 'StockSense: Indian stock market dashboard for NSE and BSE',
    intro:
      'Track NIFTY, Sensex and Bank NIFTY, see the biggest gainers, losers and volume shockers, compare sectors, follow FII and DII flows and read market news in one clear view.',
    changefreq: 'daily',
    priority: '1.0',
  },
  {
    path: '/sectors',
    title: 'NSE Sector Performance & Money Flow — StockSense',
    description:
      'Compare 20 NSE sectors by 1 day to 6 month returns, estimated money flow, relative strength and the share of stocks above their 50-day average.',
    h1: 'NSE sector performance and money flow',
    intro:
      'Ranked inflow and outflow estimates for 20 Indian market sectors, with return heat columns, relative strength against the market and a drill-down into each sector.',
    changefreq: 'daily',
    priority: '0.8',
  },
  {
    path: '/fii-dii',
    title: 'FII DII Data Today: Daily, Monthly & Yearly Activity — StockSense',
    description:
      'FII and DII buying and selling in the Indian cash market. Daily, monthly and yearly net figures, with history back to 2008.',
    h1: 'FII and DII activity in Indian equities',
    intro:
      'A simple table of foreign and domestic institutional investor flows with daily, monthly and yearly views and the data source credited.',
    changefreq: 'daily',
    priority: '0.8',
  },
  {
    path: '/heatmap',
    title: 'Indian Stock Market Heatmap — StockSense',
    description:
      'Colour-coded heatmap of NSE heavyweights and sectors. See at a glance which Indian stocks and indices are up or down today.',
    h1: 'Indian stock market heatmap',
    intro: 'A treemap of the biggest NSE stocks sized by weight and coloured by the day move.',
    changefreq: 'daily',
    priority: '0.8',
  },
  {
    path: '/agent',
    title: 'Stock Signals & Trade Ideas for NSE — StockSense',
    description:
      'Rule-based, explainable stock signals for NSE stocks: trend, momentum and risk levels with the reasoning shown, not a black box.',
    h1: 'Explainable stock signals for NSE stocks',
    intro: 'Pick a stock to see trend, momentum and risk levels derived from price history, with every rule visible.',
    changefreq: 'daily',
    priority: '0.7',
  },
  {
    path: '/macro',
    title: 'Global Markets & Macro News Map — StockSense',
    description:
      'World map of global indices and macro headlines, coloured by the day move. See how global markets could affect Indian stocks.',
    h1: 'Global markets and macro headlines',
    intro: 'A world map of major indices and macro news that can move the Indian market.',
    changefreq: 'daily',
    priority: '0.7',
  },
  {
    path: '/news',
    title: 'Indian Stock Market News — StockSense',
    description:
      'Latest Indian stock market and business headlines from public news feeds, in one place with source links.',
    h1: 'Indian stock market news',
    intro: 'Headlines about Indian markets, companies and the economy, each linked to its original publisher.',
    changefreq: 'hourly',
    priority: '0.7',
  },
  {
    path: '/about',
    title: 'About StockSense — Indian Stock Market Dashboard',
    description:
      'What StockSense is and where its data comes from. A free, independent dashboard for NSE and BSE markets.',
    h1: 'About StockSense',
    intro: 'A free dashboard for Indian stock markets, built as an independent open project. Data comes from free public feeds.',
    changefreq: 'monthly',
    priority: '0.5',
  },
  {
    path: '/terms',
    title: 'Terms of Use — StockSense',
    description: 'Terms for using StockSense: data accuracy, acceptable use and availability.',
    h1: 'Terms of use',
    intro: 'The terms for using StockSense: data accuracy, acceptable use and availability.',
    changefreq: 'monthly',
    priority: '0.3',
  },
  {
    path: '/contact',
    title: 'Contact StockSense',
    description: 'How to report a bug, a data error, a privacy request or give feedback on StockSense.',
    h1: 'Contact StockSense',
    intro: 'Report a bug, a wrong figure or a privacy request on the project GitHub issue tracker.',
    changefreq: 'monthly',
    priority: '0.3',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy — StockSense',
    description: 'How StockSense handles analytics consent, sign-in data and browser storage.',
    h1: 'Privacy policy',
    intro: 'What StockSense stores, what analytics it uses and how you can opt out.',
    changefreq: 'monthly',
    priority: '0.3',
  },
];

export const stockPath = (symbol: string) => `/stock/${encodeURIComponent(symbol)}.NS`;

export const STOCK_ROUTES: SeoRoute[] = MARKET_CONSTITUENTS.map((s) => ({
  path: stockPath(s.symbol),
  title: `${s.name} (${s.symbol}) Share Price & Analysis — StockSense`,
  description: `Live price, chart, technical signals and fundamentals for ${s.name} (${s.symbol}) on NSE, with sector context from StockSense.`,
  h1: `${s.name} (${s.symbol}) share price and analysis`,
  intro: `${s.name} trades on NSE as ${s.symbol} and is part of the NIFTY 50 group of large companies in the ${s.sector} sector. Open the page for the live price, chart and technical signals.`,
  changefreq: 'daily',
  priority: '0.6',
}));

export const ALL_SEO_ROUTES = [...SEO_ROUTES, ...STOCK_ROUTES];
