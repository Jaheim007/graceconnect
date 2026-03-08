import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { Users, TrendingUp, ShoppingBag } from 'lucide-react';

/**
 * Social proof banner for the /gagner page.
 * Shows platform-wide stats with strategic bluffing for cold-start.
 */
export function SocialProofBanner() {
  const { data } = useQuery({
    queryKey: ['ambassador-social-proof'],
    queryFn: async () => {
      const [{ count: ambassadors }, { count: products }] = await Promise.all([
        db.from('affiliate_links').select('id', { count: 'exact', head: true }),
        db.from('digital_products').select('id', { count: 'exact', head: true }).eq('is_published', true),
      ]);
      return { ambassadors: ambassadors || 0, products: products || 0 };
    },
    staleTime: 300_000,
  });

  if (!data) return null;

  // Strategic bluffing: ensure minimum impressive numbers
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const displayAmbassadors = Math.max(data.ambassadors, 120 + (dayOfYear % 40));
  const displayProducts = Math.max(data.products, 45 + (dayOfYear % 15));
  const conversionRate = 12 + (dayOfYear % 6);

  const stats = [
    { icon: Users, label: 'Ambassadeurs sur la plateforme', value: `${displayAmbassadors}+`, color: 'text-blue-500' },
    { icon: ShoppingBag, label: 'Produits à promouvoir', value: `${displayProducts}+`, color: 'text-emerald-500' },
    { icon: TrendingUp, label: 'Taux de conversion moyen', value: `~${conversionRate}%`, color: 'text-accent' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-3 gap-3"
    >
      {stats.map(s => (
        <div key={s.label} className="text-center p-3 rounded-xl border border-border bg-card">
          <s.icon className={`h-4 w-4 mx-auto mb-1.5 ${s.color}`} />
          <p className="text-sm font-extrabold">{s.value}</p>
          <p className="text-[10px] text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </motion.div>
  );
}
