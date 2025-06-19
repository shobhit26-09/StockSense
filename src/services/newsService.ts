export interface RealTimeNewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  category: string;
  isBreaking?: boolean;
  imageUrl?: string;
}

export class NewsService {
  private static instance: NewsService;
  private subscribers: Set<(news: RealTimeNewsItem[]) => void> = new Set();
  private newsCache: RealTimeNewsItem[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private lastFetchTime: number = 0;
  private newsCounter: number = 0;

  static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  private async fetchRealNews(symbol?: string): Promise<RealTimeNewsItem[]> {
    try {
      // Generate more realistic and frequent news updates
      return this.generateRealtimeNews(symbol);
    } catch (error) {
      console.error('Error fetching real news:', error);
      return this.generateRealtimeNews(symbol);
    }
  }

  private generateRealtimeNews(symbol?: string): RealTimeNewsItem[] {
    const currentTime = Date.now();
    this.newsCounter++;
    
    const templates = [
      {
        title: "BREAKING: Nifty 50 surges past 25,000 mark on strong FII inflows",
        description: "Indian benchmark index hits fresh record high as foreign institutional investors pour money into equities",
        category: "Market",
        sentiment: 'positive' as const,
        sentimentScore: 0.9,
        isBreaking: true
      },
      {
        title: "Bank Nifty rallies 2.5% on RBI's growth-supportive measures",
        description: "Banking stocks lead market gains after central bank announces liquidity support measures",
        category: "Banking",
        sentiment: 'positive' as const,
        sentimentScore: 0.8
      },
      {
        title: "IT sector gains momentum on favorable currency dynamics",
        description: "Technology stocks benefit from rupee depreciation and strong demand from US clients",
        category: "Technology",
        sentiment: 'positive' as const,
        sentimentScore: 0.75
      },
      {
        title: "Pharma stocks mixed after USFDA inspection updates",
        description: "Pharmaceutical companies show varied performance on regulatory developments",
        category: "Healthcare",
        sentiment: 'neutral' as const,
        sentimentScore: 0.1
      },
      {
        title: "Auto sector under pressure on rising commodity prices",
        description: "Automobile manufacturers face margin concerns due to increased input costs",
        category: "Automotive",
        sentiment: 'negative' as const,
        sentimentScore: -0.4
      },
      {
        title: "Energy stocks rally on crude oil price surge",
        description: "Oil and gas companies benefit from global crude price momentum",
        category: "Energy",
        sentiment: 'positive' as const,
        sentimentScore: 0.7
      },
      {
        title: "GDP growth projections raised by leading economists",
        description: "Economic experts revise India's growth forecast upward on strong fundamentals",
        category: "Economy",
        sentiment: 'positive' as const,
        sentimentScore: 0.85
      },
      {
        title: "FPIs turn net buyers after three months of selling",
        description: "Foreign portfolio investors show renewed interest in Indian markets",
        category: "Market",
        sentiment: 'positive' as const,
        sentimentScore: 0.8
      },
      {
        title: "Small-cap index outperforms benchmarks in today's session",
        description: "Mid and small-cap stocks show strong momentum amid broad-based buying",
        category: "Market",
        sentiment: 'positive' as const,
        sentimentScore: 0.7
      },
      {
        title: "Volatility expected ahead of monthly F&O expiry",
        description: "Market experts advise caution as futures and options contracts near expiration",
        category: "Market",
        sentiment: 'neutral' as const,
        sentimentScore: 0.0
      }
    ];

    const sources = [
      'Economic Times', 'Business Standard', 'Mint', 'Financial Express', 
      'MoneyControl', 'LiveMint', 'Bloomberg Quint', 'Reuters India',
      'CNBC TV18', 'Business Today', 'The Hindu BusinessLine'
    ];
    
    // Add symbol-specific news if provided
    if (symbol && this.newsCounter % 3 === 0) {
      const companyName = symbol.replace('.NS', '');
      templates.unshift({
        title: `${companyName} shares jump 4% on strong Q3 earnings beat`,
        description: `${companyName} reports better-than-expected quarterly results with improved margins`,
        category: "Earnings",
        sentiment: 'positive' as const,
        sentimentScore: 0.85,
        isBreaking: Math.random() > 0.7
      });
    }

    // Generate 4-6 news items with time variance
    const newsCount = 4 + Math.floor(Math.random() * 3);
    const selectedTemplates = templates
      .sort(() => Math.random() - 0.5)
      .slice(0, newsCount);

    return selectedTemplates.map((template, index) => {
      const minutesAgo = Math.floor(Math.random() * 30); // Last 30 minutes
      const publishTime = new Date(currentTime - minutesAgo * 60000);
      
      return {
        id: `news_${currentTime}_${this.newsCounter}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        title: template.title,
        description: template.description,
        url: `https://example.com/news/${currentTime}_${index}`,
        source: sources[Math.floor(Math.random() * sources.length)],
        publishedAt: publishTime.toISOString(),
        sentiment: template.sentiment,
        sentimentScore: template.sentimentScore + (Math.random() - 0.5) * 0.1,
        category: template.category,
        isBreaking: template.isBreaking || false,
        imageUrl: `https://source.unsplash.com/400x200/?stock,market,finance&${index}`
      };
    });
  }

  subscribe(callback: (news: RealTimeNewsItem[]) => void): () => void {
    console.log('News service: New subscriber added');
    this.subscribers.add(callback);
    
    if (this.newsCache.length > 0) {
      console.log('News service: Sending cached news to new subscriber');
      callback([...this.newsCache]);
    }

    return () => {
      console.log('News service: Subscriber removed');
      this.subscribers.delete(callback);
    };
  }

  startRealTimeUpdates(symbol?: string, interval: number = 20000): void {
    console.log('News service: Starting enhanced real-time updates with interval:', interval);
    this.stopRealTimeUpdates();
    
    // Initial update
    this.updateNews(symbol);
    
    // Set up interval for regular updates
    this.intervalId = setInterval(() => {
      console.log('News service: Real-time interval update triggered');
      this.updateNews(symbol);
    }, interval);
  }

  stopRealTimeUpdates(): void {
    if (this.intervalId) {
      console.log('News service: Stopping real-time updates');
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async updateNews(symbol?: string): Promise<void> {
    const now = Date.now();
    
    // Reduce rate limiting for more frequent updates
    if (now - this.lastFetchTime < 3000) {
      console.log('News service: Skipping update due to rate limiting');
      return;
    }
    
    this.lastFetchTime = now;
    console.log('News service: Updating news for symbol:', symbol);
    
    try {
      const newNews = await this.fetchRealNews(symbol);
      
      // Keep track of existing news to avoid duplicates
      const existingIds = new Set(this.newsCache.map(n => n.id));
      const uniqueNewNews = newNews.filter(n => !existingIds.has(n.id));
      
      if (uniqueNewNews.length > 0) {
        // Add new news to the beginning and keep most recent 20 items
        this.newsCache = [...uniqueNewNews, ...this.newsCache]
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
          .slice(0, 20);

        console.log('News service: Broadcasting', uniqueNewNews.length, 'new items to', this.subscribers.size, 'subscribers');
        this.subscribers.forEach(callback => callback([...this.newsCache]));
      }
    } catch (error) {
      console.error('Error updating news:', error);
    }
  }

  async fetchLatestNews(symbol?: string): Promise<RealTimeNewsItem[]> {
    console.log('News service: Manual fetch latest news for symbol:', symbol);
    const newNews = await this.fetchRealNews(symbol);
    this.newsCache = newNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    return [...this.newsCache];
  }

  isApiKeyAvailable(): boolean {
    return false; // Indicate we're using enhanced mock data
  }

  // New method to simulate breaking news
  simulateBreakingNews(symbol?: string): void {
    const breakingNews: RealTimeNewsItem = {
      id: `breaking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: "🚨 BREAKING: Market hits circuit breaker as buying frenzy continues",
      description: "Unprecedented buying activity triggers exchange safety measures",
      url: "https://example.com/breaking-news",
      source: "Market Watch",
      publishedAt: new Date().toISOString(),
      sentiment: 'positive',
      sentimentScore: 0.95,
      category: "Market",
      isBreaking: true
    };

    this.newsCache = [breakingNews, ...this.newsCache].slice(0, 20);
    this.subscribers.forEach(callback => callback([...this.newsCache]));
  }
}

export const newsService = NewsService.getInstance();
