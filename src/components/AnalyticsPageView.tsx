import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/analytics';

const AnalyticsPageView = () => {
  const location = useLocation();

  useEffect(() => {
    void trackPageView(`${location.pathname}${location.search}${location.hash}`);
  }, [location.pathname, location.search, location.hash]);

  return null;
};

export default AnalyticsPageView;
