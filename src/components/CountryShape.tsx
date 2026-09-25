import { useEffect, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';
let worldPromise: Promise<FeatureCollection<Geometry, { name: string }>> | null = null;
const loadWorld = () => {
  if (!worldPromise) {
    worldPromise = fetch(GEO_URL)
      .then((r) => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((topo: any) => feature(topo, topo.objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>);
  }
  return worldPromise;
};

/** Mainland framing for countries with far-flung territories. [[west, south], [east, north]] */
const FRAME: Record<string, [[number, number], [number, number]]> = {
  '840': [[-124.8, 24.5], [-66.9, 49.4]],
  '250': [[-5.2, 42.3], [8.3, 51.1]],
  '156': [[73.5, 18.2], [134.8, 53.6]],
};

const box = ([[w, s], [e, n]]: [[number, number], [number, number]]): Feature => ({
  type: 'Feature', properties: {},
  geometry: { type: 'Polygon', coordinates: [[[w, s], [w, n], [e, n], [e, s], [w, s]]] },
});

interface Props { iso: string; code: string; tone: 'up' | 'down' | 'flat' | 'neutral'; size?: number }

/** Real country outline (Natural Earth via world-atlas) used as the row mark. */
const CountryShape = ({ iso, code, tone, size = 40 }: Props) => {
  const [d, setD] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const w = size, h = Math.round(size * 0.8), pad = 4;

  useEffect(() => {
    let alive = true;
    loadWorld().then((fc) => {
      const f = fc.features.find((x) => String(x.id).padStart(3, '0') === iso);
      if (!alive) return;
      if (!f) { setMissing(true); return; }
      const proj = geoMercator().fitExtent([[pad, pad], [w - pad, h - pad]], FRAME[iso] ? box(FRAME[iso]) : f);
      setD(geoPath(proj)(f));
    }).catch(() => alive && setMissing(true));
    return () => { alive = false; };
  }, [iso, w, h]);

  const color = tone === 'up' ? 'hsl(var(--success))' : tone === 'down' ? 'hsl(var(--destructive))' : tone === 'flat' ? 'hsl(var(--warning))' : 'hsl(var(--foreground))';
  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-gradient-to-br from-muted/70 to-muted/20"
      style={{ width: w, height: h }}
      title={code}
    >
      {d && !missing ? (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
          <path d={d} fill={color} fillOpacity={0.32} stroke={color} strokeWidth={1} strokeLinejoin="round" />
        </svg>
      ) : (
        <span className="font-mono text-[10px] font-semibold tracking-wide text-muted-foreground">{code}</span>
      )}
    </span>
  );
};

export default CountryShape;
