import { lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import UserDashboard from '@/pages/UserDashboard';
import DigitalProductDashboard from '@/pages/dashboard/DigitalProductDashboard';
const WorkspaceDashboard = lazy(() => import('@/pages/dashboard/WorkspaceDashboard'));

/**
 * One account → many workspaces. The selected workspace drives the dashboard.
 */
export default function DashboardRouter() {
  const { user } = useAuth();
  const { currentOrg, userOrgs, isLoadingOrgs } = useOrg();

  const { isLoading: stateLoading } = useQuery({
    queryKey: ['dashboard-state', user?.id],
    queryFn: async () => {
      if (!user) return null;
      return true;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  if (isLoadingOrgs || stateLoading) {
    return (
      <div className="container max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  const org = currentOrg ?? userOrgs[0] ?? null;
  const type = org?.siteviral_type;

  const dashboard = (() => {
    switch (type) {
      case 'digital_products':
        return <DigitalProductDashboard />;
      case 'church':
      case 'artisans_home_services':
      case 'beauty':
      case 'sport':
      case 'instrumentists':
      case 'tutors_home_teachers':
      case 'influencers':
      case 'services':
        return <WorkspaceDashboard />;
      default:
        return userOrgs.length > 0 ? <WorkspaceDashboard /> : <UserDashboard />;
    }
  })();

  return (
    <Suspense fallback={<div className="container max-w-2xl px-4 py-8"><Skeleton className="h-32 w-full rounded-2xl" /></div>}>
      {dashboard}
    </Suspense>
  );
}
