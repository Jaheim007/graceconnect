import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Navigate, Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { PenLine, Share2, Upload, Store, ArrowRight } from 'lucide-react';
import { FirstWinChecklist } from '@/components/dashboard/FirstWinChecklist';
import { PremiumCard } from '@/components/ui/PremiumCard';

import { TrendingProducts } from '@/components/discover/TrendingProducts';
import { GrowthTipsWidget } from '@/components/growth/GrowthTipsWidget';
import AmbassadorDashboard from '@/pages/AmbassadorDashboard';
import UserDashboard from '@/pages/UserDashboard';
import { useI18n } from '@/i18n/I18nContext';
import { motion } from 'framer-motion';

/**
 * Smart dashboard router — shows the right dashboard based on user state:
 * 1. Creator (has orgs with manage role) → redirect to /admin
 * 2. Ambassador (has affiliate links) → AmbassadorDashboard
 * 3. New user (no activity) → Welcome actions + FirstWinChecklist
 * 4. Simple buyer → UserDashboard (purchases, discover)
 */
export default function DashboardRouter() {
  const { user } = useAuth();
  const { userOrgs, canManage, isLoadingOrgs } = useOrg();

  // Check if user has affiliate links or purchases
  const { data: userState, isLoading: stateLoading } = useQuery({
    queryKey: ['dashboard-state', user?.id],
    queryFn: async () => {
      if (!user) return { hasAffiliateLinks: false, hasPurchases: false, hasBook: false };
      const [affiliateRes, purchaseRes, bookRes] = await Promise.all([
        db.from('affiliate_links').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        db.from('product_purchases').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed'),
        db.from('ai_content_projects').select('id', { count: 'exact', head: true }).eq('created_by', user.id),
      ]);
      return {
        hasAffiliateLinks: (affiliateRes.count || 0) > 0,
        hasPurchases: (purchaseRes.count || 0) > 0,
        hasBook: (bookRes.count || 0) > 0,
      };
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  // Show loader while loading
  if (isLoadingOrgs || stateLoading) {
    return (
      <div className="container max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  // 1. Creator → redirect to /admin
  const manageableOrg = userOrgs.find(o => canManage(o.id));
  if (manageableOrg) {
    return <Navigate to="/admin" replace />;
  }

  // 2. Ambassador (has affiliate links but no org to manage)
  if (userState?.hasAffiliateLinks) {
    return <AmbassadorDashboard />;
  }

  // 3. New user (no activity at all)
  const isNewUser = !userState?.hasPurchases && !userState?.hasAffiliateLinks;
  if (isNewUser) {
    return <NewUserDashboard hasBook={userState?.hasBook || false} />;
  }

  // 4. Simple buyer
  return <UserDashboard />;
}

function NewUserDashboard({ hasBook }: { hasBook: boolean }) {
  const { user } = useAuth();
  const { userOrgs } = useOrg();
  const { t } = useI18n();
  const name = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';

  const actions = [
    {
      icon: PenLine,
      title: t('dash.write_first'),
      desc: t('dash.write_first_desc'),
      to: '/ecrire',
      color: 'border-primary/20 hover:border-primary/50',
      iconColor: 'text-primary bg-primary/10',
    },
    {
      icon: Share2,
      title: t('dash.earn_sharing'),
      desc: t('dash.earn_sharing_desc'),
      to: '/gagner',
      color: 'border-emerald-500/20 hover:border-emerald-500/50',
      iconColor: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      icon: Upload,
      title: t('dash.import_content'),
      desc: t('dash.import_content_desc'),
      to: '/migrer',
      color: 'border-accent/20 hover:border-accent/50',
      iconColor: 'text-accent bg-accent/10',
    },
    {
      icon: Store,
      title: t('dash.discover_resources'),
      desc: t('dash.discover_resources_desc'),
      to: '/discover',
      color: 'border-border hover:border-primary/30',
      iconColor: 'text-muted-foreground bg-muted',
    },
  ];

  return (
    <div className="container max-w-2xl px-4 py-8 space-y-6">
      {/* ═══ WELCOME ═══ */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold tracking-tight">
          {t('dash.welcome')}{name ? ` ${name}` : ''} ! 🎉
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{t('dash.what_today')}</p>
      </motion.div>

      {/* ═══ FIRST WIN CHECKLIST ═══ */}
      <FirstWinChecklist
        hasBook={hasBook}
        hasAffiliateLink={false}
        hasPurchase={false}
        hasOrg={userOrgs.length > 0}
      />

      {/* ═══ ACTION CARDS ═══ */}
      <div className="grid gap-3">
        {actions.map((a, i) => (
          <PremiumCard key={a.to} variant="default" delay={i * 0.04} noPadding className="p-0">
            <Link
              to={a.to}
              className={`flex items-center gap-4 p-4 rounded-2xl border ${a.color} transition-all hover:shadow-elevated group`}
            >
              <div className={`h-11 w-11 rounded-xl ${a.iconColor} flex items-center justify-center shrink-0`}>
                <a.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm">{a.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
          </PremiumCard>
        ))}
      </div>

      {/* ═══ TRENDING PRODUCTS ═══ */}
      <TrendingProducts limit={4} />

      {/* ═══ GROWTH TIPS ═══ */}
      <GrowthTipsWidget category="all" />

      {/* ═══ QUICK STATS ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center gap-4 sm:gap-6 pt-4 text-center"
      >
        <div>
          <p className="text-2xl font-extrabold text-primary">5 min</p>
          <p className="text-[10px] text-muted-foreground">{t('dash.time_to_write')}</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <p className="text-2xl font-extrabold text-accent">0 FCFA</p>
          <p className="text-[10px] text-muted-foreground">{t('dash.to_start')}</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <p className="text-2xl font-extrabold text-emerald-500">5-50%</p>
          <p className="text-[10px] text-muted-foreground">{t('dash.ambassador_commission')}</p>
        </div>
      </motion.div>
    </div>
  );
}
