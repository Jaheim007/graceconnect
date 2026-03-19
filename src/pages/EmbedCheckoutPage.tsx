import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { db } from '@/lib/db';
import { ProductPurchaseModal } from '@/components/products/ProductPurchaseModal';

/**
 * Minimal checkout page for embed widget (no nav, no footer).
 * URL: /embed/checkout/:productId
 * Opens the purchase modal directly.
 */
export default function EmbedCheckoutPage() {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [orgId, setOrgId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        const { data: p } = await db.from('digital_products')
          .select('*, organizations(id, name, slug, currency)')
          .eq('id', productId)
          .eq('is_published', true)
          .maybeSingle();

        if (!p) {
          setError('Produit introuvable');
          return;
        }
        setProduct(p);
        setOrgId(p.organization_id);
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

  if (error || !product) {
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
      <ProductPurchaseModal
        product={product}
        organizationId={orgId}
        open={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
