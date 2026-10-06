import { Link } from "react-router-dom";
import Seo from "@/components/Seo";

const NotFound = () => (
  <main className="flex min-h-[70vh] items-center justify-center bg-background px-5 text-foreground">
    <Seo title="Page not found — StockSense" description="This page does not exist on StockSense." noindex />
    <div className="max-w-md text-center">
      <p className="section-eyebrow mb-3">404</p>
      <h1 className="font-display text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-3 text-sm text-muted-foreground">The page you asked for does not exist or has moved.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
        <Link to="/" className="font-semibold text-primary hover:underline">Markets</Link>
        <Link to="/sectors" className="text-muted-foreground hover:text-foreground">Sectors</Link>
        <Link to="/fii-dii" className="text-muted-foreground hover:text-foreground">FII / DII</Link>
        <Link to="/news" className="text-muted-foreground hover:text-foreground">News</Link>
      </div>
    </div>
  </main>
);

export default NotFound;
