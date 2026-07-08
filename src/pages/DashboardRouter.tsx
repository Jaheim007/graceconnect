import { lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import UserDashboard from '@/pages/UserDashboard';
import DigitalProductDashboard from '@/pages/dashboard/DigitalProductDashboard';

const ChurchProDashboard = lazy(() => import('@/pages/church/ChurchProDashboard'));
const HomeProDashboard = lazy(() => import('@/pages/home/HomeProDashboard'));
const BeautyProDashboard = lazy(() => import('@/pages/beauty/BeautyProDashboard'));
const EventsProDashboard = lazy(() => import('@/pages/events/EventsProDashboard'));
const EducationTutorDashboard = lazy(() => import('@/pages/education/EducationTutorDashboard'));

/**
 * Unified Dashboard — no more mode-based routing.
 * Skips WelcomeIntent if user already has orgs (returning user).
 */
export default function DashboardRouter() {
  const { user } = useAuth();
  const { currentOrg, userOrgs, isLoadingOrgs } = useOrg();

  const { isLoading: stateLoading } = useQuery({
    queryKey: ['dashboard-state', user?.id],
    queryFn: async () => {
      if (!user) return null;
      return true;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  if (isLoadingOrgs || stateLoading) {
    return (
      <div className="container max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  const org = currentOrg ?? userOrgs[0] ?? null;
  const type = org?.siteviral_type;

  const dashboard = (() => {
    switch (type) {
      case 'church':
        return <ChurchProDashboard />;
      case 'artisans_home_services':
        return <HomeProDashboard />;
      case 'beauty':
        return <BeautyProDashboard />;
      case 'sport':
      case 'instrumentists':
        return <EventsProDashboard />;
      case 'tutors_home_teachers':
        return <EducationTutorDashboard />;
      case 'digital_products':
      case 'influencers':
      case 'services':
        return <DigitalProductDashboard />;
      default:
        return userOrgs.length > 0 ? <DigitalProductDashboard /> : <UserDashboard />;
    }
  })();

  return (
    <Suspense fallback={<div className="container max-w-2xl px-4 py-8"><Skeleton className="h-32 w-full rounded-2xl" /></div>}>
      {dashboard}
    </Suspense>
  );
}
