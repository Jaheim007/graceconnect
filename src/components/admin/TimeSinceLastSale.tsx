import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useOrg } from '@/contexts/OrgContext';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Share2, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { HelpTip } from '@/components/ui/HelpTip';

/**
 * Dashboard widget showing time elapsed since last sale
 * with actionable tips to drive the next one.
 */
export function TimeSinceLastSale() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['time-since-last-sale', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return null;

      const { data: lastPurchase } = await db
        .from('product_purchases')
        .select('completed_at')
        .eq('organization_id', currentOrg.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: lastDonation } = await db
        .from('donations')
        .select('completed_at')
        .eq('organization_id', currentOrg.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const dates = [lastPurchase?.completed_at, lastDonation?.completed_at]
        .filter(Boolean)
        .map(d => new Date(d!).getTime());

      if (dates.length === 0) return { lastSaleAt: null, hoursAgo: null };

      const lastSaleAt = new Date(Math.max(...dates));
      const hoursAgo = Math.round((Date.now() - lastSaleAt.getTime()) / (1000 * 60 * 60));

      return { lastSaleAt, hoursAgo };
    },
    enabled: !!currentOrg?.id,
  });

  if (!data) return null;

  const { hoursAgo } = data;

  // Don't show if there was a sale in the last 2 hours
  if (hoursAgo !== null && hoursAgo < 2) return null;

  const formatDuration = (hours: number | null): string => {
    if (hours === null) return 'Aucune vente encore';
    if (hours < 24) return `${hours}h sans vente`;
    const days = Math.floor(hours / 24);
    return `${days}j sans vente`;
  };

  const getUrgencyColor = (hours: number | null) => {
    if (hours === null) return 'text-amber-500';
    if (hours < 24) return 'text-amber-400';
    if (hours < 72) return 'text-orange-500';
    return 'text-red-500';
  };

  const tips = hoursAgo === null
    ? [
        { icon: Sparkles, text: 'Créez votre premier produit avec l\'IA', action: () => navigate('/admin/studio') },
        { icon: Share2, text: 'Partagez votre page sur WhatsApp', action: () => window.open(`https://wa.me/?text=${encodeURIComponent(`Découvrez ${currentOrg?.name} sur Siteviral ! 👉 https://siteviral.com/org/${currentOrg?.slug}`)}`, '_blank') },
      ]
    : hoursAgo < 48
      ? [
          { icon: Share2, text: 'Partagez un produit sur les réseaux', action: () => navigate('/admin/products') },
          { icon: MessageCircle, text: 'Envoyez un rappel WhatsApp', action: () => navigate('/admin/products') },
        ]
      : [
          { icon: TrendingUp, text: 'Créez une vente flash (-30%)', action: () => navigate('/admin/products') },
          { icon: Sparkles, text: 'Créez un nouveau produit IA', action: () => navigate('/admin/studio') },
          { icon: Share2, text: 'Relancez vos contacts par email', action: () => navigate('/admin/contacts') },
        ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Clock className={`h-4 w-4 ${getUrgencyColor(hoursAgo)}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold">⏱️ {formatDuration(hoursAgo)}</h3>
            <HelpTip content="Ce compteur vous aide à rester actif. Partagez régulièrement pour booster vos ventes !" />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {hoursAgo === null
              ? 'Lancez votre première vente !'
              : 'Actions recommandées pour relancer les ventes'}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        {tips.map((tip, i) => (
          <Button
            key={i}
            variant="ghost"
            size="sm"
            onClick={tip.action}
            className="w-full justify-start gap-2 text-xs h-8 hover:bg-primary/5 hover:text-primary"
          >
            <tip.icon className="h-3.5 w-3.5" />
            {tip.text}
          </Button>
        ))}
      </div>
    </motion.div>
  );
}
