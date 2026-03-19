import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { TrendingUp, ShoppingBag, Users, Eye, DollarSign, ArrowUpRight, ArrowDownRight, Lightbulb, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { motion } from 'framer-motion';
import { subDays, format, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface InsightCard {
  type: 'success' | 'warning' | 'tip' | 'growth';
  icon: React.ReactNode;
  title: string;
  description: string;
  metric?: string;
}

export function AIAnalyticsInsights() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const currency = currentOrg?.currency || 'XOF';

  const { data: insights = [] } = useQuery({
    queryKey: ['ai-analytics-insights', orgId],
    queryFn: async (): Promise<InsightCard[]> => {
      if (!orgId) return [];

      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30).toISOString();
      const sixtyDaysAgo = subDays(now, 60).toISOString();

      // Fetch current & previous period data
      const [salesCurrent, salesPrevious, productsCurrent, cartsCurrent] = await Promise.all([
        db.from('product_purchases').select('amount').eq('organization_id', orgId).eq('status', 'completed').gte('created_at', thirtyDaysAgo),
        db.from('product_purchases').select('amount').eq('organization_id', orgId).eq('status', 'completed').gte('created_at', sixtyDaysAgo).lt('created_at', thirtyDaysAgo),
        db.from('digital_products').select('id, title, sales_count, is_published').eq('organization_id', orgId),
        db.from('abandoned_carts').select('id, converted').eq('organization_id', orgId).gte('created_at', thirtyDaysAgo),
      ]);

      const currentRevenue = (salesCurrent.data || []).reduce((s, r) => s + (r.amount || 0), 0);
      const previousRevenue = (salesPrevious.data || []).reduce((s, r) => s + (r.amount || 0), 0);
      const currentSalesCount = salesCurrent.data?.length || 0;
      const previousSalesCount = salesPrevious.data?.length || 0;
      const products = productsCurrent.data || [];
      const carts = cartsCurrent.data || [];
      const publishedProducts = products.filter(p => p.is_published);
      const abandonedCarts = carts.filter(c => !c.converted);
      const convertedCarts = carts.filter(c => c.converted);

      const result: InsightCard[] = [];

      // Revenue trend
      if (previousRevenue > 0) {
        const revenueChange = ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(0);
        const isUp = currentRevenue >= previousRevenue;
        result.push({
          type: isUp ? 'success' : 'warning',
          icon: isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />,
          title: isUp ? 'Revenus en hausse' : 'Revenus en baisse',
          description: isUp
            ? `Vos revenus ont augmenté de ${revenueChange}% ce mois-ci par rapport au mois précédent.`
            : `Vos revenus ont diminué de ${Math.abs(Number(revenueChange))}% ce mois. Pensez à lancer une promotion ou un email marketing.`,
          metric: `${isUp ? '+' : ''}${revenueChange}%`,
        });
      }

      // Sales velocity
      if (currentSalesCount > 0) {
        const avgPerDay = (currentSalesCount / 30).toFixed(1);
        result.push({
          type: 'growth',
          icon: <ShoppingBag className="h-4 w-4" />,
          title: `${avgPerDay} ventes/jour`,
          description: `Vous réalisez en moyenne ${avgPerDay} ventes par jour. ${currentSalesCount > previousSalesCount ? 'La tendance est positive !' : 'Augmentez votre visibilité pour booster ce chiffre.'}`,
          metric: `${currentSalesCount} ventes`,
        });
      }

      // Abandoned carts insight
      if (abandonedCarts.length > 3) {
        const convRate = carts.length > 0 ? (convertedCarts.length / carts.length * 100).toFixed(0) : '0';
        result.push({
          type: 'warning',
          icon: <Target className="h-4 w-4" />,
          title: `${abandonedCarts.length} paniers abandonnés`,
          description: `Taux de conversion panier : ${convRate}%. Activez les relances email automatiques pour récupérer ces ventes potentielles.`,
          metric: `${convRate}% conv.`,
        });
      }

      // Unpublished products
      const unpublished = products.filter(p => !p.is_published);
      if (unpublished.length > 0) {
        result.push({
          type: 'tip',
          icon: <Eye className="h-4 w-4" />,
          title: `${unpublished.length} produit${unpublished.length > 1 ? 's' : ''} non publié${unpublished.length > 1 ? 's' : ''}`,
          description: `Vous avez ${unpublished.length} produit${unpublished.length > 1 ? 's' : ''} en brouillon. Publiez-les pour commencer à générer des revenus.`,
        });
      }

      // Best seller insight
      const sorted = [...publishedProducts].sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
      if (sorted.length > 0 && (sorted[0].sales_count || 0) > 0) {
        result.push({
          type: 'success',
          icon: <Zap className="h-4 w-4" />,
          title: `Best-seller : "${sorted[0].title}"`,
          description: `Ce produit a généré ${sorted[0].sales_count} ventes. Créez un produit complémentaire ou un bundle pour maximiser vos revenus.`,
          metric: `${sorted[0].sales_count} ventes`,
        });
      }

      // Tip for low product count
      if (publishedProducts.length < 3) {
        result.push({
          type: 'tip',
          icon: <Lightbulb className="h-4 w-4" />,
          title: 'Diversifiez votre catalogue',
          description: `Vous avez ${publishedProducts.length} produit${publishedProducts.length > 1 ? 's' : ''} publié${publishedProducts.length > 1 ? 's' : ''}. Les créateurs avec 5+ produits gagnent en moyenne 3x plus.`,
        });
      }

      return result;
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 10,
  });

  if (insights.length === 0) return null;

  const typeStyles = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400',
    tip: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400',
    growth: 'bg-violet-500/10 border-violet-500/20 text-violet-700 dark:text-violet-400',
  };

  const iconBg = {
    success: 'bg-emerald-500/20',
    warning: 'bg-amber-500/20',
    tip: 'bg-blue-500/20',
    growth: 'bg-violet-500/20',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Insights IA</h3>
        <Badge variant="outline" className="text-[10px] border-0 bg-primary/10 text-primary">Auto</Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {insights.slice(0, 6).map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn('rounded-xl border p-3 space-y-1', typeStyles[insight.type])}
          >
            <div className="flex items-center gap-2">
              <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0', iconBg[insight.type])}>
                {insight.icon}
              </div>
              <p className="text-xs font-semibold flex-1">{insight.title}</p>
              {insight.metric && (
                <Badge variant="outline" className="text-[10px] border-0 font-bold">{insight.metric}</Badge>
              )}
            </div>
            <p className="text-[11px] opacity-80 leading-relaxed">{insight.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
