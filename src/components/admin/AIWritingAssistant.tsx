import { useServerFn } from '@tanstack/react-start';
import { aiWriteContent } from '@/lib/ai/textHelpers.functions';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Loader2, Copy, CheckCircle, Wand2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';

interface AIWritingAssistantProps {
  open: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
  context?: string;
}

const TONE_OPTIONS = [
  { value: 'professional', label_fr: 'Professionnel', label_en: 'Professional' },
  { value: 'friendly', label_fr: 'Amical & accessible', label_en: 'Friendly & accessible' },
  { value: 'inspiring', label_fr: 'Inspirant & motivant', label_en: 'Inspiring & motivating' },
  { value: 'persuasive', label_fr: 'Persuasif & vendeur', label_en: 'Persuasive & sales-driven' },
  { value: 'educational', label_fr: 'Éducatif & pédagogique', label_en: 'Educational' },
];

export function AIWritingAssistant({ open, onClose, onInsert, context = 'description' }: AIWritingAssistantProps) {
  const { locale } = useI18n();
  const writeContentFn = useServerFn(aiWriteContent);
  const isFr = locale === 'fr';
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('professional');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult('');

    try {
      const data: any = await writeContentFn({
        data: { prompt: prompt.trim(), tone, context, lang: isFr ? 'fr' : 'en' },
      });

      let content = data?.content || '';
      content = content.replace(/^```html\s*/i, '').replace(/\s*```$/i, '');
      content = content.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
      content = content.replace(/^\s*---\s*/g, '').replace(/\s*---\s*$/g, '');
      setResult(content || (isFr ? 'Aucun résultat généré.' : 'No result generated.'));
    } catch (err: any) {
      toast({
        title: isFr ? 'Erreur IA' : 'AI Error',
        description: err.message || (isFr ? 'Impossible de générer le contenu.' : 'Unable to generate content.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (result) {
      // Strip leading/trailing empty paragraphs & whitespace from AI output
      const cleaned = result
        .replace(/^(\s*<p>\s*(<br\s*\/?>)?\s*<\/p>\s*)+/gi, '')
        .replace(/(\s*<p>\s*(<br\s*\/?>)?\s*<\/p>\s*)+$/gi, '')
        .trim();
      onInsert(cleaned || result);
      onClose();
      setPrompt('');
      setResult('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary shrink-0" />
            {isFr ? 'Aide à la rédaction IA' : 'AI Writing Assistant'}
          </DialogTitle>
          <DialogDescription>
            {isFr
              ? 'Décrivez brièvement ce que vous voulez et l\'IA rédigera un texte complet pour vous.'
              : 'Briefly describe what you need and the AI will write a complete text for you.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{isFr ? 'Décrivez votre besoin' : 'Describe your need'}</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={isFr
                ? 'Ex: Une description pour un ebook sur la gestion financière pour les familles africaines. Le livre contient 12 chapitres, des exercices pratiques...'
                : 'Ex: A description for an ebook about financial management for African families. The book has 12 chapters, practical exercises...'}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>{isFr ? 'Ton souhaité' : 'Desired tone'}</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{isFr ? t.label_fr : t.label_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading
              ? (isFr ? 'Rédaction en cours…' : 'Writing in progress…')
              : (isFr ? 'Générer le texte' : 'Generate text')}
          </Button>

          {result && (
            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-muted/30 p-4 max-h-60 overflow-y-auto">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: result }}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleInsert} className="flex-1 gap-2">
                  <CheckCircle className="h-4 w-4" /> {isFr ? 'Insérer dans l\'éditeur' : 'Insert into editor'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(result);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="gap-2"
                >
                  {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? (isFr ? 'Copié' : 'Copied') : (isFr ? 'Copier' : 'Copy')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
