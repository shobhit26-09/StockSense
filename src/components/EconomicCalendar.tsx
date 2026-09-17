import { Calendar, Clock } from 'lucide-react';

interface Event {
  date: string;
  time?: string;
  title: string;
  category: 'earnings' | 'macro' | 'central-bank' | 'event';
  impact: 'high' | 'med' | 'low';
}

// Static curated set of upcoming relevant events for Indian market context.
// In production this could pull from an RSS / scraped calendar.
const EVENTS: Event[] = [
  { date: 'Today',    time: '14:00', title: 'US CPI Print',                     category: 'macro',         impact: 'high' },
  { date: 'Today',    time: '17:30', title: 'India IIP Data',                   category: 'macro',         impact: 'med' },
  { date: 'Tomorrow', time: '09:00', title: 'TCS Q3 Earnings',                  category: 'earnings',      impact: 'high' },
  { date: 'Tomorrow', time: '15:30', title: 'INFY Q3 Earnings',                 category: 'earnings',      impact: 'high' },
  { date: 'Fri',      time: '11:00', title: 'WPI Inflation',                    category: 'macro',         impact: 'med' },
  { date: 'Fri',      time: '17:00', title: 'F&O Expiry',                       category: 'event',         impact: 'high' },
  { date: 'Next Wk',  time: '19:30', title: 'FOMC Rate Decision',               category: 'central-bank',  impact: 'high' },
  { date: 'Next Wk',  time: '12:00', title: 'RBI Monetary Policy',              category: 'central-bank',  impact: 'high' },
];

const impactDot = (i: Event['impact']) =>
  i === 'high' ? 'bg-destructive' : i === 'med' ? 'bg-warning' : 'bg-muted-foreground';

const catTone: Record<Event['category'], string> = {
  earnings: 'text-accent',
  macro: 'text-warning',
  'central-bank': 'text-primary',
  event: 'text-muted-foreground',
};

const catLabel: Record<Event['category'], string> = {
  earnings: 'EARN',
  macro: 'MACRO',
  'central-bank': 'CB',
  event: 'EVENT',
};

const EconomicCalendar = () => {
  return (
    <div className="premium-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Calendar</span>
        </div>
        <span className="text-[10px] text-muted-foreground/60">High-impact events</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
        {EVENTS.map((ev, i) => (
          <div key={i} className="flex items-start gap-2.5 py-1.5 border-b border-border/30 last:border-0">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${impactDot(ev.impact)}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-mono text-muted-foreground">{ev.date}</span>
                {ev.time && (
                  <span className="text-[10px] font-mono text-muted-foreground/70 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />{ev.time}
                  </span>
                )}
                <span className={`text-[9px] font-bold tracking-wider ${catTone[ev.category]} ml-auto`}>
                  {catLabel[ev.category]}
                </span>
              </div>
              <div className="text-[11px] font-medium text-foreground leading-snug">{ev.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EconomicCalendar;