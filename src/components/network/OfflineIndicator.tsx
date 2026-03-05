import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

/**
 * OfflineIndicator — Shows a persistent banner when the user loses
 * internet connectivity, and a brief "back online" message on reconnect.
 */
export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
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
      {showReconnected && !isOffline && (
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
