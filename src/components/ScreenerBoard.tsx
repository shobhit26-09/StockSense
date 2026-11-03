import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { PRESETS, runPreset, dataAgeDays, type ScreenData } from '@/services/screener';

const ScreenerBoard = () => {
  const [data, setData] = useState<ScreenData | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(PRESETS[0].id);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/data/screener.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad status'))))
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  const preset = PRESETS.find((p) => p.id === active) ?? PRESETS[0];
  const result = data ? runPreset(data.rows, preset) : null;
  const age = data ? dataAgeDays(data.asOf) : 0;

  return (
    <Card className="p-5 bg-card/50 border-border/50">
      <div className="flex flex-wrap gap-1.5 mb-4" role="tablist">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={p.id === active}
            onClick={() => setActive(p.id)}
            className={`px-3 h-8 rounded-md text-[11px] border transition-colors ${
              p.id === active ? 'bg-secondary text-foreground border-border' : 'text-muted-foreground border-border/40 hover:border-border'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-foreground/85 leading-relaxed"><span className="text-muted-foreground">Rule:</span> {preset.rule}</p>
      <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{preset.caveat}</p>

      {failed && <p className="mt-6 text-xs text-muted-foreground">Screener data could not be loaded. Try again later.</p>}
      {!data && !failed && <p className="mt-6 text-xs text-muted-foreground">Loading end-of-day data...</p>}

      {data && result && (
        <>
          <p className="mt-3 text-[10px] text-muted-foreground font-mono">
            End-of-day close of {data.asOf}{age >= 1 ? ` (${age} day${age > 1 ? 's' : ''} old)` : ''} · {data.universe} liquid NSE stocks of 755 · {result.total} match{result.total === 1 ? '' : 'es'}
            {result.total > result.rows.length ? `, top ${result.rows.length} shown` : ''}
          </p>
          <div className="mt-3 divide-y divide-border/30">
            {result.rows.length === 0 && <p className="py-6 text-xs text-muted-foreground">No stock matches this rule on the latest data.</p>}
            {result.rows.map((r) => (
              <button
                key={r.s}
                onClick={() => navigate(`/stock/${r.s}.NS`)}
                className="w-full text-left py-2.5 flex items-start justify-between gap-3 hover:bg-secondary/20 transition-colors px-1"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground">{r.s} <span className="font-normal text-muted-foreground">· {r.n}</span></div>
                  <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">{preset.why(r)}</div>
                  <div className="text-[10px] text-muted-foreground/70 mt-0.5">{r.sec}</div>
                </div>
                <div className="text-right shrink-0 font-mono text-[11px]">
                  <div className="text-foreground">₹{r.p.toFixed(2)}</div>
                  <div className={r.r1 >= 0 ? 'text-success' : 'text-destructive'}>{r.r1 >= 0 ? '+' : ''}{r.r1.toFixed(2)}%</div>
                </div>
              </button>
            ))}
          </div>
          <p className="mt-4 text-[10px] text-muted-foreground/80 leading-relaxed">
            Rules run on delayed, free end-of-day data. The 52-week high uses the highest close in the {data.sessions} sessions since January, not a full year. Screens narrow a list, they do not say what to buy.
          </p>
        </>
      )}
    </Card>
  );
};

export default ScreenerBoard;
