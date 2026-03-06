import { useState } from 'react';
import { Check, Copy, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type ShareContext = 'post-publication' | 'post-purchase' | 'ambassador' | 'earnings';

interface SocialShareKitProps {
  url: string;
  title: string;
  description?: string;
  context: ShareContext;
  price?: number;
  earnings?: number;
  commissionRate?: number;
}

const MESSAGES: Record<ShareContext, (t: string, p?: number, e?: number) => string> = {
  'post-publication': (t) => `🎉 Je viens d'écrire mon livre « ${t} » ! Découvre-le 👉`,
  'post-purchase': (t) => `📚 Je viens de lire « ${t} » — je te le recommande ! 👉`,
  'ambassador': (t, p) => `📖 ${t}${p ? ` — seulement ${p.toLocaleString('fr-FR')} FCFA` : ''} ! 👉`,
  'earnings': (_, __, e) => `💰 J'ai gagné ${(e || 0).toLocaleString('fr-FR')} FCFA en partageant des livres sur SiteViral ! 👉`,
};

interface Platform {
  name: string;
  icon: string;
  color: string;
  getUrl: (url: string, text: string) => string;
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
    getUrl: (url, text) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
];

export function SocialShareKit({ url, title, description, context, price, earnings, commissionRate }: SocialShareKitProps) {
  const [copied, setCopied] = useState(false);
  const message = MESSAGES[context](title, price, earnings);

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

  const emailSubject = context === 'post-publication'
    ? `Mon nouveau livre : ${title}`
    : `Découvre : ${title}`;

  const emailUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(`${message}\n\n${url}`)}`;

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-center">📤 Partage maintenant !</p>

      {/* Platform buttons */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {PLATFORMS.map(p => (
          <a
            key={p.name}
            href={p.getUrl(url, message)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${p.color} text-white rounded-xl p-3 text-center transition-all hover:scale-105 active:scale-95`}
          >
            <span className="text-lg block">{p.icon}</span>
            <span className="text-[10px] font-medium block mt-1">{p.name}</span>
          </a>
        ))}
      </div>

      {/* Secondary actions */}
      <div className="flex gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs"
          onClick={copyLink}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copié !' : 'Copier le lien'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs"
          asChild
        >
          <a href={emailUrl}>
            <Mail className="h-3.5 w-3.5" /> Email
          </a>
        </Button>
      </div>

      {/* Pre-written message preview */}
      <div className="bg-muted/50 rounded-xl p-3 border border-border text-xs text-muted-foreground text-center">
        <p className="italic">« {message} »</p>
      </div>
    </div>
  );
}
