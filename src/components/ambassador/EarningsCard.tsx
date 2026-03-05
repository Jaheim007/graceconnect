import { useRef, useState } from 'react';
import { Share2, Download, Copy, Check, TrendingUp, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';
import { motion } from 'framer-motion';

interface EarningsCardProps {
  totalEarned: number;
  currency?: string;
  salesCount: number;
  clicksCount: number;
  topOrgName?: string;
  className?: string;
}

/**
 * Shareable earnings celebration card.
 * Ambassadors share this on social media to attract new ambassadors.
 */
export function EarningsCard({
  totalEarned,
  currency = DEFAULT_CURRENCY,
  salesCount,
  clicksCount,
  topOrgName,
  className,
}: EarningsCardProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const displayName = profile?.display_name || 'Ambassadeur';
  const fmt = (n: number) => formatCurrency(n, currency);

  const shareText = `🎉 J'ai gagné ${fmt(totalEarned)} en tant qu'ambassadeur sur Siteviral !\n\n📊 ${salesCount} vente${salesCount > 1 ? 's' : ''} · ${clicksCount} clics\n\nToi aussi, commence à gagner de l'argent en partageant des produits. Aucun investissement requis ! 🚀\n\n👉 https://siteviral.com/gagner`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch { /* cancelled */ }
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast({ title: '📋 Texte copié !' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  // Determine achievement tier
  let tier = { label: 'Débutant', color: 'text-muted-foreground', bg: 'bg-muted', emoji: '🌱' };
  if (totalEarned >= 500000) tier = { label: 'Légende', color: 'text-amber-500', bg: 'bg-amber-500/10', emoji: '👑' };
  else if (totalEarned >= 100000) tier = { label: 'Expert', color: 'text-purple-500', bg: 'bg-purple-500/10', emoji: '💎' };
  else if (totalEarned >= 50000) tier = { label: 'Pro', color: 'text-blue-500', bg: 'bg-blue-500/10', emoji: '🔥' };
  else if (totalEarned >= 10000) tier = { label: 'Actif', color: 'text-emerald-500', bg: 'bg-emerald-500/10', emoji: '⚡' };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('space-y-3', className)}
    >
      {/* Visual Card */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-primary/5 p-6"
      >
        {/* Background watermark */}
        <div className="absolute top-2 right-2 text-6xl opacity-[0.04] font-black select-none">
          SITEVIRAL
        </div>

        <div className="relative space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-emerald-500">{displayName[0]?.toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-bold">{displayName}</p>
              <div className={cn('flex items-center gap-1 text-[10px] font-semibold', tier.color)}>
                <Award className="h-3 w-3" />
                {tier.emoji} {tier.label}
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div className="text-center py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total gagné</p>
            <p className="text-3xl sm:text-4xl font-black text-emerald-500 tracking-tight">
              {fmt(totalEarned)}
            </p>
            {topOrgName && (
              <p className="text-[10px] text-muted-foreground mt-1">via {topOrgName}</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2.5 rounded-xl bg-background/50 border border-border/50">
              <p className="text-lg font-bold">{salesCount}</p>
              <p className="text-[10px] text-muted-foreground">Ventes</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-background/50 border border-border/50">
              <p className="text-lg font-bold">{clicksCount}</p>
              <p className="text-[10px] text-muted-foreground">Clics</p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center pt-1">
            <p className="text-[10px] text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              Gagne toi aussi sur <span className="font-bold text-primary">siteviral.com</span>
            </p>
          </div>
        </div>
      </div>

      {/* Share actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={handleWhatsApp}
        >
          <Share2 className="h-3.5 w-3.5" /> WhatsApp
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5"
          onClick={handleShare}
        >
          <Share2 className="h-3.5 w-3.5" /> Partager
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </motion.div>
  );
}
