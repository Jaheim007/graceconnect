import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from 'sonner';
import { CheckCircle2, Zap, Loader2 } from 'lucide-react';
import { trackEvent } from '@/hooks/useClientAnalytics';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: 'pro' | 'org';
  source?: string;
}

export function PlatformPlanWaitlistDialog({ open, onOpenChange, plan, source = 'pricing_page' }: Props) {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const [email, setEmail] = useState(user?.email || '');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const planLabel = plan === 'pro' ? 'Pro' : 'Org';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error(isFr ? 'Email requis' : 'Email required');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await db.from('platform_plan_waitlist').insert({
        plan,
        email: email.trim().toLowerCase(),
        user_id: user?.id ?? null,
        organization_id: currentOrg?.id ?? null,
        note: note.trim() || null,
        source,
        locale,
      });
      if (error) throw error;
      trackEvent('waitlist_join', { plan, source }, user?.id);
      setDone(true);
    } catch (err: any) {
      console.error('[Waitlist] insert error', err);
      toast.error(isFr ? 'Une erreur est survenue. Réessaie.' : 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setDone(false);
    setNote('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); else onOpenChange(true); }}>
      <DialogContent className="max-w-md">
        {done ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold">
              {isFr ? `Tu es sur la liste ${planLabel} !` : `You're on the ${planLabel} waitlist!`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isFr
                ? `On te contacte dès que ${planLabel} est prêt — accès anticipé garanti.`
                : `We'll reach out as soon as ${planLabel} launches — early access guaranteed.`}
            </p>
            <Button onClick={reset} className="mt-2">{isFr ? 'Parfait' : 'Perfect'}</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                {isFr ? `Rejoindre la liste ${planLabel}` : `Join ${planLabel} waitlist`}
              </DialogTitle>
              <DialogDescription>
                {isFr
                  ? `${planLabel} arrive bientôt. Inscris-toi pour un accès anticipé et un tarif fondateur.`
                  : `${planLabel} is coming soon. Sign up for early access and founder pricing.`}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <Label htmlFor="waitlist-email">{isFr ? 'Email' : 'Email'}</Label>
                <Input
                  id="waitlist-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="waitlist-note" className="text-xs text-muted-foreground">
                  {isFr ? 'Que veux-tu en faire ? (optionnel)' : 'What do you plan to use it for? (optional)'}
                </Label>
                <Textarea
                  id="waitlist-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="mt-1.5 text-sm"
                  placeholder={isFr ? 'Ex: vendre ma formation, monter mon académie…' : 'e.g. sell my course, build my academy…'}
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full gap-2">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isFr ? `Rejoindre la liste ${planLabel}` : `Join ${planLabel} waitlist`}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                {isFr ? 'Aucune carte requise. Aucun engagement.' : 'No card required. No commitment.'}
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
