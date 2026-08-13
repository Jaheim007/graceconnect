import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { DigitalProduct } from '@/types/database';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BuyerFeeNote } from '@/components/payments/FeeBreakdown';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ShoppingBag, Lock, CheckCircle, AlertCircle, Loader2, ExternalLink, Download, User, Mail, Phone, Tag, X, Gift,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePaymentGateway, PaymentMethod } from '@/hooks/usePaymentGateway';
import { PaymentMethodSelector } from '@/components/payments/PaymentMethodSelector';
import { getAffiliateCode, clearAffiliateCode } from '@/hooks/useAffiliateCapture';
import { isMoMoAvailable } from '@/lib/paymentRouting';
import { verifyPayment, VerifyPaymentResult } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';
import { formatPrice, formatCurrency } from '@/lib/currency';
import { useAbandonedCart } from '@/hooks/useAbandonedCart';
import { getAutoPromoCode, clearAutoPromoCode } from '@/hooks/usePromoCapture';
import { onNewSale } from '@/lib/notifications';
import { fetchWatermarkedFile, triggerBrowserDownload } from '@/lib/secureDownload';
import { useI18n } from '@/i18n/I18nContext';

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
  discountType: 'percent' | 'fixed';
  discountFixedAmount: number;
  error: string;
  promoCodeId: string | null;
}

export function ProductPurchaseModal({ product, organizationId, open, onClose, onSuccess }: ProductPurchaseModalProps) {
  const [step, setStep] = useState<Step>('confirm');
  const [result, setResult] = useState<VerifyPaymentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Course products must go through payment even though they have external_link
  const isCourseProduct = product?.product_type === 'course';
  const effectiveExternalLink = isCourseProduct ? null : product?.external_link;
  const [pwywAmount, setPwywAmount] = useState<string>('');

  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { openPayment, hasPaystackKey } = usePaymentGateway();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const defaultMethod: PaymentMethod =
    isMoMoAvailable(product?.currency || 'XOF') && hasPaystackKey ? 'mobile_money' : 'card';
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(defaultMethod);

  useEffect(() => {
    setPaymentMethod(defaultMethod);
  }, [product?.id, product?.currency]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { trackCartOpen, markConverted } = useAbandonedCart();

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

  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    name: profile?.display_name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
  });
  const [formErrors, setFormErrors] = useState<Partial<BuyerInfo>>({});

  const [promo, setPromo] = useState<PromoState>({
    code: '', validating: false, applied: false, discountPercent: 0, discountType: 'percent', discountFixedAmount: 0, error: '', promoCodeId: null,
  });
  const [promoOpen, setPromoOpen] = useState(false);
  const [orderBumpChecked, setOrderBumpChecked] = useState(false);
  useEffect(() => {
    if (!open) return;
    const autoCode = getAutoPromoCode();
    // Only auto-fill short, human-readable promo codes (max 30 chars, alphanumeric)
    if (autoCode && autoCode.length <= 30 && /^[A-Z0-9_-]+$/i.test(autoCode) && !promo.applied) {
      setPromo(p => ({ ...p, code: autoCode }));
      setPromoOpen(true);
    }
    clearAutoPromoCode();
  }, [open]);

  const bumpProductId = (product as any)?.order_bump_product_id;
  const bumpDiscount = (product as any)?.order_bump_discount_percent || 0;
  const { data: bumpProduct } = useQuery({
    queryKey: ['bump-product', bumpProductId],
    queryFn: async () => {
      if (!bumpProductId) return null;
      const { data } = await db.from('digital_products').select('id, title, price, currency, cover_image_url').eq('id', bumpProductId).maybeSingle();
      return data;
    },
    enabled: !!bumpProductId,
  });

  const upsellIds: string[] = (product as any)?.upsell_product_ids || [];
  const { data: upsellProducts = [] } = useQuery({
    queryKey: ['upsell-products', product?.id],
    queryFn: async () => {
      if (!upsellIds.length) return [];
      const { data } = await db.from('digital_products').select('id, title, price, currency, cover_image_url, is_free, is_published').in('id', upsellIds).eq('is_published', true);
      return data || [];
    },
    enabled: upsellIds.length > 0,
  });

  if (!product) return null;

  const fmt = (n: number) => formatPrice(n, product.is_free, product.currency);

  const salePrice = (product as any).sale_price;
  const saleEndsAt = (product as any).sale_ends_at;
  const isPwyw = !!(product as any).is_pwyw;
  // Flash sale is ignored when PWYW is active
  const isFlashSale = !isPwyw && salePrice != null && saleEndsAt && new Date(saleEndsAt) > new Date();
  const rawMinPrice = (product as any).min_price || 0;
  const productCurrency = (product as any).currency || 'XOF';
  const pwywFloors: Record<string, number> = { XOF: 500, XAF: 500, NGN: 500, USD: 1, EUR: 1, GBP: 1, GHS: 5, KES: 100, ZAR: 10, MAD: 10, TND: 3 };
  const minPrice = Math.max(rawMinPrice, pwywFloors[productCurrency] || 500);
  const suggestedPrice = product.price ?? 0;

  const pwywValue = isPwyw && pwywAmount ? parseFloat(pwywAmount) : 0;
  const effectiveBasePrice = isPwyw
    ? (pwywValue > 0 ? pwywValue : minPrice)
    : isFlashSale ? salePrice : (product.price ?? 0);

  const bumpPrice = bumpProduct ? Math.round((bumpProduct.price || 0) * (1 - bumpDiscount / 100)) : 0;
  const orderBumpTotal = orderBumpChecked && bumpProduct ? bumpPrice : 0;

  const discountAmount = promo.applied
    ? promo.discountType === 'fixed'
      ? promo.discountFixedAmount
      : Math.round(effectiveBasePrice * promo.discountPercent / 100)
    : 0;
  const finalPrice = Math.max(0, effectiveBasePrice - discountAmount) + orderBumpTotal;

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
        setPromo(p => ({ ...p, validating: false, error: isFr ? 'Code invalide ou expiré.' : 'Invalid or expired code.' }));
        return;
      }
      if (data.max_uses && data.current_uses >= data.max_uses) {
        setPromo(p => ({ ...p, validating: false, error: isFr ? 'Ce code a atteint sa limite d\'utilisation.' : 'This code has reached its usage limit.' }));
        return;
      }
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setPromo(p => ({ ...p, validating: false, error: isFr ? 'Ce code a expiré.' : 'This code has expired.' }));
        return;
      }
      if (data.product_id && data.product_id !== product.id) {
        setPromo(p => ({ ...p, validating: false, error: isFr ? 'Ce code n\'est pas valide pour ce produit.' : 'This code is not valid for this product.' }));
        return;
      }
      const discType = (data.discount_type || 'percent') as 'fixed' | 'percent';
      const label = discType === 'fixed' ? `-${data.discount_amount} ${isFr ? 'fixe' : 'fixed'}` : `-${data.discount_percent}%`;
      setPromo(p => ({
        ...p, validating: false, applied: true,
        discountPercent: data.discount_percent || 0,
        discountType: discType,
        discountFixedAmount: data.discount_amount || 0,
        error: '',
        promoCodeId: data.id,
      }));
      toast({ title: `🎉 ${label} ${isFr ? 'appliqué' : 'applied'} !` });
    } catch {
      setPromo(p => ({ ...p, validating: false, error: isFr ? 'Erreur de vérification.' : 'Verification error.' }));
    }
  };

  const clearPromo = () => { setPromo({ code: '', validating: false, applied: false, discountPercent: 0, discountType: 'percent', discountFixedAmount: 0, error: '', promoCodeId: null }); setPromoOpen(false); };

  const validateBuyerInfo = (): boolean => {
    const errors: Partial<BuyerInfo> = {};
    if (!buyerInfo.name.trim()) errors.name = isFr ? 'Nom requis' : 'Name required';
    if (!buyerInfo.email.trim()) errors.email = isFr ? 'Email requis' : 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerInfo.email.trim())) errors.email = isFr ? 'Email invalide' : 'Invalid email';
    if (!buyerInfo.phone.trim()) errors.phone = isFr ? 'Téléphone requis' : 'Phone required';
    else if (buyerInfo.phone.trim().length < 8) errors.phone = isFr ? 'Numéro trop court' : 'Number too short';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmToBuyerInfo = () => {
    if (isPwyw && !product.is_free) {
      const amt = pwywValue > 0 ? pwywValue : suggestedPrice;
      if (amt < minPrice) {
        toast({ title: isFr ? 'Montant trop bas' : 'Amount too low', description: `${isFr ? 'Le minimum est' : 'Minimum is'} ${fmt(minPrice)}`, variant: 'destructive' });
        return;
      }
    }
    if (!user) {
      handleClose();
      const returnPath = pathname + '?action=buy';
      try { sessionStorage.setItem('sv_auth_returnTo', returnPath); } catch {}
      navigate(`/auth?returnTo=${encodeURIComponent(returnPath)}`);
      return;
    }
    if (product) trackCartOpen(product.id, organizationId);
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
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (product.is_free && finalPrice === 0) {
      try {
        const { data: claimData, error: claimErr } = await db.functions.invoke('claim-free-product', {
          body: { product_id: product.id, organization_id: organizationId },
        });
        if (claimErr) throw claimErr;
        await queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
      } catch (e) {
        console.warn('[ProductPurchaseModal] Free claim error:', e);
      }
      setIsSubmitting(false);
      setStep('success');
      onSuccess?.({ ok: true, transaction_id: 'free', breakdown: { amount: 0, currency: product.currency || 'XOF', platform_fee: 0, affiliate_commission: 0, organization_amount: 0, affiliate_attributed: false } });
      return;
    }

    // Robust affiliate resolution: cookie/localStorage first, then fallback to URL ?ref= param
    const affiliateCode = getAffiliateCode() || new URLSearchParams(window.location.search).get('ref') || null;

    try {
      await openPayment({
        method: paymentMethod,
        email: buyerInfo.email.trim(),
        amount: finalPrice,
        currency: product.currency || 'XOF',
        type: 'product',
        organization_id: organizationId,
        product_id: product.id,
        buyer_name: buyerInfo.name.trim(),
        affiliate_code: affiliateCode,
        promo_code: promo.applied ? promo.code.trim().toUpperCase() : undefined,
        subaccount: orgPayment?.paystack_subaccount_code || undefined,
        platformFeeAmount: orgPayment?.paystack_subaccount_code
          ? finalPrice * (
              ((orgPayment?.platform_fee_percent ?? 10) +
               (affiliateCode && orgPayment?.affiliation_enabled ? (orgPayment?.affiliation_commission_percent ?? 10) : 0)) / 100
            )
          : undefined,
        metadata: {
          type: 'product',
          product_id: product.id,
          organization_id: organizationId,
          buyer_name: buyerInfo.name.trim(),
          buyer_phone: buyerInfo.phone.trim(),
          donor_name: buyerInfo.name.trim(),
          donor_email: buyerInfo.email.trim(),
          user_id: user?.id || null,
          affiliate_code: affiliateCode || null,
          promo_code: promo.applied ? promo.code.trim().toUpperCase() : null,
        },
        onClose: () => {
          setIsSubmitting(false);
        },
        onSuccess: async (reference, gateway) => {
          if (gateway === 'stripe') return;
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
            if (product) markConverted(product.id);
            await queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
            setResult(verifyResult);
            setStep('success');
            onSuccess?.(verifyResult);
            onNewSale(organizationId, '', product.title, buyerInfo.name.trim(), verifyResult.breakdown.amount, product.currency || 'XOF');
          } catch (err: unknown) {
            console.error('[ProductPurchaseModal] verify error:', err);
            const params = new URLSearchParams({
              reference,
              gateway: 'paystack',
              type: 'product',
              organization_id: organizationId,
              product_id: product.id,
            });
            navigate(`/payment/success?${params.toString()}`);
          }
        },
      });
    } catch (err: unknown) {
      setIsSubmitting(false);
      const message = err instanceof Error ? err.message : (isFr ? 'Impossible d\'ouvrir le paiement.' : 'Unable to open payment.');
      console.error('[ProductPurchaseModal] openPayment error:', err);
      // Provide user-friendly guidance for common mobile issues
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
      const hint = isMobile ? (isFr ? ' Vérifiez que les pop-ups ne sont pas bloqués.' : ' Check that popups are not blocked.') : '';
      toast({ title: isFr ? 'Erreur de paiement' : 'Payment error', description: message + hint, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
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
            {product.is_free && !isPwyw
              ? (isFr ? 'Télécharger gratuitement' : 'Download for free')
              : (isFr ? 'Acheter ce produit' : 'Buy this product')}
          </DialogTitle>
          <DialogDescription className="line-clamp-4 break-words text-sm leading-relaxed">{product.description?.replace(/<[^>]*>/g, '') || ''}</DialogDescription>
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
              {!isPwyw && (
                  <div className="text-right">
                    {isFlashSale ? (
                      <>
                        <span className="text-sm text-muted-foreground line-through mr-1.5">
                          {fmt(product.price)}
                        </span>
                        <span className="text-xl font-bold text-primary">
                          {fmt(salePrice)}
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {isFr ? 'Vous serez débité de' : 'You will be charged'} {formatCurrency(salePrice, product.currency)} {(product.currency || 'XOF').toUpperCase()}
                        </p>
                      </>
                    ) : (
                      <>
                        <span className={`text-xl font-bold ${product.is_free ? 'text-green-500' : 'text-primary'}`}>
                          {fmt(product.price)}
                        </span>
                        {!product.is_free && (product.price ?? 0) > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {isFr ? 'Vous serez débité de' : 'You will be charged'} {formatCurrency(product.price ?? 0, product.currency)} {(product.currency || 'XOF').toUpperCase()}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Pay What You Want */}
              {isPwyw && !product.is_free && (
                <div className="bg-accent/20 border border-accent/40 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold flex items-center gap-2">💰 {isFr ? 'Payez ce que vous voulez' : 'Pay what you want'}</p>
                  <p className="text-xs text-muted-foreground">
                    {isFr ? 'Prix suggéré' : 'Suggested price'} : <strong>{fmt(suggestedPrice)}</strong>
                    {minPrice > 0 && <> · Minimum : <strong>{fmt(minPrice)}</strong></>}
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isFr ? 'Votre prix' : 'Your price'} ({product.currency || 'XOF'})</Label>
                    <Input
                      type="number"
                      value={pwywAmount}
                      onChange={e => setPwywAmount(e.target.value)}
                      placeholder={String(suggestedPrice)}
                      min={minPrice}
                      className="h-9 text-sm font-semibold"
                    />
                    {pwywValue > 0 && pwywValue < minPrice && (
                      <p className="text-xs text-destructive">{isFr ? 'Le montant minimum est' : 'Minimum amount is'} {fmt(minPrice)}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {[minPrice || Math.round(suggestedPrice * 0.5), suggestedPrice, Math.round(suggestedPrice * 1.5)].filter(v => v > 0).map(v => (
                      <Button key={v} type="button" variant={pwywValue === v ? 'default' : 'outline'} size="sm" className="text-xs flex-1" onClick={() => setPwywAmount(String(v))}>
                        {fmt(v)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Promo code */}
              {!product.is_free && !effectiveExternalLink && (
                <div className="space-y-2">
                  {promo.applied ? (
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400">{isFr ? 'Code' : 'Code'} {promo.code} {isFr ? 'appliqué' : 'applied'} — {promo.discountType === 'fixed' ? `-${promo.discountFixedAmount}` : `-${promo.discountPercent}%`}</p>
                      </div>
                      <button onClick={clearPromo}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
                    </div>
                  ) : !promoOpen ? (
                    <button
                      type="button"
                      onClick={() => setPromoOpen(true)}
                      className="text-xs text-muted-foreground underline hover:text-foreground flex items-center gap-1"
                    >
                      <Tag className="h-3 w-3" /> {isFr ? 'J\'ai un code promo' : 'I have a promo code'}
                    </button>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><Tag className="h-3 w-3" /> {isFr ? 'Code promo' : 'Promo code'}</Label>
                      <div className="flex gap-2">
                        <Input
                          value={promo.code}
                          onChange={e => setPromo(p => ({ ...p, code: e.target.value.toUpperCase(), error: '' }))}
                          placeholder="EX: WELCOME20"
                          className="h-8 text-xs font-mono uppercase flex-1"
                        />
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={validatePromoCode} disabled={promo.validating || !promo.code.trim()}>
                          {promo.validating ? <Loader2 className="h-3 w-3 animate-spin" /> : (isFr ? 'Appliquer' : 'Apply')}
                        </Button>
                      </div>
                      {promo.error && <p className="text-xs text-destructive">{promo.error}</p>}
                    </div>
                  )}

                  {promo.applied && (
                    <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                      {isFlashSale && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>{isFr ? 'Prix original' : 'Original price'}</span>
                          <span className="line-through">{fmt(product.price)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>{isFlashSale ? (isFr ? 'Prix promo' : 'Sale price') : (isFr ? 'Prix' : 'Price')}</span>
                        <span>{fmt(effectiveBasePrice)}</span>
                      </div>
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>{isFr ? 'Réduction' : 'Discount'} ({promo.discountType === 'fixed' ? `${promo.discountFixedAmount} ${isFr ? 'fixe' : 'fixed'}` : `-${promo.discountPercent}%`})</span>
                          <span>-{fmt(discountAmount)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
                        <span>Total</span><span className="text-primary">{fmt(finalPrice)}</span>
                      </div>
                      {finalPrice > 0 && <BuyerFeeNote className="mt-2" />}
                    </div>
                  )}
                </div>
              )}

              {/* Order Bump */}
              {bumpProduct && !product.is_free && !effectiveExternalLink && (
                <label className="flex items-start gap-3 p-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:border-primary/50 transition-colors">
                  <input type="checkbox" checked={orderBumpChecked} onChange={e => setOrderBumpChecked(e.target.checked)}
                    className="mt-0.5 rounded border-primary text-primary focus:ring-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Gift className="h-3.5 w-3.5" /> {isFr ? 'Offre spéciale !' : 'Special offer!'}
                    </div>
                    <p className="text-xs mt-0.5">{isFr ? 'Ajoutez' : 'Add'} <strong>{bumpProduct.title}</strong> {isFr ? 'pour seulement' : 'for only'} <strong>{fmt(bumpPrice)}</strong>
                      {bumpDiscount > 0 && <span className="text-muted-foreground line-through ml-1">{fmt(bumpProduct.price)}</span>}
                    </p>
                  </div>
                </label>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  {effectiveExternalLink
                    ? (isFr ? 'Vous serez redirigé vers un lien externe' : 'You will be redirected to an external link')
                    : product.is_free
                      ? (isFr ? 'Accès immédiat après téléchargement' : 'Immediate access after download')
                      : (isFr ? `Paiement sécurisé par ${paymentMethod === 'card' ? 'Stripe' : 'Paystack'}` : `Secure payment via ${paymentMethod === 'card' ? 'Stripe' : 'Paystack'}`)}
                </div>
                {!effectiveExternalLink && !product.is_free && (
                  <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                    <a href="/refund-policy" target="_blank" className="underline hover:text-foreground">{isFr ? 'Politique de remboursement' : 'Refund Policy'}</a>
                    <a href="/payout-policy" target="_blank" className="underline hover:text-foreground">{isFr ? 'Politique de versement' : 'Payout Policy'}</a>
                    <a href="/acceptable-use" target="_blank" className="underline hover:text-foreground">{isFr ? 'Utilisation acceptable' : 'Acceptable Use'}</a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">{isFr ? 'Annuler' : 'Cancel'}</Button>
              {effectiveExternalLink ? (
                <a href={effectiveExternalLink} target="_blank" rel="noreferrer" className="flex-1">
                  <Button className="w-full bg-primary text-primary-foreground gap-1.5">
                    <ExternalLink className="h-4 w-4" /> {isFr ? 'Accéder au contenu' : 'Access content'}
                  </Button>
                </a>
              ) : (
                <Button
                  onClick={handleConfirmToBuyerInfo}
                  className="flex-1 bg-primary text-primary-foreground"
                >
                  {isPwyw
                    ? `${isFr ? 'Payer' : 'Pay'} ${fmt(pwywValue > 0 ? pwywValue : minPrice)}`
                    : product.is_free
                      ? (isFr ? 'Accéder gratuitement' : 'Access for free')
                      : `${isFr ? 'Payer' : 'Pay'} ${fmt(finalPrice)}`}
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
                {isFr ? 'Remplissez vos informations avant de procéder au paiement.' : 'Fill in your details before proceeding to payment.'}
              </p>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="buyer-name" className="text-sm flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> {isFr ? 'Nom complet' : 'Full name'}
                  </Label>
                  <Input id="buyer-name" placeholder={isFr ? 'Votre nom complet' : 'Your full name'} value={buyerInfo.name} onChange={(e) => setBuyerInfo(prev => ({ ...prev, name: e.target.value }))} maxLength={100} />
                  {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="buyer-email" className="text-sm flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </Label>
                  <Input id="buyer-email" type="email" placeholder="your@email.com" value={buyerInfo.email} onChange={(e) => setBuyerInfo(prev => ({ ...prev, email: e.target.value }))} maxLength={255} />
                  {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="buyer-phone" className="text-sm flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {isFr ? 'Téléphone' : 'Phone'}
                  </Label>
                  <Input id="buyer-phone" type="tel" placeholder="+225 07 00 00 00 00" value={buyerInfo.phone} onChange={(e) => setBuyerInfo(prev => ({ ...prev, phone: e.target.value }))} maxLength={20} />
                  {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
                </div>
              </div>

              {/* Payment method selector */}
              {!product.is_free && (
                <>
                  <PaymentMethodSelector
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    currency={product.currency || 'XOF'}
                    paystackEnabled={hasPaystackKey}
                  />
                  {!hasPaystackKey && isMoMoAvailable(product.currency || 'XOF') && (
                    <p className="text-[10px] text-muted-foreground">
                      {isFr ? 'Mobile Money est temporairement indisponible. Utilisez Carte bancaire pour continuer.' : 'Mobile Money is temporarily unavailable. Use card payment to continue.'}
                    </p>
                  )}
                </>
              )}

              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                {isFlashSale && (
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>{isFr ? 'Prix original' : 'Original price'}</span>
                    <span className="line-through">{fmt(product.price)}</span>
                  </div>
                )}
                {isFlashSale && (
                  <div className="flex justify-between text-xs text-destructive font-medium">
                    <span>{isFr ? 'Réduction' : 'Sale discount'}</span>
                    <span>-{fmt((product.price ?? 0) - salePrice)}</span>
                  </div>
                )}
                {promo.applied && (
                  <div className="flex justify-between text-green-600 dark:text-green-400 text-xs">
                    <span>🎟️ {promo.code} ({promo.discountType === 'fixed' ? `${promo.discountFixedAmount} ${isFr ? 'fixe' : 'fixed'}` : `-${promo.discountPercent}%`})</span>
                    <span>-{fmt(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t border-border pt-1">
                  <span>{isFr ? 'Total à payer' : 'Total to pay'}</span>
                  <span className="text-primary">{product.is_free ? (isFr ? 'Gratuit' : 'Free') : fmt(finalPrice)}</span>
                </div>
                {!product.is_free && finalPrice > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    🔒 {isFr ? 'Paiement sécurisé par' : 'Secure payment via'} {paymentMethod === 'card' ? 'Stripe' : 'Paystack'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('confirm')} className="flex-1">{isFr ? 'Retour' : 'Back'}</Button>
              <Button onClick={handlePurchase} disabled={isSubmitting} className="flex-1 bg-primary text-primary-foreground">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                {product.is_free ? (isFr ? 'Confirmer' : 'Confirm') : `${isFr ? 'Payer' : 'Pay'} ${fmt(finalPrice)}`}
              </Button>
            </div>
          </>
        )}

        {/* ── PROCESSING ─── */}
        {step === 'processing' && (
          <div className="py-10 flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="font-medium">{isFr ? 'Vérification du paiement…' : 'Verifying payment…'}</p>
            <p className="text-sm text-muted-foreground">{isFr ? 'Ne fermez pas cette fenêtre.' : 'Do not close this window.'}</p>
          </div>
        )}

        {/* ── SUCCESS ─── */}
        {step === 'success' && (
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-14 w-14 text-green-500" />
            <div>
              <p className="font-semibold text-lg">{isFr ? 'Achat confirmé !' : 'Purchase confirmed!'}</p>
              {result && (
                <p className="text-sm text-muted-foreground mt-1">
                  {fmt(result.breakdown.amount)} {isFr ? 'payé' : 'paid'}.
                  {result.breakdown.promo_applied && ` (${isFr ? 'réduction de' : 'discount of'} ${fmt(result.breakdown.discount_amount || 0)})`}
                </p>
              )}
            </div>

            <div className="w-full space-y-2">
              {product.file_url && (
                <Button
                  className="w-full gap-2 bg-primary text-primary-foreground"
                  onClick={async () => {
                    try {
                      const file = await fetchWatermarkedFile({
                        fileUrl: product.file_url!,
                        productId: product.id,
                        productTitle: product.title,
                      });
                      triggerBrowserDownload(file);
                    } catch (error) {
                      console.error('[ProductPurchaseModal] secure download error:', error);
                      toast({
                        title: isFr ? 'Erreur de téléchargement' : 'Download error',
                        description: isFr ? "Impossible de récupérer la version protégée." : "Unable to retrieve the protected version.",
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  <Download className="h-4 w-4" /> {isFr ? 'Télécharger le fichier' : 'Download file'}
                </Button>
              )}
              {isCourseProduct && product.external_link && (
                <Button
                  className="w-full gap-2 bg-primary text-primary-foreground"
                  onClick={() => {
                    // external_link is a relative path like /program/uuid
                    const path = product.external_link!.startsWith('/') ? product.external_link! : new URL(product.external_link!, window.location.origin).pathname;
                    navigate(path);
                    handleClose();
                  }}
                >
                  <ExternalLink className="h-4 w-4" /> {isFr ? 'Accéder à la formation' : 'Go to course'}
                </Button>
              )}
              {effectiveExternalLink && (
                <a href={effectiveExternalLink} target="_blank" rel="noreferrer" className="w-full">
                  <Button variant="outline" className="w-full gap-2">
                    <ExternalLink className="h-4 w-4" /> {isFr ? 'Accéder au contenu' : 'Access content'}
                  </Button>
                </a>
              )}
            </div>

            {/* Upsell recommendations */}
            {upsellProducts.length > 0 && (
              <div className="w-full space-y-2 pt-2 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground">💡 {isFr ? 'Vous pourriez aussi aimer' : 'You might also like'}</p>
                {upsellProducts.map((up: any) => (
                  <div key={up.id} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-muted/30">
                    {up.cover_image_url && <img src={up.cover_image_url} className="h-10 w-10 rounded-lg object-cover shrink-0" alt="" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{up.title}</p>
                      <p className="text-[10px] text-muted-foreground">{up.is_free ? (isFr ? 'Gratuit' : 'Free') : `${up.price?.toLocaleString(isFr ? 'fr-FR' : 'en-US')} ${up.currency}`}</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] shrink-0"
                      onClick={() => { handleClose(); }}>
                      {isFr ? 'Voir' : 'View'}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">{isFr ? 'Un reçu a été envoyé à votre email.' : 'A receipt has been sent to your email.'}</p>
            <Button onClick={() => { handleClose(); navigate('/my-purchases'); }} className="w-full bg-primary text-primary-foreground gap-1.5">
              {isFr ? 'Accéder à mes ressources' : 'Go to my resources'}
            </Button>
            <Button variant="ghost" onClick={handleClose} className="text-muted-foreground">{isFr ? 'Fermer' : 'Close'}</Button>
          </div>
        )}

        {/* ── ERROR ─── */}
        {step === 'error' && (
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-14 w-14 text-destructive" />
            <div>
              <p className="font-semibold">{isFr ? 'Une erreur est survenue' : 'An error occurred'}</p>
              <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
            </div>
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={handleClose} className="flex-1">{isFr ? 'Fermer' : 'Close'}</Button>
              <Button onClick={() => setStep('buyer-info')} className="flex-1">{isFr ? 'Réessayer' : 'Try again'}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
