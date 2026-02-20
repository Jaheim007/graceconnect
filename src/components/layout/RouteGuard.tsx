import { ReactNode } from 'react';
import { Navigate as Nav } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { Loader2 } from 'lucide-react';

// Require auth
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
export function RequireOrgManage({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { currentOrg, currentOrgRole, isLoadingOrgs } = useOrg();

  if (loading || isLoadingOrgs) return <FullPageLoader />;
  if (!user) return <Nav to="/auth" replace />;
  if (!currentOrg) return <Nav to="/discover" replace />;

  const allowed = ['owner', 'admin', 'editor'].includes(currentOrgRole || '');
  if (!allowed) return <Nav to="/feed" replace />;

  return <>{children}</>;
}

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-xl gold-gradient flex items-center justify-center animate-pulse-gold">
          <span className="text-sm font-bold text-primary-foreground">GC</span>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    </div>
  );
}
