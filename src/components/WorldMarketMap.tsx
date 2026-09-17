import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

export interface MarketEntry {
  label: string;
  symbol: string;
  changePercent: number;
  price: number;
}

export interface CountryMarket {
  iso: string;         // ISO 3166-1 numeric, as string (matches topojson id)
  code: string;        // ISO alpha-2
  name: string;
  flag: string;
  indices: MarketEntry[];
}

interface Props {
  countries: CountryMarket[];
}

/** Approximate market-centre coordinates [lon, lat] keyed by ISO numeric. */
const CENTROIDS: Record<string, [number, number]> = {
  '356': [78.9, 22.0],    // India
  '840': [-98.5, 39.5],   // United States
  '392': [138.0, 36.5],   // Japan
  '344': [114.2, 22.3],   // Hong Kong
  '156': [104.0, 35.0],   // China
  '826': [-1.5, 53.0],    // United Kingdom
  '276': [10.4, 51.2],    // Germany
  '250': [2.4, 46.6],     // France
};

/** Label offset in px so neighbouring pills (HK/CN, DE/FR/UK) don't collide. */
const LABEL_OFFSET: Record<string, [number, number]> = {
  '356': [0, -16],
  '840': [0, -16],
  '392': [26, -8],
  '344': [22, 14],
  '156': [-6, -18],
  '826': [-26, -10],
  '276': [20, -16],
  '250': [-14, 16],
};

const SHORT: Record<string, string> = {
  '356': 'IN', '840': 'US', '392': 'JP', '344': 'HK',
  '156': 'CN', '826': 'UK', '276': 'DE', '250': 'FR',
};

type Tone = 'up' | 'down' | 'flat' | 'none';

const toneOf = (avgPct: number | null): Tone => {
  if (avgPct === null) return 'none';
  if (avgPct >= 0.05) return 'up';
  if (avgPct <= -0.05) return 'down';
  return 'flat';
};

const COLOR: Record<Tone, string> = {
  up: 'var(--success)',
  down: 'var(--destructive)',
  flat: 'var(--warning)',
  none: 'var(--muted-foreground)',
};

const WorldMarketMap = ({ countries }: Props) => {
  const byIso = useMemo(() => {
    const m = new Map<string, CountryMarket>();
    countries.forEach((c) => m.set(c.iso, c));
    return m;
  }, [countries]);

  const [hovered, setHovered] = useState<{ c: CountryMarket; x: number; y: number } | null>(null);

  const avg = (c: CountryMarket) => {
    const vals = c.indices.map((i) => i.changePercent).filter((v) => Number.isFinite(v));
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const track = (c: CountryMarket) => (e: React.MouseEvent) => {
    const svg = (e.currentTarget as SVGElement).ownerSVGElement ?? (e.currentTarget as unknown as SVGSVGElement);
    const rect = svg.getBoundingClientRect();
    setHovered({
      c,
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div className="relative w-full h-full">
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 205, center: [14, 12] }}
        width={980}
        height={440}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies
              .filter((geo) => String(geo.id) !== '010') // drop Antarctica
              .map((geo) => {
                const id = String(geo.id).padStart(3, '0');
                const c = byIso.get(id);
                const tone = c ? toneOf(avg(c)) : 'none';
                const color = COLOR[tone];
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={c ? track(c) : undefined}
                    onMouseMove={c ? track(c) : undefined}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      default: {
                        fill: c ? `hsl(${color} / 0.42)` : 'hsl(var(--muted-foreground) / 0.11)',
                        stroke: c ? `hsl(${color} / 0.85)` : 'hsl(var(--muted-foreground) / 0.18)',
                        strokeWidth: c ? 0.8 : 0.4,
                        outline: 'none',
                        transition: 'fill .35s ease',
                      },
                      hover: {
                        fill: c ? `hsl(${color} / 0.7)` : 'hsl(var(--muted-foreground) / 0.16)',
                        stroke: c ? `hsl(${color})` : 'hsl(var(--muted-foreground) / 0.18)',
                        strokeWidth: c ? 1.1 : 0.4,
                        outline: 'none',
                        cursor: c ? 'pointer' : 'default',
                      },
                      pressed: { fill: c ? `hsl(${color} / 0.7)` : 'hsl(var(--muted-foreground) / 0.12)', outline: 'none' },
                    }}
                  />
                );
              })
          }
        </Geographies>

        {countries.map((c) => {
          const coords = CENTROIDS[c.iso];
          if (!coords) return null;
          const a = avg(c);
          const tone = toneOf(a);
          const color = COLOR[tone];
          const [dx, dy] = LABEL_OFFSET[c.iso] ?? [0, -16];
          const pct = a === null ? '—' : `${a >= 0 ? '+' : ''}${a.toFixed(2)}%`;
          const text = `${SHORT[c.iso] ?? c.code} ${pct}`;
          const w = text.length * 5.6 + 12;
          return (
            <Marker
              key={c.iso}
              coordinates={coords}
              onMouseEnter={track(c)}
              onMouseMove={track(c)}
              onMouseLeave={() => setHovered(null)}
              style={{ default: { cursor: 'pointer' }, hover: { cursor: 'pointer' }, pressed: {} }}
            >
              <circle r={9} fill={`hsl(${color} / 0.16)`} />
              <circle r={3.2} fill={`hsl(${color})`} stroke="hsl(var(--card))" strokeWidth={1.1} />
              <g transform={`translate(${dx - w / 2}, ${dy - 9})`}>
                <rect
                  width={w}
                  height={17}
                  rx={8.5}
                  fill="hsl(var(--card) / 0.92)"
                  stroke={`hsl(${color} / 0.45)`}
                  strokeWidth={0.7}
                />
                <text
                  x={w / 2}
                  y={11.8}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={600}
                  style={{ pointerEvents: 'none', fontFamily: 'JetBrains Mono, monospace' }}
                  fill={`hsl(${color})`}
                >
                  {text}
                </text>
              </g>
            </Marker>
          );
        })}
      </ComposableMap>

      {hovered && (
        <div
          className="pointer-events-none absolute z-20 w-[230px] rounded-2xl border border-border bg-popover/95 backdrop-blur-md shadow-lg p-3"
          style={{
            left: `${Math.min(Math.max(hovered.x, 3), 72)}%`,
            top: `${Math.min(Math.max(hovered.y - 6, 2), 58)}%`,
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-border/70">
            <span className="text-[12.5px] font-semibold text-foreground truncate">{hovered.c.name}</span>
            <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
              {SHORT[hovered.c.iso] ?? ''}
            </span>
          </div>
          <div className="space-y-1.5">
            {hovered.c.indices.map((i) => {
              const pos = i.changePercent >= 0;
              return (
                <div key={i.symbol} className="flex items-center justify-between gap-3 text-[11.5px]">
                  <span className="text-muted-foreground truncate">{i.label}</span>
                  <span className="flex items-center gap-2 font-mono tabular-nums shrink-0">
                    <span className="text-foreground">
                      {i.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                    <span className={pos ? 'text-success' : 'text-destructive'}>
                      {pos ? '+' : ''}{i.changePercent.toFixed(2)}%
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldMarketMap;
