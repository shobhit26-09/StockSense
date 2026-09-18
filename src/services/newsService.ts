import { supabase } from '@/integrations/supabase/client';

export interface RealTimeNewsItem { id: string; title: string; description: string; url: string; source: string; publishedAt: string; sentiment: 'positive' | 'negative' | 'neutral'; sentimentScore: number; category: string; isBreaking?: boolean; imageUrl?: string; tweetUrl?: string; }

const sentimentFor = (text: string): RealTimeNewsItem['sentiment'] => {
  const value = text.toLowerCase();
  const positive = ['gain','rise','growth','surge','rally','profit','record','upgrade'].filter(w => value.includes(w)).length;
  const negative = ['fall','drop','loss','decline','slump','cut','downgrade','fraud'].filter(w => value.includes(w)).length;
  return positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral';
};

export class NewsService {
  private static instance: NewsService;
  private subscribers = new Set<(news: RealTimeNewsItem[]) => void>();
  private newsCache: RealTimeNewsItem[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastFetchTime = 0;
  static getInstance() { return NewsService.instance ||= new NewsService(); }

  private async fetchRealNews(symbol?: string): Promise<RealTimeNewsItem[]> {
    const { data, error } = await supabase.functions.invoke('fetch-market-data', { body: { type: 'news' } });
    if (error) throw error;
    const articles = Array.isArray(data?.articles) ? data.articles : [];
    const base = symbol?.replace(/\.(NS|BO)$/i, '').toLowerCase();
    return articles
      .filter((article: any) => !base || `${article.title} ${article.description}`.toLowerCase().includes(base) || articles.length <= 12)
      .map((article: any) => ({ ...article, description: article.description || '', sentiment: sentimentFor(`${article.title} ${article.description}`), sentimentScore: 0, category: 'Market', isBreaking: false }));
  }

  subscribe(callback: (news: RealTimeNewsItem[]) => void) { this.subscribers.add(callback); if (this.newsCache.length) callback([...this.newsCache]); return () => this.subscribers.delete(callback); }
  startRealTimeUpdates(symbol?: string, interval = 60000) { this.stopRealTimeUpdates(); void this.updateNews(symbol); this.intervalId = setInterval(() => void this.updateNews(symbol), Math.max(interval, 60000)); }
  stopRealTimeUpdates() { if (this.intervalId) clearInterval(this.intervalId); this.intervalId = null; }
  private async updateNews(symbol?: string) { if (Date.now() - this.lastFetchTime < 15000) return; this.lastFetchTime = Date.now(); try { const next = await this.fetchRealNews(symbol); if (next.length) { this.newsCache = next.slice(0, 20); this.subscribers.forEach(cb => cb([...this.newsCache])); } } catch (error) { console.error('[NewsService] Publisher feeds unavailable', error); } }
  async fetchLatestNews(symbol?: string) { try { const next = await this.fetchRealNews(symbol); if (next.length) this.newsCache = next.slice(0, 20); } catch (error) { console.error('[NewsService] Publisher feeds unavailable', error); } return [...this.newsCache]; }
  isApiKeyAvailable() { return true; }
}
export const newsService = NewsService.getInstance();
