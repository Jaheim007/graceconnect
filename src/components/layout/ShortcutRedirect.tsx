import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { getShortcutRoute, type ShortcutRouteKey } from '@/lib/navigation/shortcutRoutes';
import { FullPageLoader } from './RouteGuard';

export function ShortcutRedirect({ kind }: { kind: ShortcutRouteKey }) {
  const { isSuperadmin, loading, platformRoleLoading } = useAuth();
  const { currentOrg, canManage, userOrgs, isLoadingOrgs } = useOrg();

  if (loading || platformRoleLoading || isLoadingOrgs) {
    return <FullPageLoader />;
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