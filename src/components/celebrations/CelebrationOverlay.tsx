import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n/I18nContext';

interface CelebrationEvent {
  id: string;
  type: 'first_sale' | 'milestone_5' | 'milestone_10' | 'milestone_50' | 'milestone_100';
  title: string;
  subtitle: string;
  emoji: string;
}

const MILESTONES = [1, 5, 10, 50, 100];

/**
 * Full-screen celebration overlay for sales milestones.
 * Listens for realtime purchase events and triggers confetti-style animation.
 */
export function CelebrationOverlay() {
  const [event, setEvent] = useState<CelebrationEvent | null>(null);
  const { user } = useAuth();
  const { locale } = useI18n();
  const qc = useQueryClient();
  const isFr = locale === 'fr';

  const dismiss = useCallback(() => setEvent(null), []);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!event) return;
    const t = setTimeout(dismiss, 6000);
    return () => clearTimeout(t);
  }, [event, dismiss]);

  // Listen for sales notifications to trigger celebrations
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`celebrations-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload: any) => {
        const n = payload.new;
        if (!n) return;

        // Check for sale milestones from notification types
        const type = n.notification_type;
        if (type === 'sale' || type === 'product_sale' || type === 'donation_received') {
          // Check if body contains milestone keywords
          const body = (n.body || '').toLowerCase();
          const title = (n.title || '');

          // First sale detection
          if (body.includes('première vente') || body.includes('first sale') || body.includes('1ère')) {
            setEvent({
              id: n.id,
              type: 'first_sale',
              title: isFr ? '🎉 Première vente !' : '🎉 First sale!',
              subtitle: isFr ? 'Vous avez réalisé votre première vente ! C\'est le début !' : 'You made your first sale! This is just the beginning!',
              emoji: '🎉',
            });
            return;
          }

          // General sale celebration (brief)
          setEvent({
            id: n.id,
            type: 'first_sale',
            title: title || (isFr ? '💰 Nouvelle vente !' : '💰 New sale!'),
            subtitle: n.body?.slice(0, 80) || '',
            emoji: '💰',
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, isFr]);

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={dismiss}
        >
          {/* Confetti particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: `${50 + (Math.random() - 0.5) * 20}vw`,
                  y: '-5vh',
                  rotate: 0,
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                  y: '110vh',
                  rotate: Math.random() * 720 - 360,
                  x: `${50 + (Math.random() - 0.5) * 60}vw`,
                }}
                transition={{
                  duration: Math.random() * 2 + 2,
                  delay: Math.random() * 0.5,
                  ease: 'linear',
                }}
                className="absolute w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'][i % 6],
                }}
              />
            ))}
          </div>

          {/* Main content */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative bg-card border border-border rounded-3xl p-8 max-w-sm mx-4 text-center shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-6xl mb-4"
            >
              {event.emoji}
            </motion.div>
            <h2 className="text-xl font-bold mb-2">{event.title}</h2>
            <p className="text-sm text-muted-foreground mb-4">{event.subtitle}</p>
            <button
              onClick={dismiss}
              className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {isFr ? 'Continuer 🚀' : 'Continue 🚀'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
