import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, MessageCircle, QrCode, Check, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface ShareWidgetProps {
  url: string;
  title: string;
  description?: string;
  /** Compact = icon-only button, full = expanded buttons */
  variant?: 'compact' | 'full';
}

export function ShareWidget({ url, title, description, variant = 'compact' }: ShareWidgetProps) {
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const whatsappMessages = [
    (t: string, u: string) => isFr ? `🔥 ${t} — Découvre ça ici : ${u}` : `🔥 ${t} — Check this out: ${u}`,
    (t: string, u: string) => isFr ? `Hey ! Je te recommande "${t}" 👉 ${u}` : `Hey! I recommend "${t}" 👉 ${u}`,
    (t: string, u: string) => isFr ? `📚 "${t}" — un must-have : ${u}` : `📚 "${t}" — a must-have: ${u}`,
  ];

  const handleCopy = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: isFr ? '✅ Lien copié !' : '✅ Link copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const msgFn = whatsappMessages[Math.floor(Math.random() * whatsappMessages.length)];
    window.open(`https://wa.me/?text=${encodeURIComponent(msgFn(title, url))}`, '_blank');
  };

  if (variant === 'full') {
    return (
      <div className="flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
        <Button size="sm" className="gap-1.5 text-xs" onClick={handleWhatsApp}>
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? (isFr ? 'Copié' : 'Copied') : (isFr ? 'Copier' : 'Copy')}
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={(e) => { e.stopPropagation(); setShowQR(true); }}>
          <QrCode className="h-3.5 w-3.5" /> QR
        </Button>

        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-sm">QR Code</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-3 py-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`}
                alt="QR Code"
                className="w-48 h-48 rounded-lg"
              />
              <p className="text-xs text-muted-foreground text-center break-all">{url}</p>
              <Button size="sm" className="gap-1.5 text-xs w-full" onClick={handleCopy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {isFr ? 'Copier le lien' : 'Copy link'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Compact mode - dropdown
  return (
    <div onClick={e => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={handleCopy} className="gap-2 text-xs">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? (isFr ? 'Copié !' : 'Copied!') : (isFr ? 'Copier le lien' : 'Copy link')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleWhatsApp} className="gap-2 text-xs">
            <MessageCircle className="h-3.5 w-3.5 text-green-500" /> WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowQR(true); }} className="gap-2 text-xs">
            <QrCode className="h-3.5 w-3.5" /> QR Code
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`}
              alt="QR Code"
              className="w-48 h-48 rounded-lg"
            />
            <p className="text-xs text-muted-foreground text-center break-all">{url}</p>
            <Button size="sm" className="gap-1.5 text-xs w-full" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {isFr ? 'Copier le lien' : 'Copy link'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
