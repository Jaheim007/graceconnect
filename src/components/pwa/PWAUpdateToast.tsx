import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';

/**
 * PWAUpdateToast — Listens for SW update events and shows a non-blocking
 * toast with an update button. Replaces the ugly confirm() dialog.
 */
export function PWAUpdateToast() {
  const [updateFn, setUpdateFn] = useState<(() => void) | null>(null);
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.update) {
        setUpdateFn(() => detail.update);
      }
    };
    window.addEventListener('sv:sw-update-available', handler);
    return () => window.removeEventListener('sv:sw-update-available', handler);
  }, []);

  if (!updateFn) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.95 }}
        className="fixed bottom-28 left-4 right-4 z-[90] lg:left-auto lg:right-6 lg:bottom-6 lg:w-80"
      >
        <div className="bg-card border border-border rounded-2xl shadow-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <RefreshCw className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {isFr ? 'Mise à jour disponible' : 'Update available'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isFr ? 'Une nouvelle version est prête' : 'A new version is ready'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setUpdateFn(null)}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" className="h-8 px-3 text-xs" onClick={updateFn}>
              {isFr ? 'Mettre à jour' : 'Update'}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
