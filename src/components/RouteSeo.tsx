import { useLocation } from 'react-router-dom';
import Seo from '@/components/Seo';
import { SEO_ROUTES } from '@/config/seoRoutes';

/** Sets title, description and canonical for static routes. The home and stock pages set their own. */
const RouteSeo = () => {
  const { pathname } = useLocation();
  if (pathname === '/') return null;
  const route = SEO_ROUTES.find((r) => r.path === pathname);
  if (!route) return null;
  return <Seo title={route.title} description={route.description} />;
};

export default RouteSeo;
