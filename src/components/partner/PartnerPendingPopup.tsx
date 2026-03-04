import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Handshake } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Shows a popup after login if the user just submitted a partner application.
 * The flag is set in sessionStorage by BecomePartnerPage after auto-submitting.
 */
export default function PartnerPendingPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const flag = sessionStorage.getItem('sv_partner_submitted');
    if (flag === 'true') {
      setOpen(true);
      sessionStorage.removeItem('sv_partner_submitted');
    }
  }, []);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md text-center">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Handshake className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Candidature envoyée ! 🎉</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Votre demande de partenariat a été soumise avec succès et est en cours d'examen par notre équipe.
            Vous recevrez une notification par email dès que votre candidature sera approuvée.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 w-full">
            <CheckCircle className="h-4 w-4 text-primary shrink-0" />
            <span>Délai de traitement : <strong className="text-foreground">24 à 48h</strong></span>
          </div>
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Continuer
            </Button>
            <Button className="flex-1" asChild>
              <Link to="/partner-terms">Voir le contrat</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
