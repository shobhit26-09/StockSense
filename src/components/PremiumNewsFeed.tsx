import { useState, useEffect, useMemo, useCallback } from 'react';
import { ExternalLink, Clock, RefreshCw, Newspaper, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { newsService, RealTimeNewsItem } from '@/services/newsService';

interface PremiumNewsFeedProps {
  symbol?: string;
}


const SourceLogo = ({ url, source }: { url?: string; source?: string }) => {
  const [failed, setFailed] = useState(false);
  let host = '';
  try { host = url ? new URL(url).hostname.replace(/^www\./, '') : ''; } catch { host = ''; }
  if (!host || failed) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-[10px] font-semibold text-muted-foreground">
        {(source || '?').slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-white">
      <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-5 w-5" onError={() => setFailed(true)} />
    </span>
  );
};

const PremiumNewsFeed = ({ symbol }: PremiumNewsFeedProps) => {
  const [news, setNews] = useState<RealTimeNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = newsService.subscribe((newsData) => {
      setNews(newsData.slice(0, 8));
      setLoading(false);
    });
    newsService.startRealTimeUpdates(symbol, 120000);
    newsService.fetchLatestNews(symbol).then((initialNews) => {
      setNews(initialNews.slice(0, 8));
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
      setNews(latestNews.slice(0, 8));
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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }, []);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-3 h-3 text-success flex-shrink-0" />;
      case 'negative': return <TrendingDown className="w-3 h-3 text-destructive flex-shrink-0" />;
      default: return <Minus className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />;
    }
  };

  if (loading && news.length === 0) {
    return (
      <div className="premium-card p-5 h-full">
        <div className="flex items-center gap-3 mb-5">
          <Newspaper className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Market News</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="py-2 border-b border-border/30">
              <div className="h-4 w-full bg-muted/20 rounded mb-2 animate-pulse" />
              <div className="h-3 w-2/3 bg-muted/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="premium-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Market News</h3>
        </div>
        <button
          onClick={refreshNews}
          disabled={loading}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="divide-y divide-border/30">
          {news.slice(0, 7).map((article, index) => (
            <a
              key={article.id || index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 py-3 group hover:bg-muted/20 -mx-2 px-2 rounded-lg transition-colors"
            >
              <SourceLogo url={article.url} source={article.source} />
              <div className="flex-1 min-w-0">
                <h4 className="text-[13px] text-foreground/90 group-hover:text-primary transition-colors line-clamp-2 mb-1 leading-relaxed font-medium">
                  {article.title}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="font-medium truncate max-w-[120px]">{article.source}</span>
                  <span className="opacity-80">{getSentimentIcon(article.sentiment)}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatTime(article.publishedAt)}
                  </span>
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PremiumNewsFeed;
