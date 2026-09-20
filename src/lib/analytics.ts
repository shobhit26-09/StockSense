const MEASUREMENT_ID = 'G-DRTB1N3REC';
const CONSENT_KEY = 'stocksense-analytics-consent';
const GTAG_SCRIPT_ID = 'stocksense-gtag';

type AnalyticsConsent = 'granted' | 'denied';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let configured = false;
let loading: Promise<void> | null = null;

export function getAnalyticsConsent(): AnalyticsConsent | null {
  const value = window.localStorage.getItem(CONSENT_KEY);
  return value === 'granted' || value === 'denied' ? value : null;
}

function loadAnalytics() {
  if (configured) return Promise.resolve();
  if (loading) return loading;

  loading = new Promise<void>((resolve, reject) => {
    const configure = () => {
      if (!configured) {
        window.gtag('js', new Date());
        window.gtag('config', MEASUREMENT_ID, {
          anonymize_ip: true,
          send_page_view: false,
        });
        configured = true;
      }
      resolve();
    };

    const existing = document.getElementById(GTAG_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === 'true') configure();
      else {
        existing.addEventListener('load', configure, { once: true });
        existing.addEventListener('error', () => reject(new Error('Failed to load Google Analytics')), { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = GTAG_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      configure();
    }, { once: true });
    script.addEventListener('error', () => reject(new Error('Failed to load Google Analytics')), { once: true });
    document.head.appendChild(script);
  });

  return loading;
}

export function setAnalyticsConsent(consent: AnalyticsConsent) {
  window.localStorage.setItem(CONSENT_KEY, consent);
  window.gtag('consent', 'update', { analytics_storage: consent });
  return consent === 'granted' ? loadAnalytics() : Promise.resolve();
}

export function initAnalytics() {
  if (typeof window === 'undefined') return;
  if (getAnalyticsConsent() === 'granted') void loadAnalytics();
}

export async function trackPageView(path: string) {
  if (getAnalyticsConsent() !== 'granted') return;
  await loadAnalytics();
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}
