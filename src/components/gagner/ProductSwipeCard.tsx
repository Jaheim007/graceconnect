import { useState, useEffect } from 'react';
import { getEffectivePrice } from '@/lib/effectivePrice';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Zap, Eye, ChevronDown, ChevronUp, Flame, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/lib/db';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getOrCreateShortLink } from '@/lib/shareMeta';
import { getPublicOrigin } from '@/lib/publicUrl';
import { useI18n } from '@/i18n/I18nContext';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

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

const SHARE_MESSAGES_EN = [
  (title: string, url: string) => `📖 I found "${title}" — it's really worth it! 👉 ${url}`,
  (title: string, url: string) => `🔥 This product is trending: "${title}". Check it out 👉 ${url}`,
  (title: string, url: string) => `💡 I recommend "${title}", you'll love it! ${url}`,
  (title: string, url: string) => `🎯 "${title}" — a must-have. Click here 👉 ${url}`,
];

export function ProductSwipeCard({ product, index }: ProductSwipeCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { fmt, fmtPrice } = useDisplayCurrency();
  const qc = useQueryClient();
  const [enrolling, setEnrolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareKit, setShowShareKit] = useState(false);

  const SHARE_MESSAGES = isFr ? SHARE_MESSAGES_FR : SHARE_MESSAGES_EN;

  const org = product.organizations;
  const commission = org?.affiliation_commission_percent || 10;
  const effectivePrice = getEffectivePrice(product);
  const potentialEarning = Math.round(effectivePrice * commission / 100);

  // PWYW handling
  const isPwyw = product.is_pwyw === true;
  const minPrice = product.min_price || 0;

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

  const fallbackUrl = `${getPublicOrigin()}${refPath}`;

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
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [refPath, myLink, product.title, product.description, product.cover_image_url]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/auth?intent=ambassador&redirect=/gagner');
      return;
    }
    setEnrolling(true);
    try {
      const { error } = await supabase.rpc('self_enroll_affiliate', { _org_id: org?.id });
      if (error) throw error;
      toast.success(isFr ? '🎉 Inscrit ! Partage maintenant pour gagner.' : '🎉 Enrolled! Share now to earn.');
      qc.invalidateQueries({ queryKey: ['my-aff-link', user.id, org?.id] });
      setShowShareKit(true);
    } catch (err: any) {
      if (err.message?.includes('already')) {
        toast.info(isFr ? 'Déjà ambassadeur ! Partage ce produit.' : 'Already an ambassador! Share this product.');
        qc.invalidateQueries({ queryKey: ['my-aff-link', user.id, org?.id] });
      } else {
        toast.error(err.message || (isFr ? 'Erreur' : 'Error'));
      }
    } finally {
      setEnrolling(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(isFr ? 'Lien copié ! Partage-le 🚀' : 'Link copied! Share it 🚀');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error(isFr ? 'Impossible de copier' : 'Unable to copy');
    }
  };

  const shareWhatsApp = (msgIndex = 0) => {
    const msg = SHARE_MESSAGES[msgIndex % SHARE_MESSAGES.length](product.title, shareUrl);
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const shareTelegram = () => {
    const msg = isFr ? `📖 ${product.title} — à découvrir !` : `📖 ${product.title} — check it out!`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareX = () => {
    const msg = isFr ? `📖 ${product.title} — je te le recommande !` : `📖 ${product.title} — I recommend it!`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(msg)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const isAffiliate = !!myLink;

  // Price display logic
  const renderPrice = () => {
    if (isPwyw) {
      return (
        <span className="text-sm font-bold text-amber-500">
          💰 {isFr ? 'Prix libre' : 'Name your price'}
          {minPrice > 0 && <span className="text-xs ml-1 text-muted-foreground">· {isFr ? 'Dès' : 'From'} {fmt(minPrice, product.currency)}</span>}
        </span>
      );
    }
    return (
      <span className="text-sm font-bold">
        {fmtPrice(product.price || 0, product.is_free, product.currency, isFr ? 'Gratuit' : 'Free')}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-md hover:shadow-lg transition-shadow">
        {/* Image */}
        <div className="relative aspect-[3/4] bg-muted/30 overflow-hidden">
          {product.cover_image_url ? (
            <img src={product.cover_image_url} alt={product.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 text-4xl opacity-30">📖</div>
          )}

          {/* Commission badge */}
          <div className="absolute top-2.5 right-2.5">
            <Badge className="bg-accent text-accent-foreground text-[10px] font-extrabold shadow-lg px-2 py-1 rounded-full">
              💰 {commission}%
            </Badge>
          </div>

          {/* Earnings badge */}
          {!product.is_free && !isPwyw && potentialEarning > 0 && (
            <div className="absolute top-2.5 left-2.5">
              <Badge variant="secondary" className="text-[10px] font-bold shadow-md px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm">
                {isFr ? 'Tu gagnes' : 'You earn'} {fmt(potentialEarning, product.currency)}
              </Badge>
            </div>
          )}

          {/* Bottom overlay info */}
          <div className="absolute bottom-0 left-0 right-0 px-2.5 py-2 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between">
            <div className="flex items-center gap-1">
              {(product.sales_count || 0) > 0 && (
                <span className="flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5">
                  <Flame className="h-2.5 w-2.5 text-orange-500" />
                  <span className="text-[9px] font-bold">{product.sales_count}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5">
              {org?.logo_url && <img src={org.logo_url} alt="" className="h-3.5 w-3.5 rounded-full" />}
              <span className="text-[9px] font-semibold truncate max-w-[70px]">{org?.name}</span>
              {org?.is_verified && <BadgeCheck className="h-2.5 w-2.5 text-primary shrink-0" />}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3.5 space-y-3">
          <div>
            <h3 className="font-bold text-sm leading-tight line-clamp-2">{product.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              {renderPrice()}
              {product.sale_price && product.sale_price < product.price && !isPwyw && (
                <span className="text-[10px] text-muted-foreground line-through">
                  {fmt(product.price, product.currency)}
                </span>
              )}
            </div>
          </div>

          {isAffiliate ? (
            <div className="space-y-2">
              <div className="flex gap-1.5">
                <Button size="sm" className="flex-1 gap-1.5 h-9 text-xs font-bold rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => shareWhatsApp(0)}>
                  <span className="text-sm">💬</span> {isFr ? 'Partager' : 'Share'}
                </Button>
                <Button size="sm" variant="outline" className="h-9 px-2.5 rounded-xl" onClick={copyLink}>
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>

              <button onClick={() => setShowShareKit(!showShareKit)} className="w-full flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors py-0.5">
                {showShareKit ? (isFr ? "Moins d'options" : 'Fewer options') : (isFr ? 'Plus de partage' : 'More sharing')}
                {showShareKit ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
              </button>

              <AnimatePresence>
                {showShareKit && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="space-y-2">
                      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{isFr ? 'Messages prêts' : 'Ready messages'}</p>
                      {SHARE_MESSAGES.map((msgFn, i) => (
                        <button key={i} onClick={() => shareWhatsApp(i)} className="w-full text-left p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors text-[10px] leading-relaxed border border-transparent hover:border-border">
                          {msgFn(product.title, '')}
                        </button>
                      ))}
                      <div className="grid grid-cols-3 gap-1.5 mt-2">
                        <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1 rounded-lg" onClick={shareTelegram}>✈️ Telegram</Button>
                        <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1 rounded-lg" onClick={shareFacebook}>📘 Facebook</Button>
                        <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1 rounded-lg" onClick={shareX}>𝕏 Twitter</Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Button size="sm" className="w-full gap-1.5 h-9 text-xs font-bold rounded-xl" disabled={enrolling} onClick={handleEnroll}>
                <Zap className="h-3.5 w-3.5" />
                {enrolling ? (isFr ? 'Inscription...' : 'Enrolling...') : (isFr ? 'Promouvoir & Gagner' : 'Promote & Earn')}
              </Button>
              <Button size="sm" variant="ghost" className="w-full text-[10px] gap-1 text-muted-foreground h-7" onClick={() => navigate(productPath)}>
                <Eye className="h-3 w-3" /> {isFr ? 'Voir le produit' : 'View product'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
