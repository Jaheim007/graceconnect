import { useState } from 'react';
import { MessageSquarePlus, Send, X, Bug, Lightbulb, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { db } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>('bug');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const TYPES = [
    { value: 'bug', icon: Bug, label: 'Bug', color: 'text-destructive' },
    { value: 'idea', icon: Lightbulb, label: isFr ? 'Idée' : 'Idea', color: 'text-accent-foreground' },
    { value: 'praise', icon: ThumbsUp, label: isFr ? 'Bravo' : 'Kudos', color: 'text-primary' },
  ] as const;

  const handleSend = async () => {
    if (!message.trim() || !user) return;
    setSending(true);
    try {
      await db.from('content_reports').insert({
        content_type: 'feedback',
        content_id: type,
        reason: message.trim(),
        reporter_user_id: user.id,
      });
      toast({ title: isFr ? '✅ Merci pour votre feedback !' : '✅ Thank you for your feedback!' });
      setMessage('');
      setOpen(false);
    } catch {
      toast({ title: isFr ? 'Erreur' : 'Error', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 w-[320px] bg-card border border-border rounded-2xl shadow-elevated p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Feedback</p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all',
                    type === t.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                  )}
                >
                  <t.icon className={cn('h-4 w-4', t.color)} />
                  {t.label}
                </button>
              ))}
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isFr ? 'Décrivez votre retour...' : 'Describe your feedback...'}
              className="min-h-[80px] text-sm resize-none"
            />
            <Button onClick={handleSend} disabled={!message.trim() || sending} className="w-full gap-1.5" size="sm">
              <Send className="h-3.5 w-3.5" /> {isFr ? 'Envoyer' : 'Send'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 h-11 w-11 rounded-full shadow-elevated flex items-center justify-center transition-all',
          open ? 'bg-muted scale-0' : 'bg-primary text-primary-foreground hover:scale-105'
        )}
      >
        <MessageSquarePlus className="h-5 w-5" />
      </button>
    </>
  );
}
