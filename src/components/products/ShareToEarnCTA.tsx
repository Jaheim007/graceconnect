import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Share2, Copy, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareToEarnCTAProps {
  productId: string;
  organizationId: string;
  organizationSlug: string;
  productSlug?: string;
  commissionPercent?: number;
}

export function ShareToEarnCTA({ productId, organizationId, organizationSlug, productSlug, commissionPercent }: ShareToEarnCTAProps) {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { toast } = useToast();
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: affiliateLink, isLoading: loadingLink } = useQuery({
    queryKey: ['my-aff-link', user?.id, organizationId],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await db
        .from('affiliate_links')
        .select('code, is_active')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not logged in');
      const { error } = await db.rpc('self_enroll_affiliate', { _org_id: organizationId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-aff-link'] });
      toast({ title: isFr ? '🎉 Inscrit comme ambassadeur !' : '🎉 Enrolled as ambassador!' });
    },
    onError: (e: any) => {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    },
  });

  if (!user) return null;

  const productPath = productSlug
    ? `/org/${organizationSlug}/p/${productSlug}`
    : `/org/${organizationSlug}/product/${productId}`;

  const shareUrl = affiliateLink
    ? `${window.location.origin}${productPath}?ref=${affiliateLink.code}`
    : '';

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: isFr ? 'Lien copié !' : 'Link copied!' });
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({ url: shareUrl, title: isFr ? 'Découvrez ce produit' : 'Check this out' });
    } else {
      copyLink();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">
            {isFr ? 'Partagez & Gagnez' : 'Share & Earn'}
          </span>
          {commissionPercent && commissionPercent > 0 && (
            <Badge className="bg-primary/20 text-primary border-0 text-[10px]">
              {commissionPercent}% commission
            </Badge>
          )}
        </div>

        {affiliateLink ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1.5" onClick={copyLink}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? (isFr ? 'Copié !' : 'Copied!') : (isFr ? 'Copier le lien' : 'Copy link')}
            </Button>
            <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={shareNative}>
              <Share2 className="h-3 w-3" />
              {isFr ? 'Partager' : 'Share'}
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="w-full h-8 text-xs gap-1.5 font-semibold"
            onClick={() => enrollMutation.mutate()}
            disabled={enrollMutation.isPending || loadingLink}
          >
            {enrollMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Gift className="h-3 w-3" />}
            {isFr ? 'Devenir ambassadeur en 1 clic' : 'Become an ambassador in 1 click'}
          </Button>
        )}

        <p className="text-[10px] text-muted-foreground">
          {isFr
            ? 'Partagez ce produit et gagnez une commission sur chaque vente.'
            : 'Share this product and earn a commission on every sale.'}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
