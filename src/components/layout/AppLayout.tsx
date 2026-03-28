import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useOrg } from '@/contexts/OrgContext';
import { InstallBanner } from '@/components/pwa/InstallBanner';
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
  const { userOrgs } = useOrg();
  const hideNav = HIDE_NAV_ROUTES.some((r) => location.pathname.startsWith(r));

  useRealtimeNotifications(userOrgs.map(o => o.id));
  useNewUserRedirect();

  return (
    <CompareProvider>
    <SkipToContent />
    <OfflineIndicator />
    <div className="h-[100dvh] flex w-full bg-background overflow-hidden">
      {!hideNav && (
        <nav className="hidden lg:flex shrink-0" aria-label="Navigation principale">
          <Sidebar />
        </nav>
      )}

      <div className="flex flex-col flex-1 min-w-0 h-full">
        {!hideNav && <TopBar />}
        <main id="main-content" role="main" className={`flex-1 overflow-y-auto overflow-x-hidden ${!hideNav ? 'pb-16 lg:pb-0' : ''}`}>
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

      {!hideNav && (
        <nav id="bottom-nav" aria-label="Navigation mobile" className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
          <BottomNav />
        </nav>
      )}

      <CommandPalette />
      <InstallBanner />
      <PushNotificationPrompt />
      <BackToTopProgress />
      <CookieConsent />
      <FloatingHelpWidget />
      <KeyboardShortcutsModal />
    </div>
    </CompareProvider>
  );
}
