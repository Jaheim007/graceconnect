import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

/**
 * ShareableEarningsCard — Shows revenue milestones that creators can share.
 * Implements the "Revenue Viral Loop" — proof of earnings drives new signups.
 */
export function ShareableEarningsCard() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [copied, setCopied] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['earnings-card-stats', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const now = new Date();
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [weekRes, monthRes, totalRes] = await Promise.all([
        db.from('product_purchases').select('amount', { count: 'exact' }).eq('organization_id', orgId).eq('status', 'completed').gte('created_at', weekStart.toISOString()),
        db.from('product_purchases').select('amount', { count: 'exact' }).eq('organization_id', orgId).eq('status', 'completed').gte('created_at', monthStart.toISOString()),
        db.from('product_purchases').select('amount', { count: 'exact' }).eq('organization_id', orgId).eq('status', 'completed'),
      ]);

      return {
        weekCount: weekRes.count || 0,
        weekTotal: (weekRes.data || []).reduce((s: number, r: any) => s + (r.amount || 0), 0),
        monthCount: monthRes.count || 0,
        monthTotal: (monthRes.data || []).reduce((s: number, r: any) => s + (r.amount || 0), 0),
        totalCount: totalRes.count || 0,
        totalRevenue: (totalRes.data || []).reduce((s: number, r: any) => s + (r.amount || 0), 0),
      };
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });

  if (!stats || stats.totalCount === 0) return null;

  const currency = currentOrg?.currency || 'XOF';
  const shareText = `📊 Mes résultats sur Siteviral :\n\n${stats.totalCount} ventes • ${formatCurrency(stats.totalRevenue, currency)} de revenus\n\nCréez et vendez vos produits numériques :\nhttps://siteviral.com/vendre`;

  const handleShare = (platform: string) => {
    const encoded = encodeURIComponent(shareText);
    const url = 'https://siteviral.com/vendre';
    switch (platform) {
      case 'whatsapp': window.open(`https://wa.me/?text=${encoded}`, '_blank'); break;
      case 'facebook': window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encoded}`, '_blank'); break;
      case 'twitter': window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank'); break;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast.success('Copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="font-bold text-sm">Vos revenus</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-xl bg-muted/50">
          <p className="text-lg font-extrabold">{stats.weekCount}</p>
          <p className="text-[10px] text-muted-foreground">Cette semaine</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/50">
          <p className="text-lg font-extrabold">{stats.monthCount}</p>
          <p className="text-[10px] text-muted-foreground">Ce mois</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-primary/10">
          <p className="text-lg font-extrabold text-primary">{formatCurrency(stats.totalRevenue, currency)}</p>
          <p className="text-[10px] text-muted-foreground">Total gagné</p>
        </div>
      </div>

      <div className="pt-2 border-t border-border/50">
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
          <Share2 className="h-3 w-3" /> Partagez votre succès
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => handleShare('whatsapp')}>WhatsApp</Button>
          <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => handleShare('facebook')}>Facebook</Button>
          <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => handleShare('twitter')}>X</Button>
          <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={handleCopy}>
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copié' : 'Copier'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
