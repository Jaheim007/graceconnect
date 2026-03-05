import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';

interface AICoverGeneratorProps {
  productId: string;
  title: string;
  productType?: string;
  description?: string;
  currentCoverUrl?: string | null;
  onCoverGenerated: (url: string) => void;
}

export function AICoverGenerator({
  productId,
  title,
  productType,
  description,
  currentCoverUrl,
  onCoverGenerated,
}: AICoverGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const generate = async () => {
    if (!title.trim()) {
      toast({ title: isFr ? 'Ajoutez un titre d\'abord' : 'Add a title first', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('ai-generate-cover', {
        body: {
          product_id: productId,
          title,
          product_type: productType || '',
          description: description || '',
        },
      });

      if (response.error) throw new Error(response.error.message);
      const result = response.data;

      if (!result.ok) throw new Error(result.error || 'Generation failed');

      setPreviewUrl(result.cover_url);
      onCoverGenerated(result.cover_url);
      toast({ title: isFr ? '🎨 Couverture générée !' : '🎨 Cover generated!' });
    } catch (e: any) {
      toast({
        title: isFr ? 'Erreur de génération' : 'Generation error',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        {previewUrl && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-[2/3] max-w-[200px] rounded-xl overflow-hidden border border-primary/30 shadow-md"
          >
            <img src={previewUrl} alt="AI generated cover" className="w-full h-full object-cover" />
            <div className="absolute top-2 right-2">
              <span className="bg-primary/90 text-primary-foreground text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                <Check className="h-2.5 w-2.5" /> IA
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={previewUrl ? 'outline' : 'default'}
          size="sm"
          onClick={generate}
          disabled={loading}
          className="gap-1.5 text-xs"
        >
          {loading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              {isFr ? 'Génération...' : 'Generating...'}
            </>
          ) : previewUrl ? (
            <>
              <RefreshCw className="h-3 w-3" />
              {isFr ? 'Régénérer' : 'Regenerate'}
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3" />
              {isFr ? 'Générer une couverture IA' : 'Generate AI cover'}
            </>
          )}
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground">
        {isFr
          ? 'L\'IA créera une couverture unique basée sur le titre et la description de votre produit.'
          : 'AI will create a unique cover based on your product title and description.'}
      </p>
    </div>
  );
}
