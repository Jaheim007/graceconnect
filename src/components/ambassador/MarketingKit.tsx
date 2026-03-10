import { useState, useEffect } from 'react';
import { Copy, Check, MessageCircle, Share2, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { getOrCreateShortLink } from '@/lib/shareMeta';

interface MarketingKitProps {
  productTitle: string;
  productPrice?: number;
  productCurrency?: string;
  commissionPercent?: number;
  shareUrl: string;
  orgName: string;
  className?: string;
}

const TEMPLATES = [
  {
    id: 'curiosity',
    label: '🤔 Curiosité',
    template: (title: string, url: string) =>
      `J'ai découvert quelque chose d'incroyable 🔥\n\n"${title}"\n\nÇa va changer ta façon de voir les choses. Regarde par toi-même :\n${url}`,
  },
  {
    id: 'recommendation',
    label: '⭐ Recommandation',
    template: (title: string, url: string) =>
      `Je te recommande "${title}" 💯\n\nC'est exactement ce dont tu as besoin. Je l'ai testé et c'est vraiment top.\n\n👉 ${url}`,
  },
  {
    id: 'urgency',
    label: '⚡ Urgence',
    template: (title: string, url: string) =>
      `🚨 Tu dois voir ça MAINTENANT\n\n"${title}"\n\nTout le monde en parle. Ne rate pas cette opportunité !\n\n${url}`,
  },
  {
    id: 'value',
    label: '💡 Valeur',
    template: (title: string, url: string) =>
      `Tu cherches à progresser ? 📈\n\nJ'ai trouvé "${title}" et c'est une pépite.\n\nLe contenu est de très haute qualité. Voici le lien :\n${url}`,
  },
  {
    id: 'story',
    label: '📖 Histoire',
    template: (title: string, url: string) =>
      `Avant de découvrir "${title}", j'étais perdu(e)…\n\nMaintenant, tout est plus clair. Si tu veux le même déclic :\n\n${url}`,
  },
];

export function MarketingKit({
  productTitle,
  productPrice,
  productCurrency,
  commissionPercent,
  shareUrl,
  orgName,
  className,
}: MarketingKitProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState(shareUrl);

  // Resolve to short link with OG metadata
  useEffect(() => {
    const path = shareUrl.replace('https://siteviral.com', '').replace(/^https?:\/\/[^/]+/, '');
    if (!path) return;
    let cancelled = false;
    getOrCreateShortLink({
      targetPath: path,
      title: productTitle,
      description: `Découvrez ${productTitle} sur ${orgName}`,
    }).then(url => { if (!cancelled) setResolvedUrl(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [shareUrl, productTitle, orgName]);

  // productPrice is already the effective price (sale_price or regular price)
  // passed by the caller using getEffectivePrice()
  const estimatedGain = productPrice && commissionPercent
    ? Math.round((productPrice * commissionPercent) / 100)
    : null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: '📋 Message copié !', description: 'Colle-le dans ta conversation WhatsApp ou tes réseaux.' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWhatsApp = (text: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-emerald-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold">Kit Marketing</h3>
          <p className="text-[10px] text-muted-foreground">Messages prêts à partager pour maximiser tes ventes</p>
        </div>
      </div>

      {estimatedGain != null && (
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
          <p className="text-xs text-muted-foreground">Gain estimé par vente</p>
          <p className="text-lg font-extrabold text-emerald-500">
            {estimatedGain.toLocaleString()} {productCurrency || 'XOF'}
          </p>
          <p className="text-[10px] text-muted-foreground">{commissionPercent}% de commission</p>
        </div>
      )}

      <div className="space-y-3">
      {TEMPLATES.map((tmpl, i) => {
          const message = tmpl.template(productTitle, resolvedUrl);
          const isCopied = copiedId === tmpl.id;

          return (
            <motion.div
              key={tmpl.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-xl border border-border bg-card/50 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">{tmpl.label}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] px-2 gap-1"
                    onClick={() => handleCopy(tmpl.id, message)}
                  >
                    {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    {isCopied ? 'Copié' : 'Copier'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] px-2 gap-1 text-emerald-600"
                    onClick={() => handleWhatsApp(message)}
                  >
                    <MessageCircle className="h-3 w-3" /> WhatsApp
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed line-clamp-4">
                {message}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
