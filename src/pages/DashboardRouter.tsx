import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { Skeleton } from '@/components/ui/skeleton';
import UserDashboard from '@/pages/UserDashboard';

/**
 * Unified personal dashboard. Every vertical uses the same UserDashboard
 * overview — labels adapt to the workspace type via useAdaptiveLabels and
 * the sidebar changes via featureNavBuilder. We intentionally do NOT branch
 * to a per-vertical dashboard component here.
 */
export default function DashboardRouter() {
  const { user } = useAuth();
  const { isLoadingOrgs } = useOrg();

  if (isLoadingOrgs || !user) {
    return (
      <div className="container max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  return <UserDashboard />;
}
