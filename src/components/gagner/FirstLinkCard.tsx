import { useState } from 'react';
import { Copy, Check, Share2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from 'sonner';

/**
 * "Ton premier lien" — copy + WhatsApp share in one tap, right after activation.
 */
export function FirstLinkCard({
  url,
  productTitle,
  commissionPercent,
}: {
  url: string;
  productTitle: string;
  commissionPercent?: number | null;
}) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [copied, setCopied] = useState(false);

  const message = isFr
    ? `Je te recommande « ${productTitle} » 👇\n${url}`
    : `I recommend "${productTitle}" 👇\n${url}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(isFr ? 'Lien copié' : 'Link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isFr ? 'Copie impossible' : 'Copy failed');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 glass-premium p-5 space-y-4">
      <div className="pointer-events-none absolute -top-20 -right-10 h-44 w-44 rounded-full bg-emerald-500/15 blur-3xl" aria-hidden />
      <div className="relative">
        <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-500 font-bold">
          {isFr ? 'Ton premier lien' : 'Your first link'}
        </p>
        <p className="mt-1 text-base font-extrabold leading-tight">{productTitle}</p>
        {commissionPercent ? (
          <p className="text-xs text-muted-foreground">
            {commissionPercent}% {isFr ? 'de commission par vente' : 'commission per sale'}
          </p>
        ) : null}
      </div>

      <div className="relative rounded-2xl border border-border bg-card px-3 py-2.5">
        <p className="truncate text-xs font-mono text-muted-foreground">{url}</p>
      </div>

      <div className="relative grid gap-2 sm:grid-cols-2">
        <Button onClick={copy} variant="outline" className="gap-2 rounded-2xl">
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          {isFr ? 'Copier le lien' : 'Copy link'}
        </Button>
        <Button
          asChild
          className="gap-2 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
        >
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </Button>
      </div>

      <p className="relative flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Share2 className="h-3 w-3" />
        {isFr
          ? 'Chaque achat via ce lien te rapporte une commission.'
          : 'Every purchase through this link earns you a commission.'}
      </p>
    </div>
  );
}
