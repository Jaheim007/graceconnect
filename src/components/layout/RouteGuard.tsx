import { ReactNode } from 'react';
import { Navigate as Nav } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { Loader2 } from 'lucide-react';

// Require auth — only blocks on auth loading, never on profile/org
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Nav to="/auth" replace />;
  return <>{children}</>;
}

// Require superadmin
export function RequireSuperadmin({ children }: { children: ReactNode }) {
  const { user, loading, isSuperadmin } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Nav to="/auth" replace />;
  if (!isSuperadmin) return <Nav to="/feed" replace />;
  return <>{children}</>;
}

// Require org manage role (owner/admin/editor)
// Shows loader while orgs are loading — never redirects during loading phase
export function RequireOrgManage({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { currentOrg, currentOrgRole, isLoadingOrgs } = useOrg();

  // Block only on auth loading
  if (loading) return <FullPageLoader />;
  if (!user) return <Nav to="/auth" replace />;

  // While org memberships are loading, keep showing loader — don't redirect
  if (isLoadingOrgs) return <FullPageLoader />;

  // If done loading and still no org, send to discover — not create-org
  // (create-org should only be visited intentionally)
  if (!currentOrg) return <Nav to="/discover" replace />;

  const allowed = ['owner', 'admin', 'editor'].includes(currentOrgRole || '');
  if (!allowed) return <Nav to="/feed" replace />;

  return <>{children}</>;
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-xl gold-gradient flex items-center justify-center">
          <span className="text-sm font-bold text-primary-foreground">GC</span>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    </div>
  );
}
