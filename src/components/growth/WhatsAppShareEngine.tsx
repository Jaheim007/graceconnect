import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getOrCreateShortLink } from '@/lib/shareMeta';

export type ShareContext =
  | 'post-purchase'
  | 'post-publish'
  | 'ambassador-share'
  | 'earnings-brag'
  | 'invite-friend'
  | 'course-complete'
  | 'milestone';

interface WhatsAppShareProps {
  url: string;
  context: ShareContext;
  productTitle?: string;
  orgName?: string;
  earnings?: number;
  currency?: string;
  commissionPercent?: number;
  milestoneName?: string;
  courseName?: string;
  variant?: 'button' | 'card' | 'inline';
  className?: string;
}

const MESSAGES: Record<ShareContext, (opts: Omit<WhatsAppShareProps, 'context' | 'variant' | 'className'>) => string> = {
  'post-purchase': ({ productTitle, orgName, url }) =>
    `📚 Je viens de découvrir « ${productTitle || 'un produit incroyable'} »${orgName ? ` sur ${orgName}` : ''} ! Je te le recommande fortement 👉\n${url}`,

  'post-publish': ({ productTitle, url }) =>
    `🎉 Mon livre « ${productTitle} » est enfin publié ! 📖✨\nÇa m'a pris seulement 5 minutes avec l'IA.\nDécouvre-le ici 👉\n${url}`,

  'ambassador-share': ({ productTitle, commissionPercent, url }) =>
    `📖 ${productTitle}${commissionPercent ? ` — gagne ${commissionPercent}% de commission en le partageant !` : ''}\nDécouvre-le 👉\n${url}`,

  'earnings-brag': ({ earnings, currency }) =>
    `💰 J'ai gagné ${(earnings || 0).toLocaleString('fr-FR')} ${currency || 'FCFA'} en partageant des livres sur SiteViral !\n\nToi aussi tu peux gagner en partageant simplement 👉\nhttps://siteviral.com/gagner`,

  'invite-friend': ({ url }) =>
    `👋 Rejoins SiteViral ! C'est la plateforme où tu peux :\n✏️ Écrire un livre en 5 min avec l'IA\n💰 Gagner des commissions en partageant\n📚 Découvrir des ressources incroyables\n\nInscris-toi 👉\n${url}`,

  'course-complete': ({ courseName, url }) =>
    `🎓 Je viens de terminer la formation « ${courseName} » ! 🏆\nJe te la recommande 👉\n${url}`,

  'milestone': ({ milestoneName, url }) =>
    `🏆 ${milestoneName || 'Réussite débloquée'} sur SiteViral ! 🎉\nRejoins la communauté 👉\n${url || 'https://siteviral.com'}`,
};

const PLATFORMS = [
  {
    name: 'WhatsApp',
    icon: '💬',
    color: 'bg-emerald-600 hover:bg-emerald-700',
    getUrl: (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`,
  },
  {
    name: 'Telegram',
    icon: '✈️',
    color: 'bg-sky-500 hover:bg-sky-600',
    getUrl: (text: string) => `https://t.me/share/url?url=${encodeURIComponent(text.split('\n').pop() || '')}&text=${encodeURIComponent(text.split('\n').slice(0, -1).join('\n'))}`,
  },
  {
    name: 'Facebook',
    icon: '📘',
    color: 'bg-blue-600 hover:bg-blue-700',
    getUrl: (text: string) => {
      const urlMatch = text.match(/https?:\/\/\S+/);
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlMatch?.[0] || '')}&quote=${encodeURIComponent(text.replace(urlMatch?.[0] || '', '').trim())}`;
    },
  },
  {
    name: 'X',
    icon: '𝕏',
    color: 'bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-600',
    getUrl: (text: string) => {
      const urlMatch = text.match(/https?:\/\/\S+/);
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text.replace(urlMatch?.[0] || '', '').trim())}&url=${encodeURIComponent(urlMatch?.[0] || '')}`;
    },
  },
  {
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-blue-700 hover:bg-blue-800',
    getUrl: (text: string) => {
      const urlMatch = text.match(/https?:\/\/\S+/);
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(urlMatch?.[0] || '')}`;
    },
  },
];

/**
 * WhatsAppShareEngine — optimized multi-platform share with contextual pre-written messages
 * WhatsApp is primary CTA; other platforms secondary
 */
export function WhatsAppShareEngine(props: WhatsAppShareProps) {
  const { context, variant = 'card', className, url, ...rest } = props;
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const message = MESSAGES[context]({ url, ...rest });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Impossible de copier');
    }
  };

  const shareWhatsApp = () => {
    window.open(PLATFORMS[0].getUrl(message), '_blank');
  };

  if (variant === 'button') {
    return (
      <Button onClick={shareWhatsApp} className={cn('gap-2 bg-emerald-600 hover:bg-emerald-700 text-white', className)}>
        💬 Partager sur WhatsApp
      </Button>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button size="sm" onClick={shareWhatsApp} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8">
          💬 WhatsApp
        </Button>
        <Button size="sm" variant="outline" onClick={copyLink} className="gap-1.5 text-xs h-8">
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copié' : 'Lien'}
        </Button>
      </div>
    );
  }

  // Card variant (default)
  return (
    <div className={cn('bg-card border border-border rounded-2xl p-5 space-y-4', className)}>
      <p className="text-sm font-bold text-center">📤 Partage maintenant !</p>

      {/* Pre-written message preview */}
      <div className="bg-muted/50 rounded-xl p-3 border border-border">
        <p className="text-xs text-muted-foreground italic whitespace-pre-line line-clamp-4">« {message} »</p>
      </div>

      {/* Primary CTA: WhatsApp */}
      <Button onClick={shareWhatsApp} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-11 text-sm font-bold">
        💬 Partager sur WhatsApp
      </Button>

      {/* Secondary platforms */}
      <div className="grid grid-cols-4 gap-2">
        {PLATFORMS.slice(1).map(p => (
          <a
            key={p.name}
            href={p.getUrl(message)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${p.color} text-white rounded-xl p-2.5 text-center transition-all hover:scale-105 active:scale-95`}
          >
            <span className="text-base block">{p.icon}</span>
            <span className="text-[9px] font-medium block mt-0.5">{p.name}</span>
          </a>
        ))}
      </div>

      {/* Copy link */}
      <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={copyLink}>
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Lien copié !' : 'Copier le lien'}
      </Button>
    </div>
  );
}
