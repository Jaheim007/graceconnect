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

  const loadImg = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const handleDownload = async () => {
    try {
      // Card dimensions (high-res for print quality)
      const W = 700;
      const H = 1000;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Background card with rounded corners
      ctx.fillStyle = '#ffffff';
      const r = 36;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(W - r, 0);
      ctx.quadraticCurveTo(W, 0, W, r);
      ctx.lineTo(W, H - r);
      ctx.quadraticCurveTo(W, H, W - r, H);
      ctx.lineTo(r, H);
      ctx.quadraticCurveTo(0, H, 0, H - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.stroke();

      let cursorY = 60;

      // Cover image
      if (coverImageUrl) {
        try {
          const cover = await loadImg(coverImageUrl);
          const cw = 220;
          const ch = 320;
          const cx = (W - cw) / 2;
          // Rounded cover
          ctx.save();
          const cr = 16;
          ctx.beginPath();
          ctx.moveTo(cx + cr, cursorY);
          ctx.lineTo(cx + cw - cr, cursorY);
          ctx.quadraticCurveTo(cx + cw, cursorY, cx + cw, cursorY + cr);
          ctx.lineTo(cx + cw, cursorY + ch - cr);
          ctx.quadraticCurveTo(cx + cw, cursorY + ch, cx + cw - cr, cursorY + ch);
          ctx.lineTo(cx + cr, cursorY + ch);
          ctx.quadraticCurveTo(cx, cursorY + ch, cx, cursorY + ch - cr);
          ctx.lineTo(cx, cursorY + cr);
          ctx.quadraticCurveTo(cx, cursorY, cx + cr, cursorY);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(cover, cx, cursorY, cw, ch);
          ctx.restore();
          cursorY += ch + 28;
        } catch {
          /* skip cover if it fails to load (CORS) */
        }
      }

      // Title (wrap to 2 lines)
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 32px system-ui, -apple-system, Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      const wrap = (text: string, maxWidth: number, maxLines = 2): string[] => {
        const words = text.split(/\s+/);
        const lines: string[] = [];
        let line = '';
        for (const w of words) {
          const test = line ? `${line} ${w}` : w;
          if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = w;
            if (lines.length === maxLines - 1) break;
          } else {
            line = test;
          }
        }
        if (lines.length < maxLines && line) lines.push(line);
        // Add ellipsis if truncated
        if (lines.length === maxLines) {
          let last = lines[maxLines - 1];
          const remaining = words.slice(words.indexOf(last.split(' ').pop() || '') + 1);
          if (remaining.length) {
            while (last && ctx.measureText(last + '…').width > maxWidth) {
              last = last.slice(0, -1);
            }
            lines[maxLines - 1] = last + '…';
          }
        }
        return lines;
      };
      const titleLines = wrap(productTitle, W - 80, 2);
      titleLines.forEach((line) => {
        ctx.fillText(line, W / 2, cursorY + 32);
        cursorY += 40;
      });
      cursorY += 4;

      // Org name
      if (orgName) {
        ctx.fillStyle = '#64748b';
        ctx.font = '18px system-ui, -apple-system, sans-serif';
        ctx.fillText(orgName, W / 2, cursorY + 18);
        cursorY += 32;
      }

      // Price
      if (price && price > 0) {
        ctx.fillStyle = '#059669';
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        const priceText = `${new Intl.NumberFormat(isFr ? 'fr-FR' : 'en-US').format(price)} ${currency || 'FCFA'}`;
        ctx.fillText(priceText, W / 2, cursorY + 22);
        cursorY += 34;
      }

      // QR
      const qr = await loadImg(qrApiUrl);
      const qs = 280;
      ctx.drawImage(qr, (W - qs) / 2, cursorY, qs, qs);
      cursorY += qs + 22;

      // Scan label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px system-ui, -apple-system, sans-serif';
      ctx.fillText(isFr ? '📱 Scannez pour découvrir et acheter' : '📱 Scan to discover and buy', W / 2, cursorY);
      cursorY += 28;

      // Brand
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      ctx.fillText('SITEVIRAL.COM', W / 2, cursorY);

      // Trigger download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qr-card-${productTitle.slice(0, 30).replace(/\s+/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
      }, 'image/png');
    } catch (err) {
      console.error('QR card download failed:', err);
      // Fallback to bare QR if compositing fails
      const link = document.createElement('a');
      link.href = qrApiUrl;
      link.target = '_blank';
      link.download = `qr-${productTitle.slice(0, 30).replace(/\s+/g, '-')}.png`;
      link.click();
    }
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
                {new Intl.NumberFormat(isFr ? 'fr-FR' : 'en-US').format(price)} {currency || 'FCFA'}
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
