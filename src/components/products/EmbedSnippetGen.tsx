import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, CheckCircle, Code2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';
import { getPublicOrigin } from '@/lib/publicUrl';

interface EmbedSnippetGenProps {
  productId: string;
  productTitle: string;
  orgSlug: string;
  price: number;
  currency: string;
  isFree: boolean;
}

export function EmbedSnippetGen({ productId, productTitle, orgSlug, price, currency, isFree }: EmbedSnippetGenProps) {
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [copied, setCopied] = useState('');
  const [buttonText, setButtonText] = useState(isFree ? (isFr ? 'Télécharger' : 'Download') : (isFr ? 'Acheter maintenant' : 'Buy now'));
  const [buttonColor, setButtonColor] = useState('#d4920a');
  const [buttonSize, setButtonSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [affiliateCode, setAffiliateCode] = useState('');

  const origin = getPublicOrigin();
  const productUrl = `${origin}/org/${orgSlug}/product/${productId}`;

  // Widget snippet (new — with popup checkout)
  const widgetSnippet = `<!-- SiteViral Checkout Widget -->
<div data-siteviral-product="${productId}"
     data-siteviral-text="${buttonText}${!isFree ? ` — ${price.toLocaleString()} ${currency}` : ''}"
     data-siteviral-color="${buttonColor}"
     data-siteviral-size="${buttonSize}"${affiliateCode ? `\n     data-siteviral-ref="${affiliateCode}"` : ''}>
</div>
<script src="${origin}/embed.js" defer></script>`;

  // Simple link snippet (old style — fallback)
  const linkSnippet = `<!-- SiteViral Buy Button -->
<a href="${productUrl}${affiliateCode ? `?ref=${affiliateCode}` : ''}" target="_blank" rel="noopener"
   style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;
   background:${buttonColor};color:#fff;font-weight:700;font-size:14px;
   border-radius:8px;text-decoration:none;font-family:sans-serif;
   transition:opacity 0.2s"
   onmouseover="this.style.opacity='0.85'"
   onmouseout="this.style.opacity='1'">
  ${buttonText}${!isFree ? ` — ${price.toLocaleString()} ${currency}` : ''}
</a>`;

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    toast({ title: isFr ? '✅ Code copié !' : '✅ Code copied!' });
    setTimeout(() => setCopied(''), 2000);
  };

  const padding = buttonSize === 'small' ? '8px 16px' : buttonSize === 'large' ? '16px 32px' : '12px 24px';
  const fontSize = buttonSize === 'small' ? 13 : buttonSize === 'large' ? 16 : 14;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Code2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{isFr ? 'Widget d\'achat intégrable' : 'Embeddable Checkout Widget'}</h3>
        <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">Snap</Badge>
      </div>

      {/* Customization */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{isFr ? 'Texte du bouton' : 'Button text'}</Label>
          <Input value={buttonText} onChange={e => setButtonText(e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{isFr ? 'Couleur' : 'Color'}</Label>
          <div className="flex gap-2 items-center">
            <input type="color" value={buttonColor} onChange={e => setButtonColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0" />
            <Input value={buttonColor} onChange={e => setButtonColor(e.target.value)} className="h-8 text-xs font-mono flex-1" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{isFr ? 'Taille' : 'Size'}</Label>
          <Select value={buttonSize} onValueChange={(v: any) => setButtonSize(v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="small">{isFr ? 'Petit' : 'Small'}</SelectItem>
              <SelectItem value="medium">{isFr ? 'Moyen' : 'Medium'}</SelectItem>
              <SelectItem value="large">{isFr ? 'Grand' : 'Large'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{isFr ? 'Code ambassadeur (optionnel)' : 'Ambassador code (optional)'}</Label>
          <Input value={affiliateCode} onChange={e => setAffiliateCode(e.target.value)} placeholder="REF123" className="h-8 text-xs font-mono" />
        </div>
      </div>

      {/* Preview */}
      <div className="bg-muted/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2">
        <button
          type="button"
          onClick={e => e.preventDefault()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding, background: buttonColor, color: '#fff',
            fontWeight: 700, fontSize, borderRadius: 8,
            border: 'none', cursor: 'pointer', fontFamily: 'sans-serif',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {buttonText}{!isFree ? ` — ${price.toLocaleString()} ${currency}` : ''}
        </button>
        <span className="text-[10px] text-muted-foreground">⚡ SiteViral</span>
      </div>

      {/* Code tabs */}
      <Tabs defaultValue="widget" className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-8">
          <TabsTrigger value="widget" className="text-xs gap-1">
            <Code2 className="h-3 w-3" /> Widget Popup
          </TabsTrigger>
          <TabsTrigger value="link" className="text-xs gap-1">
            <ExternalLink className="h-3 w-3" /> {isFr ? 'Lien simple' : 'Simple link'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="widget" className="space-y-2 mt-3">
          <p className="text-[11px] text-muted-foreground">
            {isFr
              ? 'Collez ce code sur votre site. Un bouton d\'achat apparaîtra avec un checkout popup intégré.'
              : 'Paste this code on your website. A buy button will appear with a built-in checkout popup.'}
          </p>
          <Textarea value={widgetSnippet} readOnly className="text-[10px] font-mono h-32 resize-none" />
          <Button size="sm" className="w-full gap-1.5" onClick={() => handleCopy(widgetSnippet, 'widget')}>
            {copied === 'widget' ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied === 'widget' ? (isFr ? 'Copié !' : 'Copied!') : (isFr ? 'Copier le widget' : 'Copy widget code')}
          </Button>
        </TabsContent>

        <TabsContent value="link" className="space-y-2 mt-3">
          <p className="text-[11px] text-muted-foreground">
            {isFr
              ? 'Version simple : un lien HTML qui redirige vers votre page de vente.'
              : 'Simple version: an HTML link that redirects to your sales page.'}
          </p>
          <Textarea value={linkSnippet} readOnly className="text-[10px] font-mono h-28 resize-none" />
          <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => handleCopy(linkSnippet, 'link')}>
            {copied === 'link' ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied === 'link' ? (isFr ? 'Copié !' : 'Copied!') : (isFr ? 'Copier le lien' : 'Copy link code')}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
