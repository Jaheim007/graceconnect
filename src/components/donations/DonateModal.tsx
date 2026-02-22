import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { usePaystack } from '@/hooks/usePaystack';
import { getAffiliateCode, clearAffiliateCode } from '@/hooks/useAffiliateCapture';
import { verifyPayment, VerifyPaymentResult } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

import { db } from '@/lib/db';
import { Tag } from 'lucide-react';

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
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null);
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [result, setResult] = useState<VerifyPaymentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { openPayment } = usePaystack();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!campaign) return null;

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' XOF';

  const resolvedEmail = email || user?.email || '';
  const resolvedName = name || profile?.display_name || '';

  const validatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoValidating(true);
    setPromoError('');
    setPromoDiscount(null);
    try {
      const { data, error } = await db
        .from('promo_codes')
        .select('id, discount_percent, max_uses, current_uses, expires_at, is_active')
        .eq('code', promoCode.trim().toUpperCase())
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .maybeSingle();
      if (error || !data) { setPromoError('Code invalide'); return; }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { setPromoError('Code expiré'); return; }
      if (data.max_uses && data.current_uses >= data.max_uses) { setPromoError('Code épuisé'); return; }
      setPromoDiscount(data.discount_percent);
    } catch { setPromoError('Erreur de validation'); }
    finally { setPromoValidating(false); }
  };

  const effectiveAmount = promoDiscount && amount ? Math.round(Number(amount) * (1 - promoDiscount / 100)) : Number(amount);

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
        amount: effectiveAmount,
        currency: campaign.currency || 'XOF',
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
              donor_name: isAnonymous ? 'Anonyme' : (resolvedName || undefined),
              donor_email: resolvedEmail || undefined,
            });
            clearAffiliateCode();
            setResult(verifyResult);
            setStep('success');
            onSuccess?.(verifyResult);
            // Refresh campaign data so progress bar updates
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
    }
  };

  const handleClose = () => {
    setStep('form');
    setAmount('');
    setName('');
    setEmail('');
    setPromoCode('');
    setPromoDiscount(null);
    setPromoError('');
    setIsAnonymous(false);
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

              {/* Promo code */}
              <div>
                <Label className="text-xs flex items-center gap-1"><Tag className="h-3 w-3" /> Code promo (optionnel)</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    placeholder="CODE2024"
                    value={promoCode}
                    onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoDiscount(null); setPromoError(''); }}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={validatePromo} disabled={promoValidating || !promoCode.trim()}>
                    {promoValidating ? '...' : 'Appliquer'}
                  </Button>
                </div>
                {promoError && <p className="text-xs text-destructive mt-1">{promoError}</p>}
                {promoDiscount && (
                  <p className="text-xs text-green-600 mt-1">✓ -{promoDiscount}% appliqué — Nouveau montant : {amount ? fmt(effectiveAmount) : '—'}</p>
                )}
              </div>

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

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Secure payments powered by Paystack
                </div>
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
                disabled={!amount || Number(amount) < 100}
                className="flex-1 gold-gradient text-primary-foreground border-0 shadow-gold"
              >
                Donner {amount ? fmt(effectiveAmount) : ''}
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
            {user && (
              <Button
                onClick={() => { handleClose(); navigate('/dashboard'); }}
                className="w-full gold-gradient text-primary-foreground border-0 shadow-gold"
              >
                Accéder à mon tableau de bord
              </Button>
            )}
            <Button variant="ghost" onClick={handleClose} className="text-muted-foreground">Fermer</Button>
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
