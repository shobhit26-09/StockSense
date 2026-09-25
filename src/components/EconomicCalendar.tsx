import { useEffect, useState } from 'react';
import { Calendar, Clock, ExternalLink, Globe2 } from 'lucide-react';
import CountryShape from '@/components/CountryShape';
import { supabase } from '@/integrations/supabase/client';

interface Event { id: string; date: string; title: string; source: string; url: string; country: { iso: string; code: string } | null; }

/** Tag each release with the economy it is about, from keywords in the headline. Unmatched stays untagged. */
const COUNTRY_RULES: [RegExp, string, string][] = [
  [/\b(RBI|SEBI|rupee|India|Indian|Sensex|Nifty|BSE|NSE|GST|Dalal)\b/i, '356', 'IN'],
  [/\b(Fed|FOMC|Powell|U\.?S\.?|United States|Wall Street|Treasury|Dow|Nasdaq|S&P|dollar)\b/i, '840', 'US'],
  [/\b(China|Chinese|PBOC|yuan|Beijing)\b/i, '156', 'CN'],
  [/\b(Japan|Japanese|BOJ|BoJ|yen|Nikkei|Tokyo)\b/i, '392', 'JP'],
  [/\b(UK|Britain|British|BoE|Bank of England|sterling|FTSE)\b/i, '826', 'UK'],
  [/\b(Germany|German|Bundesbank|DAX)\b/i, '276', 'DE'],
  [/\b(France|French|CAC)\b/i, '250', 'FR'],
  [/\b(Hong Kong|Hang Seng)\b/i, '344', 'HK'],
];
const tagCountry = (text: string) => {
  for (const [re, iso, code] of COUNTRY_RULES) if (re.test(text)) return { iso, code };
  return null;
};

const EconomicCalendar = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    supabase.functions.invoke('fetch-market-data', { body: { type: 'news' } })
      .then(({ data }) => {
        if (!active) return;
        setEvents((data?.articles || [])
          .filter((item: any) => /RBI|SEBI|BSE|inflation|GDP|policy|rate|rupee|econom|Fed|FOMC|ECB|BoJ|PBOC|tariff|CPI|jobs|payroll/i.test(`${item.source} ${item.title}`))
          .slice(0, 8)
          .map((item: any) => ({ id: item.id, date: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Latest', title: item.title, source: item.source, url: item.url, country: tagCountry(`${item.title} ${item.source}`) })));
      }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);
  return <div className="premium-card p-4 h-full flex flex-col">
    <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Macro releases</span></div><span className="text-[10px] text-muted-foreground/60">Publisher feeds</span></div>
    <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
      {loading && <div className="text-xs text-muted-foreground py-6 text-center">Loading latest releases…</div>}
      {!loading && events.length === 0 && <div className="text-xs text-muted-foreground py-6 text-center">No recent macro releases available</div>}
      {events.map(ev => <a key={ev.id} href={ev.url} target="_blank" rel="noreferrer" className="group flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0">{ev.country ? <CountryShape iso={ev.country.iso} code={ev.country.code} tone="neutral" size={34} /> : <span className="grid shrink-0 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground" style={{ width: 34, height: 27 }} title="Global"><Globe2 className="w-3.5 h-3.5" /></span>}<div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-0.5 text-[10px] font-mono text-muted-foreground"><Clock className="w-2.5 h-2.5" /> {ev.date}<span className="ml-auto font-sans font-bold tracking-wider text-primary">{ev.source}</span></div><div className="text-[11px] font-medium text-foreground leading-snug group-hover:text-primary">{ev.title}</div></div><ExternalLink className="w-3 h-3 mt-1 text-muted-foreground opacity-0 group-hover:opacity-100" /></a>)}
    </div>
  </div>;
};
export default EconomicCalendar;
