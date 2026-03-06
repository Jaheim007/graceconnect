import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Navigate, Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { PenLine, Share2, Upload, Store, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FirstWinChecklist } from '@/components/dashboard/FirstWinChecklist';
import { ViralLoopCard } from '@/components/dashboard/ViralLoopCard';
import { InviteEarnWidget } from '@/components/referral/InviteEarnWidget';
import { TrendingProducts } from '@/components/discover/TrendingProducts';
import { StreakTracker } from '@/components/growth/StreakTracker';
import { LiveActivityFeed } from '@/components/growth/LiveActivityFeed';
import { SuccessStoriesCarousel } from '@/components/growth/SuccessStoriesCarousel';
import { GrowthTipsWidget } from '@/components/growth/GrowthTipsWidget';
import { UserProgressDashboard } from '@/components/growth/UserProgressDashboard';
import AmbassadorDashboard from '@/pages/AmbassadorDashboard';
import UserDashboard from '@/pages/UserDashboard';

/**
 * Smart dashboard router — shows the right dashboard based on user state:
 * 1. Creator (has orgs with manage role) → redirect to /admin
 * 2. Ambassador (has affiliate links) → AmbassadorDashboard
 * 3. New user (no activity) → Welcome actions + FirstWinChecklist
 * 4. Simple buyer → UserDashboard (purchases, discover)
 */
export default function DashboardRouter() {
  const { user } = useAuth();
  const { userOrgs, isLoadingOrgs, canManage } = useOrg();

  const hasManageableOrg = userOrgs.some(o => canManage(o.id));

  const { data: affiliateData, isLoading: isLoadingAff } = useQuery({
    queryKey: ['affiliate-summary', user?.id],
    queryFn: async () => {
      if (!user) return { count: 0, totalEarned: 0, totalClicks: 0, totalConversions: 0, firstCode: null };
      const { data: links } = await db.from('affiliate_links')
        .select('code, total_earned, clicks, conversions')
        .eq('user_id', user.id);
      if (!links?.length) return { count: 0, totalEarned: 0, totalClicks: 0, totalConversions: 0, firstCode: null };
      return {
        count: links.length,
        totalEarned: links.reduce((s: number, l: any) => s + (l.total_earned || 0), 0),
        totalClicks: links.reduce((s: number, l: any) => s + (l.clicks || 0), 0),
        totalConversions: links.reduce((s: number, l: any) => s + (l.conversions || 0), 0),
        firstCode: links[0]?.code || null,
      };
    },
    enabled: !!user && !hasManageableOrg,
    staleTime: 60_000,
  });

  const { data: purchaseCount, isLoading: isLoadingPurch } = useQuery({
    queryKey: ['purchase-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await db.from('product_purchases')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      return count || 0;
    },
    enabled: !!user && !hasManageableOrg && !(affiliateData && affiliateData.count > 0),
    staleTime: 60_000,
  });

  // Still loading
  if (isLoadingOrgs || (!hasManageableOrg && isLoadingAff)) {
    return (
      <div className="container max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  // 1. Creator → admin dashboard
  if (hasManageableOrg) {
    return <Navigate to="/admin" replace />;
  }

  // 2. Ambassador (has affiliate links)
  if ((affiliateData?.count ?? 0) > 0) {
    return <AmbassadorDashboard />;
  }

  // 3. Brand new user (no purchases, no affiliates) → Welcome
  if ((purchaseCount ?? 0) === 0 && (affiliateData?.count ?? 0) === 0 && !isLoadingPurch) {
    return <NewUserDashboard />;
  }

  // 4. Simple buyer
  return <UserDashboard />;
}

function NewUserDashboard() {
  const { user } = useAuth();
  const { userOrgs } = useOrg();
  const name = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';

  const actions = [
    {
      icon: PenLine,
      emoji: '✏️',
      title: 'Écrire mon premier livre',
      desc: "L'IA t'aide à écrire et publier en 5 minutes.",
      to: '/ecrire',
      color: 'border-primary/30 hover:border-primary bg-primary/5',
      iconColor: 'text-primary bg-primary/10',
    },
    {
      icon: Share2,
      emoji: '💰',
      title: 'Gagner en partageant',
      desc: 'Partage des produits et touche 5-50% de commission.',
      to: '/gagner',
      color: 'border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/5',
      iconColor: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      icon: Upload,
      emoji: '📤',
      title: 'Importer mon contenu',
      desc: 'Tu as un ebook ou un PDF ? Vends-le ici.',
      to: '/migrer',
      color: 'border-accent/30 hover:border-accent bg-accent/5',
      iconColor: 'text-accent bg-accent/10',
    },
    {
      icon: Store,
      emoji: '🛒',
      title: 'Découvrir des ressources',
      desc: 'Livres, formations, guides et plus.',
      to: '/discover',
      color: 'border-border hover:border-primary/30',
      iconColor: 'text-muted-foreground bg-muted',
    },
  ];

  return (
    <div className="container max-w-2xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">
          Bienvenue{name ? ` ${name}` : ''} ! 🎉
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Que veux-tu faire aujourd'hui ?</p>
      </div>

      {/* First Win Checklist */}
      <FirstWinChecklist
        hasBook={false}
        hasAffiliateLink={false}
        hasPurchase={false}
        hasOrg={userOrgs.length > 0}
      />

      {/* Streak tracker */}
      <StreakTracker />

      {/* Action cards */}
      <div className="grid gap-3">
        {actions.map(a => (
          <Link
            key={a.to}
            to={a.to}
            className={`flex items-center gap-4 p-5 rounded-2xl border-2 ${a.color} transition-all hover:shadow-sm group`}
          >
            <div className={`h-11 w-11 rounded-xl ${a.iconColor} flex items-center justify-center shrink-0`}>
              <a.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm">{a.emoji} {a.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
          </Link>
        ))}
      </div>

      {/* Viral loop card */}
      <ViralLoopCard />

      {/* Success stories — social proof */}
      <SuccessStoriesCarousel limit={3} />

      {/* Invite & Earn */}
      <InviteEarnWidget />

      {/* Growth tips */}
      <GrowthTipsWidget category="all" />

      {/* Trending products */}
      <TrendingProducts limit={4} />

      {/* Live activity feed */}
      <LiveActivityFeed limit={4} />

      {/* Quick stats bar */}
      <div className="flex items-center justify-center gap-6 pt-4 text-center">
        <div>
          <p className="text-2xl font-extrabold text-primary">5 min</p>
          <p className="text-[10px] text-muted-foreground">pour écrire ton livre</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <p className="text-2xl font-extrabold text-accent">0 FCFA</p>
          <p className="text-[10px] text-muted-foreground">pour commencer</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <p className="text-2xl font-extrabold text-emerald-500">5-50%</p>
          <p className="text-[10px] text-muted-foreground">commission ambassadeur</p>
        </div>
      </div>
    </div>
  );
}
