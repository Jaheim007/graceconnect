import { useState } from 'react';
import { Share2, Copy, CheckCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { buildSocialShareUrl } from '@/lib/shareMeta';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

export function ShareButtons({ url, title, description = '', className, compact = false }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  const socialUrl = buildSocialShareUrl({ targetUrl: fullUrl, title, description });
  const encodedUrl = encodeURIComponent(socialUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description);

  const channels = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="h-4 w-4" />,
      color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20',
      href: `https://wa.me/?text=${encodedTitle}%0A${encodedDesc}%0A${encodedUrl}`,
    },
    {
      name: 'Facebook',
      icon: <span className="text-xs font-bold">f</span>,
      color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'Twitter',
      icon: <span className="text-xs font-bold">𝕏</span>,
      color: 'bg-foreground/5 text-foreground hover:bg-foreground/10 border-foreground/10',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      name: 'Telegram',
      icon: <span className="text-xs font-bold">✈</span>,
      color: 'bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 border-sky-500/20',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
  ];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(socialUrl);
    setCopied(true);
    toast({ title: '🔗 Lien copié !' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url: socialUrl });
      } catch { /* user cancelled */ }
    }
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        {channels.map((ch) => (
          <a
            key={ch.name}
            href={ch.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('h-8 w-8 rounded-lg border flex items-center justify-center transition-colors', ch.color)}
            title={ch.name}
          >
            {ch.icon}
          </a>
        ))}
        <button
          onClick={handleCopy}
          className="h-8 w-8 rounded-lg border border-border bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
          title="Copier le lien"
        >
          {copied ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <Share2 className="h-3.5 w-3.5" /> Partager
      </p>
      <div className="flex flex-wrap gap-2">
        {channels.map((ch) => (
          <a
            key={ch.name}
            href={ch.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors', ch.color)}
          >
            {ch.icon} {ch.name}
          </a>
        ))}
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-muted/50 text-xs font-medium hover:bg-muted transition-colors"
        >
          {copied ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copié !' : 'Copier le lien'}
        </button>
        {'share' in navigator && (
          <button
            onClick={handleNativeShare}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/20 bg-primary/5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" /> Plus…
          </button>
        )}
      </div>
    </div>
  );
}
