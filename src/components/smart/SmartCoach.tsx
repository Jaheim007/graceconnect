import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, TrendingUp, Share2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface CoachTip {
  id: string;
  message: string;
  actionLabel: string;
  actionPath: string;
  icon: React.ReactNode;
}

/**
 * SmartCoach — AI-style personalized coaching widget.
 * Analyses creator data and generates actionable tips.
 */
export function SmartCoach() {
  const { user } = useAuth();
  const { userOrgs, canManage } = useOrg();
  const navigate = useNavigate();
  const manageableOrg = userOrgs.find(o => canManage(o.id));

  const { data: tip } = useQuery({
    queryKey: ['smart-coach', user?.id, manageableOrg?.id],
    queryFn: async (): Promise<CoachTip | null> => {
      if (!user || !manageableOrg) return null;
      const orgId = manageableOrg.id;

      // Fetch recent stats
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

      // Generate the most relevant tip
      // Priority 1: Product without cover that has clicks
      const noCoverProduct = topProducts.find((p: any) => !p.cover_image_url && (p.sales_count || 0) > 0);
      if (noCoverProduct) {
        return {
          id: 'cover-tip',
          message: `"${noCoverProduct.title}" se vend déjà mais n'a pas de couverture. Ajoutez-en une pour +40% de ventes.`,
          actionLabel: 'Ajouter couverture',
          actionPath: `/admin/products/${noCoverProduct.id}/edit`,
          icon: <ImageIcon className="h-4 w-4" />,
        };
      }

      // Priority 2: Has clicks but low conversion
      if (totalClicks > 20 && recentSalesCount < 2) {
        return {
          id: 'conversion-tip',
          message: `${totalClicks} clics cette semaine mais seulement ${recentSalesCount} vente(s). Essayez d'ajouter des témoignages ou de baisser le prix temporairement.`,
          actionLabel: 'Gérer les produits',
          actionPath: '/admin/products',
          icon: <TrendingUp className="h-4 w-4" />,
        };
      }

      // Priority 3: Has sales but no ambassador program
      if (recentSalesCount >= 3 && !manageableOrg.affiliation_enabled) {
        return {
          id: 'affiliation-tip',
          message: `${recentSalesCount} ventes cette semaine — bravo ! Activez les ambassadeurs pour que d'autres vendent pour vous.`,
          actionLabel: 'Activer',
          actionPath: '/admin/settings',
          icon: <Share2 className="h-4 w-4" />,
        };
      }

      // Priority 4: No recent sales
      if (topProducts.length > 0 && recentSalesCount === 0) {
        return {
          id: 'share-tip',
          message: `Aucune vente cette semaine. Partagez "${topProducts[0].title}" sur WhatsApp pour relancer les ventes.`,
          actionLabel: 'Partager',
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
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-primary mb-1">💡 Conseil du coach</p>
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
