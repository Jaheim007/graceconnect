import { useState } from 'react';
import { MessageSquarePlus, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/db';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const FEEDBACK_TYPES = [
  { value: 'bug', emoji: '🐛', label: 'Bug' },
  { value: 'feature', emoji: '💡', label: 'Idée' },
  { value: 'ux', emoji: '🎨', label: 'UX' },
  { value: 'other', emoji: '💬', label: 'Autre' },
];

export function FeedbackWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('feature');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!user) return null;

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      // Store feedback as a content_report with content_type='feedback'
      await db.from('content_reports').insert({
        content_type: 'feedback',
        content_id: user.id,
        reporter_user_id: user.id,
        reason: `[${type.toUpperCase()}] ${message.trim()}`,
      });
      toast({ title: '✅ Merci pour votre feedback !', description: 'Votre retour nous aide à améliorer la plateforme.' });
      setMessage('');
      setType('feature');
      setOpen(false);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible d\'envoyer le feedback.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* FAB button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform sm:bottom-6"
            aria-label="Envoyer un feedback"
          >
            <MessageSquarePlus className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 z-50 w-80 bg-card border border-border rounded-2xl shadow-elevated p-4 space-y-3 sm:bottom-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">💬 Votre avis compte</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Type selector */}
            <div className="flex gap-1.5">
              {FEEDBACK_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={cn(
                    'flex-1 text-center py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all border',
                    type === t.value
                      ? 'bg-primary/10 border-primary/30 text-foreground'
                      : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                >
                  <span className="block text-sm">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>

            <Textarea
              placeholder="Décrivez votre idée, bug ou suggestion…"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />

            <Button
              size="sm"
              className="w-full gap-1.5"
              disabled={!message.trim() || sending}
              onClick={handleSend}
            >
              <Send className="h-3.5 w-3.5" />
              {sending ? 'Envoi…' : 'Envoyer'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
