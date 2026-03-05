import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useI18n } from '@/i18n/I18nContext';
import { ShieldCheck, Award, BadgeCheck, TrendingUp, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

interface SellerTrustBadgesProps {
  organizationId: string;
  orgName: string;
  kycStatus?: string;
}

export function SellerTrustBadges({ organizationId, orgName, kycStatus }: SellerTrustBadgesProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const { data: stats } = useQuery({
    queryKey: ['seller-trust', organizationId],
    queryFn: async () => {
      const [{ count: productCount }, { count: salesCount }, { data: orgData }] = await Promise.all([
        db.from('digital_products').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('is_published', true),
        db.from('product_purchases').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'completed'),
        db.from('organizations').select('created_at, is_active').eq('id', organizationId).maybeSingle(),
      ]);
      return {
        products: productCount || 0,
        sales: salesCount || 0,
        createdAt: orgData?.created_at,
        isActive: orgData?.is_active,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!stats) return null;

  const isVerified = kycStatus === 'level1' || kycStatus === 'level2';
  const isEstablished = stats.createdAt && (Date.now() - new Date(stats.createdAt).getTime()) > 90 * 86400000;
  const isTopSeller = stats.sales >= 50;
  const memberSince = stats.createdAt
    ? formatDistanceToNow(new Date(stats.createdAt), { addSuffix: false, locale: isFr ? fr : enUS })
    : null;

  const badges = [];

  if (isVerified) {
    badges.push({
      icon: ShieldCheck,
      label: isFr ? 'Vendeur vérifié' : 'Verified seller',
      className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    });
  }

  if (isTopSeller) {
    badges.push({
      icon: Award,
      label: isFr ? 'Top vendeur' : 'Top seller',
      className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    });
  }

  if (isEstablished) {
    badges.push({
      icon: BadgeCheck,
      label: isFr ? 'Vendeur établi' : 'Established seller',
      className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    });
  }

  if (badges.length === 0 && stats.products === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-border bg-card/50 p-3 space-y-2"
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {isFr ? 'À propos du vendeur' : 'About the seller'}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        {badges.map((b, i) => {
          const Icon = b.icon;
          return (
            <Badge key={i} variant="outline" className={`text-[10px] gap-1 ${b.className}`}>
              <Icon className="h-3 w-3" /> {b.label}
            </Badge>
          );
        })}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        {stats.products > 0 && (
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> {stats.products} {isFr ? 'produits' : 'products'}
          </span>
        )}
        {stats.sales > 0 && (
          <span className="flex items-center gap-1">
            <Award className="h-3 w-3" /> {stats.sales} {isFr ? 'ventes' : 'sales'}
          </span>
        )}
        {memberSince && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {isFr ? `Depuis ${memberSince}` : `Since ${memberSince}`}
          </span>
        )}
      </div>
    </motion.div>
  );
}
