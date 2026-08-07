import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, TrendingUp, Share2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';

interface CoachTip {
  id: string;
  message: string;
  actionLabel: string;
  actionPath: string;
  icon: React.ReactNode;
}

export function SmartCoach() {
  const { user } = useAuth();
  const { userOrgs, canManage } = useOrg();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const manageableOrg = userOrgs.find(o => canManage(o.id));

  const { data: tip } = useQuery({
    queryKey: ['smart-coach', user?.id, manageableOrg?.id, locale],
    queryFn: async (): Promise<CoachTip | null> => {
      if (!user || !manageableOrg) return null;
      const orgId = manageableOrg.id;

      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const [recentSales, products, affiliateLinks] = await Promise.all([
        db.from('product_purchases').select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId).eq('status', 'completed').gte('created_at', sevenDaysAgo),
        db.from('digital_products').select('id, title, cover_image_url, sales_count, is_published')
          .eq('organization_id', orgId).eq('is_published', true).order('sales_count', { ascending: false }).limit(5),
        db.from('affiliate_links').select('clicks, conversions', { count: 'exact' })
          .eq('organization_id', orgId),
      ]);

      const recentSalesCount = recentSales.count || 0;
      const topProducts = products.data || [];
      const totalClicks = (affiliateLinks.data || []).reduce((s: number, l: any) => s + (l.clicks || 0), 0);

      const noCoverProduct = topProducts.find((p: any) => !p.cover_image_url && (p.sales_count || 0) > 0);
      if (noCoverProduct) {
        return {
          id: 'cover-tip',
          message: isFr
            ? `"${noCoverProduct.title}" se vend déjà mais n'a pas de couverture. Ajoutez-en une pour +40% de ventes.`
            : `"${noCoverProduct.title}" is already selling but has no cover. Add one for +40% more sales.`,
          actionLabel: isFr ? 'Ajouter couverture' : 'Add cover',
          actionPath: `/admin/products/${noCoverProduct.id}/edit`,
          icon: <ImageIcon className="h-4 w-4" />,
        };
      }

      if (totalClicks > 20 && recentSalesCount < 2) {
        return {
          id: 'conversion-tip',
          message: isFr
            ? `${totalClicks} clics cette semaine mais seulement ${recentSalesCount} vente(s). Essayez d'ajouter des témoignages ou de baisser le prix temporairement.`
            : `${totalClicks} clicks this week but only ${recentSalesCount} sale(s). Try adding testimonials or temporarily lowering the price.`,
          actionLabel: isFr ? 'Gérer les produits' : 'Manage products',
          actionPath: '/admin/products',
          icon: <TrendingUp className="h-4 w-4" />,
        };
      }

      if (recentSalesCount >= 3 && !manageableOrg.affiliation_enabled) {
        return {
          id: 'affiliation-tip',
          message: isFr
            ? `${recentSalesCount} ventes cette semaine — bravo ! Activez les ambassadeurs pour que d'autres vendent pour vous.`
            : `${recentSalesCount} sales this week — great! Enable ambassadors so others can sell for you.`,
          actionLabel: isFr ? 'Activer' : 'Enable',
          actionPath: '/admin/settings',
          icon: <Share2 className="h-4 w-4" />,
        };
      }

      if (topProducts.length > 0 && recentSalesCount === 0) {
        return {
          id: 'share-tip',
          message: isFr
            ? `Aucune vente cette semaine. Partagez "${topProducts[0].title}" sur WhatsApp pour relancer les ventes.`
            : `No sales this week. Share "${topProducts[0].title}" on WhatsApp to boost sales.`,
          actionLabel: isFr ? 'Partager' : 'Share',
          actionPath: '/admin/products',
          icon: <Share2 className="h-4 w-4" />,
        };
      }

      return null;
    },
    enabled: !!user && !!manageableOrg,
    staleTime: 600_000,
  });

  if (!tip) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-primary/20 rounded-2xl p-4"
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-primary mb-1">{isFr ? '💡 Conseil du coach' : '💡 Coach tip'}</p>
          <p className="text-sm text-foreground leading-relaxed">{tip.message}</p>
          <Button
            size="sm"
            variant="ghost"
            className="mt-2 text-xs gap-1.5 text-primary h-8 px-3"
            onClick={() => navigate(tip.actionPath)}
          >
            {tip.icon}
            {tip.actionLabel}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
