// Checkout embed snippet generator
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle, Code2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [copied, setCopied] = useState(false);
  const [buttonText, setButtonText] = useState(isFree ? 'Télécharger' : 'Acheter maintenant');
  const [buttonColor, setButtonColor] = useState('#d4920a');

  const productUrl = `${window.location.origin}/org/${orgSlug}/product/${productId}`;

  const snippet = `<!-- Siteviral Checkout Button -->
<a href="${productUrl}" target="_blank" rel="noopener"
   style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;
   background:${buttonColor};color:#fff;font-weight:700;font-size:14px;
   border-radius:8px;text-decoration:none;font-family:sans-serif;
   transition:opacity 0.2s"
   onmouseover="this.style.opacity='0.85'"
   onmouseout="this.style.opacity='1'">
  ${buttonText}${!isFree ? ` — ${price.toLocaleString()} ${currency}` : ''}
</a>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast({ title: 'Code copié !' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Code2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Bouton d'achat embarquable</h3>
        <Badge variant="outline" className="text-[10px]">Embed</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Texte du bouton</Label>
          <Input value={buttonText} onChange={e => setButtonText(e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Couleur</Label>
          <div className="flex gap-2 items-center">
            <input type="color" value={buttonColor} onChange={e => setButtonColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
            <Input value={buttonColor} onChange={e => setButtonColor(e.target.value)} className="h-8 text-xs font-mono flex-1" />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-center">
        <a href="#" onClick={e => e.preventDefault()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: buttonColor, color: '#fff', fontWeight: 700, fontSize: 14, borderRadius: 8, textDecoration: 'none' }}
        >
          {buttonText}{!isFree ? ` — ${price.toLocaleString()} ${currency}` : ''}
        </a>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Code HTML à copier</Label>
        <Textarea value={snippet} readOnly className="text-[10px] font-mono h-28 resize-none" />
      </div>

      <Button size="sm" className="w-full gap-1.5" onClick={handleCopy}>
        {copied ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copié !' : 'Copier le code'}
      </Button>
    </div>
  );
}
