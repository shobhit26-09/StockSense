import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PremiumLoader from '@/components/PremiumLoader';
import { useAuth } from '@/contexts/AuthContext';

/** Gate for routes that need a signed-in user. */
const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, loading, isConfigured } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <PremiumLoader />
    );
  }

  if (!isConfigured || !user) {
    return <Navigate to="/auth" state={{ from: location.pathname + location.search }} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
