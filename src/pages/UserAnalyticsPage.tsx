import { ArrowLeft, TrendingUp, ShoppingBag, Heart, Star, Activity, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { getLevel, useMyPoints } from '@/hooks/useGamificationEngine';
import { useOrg } from '@/contexts/OrgContext';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/seo/SEOHead';

export default function UserAnalyticsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const { data: points = 0 } = useMyPoints(currentOrg?.id);
  const levelInfo = getLevel(points);
  const level = levelInfo.level;
  const xp = points;

  const { data: stats, isLoading } = useQuery({
    queryKey: ['user-analytics', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const [purchasesRes, donationsRes, affiliateRes, bookmarksRes] = await Promise.all([
        db.from('product_purchases').select('amount, currency, created_at').eq('user_id', user.id).eq('status', 'completed'),
        db.from('donations').select('amount, currency, created_at').eq('user_id', user.id).eq('status', 'completed'),
        db.from('affiliate_links').select('clicks, conversions, total_earned').eq('user_id', user.id),
        db.from('media_saves').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      const purchases = purchasesRes.data || [];
      const donations = donationsRes.data || [];
      const affiliateLinks = affiliateRes.data || [];
      const bookmarkCount = bookmarksRes.count || 0;

      const totalSpent = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalDonated = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
      const totalAffiliateEarned = affiliateLinks.reduce((sum, a) => sum + (a.total_earned || 0), 0);
      const totalClicks = affiliateLinks.reduce((sum, a) => sum + (a.clicks || 0), 0);
      const totalConversions = affiliateLinks.reduce((sum, a) => sum + (a.conversions || 0), 0);

      // Monthly trend
      const now = new Date();
      const thisMonth = purchases.filter(p => new Date(p.created_at).getMonth() === now.getMonth()).length;
      const lastMonth = purchases.filter(p => {
        const d = new Date(p.created_at);
        return d.getMonth() === (now.getMonth() - 1 + 12) % 12;
      }).length;

      return {
        totalSpent,
        totalDonated,
        purchaseCount: purchases.length,
        donationCount: donations.length,
        totalAffiliateEarned,
        totalClicks,
        totalConversions,
        bookmarkCount,
        purchaseCurrency: purchases[0]?.currency || 'XOF',
        donationCurrency: donations[0]?.currency || 'XOF',
        thisMonthPurchases: thisMonth,
        lastMonthPurchases: lastMonth,
      };
    },
    enabled: !!user,
  });

  const statCards = stats ? [
    { label: 'Total dépensé', value: formatCurrency(stats.totalSpent, stats.purchaseCurrency), icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total donné', value: formatCurrency(stats.totalDonated, stats.donationCurrency), icon: Heart, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'Commissions gagnées', value: formatCurrency(stats.totalAffiliateEarned, stats.purchaseCurrency), icon: TrendingUp, color: 'text-primary', bg: 'bg-accent/10' },
    { label: 'Achats', value: String(stats.purchaseCount), icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Dons', value: String(stats.donationCount), icon: Heart, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'Clics affiliés', value: String(stats.totalClicks), icon: Activity, color: 'text-muted-foreground', bg: 'bg-muted' },
    { label: 'Conversions', value: String(stats.totalConversions), icon: Star, color: 'text-gold', bg: 'bg-gold/10' },
    { label: 'Favoris', value: String(stats.bookmarkCount), icon: Star, color: 'text-primary', bg: 'bg-primary/10' },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Mes statistiques — Siteviral" noindex />
      <div className="sticky top-0 z-10 glass border-b border-border/40 px-4 h-12 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm flex-1">Mes statistiques</span>
      </div>

      <div className="container max-w-2xl py-5 space-y-5">
        {/* Level card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-lg font-bold">Niveau {level}</p>
              <p className="text-sm text-muted-foreground">{xp} XP accumulés</p>
            </div>
          </CardContent>
        </Card>

        {/* Monthly trend */}
        {stats && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            <span>Ce mois : {stats.thisMonthPurchases} achats</span>
            {stats.lastMonthPurchases > 0 && (
              <span className={cn(
                'ml-1 font-medium',
                stats.thisMonthPurchases >= stats.lastMonthPurchases ? 'text-primary' : 'text-destructive'
              )}>
                ({stats.thisMonthPurchases >= stats.lastMonthPurchases ? '+' : ''}{stats.thisMonthPurchases - stats.lastMonthPurchases} vs mois dernier)
              </span>
            )}
          </div>
        )}

        {isLoading ? <SkeletonRow count={4} /> : (
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((s) => (
              <Card key={s.label} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', s.bg)}>
                      <s.icon className={cn('h-4 w-4', s.color)} />
                    </div>
                  </div>
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
