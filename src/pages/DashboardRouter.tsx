import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Navigate, Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { PenLine, Share2, Upload, Store, ArrowRight, Plus } from 'lucide-react';
import { FirstWinChecklist } from '@/components/dashboard/FirstWinChecklist';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { TrendingProducts } from '@/components/discover/TrendingProducts';
import { GrowthTipsWidget } from '@/components/growth/GrowthTipsWidget';
import AmbassadorDashboard from '@/pages/AmbassadorDashboard';
import UserDashboard from '@/pages/UserDashboard';
import { useI18n } from '@/i18n/I18nContext';
import { motion } from 'framer-motion';
import { useUserMode } from '@/contexts/UserModeContext';

/**
 * Smart Dashboard — now mode-aware:
 * 1. No mode selected → redirect to /welcome
 * 2. Mode "purchases" → UserDashboard (purchases focused)
 * 3. Mode "sell" or "create" → redirect to /admin or create-org
 * 4. Mode "earn" → AmbassadorDashboard
 */
export default function DashboardRouter() {
  const { user } = useAuth();
  const { userOrgs, canManage, isLoadingOrgs } = useOrg();
  const { mode } = useUserMode();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

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

  if (isLoadingOrgs || stateLoading) {
    return (
      <div className="container max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  // No mode selected → redirect to mode selection
  if (!mode) {
    return <Navigate to="/welcome" replace />;
  }

  const manageableOrg = userOrgs.find(o => canManage(o.id));

  // Mode-based routing
  switch (mode) {
    case 'sell':
    case 'create':
      if (manageableOrg) {
        return <Navigate to="/admin" replace />;
      }
      // No org yet → redirect to create org
      return <Navigate to="/create-org" replace />;

    case 'earn':
      return <AmbassadorDashboard />;

    case 'purchases':
      return <UserDashboard />;

    default:
      return <UserDashboard />;
  }
}
