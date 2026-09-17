import { useState, useEffect, useMemo, useCallback } from 'react';
import { ExternalLink, Clock, RefreshCw } from 'lucide-react';
import { newsService, RealTimeNewsItem } from '@/services/newsService';

interface NewsFeedProps {
  symbol?: string;
}

const NewsFeed = ({ symbol }: NewsFeedProps) => {
  const [news, setNews] = useState<RealTimeNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = newsService.subscribe((newsData) => {
      setNews(newsData.slice(0, 6));
      setLoading(false);
    });

    newsService.startRealTimeUpdates(symbol, 60000);
    
    newsService.fetchLatestNews(symbol).then((initialNews) => {
      setNews(initialNews.slice(0, 6));
      setLoading(false);
    });

    return () => {
      unsubscribe();
      newsService.stopRealTimeUpdates();
    };
  }, [symbol]);

  const refreshNews = useCallback(async () => {
    setLoading(true);
    try {
      const latestNews = await newsService.fetchLatestNews(symbol);
      setNews(latestNews.slice(0, 6));
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  const formatTime = useMemo(() => (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }, []);

  if (loading && news.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-24 bg-muted/30 rounded animate-pulse" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="py-3 border-b border-border/50">
            <div className="h-4 w-full bg-muted/30 rounded mb-2 animate-pulse" />
            <div className="h-3 w-20 bg-muted/30 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Market News
        </h3>
        <button 
          onClick={refreshNews}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="space-y-0">
        {news.map((article, index) => (
          <a
            key={article.id || index}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block py-3 border-b border-border/30 last:border-0 group"
          >
            <h4 className="text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1.5 leading-snug">
              {article.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span className="font-mono">{formatTime(article.publishedAt)}</span>
              <span>•</span>
              <span className="truncate">{article.source}</span>
              <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default NewsFeed;
