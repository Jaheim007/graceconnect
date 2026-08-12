import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus } from 'lucide-react';
import { isNativePlatform } from '@/lib/capacitor';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useI18n } from '@/i18n/I18nContext';

const DISMISS_KEY = 'sv_install_banner_dismissed';
const SHOWN_KEY = 'sv_install_banner_shown_count';
const DISMISS_DAYS = 30;
const MAX_SHOWS = 2;
const AUTO_HIDE_MS = 12000;

export function InstallBanner() {
  const { isInstalled, isIOS, canInstall, promptInstall } = usePWAInstall();
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();

  // Only actual iOS/iPadOS gets the manual "Share → Add to Home Screen" hint.
  // Everywhere else we need a real install prompt, otherwise we stay silent.
  const showable = isIOS ? true : !!canInstall;

  useEffect(() => {
    if (isInstalled || !showable) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }

    const shown = parseInt(localStorage.getItem(SHOWN_KEY) || '0', 10);
    if (shown >= MAX_SHOWS) return;

    // Never compete with the cookie consent banner (same corner on tablets).
    const cookieDecided = (() => {
      try { return !!localStorage.getItem('sv-cookie-consent'); } catch { return false; }
    })();
    if (!cookieDecided) return;

    const timer = setTimeout(() => {
      setVisible(true);
      localStorage.setItem(SHOWN_KEY, String(shown + 1));
    }, 20000);
    return () => clearTimeout(timer);
  }, [isInstalled, showable]);

  // Auto-dismiss so it never lingers in the way.
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  const handleInstall = async () => {
    if (isIOS) return;
    try {
      const accepted = await promptInstall();
      if (accepted) setVisible(false);
    } catch (error) {
      console.error('[PWA] Install banner error:', error);
      setVisible(false);
    }
  };

  if (isInstalled || !visible || isNativePlatform()) return null;


  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed z-[60] left-4 right-4 mx-auto max-w-md bottom-[calc(env(safe-area-inset-bottom,0px)+6rem)] sm:left-auto sm:right-4 sm:mx-0 sm:w-[min(26rem,calc(100vw-2rem))] lg:bottom-6 lg:right-6"
      >
        <div className="bg-card border border-border rounded-2xl p-4 shadow-elevated">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 bg-muted">
              <img src="/logo-s.png" alt="Siteviral" className="h-full w-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {t('pwa.install_title')}
              </p>
              {isIOS ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('pwa.ios_tap')} <Share className="inline h-3 w-3 mx-0.5" /> {t('pwa.ios_then')}{' '}
                  <strong>{t('pwa.ios_add_home')}</strong>{' '}
                  <Plus className="inline h-3 w-3 mx-0.5" />
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('pwa.install_desc')}
                </p>
              )}
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label={t('common.close')}
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
              <Download className="h-4 w-4" /> {t('pwa.install_now')}
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
