import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { FullPageLoader } from './RouteGuard';

import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useOrg } from '@/contexts/OrgContext';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { PWAUpdateToast } from '@/components/pwa/PWAUpdateToast';
import { PushNotificationPrompt } from '@/components/pwa/PushNotificationPrompt';
import { useNewUserRedirect } from '@/hooks/useNewUserRedirect';
import { CommandPalette } from '@/components/command/CommandPalette';
import { CompareProvider } from '@/components/products/ProductCompareDrawer';
import { CookieConsent } from '@/components/legal/CookieConsent';
import { FloatingHelpWidget } from '@/components/help/FloatingHelpWidget';
import { SkipToContent } from '@/components/a11y/SkipToContent';
import { KeyboardShortcutsModal } from '@/components/a11y/KeyboardShortcutsModal';
import { OfflineIndicator } from '@/components/network/OfflineIndicator';
import { BackToTopProgress } from '@/components/ui/BackToTopProgress';
import { UpgradeMigrationModal } from '@/components/siteviral/UpgradeMigrationModal';

const HIDE_NAV_ROUTES = ['/auth', '/reels'];

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
 * AppLayout — Unified shell for all authenticated users.
 * Sidebar always shows all sections (Mon espace, Gagner, Ma plateforme).
 */
export function AppLayout() {
  const location = useLocation();
  const { userOrgs, isLoadingOrgs } = useOrg();
  const hideNav = HIDE_NAV_ROUTES.some((r) => location.pathname.startsWith(r));

  useRealtimeNotifications(userOrgs.map(o => o.id));
  useNewUserRedirect();

  if (!hideNav && isLoadingOrgs) {
    return <FullPageLoader />;
  }

  return (
    <CompareProvider>
    <SkipToContent />
    <OfflineIndicator />
    <div className="native-app-shell h-[100dvh] flex w-full bg-background overflow-hidden">
      {!hideNav && (
        <nav className="hidden lg:flex shrink-0" aria-label="Navigation principale">
          <Sidebar />
        </nav>
      )}

      <div className="flex flex-col flex-1 min-w-0 h-full">
        {!hideNav && <TopBar />}
        <main id="main-content" role="main" className={`native-main-scroll flex-1 overflow-y-auto overflow-x-hidden overscroll-contain ${!hideNav ? 'pb-24 lg:pb-0' : 'no-bottom-nav'}`}>
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

      {/* BottomNav is now rendered globally by GlobalBottomNav */}

      <CommandPalette />
      <InstallBanner />
      <PWAUpdateToast />
      <PushNotificationPrompt />
      <BackToTopProgress />
      <CookieConsent />
      <FloatingHelpWidget />
      <KeyboardShortcutsModal />
    </div>
    </CompareProvider>
  );
}
