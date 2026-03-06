import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Zap, TrendingUp, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAffiliateMarketplace } from '@/hooks/useAffiliateMarketplace';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';

/**
 * Browse products available for affiliation across all orgs.
 * 1-click enrollment + instant link generation.
 */
export function AmbassadorMarketplace() {
  const [search, setSearch] = useState('');
  const { data: products, isLoading } = useAffiliateMarketplace(search || undefined);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollingOrg, setEnrollingOrg] = useState<string | null>(null);

  const handleEnroll = async (orgId: string, orgSlug: string) => {
    if (!user) {
      navigate('/auth?intent=ambassador&redirect=/gagner');
      return;
    }
    setEnrollingOrg(orgId);
    try {
      const { error } = await supabase.rpc('self_enroll_affiliate', { _org_id: orgId });
      if (error) throw error;
      toast.success('🎉 Inscrit ! Ton lien est prêt.', {
        description: 'Partage-le pour commencer à gagner.',
        action: { label: 'Voir mes liens', onClick: () => navigate('/affiliation') },
      });
    } catch (err: any) {
      if (err.message?.includes('already')) {
        toast.info('Tu es déjà ambassadeur pour cette organisation !');
      } else {
        toast.error(err.message || 'Erreur');
      }
    } finally {
      setEnrollingOrg(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Produits à promouvoir
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Choisis, partage, gagne. C'est tout.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : !products?.length ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">Aucun produit trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product: any, i: number) => {
            const org = product.organizations;
            const commission = org?.affiliation_commission_percent || 10;
            const potentialEarning = Math.round((product.price || 0) * commission / 100);

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group relative rounded-2xl border border-border bg-card overflow-hidden hover:border-accent/40 transition-colors"
              >
                {/* Cover */}
                <div className="aspect-[16/10] bg-muted/30 relative overflow-hidden">
                  {product.cover_image_url ? (
                    <img src={product.cover_image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">📖</div>
                  )}
                  {/* Commission badge */}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-accent text-accent-foreground text-[10px] font-bold shadow-lg">
                      {commission}% commission
                    </Badge>
                  </div>
                  {/* Org badge */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1">
                    {org?.logo_url && <img src={org.logo_url} alt="" className="h-4 w-4 rounded-full" />}
                    <span className="text-[10px] font-medium truncate max-w-[100px]">{org?.name}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <h3 className="font-bold text-sm leading-tight line-clamp-2">{product.title}</h3>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Prix</p>
                      <p className="text-sm font-bold">
                        {product.is_free ? 'Gratuit' : formatCurrency(product.price || 0, product.currency || DEFAULT_CURRENCY)}
                      </p>
                    </div>
                    {!product.is_free && potentialEarning > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Tu gagnes</p>
                        <p className="text-sm font-bold text-accent">
                          {formatCurrency(potentialEarning, product.currency || DEFAULT_CURRENCY)}
                        </p>
                      </div>
                    )}
                  </div>

                  {product.sales_count > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      🔥 {product.sales_count} vente{product.sales_count > 1 ? 's' : ''}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5 h-8 text-xs"
                      disabled={enrollingOrg === org?.id}
                      onClick={() => handleEnroll(org?.id, org?.slug)}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      {enrollingOrg === org?.id ? 'Inscription...' : 'Promouvoir'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2"
                      onClick={() => navigate(`/org/${org?.slug}/${product.slug || product.id}`)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
