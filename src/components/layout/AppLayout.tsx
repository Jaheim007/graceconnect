import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useOrg } from '@/contexts/OrgContext';

const HIDE_NAV_ROUTES = ['/auth', '/reels'];

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12 } },
};

export function AppLayout() {
  const location = useLocation();
  const { userOrgs } = useOrg();
  const hideNav = HIDE_NAV_ROUTES.some((r) => location.pathname.startsWith(r));

  // Realtime subscriptions for messages & notifications
  useRealtimeNotifications(userOrgs.map(o => o.id));

  return (
    <div className="min-h-[100dvh] flex w-full bg-background overflow-x-hidden">
      {/* Desktop Sidebar */}
      {!hideNav && (
        <div className="hidden lg:flex">
          <Sidebar />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {!hideNav && <TopBar />}
        <main className={`flex-1 overflow-x-hidden ${!hideNav ? 'pb-16 lg:pb-0' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      {!hideNav && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
          <BottomNav />
        </div>
      )}
    </div>
  );
}

