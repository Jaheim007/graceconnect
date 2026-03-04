import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Prompt banner that appears after a delay to invite users
 * to activate browser push notifications.
 * Shows only once per session and respects dismissal.
 */
export function PushNotificationPrompt() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, subscribe, loading } = usePushNotifications();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user || !isSupported || isSubscribed || dismissed) return;

    // Check if already dismissed this session or permanently
    const wasDismissed = sessionStorage.getItem('push-prompt-dismissed');
    const wasPermanentlyDismissed = localStorage.getItem('push-prompt-never');
    if (wasDismissed || wasPermanentlyDismissed) {
      setDismissed(true);
      return;
    }

    // Also check if notification permission is already granted or denied
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted' || Notification.permission === 'denied') {
        setDismissed(true);
        return;
      }
    }

    // Show after 8 seconds
    const timer = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(timer);
  }, [user, isSupported, isSubscribed, dismissed]);

  const handleSubscribe = async () => {
    await subscribe();
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem('push-prompt-dismissed', '1');
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem('push-prompt-dismissed', '1');
  };

  const handleNever = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem('push-prompt-never', '1');
  };

  if (!user || !isSupported || isSubscribed || dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-[100]"
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  🔔 Activez les notifications
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recevez les dernières nouvelles, vos achats et offres directement sur votre appareil !
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={handleSubscribe}
                disabled={loading}
              >
                <Bell className="h-3.5 w-3.5" />
                {loading ? 'Activation...' : 'Activer'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground"
                onClick={handleNever}
              >
                Plus tard
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
