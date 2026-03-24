export type ShortcutRouteKey = 'wallet' | 'kyc' | 'settings';

interface ShortcutRouteContext {
  canManageCurrentOrg: boolean;
  hasOrganizations: boolean;
  isSuperadmin: boolean;
}

export function getShortcutRoute(
  key: ShortcutRouteKey,
  { canManageCurrentOrg, hasOrganizations, isSuperadmin }: ShortcutRouteContext
) {
  switch (key) {
    case 'wallet':
      if (isSuperadmin && !canManageCurrentOrg) return '/superadmin/transactions';
      if (canManageCurrentOrg) return '/admin/sales';
      return '/invoices';

    case 'kyc':
      if (isSuperadmin && !canManageCurrentOrg) return '/superadmin/kyc';
      if (canManageCurrentOrg) return '/admin/kyc';
      return hasOrganizations ? '/dashboard' : '/create-org';

    case 'settings':
      if (isSuperadmin && !canManageCurrentOrg) return '/superadmin/settings';
      if (canManageCurrentOrg) return '/admin/settings';
      return '/notification-preferences';
  }
}