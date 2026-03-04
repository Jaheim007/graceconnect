import { lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FullPageLoader } from '@/components/layout/RouteGuard';
import { PublicTopBar } from '@/components/layout/PublicTopBar';
import { LandingFooterCompact } from '@/components/landing/LandingFooterCompact';
import { Navigate } from 'react-router-dom';

const MarketplacePage = lazy(() => import('@/pages/MarketplacePage'));

/**
 * HubPage — Public-only wrapper for Le Hub.
 * Visitors see the hub in PublicLayout.
 * Authenticated users are redirected to /hub (inside AppLayout).
 */
export default function HubPage() {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;

  // Authenticated users go to the AppLayout version
  if (user) return <Navigate to="/hub" replace />;

  // Public visitors
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <PublicTopBar />
      <main id="main-content" role="main" className="flex-1">
        <Suspense fallback={<FullPageLoader />}>
          <MarketplacePage />
        </Suspense>
      </main>
      <LandingFooterCompact />
    </div>
  );
}