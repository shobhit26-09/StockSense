// Privacy-friendly analytics foundation for a future AdSense application.
// Loads Plausible (cookie-free, no personal data) only when VITE_PLAUSIBLE_DOMAIN
// is set at build time; otherwise this is a complete no-op, so the deployed
// site ships no tracker until the owner configures one.
export function initAnalytics() {
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
  if (!domain || typeof document === 'undefined') return;
  const script = document.createElement('script');
  script.defer = true;
  script.dataset.domain = domain;
  script.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(script);
}
