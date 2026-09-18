// Deprecated compatibility shim. Live news now comes from publisher RSS feeds
// through newsService and the server-side market-data function.
export const twitterService = {
  analyzeNewsSentiment: () => 'neutral' as const,
  fetchLatestTwitterNews: async () => [],
};
