import { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/router-compat';
import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { I18nContext } from '@/i18n/I18nContext';

const CONSENT_KEY = 'sv_gdpr_consent';

export function GDPRBanner() {
  const [visible, setVisible] = useState(false);
  const i18n = useContext(I18nContext);
  const t = i18n?.t ?? ((key: string) => key);
  const isFr = (i18n as any)?.locale === 'fr';

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => { localStorage.setItem(CONSENT_KEY, 'accepted'); setVisible(false); };
  const decline = () => { localStorage.setItem(CONSENT_KEY, 'declined'); setVisible(false); };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-[calc(env(safe-area-inset-bottom,0px)+6rem)] lg:pb-6"
    >
      <div className="container max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-2xl shadow-elevated p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <p>
                {t('gdpr.text')}{' '}
                <Link to="/privacy" className="underline text-foreground hover:text-primary transition-colors">{t('gdpr.privacy')}</Link>.
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground/70">{t('gdpr.processor')}</p>
              <p className="mt-0.5"><Link to="/privacy#cookies" className="underline text-[10px] text-muted-foreground hover:text-foreground">{isFr ? 'Gérer les préférences cookies' : 'Manage cookie preferences'}</Link></p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" className="text-xs h-8" onClick={decline}>{t('gdpr.decline')}</Button>
            <Button size="sm" className="text-xs h-8 bg-primary text-primary-foreground" onClick={accept}>{t('gdpr.accept')}</Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
