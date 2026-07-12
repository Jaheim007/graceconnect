import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { Skeleton } from '@/components/ui/skeleton';
import UserDashboard from '@/pages/UserDashboard';
import PersonalHome from '@/pages/dashboard/PersonalHome';

/**
 * Dashboard entry point.
 *
 * - Personal mode (currentOrg === null) → the Step-2 PersonalHome customer shell.
 * - Any org selected → the existing UserDashboard (unchanged provider/overview).
 *
 * We never branch to a per-vertical dashboard here — the sidebar and labels
 * still adapt via useAdaptiveLabels + featureNavBuilder.
 */
export default function DashboardRouter() {
  const { user } = useAuth();
  const { currentOrg, isLoadingOrgs } = useOrg();

  if (isLoadingOrgs || !user) {
    return (
      <div className="container max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  if (!currentOrg) return <PersonalHome />;
  return <UserDashboard />;
}
