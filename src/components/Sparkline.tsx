import { useId } from 'react';

interface SparklineProps {
  values: number[];
  positive: boolean;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
}

/** Smooth SVG sparkline with an optional soft area fill. */
const Sparkline = ({ values, positive, width = 96, height = 32, fill = true, className = '' }: SparklineProps) => {
  const id = useId().replace(/:/g, '');
  if (values.length < 2) return <span className={className} style={{ width, height, display: 'inline-block' }} />;
  const pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    pad + (i / (values.length - 1)) * (width - pad * 2),
    height - pad - ((v - min) / span) * (height - pad * 2),
  ]);
  // Catmull-Rom -> cubic bezier for a smooth line
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  const color = positive ? 'hsl(var(--success))' : 'hsl(var(--destructive))';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className={`shrink-0 overflow-visible ${className}`} aria-hidden>
      <defs>
        <linearGradient id={`sg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={`${d} L${pts[pts.length - 1][0]},${height} L${pts[0][0]},${height} Z`} fill={`url(#sg-${id})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.2" fill={color} />
    </svg>
  );
};

export default Sparkline;
