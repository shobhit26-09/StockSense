export const SHOWCASE_DISCLOSURE = {
  label: 'Portfolio showcase',
  summary: 'Live feeds with simulated fallbacks',
  detail: 'StockSense uses live market sources when available and clearly labeled simulated data to keep this portfolio demo explorable when a provider is unavailable.',
} as const;

export const isSimulatedSource = (source?: string): boolean =>
  Boolean(source && /fallback|simulated|demo|sample/i.test(source));
