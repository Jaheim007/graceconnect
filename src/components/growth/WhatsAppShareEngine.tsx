import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getOrCreateShortLink } from '@/lib/shareMeta';
import { useI18n } from '@/i18n/I18nContext';

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

const MESSAGES_FR: Record<ShareContext, (opts: Omit<WhatsAppShareProps, 'context' | 'variant' | 'className'>) => string> = {
  'post-purchase': ({ productTitle, orgName, url }) =>
    `📚 Je viens de découvrir « ${productTitle || 'un produit incroyable'} »${orgName ? ` sur ${orgName}` : ''} ! Je te le recommande fortement 👉\n${url}`,
  'post-publish': ({ productTitle, url }) =>
    `🎉 Mon livre « ${productTitle} » est enfin publié ! 📖\nÇa m'a pris seulement 5 minutes avec l'IA.\nDécouvre-le ici 👉\n${url}`,
  'ambassador-share': ({ productTitle, commissionPercent, url }) =>
    `📖 ${productTitle}${commissionPercent ? ` — gagne ${commissionPercent}% de commission en le partageant !` : ''}\nDécouvre-le 👉\n${url}`,
  'earnings-brag': ({ earnings, currency }) =>
    `💰 J'ai gagné ${(earnings || 0).toLocaleString()} ${currency || 'FCFA'} en partageant des livres sur SiteViral !\n\nToi aussi tu peux gagner en partageant simplement 👉\nhttps://siteviral.com/gagner`,
  'invite-friend': ({ url }) =>
    `👋 Rejoins SiteViral ! C'est la plateforme où tu peux :\n✏️ Écrire un livre en 5 min avec l'IA\n💰 Gagner des commissions en partageant\n📚 Découvrir des ressources incroyables\n\nInscris-toi 👉\n${url}`,
  'course-complete': ({ courseName, url }) =>
    `🎓 Je viens de terminer la formation « ${courseName} » ! 🏆\nJe te la recommande 👉\n${url}`,
  'milestone': ({ milestoneName, url }) =>
    `🏆 ${milestoneName || 'Réussite débloquée'} sur SiteViral ! 🎉\nRejoins la communauté 👉\n${url || 'https://siteviral.com'}`,
};

const MESSAGES_EN: Record<ShareContext, (opts: Omit<WhatsAppShareProps, 'context' | 'variant' | 'className'>) => string> = {
  'post-purchase': ({ productTitle, orgName, url }) =>
    `📚 I just discovered "${productTitle || 'an amazing product'}"${orgName ? ` on ${orgName}` : ''}! Highly recommend it 👉\n${url}`,
  'post-publish': ({ productTitle, url }) =>
    `🎉 My book "${productTitle}" is finally published! 📖\nIt only took 5 minutes with AI.\nCheck it out 👉\n${url}`,
  'ambassador-share': ({ productTitle, commissionPercent, url }) =>
    `📖 ${productTitle}${commissionPercent ? ` — earn ${commissionPercent}% commission by sharing!` : ''}\nCheck it out 👉\n${url}`,
  'earnings-brag': ({ earnings, currency }) =>
    `💰 I earned ${(earnings || 0).toLocaleString()} ${currency || 'FCFA'} by sharing books on SiteViral!\n\nYou can earn too by simply sharing 👉\nhttps://siteviral.com/gagner`,
  'invite-friend': ({ url }) =>
    `👋 Join SiteViral! The platform where you can:\n✏️ Write a book in 5 min with AI\n💰 Earn commissions by sharing\n📚 Discover incredible resources\n\nSign up 👉\n${url}`,
  'course-complete': ({ courseName, url }) =>
    `🎓 I just completed the "${courseName}" course! 🏆\nI recommend it 👉\n${url}`,
  'milestone': ({ milestoneName, url }) =>
    `🏆 ${milestoneName || 'Achievement unlocked'} on SiteViral! 🎉\nJoin the community 👉\n${url || 'https://siteviral.com'}`,
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

export function WhatsAppShareEngine(props: WhatsAppShareProps) {
  const { context, variant = 'card', className, url, ...rest } = props;
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState(url);
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const MESSAGES = isFr ? MESSAGES_FR : MESSAGES_EN;

  useEffect(() => {
    const path = url.replace('https://siteviral.com', '').replace(/^https?:\/\/[^/]+/, '');
    if (!path || path === url) return;
    let cancelled = false;
    getOrCreateShortLink({
      targetPath: path,
      title: rest.productTitle || rest.orgName || 'Siteviral',
    }).then(shortUrl => { if (!cancelled) setResolvedUrl(shortUrl); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [url, rest.productTitle, rest.orgName]);

  const message = MESSAGES[context]({ url: resolvedUrl, ...rest });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(resolvedUrl);
      setCopied(true);
      toast.success(isFr ? 'Lien copié !' : 'Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isFr ? 'Impossible de copier' : 'Unable to copy');
    }
  };

  const shareWhatsApp = () => {
    window.open(PLATFORMS[0].getUrl(message), '_blank');
  };

  if (variant === 'button') {
    return (
      <Button onClick={shareWhatsApp} className={cn('gap-2 bg-emerald-600 hover:bg-emerald-700 text-white', className)}>
        💬 {isFr ? 'Partager sur WhatsApp' : 'Share on WhatsApp'}
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
          {copied ? (isFr ? 'Copié' : 'Copied') : (isFr ? 'Lien' : 'Link')}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('bg-card border border-border rounded-2xl p-5 space-y-4', className)}>
      <p className="text-sm font-bold text-center">{isFr ? '📤 Partage maintenant !' : '📤 Share now!'}</p>

      <div className="bg-muted/50 rounded-xl p-3 border border-border">
        <p className="text-xs text-muted-foreground italic whitespace-pre-line line-clamp-4">« {message} »</p>
      </div>

      <Button onClick={shareWhatsApp} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-11 text-sm font-bold">
        💬 {isFr ? 'Partager sur WhatsApp' : 'Share on WhatsApp'}
      </Button>

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

      <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={copyLink}>
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? (isFr ? 'Lien copié !' : 'Link copied!') : (isFr ? 'Copier le lien' : 'Copy link')}
      </Button>
    </div>
  );
}
