import { useEffect, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { Skeleton } from '@/components/ui/skeleton';
import PersonalHome from '@/pages/dashboard/PersonalHome';
import { consumePendingAction, safeReturnTo } from '@/lib/pendingAction';

/**
 * /dashboard — friction-free resolver:
 *  A. Pending/interrupted action → resume it.
 *  B. currentOrg already selected and manageable → /admin.
 *  C. Any manageable workspaces → auto-pick last-used (localStorage) or the
 *     first manageable one, set it as current, → /admin.
 *  D. Zero manageable workspaces → unified account home.
 *
 * Never renders a full-page workspace chooser. Explicit switching happens
 * from the OrgSwitcher in the sidebar / avatar menu.
 */
export default function DashboardRouter() {
  const { user, loading } = useAuth();
  const { currentOrg, userOrgs, canManage, setCurrentOrg, isLoadingOrgs } = useOrg();
  const navigate = useNavigate();

  // A) resume pending action if present
  useEffect(() => {
    if (!user) return;
    const pa = consumePendingAction();
    const dest = pa ? safeReturnTo(pa.returnTo) : null;
    if (dest) navigate(dest, { replace: true });
  }, [user, navigate]);

  const manageableOrgs = useMemo(
    () => userOrgs.filter((o) => canManage(o.id)),
    [userOrgs, canManage],
  );

  // C) auto-select the last-used or first manageable workspace
  useEffect(() => {
    if (!user || isLoadingOrgs) return;
    if (currentOrg && canManage(currentOrg.id)) return;
    if (manageableOrgs.length === 0) return;

    let pick = manageableOrgs[0];
    try {
      const saved = localStorage.getItem('sv_current_org_id');
      if (saved) {
        const found = manageableOrgs.find((o) => o.id === saved);
        if (found) pick = found;
      }
    } catch {}
    setCurrentOrg(pick);
  }, [user, isLoadingOrgs, currentOrg, canManage, manageableOrgs, setCurrentOrg]);

  if (loading || isLoadingOrgs || !user) {
    return (
      <div className="container max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }
  // Capabilities are cumulative: the unified home is the single entry point for
  // everyone. Users with a space reach /admin from the "Mon espace" block or the
  // sidebar — we never redirect away and hide their library / earnings.
  return <PersonalHome />;
}

