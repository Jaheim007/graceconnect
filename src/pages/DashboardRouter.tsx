import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import UserDashboard from '@/pages/UserDashboard';

/**
 * Unified Dashboard — no more mode-based routing.
 * Skips WelcomeIntent if user already has orgs (returning user).
 */
export default function DashboardRouter() {
  const { user } = useAuth();
  const { isLoadingOrgs } = useOrg();

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

  return <UserDashboard />;
}
