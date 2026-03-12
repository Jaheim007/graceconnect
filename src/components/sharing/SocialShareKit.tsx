import { useState, useMemo } from 'react';
import { Check, Copy, Mail, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { trackEvent } from '@/hooks/useClientAnalytics';
import { buildShareUrlForPath } from '@/lib/shareMeta';
import { useI18n } from '@/i18n/I18nContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ShareContext = 'post-publication' | 'post-purchase' | 'ambassador' | 'earnings';

interface SocialShareKitProps {
  url: string;
  title: string;
  description?: string;
  context: ShareContext;
  price?: number;
  earnings?: number;
  commissionRate?: number;
  productId?: string;
}

const MESSAGES_FR: Record<ShareContext, (t: string, p?: number, e?: number) => string> = {
  'post-publication': (t) => `🎉 Je viens d'écrire mon livre « ${t} » ! Découvre-le 👉`,
  'post-purchase': (t) => `📚 Je viens de lire « ${t} » — je te le recommande ! 👉`,
  'ambassador': (t, p) => `📖 ${t}${p ? ` — seulement ${p.toLocaleString('fr-FR')} FCFA` : ''} ! 👉`,
  'earnings': (_, __, e) => `💰 J'ai gagné ${(e || 0).toLocaleString('fr-FR')} FCFA en partageant des livres sur SiteViral ! 👉`,
};

const MESSAGES_EN: Record<ShareContext, (t: string, p?: number, e?: number) => string> = {
  'post-publication': (t) => `🎉 I just wrote my book "${t}"! Check it out 👉`,
  'post-purchase': (t) => `📚 I just read "${t}" — I recommend it! 👉`,
  'ambassador': (t, p) => `📖 ${t}${p ? ` — only ${p.toLocaleString('en-US')} FCFA` : ''}! 👉`,
  'earnings': (_, __, e) => `💰 I earned ${(e || 0).toLocaleString('en-US')} FCFA by sharing books on SiteViral! 👉`,
};

interface Platform {
  name: string;
  icon: string;
  color: string;
  getUrl: (url: string, text: string) => string;
  copyOnly?: boolean;
}

const PLATFORMS: Platform[] = [
  {
    name: 'WhatsApp',
    icon: '💬',
    color: 'bg-emerald-500 hover:bg-emerald-600',
    getUrl: (url, text) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    name: 'Facebook',
    icon: '📘',
    color: 'bg-blue-600 hover:bg-blue-700',
    getUrl: (url, text) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
  },
  {
    name: 'Telegram',
    icon: '✈️',
    color: 'bg-sky-500 hover:bg-sky-600',
    getUrl: (url, text) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    name: 'X / Twitter',
    icon: '𝕏',
    color: 'bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600',
    getUrl: (url, text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-blue-700 hover:bg-blue-800',
    getUrl: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: 'Instagram',
    icon: '📸',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
    getUrl: () => '',
    copyOnly: true,
  },
  {
    name: 'TikTok',
    icon: '🎵',
    color: 'bg-black hover:bg-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-700',
    getUrl: () => '',
    copyOnly: true,
  },
];

export function SocialShareKit({ url, title, description, context, price, earnings, commissionRate, productId }: SocialShareKitProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const MESSAGES = isFr ? MESSAGES_FR : MESSAGES_EN;
  const message = MESSAGES[context](title, price, earnings);

  // Ensure all share URLs route through the edge function for proper OG previews
  const ogUrl = useMemo(() => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'siteviral.com' || parsed.hostname === 'www.siteviral.com' || parsed.hostname.endsWith('.lovable.app')) {
        return buildShareUrlForPath(parsed.pathname + parsed.search);
      }
    } catch {
      if (url.startsWith('/')) return buildShareUrlForPath(url);
    }
    return url;
  }, [url]);

  const track = (platform: string) => {
    trackEvent('share_click', {
      platform,
      context,
      product_id: productId || null,
      url,
    });
  };

  const copyText = async (text: string, platformName?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(platformName ? (isFr ? `Texte copié ! Colle-le dans ${platformName}.` : `Text copied! Paste it in ${platformName}.`) : (isFr ? 'Lien copié !' : 'Link copied!'));
      track(platformName || 'copy_link');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isFr ? 'Impossible de copier' : 'Unable to copy');
    }
  };

  const handlePlatformClick = (p: Platform) => {
    track(p.name);
    if (p.copyOnly) {
      copyText(`${message} ${ogUrl}`, p.name);
      return;
    }
    window.open(p.getUrl(ogUrl, message), '_blank', 'noopener,noreferrer');
  };

  const emailSubject = context === 'post-publication'
    ? (isFr ? `Mon nouveau livre : ${title}` : `My new book: ${title}`)
    : (isFr ? `Découvre : ${title}` : `Check out: ${title}`);

  const emailUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(`${message}\n\n${ogUrl}`)}`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(ogUrl)}`;

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-center">📤 Partage maintenant !</p>

      {/* Platform buttons */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {PLATFORMS.map(p => (
          <button
            key={p.name}
            onClick={() => handlePlatformClick(p)}
            className={`${p.color} text-white rounded-xl p-3 text-center transition-all hover:scale-105 active:scale-95`}
          >
            <span className="text-lg block">{p.icon}</span>
            <span className="text-[10px] font-medium block mt-1 truncate">{p.name}</span>
          </button>
        ))}
      </div>

      {/* Secondary actions */}
      <div className="flex gap-2 justify-center flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs"
          onClick={() => copyText(ogUrl)}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copié !' : 'Copier le lien'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs"
          asChild
          onClick={() => track('email')}
        >
          <a href={emailUrl}>
            <Mail className="h-3.5 w-3.5" /> Email
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs"
          onClick={() => { setShowQR(true); track('qr_code'); }}
        >
          <QrCode className="h-3.5 w-3.5" /> QR Code
        </Button>
      </div>

      {/* Pre-written message preview */}
      <div className="bg-muted/50 rounded-xl p-3 border border-border text-xs text-muted-foreground text-center">
        <p className="italic">« {message} »</p>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">📱 QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <img src={qrUrl} alt="QR Code" className="rounded-xl border border-border" width={250} height={250} />
            <p className="text-xs text-muted-foreground text-center">
              Scanne ce code pour accéder directement au produit.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
