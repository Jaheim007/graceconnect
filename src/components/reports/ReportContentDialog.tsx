import { useState } from 'react';
import { Flag, AlertTriangle, ShieldAlert, Ban, Copyright, HelpCircle, Send, CheckCircle2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const REPORT_REASONS = [
  { value: 'inappropriate', label: 'Contenu inapproprié', icon: Ban, color: 'text-destructive' },
  { value: 'fraud', label: 'Fraude / Arnaque', icon: ShieldAlert, color: 'text-orange-500' },
  { value: 'copyright', label: 'Violation de droits d\'auteur', icon: Copyright, color: 'text-yellow-600' },
  { value: 'misleading', label: 'Contenu trompeur', icon: AlertTriangle, color: 'text-amber-500' },
  { value: 'other', label: 'Autre raison', icon: HelpCircle, color: 'text-muted-foreground' },
] as const;

interface ReportContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: string;
  contentType: string; // 'product', 'event', 'announcement', etc.
  contentTitle?: string;
  organizationId?: string;
}

export function ReportContentDialog({
  open, onOpenChange, contentId, contentType, contentTitle, organizationId,
}: ReportContentDialogProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const reset = () => {
    setStep('form');
    setSelectedReason('');
    setDetails('');
    setSending(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = async () => {
    if (!user || !selectedReason) return;
    setSending(true);
    try {
      const reasonLabel = REPORT_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;
      const fullReason = details.trim()
        ? `[${reasonLabel}] ${details.trim()}`
        : `[${reasonLabel}]`;

      const { error } = await db.from('content_reports').insert({
        content_id: contentId,
        content_type: contentType,
        reason: fullReason,
        reporter_user_id: user.id,
        organization_id: organizationId || null,
      });

      if (error) throw error;

      // Fire edge function for email notification (fire-and-forget)
      runNotifyReport({
        data: {
          content_id: contentId,
          content_type: contentType,
          content_title: contentTitle || '',
          reason: fullReason,
        },
      }).catch(() => {});

      setStep('success');
    } catch {
      toast({ title: 'Erreur lors de l\'envoi du signalement', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-destructive" />
                  Signaler un contenu
                </DialogTitle>
                <DialogDescription>
                  {contentTitle
                    ? `Signaler « ${contentTitle} »`
                    : 'Aidez-nous à garder la plateforme sûre en signalant tout contenu problématique.'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <p className="text-sm font-medium">Motif du signalement</p>
                <div className="grid gap-2">
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      onClick={() => setSelectedReason(reason.value)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition-all',
                        selectedReason === reason.value
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border hover:bg-muted/50'
                      )}
                    >
                      <reason.icon className={cn('h-4.5 w-4.5 shrink-0', reason.color)} />
                      <span className="font-medium">{reason.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-medium">Détails supplémentaires <span className="text-muted-foreground font-normal">(optionnel)</span></p>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Décrivez le problème en détail..."
                  className="min-h-[80px] resize-none text-sm"
                  maxLength={1000}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!selectedReason || sending}
                className="w-full gap-2"
              >
                <Send className="h-4 w-4" />
                {sending ? 'Envoi en cours...' : 'Envoyer le signalement'}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-6 space-y-4"
            >
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold">Signalement envoyé</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Merci pour votre signalement. Notre équipe va examiner ce contenu dans les plus brefs délais.
                </p>
              </div>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Fermer
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
