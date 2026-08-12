import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Share2, Copy, Check, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import {
  renderFlyer,
  buildFlyerCaptions,
  FLYER_FORMATS,
  FLYER_THEMES,
  type FlyerFormat,
  type FlyerTheme,
} from '@/lib/flyer/renderFlyer';

export interface FlyerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  author?: string | null;
  benefit?: string | null;
  priceLabel: string;
  coverUrl?: string | null;
  /** Full share link (product link, or the ambassador's referral link) */
  link: string;
  /** Small line above the title, e.g. "Partagé par Jean" */
  byline?: string | null;
  defaultTheme?: FlyerTheme;
}

const FORMAT_LABELS: Record<FlyerFormat, { fr: string; en: string }> = {
  poster: { fr: 'Affiche', en: 'Poster' },
  square: { fr: 'Carré', en: 'Square' },
  story: { fr: 'Story', en: 'Story' },
};

const THEME_LABELS: Record<FlyerTheme, { fr: string; en: string }> = {
  navy: { fr: 'Bleu / Or', en: 'Navy / Gold' },
  dark: { fr: 'Sombre', en: 'Dark' },
  light: { fr: 'Clair', en: 'Light' },
  church: { fr: 'Église', en: 'Church' },
};

export function FlyerDialog({
  open,
  onOpenChange,
  title,
  author,
  benefit,
  priceLabel,
  coverUrl,
  link,
  byline,
  defaultTheme = 'navy',
}: FlyerDialogProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const [format, setFormat] = useState<FlyerFormat>('poster');
  const [theme, setTheme] = useState<FlyerTheme>(defaultTheme);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const captions = useMemo(
    () => buildFlyerCaptions({ title, priceLabel, link, isFr, benefit }),
    [title, priceLabel, link, isFr, benefit],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setRendering(true);
    renderFlyer({
      format,
      theme,
      title,
      author,
      benefit,
      priceLabel,
      coverUrl,
      link,
      byline,
      ctaLabel: t('Je le veux', 'Get it now'),
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) toast.error(t('Impossible de générer le visuel', 'Could not generate the flyer'));
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, format, theme, title, author, benefit, priceLabel, coverUrl, link, byline]);

  const fileName = useMemo(
    () => `${title.toLowerCase().replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}-${format}.png`,
    [title, format],
  );

  const toBlob = useCallback(async () => {
    if (!dataUrl) return null;
    const res = await fetch(dataUrl);
    return res.blob();
  }, [dataUrl]);

  const handleDownload = async () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    a.click();
    toast.success(t('Visuel téléchargé', 'Flyer downloaded'));
  };

  const handleShare = async () => {
    const blob = await toBlob();
    if (!blob) return;
    const file = new File([blob], fileName, { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], text: captions.whatsapp });
        return;
      } catch {
        return; // user cancelled
      }
    }
    handleDownload();
    await navigator.clipboard.writeText(captions.whatsapp).catch(() => {});
    toast.success(
      t('Visuel téléchargé et texte copié', 'Flyer downloaded and caption copied'),
      { description: t('Colle-le dans WhatsApp ou Facebook.', 'Paste it into WhatsApp or Facebook.') },
    );
  };

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
    toast.success(t('Copié', 'Copied'));
  };

  const ratio = FLYER_FORMATS[format].w / FLYER_FORMATS[format].h;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            {t('Visuel prêt à partager', 'Ready-to-share flyer')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'Télécharge le visuel, copie le texte, et publie sur WhatsApp, Facebook ou ton site.',
              'Download the flyer, copy the caption, and post it on WhatsApp, Facebook or your site.',
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_240px]">
          {/* Preview */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/30">
            <div className="mx-auto w-full max-w-[380px] p-3">
              <div className="relative w-full" style={{ aspectRatio: String(ratio) }}>
                {dataUrl ? (
                  <img
                    src={dataUrl}
                    alt={t('Aperçu du visuel', 'Flyer preview')}
                    className="h-full w-full rounded-xl object-contain shadow-lg"
                  />
                ) : (
                  <div className="h-full w-full animate-pulse rounded-xl bg-muted" />
                )}
                {rendering && (
                  <div className="absolute inset-0 grid place-items-center rounded-xl bg-background/50 backdrop-blur-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t('Format', 'Format')}
              </p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(FLYER_FORMATS) as FlyerFormat[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                      format === f
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card hover:border-primary/40',
                    )}
                  >
                    {isFr ? FORMAT_LABELS[f].fr : FORMAT_LABELS[f].en}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t('Style', 'Theme')}
              </p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(FLYER_THEMES) as FlyerTheme[]).map((th) => (
                  <button
                    key={th}
                    onClick={() => setTheme(th)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition',
                      theme === th ? 'border-primary' : 'border-border hover:border-primary/40',
                    )}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-black/10"
                      style={{
                        background: `linear-gradient(135deg, ${FLYER_THEMES[th].bg} 50%, ${FLYER_THEMES[th].accent} 50%)`,
                      }}
                    />
                    {isFr ? THEME_LABELS[th].fr : THEME_LABELS[th].en}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Button onClick={handleShare} disabled={!dataUrl} className="w-full gap-2">
                <Share2 className="h-4 w-4" />
                {t('Partager maintenant', 'Share now')}
              </Button>
              <Button onClick={handleDownload} disabled={!dataUrl} variant="outline" className="w-full gap-2">
                <Download className="h-4 w-4" />
                {t('Télécharger le PNG', 'Download PNG')}
              </Button>
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t('Textes prêts', 'Ready captions')}
              </p>
              {[
                { key: 'whatsapp', label: 'WhatsApp', text: captions.whatsapp },
                { key: 'facebook', label: 'Facebook', text: captions.facebook },
                { key: 'link', label: t('Lien seul', 'Link only'), text: link },
              ].map((c) => (
                <Button
                  key={c.key}
                  variant="ghost"
                  size="sm"
                  onClick={() => copy(c.key, c.text)}
                  className="w-full justify-between gap-2 text-xs"
                >
                  {c.label}
                  {copied === c.key ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
