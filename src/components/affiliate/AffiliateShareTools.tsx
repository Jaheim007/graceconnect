import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, MessageCircle, Share2, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { buildSocialShareUrl } from '@/lib/shareMeta';

interface AffiliateShareToolsProps {
  shareUrl: string;
  orgName: string;
  affiliateCode: string;
  productTitle?: string;
}

export function AffiliateShareTools({ shareUrl, orgName, affiliateCode, productTitle }: AffiliateShareToolsProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const socialShareUrl = buildSocialShareUrl({
    targetUrl: shareUrl,
    title: productTitle || orgName,
    description: productTitle ? `Découvrez ${productTitle} sur ${orgName}` : `Rejoignez ${orgName} sur Siteviral`,
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(socialShareUrl);
    setCopied(true);
    toast({ title: 'Lien copié !', description: 'Votre code affilié est inclus.' });
    setTimeout(() => setCopied(false), 2000);
  };

  // Pre-written WhatsApp messages
  const whatsappMessages = productTitle
    ? [
        `🔥 Découvrez "${productTitle}" sur ${orgName} !\n\n👉 ${socialShareUrl}`,
        `📚 Je vous recommande ce contenu exceptionnel : "${productTitle}"\n\nAccédez-y ici : ${socialShareUrl}`,
        `Salut ! J'ai trouvé quelque chose d'intéressant pour vous :\n"${productTitle}" par ${orgName}\n\n${socialShareUrl}`,
      ]
    : [
        `🌟 Rejoignez ${orgName} sur Siteviral !\n\nDécouvrez contenus, ressources et bien plus.\n\n👉 ${socialShareUrl}`,
        `Salut ! Je fais partie de ${orgName} et je pense que ça pourrait vous intéresser.\n\nRejoignez-nous : ${socialShareUrl}`,
        `📢 ${orgName} est sur Siteviral ! Contenus exclusifs, ressources numériques, communauté.\n\n${socialShareUrl}`,
      ];

  const handleWhatsApp = (msg: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: productTitle || orgName,
        text: productTitle ? `Découvrez "${productTitle}" sur ${orgName}` : `Rejoignez ${orgName} sur Siteviral`,
        url: socialShareUrl,
      });
    } else {
      handleCopy();
    }
  };

  // Simple QR code using a free API
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="space-y-3">
      {/* Link display */}
      <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
        <p className="text-[11px] font-mono text-muted-foreground flex-1 truncate">{shareUrl}</p>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy}>
          {copied ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleCopy}>
          {copied ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copié' : 'Copier'}
        </Button>

        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleNativeShare}>
          <Share2 className="h-3.5 w-3.5" /> Partager
        </Button>

        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <QrCode className="h-3.5 w-3.5" /> QR Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-sm">QR Code affilié</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-3 py-4">
              <img src={qrUrl} alt="QR Code" className="rounded-xl border border-border" />
              <p className="text-[10px] text-muted-foreground text-center max-w-[200px] break-all">{shareUrl}</p>
              <Badge variant="secondary" className="text-[10px]">Code: {affiliateCode}</Badge>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pre-written WhatsApp messages */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <MessageCircle className="h-3.5 w-3.5 text-green-500" /> Messages pré-rédigés WhatsApp
        </p>
        <div className="space-y-1.5">
          {whatsappMessages.map((msg, i) => (
            <button
              key={i}
              onClick={() => handleWhatsApp(msg)}
              className="w-full text-left p-2.5 rounded-lg border border-border bg-background/50 hover:bg-green-500/5 hover:border-green-500/30 transition-all text-[11px] text-muted-foreground leading-relaxed"
            >
              {msg.slice(0, 120)}…
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
