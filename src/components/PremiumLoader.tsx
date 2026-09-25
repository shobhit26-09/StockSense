interface PremiumLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

/**
 * Brand loader: the Split S stroke draws itself over a faint track while a
 * thin progress sweep runs underneath. Calm, no spinners or bouncing dots.
 */
export const PremiumLoader = ({ size = 'md', text, className = '' }: PremiumLoaderProps) => {
  const dim = size === 'sm' ? 36 : size === 'lg' ? 72 : 56;
  const full = !className && size === 'md' && !text;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-5 ${full ? 'min-h-screen bg-background' : 'py-16'} ${className}`}
    >
      <div className="ss-loader relative" style={{ width: dim, height: dim }}>
        <span aria-hidden className="ss-loader-glow absolute inset-[-40%] rounded-full" />
        <svg viewBox="0 0 32 32" width={dim} height={dim} fill="none" className="relative">
          <rect width="32" height="32" rx="8" fill="#111417" stroke="#30353A" />
          <path d="M23.5 8.5H13.75L8.5 13.75L13.75 19H19.75L24.5 23.75L19.25 29H8.5" stroke="#2ED6A1" strokeOpacity="0.14" strokeWidth="3.6" strokeLinecap="square" strokeLinejoin="miter" />
          <path className="ss-loader-stroke" pathLength={100} d="M23.5 8.5H13.75L8.5 13.75L13.75 19H19.75L24.5 23.75L19.25 29H8.5" stroke="#2ED6A1" strokeWidth="3.6" strokeLinecap="square" strokeLinejoin="miter" />
        </svg>
      </div>
      <div className="flex flex-col items-center gap-2.5">
        <div className="ss-loader-bar relative h-[3px] w-28 overflow-hidden rounded-full bg-foreground/[0.08]" />
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {text ?? 'StockSense'}
        </span>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
};

export default PremiumLoader;
