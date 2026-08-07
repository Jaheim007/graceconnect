import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';

interface AIDescriptionButtonProps {
  title: string;
  productType: string;
  price: number;
  currency?: string;
  existingDescription?: string;
  onGenerated: (html: string) => void;
}

/**
 * One-click "Write my sales description" button using AI.
 * Generates a compelling sales description based on product title and type.
 */
export function AIDescriptionButton({ title, productType, price, currency = 'XOF', existingDescription, onGenerated }: AIDescriptionButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const generate = async () => {
    if (!title || title.length < 3) {
      toast({
        title: isFr ? 'Titre requis' : 'Title required',
        description: isFr ? 'Entrez d\'abord un titre pour votre produit.' : 'Enter a product title first.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-description', {
        body: {
          title,
          product_type: productType,
          price,
          currency,
          language: locale,
          existing_description: existingDescription || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.description) {
        onGenerated(data.description);
        toast({ title: isFr ? 'Description générée !' : 'Description generated!' });
      }
    } catch (err: any) {
      toast({
        title: isFr ? 'Erreur' : 'Error',
        description: err.message || (isFr ? 'Impossible de générer la description.' : 'Could not generate description.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2 text-xs border-primary/30 text-primary hover:bg-primary/5"
      onClick={generate}
      disabled={loading}
    >
      {loading ? (
        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {isFr ? 'Génération...' : 'Generating...'}</>
      ) : (
        <> {isFr ? 'Écris ma description IA' : 'Write my AI description'}</>
      )}
    </Button>
  );
}
