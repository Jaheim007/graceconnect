/**
 * AdminShell — lightweight wrapper for admin routes inside AppLayout.
 * Handles org check only. Navigation is handled by the Sidebar.
 * Replaces the old AdminLayout which had its own sidebar + header.
 */
import { Suspense } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { EmptyState } from '@/components/ui/EmptyState';
import { RouteContentSkeleton } from '@/components/layout/RouteFallback';


export default function AdminShell() {
  const { currentOrg, isLoadingOrgs } = useOrg();
  const navigate = useNavigate();

  if (isLoadingOrgs && !currentOrg) {
    return (
      <div className="min-h-[40dvh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <EmptyState
        title={document.documentElement.lang === 'fr' ? "Aucune organisation sélectionnée" : "No organization selected"}
        description={document.documentElement.lang === 'fr' ? "Créez ou sélectionnez une organisation pour accéder au panneau d'administration." : "Create or select an organization to access the admin panel."}
        action={{ label: document.documentElement.lang === 'fr' ? 'Créer une organisation' : 'Create organization', onClick: () => navigate('/create-org') }}
        className="min-h-[40dvh]"
      />
    );
  }

  return (
    <div className="min-h-full flex flex-col p-3 sm:p-4 lg:p-6">
      <div className="flex-1">
        <Outlet />
      </div>
      <OnboardingTour />
    </div>
  );
}
