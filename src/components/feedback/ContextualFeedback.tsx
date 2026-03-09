import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';

interface Props {
  context: string; // e.g. 'publication', 'first_donation', 'first_earning'
  question?: string;
}

/**
 * Post-flow contextual feedback widget.
 * Shows 3 emoji buttons to collect satisfaction.
 */
export function ContextualFeedback({ context, question = 'Comment s\'est passée cette expérience ?' }: Props) {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const submit = async (score: number) => {
    if (!user) return;
    try {
      await db.from('user_feedback').insert({
        user_id: user.id,
        context,
        score,
      });
    } catch {}
    setSubmitted(true);
    setTimeout(() => setDismissed(true), 2000);
  };

  if (dismissed || !user) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="rounded-xl border border-border bg-card p-3 text-center space-y-2"
      >
        {submitted ? (
          <p className="text-xs text-muted-foreground">🙏 Merci pour votre retour !</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">{question}</p>
            <div className="flex justify-center gap-4">
              {[
                { emoji: '😞', score: 1, label: 'Mauvais' },
                { emoji: '😐', score: 3, label: 'Moyen' },
                { emoji: '😊', score: 5, label: 'Excellent' },
              ].map(opt => (
                <button
                  key={opt.score}
                  onClick={() => submit(opt.score)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{opt.emoji}</span>
                  <span className="text-[9px] text-muted-foreground">{opt.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
