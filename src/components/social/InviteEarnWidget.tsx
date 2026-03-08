import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, MessageCircle, Users, Gift, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useShortLink } from '@/hooks/useShortLink';

export function InviteEarnWidget() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralCode = (profile as any)?.referral_code;

  const { data: stats } = useQuery({
    queryKey: ['referral-stats', user?.id],
    queryFn: async () => {
      if (!user) return { count: 0 };
      const { count } = await db.from('user_referrals')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_id', user.id);
      return { count: count || 0 };
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const { shareUrl: inviteUrl } = useShortLink({
    targetPath: `/invite/${referralCode || ''}`,
    title: 'Rejoins Siteviral',
    description: 'Découvre des contenus exclusifs, achète des formations, ou gagne de l\'argent en partageant.',
  });

  if (!user || !referralCode) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast({ title: 'Lien copié !' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = `🔥 Rejoins Siteviral ! Découvre des contenus exclusifs, achète des formations, ou gagne de l'argent en partageant. ${inviteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Rejoins Siteviral',
        text: 'Découvre des contenus exclusifs et gagne de l\'argent en partageant !',
        url: inviteUrl,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Invite tes amis 🎁</h3>
          <p className="text-xs text-muted-foreground">
            Partage ton lien et développe ta communauté
          </p>
        </div>
      </div>

      {/* Stats */}
      {(stats?.count ?? 0) > 0 && (
        <div className="flex items-center gap-2 bg-card/50 rounded-xl p-3">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{stats?.count} invitation{(stats?.count ?? 0) > 1 ? 's' : ''} acceptée{(stats?.count ?? 0) > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Referral code display */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-3">
        <code className="flex-1 text-xs font-mono text-foreground truncate">
          {inviteUrl}
        </code>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={handleCopy}
        >
          {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Share buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 gap-1.5 bg-[#25D366] hover:bg-[#20BD5A] text-white"
          onClick={handleWhatsApp}
        >
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5"
          onClick={handleShare}
        >
          <Share2 className="h-3.5 w-3.5" /> Partager
        </Button>
      </div>
    </motion.div>
  );
}
