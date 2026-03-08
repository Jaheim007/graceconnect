import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getOrCreateShortLink } from '@/lib/shareMeta';

interface QuickShareFloatingButtonProps {
  url: string;
  productTitle?: string;
  commissionPercent?: number;
  className?: string;
}

/**
 * QuickShareFloatingButton — sticky FAB for instant sharing on product pages
 * Automatically resolves a short link with OG metadata for rich previews.
 */
export function QuickShareFloatingButton({
  url,
  productTitle,
  commissionPercent,
  className,
}: QuickShareFloatingButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState(url);

  // Resolve to short link
  useEffect(() => {
    const path = url.replace('https://siteviral.com', '').replace(/^https?:\/\/[^/]+/, '');
    if (!path) return;
    let cancelled = false;
    getOrCreateShortLink({
      targetPath: path,
      title: productTitle || 'Produit Siteviral',
    }).then(shortUrl => { if (!cancelled) setResolvedUrl(shortUrl); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [url, productTitle]);

  const shareWhatsApp = () => {
    const text = commissionPercent
      ? `📖 ${productTitle || 'Découvre ce produit'} — gagne ${commissionPercent}% de commission ! 👉\n${resolvedUrl}`
      : `📖 ${productTitle || 'Découvre ce produit'} — je te le recommande ! 👉\n${resolvedUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setOpen(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(resolvedUrl);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Impossible de copier');
    }
  };

  return (
    <div className={cn('fixed bottom-20 right-4 z-40 sm:bottom-6', className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-16 right-0 bg-card border border-border rounded-2xl shadow-xl p-3 space-y-2 w-48"
          >
            <button
              onClick={shareWhatsApp}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors text-left"
            >
              <span className="text-base">💬</span>
              <span className="text-xs font-semibold">WhatsApp</span>
            </button>
            <button
              onClick={copyLink}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-xs font-semibold">{copied ? 'Copié !' : 'Copier le lien'}</span>
            </button>
            {commissionPercent && commissionPercent > 0 && (
              <div className="px-2 pt-1">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold text-center">
                  💰 {commissionPercent}% de commission par vente
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className={cn(
          'h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-colors',
          open
            ? 'bg-muted text-muted-foreground'
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
        )}
      >
        {open ? <X className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
      </motion.button>
    </div>
  );
}
