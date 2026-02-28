import { useOrg } from '@/contexts/OrgContext';
import { useOrgProducts } from '@/hooks/useMonetization';
import { motion } from 'framer-motion';
import { Share2, ExternalLink, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function WhatsAppShareNudge() {
  const { currentOrg } = useOrg();
  const { data: products = [] } = useOrgProducts(currentOrg?.id, true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const publishedProducts = products.filter(p => p.is_published).slice(0, 3);

  if (publishedProducts.length === 0) return null;

  const orgSlug = currentOrg?.slug || '';
  const baseUrl = 'https://siteviral.com';

  const generateWhatsAppMessage = (product: any) => {
    const productUrl = `${baseUrl}/org/${orgSlug}/product/${product.slug || product.id}`;
    const price = product.is_free ? 'GRATUIT' : `${product.price} ${product.currency || 'XOF'}`;
    return encodeURIComponent(
      `🔥 ${product.title}\n\n${(product.description || '').slice(0, 100)}...\n\n💰 ${price}\n\n👉 ${productUrl}\n\nVia ${currentOrg?.name || 'SiteViral'}`
    );
  };

  const generateWhatsAppUrl = (product: any) => {
    return `https://wa.me/?text=${generateWhatsAppMessage(product)}`;
  };

  const copyLink = (product: any) => {
    const url = `${baseUrl}/org/${orgSlug}/product/${product.slug || product.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(product.id);
    toast({ title: 'Lien copié !', description: 'Partagez-le sur vos réseaux.' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-card"
    >
      <div className="flex items-center gap-2 mb-1">
        <Share2 className="h-4 w-4 text-emerald-500" />
        <h3 className="font-semibold text-sm">Partagez pour vendre</h3>
      </div>
      <p className="text-[10px] text-muted-foreground mb-4">
        Le partage WhatsApp convertit 4x mieux. Messages pré-formatés prêts à envoyer.
      </p>

      <div className="space-y-2">
        {publishedProducts.map((product) => (
          <div key={product.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-border/50">
            {product.cover_image_url && (
              <img
                src={product.cover_image_url}
                alt=""
                className="h-10 w-10 rounded-lg object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{product.title}</p>
              <p className="text-[10px] text-muted-foreground">
                {product.is_free ? 'Gratuit' : `${product.price} ${product.currency || 'XOF'}`}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => copyLink(product)}
              >
                {copiedId === product.id ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
              <a
                href={generateWhatsAppUrl(product)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg bg-emerald-500 text-white text-[10px] font-semibold hover:bg-emerald-600 transition-colors gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                WhatsApp
              </a>
            </div>
          </div>
        ))}
      </div>

      <a
        href={`https://wa.me/?text=${encodeURIComponent(`Découvrez ${currentOrg?.name || 'notre organisation'} sur SiteViral ! 🚀\n\n👉 ${baseUrl}/org/${orgSlug}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-3 text-center text-xs text-emerald-600 hover:underline"
      >
        📲 Partager la page complète de l'organisation
      </a>
    </motion.div>
  );
}
