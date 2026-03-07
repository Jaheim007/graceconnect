import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer, QrCode } from 'lucide-react';
import { buildShareUrlForPath } from '@/lib/shareMeta';
import { useI18n } from '@/i18n/I18nContext';

interface PrintableQRCodeProps {
  productTitle: string;
  productUrl: string;
  coverImageUrl?: string;
  orgName?: string;
  price?: number;
  currency?: string;
}

/**
 * Beautiful printable QR code card with product cover, title and branding.
 * Designed for offline sharing: flyers, business cards, posters.
 */
export function PrintableQRCode({ productTitle, productUrl, coverImageUrl, orgName, price, currency }: PrintableQRCodeProps) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  // Build the QR URL with OG proxy
  const shareUrl = (() => {
    try {
      const parsed = new URL(productUrl);
      return buildShareUrlForPath(parsed.pathname);
    } catch {
      return productUrl.startsWith('/') ? buildShareUrlForPath(productUrl) : productUrl;
    }
  })();

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}&color=1a1a2e&bgcolor=ffffff&margin=1`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrApiUrl;
    link.target = '_blank';
    link.download = `qr-${productTitle.slice(0, 30).replace(/\s+/g, '-')}.png`;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !cardRef.current) return;
    printWindow.document.write(`
      <html><head><title>QR Code - ${productTitle}</title>
      <style>
        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; font-family: system-ui, sans-serif; }
        .card { width: 350px; border: 2px solid #e2e8f0; border-radius: 24px; overflow: hidden; text-align: center; padding: 32px; }
        .cover { width: 120px; height: 180px; object-fit: cover; border-radius: 12px; margin: 0 auto 16px; display: block; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .title { font-size: 18px; font-weight: 700; margin: 0 0 4px; }
        .org { font-size: 12px; color: #64748b; margin: 0 0 16px; }
        .qr { width: 200px; height: 200px; margin: 0 auto; border-radius: 12px; }
        .scan { font-size: 11px; color: #94a3b8; margin: 12px 0 0; }
        .brand { font-size: 10px; color: #cbd5e1; margin-top: 16px; }
      </style></head><body>
      <div class="card">
        ${coverImageUrl ? `<img class="cover" src="${coverImageUrl}" />` : ''}
        <p class="title">${productTitle}</p>
        ${orgName ? `<p class="org">${orgName}</p>` : ''}
        <img class="qr" src="${qrApiUrl}" />
        <p class="scan">📱 ${isFr ? 'Scannez pour acheter' : 'Scan to buy'}</p>
        <p class="brand">siteviral.com</p>
      </div>
      <script>window.onload=()=>window.print()</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setOpen(true)}>
        <QrCode className="h-3.5 w-3.5" />
        {isFr ? 'QR Code imprimable' : 'Printable QR Code'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">📱 {isFr ? 'QR Code Imprimable' : 'Printable QR Code'}</DialogTitle>
          </DialogHeader>

          {/* The printable card */}
          <div ref={cardRef} className="bg-white rounded-3xl p-8 text-center mx-auto max-w-[320px] border-2 border-border">
            {coverImageUrl && (
              <img
                src={coverImageUrl}
                alt={productTitle}
                className="w-28 h-40 object-cover rounded-xl mx-auto mb-4 shadow-lg"
                crossOrigin="anonymous"
              />
            )}
            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{productTitle}</h3>
            {orgName && <p className="text-xs text-gray-500 mb-4">{orgName}</p>}
            {price && price > 0 && (
              <p className="text-sm font-semibold text-emerald-600 mb-3">
                {new Intl.NumberFormat('fr-FR').format(price)} {currency || 'FCFA'}
              </p>
            )}
            <img
              src={qrApiUrl}
              alt="QR Code"
              className="w-48 h-48 mx-auto rounded-xl"
              crossOrigin="anonymous"
            />
            <p className="text-[11px] text-gray-400 mt-3">
              📱 {isFr ? 'Scannez pour découvrir et acheter' : 'Scan to discover and buy'}
            </p>
            <p className="text-[9px] text-gray-300 mt-3 tracking-wider uppercase">siteviral.com</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-center mt-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" /> {isFr ? 'Télécharger' : 'Download'}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" /> {isFr ? 'Imprimer' : 'Print'}
            </Button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground">
            {isFr
              ? 'Imprimez-le sur vos flyers, cartes de visite ou affiches pour vendre hors ligne !'
              : 'Print on your flyers, business cards or posters to sell offline!'}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
