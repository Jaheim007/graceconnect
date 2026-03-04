import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import AmbassadorDashboard from '@/pages/AmbassadorDashboard';
import UserDashboard from '@/pages/UserDashboard';

/**
 * Smart dashboard router — shows the right dashboard based on user state:
 * 1. Creator (has orgs with manage role) → redirect to /admin
 * 2. Ambassador (has affiliate links) → AmbassadorDashboard
 * 3. Simple buyer → UserDashboard (purchases, discover, formations)
 */
export default function DashboardRouter() {
  const { user } = useAuth();
  const { userOrgs, isLoadingOrgs, canManage } = useOrg();

  const hasManageableOrg = userOrgs.some(o => canManage(o.id));

  const { data: affiliateLinkCount, isLoading: isLoadingAff } = useQuery({
    queryKey: ['affiliate-link-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await db.from('affiliate_links')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      return count || 0;
    },
    enabled: !!user && !hasManageableOrg,
    staleTime: 60_000,
  });

  // Still loading
  if (isLoadingOrgs || (!hasManageableOrg && isLoadingAff)) {
    return (
      <div className="container max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  // 1. Creator → admin dashboard
  if (hasManageableOrg) {
    return <Navigate to="/admin" replace />;
  }

  // 2. Ambassador
  if ((affiliateLinkCount ?? 0) > 0) {
    return <AmbassadorDashboard />;
  }

  // 3. Simple buyer
  return <UserDashboard />;
}
