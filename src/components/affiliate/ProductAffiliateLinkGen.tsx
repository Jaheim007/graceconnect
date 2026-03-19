import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle, ChevronDown, ChevronUp, Link2, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { getOrCreateShortLink, buildSocialShareUrl } from '@/lib/shareMeta';

interface Props {
  orgId: string;
  orgSlug: string;
  userId: string;
  affiliateCode: string;
}

export function ProductAffiliateLinkGen({ orgId, orgSlug, userId, affiliateCode }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const qc = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['affiliate-products', orgId],
    queryFn: async () => {
      const { data } = await db.from('digital_products')
        .select('id, title, price, currency, cover_image_url, slug')
        .eq('organization_id', orgId)
        .eq('is_published', true)
        .order('sales_count', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: expanded && !!orgId,
  });

  const { data: existingLinks = [] } = useQuery({
    queryKey: ['affiliate-product-links', orgId, userId],
    queryFn: async () => {
      const { data } = await db.from('affiliate_links')
        .select('id, code, product_id')
        .eq('organization_id', orgId)
        .eq('user_id', userId)
        .not('product_id', 'is', null);
      return data || [];
    },
    enabled: expanded && !!orgId,
  });

  const createLink = useMutation({
    mutationFn: async (productId: string) => {
      const code = `${affiliateCode}-${productId.slice(0, 6).toUpperCase()}`;
      const { error } = await db.from('affiliate_links').insert({
        user_id: userId,
        organization_id: orgId,
        product_id: productId,
        code,
        link_type: 'product',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: isFr ? 'Lien créé !' : 'Link created!', description: isFr ? 'Votre lien affilié pour ce produit est prêt.' : 'Your affiliate link for this product is ready.' });
      qc.invalidateQueries({ queryKey: ['affiliate-product-links', orgId, userId] });
    },
    onError: (err: Error) => {
      toast({ title: isFr ? 'Erreur' : 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handleCopy = async (productPath: string, id: string, title: string, image?: string) => {
    let url: string;
    try {
      url = await getOrCreateShortLink({ targetPath: productPath, title, image });
    } catch {
      url = buildSocialShareUrl({ targetUrl: `https://siteviral.com${productPath}`, title });
    }
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast({ title: isFr ? 'Lien copié !' : 'Link copied!' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const existingProductIds = new Set(existingLinks.map((l: any) => l.product_id));
  const linkByProduct: Record<string, string> = {};
  existingLinks.forEach((l: any) => { if (l.product_id) linkByProduct[l.product_id] = l.code; });

  return (
    <div className="border-t border-border/50 pt-3 mt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        <span>{isFr ? 'Liens par produit' : 'Links per product'}</span>
        {existingLinks.length > 0 && (
          <Badge variant="outline" className="text-[9px] border-0 bg-primary/10 text-primary ml-1">{existingLinks.length}</Badge>
        )}
        <span className="flex-1" />
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {products.length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center py-3">{isFr ? 'Aucun produit publié dans cette organisation.' : 'No published products in this organization.'}</p>
          ) : (
            products.map((p: any) => {
              const hasLink = existingProductIds.has(p.id);
              const code = linkByProduct[p.id];
              const productPath = p.slug
                ? `/org/${orgSlug}/p/${p.slug}?ref=${code || affiliateCode}`
                : `/org/${orgSlug}/product/${p.id}?ref=${code || affiliateCode}`;

              return (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-muted/20">
                  <div className="h-8 w-8 rounded-lg bg-muted overflow-hidden shrink-0">
                    {p.cover_image_url ? (
                      <img src={p.cover_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{p.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {p.price === 0 ? (isFr ? 'Gratuit' : 'Free') : `${p.price?.toLocaleString()} ${p.currency || 'XOF'}`}
                    </p>
                  </div>
                  {hasLink ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] gap-1 shrink-0"
                      onClick={() => handleCopy(productPath, p.id, p.title, p.cover_image_url)}
                    >
                      {copiedId === p.id ? <CheckCircle className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                      {copiedId === p.id ? 'Copié' : 'Copier'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] gap-1 shrink-0"
                      onClick={() => createLink.mutate(p.id)}
                      disabled={createLink.isPending}
                    >
                      <Link2 className="h-3 w-3" />
                      {createLink.isPending ? '...' : 'Créer lien'}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
