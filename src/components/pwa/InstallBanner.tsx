import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const DISMISS_KEY = 'sv_install_banner_dismissed';
const DISMISS_DAYS = 7;

export function InstallBanner() {
  const { isInstalled, isIOS, canInstall, promptInstall } = usePWAInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInstalled || !canInstall) return;

    // Check if previously dismissed
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }

    // Show after 5 seconds
    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, [isInstalled, canInstall]);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  const handleInstall = async () => {
    if (isIOS) {
      // Can't auto-prompt on iOS — just keep showing instructions
      return;
    }
    const accepted = await promptInstall();
    if (accepted) setVisible(false);
  };

  if (isInstalled || !visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-20 lg:bottom-6 left-4 right-4 z-[60] max-w-md mx-auto"
      >
        <div className="bg-card border border-border rounded-2xl p-4 shadow-elevated">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Installer Siteviral
              </p>
              {isIOS ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Appuyez sur <Share className="inline h-3 w-3 mx-0.5" /> puis{' '}
                  <strong>« Sur l'écran d'accueil »</strong>{' '}
                  <Plus className="inline h-3 w-3 mx-0.5" />
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ajoutez l'app sur votre appareil pour un accès rapide et hors ligne
                </p>
              )}
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!isIOS && (
            <Button
              size="sm"
              className="w-full mt-3 bg-primary text-primary-foreground gap-2"
              onClick={handleInstall}
            >
              <Download className="h-4 w-4" /> Installer maintenant
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
