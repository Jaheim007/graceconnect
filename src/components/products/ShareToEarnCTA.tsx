import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Share2, Copy, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAutoAffiliateCode } from '@/hooks/useAutoAffiliateCode';
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
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const { affiliateCode, ensureAffiliateCode } = useAutoAffiliateCode(organizationId);

  if (!user) return null;

  const productPath = productSlug
    ? `/org/${organizationSlug}/p/${productSlug}`
    : `/org/${organizationSlug}/product/${productId}`;

  const buildShareUrl = (code: string) =>
    `${window.location.origin}${productPath}?ref=${code}`;

  const getOrEnrollAndShare = async () => {
    setSharing(true);
    try {
      const code = await ensureAffiliateCode();
      if (!code) {
        toast({ title: isFr ? 'Erreur' : 'Error', description: isFr ? 'Impossible de créer le lien' : 'Could not create link', variant: 'destructive' });
        return null;
      }
      return buildShareUrl(code);
    } finally {
      setSharing(false);
    }
  };

  const copyLink = async () => {
    const url = affiliateCode ? buildShareUrl(affiliateCode) : await getOrEnrollAndShare();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: isFr ? 'Lien copié !' : 'Link copied!' });
  };

  const shareNative = async () => {
    const url = affiliateCode ? buildShareUrl(affiliateCode) : await getOrEnrollAndShare();
    if (!url) return;
    if (navigator.share) {
      navigator.share({ url, title: isFr ? 'Découvrez ce produit' : 'Check this out' });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: isFr ? 'Lien copié !' : 'Link copied!' });
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

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1.5" onClick={copyLink} disabled={sharing}>
            {sharing ? <Loader2 className="h-3 w-3 animate-spin" /> : copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? (isFr ? 'Copié !' : 'Copied!') : (isFr ? 'Copier le lien' : 'Copy link')}
          </Button>
          <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={shareNative} disabled={sharing}>
            {sharing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share2 className="h-3 w-3" />}
            {isFr ? 'Partager' : 'Share'}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground">
          {isFr
            ? 'Partagez ce produit et gagnez une commission sur chaque vente. Inscription automatique.'
            : 'Share this product and earn a commission on every sale. Auto-enrolled.'}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
