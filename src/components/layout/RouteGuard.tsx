import { ReactNode, useEffect, useState } from 'react';
import { Navigate as Nav, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { RouteContentSkeleton } from './RouteFallback';
import { Loader2 } from 'lucide-react';

// True once the app has successfully rendered a guarded screen. After that,
// guards must never show a full-page loader again — internal navigation only
// ever swaps content, using an in-place skeleton when data is still hydrating.
let appBooted = false;

function GuardFallback() {
  return appBooted ? <RouteContentSkeleton /> : <FullPageLoader />;
}


// Require auth and globally hydrate workspace before signed-in shells render.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { workspaceReady } = useOrg();
  const location = useLocation();

  const oauthPending = (() => {
    try {
      const startedAt = sessionStorage.getItem('sv_oauth_pending_since');
      if (!startedAt) return false;
      return Date.now() - Number(startedAt) < 45_000;
    } catch {
      return false;
    }
  })();

  if (loading || oauthPending) return <GuardFallback />;

  if (!user) {
    // Preserve current URL (including search params like ?partner=CODE) so user returns after auth
    const returnTo = location.pathname + location.search;
    const authUrl = returnTo !== '/' ? `/auth?returnTo=${encodeURIComponent(returnTo)}` : '/auth';
    // Also persist in sessionStorage for OAuth flows (Google redirect loses URL params)
    if (returnTo !== '/') {
      try { sessionStorage.setItem('sv_auth_returnTo', returnTo); } catch {}
    }
    return <Nav to={authUrl} replace />;
  }

  if (!workspaceReady) return <GuardFallback />;

  appBooted = true;
  return <>{children}</>;
}

// Require superadmin
export function RequireSuperadmin({ children }: { children: ReactNode }) {
  const { user, loading, isSuperadmin, platformRoleLoading } = useAuth();
  if (loading || platformRoleLoading) return <GuardFallback />;
  if (!user) return <Nav to="/auth" replace />;
  if (!isSuperadmin) return <Nav to="/feed" replace />;
  appBooted = true;
  return <>{children}</>;
}

// Require org manage role (owner/admin/editor). Root workspace hydration should
// already have selected a manageable workspace; this guard only repairs rare
// direct admin loads and sends true zero-workspace users to creation.
export function RequireOrgManage({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { currentOrg, currentOrgRole, isLoadingOrgs, userOrgs, canManage, setCurrentOrg, refetchOrgs } = useOrg();
  const [checkingWorkspace, setCheckingWorkspace] = useState(false);
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || loading || isLoadingOrgs || currentOrg || userOrgs.length > 0 || checkedUserId === user.id) return;
    setCheckedUserId(user.id);
    setCheckingWorkspace(true);
    void refetchOrgs().finally(() => setCheckingWorkspace(false));
  }, [user, loading, isLoadingOrgs, currentOrg, userOrgs.length, checkedUserId, refetchOrgs]);

  if (loading) return <GuardFallback />;
  if (!user) return <Nav to="/auth" replace />;
  if (isLoadingOrgs || checkingWorkspace || (user && !currentOrg && userOrgs.length === 0 && checkedUserId !== user.id)) return <GuardFallback />;

  if (!currentOrg) {
    const firstManageable = userOrgs.find((o) => canManage(o.id));
    if (firstManageable) {
      setCurrentOrg(firstManageable);
      return <GuardFallback />;
    }
    return <Nav to="/create-org" replace />;
  }

  const allowed = ['owner', 'admin', 'editor'].includes(currentOrgRole || '') || canManage(currentOrg.id);
  if (!allowed) {
    // The active workspace isn't manageable — switch to one that is instead of
    // silently bouncing the user to Discover.
    const firstManageable = userOrgs.find((o) => canManage(o.id));
    if (firstManageable && firstManageable.id !== currentOrg.id) {
      setCurrentOrg(firstManageable);
      return <GuardFallback />;
    }
    return <Nav to="/dashboard" replace />;
  }


  appBooted = true;
  return <>{children}</>;
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-14 w-14 rounded-full border-2 border-primary/30 flex items-center justify-center bg-background shadow-lg shadow-primary/10">
            <img src="/logo-s.png" alt="Siteviral" className="h-9 w-9 object-contain animate-pulse" />
          </div>
          <div className="absolute inset-0 h-14 w-14 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        </div>
        <p className="text-xs text-muted-foreground font-medium animate-pulse">Chargement…</p>
      </div>
    </div>
  );
}
