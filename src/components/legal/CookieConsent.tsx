import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Cookie, X, Settings2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { isNativePlatform } from '@/lib/capacitor';


const CONSENT_KEY = 'sv-cookie-consent';

type ConsentState = 'undecided' | 'accepted' | 'rejected' | 'custom';

interface CookiePrefs {
  essential: true; // always true
  analytics: boolean;
  marketing: boolean;
}

function getStoredConsent(): { state: ConsentState; prefs: CookiePrefs } | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeConsent(state: ConsentState, prefs: CookiePrefs) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ state, prefs, ts: Date.now() }));
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>({ essential: true, analytics: true, marketing: false });
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const nativeApp = isNativePlatform();

  useEffect(() => {
    // Never show cookie consent on native apps (no browser cookies)
    if (nativeApp) return;
    const stored = getStoredConsent();
    if (!stored) {
      // Delay showing the banner to not overwhelm users
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allPrefs: CookiePrefs = { essential: true, analytics: true, marketing: true };
    storeConsent('accepted', allPrefs);
    setVisible(false);
  };

  const handleRejectAll = () => {
    const minPrefs: CookiePrefs = { essential: true, analytics: false, marketing: false };
    storeConsent('rejected', minPrefs);
    setVisible(false);
  };

  const handleSavePrefs = () => {
    storeConsent('custom', prefs);
    setVisible(false);
  };

  // Rendered in a portal so no transformed / filtered ancestor (app ambient shell,
  // motion wrappers) can reposition or clip the fixed banner — this is what made it
  // float in the wrong place on iPad / tablets.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed z-[120] inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] w-auto max-w-[26rem] mx-auto sm:mx-0 sm:inset-x-auto sm:right-4 sm:w-[min(24rem,calc(100vw-2rem))] lg:bottom-6 lg:right-6"
        >

          <div className="rounded-2xl border border-border bg-card shadow-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Cookie className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold">
                  {isFr ? '🍪 Cookies & confidentialité' : '🍪 Cookies & Privacy'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {isFr
                    ? 'Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez personnaliser vos préférences.'
                    : 'We use cookies to improve your experience. You can customize your preferences.'}
                </p>
              </div>
              <button
                onClick={() => setVisible(false)}
                className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Preferences panel */}
            <AnimatePresence>
              {showPrefs && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-2 border-t border-border">
                    {[
                      { key: 'essential' as const, label: isFr ? 'Essentiels' : 'Essential', desc: isFr ? 'Requis pour le fonctionnement' : 'Required for operation', locked: true },
                      { key: 'analytics' as const, label: 'Analytics', desc: isFr ? 'Nous aide à améliorer le site' : 'Helps us improve the site', locked: false },
                      { key: 'marketing' as const, label: 'Marketing', desc: isFr ? 'Publicités personnalisées' : 'Personalized ads', locked: false },
                    ].map(item => (
                      <label key={item.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={prefs[item.key]}
                          disabled={item.locked}
                          onChange={(e) => setPrefs(p => ({ ...p, [item.key]: e.target.checked }))}
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-wrap gap-2">
              {showPrefs ? (
                <>
                  <Button variant="outline" size="sm" className="flex-1 min-w-[7rem] text-xs" onClick={() => setShowPrefs(false)}>
                    {isFr ? 'Retour' : 'Back'}
                  </Button>
                  <Button size="sm" className="flex-1 min-w-[7rem] text-xs" onClick={handleSavePrefs}>
                    {isFr ? 'Sauvegarder' : 'Save'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="text-xs gap-1 min-w-0 shrink" onClick={() => setShowPrefs(true)}>
                    <Settings2 className="h-3 w-3 shrink-0" /> <span className="truncate">{isFr ? 'Personnaliser' : 'Customize'}</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 min-w-[5.5rem] text-xs" onClick={handleRejectAll}>
                    {isFr ? 'Refuser' : 'Reject'}
                  </Button>
                  <Button size="sm" className="flex-1 min-w-[5.5rem] text-xs" onClick={handleAcceptAll}>
                    {isFr ? 'Accepter tout' : 'Accept all'}
                  </Button>
                </>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground/80">
              <Link to="/privacy" className="underline hover:text-foreground">
                {isFr ? 'Politique de confidentialité' : 'Privacy policy'}
              </Link>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

