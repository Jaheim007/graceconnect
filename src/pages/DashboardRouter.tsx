import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import PersonalHome from '@/pages/dashboard/PersonalHome';

/**
 * /dashboard is always the account-wide customer home.
 * Managing a workspace happens under /admin/*, which honors the
 * currently selected org from OrgContext.
 */
export default function DashboardRouter() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="container max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  return <PersonalHome />;
}
