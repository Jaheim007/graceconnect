import { useState, useEffect } from 'react';
import { Copy, Check, MessageCircle, Share2, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { getOrCreateShortLink } from '@/lib/shareMeta';
import { formatCurrency } from '@/lib/currency';
import { useI18n } from '@/i18n/I18nContext';

interface MarketingKitProps {
  productTitle: string;
  productPrice?: number;
  productCurrency?: string;
  commissionPercent?: number;
  shareUrl: string;
  orgName: string;
  className?: string;
}

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
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState(shareUrl);

  const TEMPLATES = isFr ? [
    {
      id: 'curiosity', label: '🤔 Curiosité',
      template: (title: string, url: string) => `J'ai découvert quelque chose d'incroyable 🔥\n\n"${title}"\n\nÇa va changer ta façon de voir les choses. Regarde par toi-même :\n${url}`,
    },
    {
      id: 'recommendation', label: 'Recommandation',
      template: (title: string, url: string) => `Je te recommande "${title}" 💯\n\nC'est exactement ce dont tu as besoin. Je l'ai testé et c'est vraiment top.\n\n👉 ${url}`,
    },
    {
      id: 'urgency', label: '⚡ Urgence',
      template: (title: string, url: string) => `🚨 Tu dois voir ça MAINTENANT\n\n"${title}"\n\nTout le monde en parle. Ne rate pas cette opportunité !\n\n${url}`,
    },
    {
      id: 'value', label: '💡 Valeur',
      template: (title: string, url: string) => `Tu cherches à progresser ? 📈\n\nJ'ai trouvé "${title}" et c'est une pépite.\n\nLe contenu est de très haute qualité. Voici le lien :\n${url}`,
    },
    {
      id: 'story', label: '📖 Histoire',
      template: (title: string, url: string) => `Avant de découvrir "${title}", j'étais perdu(e)…\n\nMaintenant, tout est plus clair. Si tu veux le même déclic :\n\n${url}`,
    },
  ] : [
    {
      id: 'curiosity', label: '🤔 Curiosity',
      template: (title: string, url: string) => `I discovered something incredible 🔥\n\n"${title}"\n\nThis will change the way you see things. Check it out:\n${url}`,
    },
    {
      id: 'recommendation', label: 'Recommendation',
      template: (title: string, url: string) => `I recommend "${title}" 💯\n\nIt's exactly what you need. I tried it and it's truly amazing.\n\n👉 ${url}`,
    },
    {
      id: 'urgency', label: '⚡ Urgency',
      template: (title: string, url: string) => `🚨 You NEED to see this NOW\n\n"${title}"\n\nEveryone is talking about it. Don't miss out!\n\n${url}`,
    },
    {
      id: 'value', label: '💡 Value',
      template: (title: string, url: string) => `Looking to level up? 📈\n\nI found "${title}" and it's a gem.\n\nThe content is top quality. Here's the link:\n${url}`,
    },
    {
      id: 'story', label: '📖 Story',
      template: (title: string, url: string) => `Before I found "${title}", I was lost…\n\nNow everything is clearer. If you want the same breakthrough:\n\n${url}`,
    },
  ];

  useEffect(() => {
    const path = shareUrl.replace('https://siteviral.com', '').replace(/^https?:\/\/[^/]+/, '');
    if (!path) return;
    let cancelled = false;
    getOrCreateShortLink({
      targetPath: path,
      title: productTitle,
      description: isFr ? `Découvrez ${productTitle} sur ${orgName}` : `Discover ${productTitle} on ${orgName}`,
    }).then(url => { if (!cancelled) setResolvedUrl(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [shareUrl, productTitle, orgName, isFr]);

  const estimatedGain = productPrice && commissionPercent
    ? Math.round((productPrice * commissionPercent) / 100)
    : null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: isFr ? '📋 Message copié !' : '📋 Message copied!', description: isFr ? 'Colle-le dans ta conversation WhatsApp ou tes réseaux.' : 'Paste it in your WhatsApp or social media.' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWhatsApp = (text: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          
        </div>
        <div>
          <h3 className="text-sm font-bold">{isFr ? 'Kit Marketing' : 'Marketing Kit'}</h3>
          <p className="text-[10px] text-muted-foreground">{isFr ? 'Messages prêts à partager pour maximiser tes ventes' : 'Ready-to-share messages to maximize your sales'}</p>
        </div>
      </div>

      {estimatedGain != null && (
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
          <p className="text-xs text-muted-foreground">{isFr ? 'Gain estimé par vente' : 'Estimated earnings per sale'}</p>
          <p className="text-lg font-extrabold text-emerald-500">
            {formatCurrency(estimatedGain, productCurrency)}
          </p>
          <p className="text-[10px] text-muted-foreground">{commissionPercent}% {isFr ? 'de commission' : 'commission'}</p>
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
                    {isCopied ? (isFr ? 'Copié' : 'Copied') : (isFr ? 'Copier' : 'Copy')}
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
