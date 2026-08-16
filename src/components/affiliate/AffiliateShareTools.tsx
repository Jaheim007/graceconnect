import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, MessageCircle, Share2, QrCode } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/BrandIcons';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { useShortLink } from '@/hooks/useShortLink';
import { useI18n } from '@/i18n/I18nContext';

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
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const targetPath = (() => {
    try { return new URL(shareUrl).pathname + new URL(shareUrl).search; } catch { return shareUrl; }
  })();
  const { shareUrl: socialShareUrl } = useShortLink({
    targetPath,
    title: productTitle || orgName,
    description: productTitle
      ? (isFr ? `Découvrez ${productTitle} sur ${orgName}` : `Check out ${productTitle} on ${orgName}`)
      : (isFr ? `Rejoignez ${orgName} sur Siteviral` : `Join ${orgName} on Siteviral`),
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(socialShareUrl);
    setCopied(true);
    toast({
      title: isFr ? 'Lien copié !' : 'Link copied!',
      description: isFr ? 'Votre code affilié est inclus.' : 'Your affiliate code is included.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMessages = productTitle
    ? isFr
      ? [
          `🔥 Découvrez "${productTitle}" sur ${orgName} !\n\n👉 ${socialShareUrl}`,
          `📚 Je vous recommande ce contenu exceptionnel : "${productTitle}"\n\nAccédez-y ici : ${socialShareUrl}`,
          `Salut ! J'ai trouvé quelque chose d'intéressant pour vous :\n"${productTitle}" par ${orgName}\n\n${socialShareUrl}`,
        ]
      : [
          `🔥 Check out "${productTitle}" on ${orgName}!\n\n👉 ${socialShareUrl}`,
          `📚 I highly recommend this: "${productTitle}"\n\nGet it here: ${socialShareUrl}`,
          `Hey! Found something great for you:\n"${productTitle}" by ${orgName}\n\n${socialShareUrl}`,
        ]
    : isFr
      ? [
          `🌟 Rejoignez ${orgName} sur Siteviral !\n\nDécouvrez contenus, ressources et bien plus.\n\n👉 ${socialShareUrl}`,
          `Salut ! Je fais partie de ${orgName} et je pense que ça pourrait vous intéresser.\n\nRejoignez-nous : ${socialShareUrl}`,
          `📢 ${orgName} est sur Siteviral ! Contenus exclusifs, ressources numériques, communauté.\n\n${socialShareUrl}`,
        ]
      : [
          `🌟 Join ${orgName} on Siteviral!\n\nDiscover content, resources and more.\n\n👉 ${socialShareUrl}`,
          `Hey! I'm part of ${orgName} and I think you'd love it.\n\nJoin us: ${socialShareUrl}`,
          `📢 ${orgName} is on Siteviral! Exclusive content, digital resources, community.\n\n${socialShareUrl}`,
        ];

  const handleWhatsApp = (msg: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: productTitle || orgName,
        text: productTitle
          ? (isFr ? `Découvrez "${productTitle}" sur ${orgName}` : `Check out "${productTitle}" on ${orgName}`)
          : (isFr ? `Rejoignez ${orgName} sur Siteviral` : `Join ${orgName} on Siteviral`),
        url: socialShareUrl,
      });
    } else {
      handleCopy();
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(socialShareUrl)}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
        <p className="text-[11px] font-mono text-muted-foreground flex-1 truncate">{socialShareUrl}</p>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy}>
          {copied ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleCopy}>
          {copied ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? (isFr ? 'Copié' : 'Copied') : (isFr ? 'Copier' : 'Copy')}
        </Button>

        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleNativeShare}>
          <Share2 className="h-3.5 w-3.5" /> {isFr ? 'Partager' : 'Share'}
        </Button>

        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <QrCode className="h-3.5 w-3.5" /> QR Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-sm">{isFr ? 'QR Code affilié' : 'Affiliate QR Code'}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-3 py-4">
              <img src={qrUrl} alt="QR Code" className="rounded-xl border border-border" />
              <p className="text-[10px] text-muted-foreground text-center max-w-[200px] break-all">{socialShareUrl}</p>
              <Badge variant="secondary" className="text-[10px]">Code: {affiliateCode}</Badge>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" />
          {isFr ? 'Messages pré-rédigés WhatsApp' : 'Pre-written WhatsApp messages'}
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
