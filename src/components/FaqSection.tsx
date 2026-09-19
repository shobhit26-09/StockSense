import { Helmet } from 'react-helmet-async';

const FAQS = [
  {
    question: 'What is StockSense?',
    answer:
      'StockSense is a free web dashboard for the Indian stock market. It brings live NSE and BSE quotes, top movers, sector outlooks, market breadth, macro events and market news into one clear view.',
  },
  {
    question: 'Which markets does StockSense cover?',
    answer:
      'Indian equities listed on the NSE and BSE, major indices, sector performance, bulk and block deals, plus a global macro calendar for wider context.',
  },
  {
    question: 'Is StockSense free to use?',
    answer:
      'Yes. StockSense is a free, open project built on free public market data feeds. No account or subscription is needed.',
  },
  {
    question: 'How accurate is the data on StockSense?',
    answer:
      'StockSense uses free public market and publisher feeds, which can be delayed, revised or temporarily unavailable. Verify important figures with the exchange or issuer before acting.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
};

const FaqSection = () => (
  <section className="mt-14">
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
    </Helmet>
    <div className="mb-5 flex items-center gap-4 px-1">
      <h2 className="font-display shrink-0 text-xl font-semibold tracking-tight text-foreground">About StockSense</h2>
      <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      {FAQS.map((f) => (
        <div key={f.question} className="rounded-2xl border border-border bg-card/60 p-6">
          <h3 className="text-sm font-semibold text-foreground">{f.question}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.answer}</p>
        </div>
      ))}
    </div>
  </section>
);

export default FaqSection;
