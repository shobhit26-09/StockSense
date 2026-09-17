import PageShell from '@/components/PageShell';
import AllIndicesPanel from '@/components/AllIndicesPanel';
import EconomicCalendar from '@/components/EconomicCalendar';

const MacroPage = () => (
  <PageShell
    eyebrow="Macro"
    title="All indices & macro calendar"
    sub="Live Indian and global benchmarks, refreshed every 20 seconds, alongside the events moving them."
  >
    <div className="space-y-8">
      <AllIndicesPanel />
      <EconomicCalendar />
    </div>
  </PageShell>
);

export default MacroPage;