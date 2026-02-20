import { useState } from 'react';
import { DigitalProduct } from '@/types/database';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  ShoppingBag, Lock, CheckCircle, AlertCircle, Loader2, ExternalLink, Download,
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

type Step = 'confirm' | 'processing' | 'success' | 'error';

export function ProductPurchaseModal({ product, organizationId, open, onClose, onSuccess }: ProductPurchaseModalProps) {
  const [step, setStep] = useState<Step>('confirm');
  const [result, setResult] = useState<VerifyPaymentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const { user, profile } = useAuth();
  const { openPayment } = usePaystack();
  const { toast } = useToast();

  if (!product) return null;

  const fmt = (n: number) =>
    product.is_free || n === 0
      ? 'Gratuit'
      : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ` ${product.currency || 'XOF'}`;

  const handlePurchase = async () => {
    if (!user) {
      toast({ title: 'Connexion requise', description: 'Connectez-vous pour acheter ce produit.', variant: 'destructive' });
      return;
    }

    // Free product — no payment needed
    if (product.is_free || product.price === 0) {
      setStep('success');
      onSuccess?.({ ok: true, transaction_id: 'free', breakdown: { amount: 0, currency: product.currency || 'XOF', platform_fee: 0, affiliate_commission: 0, organization_amount: 0, affiliate_attributed: false } });
      return;
    }

    const affiliateCode = getAffiliateCode();

    openPayment({
      email: user.email!,
      amount: product.price,
      currency: product.currency || 'XOF',
      metadata: {
        type: 'product',
        product_id: product.id,
        organization_id: organizationId,
        buyer_name: profile?.display_name || '',
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
          });
          clearAffiliateCode();
          setResult(verifyResult);
          setStep('success');
          onSuccess?.(verifyResult);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Une erreur est survenue.';
          setErrorMsg(message);
          setStep('error');
        }
      },
    });
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

              {!product.is_free && (
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
                {product.is_free ? 'Accès immédiat après téléchargement' : 'Paiement sécurisé via Paystack'}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">Annuler</Button>
              <Button
                onClick={handlePurchase}
                className="flex-1 gold-gradient text-primary-foreground border-0 shadow-gold"
              >
                {product.is_free ? 'Accéder gratuitement' : `Payer ${fmt(product.price)}`}
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

            {/* Access links */}
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
              <Button onClick={() => setStep('confirm')} className="flex-1">Réessayer</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
