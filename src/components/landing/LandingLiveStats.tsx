import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { TrendingUp, Users, ShoppingBag, Globe, Banknote } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

export function LandingLiveStats() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { fmt } = useDisplayCurrency();

  const { data } = useQuery({
    queryKey: ['landing-live-stats'],
    queryFn: async () => {
      const [
        { count: totalProducts },
        { count: totalOrgs },
        { count: totalUsers },
        { data: salesData },
        { data: donationData },
        { count: totalCountries },
      ] = await Promise.all([
        db.from('digital_products').select('id', { count: 'exact', head: true }).eq('is_published', true),
        db.from('organizations').select('id', { count: 'exact', head: true }).eq('is_active', true),
        db.from('profiles').select('id', { count: 'exact', head: true }),
        db.from('product_purchases').select('amount').eq('status', 'completed'),
        db.from('donations').select('amount').eq('status', 'completed'),
        db.from('profiles').select('country', { count: 'exact', head: true }),
      ]);

      const totalSalesGMV = (salesData || []).reduce((s, r) => s + (r.amount || 0), 0);
      const totalDonationsGMV = (donationData || []).reduce((s, r) => s + (r.amount || 0), 0);
      const gmv = totalSalesGMV + totalDonationsGMV;

      return {
        products: totalProducts || 0,
        orgs: totalOrgs || 0,
        users: totalUsers || 0,
        gmv,
        countries: totalCountries || 0,
      };
    },
    staleTime: 300_000,
  });

  if (!data || (data.products === 0 && data.users === 0)) return null;

  const formatBigNumber = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
    return `${n}`;
  };

  const stats = [
    { icon: Banknote, label: isFr ? 'Volume total généré' : 'Total volume generated', value: data.gmv > 0 ? fmt(data.gmv, 'XOF') : '—', color: 'text-emerald-500', show: data.gmv > 0 },
    { icon: ShoppingBag, label: isFr ? 'Produits publiés' : 'Published products', value: `${data.products}+`, color: 'text-primary', show: true },
    { icon: Users, label: isFr ? 'Créateurs & ambassadeurs' : 'Creators & ambassadors', value: `${formatBigNumber(data.users)}+`, color: 'text-accent', show: true },
    { icon: Globe, label: isFr ? 'Organisations' : 'Organizations', value: `${data.orgs}+`, color: 'text-primary', show: data.orgs > 0 },
  ];

  const visibleStats = stats.filter(s => s.show);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-16 px-4 border-y border-border/50 bg-muted/20"
    >
      <div className="container max-w-4xl">
        <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-8">
          {isFr ? '📊 La communauté en chiffres' : '📊 Community in numbers'}
        </p>
        <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(visibleStats.length, 4)} gap-8`}>
          {visibleStats.map(s => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center space-y-2"
            >
              <div className="flex items-center justify-center gap-2">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <p className="text-2xl sm:text-3xl font-extrabold">{s.value}</p>
              </div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
