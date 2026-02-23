import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DigitalProduct } from '@/types/database';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ShoppingBag, Lock, CheckCircle, AlertCircle, Loader2, ExternalLink, Download, User, Mail, Phone, Tag, X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePaystack } from '@/hooks/usePaystack';
import { getAffiliateCode, clearAffiliateCode } from '@/hooks/useAffiliateCapture';
import { verifyPayment, VerifyPaymentResult } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';
import { formatPrice } from '@/lib/currency';

interface ProductPurchaseModalProps {
  product: DigitalProduct | null;
  organizationId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: VerifyPaymentResult) => void;
}

type Step = 'confirm' | 'buyer-info' | 'processing' | 'success' | 'error';

interface BuyerInfo {
  name: string;
  email: string;
  phone: string;
}

interface PromoState {
  code: string;
  validating: boolean;
  applied: boolean;
  discountPercent: number;
  error: string;
}

export function ProductPurchaseModal({ product, organizationId, open, onClose, onSuccess }: ProductPurchaseModalProps) {
  const [step, setStep] = useState<Step>('confirm');
  const [result, setResult] = useState<VerifyPaymentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const { user, profile } = useAuth();
  const { openPayment } = usePaystack();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    name: profile?.display_name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
  });
  const [formErrors, setFormErrors] = useState<Partial<BuyerInfo>>({});

  const [promo, setPromo] = useState<PromoState>({
    code: '', validating: false, applied: false, discountPercent: 0, error: '',
  });

  if (!product) return null;

  const fmt = (n: number) => formatPrice(n, product.is_free, product.currency);

  const discountAmount = promo.applied ? Math.round((product.price ?? 0) * promo.discountPercent / 100) : 0;
  const finalPrice = Math.max(0, (product.price ?? 0) - discountAmount);

  const validatePromoCode = async () => {
    const trimmed = promo.code.trim().toUpperCase();
    if (!trimmed) return;
    setPromo(p => ({ ...p, validating: true, error: '' }));
    try {
      const { data, error } = await db.from('promo_codes')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('code', trimmed)
        .eq('is_active', true)
        .maybeSingle();
      if (error || !data) {
        setPromo(p => ({ ...p, validating: false, error: 'Code invalide ou expiré.' }));
        return;
      }
      if (data.max_uses && data.current_uses >= data.max_uses) {
        setPromo(p => ({ ...p, validating: false, error: 'Ce code a atteint sa limite d\'utilisation.' }));
        return;
      }
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setPromo(p => ({ ...p, validating: false, error: 'Ce code a expiré.' }));
        return;
      }
      if (data.product_id && data.product_id !== product.id) {
        setPromo(p => ({ ...p, validating: false, error: 'Ce code n\'est pas valide pour ce produit.' }));
        return;
      }
      setPromo(p => ({ ...p, validating: false, applied: true, discountPercent: data.discount_percent, error: '' }));
      toast({ title: `🎉 -${data.discount_percent}% appliqué !` });
    } catch {
      setPromo(p => ({ ...p, validating: false, error: 'Erreur de vérification.' }));
    }
  };

  const clearPromo = () => setPromo({ code: '', validating: false, applied: false, discountPercent: 0, error: '' });

  const validateBuyerInfo = (): boolean => {
    const errors: Partial<BuyerInfo> = {};
    if (!buyerInfo.name.trim()) errors.name = 'Nom requis';
    if (!buyerInfo.email.trim()) errors.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerInfo.email.trim())) errors.email = 'Email invalide';
    if (!buyerInfo.phone.trim()) errors.phone = 'Téléphone requis';
    else if (buyerInfo.phone.trim().length < 8) errors.phone = 'Numéro trop court';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmToBuyerInfo = () => {
    if (!user) {
      handleClose();
      navigate(`/auth?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }
    setBuyerInfo(prev => ({
      name: prev.name || profile?.display_name || '',
      email: prev.email || user?.email || '',
      phone: prev.phone || profile?.phone || '',
    }));
    setFormErrors({});
    setStep('buyer-info');
  };

  const handlePurchase = async () => {
    if (!validateBuyerInfo()) return;

    if (product.is_free || finalPrice === 0) {
      setStep('success');
      onSuccess?.({ ok: true, transaction_id: 'free', breakdown: { amount: 0, currency: product.currency || 'XOF', platform_fee: 0, affiliate_commission: 0, organization_amount: 0, affiliate_attributed: false } });
      return;
    }

    const affiliateCode = getAffiliateCode();

    try {
      await openPayment({
        email: buyerInfo.email.trim(),
        amount: finalPrice,
        currency: product.currency || 'XOF',
        metadata: {
          type: 'product',
          product_id: product.id,
          organization_id: organizationId,
          buyer_name: buyerInfo.name.trim(),
          buyer_phone: buyerInfo.phone.trim(),
          donor_name: buyerInfo.name.trim(),
          donor_email: buyerInfo.email.trim(),
          user_id: user?.id || null,
          affiliate_code: getAffiliateCode() || null,
          promo_code: promo.applied ? promo.code.trim().toUpperCase() : null,
        },
        onClose: () => {},
        onSuccess: async (reference) => {
          setStep('processing');
          try {
            const verifyResult = await verifyPayment({
              reference,
              type: 'product',
              organization_id: organizationId,
              product_id: product.id,
              affiliate_code: affiliateCode,
              donor_name: buyerInfo.name.trim(),
              donor_email: buyerInfo.email.trim(),
              promo_code: promo.applied ? promo.code.trim().toUpperCase() : undefined,
            });
            clearAffiliateCode();
            setResult(verifyResult);
            setStep('success');
            onSuccess?.(verifyResult);
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erreur lors de la vérification du paiement.';
            setErrorMsg(message);
            setStep('error');
          }
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Impossible d\'ouvrir le paiement.';
      console.error('[ProductPurchaseModal] openPayment error:', err);
      toast({ title: 'Erreur de paiement', description: message, variant: 'destructive' });
    }
  };

  const handleClose = () => {
    setStep('confirm');
    setResult(null);
    setErrorMsg('');
    clearPromo();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            {product.is_free ? 'Télécharger gratuitement' : 'Acheter ce produit'}
          </DialogTitle>
          <DialogDescription className="line-clamp-3 break-words">{product.description}</DialogDescription>
        </DialogHeader>

        {/* ── CONFIRM ─── */}
        {step === 'confirm' && (
          <>
            <div className="space-y-4 py-2">
              {product.cover_image_url && (
                <img src={product.cover_image_url} alt={product.title} className="w-full h-36 object-cover rounded-xl" />
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{product.title}</p>
                  <Badge variant="outline" className="text-[10px] mt-1 capitalize">{product.product_type}</Badge>
                </div>
                <span className={`text-xl font-bold ${product.is_free ? 'text-green-500' : 'text-primary'}`}>
                  {fmt(product.price)}
                </span>
              </div>

              {/* Promo code input */}
              {!product.is_free && !product.external_link && (
                <div className="space-y-2">
                  {!promo.applied ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><Tag className="h-3 w-3" /> Code promo</Label>
                      <div className="flex gap-2">
                        <Input
                          value={promo.code}
                          onChange={e => setPromo(p => ({ ...p, code: e.target.value.toUpperCase(), error: '' }))}
                          placeholder="EX: BIENVENUE20"
                          className="h-8 text-xs font-mono uppercase flex-1"
                        />
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={validatePromoCode} disabled={promo.validating || !promo.code.trim()}>
                          {promo.validating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Appliquer'}
                        </Button>
                      </div>
                      {promo.error && <p className="text-xs text-destructive">{promo.error}</p>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400">Code {promo.code} appliqué — {promo.discountPercent}% de réduction</p>
                      </div>
                      <button onClick={clearPromo}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
                    </div>
                  )}

                  <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                    <p className="text-muted-foreground text-xs">Récapitulatif :</p>
                    <div className="flex justify-between"><span>Prix</span><span>{fmt(product.price)}</span></div>
                    {promo.applied && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Réduction (-{promo.discountPercent}%)</span>
                        <span>-{fmt(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
                      <span>Total</span><span className="text-primary">{fmt(finalPrice)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  {product.external_link
                    ? 'You will be redirected to an external link'
                    : product.is_free
                      ? 'Immediate access after download'
                      : 'Secure payments powered by Paystack. Methods depend on availability by country.'}
                </div>
                {!product.external_link && !product.is_free && (
                  <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                    <a href="/refund-policy" target="_blank" className="underline hover:text-foreground">Refund Policy</a>
                    <a href="/payout-policy" target="_blank" className="underline hover:text-foreground">Payout Policy</a>
                    <a href="/acceptable-use" target="_blank" className="underline hover:text-foreground">Acceptable Use</a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">Annuler</Button>
              {product.external_link ? (
                <a href={product.external_link} target="_blank" rel="noreferrer" className="flex-1">
                  <Button className="w-full bg-primary text-primary-foreground gap-1.5">
                    <ExternalLink className="h-4 w-4" /> Accéder au contenu
                  </Button>
                </a>
              ) : (
                <Button
                  onClick={handleConfirmToBuyerInfo}
                  className="flex-1 bg-primary text-primary-foreground"
                >
                  {product.is_free || finalPrice === 0 ? 'Accéder gratuitement' : `Payer ${fmt(finalPrice)}`}
                </Button>
              )}
            </div>
          </>
        )}

        {/* ── BUYER INFO ─── */}
        {step === 'buyer-info' && (
          <>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Remplissez vos informations avant de procéder au paiement.
              </p>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="buyer-name" className="text-sm flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Nom complet
                  </Label>
                  <Input id="buyer-name" placeholder="Votre nom complet" value={buyerInfo.name} onChange={(e) => setBuyerInfo(prev => ({ ...prev, name: e.target.value }))} maxLength={100} />
                  {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="buyer-email" className="text-sm flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </Label>
                  <Input id="buyer-email" type="email" placeholder="votre@email.com" value={buyerInfo.email} onChange={(e) => setBuyerInfo(prev => ({ ...prev, email: e.target.value }))} maxLength={255} />
                  {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="buyer-phone" className="text-sm flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Téléphone
                  </Label>
                  <Input id="buyer-phone" type="tel" placeholder="+225 07 00 00 00 00" value={buyerInfo.phone} onChange={(e) => setBuyerInfo(prev => ({ ...prev, phone: e.target.value }))} maxLength={20} />
                  {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                {promo.applied && (
                  <div className="flex justify-between text-green-600 dark:text-green-400 text-xs mb-1">
                    <span>🎟️ {promo.code} (-{promo.discountPercent}%)</span>
                    <span>-{fmt(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>Total à payer</span>
                  <span className="text-primary">{product.is_free || finalPrice === 0 ? 'Gratuit' : fmt(finalPrice)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('confirm')} className="flex-1">Retour</Button>
              <Button onClick={handlePurchase} className="flex-1 bg-primary text-primary-foreground">
                {product.is_free || finalPrice === 0 ? 'Confirmer' : `Payer ${fmt(finalPrice)}`}
              </Button>
            </div>
          </>
        )}

        {/* ── PROCESSING ─── */}
        {step === 'processing' && (
          <div className="py-10 flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="font-medium">Vérification du paiement…</p>
            <p className="text-sm text-muted-foreground">Ne fermez pas cette fenêtre.</p>
          </div>
        )}

        {/* ── SUCCESS ─── */}
        {step === 'success' && (
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-14 w-14 text-green-500" />
            <div>
              <p className="font-semibold text-lg">Achat confirmé !</p>
              {result && (
                <p className="text-sm text-muted-foreground mt-1">
                  {fmt(result.breakdown.amount)} payé.
                  {result.breakdown.promo_applied && ` (réduction de ${fmt(result.breakdown.discount_amount || 0)})`}
                </p>
              )}
            </div>

            <div className="w-full space-y-2">
              {product.file_url && (
                <a href={product.file_url} target="_blank" rel="noreferrer" className="w-full">
                  <Button className="w-full gap-2 bg-primary text-primary-foreground">
                    <Download className="h-4 w-4" /> Télécharger le fichier
                  </Button>
                </a>
              )}
              {product.external_link && (
                <a href={product.external_link} target="_blank" rel="noreferrer" className="w-full">
                  <Button variant="outline" className="w-full gap-2">
                    <ExternalLink className="h-4 w-4" /> Accéder au contenu
                  </Button>
                </a>
              )}
            </div>

            <p className="text-xs text-muted-foreground">Un reçu a été envoyé à votre email.</p>
            <Button onClick={() => { handleClose(); navigate('/dashboard'); }} className="w-full bg-primary text-primary-foreground gap-1.5">
              Accéder à mon tableau de bord
            </Button>
            <Button variant="ghost" onClick={handleClose} className="text-muted-foreground">Fermer</Button>
          </div>
        )}

        {/* ── ERROR ─── */}
        {step === 'error' && (
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-14 w-14 text-destructive" />
            <div>
              <p className="font-semibold">Une erreur est survenue</p>
              <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
            </div>
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={handleClose} className="flex-1">Fermer</Button>
              <Button onClick={() => setStep('buyer-info')} className="flex-1">Réessayer</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
