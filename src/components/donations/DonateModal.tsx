import { useState } from 'react';
import { DonationCampaign } from '@/types/database';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePaystack } from '@/hooks/usePaystack';
import { getAffiliateCode, clearAffiliateCode } from '@/hooks/useAffiliateCapture';
import { verifyPayment, VerifyPaymentResult } from '@/lib/api';

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

interface DonateModalProps {
  campaign: DonationCampaign | null;
  organizationId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: VerifyPaymentResult) => void;
}

type Step = 'form' | 'processing' | 'success' | 'error';

export function DonateModal({ campaign, organizationId, open, onClose, onSuccess }: DonateModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [result, setResult] = useState<VerifyPaymentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { openPayment } = usePaystack();

  if (!campaign) return null;

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' XOF';

  const resolvedEmail = email || user?.email || '';
  const resolvedName = name || profile?.display_name || '';

  const handleDonate = async () => {
    if (!amount || Number(amount) < 100) {
      toast({ title: 'Montant invalide', description: 'Le don minimum est de 100 XOF.', variant: 'destructive' });
      return;
    }
    if (!resolvedEmail) {
      toast({ title: 'Email requis', description: 'Veuillez saisir votre email pour recevoir le reçu.', variant: 'destructive' });
      return;
    }

    const affiliateCode = getAffiliateCode();

    try {
      await openPayment({
        email: resolvedEmail,
        amount: Number(amount),
        currency: campaign.currency || 'XOF',
        metadata: {
          type: 'donation',
          campaign_id: campaign.id,
          organization_id: organizationId,
          donor_name: resolvedName,
        },
        onClose: () => {
          // User closed the Paystack popup without paying — stay on form
        },
        onSuccess: async (reference) => {
          setStep('processing');
          try {
            const verifyResult = await verifyPayment({
              reference,
              type: 'donation',
              organization_id: organizationId,
              campaign_id: campaign.id,
              affiliate_code: affiliateCode,
              donor_name: resolvedName || undefined,
              donor_email: resolvedEmail || undefined,
            });
            clearAffiliateCode();
            setResult(verifyResult);
            setStep('success');
            onSuccess?.(verifyResult);
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Une erreur est survenue. Contactez le support avec votre référence.';
            setErrorMsg(message);
            setStep('error');
          }
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Impossible d\'ouvrir le paiement.';
      console.error('[DonateModal] openPayment error:', err);
      toast({ title: 'Erreur de paiement', description: message, variant: 'destructive' });
    }
  };

  const handleClose = () => {
    setStep('form');
    setAmount('');
    setName('');
    setEmail('');
    setResult(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            Faire un don à {campaign.title}
          </DialogTitle>
          {step === 'form' && (
            <DialogDescription>
              Votre contribution soutient cette campagne. Devise : {campaign.currency || 'XOF'}.
            </DialogDescription>
          )}
        </DialogHeader>

        {/* ── FORM ──────────────────────────────────────────────────────────── */}
        {step === 'form' && (
          <>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs mb-2 block">Choisir un montant</Label>
                <div className="grid grid-cols-5 gap-1.5">
                  {PRESET_AMOUNTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setAmount(String(p))}
                      className={`text-xs py-1.5 rounded-lg border transition-all ${
                        amount === String(p)
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {fmt(p)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="amount" className="text-xs">Ou montant personnalisé (XOF)</Label>
                <Input
                  id="amount"
                  type="number"
                  min={100}
                  placeholder="ex. 3000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              {!user && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="dname" className="text-xs">Nom (optionnel)</Label>
                    <Input id="dname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Anonyme" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="demail" className="text-xs">Email *</Label>
                    <Input id="demail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className="mt-1.5" required />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Paiements sécurisés par Paystack
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">Annuler</Button>
              <Button
                onClick={handleDonate}
                disabled={!amount || Number(amount) < 100}
                className="flex-1 gold-gradient text-primary-foreground border-0 shadow-gold"
              >
                Donner {amount ? fmt(Number(amount)) : ''}
              </Button>
            </div>
          </>
        )}

        {/* ── PROCESSING ────────────────────────────────────────────────────── */}
        {step === 'processing' && (
          <div className="py-10 flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="font-medium">Vérification du paiement…</p>
            <p className="text-sm text-muted-foreground">Ne fermez pas cette fenêtre.</p>
          </div>
        )}

        {/* ── SUCCESS ───────────────────────────────────────────────────────── */}
        {step === 'success' && result && (
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-14 w-14 text-green-500" />
            <div>
              <p className="font-semibold text-lg">🙏 Merci pour votre don !</p>
              <p className="text-sm text-muted-foreground mt-1">
                {fmt(result.breakdown.amount)} reçu — l'organisation reçoit {fmt(result.breakdown.organization_amount)}.
              </p>
              {result.breakdown.affiliate_attributed && (
                <p className="text-xs text-primary mt-1">✓ Commission affilié attribuée</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Un reçu a été envoyé à votre email.</p>
            <Button onClick={handleClose} className="gold-gradient text-primary-foreground border-0 shadow-gold">Fermer</Button>
          </div>
        )}

        {/* ── ERROR ─────────────────────────────────────────────────────────── */}
        {step === 'error' && (
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-14 w-14 text-destructive" />
            <div>
              <p className="font-semibold">Une erreur est survenue</p>
              <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
            </div>
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={handleClose} className="flex-1">Fermer</Button>
              <Button onClick={() => setStep('form')} className="flex-1">Réessayer</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
