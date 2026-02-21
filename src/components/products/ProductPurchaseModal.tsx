import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DigitalProduct } from '@/types/database';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ShoppingBag, Lock, CheckCircle, AlertCircle, Loader2, ExternalLink, Download, User, Mail, Phone,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePaystack } from '@/hooks/usePaystack';
import { getAffiliateCode, clearAffiliateCode } from '@/hooks/useAffiliateCapture';
import { verifyPayment, VerifyPaymentResult } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

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

export function ProductPurchaseModal({ product, organizationId, open, onClose, onSuccess }: ProductPurchaseModalProps) {
  const [step, setStep] = useState<Step>('confirm');
  const [result, setResult] = useState<VerifyPaymentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const { user, profile } = useAuth();
  const { openPayment } = usePaystack();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Buyer info form state — pre-filled from profile
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    name: profile?.display_name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
  });
  const [formErrors, setFormErrors] = useState<Partial<BuyerInfo>>({});

  if (!product) return null;

  const fmt = (n: number) =>
    product.is_free || n === 0
      ? 'Gratuit'
      : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ` ${product.currency || 'XOF'}`;

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
      // Close modal and redirect to auth with return URL
      handleClose();
      navigate(`/auth?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }
    // Pre-fill from profile if available
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

    // Free product — no payment needed
    if (product.is_free || product.price === 0) {
      setStep('success');
      onSuccess?.({ ok: true, transaction_id: 'free', breakdown: { amount: 0, currency: product.currency || 'XOF', platform_fee: 0, affiliate_commission: 0, organization_amount: 0, affiliate_attributed: false } });
      return;
    }

    const affiliateCode = getAffiliateCode();

    try {
      await openPayment({
        email: buyerInfo.email.trim(),
        amount: product.price ?? 0,
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
        },
        onClose: () => {
          // user dismissed — stay on buyer-info step
        },
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
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            {product.is_free ? 'Télécharger gratuitement' : 'Acheter ce produit'}
          </DialogTitle>
          <DialogDescription>{product.description}</DialogDescription>
        </DialogHeader>

        {/* ── CONFIRM ───────────────────────────────────────────────────────── */}
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

              {!product.is_free && !product.external_link && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                  <p className="text-muted-foreground text-xs">Récapitulatif :</p>
                  <div className="flex justify-between"><span>Prix</span><span>{fmt(product.price)}</span></div>
                  <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
                    <span>Total</span><span className="text-primary">{fmt(product.price)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                {product.external_link
                  ? 'Vous serez redirigé vers le lien externe'
                  : product.is_free
                    ? 'Accès immédiat après téléchargement'
                    : 'Paiement sécurisé via Paystack'}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">Annuler</Button>
              {product.external_link ? (
                <a href={product.external_link} target="_blank" rel="noreferrer" className="flex-1">
                  <Button className="w-full gold-gradient text-primary-foreground border-0 shadow-gold gap-1.5">
                    <ExternalLink className="h-4 w-4" /> Accéder au contenu
                  </Button>
                </a>
              ) : (
                <Button
                  onClick={handleConfirmToBuyerInfo}
                  className="flex-1 gold-gradient text-primary-foreground border-0 shadow-gold"
                >
                  {product.is_free ? 'Accéder gratuitement' : `Payer ${fmt(product.price)}`}
                </Button>
              )}
            </div>
          </>
        )}

        {/* ── BUYER INFO ───────────────────────────────────────────────────── */}
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
                  <Input
                    id="buyer-name"
                    placeholder="Votre nom complet"
                    value={buyerInfo.name}
                    onChange={(e) => setBuyerInfo(prev => ({ ...prev, name: e.target.value }))}
                    maxLength={100}
                  />
                  {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="buyer-email" className="text-sm flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </Label>
                  <Input
                    id="buyer-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={buyerInfo.email}
                    onChange={(e) => setBuyerInfo(prev => ({ ...prev, email: e.target.value }))}
                    maxLength={255}
                  />
                  {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="buyer-phone" className="text-sm flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Téléphone
                  </Label>
                  <Input
                    id="buyer-phone"
                    type="tel"
                    placeholder="+225 07 00 00 00 00"
                    value={buyerInfo.phone}
                    onChange={(e) => setBuyerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    maxLength={20}
                  />
                  {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <div className="flex justify-between font-semibold">
                  <span>Total à payer</span>
                  <span className="text-primary">{product.is_free ? 'Gratuit' : fmt(product.price)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('confirm')} className="flex-1">Retour</Button>
              <Button
                onClick={handlePurchase}
                className="flex-1 gold-gradient text-primary-foreground border-0 shadow-gold"
              >
                {product.is_free ? 'Confirmer' : `Payer ${fmt(product.price)}`}
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
        {step === 'success' && (
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-14 w-14 text-green-500" />
            <div>
              <p className="font-semibold text-lg">Achat confirmé !</p>
              {result && (
                <p className="text-sm text-muted-foreground mt-1">
                  {fmt(result.breakdown.amount)} payé.
                </p>
              )}
            </div>

            <div className="w-full space-y-2">
              {product.file_url && (
                <a href={product.file_url} target="_blank" rel="noreferrer" className="w-full">
                  <Button className="w-full gap-2 gold-gradient text-primary-foreground border-0 shadow-gold">
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
            <Button
              onClick={() => { handleClose(); navigate('/dashboard'); }}
              className="w-full gold-gradient text-primary-foreground border-0 shadow-gold gap-1.5"
            >
              Accéder à mon tableau de bord
            </Button>
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
              <Button onClick={() => setStep('buyer-info')} className="flex-1">Réessayer</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
