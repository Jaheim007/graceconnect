import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useState } from 'react';
import { Copy, Check, Share2, MessageCircle, Twitter, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ViralSnippetsProps {
  productId: string;
  productTitle: string;
  orgSlug: string;
}

const PLATFORM_ICONS: Record<string, typeof Twitter> = {
  whatsapp: MessageCircle,
  twitter: Twitter,
  facebook: Facebook,
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  quote: { label: 'Citation', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  hook: { label: 'Accroche', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  benefit: { label: 'Bénéfice', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  social_post: { label: 'Post social', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
};

/**
 * ViralSnippets — Displays shareable content snippets for a product.
 * Each snippet has copy + share buttons for social networks.
 */
export function ViralSnippets({ productId, productTitle, orgSlug }: ViralSnippetsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: snippets = [], isLoading } = useQuery({
    queryKey: ['viral-snippets', productId],
    queryFn: async () => {
      const { data } = await db.from('viral_snippets')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });
      return data || [];
    },
    enabled: !!productId,
  });

  if (isLoading || snippets.length === 0) return null;

  const productUrl = `https://siteviral.com/org/${orgSlug}/product/${productId}`;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text + '\n\n' + productUrl);
    setCopiedId(id);
    toast.success('Copié avec le lien !');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = (text: string, platform: string) => {
    const fullText = text + '\n\n' + productUrl;
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(text)}`, '_blank');
        break;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Extraits partageables</h3>
        <Badge variant="secondary" className="text-[10px]">{snippets.length} extraits</Badge>
      </div>

      <div className="grid gap-2">
        {snippets.map((snippet: any) => {
          const typeMeta = TYPE_LABELS[snippet.snippet_type] || TYPE_LABELS.quote;
          const isCopied = copiedId === snippet.id;

          return (
            <div
              key={snippet.id}
              className="rounded-xl border border-border bg-card p-3 space-y-2 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-start gap-2">
                <Badge variant="outline" className={cn('text-[10px] shrink-0', typeMeta.color)}>
                  {typeMeta.label}
                </Badge>
                <p className="text-sm leading-relaxed flex-1">{snippet.text}</p>
              </div>
              <div className="flex gap-1.5 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[11px] gap-1"
                  onClick={() => handleShare(snippet.text, 'whatsapp')}
                >
                  <MessageCircle className="h-3 w-3" /> WhatsApp
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[11px] gap-1"
                  onClick={() => handleShare(snippet.text, 'twitter')}
                >
                  <Twitter className="h-3 w-3" /> X
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[11px] gap-1"
                  onClick={() => handleCopy(snippet.id, snippet.text)}
                >
                  {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {isCopied ? 'Copié' : 'Copier'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
