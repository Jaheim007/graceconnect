import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer, QrCode, Loader2, Share2 } from 'lucide-react';
import { buildShareUrlForPath } from '@/lib/shareMeta';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  renderQrPoster,
  QR_POSTER_FORMATS,
  QR_POSTER_THEMES,
  type QrPosterFormat,
  type QrPosterTheme,
} from '@/lib/flyer/renderQrPoster';

interface PrintableQRCodeProps {
  productTitle: string;
  productUrl: string;
  coverImageUrl?: string;
  orgName?: string;
  orgAvatarUrl?: string;
  price?: number;
  currency?: string;
  /** Small caps line above the title, e.g. "Nouveau livre" */
  eyebrow?: string;
  defaultTheme?: QrPosterTheme;
}

const FORMAT_LABELS: Record<QrPosterFormat, { fr: string; en: string }> = {
  poster: { fr: 'Affiche A4', en: 'A4 poster' },
  card: { fr: 'Carte de table', en: 'Table card' },
};

const THEME_LABELS: Record<QrPosterTheme, { fr: string; en: string }> = {
  navy: { fr: 'Bleu / Or', en: 'Navy / Gold' },
  church: { fr: 'Église', en: 'Church' },
  ivory: { fr: 'Ivoire', en: 'Ivory' },
};

/**
 * Print-ready QR poster — the QR code is the hero, framed with the SiteViral
 * mark and the organization signature. Made to be printed and pinned in a
 * church, a shop or a school.
 */
export function PrintableQRCode({
  productTitle,
  productUrl,
  coverImageUrl,
  orgName,
  orgAvatarUrl,
  price,
  currency,
  eyebrow,
  defaultTheme = 'navy',
}: PrintableQRCodeProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<QrPosterFormat>('poster');
  const [theme, setTheme] = useState<QrPosterTheme>(defaultTheme);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const shareUrl = useMemo(() => {
    try {
      const parsed = new URL(productUrl);
      return buildShareUrlForPath(parsed.pathname);
    } catch {
      return productUrl.startsWith('/') ? buildShareUrlForPath(productUrl) : productUrl;
    }
  }, [productUrl]);

  const priceLabel = useMemo(() => {
    if (!price || price <= 0) return null;
    return `${new Intl.NumberFormat(isFr ? 'fr-FR' : 'en-US').format(price)} ${currency || 'FCFA'}`;
  }, [price, currency, isFr]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setRendering(true);
    renderQrPoster({
      format,
      theme,
      title: productTitle,
      link: shareUrl,
      coverUrl: coverImageUrl,
      orgName,
      orgAvatarUrl,
      priceLabel,
      eyebrow: eyebrow || null,
      scanLabel: t('Scannez avec votre téléphone', 'Scan with your phone'),
      footnote: t('Paiement Mobile Money · Accès immédiat', 'Mobile Money payment · Instant access'),
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) toast.error(t('Impossible de générer l’affiche', 'Could not generate the poster'));
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, format, theme, productTitle, shareUrl, coverImageUrl, orgName, orgAvatarUrl, priceLabel, eyebrow, isFr]);

  const fileName = useMemo(
    () => `qr-${productTitle.toLowerCase().replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}-${format}.png`,
    [productTitle, format],
  );

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    a.click();
    toast.success(t('Affiche téléchargée', 'Poster downloaded'));
  };

  const handleShare = async () => {
    if (!dataUrl) return;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], fileName, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: productTitle });
        return;
      }
    } catch {
      /* fall through to download */
    }
    handleDownload();
  };

  const handlePrint = () => {
    if (!dataUrl) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const isPoster = format === 'poster';
    win.document.write(`
      <html><head><title>${productTitle.replace(/</g, '')}</title>
      <style>
        @page { size: ${isPoster ? 'A4 portrait' : 'A5 portrait'}; margin: 8mm; }
        html, body { margin: 0; padding: 0; background: #fff; }
        img { display: block; width: 100%; height: auto; }
      </style></head><body>
      <img src="${dataUrl}" />
      <script>window.onload=()=>setTimeout(()=>window.print(),150)</script>
      </body></html>`);
    win.document.close();
  };

  const ratio = QR_POSTER_FORMATS[format].w / QR_POSTER_FORMATS[format].h;

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setOpen(true)}>
        <QrCode className="h-3.5 w-3.5" />
        {t('Affiche QR imprimable', 'Printable QR poster')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" />
              {t('Affiche QR imprimable', 'Printable QR poster')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'À imprimer et à afficher : église, boutique, école. Les gens scannent et achètent en 10 secondes.',
                'Print it and pin it up: church, shop, school. People scan and buy in 10 seconds.',
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
            {/* Preview */}
            <div className="rounded-2xl border border-border bg-muted/30 p-3">
              <div className="relative mx-auto w-full max-w-[340px]" style={{ aspectRatio: String(ratio) }}>
                {dataUrl ? (
                  <img
                    src={dataUrl}
                    alt={t('Aperçu de l’affiche QR', 'QR poster preview')}
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

            {/* Controls */}
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('Format', 'Format')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(QR_POSTER_FORMATS) as QrPosterFormat[]).map((f) => (
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
                  {(Object.keys(QR_POSTER_THEMES) as QrPosterTheme[]).map((th) => (
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
                          background: `linear-gradient(135deg, ${QR_POSTER_THEMES[th].bg} 50%, ${QR_POSTER_THEMES[th].accent} 50%)`,
                        }}
                      />
                      {isFr ? THEME_LABELS[th].fr : THEME_LABELS[th].en}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <Button onClick={handlePrint} disabled={!dataUrl} className="w-full gap-2">
                  <Printer className="h-4 w-4" />
                  {t('Imprimer', 'Print')}
                </Button>
                <Button onClick={handleDownload} disabled={!dataUrl} variant="outline" className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  {t('Télécharger le PNG', 'Download PNG')}
                </Button>
                <Button onClick={handleShare} disabled={!dataUrl} variant="ghost" className="w-full gap-2 text-xs">
                  <Share2 className="h-3.5 w-3.5" />
                  {t('Partager', 'Share')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
