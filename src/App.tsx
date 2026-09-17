import { lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import PremiumLoader from '@/components/PremiumLoader';

const Index = lazy(() => import('./pages/Index'));
const StockAnalysis = lazy(() => import('./pages/StockAnalysis'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AgentPage = lazy(() => import('./pages/AgentPage'));
const SectorPage = lazy(() => import('./pages/SectorPage'));
const HeatmapPage = lazy(() => import('./pages/HeatmapPage'));
const MoversPage = lazy(() => import('./pages/MoversPage'));
const MacroPage = lazy(() => import('./pages/MacroPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PremiumLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/stock/:symbol" element={<StockAnalysis />} />
              <Route path="/agent" element={<AgentPage />} />
              <Route path="/sectors" element={<SectorPage />} />
              <Route path="/heatmap" element={<HeatmapPage />} />
              <Route path="/movers" element={<MoversPage />} />
              <Route path="/macro" element={<MacroPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/market" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
