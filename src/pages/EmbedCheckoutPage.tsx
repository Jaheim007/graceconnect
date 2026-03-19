import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { ProductPurchaseModal } from '@/components/products/ProductPurchaseModal';

/**
 * Minimal checkout page for embed widget (no nav, no footer).
 * URL: /embed/checkout/:productId
 * Opens the purchase modal directly.
 */
export default function EmbedCheckoutPage() {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const buttonColor = searchParams.get('color') || '#d4920a';
  const refCode = searchParams.get('ref') || undefined;

  useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        const { data: p } = await db.from('digital_products')
          .select('*, organizations(id, name, slug, currency, logo_url, paystack_subaccount_code, stripe_account_id, ambassador_commission_percent)')
          .eq('id', productId)
          .eq('is_published', true)
          .maybeSingle();

        if (!p) {
          setError('Produit introuvable');
          return;
        }
        setProduct(p);
        setOrg(p.organizations);
      } catch {
        setError('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  // Post message to parent frame
  const postToParent = (type: string, data?: any) => {
    if (window.parent !== window) {
      window.parent.postMessage({ source: 'siteviral-embed', type, ...data }, '*');
    }
  };

  const handleClose = () => {
    postToParent('close');
  };

  const handleSuccess = () => {
    postToParent('purchase_complete', { productId });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground text-sm">Chargement…</div>
      </div>
    );
  }

  if (error || !product || !org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-sm text-destructive font-medium">{error || 'Produit introuvable'}</p>
          <button onClick={handleClose} className="text-xs text-muted-foreground underline">Fermer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md">
        <ProductPurchaseModal
          product={product}
          organization={org}
          isOpen={true}
          onClose={handleClose}
          onSuccess={handleSuccess}
          affiliateCode={refCode}
        />
      </div>
    </div>
  );
}
