import PageShell from '@/components/PageShell';

const ContactPage = () => (
  <PageShell
    eyebrow="Contact"
    title="Contact"
    sub="StockSense is an independent project. The fastest way to reach its author is on GitHub."
    seoTitle="Contact StockSense"
    seoDescription="How to report a bug, a data error, a privacy request or give feedback on StockSense."
  >
    <div className="max-w-3xl space-y-8 text-sm leading-relaxed text-muted-foreground">
      <section>
        <h2 className="text-base font-semibold text-foreground">Bugs, data errors and feedback</h2>
        <p className="mt-3">
          Open an issue at{' '}
          <a className="text-foreground underline" href="https://github.com/shobhit26-09/StockSense/issues" rel="noopener noreferrer">github.com/shobhit26-09/StockSense/issues</a>. For a wrong figure, include the page, the value you saw and the source you compared it with.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Privacy and account deletion</h2>
        <p className="mt-3">Raise it in the same issue tracker and the account and its stored email address will be removed. See the privacy policy for what is stored.</p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">The author</h2>
        <p className="mt-3">
          Built by Shobhit Gupta.{' '}
          <a className="text-foreground underline" href="https://github.com/shobhit26-09" rel="noopener noreferrer">GitHub profile</a>.
        </p>
      </section>
    </div>
  </PageShell>
);

export default ContactPage;
