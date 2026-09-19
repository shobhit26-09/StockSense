import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/** Gate for routes that need a signed-in user. */
const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, loading, isConfigured } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (!isConfigured || !user) {
    return <Navigate to="/auth" state={{ from: location.pathname + location.search }} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
