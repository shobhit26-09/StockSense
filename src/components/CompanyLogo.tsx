import { useState } from 'react';
import { domainForSymbol } from '@/data/companyDomains';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<LogoSize, string> = {
  xs: 'h-5 w-5 rounded-[6px] text-[8px]',
  sm: 'h-7 w-7 rounded-lg text-[10px]',
  md: 'h-9 w-9 rounded-xl text-[11px]',
  lg: 'h-12 w-12 rounded-2xl text-sm',
};

function initialsFor(symbol: string, name?: string): string {
  const cleanSymbol = symbol.replace(/\.(NS|BO)$/i, '').replace(/[^A-Za-z]/g, '').toUpperCase();
  if (name) {
    const words = name.replace(/[^A-Za-z ]/g, ' ').split(/\s+/).filter(Boolean);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    if (words.length === 1 && words[0].length >= 2) return words[0].slice(0, 2).toUpperCase();
  }
  return cleanSymbol.slice(0, 2) || '?';
}

interface CompanyLogoProps {
  symbol: string;
  name?: string;
  size?: LogoSize;
  className?: string;
}

/**
 * Company mark beside a stock symbol. Resolves a favicon-scale logo from the
 * company's own domain via Google's public favicon service (no key, free);
 * falls back to a deterministic neutral initials tile when the symbol is
 * unmapped or the image cannot load.
 */
const CompanyLogo = ({ symbol, name, size = 'sm', className = '' }: CompanyLogoProps) => {
  const [failed, setFailed] = useState(false);
  const domain = domainForSymbol(symbol);
  const classes = SIZE_CLASSES[size];

  if (!domain || failed) {
    return (
      <span
        aria-hidden
        className={`flex shrink-0 select-none items-center justify-center border border-border/60 bg-foreground/[0.05] font-semibold tracking-wide text-muted-foreground ${classes} ${className}`}
      >
        {initialsFor(symbol, name)}
      </span>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-border/60 bg-white ${classes} ${className}`}
    >
      <img
        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-[72%] w-[72%] object-contain"
        onLoad={(e) => {
          // Google answers unknown domains with a 16px generic globe; use the initials tile instead.
          if (e.currentTarget.naturalWidth <= 16) setFailed(true);
        }}
        onError={() => setFailed(true)}
      />
    </span>
  );
};

export default CompanyLogo;
