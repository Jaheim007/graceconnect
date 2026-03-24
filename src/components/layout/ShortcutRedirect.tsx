import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { getShortcutRoute, type ShortcutRouteKey } from '@/lib/navigation/shortcutRoutes';

export function ShortcutRedirect({ kind }: { kind: ShortcutRouteKey }) {
  const { isSuperadmin } = useAuth();
  const { currentOrg, canManage, userOrgs } = useOrg();

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