import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { TrendingUp, Users, ShoppingBag, Wallet } from 'lucide-react';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';

/**
 * Live platform stats — fetches real data for social proof on landing.
 */
export function LandingLiveStats() {
  const { data } = useQuery({
    queryKey: ['landing-live-stats'],
    queryFn: async () => {
      const [
        { count: totalProducts },
        { count: totalOrgs },
        { count: totalUsers },
      ] = await Promise.all([
        db.from('digital_products').select('id', { count: 'exact', head: true }).eq('is_published', true),
        db.from('organizations').select('id', { count: 'exact', head: true }).eq('is_active', true),
        db.from('profiles').select('id', { count: 'exact', head: true }),
      ]);
      return {
        products: totalProducts || 0,
        orgs: totalOrgs || 0,
        users: totalUsers || 0,
      };
    },
    staleTime: 300_000,
  });

  if (!data || (data.products === 0 && data.users === 0)) return null;

  const stats = [
    { icon: ShoppingBag, label: 'Produits publiés', value: `${data.products}+`, color: 'text-primary' },
    { icon: Users, label: 'Utilisateurs', value: `${data.users}+`, color: 'text-accent' },
    { icon: TrendingUp, label: 'Organisations', value: `${data.orgs}+`, color: 'text-primary' },
  ];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-8 px-4 border-y border-border/50"
    >
      <div className="container max-w-3xl flex justify-center gap-8 sm:gap-12">
        {stats.map(s => (
          <div key={s.label} className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <p className="text-xl sm:text-2xl font-extrabold">{s.value}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
