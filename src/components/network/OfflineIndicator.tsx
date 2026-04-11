import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useState, useEffect } from 'react';

/**
 * OfflineIndicator — Unified offline/online banner.
 * Uses Capacitor Network plugin on native, browser events on web/PWA.
 */
export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const t = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isOnline, wasOffline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-center gap-2 text-xs font-medium"
        >
          <WifiOff className="h-3.5 w-3.5" />
          {isFr ? 'Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées.' : 'You are offline. Some features may be limited.'}
        </motion.div>
      )}
      {showReconnected && isOnline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-emerald-600 text-white px-4 py-2 flex items-center justify-center gap-2 text-xs font-medium"
        >
          <Wifi className="h-3.5 w-3.5" />
          {isFr ? 'Connexion rétablie !' : 'Back online!'}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
