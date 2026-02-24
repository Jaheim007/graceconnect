// Exit-intent popup component for org public pages
import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface OrgPopupConfig {
  enabled: boolean;
  title?: string;
  message?: string;
  cta_text?: string;
  trigger?: 'exit_intent' | 'scroll_50' | 'timer_10s';
  collect_email?: boolean;
  waitlist_id?: string;
}

interface SmartPopupProps {
  config: OrgPopupConfig;
  orgName: string;
}

export function SmartPopup({ config, orgName }: SmartPopupProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const storageKey = `popup_dismissed_${orgName}`;

  const show = useCallback(() => {
    if (dismissed || sessionStorage.getItem(storageKey)) return;
    setVisible(true);
  }, [dismissed, storageKey]);

  useEffect(() => {
    if (!config.enabled || dismissed) return;

    const trigger = config.trigger || 'exit_intent';

    if (trigger === 'exit_intent') {
      const handler = (e: MouseEvent) => {
        if (e.clientY <= 5) show();
      };
      document.addEventListener('mouseleave', handler);
      return () => document.removeEventListener('mouseleave', handler);
    }

    if (trigger === 'scroll_50') {
      const handler = () => {
        const scrollPct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (scrollPct >= 50) show();
      };
      window.addEventListener('scroll', handler, { passive: true });
      return () => window.removeEventListener('scroll', handler);
    }

    if (trigger === 'timer_10s') {
      const timer = setTimeout(show, 10000);
      return () => clearTimeout(timer);
    }
  }, [config, dismissed, show]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem(storageKey, '1');
  };

  const handleSubmit = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: 'Email invalide', variant: 'destructive' });
      return;
    }

    if (config.waitlist_id) {
      await db.from('waitlist_entries').upsert({ waitlist_id: config.waitlist_id, email: email.trim() }, { onConflict: 'waitlist_id,email' });
    }

    setSubmitted(true);
    toast({ title: '✅ Inscrit !' });
    setTimeout(handleDismiss, 2000);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4 relative"
          >
            <button onClick={handleDismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold">{config.title || `Ne partez pas si vite !`}</h3>
              <p className="text-sm text-muted-foreground">{config.message || `Rejoignez ${orgName} et ne manquez aucune nouveauté.`}</p>
            </div>

            {config.collect_email && !submitted ? (
              <div className="flex gap-2">
                <Input placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} className="flex-1" />
                <Button onClick={handleSubmit} className="bg-primary text-primary-foreground">
                  {config.cta_text || "S'inscrire"}
                </Button>
              </div>
            ) : submitted ? (
              <p className="text-center text-sm text-primary font-semibold">🎉 Merci !</p>
            ) : (
              <Button onClick={handleDismiss} className="w-full bg-primary text-primary-foreground">
                {config.cta_text || 'Continuer'}
              </Button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
