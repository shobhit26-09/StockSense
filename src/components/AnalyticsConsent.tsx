import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAnalyticsConsent, setAnalyticsConsent } from '@/lib/analytics';

const AnalyticsConsent = () => {
  const [visible, setVisible] = useState(() => getAnalyticsConsent() === null);

  if (!visible) return null;

  const choose = (consent: 'granted' | 'denied') => {
    void setAnalyticsConsent(consent).then(() => {
      if (consent === 'granted') {
        window.gtag('event', 'page_view', {
          page_path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
          page_location: window.location.href,
          page_title: document.title,
        });
      }
    });
    setVisible(false);
  };

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-xl rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-xl" aria-label="Analytics choice">
      <p className="text-sm leading-relaxed text-card-foreground">
        StockSense uses Google Analytics to count visits and improve the site. Analytics stays off unless you allow it.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => choose('granted')} className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Allow analytics</button>
        <button onClick={() => choose('denied')} className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground">Not now</button>
        <Link to="/privacy" className="ml-auto text-xs text-muted-foreground underline underline-offset-4">Privacy</Link>
      </div>
    </aside>
  );
};

export default AnalyticsConsent;
