import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Users, Copy, Check, Share2, ArrowRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const TIERS = [
  { count: 3, reward: '🎁 1 eBook gratuit', unlocked: false },
  { count: 10, reward: '🏆 Badge Gold', unlocked: false },
  { count: 25, reward: '💎 Accès Premium 1 mois', unlocked: false },
  { count: 50, reward: '🚀 Commission boost +5%', unlocked: false },
];

/**
 * Invite & Earn widget — referral system with tier rewards.
 * Shows personal referral link + progress toward rewards.
 */
export function InviteEarnWidget({ className }: { className?: string }) {
  const { user, profile } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralCode = profile?.referral_code;
  const inviteUrl = referralCode ? `https://siteviral.com/invite/${referralCode}` : '';

  // Count accepted referrals
  const { data: referralCount = 0 } = useQuery({
    queryKey: ['my-referral-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await db.from('user_referrals')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_id', user.id)
        .eq('status', 'accepted');
      return count || 0;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success('Lien copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = `🚀 Rejoins-moi sur Siteviral ! Écris, vends ou gagne en partageant des produits numériques. Inscription gratuite 👉 ${inviteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!user || !referralCode) return null;

  // Calculate tiers
  const tiers = TIERS.map(t => ({ ...t, unlocked: referralCount >= t.count }));
  const nextTier = tiers.find(t => !t.unlocked);
  const progress = nextTier ? Math.round((referralCount / nextTier.count) * 100) : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-border bg-card p-5 space-y-4 ${className || ''}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Gift className="h-4.5 w-4.5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-extrabold">Invite & Gagne 🎁</p>
          <p className="text-[10px] text-muted-foreground">
            {referralCount} invitation{referralCount > 1 ? 's' : ''} acceptée{referralCount > 1 ? 's' : ''}
          </p>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          <Users className="h-3 w-3 mr-1" /> {referralCount}
        </Badge>
      </div>

      {/* Link */}
      <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2 border border-border">
        <span className="text-[10px] text-muted-foreground truncate flex-1 font-mono">{inviteUrl}</span>
        <button onClick={handleCopy} className="shrink-0">
          {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>

      {/* Share buttons */}
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white h-9" onClick={handleWhatsApp}>
          💬 WhatsApp
        </Button>
        <Button size="sm" variant="outline" className="flex-1 gap-1.5 h-9" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copié !' : 'Copier'}
        </Button>
      </div>

      {/* Tier progress */}
      {nextTier && (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Prochain palier : {nextTier.reward}</span>
            <span className="font-bold">{referralCount}/{nextTier.count}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.6 }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </div>
      )}

      {/* Tier badges */}
      <div className="grid grid-cols-4 gap-1.5">
        {tiers.map((t, i) => (
          <div
            key={i}
            className={`text-center p-2 rounded-lg border ${
              t.unlocked
                ? 'border-accent/40 bg-accent/5'
                : 'border-border bg-muted/30 opacity-50'
            }`}
          >
            <p className="text-sm">{t.reward.split(' ')[0]}</p>
            <p className="text-[9px] text-muted-foreground">{t.count} invités</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
