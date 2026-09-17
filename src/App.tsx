
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import StockAnalysis from "./pages/StockAnalysis";
import NotFound from "./pages/NotFound";
import AgentPage from "./pages/AgentPage";
import SectorPage from "./pages/SectorPage";
import HeatmapPage from "./pages/HeatmapPage";
import MoversPage from "./pages/MoversPage";
import MacroPage from "./pages/MacroPage";
import NewsPage from "./pages/NewsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/stock/:symbol" element={<StockAnalysis />} />
            <Route path="/agent" element={<AgentPage />} />
            <Route path="/sectors" element={<SectorPage />} />
            <Route path="/heatmap" element={<HeatmapPage />} />
            <Route path="/movers" element={<MoversPage />} />
            <Route path="/macro" element={<MacroPage />} />
            <Route path="/news" element={<NewsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
