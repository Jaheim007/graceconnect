import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useI18n } from '@/i18n/I18nContext';
import { motion } from 'framer-motion';
import { ShoppingBag, Users, Building2, Heart } from 'lucide-react';

export function PlatformStats() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const { data } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const [products, orgs, campaigns] = await Promise.all([
        db.from('digital_products').select('id', { count: 'exact', head: true }).eq('is_published', true).eq('is_express_demo', false),
        db.from('organizations').select('id', { count: 'exact', head: true }).eq('is_active', true),
        db.from('donation_campaigns').select('id', { count: 'exact', head: true }).eq('is_published', true).eq('is_active', true),
      ]);
      return {
        products: products.count || 0,
        orgs: orgs.count || 0,
        campaigns: campaigns.count || 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!data || (data.products === 0 && data.orgs === 0)) return null;

  const stats = [
    { icon: <ShoppingBag className="h-4 w-4" />, value: data.products, label: isFr ? 'Ressources' : 'Resources' },
    { icon: <Building2 className="h-4 w-4" />, value: data.orgs, label: isFr ? 'Créateurs' : 'Creators' },
    { icon: <Heart className="h-4 w-4" />, value: data.campaigns, label: isFr ? 'Campagnes' : 'Campaigns' },
  ].filter(s => s.value > 0);

  return (
    <div className="flex gap-4 sm:gap-6 mb-5 justify-center">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1, type: 'spring', stiffness: 300, damping: 24 }}
          className="flex items-center gap-2 text-center"
        >
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {stat.icon}
          </div>
          <div className="text-left">
            <p className="text-lg font-bold leading-tight">{stat.value.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
