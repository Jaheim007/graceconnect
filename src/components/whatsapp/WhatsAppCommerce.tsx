import { Phone, MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WhatsAppShareButtonProps {
  text: string;
  url?: string;
  phone?: string;
  variant?: 'default' | 'icon' | 'checkout';
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

function buildWhatsAppUrl(text: string, url?: string, phone?: string): string {
  const fullText = url ? `${text}\n\n${url}` : text;
  if (phone) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullText)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(fullText)}`;
}

export function WhatsAppShareButton({ text, url, phone, variant = 'default', className, size = 'sm' }: WhatsAppShareButtonProps) {
  const waUrl = buildWhatsAppUrl(text, url, phone);

  if (variant === 'icon') {
    return (
      <a href={waUrl} target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-colors', className)}>
        <MessageCircle className="h-4 w-4 text-[#25D366]" />
      </a>
    );
  }

  if (variant === 'checkout') {
    return (
      <a href={waUrl} target="_blank" rel="noopener noreferrer" className={cn('flex items-center gap-2 w-full justify-center px-4 py-3 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold text-sm transition-colors', className)}>
        <MessageCircle className="h-4 w-4" />
        Commander via WhatsApp
      </a>
    );
  }

  return (
    <Button asChild size={size} variant="outline" className={cn('gap-1.5 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10', className)}>
      <a href={waUrl} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-3.5 w-3.5" />
        WhatsApp
      </a>
    </Button>
  );
}

interface WhatsAppOrderButtonProps {
  productTitle: string;
  productPrice?: number;
  currency?: string;
  orgPhone?: string;
  orgName?: string;
  productUrl?: string;
  className?: string;
}

export function WhatsAppOrderButton({ productTitle, productPrice, currency = 'XOF', orgPhone, orgName, productUrl, className }: WhatsAppOrderButtonProps) {
  const priceText = productPrice ? ` (${productPrice.toLocaleString()} ${currency})` : '';
  const text = `Bonjour${orgName ? ` ${orgName}` : ''} ! 👋\n\nJe suis intéressé(e) par : *${productTitle}*${priceText}\n\nComment puis-je procéder à l'achat ?`;

  return (
    <WhatsAppShareButton
      text={text}
      url={productUrl}
      phone={orgPhone}
      variant="checkout"
      className={className}
    />
  );
}

export function WhatsAppProductShare({ productTitle, productUrl, className }: { productTitle: string; productUrl: string; className?: string }) {
  const text = `🔥 Découvre ce produit : *${productTitle}*\n\nVoici le lien :`;
  return <WhatsAppShareButton text={text} url={productUrl} className={className} />;
}
