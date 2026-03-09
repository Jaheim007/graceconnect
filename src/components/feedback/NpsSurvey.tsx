import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';

const NPS_KEY = 'sv_nps_done';
const NPS_DELAY_DAYS = 30;

/**
 * NPS micro-survey shown after 30 days of usage.
 * Stores responses in user_feedback table.
 */
export function NpsSurvey() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user) return;
    const done = localStorage.getItem(NPS_KEY);
    if (done) return;

    // Check if user account is older than 30 days
    const created = new Date(user.created_at);
    const daysSinceCreation = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < NPS_DELAY_DAYS) return;

    const timer = setTimeout(() => setShow(true), 15000); // Show after 15s on page
    return () => clearTimeout(timer);
  }, [user]);

  const handleSubmit = async () => {
    if (score === null || !user) return;
    try {
      await db.from('user_feedback').insert({
        user_id: user.id,
        context: 'nps',
        score,
        comment: comment.trim() || null,
      });
    } catch {}
    localStorage.setItem(NPS_KEY, new Date().toISOString());
    setSubmitted(true);
    setTimeout(() => setShow(false), 2500);
  };

  const dismiss = () => {
    localStorage.setItem(NPS_KEY, new Date().toISOString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-24 right-4 z-[60] w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <p className="text-sm font-bold">
              {submitted ? '🙏 Merci !' : '📊 Votre avis compte'}
            </p>
            <button onClick={dismiss} className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {submitted ? (
            <p className="text-xs text-muted-foreground">Votre retour nous aide à améliorer Siteviral.</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">Recommanderiez-vous Siteviral à un ami ?</p>
              <div className="flex gap-1">
                {Array.from({ length: 11 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setScore(i)}
                    className={`flex-1 h-8 rounded-lg text-[10px] font-bold transition-all ${
                      score === i
                        ? i <= 6 ? 'bg-destructive text-destructive-foreground'
                          : i <= 8 ? 'bg-amber-500 text-white'
                          : 'bg-emerald-500 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground px-1">
                <span>Pas du tout</span>
                <span>Absolument</span>
              </div>

              {score !== null && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                  <Textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Un commentaire ? (optionnel)"
                    className="text-xs h-16 resize-none"
                  />
                  <Button size="sm" className="w-full gap-2" onClick={handleSubmit}>
                    <Send className="h-3.5 w-3.5" /> Envoyer
                  </Button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
