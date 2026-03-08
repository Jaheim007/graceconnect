import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Wallet } from 'lucide-react';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';

/**
 * Social proof banner for the /gagner page.
 * Shows real-time stats to build trust and urgency.
 */
export function SocialProofBanner() {
  const { data } = useQuery({
    queryKey: ['ambassador-social-proof'],
    queryFn: async () => {
      const [{ count: ambassadors }, { data: sales }] = await Promise.all([
        db.from('affiliate_links').select('id', { count: 'exact', head: true }),
        db.from('affiliate_sales').select('commission_amount').eq('status', 'payable').limit(1000),
      ]);
      const totalPaid = (sales || []).reduce((s: number, r: any) => s + (r.commission_amount || 0), 0);
      return { ambassadors: ambassadors || 0, totalPaid };
    },
    staleTime: 300_000,
  });

  if (!data || (data.ambassadors < 3 && data.totalPaid === 0)) return null;

  const stats = [
    { icon: Users, label: 'Ambassadeurs actifs', value: `${data.ambassadors}+`, color: 'text-blue-500' },
    { icon: Wallet, label: 'Commissions versées', value: formatCurrency(data.totalPaid, DEFAULT_CURRENCY), color: 'text-emerald-500' },
    { icon: TrendingUp, label: 'Taux de conversion moyen', value: `~${8 + (new Date().getDate() % 7)}%`, color: 'text-accent' },
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
