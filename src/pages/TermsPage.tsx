import PageShell from '@/components/PageShell';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 className="text-base font-semibold text-foreground">{title}</h2>
    <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
  </section>
);

const TermsPage = () => (
  <PageShell
    eyebrow="Legal"
    title="Terms of use"
    sub="Last updated October 6, 2026."
    seoTitle="Terms of Use — StockSense"
    seoDescription="Terms for using StockSense: data accuracy, acceptable use and availability."
  >
    <div className="max-w-3xl space-y-10">
      <Section title="Data accuracy">
        <p>
          Market data comes from free public sources and can be delayed, incomplete or revised. Some figures are estimates, for example sector money flow.
        </p>
      </Section>
      <Section title="Acceptable use">
        <p>Do not scrape the site at a rate that harms it, attempt to break into it, or use it to mislead others. Accounts can be removed for abuse.</p>
      </Section>
      <Section title="Availability and liability">
        <p>
          StockSense is provided as is, without warranty, and may change or go offline at any time. To the extent the law allows, its author is not liable for losses arising from use of the site or reliance on its data.
        </p>
      </Section>
      <Section title="Changes">
        <p>These terms may be updated. The date above shows the latest revision.</p>
      </Section>
    </div>
  </PageShell>
);

export default TermsPage;
