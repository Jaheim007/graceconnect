import { useServerFn } from '@tanstack/react-start';
import { aiTranslateProduct } from '@/lib/ai/textHelpers.functions';
import { useState } from 'react';
import { Languages, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useOrg } from '@/contexts/OrgContext';
import { toast } from 'sonner';
import { useI18n } from '@/i18n/I18nContext';

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
  const translateFn = useServerFn(aiTranslateProduct);
  const [loading, setLoading] = useState(false);
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const handleTranslate = async (targetLang: string) => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const data: any = await translateFn({
        data: {
          org_id: currentOrg.id,
          product_id: productId,
          target_language: targetLang,
          fields: ['title', 'description', 'guarantee_text', 'faq_json'],
        },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Translation failed');

      const qualityMsg = data.quality_score
        ? ` (${isFr ? 'qualité' : 'quality'}: ${data.quality_score}/10)`
        : '';
      
      toast.success(
        `${isFr ? 'Traduction' : 'Translation'} ${targetLang.toUpperCase()} ${isFr ? 'générée' : 'generated'}${qualityMsg}`,
        {
          description: data.issues_found?.length > 0
            ? `${data.issues_found.length} ${isFr ? 'corrections appliquées' : 'corrections applied'}`
            : (isFr ? 'Aucune correction nécessaire ✓' : 'No corrections needed ✓'),
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
        }
      );
      onTranslated?.(data.translated);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || (isFr ? 'Erreur de traduction' : 'Translation error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
          {isFr ? 'Traduire' : 'Translate'}
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
