import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { Copy, CheckCircle, Users, Gift, Share2, Trophy, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';

const TIERS = [
  { min: 0, label: 'Starter', emoji: '🌱', reward: '—' },
  { min: 3, label: 'Connecteur', emoji: '🔗', reward: '500 XP' },
  { min: 10, label: 'Influenceur', emoji: '⭐', reward: '2 000 XP' },
  { min: 25, label: 'Champion', emoji: '🏆', reward: '5 000 XP' },
  { min: 50, label: 'Légende', emoji: '👑', reward: '15 000 XP' },
];

function getTier(count: number) {
  let tier = TIERS[0];
  for (const t of TIERS) {
    if (count >= t.min) tier = t;
  }
  const nextTier = TIERS.find(t => t.min > count);
  return { ...tier, next: nextTier, progress: nextTier ? ((count - tier.min) / (nextTier.min - tier.min)) * 100 : 100 };
}

export function ReferralWidget() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [copied, setCopied] = useState(false);

  const { data: referralData } = useQuery({
    queryKey: ['user-referral-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      // Get referral code from profile
      const { data: prof } = await db.from('profiles').select('referral_code').eq('id', user.id).maybeSingle();
      // Count successful referrals
      const { count } = await db.from('user_referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', user.id);
      return { referralCode: prof?.referral_code || '', count: count || 0 };
    },
    enabled: !!user,
  });

  if (!user || !referralData?.referralCode) return null;

  const referralLink = `${window.location.origin}/auth?mode=signup&ref=${referralData.referralCode}`;
  const tier = getTier(referralData.count);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: isFr ? 'Lien copié !' : 'Link copied!', description: isFr ? 'Partagez-le avec vos amis' : 'Share it with your friends' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: isFr ? 'Rejoignez SiteViral !' : 'Join SiteViral!',
          text: isFr
            ? `${profile?.display_name || 'Un ami'} vous invite sur SiteViral — la plateforme pour vendre, donner et partager.`
            : `${profile?.display_name || 'A friend'} invites you to SiteViral — the platform to sell, donate and share.`,
          url: referralLink,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm">{isFr ? 'Invitez vos amis' : 'Invite your friends'}</h3>
          <p className="text-[11px] text-muted-foreground">{isFr ? 'Gagnez des récompenses à chaque inscription' : 'Earn rewards for every signup'}</p>
        </div>
        <span className="text-2xl">{tier.emoji}</span>
      </div>

      {/* Referral link */}
      <div className="flex gap-2">
        <div className="flex-1 min-w-0 bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-xs font-mono text-muted-foreground truncate">
          {referralLink}
        </div>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5 h-10" onClick={handleCopy}>
          {copied ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? (isFr ? 'Copié' : 'Copied') : (isFr ? 'Copier' : 'Copy')}
        </Button>
        <Button size="sm" className="shrink-0 gap-1.5 h-10" onClick={handleShare}>
          <Share2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <Users className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold">{referralData.count}</p>
          <p className="text-[10px] text-muted-foreground">{isFr ? 'Filleuls' : 'Referrals'}</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <Trophy className="h-4 w-4 text-amber-500 mx-auto mb-1" />
          <p className="text-sm font-bold">{tier.label}</p>
          <p className="text-[10px] text-muted-foreground">{isFr ? 'Statut' : 'Status'}</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <Gift className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-sm font-bold">{tier.reward}</p>
          <p className="text-[10px] text-muted-foreground">{isFr ? 'Récompense' : 'Reward'}</p>
        </div>
      </div>

      {/* Progress to next tier */}
      {tier.next && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{tier.emoji} {tier.label}</span>
            <span>{tier.next.emoji} {tier.next.label} ({tier.next.min - referralData.count} {isFr ? 'restants' : 'left'})</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${tier.progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
