export const SHOWCASE_DISCLOSURE = {
  label: 'Market data notice',
  summary: 'Free public feeds are used first. Some figures may be delayed or inaccurate.',
  detail: 'StockSense combines free public market and publisher feeds. Providers can delay, omit, revise, or temporarily block data, so verify important figures with the exchange or issuer before acting.',
} as const;

export const isSimulatedSource = (source?: string): boolean =>
  Boolean(source && /fallback|simulated|demo|sample|backup|estimated/i.test(source));
