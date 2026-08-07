import { ReactNode, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { RouteContentSkeleton } from './RouteFallback';


import { PublicTopBar } from './PublicTopBar';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { LandingNav } from '@/components/landing/LandingNav';
import { CommandPalette } from '@/components/command/CommandPalette';
import { cn } from '@/lib/utils';
import { isNativePlatform } from '@/lib/capacitor';

const pageVariants = {
  initial: { opacity: 0, scale: 0.96, filter: 'blur(6px)' },
  animate: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    filter: 'blur(4px)',
    transition: { duration: 0.15, ease: 'easeIn' as const },
  },
};

/**
 * AdaptiveLayout — Shows AppLayout chrome (sidebar, topbar, bottom nav)
 * when user is logged in, or LandingNav for guests.
 * Used by hybrid pages like /ecrire, /gagner, /vendre, /migrer.
 */
export function AdaptiveLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isLoadingOrgs } = useOrg();
  const location = useLocation();
  const nativeApp = isNativePlatform();

  if (!user) {
    // Guest: landing-style page
    return (
      <div className={cn('bg-background', nativeApp ? 'native-public-screen flex flex-col' : 'min-h-screen')}>
        {nativeApp ? <PublicTopBar /> : <LandingNav />}
        <main
          id="main-content"
          role="main"
          className={cn(
            'flex-1 pb-24 lg:pb-0',
            nativeApp
              ? 'native-main-scroll no-bottom-nav min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain'
              : 'pt-14'
          )}
        >
        {children}
        </main>
        {/* BottomNav is now rendered globally by GlobalBottomNav */}
      </div>
    );
  }

  if (isLoadingOrgs) {
    return <FullPageLoader />;
  }

  // Authenticated: full app shell
  return (
    <div className="native-app-shell h-[100dvh] flex w-full bg-background overflow-hidden">
      <nav className="hidden lg:flex shrink-0" aria-label="Navigation principale">
        <Sidebar />
      </nav>

      <div className="flex flex-col flex-1 min-w-0 h-full">
        <TopBar />
        <main className="native-main-scroll flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* BottomNav is now rendered globally by GlobalBottomNav */}
      <CommandPalette />
    </div>
  );
}
