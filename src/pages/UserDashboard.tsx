import { useMode } from '@/contexts/ModeContext';
import { lazy, Suspense } from 'react';

const AmbassadorDashboard = lazy(() => import('@/pages/AmbassadorDashboard'));
const CreatorDashboard = lazy(() => import('@/pages/CreatorDashboard'));

const Loader = () => (
  <div className="min-h-[40dvh] flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

export default function UserDashboard() {
  const { mode } = useMode();

  return (
    <Suspense fallback={<Loader />}>
      {mode === 'creator' ? <CreatorDashboard /> : <AmbassadorDashboard />}
    </Suspense>
  );
}
