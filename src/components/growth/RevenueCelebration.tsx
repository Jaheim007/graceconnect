import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Share2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';
import { useI18n } from '@/i18n/I18nContext';
import { useState } from 'react';

const MILESTONES = [
  { threshold: 1, emoji: '🎉', label: 'Première vente !', message: 'Tu viens de réaliser ta première vente. Le début d\'une belle aventure !' },
  { threshold: 10, emoji: '🔥', label: '10 ventes !', message: 'Tu as atteint 10 ventes. Tu es sur la bonne voie !' },
  { threshold: 50, emoji: '🚀', label: '50 ventes !', message: '50 ventes ! Tu es un vrai entrepreneur digital.' },
  { threshold: 100, emoji: '💎', label: '100 ventes !', message: 'Le club des 100 ! Tu inspires toute la communauté.' },
];

export function RevenueCelebration() {
  const { user, profile } = useAuth();
  const { userOrgs } = useOrg();
  const { locale } = useI18n();
  const [dismissed, setDismissed] = useState(false);

  const { data } = useQuery({
    queryKey: ['revenue-celebration', user?.id],
    queryFn: async () => {
      if (!user || userOrgs.length === 0) return null;
      const orgIds = userOrgs.map(o => o.id);

      const { data: purchases, count } = await db.from('product_purchases')
        .select('amount, currency', { count: 'exact' })
        .in('organization_id', orgIds)
        .eq('status', 'completed');

      const totalRevenue = (purchases || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const salesCount = count || 0;
      const currency = purchases?.[0]?.currency || userOrgs[0]?.currency || DEFAULT_CURRENCY;

      return { totalRevenue, salesCount, currency };
    },
    enabled: !!user && userOrgs.length > 0,
  });

  if (!data || data.salesCount === 0 || dismissed) return null;

  // Find highest reached milestone
  const milestone = [...MILESTONES].reverse().find(m => data.salesCount >= m.threshold);
  if (!milestone) return null;

  const fmt = (n: number) => formatCurrency(n, data.currency, locale);
  const displayName = profile?.display_name?.split(' ')[0] || 'Créateur';

  const shareOnWhatsApp = () => {
    const msg = `${milestone.emoji} ${milestone.label}\n\n💰 ${fmt(data.totalRevenue)} de revenus sur Siteviral !\n📊 ${data.salesCount} ventes réalisées\n\nToi aussi, écris et vends ton livre avec l'IA !\n👉 https://siteviral.com/ecrire`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-primary/5 p-5"
    >
      <button onClick={() => setDismissed(true)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground z-10">
        <X className="h-4 w-4" />
      </button>

      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl" />

      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h3 className="font-bold text-sm">Célébration</h3>
        <span className="text-lg">{milestone.emoji}</span>
      </div>

      <p className="text-2xl font-black mb-1">{fmt(data.totalRevenue)}</p>
      <p className="text-xs text-muted-foreground mb-1">{milestone.message}</p>
      <p className="text-[10px] text-muted-foreground mb-4">{data.salesCount} ventes • {displayName}</p>

      <div className="flex gap-2">
        <Button size="sm" className="flex-1 gap-2" onClick={shareOnWhatsApp}>
          <Share2 className="h-3.5 w-3.5" /> Partager ma réussite
        </Button>
      </div>
    </motion.div>
  );
}
