import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Handshake } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { useI18n } from '@/i18n/I18nContext';

export default function PartnerPendingPopup() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  useEffect(() => {
    if (!user) return;
    const justSubmitted = sessionStorage.getItem('sv_partner_submitted') === 'true';
    if (justSubmitted) {
      sessionStorage.removeItem('sv_partner_submitted');
      setOpen(true);
      return;
    }
    (async () => {
      try {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data } = await db.from('partners')
          .select('id, status, created_at')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .gte('created_at', fiveMinAgo)
          .maybeSingle();
        if (data) {
          const shownKey = `sv_partner_popup_shown_${data.id}`;
          if (!sessionStorage.getItem(shownKey)) {
            sessionStorage.setItem(shownKey, 'true');
            setOpen(true);
          }
        }
      } catch {}
    })();
  }, [user]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md text-center">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Handshake className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold">{isFr ? 'Candidature envoyée !' : 'Application submitted!'} 🎉</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isFr
              ? 'Votre demande de partenariat a été soumise avec succès et est en cours d\'examen par notre équipe. Vous recevrez une notification par email dès que votre candidature sera approuvée.'
              : 'Your partnership application has been submitted successfully and is being reviewed by our team. You will receive an email notification once your application is approved.'}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 w-full">
            <CheckCircle className="h-4 w-4 text-primary shrink-0" />
            <span>{isFr ? 'Délai de traitement' : 'Processing time'} : <strong className="text-foreground">24 — 48h</strong></span>
          </div>
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              {isFr ? 'Continuer' : 'Continue'}
            </Button>
            <Button className="flex-1" asChild>
              <Link to="/partner-terms">{isFr ? 'Voir le contrat' : 'View contract'}</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
