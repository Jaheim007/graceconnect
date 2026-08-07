import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Copy, Check, Share2, Zap, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  productId: string;
  orgId: string;
}

const PLATFORM_LABELS: Record<string, { label: string; emoji: string }> = {
  whatsapp: { label: 'WhatsApp', emoji: '💬' },
  facebook: { label: 'Facebook', emoji: '📘' },
  instagram: { label: 'Instagram', emoji: '📸' },
  linkedin: { label: 'LinkedIn', emoji: '💼' },
  tiktok: { label: 'TikTok', emoji: '🎵' },
  twitter: { label: 'X / Twitter', emoji: '🐦' },
};

export function SocialSnippetsViewer({ productId, orgId }: Props) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  const { data: snippets, refetch } = useQuery({
    queryKey: ['social-snippets', productId],
    queryFn: async () => {
      const { data } = await db
        .from('digital_products')
        .select('social_snippets_json')
        .eq('id', productId)
        .maybeSingle();
      return (data?.social_snippets_json as any[]) || [];
    },
    staleTime: 60_000,
  });

  const handleCopy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success('Copié !');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('ai-generate-snippets', {
        body: { productId, orgId },
      });
      if (error) throw error;
      toast.success('Snippets générés !');
      setTimeout(() => refetch(), 2000);
    } catch (e: any) {
      toast.error(e.message || 'Erreur de génération');
    } finally {
      setGenerating(false);
    }
  };

  if (!snippets || snippets.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center space-y-3">
        <Zap className="h-5 w-5 mx-auto text-primary" />
        <p className="text-sm font-semibold">Posts sociaux IA</p>
        <p className="text-xs text-muted-foreground">Générez des posts prêts à copier pour promouvoir ce produit.</p>
        <Button size="sm" className="gap-2" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          {generating ? 'Génération…' : 'Générer les posts'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">Posts sociaux</h3>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Régénérer
        </Button>
      </div>
      {snippets.map((snippet: any, idx: number) => {
        const platform = PLATFORM_LABELS[snippet.platform] || { label: snippet.platform, emoji: '📝' };
        return (
          <div key={idx} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{platform.emoji} {platform.label}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] gap-1"
                onClick={() => handleCopy(snippet.text, idx)}
              >
                {copiedIdx === idx ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copiedIdx === idx ? 'Copié' : 'Copier'}
              </Button>
            </div>
            <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{snippet.text}</p>
          </div>
        );
      })}
    </div>
  );
}
