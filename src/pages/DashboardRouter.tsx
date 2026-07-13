import { useEffect, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import PersonalHome from '@/pages/dashboard/PersonalHome';
import { consumePendingAction, safeReturnTo } from '@/lib/pendingAction';
import { useI18n } from '@/i18n/I18nContext';
import { brandUrl } from '@/lib/storageUrl';
import { Building2, Plus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * /dashboard — smart resolver:
 *  1. Interrupted action → resume it.
 *  2. currentOrg selected and manageable → /admin.
 *  3. Exactly one manageable workspace and no saved selection → auto-select + /admin.
 *  4. Multiple manageable workspaces, no saved selection → inline chooser.
 *  5. Zero manageable workspaces → unified account home (PersonalHome).
 */
export default function DashboardRouter() {
  const { user, loading } = useAuth();
  const { currentOrg, userOrgs, canManage, setCurrentOrg, isLoadingOrgs } = useOrg();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  // 1) resume pending action if present
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

  // 3) auto-select the single manageable workspace
  useEffect(() => {
    if (!user || isLoadingOrgs) return;
    if (currentOrg) return;
    if (manageableOrgs.length === 1) {
      setCurrentOrg(manageableOrgs[0]);
    }
  }, [user, isLoadingOrgs, currentOrg, manageableOrgs, setCurrentOrg]);

  if (loading || isLoadingOrgs || !user) {
    return (
      <div className="container max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  // 2) currentOrg set and manageable → workspace admin
  if (currentOrg && canManage(currentOrg.id)) {
    return <Navigate to="/admin" replace />;
  }

  // 4) multiple manageable, none selected → chooser
  if (manageableOrgs.length > 1) {
    return (
      <div className="container max-w-2xl px-4 py-8 space-y-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {isFr ? 'Espace à gérer' : 'Workspace'}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">
            {isFr ? 'Choisissez un espace à gérer' : 'Choose a workspace to manage'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isFr
              ? 'Sélectionnez l’activité que vous voulez ouvrir.'
              : 'Pick the business you want to open.'}
          </p>
        </div>

        <div className="grid gap-2">
          {manageableOrgs.map((org) => {
            const logo = brandUrl(org.logo_url);
            const initials = org.name.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
            return (
              <button
                key={org.id}
                onClick={() => { setCurrentOrg(org); navigate('/admin'); }}
                className={cn(
                  'w-full flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left',
                  'hover:border-primary/40 hover:bg-primary/5 active:scale-[0.99] transition-all',
                )}
              >
                <div className="h-11 w-11 rounded-xl overflow-hidden shrink-0 bg-primary/10 grid place-items-center">
                  {logo ? (
                    <img src={logo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-primary">{initials}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{org.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {isFr ? 'Ouvrir l’espace de gestion' : 'Open management workspace'}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 rounded-xl border-dashed"
          onClick={() => navigate('/create-org')}
        >
          <Plus className="h-3.5 w-3.5" />
          {isFr ? 'Créer un nouvel espace' : 'Create a new workspace'}
        </Button>

        <Button variant="ghost" size="sm" className="w-full gap-2" onClick={() => navigate('/dashboard/explore')}>
          <Building2 className="h-3.5 w-3.5" />
          {isFr ? 'Continuer sans espace' : 'Continue without a workspace'}
        </Button>
      </div>
    );
  }

  // 5) zero manageable workspaces → account home
  return <PersonalHome />;
}
