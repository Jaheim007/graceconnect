import { useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
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
import { useI18n } from '@/i18n/I18nContext';

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
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { openPayment, hasPaystackKey } = usePaymentGateway();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const defaultMethod: PaymentMethod =
    isMoMoAvailable(campaign?.currency || 'XOF') && hasPaystackKey ? 'mobile_money' : 'card';
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(defaultMethod);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const campaignCurrency = campaign.currency || 'XOF';
  const fmtLoc = isFr ? 'fr-FR' : 'en-US';
  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat(fmtLoc, { style: 'currency', currency: campaignCurrency, maximumFractionDigits: 0 }).format(n);
    } catch {
      return new Intl.NumberFormat(fmtLoc, { maximumFractionDigits: 0 }).format(n) + ` ${campaignCurrency}`;
    }
  };

  const anonLabel = isFr ? 'Anonyme' : 'Anonymous';
  const resolvedEmail = email || user?.email || '';
  const resolvedName = name || profile?.display_name || '';
  const effectiveAmount = Number(amount);

  const handleDonate = async () => {
    if (isSubmitting) return;
    if (!amount || Number(amount) < 100) {
      toast({ title: isFr ? 'Montant invalide' : 'Invalid amount', description: isFr ? `Le don minimum est de 100 ${campaignCurrency}.` : `Minimum donation is 100 ${campaignCurrency}.`, variant: 'destructive' });
      return;
    }
    if (!resolvedEmail) {
      toast({ title: isFr ? 'Email requis' : 'Email required', description: isFr ? 'Veuillez saisir votre email pour recevoir le reçu.' : 'Please enter your email to receive the receipt.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    const affiliateCode = getAffiliateCode() || new URLSearchParams(window.location.search).get('ref') || null;

    try {
      await openPayment({
        method: paymentMethod,
        email: resolvedEmail,
        amount: effectiveAmount,
        currency: campaign.currency || 'XOF',
        type: 'donation',
        organization_id: organizationId,
        campaign_id: campaign.id,
        buyer_name: isAnonymous ? anonLabel : resolvedName,
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
          donor_name: isAnonymous ? anonLabel : resolvedName,
          donor_email: resolvedEmail,
          user_id: user?.id || null,
          affiliate_code: affiliateCode || null,
        },
        onClose: () => { setIsSubmitting(false); },
        onSuccess: async (reference, gateway) => {
          if (gateway === 'stripe') return;
          setStep('processing');
          try {
            const verifyResult = await verifyPayment({
              reference,
              type: 'donation',
              organization_id: organizationId,
              campaign_id: campaign.id,
              affiliate_code: affiliateCode,
              donor_name: isAnonymous ? anonLabel : (resolvedName || undefined),
              donor_email: resolvedEmail || undefined,
            });
            clearAffiliateCode();
            setResult(verifyResult);
            setStep('success');
            onSuccess?.(verifyResult);
            onNewDonation(organizationId, '', campaign.title, isAnonymous ? anonLabel : resolvedName, verifyResult.breakdown.amount, campaign.currency || 'XOF');
            queryClient.invalidateQueries({ queryKey: ['feed-campaigns'] });
            queryClient.invalidateQueries({ queryKey: ['org-campaigns'] });
            queryClient.invalidateQueries({ queryKey: ['user-donations'] });
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : (isFr ? 'Une erreur est survenue.' : 'An error occurred.');
            console.error('[DonateModal] verify error:', message);
            const params = new URLSearchParams({
              reference,
              gateway: 'paystack',
              type: 'donation',
              organization_id: organizationId,
              ...(campaign.id ? { campaign_id: campaign.id } : {}),
            });
            navigate(`/payment/success?${params.toString()}`);
          }
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (isFr ? "Impossible d'ouvrir le paiement." : 'Unable to open payment.');
      console.error('[DonateModal] openPayment error:', err);
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
      const hint = isMobile ? (isFr ? ' Vérifiez que les pop-ups ne sont pas bloqués.' : ' Check that popups are not blocked.') : '';
      toast({ title: isFr ? 'Erreur de paiement' : 'Payment error', description: message + hint, variant: 'destructive' });
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
            {isFr ? `Contribuer à ${campaign.title}` : `Contribute to ${campaign.title}`}
          </DialogTitle>
          {step === 'form' && (
           <DialogDescription>
              {isFr ? `Votre contribution soutient cette campagne. Devise : ${campaignCurrency}.` : `Your contribution supports this campaign. Currency: ${campaignCurrency}.`}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* ── FORM ── */}
        {step === 'form' && (
          <>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs mb-2 block">{isFr ? 'Choisir un montant' : 'Choose an amount'}</Label>
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
                <Label htmlFor="amount" className="text-xs">{isFr ? `Ou montant personnalisé (${campaignCurrency})` : `Or custom amount (${campaignCurrency})`}</Label>
                <Input
                  id="amount"
                  type="number"
                  min={100}
                  placeholder={isFr ? 'ex. 3000' : 'e.g. 3000'}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              {!user && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="dname" className="text-xs">{isFr ? 'Nom (optionnel)' : 'Name (optional)'}</Label>
                    <Input id="dname" value={name} onChange={(e) => setName(e.target.value)} placeholder={anonLabel} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="demail" className="text-xs">Email *</Label>
                    <Input id="demail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={isFr ? 'votre@email.com' : 'your@email.com'} className="mt-1.5" required />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Checkbox
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(v) => setIsAnonymous(v === true)}
                />
                <Label htmlFor="anonymous" className="text-xs flex items-center gap-1.5 cursor-pointer">
                  <EyeOff className="h-3 w-3 text-muted-foreground" />
                  {isFr ? 'Don anonyme (votre nom ne sera pas visible)' : 'Anonymous donation (your name will not be visible)'}
                </Label>
              </div>

              <PaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
                currency={campaign.currency || 'XOF'}
                paystackEnabled={hasPaystackKey}
              />
              {!hasPaystackKey && isMoMoAvailable(campaign.currency || 'XOF') && (
                <p className="text-[10px] text-muted-foreground">
                  {isFr ? 'Mobile Money est temporairement indisponible. Utilisez Carte bancaire pour finaliser le paiement.' : 'Mobile Money is temporarily unavailable. Use Card to complete payment.'}
                </p>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  {isFr ? `Paiement sécurisé par ${paymentMethod === 'card' ? 'Stripe' : 'Paystack'}` : `Secure payment via ${paymentMethod === 'card' ? 'Stripe' : 'Paystack'}`}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {isFr ? 'Les méthodes de paiement dépendent de la disponibilité par pays.' : 'Payment methods depend on country availability.'}
                </p>
                <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                  <a href="/refund-policy" target="_blank" className="underline hover:text-foreground">Refund Policy</a>
                  <a href="/acceptable-use" target="_blank" className="underline hover:text-foreground">Acceptable Use</a>
                  <a href="/aml" target="_blank" className="underline hover:text-foreground">AML Policy</a>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">{isFr ? 'Annuler' : 'Cancel'}</Button>
              <Button
                onClick={handleDonate}
                disabled={!amount || Number(amount) < 100 || isSubmitting}
                className="flex-1 bg-primary text-primary-foreground"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                {isFr ? 'Donner' : 'Donate'} {amount ? fmt(effectiveAmount) : ''}
              </Button>
            </div>
          </>
        )}

        {/* ── PROCESSING ── */}
        {step === 'processing' && (
          <div className="py-10 flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="font-medium">{isFr ? 'Vérification du paiement…' : 'Verifying payment…'}</p>
            <p className="text-sm text-muted-foreground">{isFr ? 'Ne fermez pas cette fenêtre.' : 'Do not close this window.'}</p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && result && (
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-14 w-14 text-green-500" />
            <div>
              <p className="font-semibold text-lg">{isFr ? '🙏 Merci pour votre don !' : '🙏 Thank you for your donation!'}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isFr
                  ? `${fmt(result.breakdown.amount)} reçu — la plateforme reçoit ${fmt(result.breakdown.organization_amount)}.`
                  : `${fmt(result.breakdown.amount)} received — the platform receives ${fmt(result.breakdown.organization_amount)}.`}
              </p>
              {result.breakdown.affiliate_attributed && (
                <p className="text-xs text-primary mt-1">{isFr ? '✓ Commission ambassadeur attribuée' : '✓ Ambassador commission attributed'}</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{isFr ? 'Un reçu a été envoyé à votre email.' : 'A receipt has been sent to your email.'}</p>
            {user && (
              <Button
                onClick={() => { handleClose(); navigate('/dashboard'); }}
                className="w-full bg-primary text-primary-foreground"
              >
                {isFr ? 'Accéder à mon tableau de bord' : 'Go to my dashboard'}
              </Button>
            )}
            <Button variant="ghost" onClick={handleClose} className="text-muted-foreground">{isFr ? 'Fermer' : 'Close'}</Button>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === 'error' && (
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-14 w-14 text-destructive" />
            <div>
              <p className="font-semibold">{isFr ? 'Une erreur est survenue' : 'An error occurred'}</p>
              <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
            </div>
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={handleClose} className="flex-1">{isFr ? 'Fermer' : 'Close'}</Button>
              <Button onClick={() => setStep('form')} className="flex-1">{isFr ? 'Réessayer' : 'Try again'}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
