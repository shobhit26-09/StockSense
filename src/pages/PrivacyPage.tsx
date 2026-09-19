import PageShell from '@/components/PageShell';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 className="text-base font-semibold text-foreground">{title}</h2>
    <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
  </section>
);

const PrivacyPage = () => (
  <PageShell
    eyebrow="Legal"
    title="Privacy policy"
    sub="How StockSense handles your data. Last updated September 19, 2026."
    seoTitle="Privacy policy — StockSense"
    seoDescription="How StockSense collects, stores and uses data: accounts, browser storage, market data sources, analytics and future advertising."
  >
    <div className="max-w-3xl space-y-10">
      <Section title="Overview">
        <p>
          StockSense is a free Indian stock market dashboard covering NSE and BSE equities,
          indices, sectors, macro events and market news. This policy explains what data the
          site handles, where it is stored, and the choices you have.
        </p>
      </Section>

      <Section title="Account data">
        <p>
          If you create an account, we store your email address and a securely hashed password
          in our authentication provider (Supabase). Your email is used only to sign you in,
          confirm your address and reset your password. We do not send marketing email.
        </p>
      </Section>

      <Section title="Data stored on your device">
        <p>
          Your watchlist, theme preference and sign-in session are stored in your browser's
          local storage. This data never leaves your device except for the session tokens
          required to keep you signed in. Clearing your browser storage removes it.
        </p>
      </Section>

      <Section title="Market data">
        <p>
          Prices, news and other market figures come from free public market and publisher
          feeds. These providers can delay, revise or temporarily block data. Verify important
          figures with the exchange or issuer before acting. Nothing on this site is financial
          advice.
        </p>
      </Section>

      <Section title="Analytics">
        <p>
          StockSense may use privacy-friendly, cookie-free analytics to understand aggregate
          traffic. We do not use analytics to identify individual visitors, and we do not sell
          or share visitor data with advertisers.
        </p>
      </Section>

      <Section title="Advertising">
        <p>
          StockSense does not currently show advertising. If advertising is introduced in the
          future, this policy will be updated before it goes live, including any cookies or
          identifiers an ad network requires.
        </p>
      </Section>

      <Section title="Your choices">
        <p>
          You can sign out at any time from your account page, and you can clear locally stored
          preferences through your browser. To delete your account and its stored email
          address, open an issue on the project's GitHub repository and we will remove it.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          StockSense is an open project. Privacy questions and account deletion requests can be
          raised on the GitHub repository at github.com/shobhit26-09/StockSense.
        </p>
      </Section>
    </div>
  </PageShell>
);

export default PrivacyPage;
