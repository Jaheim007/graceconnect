import { Navigate } from '@/lib/router-compat';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { getShortcutRoute, type ShortcutRouteKey } from '@/lib/navigation/shortcutRoutes';
import { RouteContentSkeleton } from './RouteFallback';

export function ShortcutRedirect({ kind }: { kind: ShortcutRouteKey }) {
  const { isSuperadmin, loading, platformRoleLoading } = useAuth();
  const { currentOrg, canManage, userOrgs, isLoadingOrgs } = useOrg();

  if (loading || platformRoleLoading || isLoadingOrgs) {
    return <RouteContentSkeleton />;
  }

  const canManageCurrentOrg = currentOrg ? canManage(currentOrg.id) : false;

  return (
    <Navigate
      to={getShortcutRoute(kind, {
        canManageCurrentOrg,
        hasOrganizations: userOrgs.length > 0,
        isSuperadmin,
      })}
      replace
    />
  );
}