import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import {
  BookOpen, Share2, ShoppingBag, Wallet, Trophy, TrendingUp, Flame
} from 'lucide-react';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { StreakTracker } from '@/components/growth/StreakTracker';

interface UserProgressDashboardProps {
  className?: string;
}

export function UserProgressDashboard({ className }: UserProgressDashboardProps) {
  const { user } = useAuth();
  const { userOrgs } = useOrg();
  const { fmt } = useDisplayCurrency();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const currency = userOrgs[0]?.currency || 'XOF';

  const { data: stats } = useQuery({
    queryKey: ['user-progress-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [purchases, affiliateLinks, products] = await Promise.all([
        db.from('product_purchases').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed'),
        db.from('affiliate_links').select('total_earned, clicks, conversions').eq('user_id', user.id),
        db.from('digital_products').select('id, sales_count', { count: 'exact' }).eq('created_by', user.id).eq('is_published', true),
      ]);
      const totalEarned = (affiliateLinks.data || []).reduce((s: number, l: any) => s + (l.total_earned || 0), 0);
      const totalClicks = (affiliateLinks.data || []).reduce((s: number, l: any) => s + (l.clicks || 0), 0);
      const totalConversions = (affiliateLinks.data || []).reduce((s: number, l: any) => s + (l.conversions || 0), 0);
      const totalProductSales = (products.data || []).reduce((s: number, p: any) => s + (p.sales_count || 0), 0);
      return {
        purchaseCount: purchases.count || 0,
        affiliateLinkCount: (affiliateLinks.data || []).length,
        totalEarned, totalClicks, totalConversions,
        publishedProducts: products.count || 0, totalProductSales,
      };
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  if (!stats) return null;
  const hasAnyActivity = stats.purchaseCount > 0 || stats.affiliateLinkCount > 0 || stats.publishedProducts > 0;
  if (!hasAnyActivity) return null;

  const sections = [
    stats.publishedProducts > 0 && {
      icon: BookOpen,
      label: isFr ? 'Mes produits' : 'My products',
      value: stats.publishedProducts,
      sub: `${stats.totalProductSales} ${isFr ? 'vente' : 'sale'}${stats.totalProductSales !== 1 ? 's' : ''}`,
      color: 'text-purple-500 bg-purple-500/10',
    },
    stats.totalEarned > 0 && {
      icon: Wallet,
      label: isFr ? 'Gains' : 'Earnings',
      value: fmt(stats.totalEarned, currency),
      sub: `${stats.totalConversions} conversion${stats.totalConversions !== 1 ? 's' : ''}`,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    stats.affiliateLinkCount > 0 && {
      icon: Share2,
      label: isFr ? 'Liens actifs' : 'Active links',
      value: stats.affiliateLinkCount,
      sub: `${stats.totalClicks} ${isFr ? 'clic' : 'click'}${stats.totalClicks !== 1 ? 's' : ''}`,
      color: 'text-blue-500 bg-blue-500/10',
    },
    stats.purchaseCount > 0 && {
      icon: ShoppingBag,
      label: isFr ? 'Achats' : 'Purchases',
      value: stats.purchaseCount,
      sub: isFr ? 'produits acquis' : 'products acquired',
      color: 'text-primary bg-primary/10',
    },
  ].filter(Boolean) as Array<{ icon: typeof BookOpen; label: string; value: string | number; sub: string; color: string }>;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold">{isFr ? 'Ma progression' : 'My progress'}</h3>
      </div>
      <div className={cn('grid gap-3', 'grid-cols-2')}>
        {sections.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl p-3.5 space-y-1"
            >
              <div className="flex items-center gap-2">
                <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center', s.color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{s.label}</span>
              </div>
              <p className="text-lg font-extrabold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.sub}</p>
            </motion.div>
          );
        })}
      </div>
      <StreakTracker />
    </div>
  );
}
