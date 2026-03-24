import { useState, useEffect, useCallback } from 'react';
import { Share2, Copy, CheckCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getOrCreateShortLink, buildSocialShareUrl } from '@/lib/shareMeta';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  className?: string;
  compact?: boolean;
  resolveUrl?: () => Promise<string | null>;
}

export function ShareButtons({ url, title, description = '', image, className, compact = false, resolveUrl }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const { toast } = useToast();

  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  const fallbackUrl = buildSocialShareUrl({ targetUrl: fullUrl, title, description, image });

  // Immediately set a sync fallback, then upgrade to short link
  useEffect(() => {
    setShareUrl(fallbackUrl);

    if (resolveUrl) return;

    // Try to create a branded short link
    const path = url.startsWith('/')
      ? url
      : (() => {
          const parsed = new URL(fullUrl);
          return `${parsed.pathname}${parsed.search}`;
        })();
    getOrCreateShortLink({ targetPath: path, title, description, image })
      .then((shortUrl) => setShareUrl(shortUrl))
      .catch(() => { /* keep fallback */ });
  }, [fallbackUrl, fullUrl, image, resolveUrl, title, description, url]);

  const ensureShareUrl = useCallback(async () => {
    if (!resolveUrl) return shareUrl || fallbackUrl;

    const resolved = await resolveUrl();
    if (!resolved) return null;

    setShareUrl(resolved);
    return resolved;
  }, [fallbackUrl, resolveUrl, shareUrl]);

  const openChannel = useCallback(async (buildHref: (finalUrl: string) => string) => {
    const finalUrl = await ensureShareUrl();
    if (!finalUrl) return;
    window.open(buildHref(finalUrl), '_blank', 'noopener,noreferrer');
  }, [ensureShareUrl]);

  const channels = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="h-4 w-4" />,
      color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20',
      buildHref: (finalUrl: string) => `https://wa.me/?text=${encodeURIComponent(`${title}\n${description}\n${finalUrl}`)}`,
    },
    {
      name: 'Facebook',
      icon: <span className="text-xs font-bold">f</span>,
      color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20',
      buildHref: (finalUrl: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(finalUrl)}`,
    },
    {
      name: 'Twitter',
      icon: <span className="text-xs font-bold">𝕏</span>,
      color: 'bg-foreground/5 text-foreground hover:bg-foreground/10 border-foreground/10',
      buildHref: (finalUrl: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(finalUrl)}`,
    },
    {
      name: 'Telegram',
      icon: <span className="text-xs font-bold">✈</span>,
      color: 'bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 border-sky-500/20',
      buildHref: (finalUrl: string) => `https://t.me/share/url?url=${encodeURIComponent(finalUrl)}&text=${encodeURIComponent(title)}`,
    },
  ];

  const handleCopy = async () => {
    const finalUrl = await ensureShareUrl();
    if (!finalUrl) return;
    await navigator.clipboard.writeText(finalUrl);
    setCopied(true);
    toast({ title: '🔗 Lien copié !' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    const finalUrl = await ensureShareUrl();
    if (!finalUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url: finalUrl });
      } catch { /* user cancelled */ }
    }
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        {channels.map((ch) => (
          <button
            key={ch.name}
            type="button"
            onClick={() => void openChannel(ch.buildHref)}
            className={cn('h-8 w-8 rounded-lg border flex items-center justify-center transition-colors', ch.color)}
            title={ch.name}
          >
            {ch.icon}
          </button>
        ))}
        <button
          type="button"
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
          <button
            key={ch.name}
            type="button"
            onClick={() => void openChannel(ch.buildHref)}
            className={cn('inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors', ch.color)}
          >
            {ch.icon} {ch.name}
          </button>
        ))}
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-muted/50 text-xs font-medium hover:bg-muted transition-colors"
        >
          {copied ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copié !' : 'Copier le lien'}
        </button>
        {'share' in navigator && (
          <button
            type="button"
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
