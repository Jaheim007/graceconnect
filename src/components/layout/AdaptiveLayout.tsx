import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { PublicTopBar } from './PublicTopBar';
import { useAuth } from '@/contexts/AuthContext';
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
  const location = useLocation();
  const nativeApp = isNativePlatform();

  if (!user) {
    // Guest: landing-style page
    return (
      <div className={cn('bg-background', nativeApp ? 'native-public-screen flex flex-col' : 'min-h-screen')}>
        {nativeApp ? <PublicTopBar /> : <LandingNav />}
        <main className={cn('flex-1', nativeApp ? 'native-main-scroll no-bottom-nav' : 'pt-14')}>
          {children}
        </main>
      </div>
    );
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

      <nav className="native-bottom-nav-shell fixed bottom-0 left-0 right-0 z-50 lg:hidden" aria-label="Navigation mobile">
        <BottomNav />
      </nav>
      <CommandPalette />
    </div>
  );
}
