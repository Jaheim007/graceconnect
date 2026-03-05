import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, Share2, X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';

/**
 * RevenueCelebration — Shows a celebratory card for the latest sale
 * with share buttons (WhatsApp, Facebook, X, Copy link).
 * Implements the "Proof of Earnings" viral loop.
 */
export function RevenueCelebration() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: latestSale } = useQuery({
    queryKey: ['latest-sale-celebration', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      // Get most recent completed sale from last 24h
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await db.from('product_purchases')
        .select('id, amount, created_at, digital_products(title)')
        .eq('organization_id', orgId)
        .eq('status', 'completed')
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });

  const { data: todayStats } = useQuery({
    queryKey: ['today-sales-stats', orgId],
    queryFn: async () => {
      if (!orgId) return { count: 0, total: 0 };
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data, count } = await db.from('product_purchases')
        .select('amount', { count: 'exact' })
        .eq('organization_id', orgId)
        .eq('status', 'completed')
        .gte('created_at', todayStart.toISOString());
      const total = (data || []).reduce((s, t) => s + (t.amount || 0), 0);
      return { count: count || 0, total };
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });

  if (!latestSale || dismissed) return null;

  const productTitle = (latestSale as any).digital_products?.title || 'Produit';
  const amount = latestSale.amount || 0;
  const currency = currentOrg?.currency || 'XOF';

  const shareText = `🎉 Nouvelle vente sur Siteviral !\n\n"${productTitle}" — ${formatCurrency(amount, currency)}\n\nCréez et vendez vos produits numériques : siteviral.com`;
  const shareUrl = `https://siteviral.com/vendre`;

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank');
  };
  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
  };
  const shareX = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText + '\n' + shareUrl);
    setCopied(true);
    toast.success('Copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-background to-emerald-500/5 p-5 overflow-hidden"
      >
        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 h-6 w-6 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
        >
          <X className="h-3 w-3" />
        </button>

        {/* Celebration content */}
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center shrink-0">
            <PartyPopper className="h-6 w-6 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              🎉 Nouvelle vente !
            </p>
            <p className="font-bold text-sm mt-1 truncate">"{productTitle}"</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(amount, currency)}
            </p>
            {todayStats && todayStats.count > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                {todayStats.count} ventes aujourd'hui • {formatCurrency(todayStats.total, currency)} total
              </p>
            )}
          </div>
        </div>

        {/* Share buttons */}
        <div className="mt-4 pt-3 border-t border-emerald-500/15">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <Share2 className="h-3 w-3" /> Partagez votre succès
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 hover:bg-emerald-500/10 hover:border-emerald-500/30" onClick={shareWhatsApp}>
              WhatsApp
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 hover:bg-blue-500/10 hover:border-blue-500/30" onClick={shareFacebook}>
              Facebook
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={shareX}>
              X
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={copyToClipboard}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copié' : 'Copier'}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
