/**
 * AdminShell — lightweight wrapper for admin routes inside AppLayout.
 * Handles org check only. Navigation is handled by the Sidebar.
 * Replaces the old AdminLayout which had its own sidebar + header.
 */
import { Outlet, useNavigate } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader2 } from 'lucide-react';

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
        title="Aucune organisation sélectionnée"
        description="Créez ou sélectionnez une organisation pour accéder au panneau d'administration."
        action={{ label: 'Créer une organisation', onClick: () => navigate('/create-org') }}
        className="min-h-[40dvh]"
      />
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <Outlet />
      <OnboardingTour />
    </div>
  );
}
