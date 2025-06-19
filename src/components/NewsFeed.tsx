import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Newspaper, Clock, ExternalLink, TrendingUp, TrendingDown, RefreshCw, Play, Pause, Zap } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { newsService, RealTimeNewsItem } from '@/services/newsService';

interface NewsFeedProps {
  symbol?: string;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ symbol }) => {
  const [news, setNews] = useState<RealTimeNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    if (isRealTimeEnabled) {
      setIsLoading(true);
      const unsubscribe = newsService.subscribe((newsData) => {
        setNews(newsData);
        setIsLoading(false);
      });

      newsService.startRealTimeUpdates(symbol, 30000);
      newsService.fetchLatestNews(symbol).then((initialNews) => {
        setNews(initialNews);
        setIsLoading(false);
      });

      return () => {
        unsubscribe();
        newsService.stopRealTimeUpdates();
      };
    } else {
      newsService.stopRealTimeUpdates();
      setIsLoading(false);
    }
  }, [symbol, isRealTimeEnabled]);

  const refreshNews = async () => {
    setIsLoading(true);
    try {
      const latestNews = await newsService.fetchLatestNews(symbol);
      setNews(latestNews);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRealTime = () => {
    setIsRealTimeEnabled(!isRealTimeEnabled);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-3 w-3" />;
      case 'negative':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Market': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
      'Technology': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
      'Banking': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
      'Energy': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
      'Healthcare': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700',
      'Economy': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700',
      'Earnings': 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700',
      'Automotive': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-600';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Card className={`${
      isDark 
        ? 'bg-gray-900/70 border-gray-700/50 backdrop-blur-xl' 
        : 'bg-white/90 border-gray-200/50 backdrop-blur-xl shadow-xl'
    } h-[700px] flex flex-col`}>
      <CardHeader className="pb-4 sticky top-0 z-10 bg-opacity-70 backdrop-blur-xl rounded-t-2xl">
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-3 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
              <Newspaper className="h-6 w-6 text-white" />
            </div>
            Market News
            {isRealTimeEnabled && (
              <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 font-semibold animate-pulse">
                <Zap className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
            )}
            {!newsService.isApiKeyAvailable() && (
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700 font-semibold">
                DEMO
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-3">
            <Button
              onClick={refreshNews}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className={`hover:scale-105 ${isDark ? 'border-gray-600 hover:border-gray-400 hover:bg-gray-800' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={toggleRealTime}
              size="sm"
              className={`transition-all hover:scale-105 ${
                isRealTimeEnabled
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'
                  : 'bg-transparent border dark:border-gray-600 border-gray-300 text-gray-700 dark:text-gray-200'
              }`}
            >
              {isRealTimeEnabled ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-6">
        {isLoading ? (
          <div className={`text-center py-16 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <div className={`p-6 rounded-2xl ${
              isDark ? 'bg-gradient-to-br from-gray-800 to-gray-700' : 'bg-gradient-to-br from-gray-100 to-gray-200'
            } w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg`}>
              <RefreshCw className="h-12 w-12 text-gray-400 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Loading news...</h3>
            <p className="text-base opacity-80">Fetching latest market updates</p>
          </div>
        ) : news.length === 0 ? (
          <div className={`text-center py-16 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <div className={`p-6 rounded-2xl ${
              isDark ? 'bg-gradient-to-br from-gray-800 to-gray-700' : 'bg-gradient-to-br from-gray-100 to-gray-200'
            } w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg`}>
              <Newspaper className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">No news available</h3>
            <p className="text-base opacity-80">Latest market news will appear here</p>
          </div>
        ) : (
          <div className="space-y-6 h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
            {news.map((item) => (
              <div
                key={item.id}
                onClick={() => window.open(item.url, '_blank')}
                className={`group p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:scale-[1.015] cursor-pointer ${
                  isDark ? 'bg-gray-800/60 border-gray-600 hover:border-gray-500' : 'bg-white/80 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline" className={`text-xs font-medium ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </Badge>
                    <Badge variant="outline" className={`text-xs font-medium ${getSentimentColor(item.sentiment)}`}>
                      {getSentimentIcon(item.sentiment)}
                      <span className="ml-1 capitalize">{item.sentiment}</span>
                    </Badge>
                  </div>

                  <h3 className={`font-semibold text-base leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {item.title}
                  </h3>

                  <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between text-xs mt-2">
                    <div className="flex items-center gap-3">
                      <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>
                        {item.source}
                      </span>
                      <span className="text-gray-400">•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatTimeAgo(item.publishedAt)}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-transform transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsFeed;
