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

interface OfferingModalProps {
  offering: Offering | null;
  organizationId: string;
  open: boolean;
  onClose: () => void;
}

type Step = 'form' | 'processing' | 'success' | 'error';

export function OfferingModal({ offering, organizationId, open, onClose }: OfferingModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<string>('monthly');
  const [step, setStep] = useState<Step>('form');
  const [result, setResult] = useState<VerifyPaymentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currency = offering?.currency || 'XOF';

  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { openPayment, hasPaystackKey } = usePaymentGateway();

  const defaultMethod: PaymentMethod = isMoMoAvailable(currency) && hasPaystackKey ? 'mobile_money' : 'card';
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

  if (!offering) return null;

  const presets = offering.preset_amounts || [1000, 2500, 5000, 10000];

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ` ${currency}`;

  const resolvedEmail = email || user?.email || '';
  const resolvedName = name || profile?.display_name || '';
  const effectiveAmount = Number(amount);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!amount || Number(amount) < 100) {
      toast({ title: 'Montant invalide', description: 'Le montant minimum est de 100 ' + currency + '.', variant: 'destructive' });
      return;
    }
    if (!resolvedEmail) {
      toast({ title: 'Email requis', description: 'Veuillez saisir votre email.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    const affiliateCode = getAffiliateCode();

    try {
      await openPayment({
        method: paymentMethod,
        email: resolvedEmail,
        amount: effectiveAmount,
        currency,
        type: 'donation', // reuse donation flow for payment processing
        organization_id: organizationId,
        buyer_name: resolvedName || 'Donateur',
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

            // Also record in offering_transactions
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
            // Payment succeeded but verify failed — redirect to success page for retry
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
      const message = err instanceof Error ? err.message : 'Impossible d\'ouvrir le paiement.';
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
              {/* Preset amounts */}
              <div>
                <Label className="text-xs mb-2 block">Choisir un montant</Label>
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
                <Label htmlFor="offering-amount" className="text-xs">Ou montant personnalisé ({currency})</Label>
                <Input
                  id="offering-amount"
                  type="number"
                  min={100}
                  placeholder="ex. 3000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              {/* Recurring option */}
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
                      Rendre ce don récurrent
                    </Label>
                  </div>
                  {isRecurring && (
                    <Select value={recurringInterval} onValueChange={setRecurringInterval}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Chaque semaine</SelectItem>
                        <SelectItem value="monthly">Chaque mois</SelectItem>
                        <SelectItem value="yearly">Chaque année</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {!user && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="oname" className="text-xs">Nom</Label>
                    <Input id="oname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="oemail" className="text-xs">Email *</Label>
                    <Input id="oemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className="mt-1.5" required />
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
                  Mobile Money est temporairement indisponible. Utilisez Carte bancaire pour finaliser le paiement.
                </p>
              )}

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Paiement sécurisé par {paymentMethod === 'card' ? 'Stripe' : 'Paystack'}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">Annuler</Button>
              <Button
                onClick={handleSubmit}
                disabled={!amount || Number(amount) < 100 || isSubmitting}
                className="flex-1 bg-primary text-primary-foreground"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Donner {amount ? fmt(effectiveAmount) : ''}
              </Button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="py-10 flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="font-medium">Vérification du paiement…</p>
          </div>
        )}

        {step === 'success' && result && (
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-14 w-14 text-green-500" />
            <div>
              <p className="font-semibold text-lg">🙏 Merci pour votre don !</p>
              <p className="text-sm text-muted-foreground mt-1">
                {fmt(result.breakdown.amount)} reçu avec succès.
              </p>
            </div>
            {user && (
              <Button onClick={() => { handleClose(); navigate('/dashboard'); }} className="w-full bg-primary text-primary-foreground">
                Mon tableau de bord
              </Button>
            )}
            <Button variant="ghost" onClick={handleClose} className="text-muted-foreground">Fermer</Button>
          </div>
        )}

        {step === 'error' && (
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-14 w-14 text-destructive" />
            <p className="font-semibold">Erreur</p>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
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
