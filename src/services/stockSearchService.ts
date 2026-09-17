
// Comprehensive Indian stock list and search functionality
export interface StockInfo {
  symbol: string;
  name: string;
  exchange: string;
  sector?: string;
}

// Extended list of popular Indian stocks
const indianStocks: StockInfo[] = [
  // Nifty 50 stocks
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited', exchange: 'NSE', sector: 'Energy' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE', sector: 'IT' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', exchange: 'NSE', sector: 'Banking' },
  { symbol: 'INFY.NS', name: 'Infosys Limited', exchange: 'NSE', sector: 'IT' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Limited', exchange: 'NSE', sector: 'Banking' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', exchange: 'NSE', sector: 'Banking' },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Limited', exchange: 'NSE', sector: 'FMCG' },
  { symbol: 'LT.NS', name: 'Larsen & Toubro Limited', exchange: 'NSE', sector: 'Infrastructure' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', exchange: 'NSE', sector: 'Banking' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Limited', exchange: 'NSE', sector: 'Telecom' },
  { symbol: 'ITC.NS', name: 'ITC Limited', exchange: 'NSE', sector: 'FMCG' },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Limited', exchange: 'NSE', sector: 'Paints' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank Limited', exchange: 'NSE', sector: 'Banking' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India Limited', exchange: 'NSE', sector: 'Auto' },
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries', exchange: 'NSE', sector: 'Pharma' },
  { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement Limited', exchange: 'NSE', sector: 'Cement' },
  { symbol: 'TITAN.NS', name: 'Titan Company Limited', exchange: 'NSE', sector: 'Jewellery' },
  { symbol: 'NESTLEIND.NS', name: 'Nestle India Limited', exchange: 'NSE', sector: 'FMCG' },
  { symbol: 'NTPC.NS', name: 'NTPC Limited', exchange: 'NSE', sector: 'Power' },
  { symbol: 'POWERGRID.NS', name: 'Power Grid Corporation', exchange: 'NSE', sector: 'Power' },
  { symbol: 'TATASTEEL.NS', name: 'Tata Steel Limited', exchange: 'NSE', sector: 'Steel' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Limited', exchange: 'NSE', sector: 'NBFC' },
  { symbol: 'HCLTECH.NS', name: 'HCL Technologies Limited', exchange: 'NSE', sector: 'IT' },
  { symbol: 'WIPRO.NS', name: 'Wipro Limited', exchange: 'NSE', sector: 'IT' },
  { symbol: 'ONGC.NS', name: 'Oil & Natural Gas Corporation', exchange: 'NSE', sector: 'Oil & Gas' },
  { symbol: 'TECHM.NS', name: 'Tech Mahindra Limited', exchange: 'NSE', sector: 'IT' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Limited', exchange: 'NSE', sector: 'Auto' },
  { symbol: 'DRREDDY.NS', name: 'Dr Reddys Laboratories', exchange: 'NSE', sector: 'Pharma' },
  { symbol: 'JSWSTEEL.NS', name: 'JSW Steel Limited', exchange: 'NSE', sector: 'Steel' },
  { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank Limited', exchange: 'NSE', sector: 'Banking' },
  { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv Limited', exchange: 'NSE', sector: 'Financial Services' },
  { symbol: 'CIPLA.NS', name: 'Cipla Limited', exchange: 'NSE', sector: 'Pharma' },
  { symbol: 'COALINDIA.NS', name: 'Coal India Limited', exchange: 'NSE', sector: 'Mining' },
  { symbol: 'DIVISLAB.NS', name: 'Divis Laboratories Limited', exchange: 'NSE', sector: 'Pharma' },
  { symbol: 'EICHERMOT.NS', name: 'Eicher Motors Limited', exchange: 'NSE', sector: 'Auto' },
  { symbol: 'GRASIM.NS', name: 'Grasim Industries Limited', exchange: 'NSE', sector: 'Cement' },
  { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp Limited', exchange: 'NSE', sector: 'Auto' },
  { symbol: 'HINDALCO.NS', name: 'Hindalco Industries Limited', exchange: 'NSE', sector: 'Metals' },
  { symbol: 'BRITANNIA.NS', name: 'Britannia Industries Limited', exchange: 'NSE', sector: 'FMCG' },
  { symbol: 'BPCL.NS', name: 'Bharat Petroleum Corporation', exchange: 'NSE', sector: 'Oil & Gas' },
  { symbol: 'SHREECEM.NS', name: 'Shree Cement Limited', exchange: 'NSE', sector: 'Cement' },
  { symbol: 'APOLLOHOSP.NS', name: 'Apollo Hospitals Enterprise', exchange: 'NSE', sector: 'Healthcare' },

  // Additional popular stocks
  { symbol: 'ADANIPORTS.NS', name: 'Adani Ports and SEZ Limited', exchange: 'NSE', sector: 'Infrastructure' },
  { symbol: 'ADANIENT.NS', name: 'Adani Enterprises Limited', exchange: 'NSE', sector: 'Infrastructure' },
  { symbol: 'GODREJCP.NS', name: 'Godrej Consumer Products', exchange: 'NSE', sector: 'FMCG' },
  { symbol: 'PIDILITIND.NS', name: 'Pidilite Industries Limited', exchange: 'NSE', sector: 'Chemicals' },
  { symbol: 'DABUR.NS', name: 'Dabur India Limited', exchange: 'NSE', sector: 'FMCG' },
  { symbol: 'MARICO.NS', name: 'Marico Limited', exchange: 'NSE', sector: 'FMCG' },
  { symbol: 'COLPAL.NS', name: 'Colgate Palmolive India', exchange: 'NSE', sector: 'FMCG' },
  { symbol: 'BERGEPAINT.NS', name: 'Berger Paints India Limited', exchange: 'NSE', sector: 'Paints' },
  { symbol: 'PAGEIND.NS', name: 'Page Industries Limited', exchange: 'NSE', sector: 'Textiles' },
  { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto Limited', exchange: 'NSE', sector: 'Auto' },
  { symbol: 'TVSMOTOR.NS', name: 'TVS Motor Company Limited', exchange: 'NSE', sector: 'Auto' },
  { symbol: 'MOTHERSON.NS', name: 'Motherson Sumi Systems', exchange: 'NSE', sector: 'Auto Components' },
  { symbol: 'BOSCHLTD.NS', name: 'Bosch Limited', exchange: 'NSE', sector: 'Auto Components' },
  { symbol: 'MINDTREE.NS', name: 'Mindtree Limited', exchange: 'NSE', sector: 'IT' },
  { symbol: 'MPHASIS.NS', name: 'Mphasis Limited', exchange: 'NSE', sector: 'IT' },
  { symbol: 'LTI.NS', name: 'L&T Infotech Limited', exchange: 'NSE', sector: 'IT' },
  { symbol: 'PERSISTENT.NS', name: 'Persistent Systems Limited', exchange: 'NSE', sector: 'IT' },
  { symbol: 'BIOCON.NS', name: 'Biocon Limited', exchange: 'NSE', sector: 'Biotech' },
  { symbol: 'LUPIN.NS', name: 'Lupin Limited', exchange: 'NSE', sector: 'Pharma' },
  { symbol: 'TORNTPHARM.NS', name: 'Torrent Pharmaceuticals', exchange: 'NSE', sector: 'Pharma' },
  { symbol: 'AUBANK.NS', name: 'AU Small Finance Bank', exchange: 'NSE', sector: 'Banking' },
  { symbol: 'BANDHANBNK.NS', name: 'Bandhan Bank Limited', exchange: 'NSE', sector: 'Banking' },
  { symbol: 'FEDERALBNK.NS', name: 'Federal Bank Limited', exchange: 'NSE', sector: 'Banking' },
  { symbol: 'PNB.NS', name: 'Punjab National Bank', exchange: 'NSE', sector: 'Banking' },
  { symbol: 'CANBK.NS', name: 'Canara Bank', exchange: 'NSE', sector: 'Banking' },
  { symbol: 'BANKBARODA.NS', name: 'Bank of Baroda', exchange: 'NSE', sector: 'Banking' },
  { symbol: 'IDEA.NS', name: 'Vodafone Idea Limited', exchange: 'NSE', sector: 'Telecom' },
  { symbol: 'SAIL.NS', name: 'Steel Authority of India', exchange: 'NSE', sector: 'Steel' },
  { symbol: 'NMDC.NS', name: 'NMDC Limited', exchange: 'NSE', sector: 'Mining' },
  { symbol: 'VEDL.NS', name: 'Vedanta Limited', exchange: 'NSE', sector: 'Metals' },
  { symbol: 'NATIONALUM.NS', name: 'National Aluminium Company', exchange: 'NSE', sector: 'Metals' },
  { symbol: 'JINDALSTEL.NS', name: 'Jindal Steel & Power', exchange: 'NSE', sector: 'Steel' },
  { symbol: 'ZEEL.NS', name: 'Zee Entertainment Enterprises', exchange: 'NSE', sector: 'Media' },
  { symbol: 'STAR.NS', name: 'Sterlite Technologies', exchange: 'NSE', sector: 'Technology' },
  { symbol: 'IRCTC.NS', name: 'Indian Railway Catering', exchange: 'NSE', sector: 'Services' },
  { symbol: 'NAUKRI.NS', name: 'Info Edge India Limited', exchange: 'NSE', sector: 'Internet' },
  { symbol: 'ZOMATO.NS', name: 'Zomato Limited', exchange: 'NSE', sector: 'Internet' },
  { symbol: 'PAYTM.NS', name: 'One 97 Communications Limited', exchange: 'NSE', sector: 'Fintech' },
];

export const searchStocks = (query: string, limit: number = 10): StockInfo[] => {
  if (!query.trim()) {
    return indianStocks.slice(0, limit);
  }

  const searchTerm = query.toLowerCase().trim();
  
  // Search by symbol, name, and sector
  const filtered = indianStocks.filter(stock => {
    const symbolMatch = stock.symbol.toLowerCase().includes(searchTerm);
    const nameMatch = stock.name.toLowerCase().includes(searchTerm);
    const sectorMatch = stock.sector?.toLowerCase().includes(searchTerm);
    
    return symbolMatch || nameMatch || sectorMatch;
  });

  // Sort by relevance - exact symbol matches first, then name matches
  return filtered.sort((a, b) => {
    const aSymbolExact = a.symbol.toLowerCase().startsWith(searchTerm);
    const bSymbolExact = b.symbol.toLowerCase().startsWith(searchTerm);
    
    if (aSymbolExact && !bSymbolExact) return -1;
    if (!aSymbolExact && bSymbolExact) return 1;
    
    const aNameExact = a.name.toLowerCase().startsWith(searchTerm);
    const bNameExact = b.name.toLowerCase().startsWith(searchTerm);
    
    if (aNameExact && !bNameExact) return -1;
    if (!aNameExact && bNameExact) return 1;
    
    return a.name.localeCompare(b.name);
  }).slice(0, limit);
};

export const getPopularStocks = (): StockInfo[] => {
  return indianStocks.slice(0, 15);
};

export const getStocksByCategory = (category: string): StockInfo[] => {
  return indianStocks.filter(stock => 
    stock.sector?.toLowerCase() === category.toLowerCase()
  );
};
