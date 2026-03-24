import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Offering } from '@/hooks/useOfferings';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HandHeart, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePaymentGateway, PaymentMethod } from '@/hooks/usePaymentGateway';
import { PaymentMethodSelector } from '@/components/payments/PaymentMethodSelector';
import { getAffiliateCode, clearAffiliateCode } from '@/hooks/useAffiliateCapture';
import { isMoMoAvailable } from '@/lib/paymentRouting';
import { verifyPayment, VerifyPaymentResult } from '@/lib/api';
import { db } from '@/lib/db';
import { useI18n } from '@/i18n/I18nContext';

interface OfferingModalProps {
  offering: Offering | null;
  organizationId: string;
  open: boolean;
  onClose: () => void;
}

type Step = 'form' | 'processing' | 'success' | 'error';

export function OfferingModal({ offering, organizationId, open, onClose }: OfferingModalProps) {
  const [step, setStep] = useState<Step>('form');
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState('monthly');
  const [result, setResult] = useState<VerifyPaymentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { openPayment, hasPaystackKey } = usePaymentGateway();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const currency = (offering as any)?.currency || 'XOF';
  const defaultMethod: PaymentMethod =
    isMoMoAvailable(currency) && hasPaystackKey ? 'mobile_money' : 'card';
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(defaultMethod);

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

  if (!offering) return null;

  const presets = offering.preset_amounts || [1000, 2500, 5000, 10000];

  const fmt = (n: number) =>
    new Intl.NumberFormat(isFr ? 'fr-FR' : 'en-US', { maximumFractionDigits: 0 }).format(n) + ` ${currency}`;

  const resolvedEmail = email || user?.email || '';
  const resolvedName = name || profile?.display_name || '';
  const effectiveAmount = Number(amount);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!amount || Number(amount) < 100) {
      toast({ title: isFr ? 'Montant invalide' : 'Invalid amount', description: (isFr ? 'Le montant minimum est de 100 ' : 'Minimum amount is 100 ') + currency + '.', variant: 'destructive' });
      return;
    }
    if (!resolvedEmail) {
      toast({ title: isFr ? 'Email requis' : 'Email required', description: isFr ? 'Veuillez saisir votre email.' : 'Please enter your email.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    const affiliateCode = getAffiliateCode() || new URLSearchParams(window.location.search).get('ref') || null;

    try {
      await openPayment({
        method: paymentMethod,
        email: resolvedEmail,
        amount: effectiveAmount,
        currency,
        type: 'donation',
        organization_id: organizationId,
        buyer_name: resolvedName || (isFr ? 'Donateur' : 'Donor'),
        affiliate_code: affiliateCode,
        subaccount: orgPayment?.paystack_subaccount_code || undefined,
        platformFeeAmount: orgPayment?.paystack_subaccount_code
          ? effectiveAmount * (
              ((orgPayment?.platform_fee_percent ?? 10) +
               (affiliateCode && orgPayment?.affiliation_enabled ? (orgPayment?.affiliation_commission_percent ?? 10) : 0)) / 100
            )
          : undefined,
        metadata: {
          type: 'offering',
          offering_id: offering.id,
          organization_id: organizationId,
          donor_name: resolvedName,
          donor_email: resolvedEmail,
          user_id: user?.id || null,
          affiliate_code: affiliateCode || null,
          is_recurring: isRecurring,
          recurring_interval: isRecurring ? recurringInterval : null,
        },
        onClose: () => {},
        onSuccess: async (reference, gateway) => {
          if (gateway === 'stripe') return;

          setStep('processing');
          try {
            const verifyResult = await verifyPayment({
              reference,
              type: 'donation',
              organization_id: organizationId,
              affiliate_code: affiliateCode,
              donor_name: resolvedName || undefined,
              donor_email: resolvedEmail || undefined,
            });

            await db.from('offering_transactions').insert({
              offering_id: offering.id,
              organization_id: organizationId,
              user_id: user?.id || null,
              amount: effectiveAmount,
              currency,
              donor_name: resolvedName,
              donor_email: resolvedEmail,
              is_recurring: isRecurring,
              recurring_interval: isRecurring ? recurringInterval : null,
              payment_reference: reference,
              payment_gateway: gateway,
              status: 'completed',
              platform_fee: verifyResult.breakdown.platform_fee,
              organization_amount: verifyResult.breakdown.organization_amount,
              completed_at: new Date().toISOString(),
            } as any);

            clearAffiliateCode();
            setResult(verifyResult);
            setStep('success');
          } catch (err: unknown) {
            console.error('[OfferingModal] verify error:', err);
            const params = new URLSearchParams({
              reference,
              gateway: 'paystack',
              type: 'donation',
              organization_id: organizationId,
            });
            window.location.href = `/payment/success?${params.toString()}`;
          }
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (isFr ? 'Impossible d\'ouvrir le paiement.' : 'Unable to open payment.');
      toast({ title: isFr ? 'Erreur de paiement' : 'Payment error', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setAmount('');
    setName('');
    setEmail('');
    setIsRecurring(false);
    setResult(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandHeart className="h-4 w-4 text-primary" />
            {offering.title}
          </DialogTitle>
          {step === 'form' && offering.description && (
            <DialogDescription>{offering.description}</DialogDescription>
          )}
        </DialogHeader>

        {step === 'form' && (
          <>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs mb-2 block">{isFr ? 'Choisir un montant' : 'Choose an amount'}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((p) => (
                    <button
                      key={p}
                      onClick={() => setAmount(String(p))}
                      className={`text-xs py-1.5 px-3 rounded-lg border transition-all ${
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
                <Label htmlFor="offering-amount" className="text-xs">{isFr ? 'Ou montant personnalisé' : 'Or custom amount'} ({currency})</Label>
                <Input
                  id="offering-amount"
                  type="number"
                  min={100}
                  placeholder={isFr ? 'ex. 3000' : 'e.g. 3000'}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              {offering.is_recurring_allowed && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="recurring"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="rounded border-border"
                    />
                     <Label htmlFor="recurring" className="text-xs cursor-pointer">
                      {isFr ? 'Rendre ce don récurrent' : 'Make this a recurring donation'}
                    </Label>
                  </div>
                  {isRecurring && (
                    <Select value={recurringInterval} onValueChange={setRecurringInterval}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">{isFr ? 'Chaque semaine' : 'Weekly'}</SelectItem>
                        <SelectItem value="monthly">{isFr ? 'Chaque mois' : 'Monthly'}</SelectItem>
                        <SelectItem value="yearly">{isFr ? 'Chaque année' : 'Yearly'}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {!user && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="oname" className="text-xs">{isFr ? 'Nom' : 'Name'}</Label>
                    <Input id="oname" value={name} onChange={(e) => setName(e.target.value)} placeholder={isFr ? 'Votre nom' : 'Your name'} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="oemail" className="text-xs">Email *</Label>
                    <Input id="oemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="mt-1.5" required />
                  </div>
                </div>
              )}

              <PaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
                currency={currency}
                paystackEnabled={hasPaystackKey}
              />
              {!hasPaystackKey && isMoMoAvailable(currency) && (
                <p className="text-[10px] text-muted-foreground">
                  {isFr ? 'Mobile Money est temporairement indisponible. Utilisez Carte bancaire pour finaliser le paiement.' : 'Mobile Money is temporarily unavailable. Use card payment to continue.'}
                </p>
              )}

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                {isFr ? 'Paiement sécurisé par' : 'Secure payment via'} {paymentMethod === 'card' ? 'Stripe' : 'Paystack'}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">{isFr ? 'Annuler' : 'Cancel'}</Button>
              <Button
                onClick={handleSubmit}
                disabled={!amount || Number(amount) < 100 || isSubmitting}
                className="flex-1 bg-primary text-primary-foreground"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                {isFr ? 'Donner' : 'Give'} {amount ? fmt(effectiveAmount) : ''}
              </Button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="py-10 flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="font-medium">{isFr ? 'Vérification du paiement…' : 'Verifying payment…'}</p>
          </div>
        )}

        {step === 'success' && result && (
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-14 w-14 text-green-500" />
            <div>
              <p className="font-semibold text-lg">🙏 {isFr ? 'Merci pour votre don !' : 'Thank you for your donation!'}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {fmt(result.breakdown.amount)} {isFr ? 'reçu avec succès' : 'received successfully'}.
              </p>
            </div>
            {user && (
              <Button onClick={() => { handleClose(); navigate('/dashboard'); }} className="w-full bg-primary text-primary-foreground">
                {isFr ? 'Mon tableau de bord' : 'My dashboard'}
              </Button>
            )}
            <Button variant="ghost" onClick={handleClose} className="text-muted-foreground">{isFr ? 'Fermer' : 'Close'}</Button>
          </div>
        )}

        {step === 'error' && (
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-14 w-14 text-destructive" />
            <p className="font-semibold">{isFr ? 'Erreur' : 'Error'}</p>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
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
