import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { RouteContentSkeleton } from './RouteFallback';


import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useOrg } from '@/contexts/OrgContext';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { PWAUpdateToast } from '@/components/pwa/PWAUpdateToast';
import { PushNotificationPrompt } from '@/components/pwa/PushNotificationPrompt';
import { useNewUserRedirect } from '@/hooks/useNewUserRedirect';
import { CommandPalette } from '@/components/command/CommandPalette';
import { CompareProvider } from '@/components/products/ProductCompareDrawer';
import { CookieConsent } from '@/components/legal/CookieConsent';

import { SkipToContent } from '@/components/a11y/SkipToContent';
import { KeyboardShortcutsModal } from '@/components/a11y/KeyboardShortcutsModal';
import { OfflineIndicator } from '@/components/network/OfflineIndicator';
import { UpgradeMigrationModal } from '@/components/siteviral/UpgradeMigrationModal';

const HIDE_NAV_ROUTES = ['/auth', '/reels'];

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.12, ease: 'easeIn' as const },
  },
};


/**
 * AppLayout — Unified shell for all authenticated users.
 * Sidebar always shows all sections (Mon espace, Gagner, Ma plateforme).
 */
export function AppLayout() {
  const location = useLocation();
  const { userOrgs, isLoadingOrgs } = useOrg();
  const hideNav = HIDE_NAV_ROUTES.some((r) => location.pathname.startsWith(r));

  useRealtimeNotifications(userOrgs.map(o => o.id));
  useNewUserRedirect();

  // No full-page loader here: RequireAuth already waits for the first workspace
  // hydration. Later workspace changes keep the shell mounted and only the
  // content area shows its own in-place skeleton.


  return (
    <CompareProvider>
    <SkipToContent />
    <OfflineIndicator />
    <div className="native-app-shell app-ambient h-[100dvh] flex w-full overflow-hidden">
      {!hideNav && (
        <nav className="hidden lg:flex shrink-0" aria-label="Navigation principale">
          <Sidebar />
        </nav>
      )}

      <div className="flex flex-col flex-1 min-w-0 h-full">
        {!hideNav && <TopBar />}
        <main id="main-content" role="main" className={`native-main-scroll flex-1 overflow-y-auto overflow-x-hidden overscroll-contain ${!hideNav ? 'pb-24 lg:pb-0' : 'no-bottom-nav'}`}>
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
          >
            <Suspense fallback={<RouteContentSkeleton />}>
              <Outlet />
            </Suspense>
          </motion.div>
        </main>
      </div>


      {/* BottomNav is now rendered globally by GlobalBottomNav */}

      <CommandPalette />
      <InstallBanner />
      <PWAUpdateToast />
      <PushNotificationPrompt />
      <CookieConsent />

      <KeyboardShortcutsModal />
    </div>
    </CompareProvider>
  );
}
