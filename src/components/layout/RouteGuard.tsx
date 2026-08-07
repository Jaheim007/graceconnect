import { ReactNode } from 'react';
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

  if (loading || oauthPending) return <FullPageLoader />;

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

  if (!workspaceReady) return <FullPageLoader />;

  return <>{children}</>;
}

// Require superadmin
export function RequireSuperadmin({ children }: { children: ReactNode }) {
  const { user, loading, isSuperadmin, platformRoleLoading } = useAuth();
  if (loading || platformRoleLoading) return <FullPageLoader />;
  if (!user) return <Nav to="/auth" replace />;
  if (!isSuperadmin) return <Nav to="/feed" replace />;
  return <>{children}</>;
}

// Require org manage role (owner/admin/editor). Root workspace hydration should
// already have selected a manageable workspace; this guard only repairs rare
// direct admin loads and sends true zero-workspace users to creation.
export function RequireOrgManage({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { currentOrg, currentOrgRole, isLoadingOrgs, userOrgs, canManage, setCurrentOrg } = useOrg();

  if (loading) return <FullPageLoader />;
  if (!user) return <Nav to="/auth" replace />;
  if (isLoadingOrgs) return <FullPageLoader />;

  if (!currentOrg) {
    const firstManageable = userOrgs.find((o) => canManage(o.id));
    if (firstManageable) {
      setCurrentOrg(firstManageable);
      return <FullPageLoader />;
    }
    return <Nav to="/create-org" replace />;
  }

  const allowed = ['owner', 'admin', 'editor'].includes(currentOrgRole || '');
  if (!allowed) return <Nav to="/feed" replace />;

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
