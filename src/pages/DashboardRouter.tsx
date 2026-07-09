import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { Skeleton } from '@/components/ui/skeleton';
import UserDashboard from '@/pages/UserDashboard';
import { useOrgFeatures } from '@/hooks/useOrgFeatures';
import ChurchProDashboard from '@/pages/church/ChurchProDashboard';
import BeautyProOverview from '@/pages/beauty/pro/BeautyProOverview';
import HomeProOverview from '@/pages/home/pro/HomeProOverview';
import EventsProOverview from '@/pages/events/pro/EventsProOverview';
import EducationProOverview from '@/pages/education/pro/EducationProOverview';

/**
 * Unified personal dashboard. UserDashboard already adapts to the user's
 * profile (buyer / creator / ambassador / org) and the currently selected
 * workspace type via useAdaptiveLabels + the sidebar. We intentionally do
 * NOT branch to a separate per-vertical dashboard here.
 */
export default function DashboardRouter() {
  const { user } = useAuth();
  const { isLoadingOrgs } = useOrg();
  const { type, org } = useOrgFeatures();

  if (isLoadingOrgs || !user) {
    return (
      <div className="container max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  if (org?.type_confirmed_at) {
    switch (type) {
      case 'church':
        return <ChurchProDashboard />;
      case 'beauty':
        return <BeautyProOverview />;
      case 'artisans_home_services':
        return <HomeProOverview />;
      case 'tutors_home_teachers':
        return <EducationProOverview />;
      case 'instrumentists':
      case 'services':
      case 'sport':
      case 'influencers':
        return <EventsProOverview />;
      default:
        break;
    }
  }

  return <UserDashboard />;
}
