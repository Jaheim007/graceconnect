import { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useOrg } from '@/contexts/OrgContext';
import { toast } from 'sonner';

interface Props {
  productId: string;
  onTranslated?: (translated: Record<string, any>) => void;
}

const LANGUAGES = [
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'en', label: '🇬🇧 English' },
  { code: 'es', label: '🇪🇸 Español' },
];

export function ProductTranslateButton({ productId, onTranslated }: Props) {
  const { currentOrg } = useOrg();
  const [loading, setLoading] = useState(false);

  const handleTranslate = async (targetLang: string) => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-translate-product', {
        body: {
          org_id: currentOrg.id,
          product_id: productId,
          target_language: targetLang,
          fields: ['title', 'description', 'guarantee_text', 'faq_json'],
        },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Translation failed');

      toast.success(`Traduction ${targetLang.toUpperCase()} générée !`);
      onTranslated?.(data.translated);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erreur de traduction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
          Traduire
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem key={lang.code} onClick={() => handleTranslate(lang.code)}>
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
