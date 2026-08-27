/**
 * AdminShell — lightweight wrapper for admin routes inside AppLayout.
 * Handles org check only. Navigation is handled by the Sidebar.
 * Replaces the old AdminLayout which had its own sidebar + header.
 */
import { Suspense } from 'react';
import { docLang } from '@/lib/doc-lang';
import { Outlet, useNavigate } from '@/lib/router-compat';
import { useOrg } from '@/contexts/OrgContext';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { EmptyState } from '@/components/ui/EmptyState';
import { RouteContentSkeleton } from '@/components/layout/RouteFallback';


export default function AdminShell() {
  const { currentOrg, isLoadingOrgs } = useOrg();
  const navigate = useNavigate();

  if (isLoadingOrgs && !currentOrg) {
    return <RouteContentSkeleton />;
  }

  if (!currentOrg) {
    return (
      <EmptyState
        title={docLang() === 'fr' ? "Aucune organisation sélectionnée" : "No organization selected"}
        description={docLang() === 'fr' ? "Créez ou sélectionnez une organisation pour accéder au panneau d'administration." : "Create or select an organization to access the admin panel."}
        action={{ label: docLang() === 'fr' ? 'Créer une organisation' : 'Create organization', onClick: () => navigate('/create-org') }}
        className="min-h-[40dvh]"
      />
    );
  }

  return (
    <div className="min-h-full flex flex-col p-3 sm:p-4 lg:p-6">
      <div className="flex-1">
        <Suspense fallback={<RouteContentSkeleton />}>
          <Outlet />
        </Suspense>
      </div>
      <OnboardingTour />
    </div>
  );
}

