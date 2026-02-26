import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DonationCampaign } from '@/types/database';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Lock, CheckCircle, AlertCircle, Loader2, EyeOff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePaymentGateway, PaymentMethod, PaymentGateway } from '@/hooks/usePaymentGateway';
import { PaymentMethodSelector } from '@/components/payments/PaymentMethodSelector';
import { getAffiliateCode, clearAffiliateCode } from '@/hooks/useAffiliateCapture';
import { isMoMoAvailable } from '@/lib/paymentRouting';
import { verifyPayment, VerifyPaymentResult, callFn } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { onNewDonation } from '@/lib/notifications';

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
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [result, setResult] = useState<VerifyPaymentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Auto-select payment method based on detected gateway
  const defaultMethod: PaymentMethod = isMoMoAvailable(campaign?.currency || 'XOF') ? 'mobile_money' : 'card';
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(defaultMethod);

  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { openPayment } = usePaymentGateway();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch org subaccount + fee config for split payments
  const { data: orgPayment } = useQuery({
    queryKey: ['org-payment-config', organizationId],
    queryFn: async () => {
      const { data } = await db.from('organizations')
        .select('paystack_subaccount_code, platform_fee_percent, affiliation_enabled, affiliation_commission_percent')
        .eq('id', organizationId)
        .single();
      return data;
    },
    enabled: open && !!organizationId,
  });

  if (!campaign) return null;

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' XOF';

  const resolvedEmail = email || user?.email || '';
  const resolvedName = name || profile?.display_name || '';
  const effectiveAmount = Number(amount);

  const handleDonate = async () => {
    if (isSubmitting) return;
    if (!amount || Number(amount) < 100) {
      toast({ title: 'Montant invalide', description: 'Le don minimum est de 100 XOF.', variant: 'destructive' });
      return;
    }
    if (!resolvedEmail) {
      toast({ title: 'Email requis', description: 'Veuillez saisir votre email pour recevoir le reçu.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    const affiliateCode = getAffiliateCode();

    try {
      await openPayment({
        method: paymentMethod,
        email: resolvedEmail,
        amount: effectiveAmount,
        currency: campaign.currency || 'XOF',
        type: 'donation',
        organization_id: organizationId,
        campaign_id: campaign.id,
        buyer_name: isAnonymous ? 'Anonyme' : resolvedName,
        affiliate_code: affiliateCode,
        subaccount: orgPayment?.paystack_subaccount_code || undefined,
        platformFeeAmount: orgPayment?.paystack_subaccount_code
          ? effectiveAmount * (
              ((orgPayment?.platform_fee_percent ?? 10) +
               (affiliateCode && orgPayment?.affiliation_enabled ? (orgPayment?.affiliation_commission_percent ?? 10) : 0)) / 100
            )
          : undefined,
        metadata: {
          type: 'donation',
          campaign_id: campaign.id,
          organization_id: organizationId,
          donor_name: isAnonymous ? 'Anonyme' : resolvedName,
          donor_email: resolvedEmail,
          user_id: user?.id || null,
          affiliate_code: affiliateCode || null,
        },
        onClose: () => {
          // User closed the popup without paying — stay on form
        },
        onSuccess: async (reference, gateway) => {
          // For Stripe, the redirect handles success — this won't be called
          if (gateway === 'stripe') return;
          
          setStep('processing');
          try {
            const verifyResult = await verifyPayment({
              reference,
              type: 'donation',
              organization_id: organizationId,
              campaign_id: campaign.id,
              affiliate_code: affiliateCode,
              donor_name: isAnonymous ? 'Anonyme' : (resolvedName || undefined),
              donor_email: resolvedEmail || undefined,
            });
            clearAffiliateCode();
            setResult(verifyResult);
            setStep('success');
            onSuccess?.(verifyResult);
            onNewDonation(organizationId, '', campaign.title, isAnonymous ? 'Anonyme' : resolvedName, verifyResult.breakdown.amount, campaign.currency || 'XOF');
            queryClient.invalidateQueries({ queryKey: ['feed-campaigns'] });
            queryClient.invalidateQueries({ queryKey: ['org-campaigns'] });
            queryClient.invalidateQueries({ queryKey: ['user-donations'] });
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setAmount('');
    setName('');
    setEmail('');
    setIsAnonymous(false);
    setResult(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            Contribuer à {campaign.title}
          </DialogTitle>
          {step === 'form' && (
            <DialogDescription>
              Votre contribution soutient cette campagne. Devise : {campaign.currency || 'XOF'}.
            </DialogDescription>
          )}
        </DialogHeader>

        {/* ── FORM ── */}
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

              {/* Anonymous donation */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(v) => setIsAnonymous(v === true)}
                />
                <Label htmlFor="anonymous" className="text-xs flex items-center gap-1.5 cursor-pointer">
                  <EyeOff className="h-3 w-3 text-muted-foreground" />
                  Don anonyme (votre nom ne sera pas visible)
                </Label>
              </div>

              {/* Payment method selector */}
              <PaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
                currency={campaign.currency || 'XOF'}
              />

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Paiement sécurisé par {paymentMethod === 'mobile_money' ? 'Paystack' : 'Stripe'}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Les méthodes de paiement dépendent de la disponibilité par pays.
                </p>
                <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                  <a href="/refund-policy" target="_blank" className="underline hover:text-foreground">Refund Policy</a>
                  <a href="/acceptable-use" target="_blank" className="underline hover:text-foreground">Acceptable Use</a>
                  <a href="/aml" target="_blank" className="underline hover:text-foreground">AML Policy</a>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">Annuler</Button>
              <Button
                onClick={handleDonate}
                disabled={!amount || Number(amount) < 100 || isSubmitting}
                className="flex-1 bg-primary text-primary-foreground"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Donner {amount ? fmt(effectiveAmount) : ''}
              </Button>
            </div>
          </>
        )}

        {/* ── PROCESSING ── */}
        {step === 'processing' && (
          <div className="py-10 flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="font-medium">Vérification du paiement…</p>
            <p className="text-sm text-muted-foreground">Ne fermez pas cette fenêtre.</p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && result && (
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-14 w-14 text-green-500" />
            <div>
              <p className="font-semibold text-lg">🙏 Merci pour votre don !</p>
              <p className="text-sm text-muted-foreground mt-1">
                {fmt(result.breakdown.amount)} reçu — la plateforme reçoit {fmt(result.breakdown.organization_amount)}.
              </p>
              {result.breakdown.affiliate_attributed && (
                <p className="text-xs text-primary mt-1">✓ Commission affilié attribuée</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Un reçu a été envoyé à votre email.</p>
            {user && (
              <Button
                onClick={() => { handleClose(); navigate('/dashboard'); }}
                className="w-full bg-primary text-primary-foreground"
              >
                Accéder à mon tableau de bord
              </Button>
            )}
            <Button variant="ghost" onClick={handleClose} className="text-muted-foreground">Fermer</Button>
          </div>
        )}

        {/* ── ERROR ── */}
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
