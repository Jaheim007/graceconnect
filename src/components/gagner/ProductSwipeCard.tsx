import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, Check, Zap, Eye, ChevronDown, ChevronUp, TrendingUp, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/lib/db';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { getOrCreateShortLink } from '@/lib/shareMeta';
import { getPublicOrigin } from '@/lib/publicUrl';

interface ProductSwipeCardProps {
  product: any;
  index: number;
}

const SHARE_MESSAGES_FR = [
  (title: string, url: string) => `📖 J'ai trouvé "${title}" — ça vaut vraiment le détour ! 👉 ${url}`,
  (title: string, url: string) => `🔥 Ce produit fait le buzz : "${title}". Découvre-le ici 👉 ${url}`,
  (title: string, url: string) => `💡 Je te recommande "${title}", tu vas adorer ! ${url}`,
  (title: string, url: string) => `🎯 "${title}" — un must-have. Clique ici 👉 ${url}`,
];

export function ProductSwipeCard({ product, index }: ProductSwipeCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [enrolling, setEnrolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareKit, setShowShareKit] = useState(false);

  const org = product.organizations;
  const commission = org?.affiliation_commission_percent || 10;
  const potentialEarning = Math.round((product.price || 0) * commission / 100);

  // Check if user already has an affiliate link for this org
  const { data: myLink } = useQuery({
    queryKey: ['my-aff-link', user?.id, org?.id],
    queryFn: async () => {
      if (!user || !org?.id) return null;
      const { data } = await db.from('affiliate_links')
        .select('code')
        .eq('user_id', user.id)
        .eq('organization_id', org.id)
        .eq('is_active', true)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!org?.id,
    staleTime: 60_000,
  });

  const productPath = product.slug
    ? `/org/${org?.slug}/p/${product.slug}`
    : `/org/${org?.slug}/product/${product.id}`;
  const refPath = myLink ? `${productPath}?ref=${myLink.code}` : productPath;
  
  // Fallback URL (public domain, not preview domain)
  const fallbackUrl = `${getPublicOrigin()}${refPath}`;

  // Resolve short link for sharing (with proper OG meta)
  const [shareUrl, setShareUrl] = useState(fallbackUrl);
  useEffect(() => {
    if (!myLink) return;
    let cancelled = false;
    getOrCreateShortLink({
      targetPath: refPath,
      title: product.title,
      description: product.description?.slice(0, 155) || undefined,
      image: product.cover_image_url || undefined,
    }).then(url => {
      if (!cancelled) setShareUrl(url);
    }).catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, [refPath, isAffiliate, product.title, product.description, product.cover_image_url]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/auth?intent=ambassador&redirect=/gagner');
      return;
    }
    setEnrolling(true);
    try {
      const { error } = await supabase.rpc('self_enroll_affiliate', { _org_id: org?.id });
      if (error) throw error;
      toast.success('🎉 Inscrit ! Partage maintenant pour gagner.');
      qc.invalidateQueries({ queryKey: ['my-aff-link', user.id, org?.id] });
      setShowShareKit(true);
    } catch (err: any) {
      if (err.message?.includes('already')) {
        toast.info('Déjà ambassadeur ! Partage ce produit.');
        qc.invalidateQueries({ queryKey: ['my-aff-link', user.id, org?.id] });
      } else {
        toast.error(err.message || 'Erreur');
      }
    } finally {
      setEnrolling(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Lien copié ! Partage-le 🚀');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Impossible de copier');
    }
  };

  const shareWhatsApp = (msgIndex = 0) => {
    const msg = SHARE_MESSAGES_FR[msgIndex % SHARE_MESSAGES_FR.length](product.title, shareUrl);
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const shareTelegram = () => {
    const msg = `📖 ${product.title} — à découvrir !`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareX = () => {
    const msg = `📖 ${product.title} — je te le recommande !`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(msg)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const isAffiliate = !!myLink;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 30 }}
      className="snap-start shrink-0 w-full max-w-sm mx-auto"
    >
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-lg">
        {/* Cover with overlays */}
        <div className="relative aspect-[4/3] bg-muted/30 overflow-hidden">
          {product.cover_image_url ? (
            <img
              src={product.cover_image_url}
              alt={product.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">📖</div>
          )}

          {/* Commission badge - top right */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-accent text-accent-foreground text-xs font-extrabold shadow-xl px-3 py-1.5 rounded-full">
              💰 {commission}%
            </Badge>
          </div>

          {/* Earnings badge - top left */}
          {!product.is_free && potentialEarning > 0 && (
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="text-xs font-bold shadow-lg px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm">
                Tu gagnes {formatCurrency(potentialEarning, product.currency || DEFAULT_CURRENCY)}
              </Badge>
            </div>
          )}

          {/* Sales indicator */}
          {(product.sales_count || 0) > 0 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-full px-2.5 py-1">
              <Flame className="h-3 w-3 text-orange-500" />
              <span className="text-[10px] font-bold">{product.sales_count} vente{product.sales_count > 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Org badge - bottom right */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm rounded-full px-2.5 py-1">
            {org?.logo_url && <img src={org.logo_url} alt="" className="h-4 w-4 rounded-full" />}
            <span className="text-[10px] font-semibold truncate max-w-[80px]">{org?.name}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <h3 className="font-extrabold text-base leading-tight line-clamp-2">{product.title}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-sm font-bold">
                {product.is_free ? 'Gratuit' : formatCurrency(product.price || 0, product.currency || DEFAULT_CURRENCY)}
              </span>
              {product.sale_price && product.sale_price < product.price && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatCurrency(product.price, product.currency || DEFAULT_CURRENCY)}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {isAffiliate ? (
            <div className="space-y-3">
              {/* Primary share row */}
              <div className="flex gap-2">
                <Button
                  className="flex-1 gap-2 h-11 text-sm font-bold rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => shareWhatsApp(0)}
                >
                  <span className="text-base">💬</span> Partager WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="h-11 px-3 rounded-xl"
                  onClick={copyLink}
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              {/* Expandable share kit */}
              <button
                onClick={() => setShowShareKit(!showShareKit)}
                className="w-full flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                {showShareKit ? 'Moins d\'options' : 'Plus de façons de partager'}
                {showShareKit ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              <AnimatePresence>
                {showShareKit && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2">
                      {/* Alternative WhatsApp messages */}
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Messages prêts à envoyer</p>
                      {SHARE_MESSAGES_FR.map((msgFn, i) => (
                        <button
                          key={i}
                          onClick={() => shareWhatsApp(i)}
                          className="w-full text-left p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors text-[11px] leading-relaxed border border-transparent hover:border-border"
                        >
                          {msgFn(product.title, '')}
                        </button>
                      ))}

                      {/* Other platforms */}
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-3">Autres réseaux</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5 rounded-xl" onClick={shareTelegram}>
                          ✈️ Telegram
                        </Button>
                        <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5 rounded-xl" onClick={shareFacebook}>
                          📘 Facebook
                        </Button>
                        <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5 rounded-xl" onClick={shareX}>
                          𝕏 Twitter
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                className="w-full gap-2 h-11 text-sm font-bold rounded-xl"
                disabled={enrolling}
                onClick={handleEnroll}
              >
                <Zap className="h-4 w-4" />
                {enrolling ? 'Inscription...' : 'Promouvoir & Gagner'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-xs gap-1.5 text-muted-foreground"
                onClick={() => navigate(productPath)}
              >
                <Eye className="h-3.5 w-3.5" /> Voir le produit
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
