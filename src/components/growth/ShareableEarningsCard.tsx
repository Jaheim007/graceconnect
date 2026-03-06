import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { Share2, TrendingUp, DollarSign, Users, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';
import { useI18n } from '@/i18n/I18nContext';
import { useState, useRef } from 'react';
import { toast } from 'sonner';

export function ShareableEarningsCard() {
  const { user, profile } = useAuth();
  const { locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { data: stats } = useQuery({
    queryKey: ['earnings-card-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [salesRes, linksRes] = await Promise.all([
        db.from('affiliate_sales').select('commission_amount').eq('affiliate_user_id', user.id).eq('status', 'approved'),
        db.from('affiliate_links').select('conversions').eq('user_id', user.id),
      ]);

      const totalEarned = (salesRes.data || []).reduce((s: number, r: any) => s + (r.commission_amount || 0), 0);
      const totalSales = (linksRes.data || []).reduce((s: number, r: any) => s + (r.conversions || 0), 0);

      return { totalEarned, totalSales, linkCount: linksRes.data?.length || 0 };
    },
    enabled: !!user,
  });

  if (!stats || stats.totalEarned === 0) return null;

  const fmt = (n: number) => formatCurrency(n, DEFAULT_CURRENCY, locale);
  const displayName = profile?.display_name?.split(' ')[0] || 'Ambassadeur';

  const shareOnWhatsApp = () => {
    const msg = `🔥 J'ai gagné ${fmt(stats.totalEarned)} en partageant des produits sur Siteviral !\n\n💰 ${stats.totalSales} ventes réalisées\n📲 Rejoins-moi et commence à gagner toi aussi !\n\nhttps://siteviral.com/marketplace${profile?.referral_code ? `?ref=${profile.referral_code}` : ''}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const copyStats = () => {
    const text = `🏆 Mes gains Siteviral\n💰 ${fmt(stats.totalEarned)} gagnés\n📊 ${stats.totalSales} ventes\nRejoins-moi → siteviral.com`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-primary/5 p-5"
    >
      {/* Decorative */}
      <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-emerald-500/10 blur-xl" />

      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-emerald-500" />
        <h3 className="font-bold text-sm">Mes gains ambassadeur</h3>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 rounded-xl bg-background/60 border border-border/50">
          <DollarSign className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{fmt(stats.totalEarned)}</p>
          <p className="text-[9px] text-muted-foreground">Gagnés</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-background/60 border border-border/50">
          <Share2 className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-black">{stats.totalSales}</p>
          <p className="text-[9px] text-muted-foreground">Ventes</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-background/60 border border-border/50">
          <Users className="h-4 w-4 text-amber-500 mx-auto mb-1" />
          <p className="text-lg font-black">{stats.linkCount}</p>
          <p className="text-[9px] text-muted-foreground">Liens actifs</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={shareOnWhatsApp}>
          <Share2 className="h-3.5 w-3.5" /> Partager mes gains
        </Button>
        <Button size="sm" variant="outline" onClick={copyStats} className="gap-1.5">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>

      <p className="text-[9px] text-muted-foreground text-center mt-3">
        🏅 {displayName} • Ambassadeur Siteviral
      </p>
    </motion.div>
  );
}
