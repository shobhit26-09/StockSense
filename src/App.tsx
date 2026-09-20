import { lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import RequireAuth from '@/components/RequireAuth';
import PremiumLoader from '@/components/PremiumLoader';
import AnalyticsConsent from '@/components/AnalyticsConsent';
import AnalyticsPageView from '@/components/AnalyticsPageView';

const Index = lazy(() => import('./pages/Index'));
const StockAnalysis = lazy(() => import('./pages/StockAnalysis'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AgentPage = lazy(() => import('./pages/AgentPage'));
const SectorPage = lazy(() => import('./pages/SectorPage'));
const HeatmapPage = lazy(() => import('./pages/HeatmapPage'));
const MoversPage = lazy(() => import('./pages/MoversPage'));
const MacroPage = lazy(() => import('./pages/MacroPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));

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
      <AuthProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnalyticsConsent />
          <AnalyticsPageView />
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
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/market" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
