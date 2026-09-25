import { useState } from 'react';

interface Props { code: string; name?: string; width?: number }

/** Country flag (bundled SVG from flagcdn.com), falls back to the ISO code if the image fails. */
const CountryFlag = ({ code, name, width = 30 }: Props) => {
  const [failed, setFailed] = useState(false);
  const iso2 = code.toLowerCase() === 'uk' ? 'gb' : code.toLowerCase();
  const height = Math.round(width * 0.7);
  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-[5px] bg-muted/50 shadow-[0_0_0_1px_hsl(var(--border)),0_2px_6px_rgba(0,0,0,.25)]"
      style={{ width, height }}
      title={name ?? code}
    >
      {!failed ? (
        <img
          src={`/flags/${iso2}.svg`}
          alt={name ? `${name} flag` : `${code} flag`}
          width={width}
          height={height}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="font-mono text-[9px] font-semibold text-muted-foreground">{code}</span>
      )}
    </span>
  );
};

export default CountryFlag;
