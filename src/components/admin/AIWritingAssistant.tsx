import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Copy, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIWritingAssistantProps {
  open: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
  context?: string; // e.g. "product description", "campaign description"
}

const TONE_OPTIONS = [
  { value: 'professional', label_fr: 'Professionnel', label_en: 'Professional' },
  { value: 'friendly', label_fr: 'Amical & accessible', label_en: 'Friendly & accessible' },
  { value: 'inspiring', label_fr: 'Inspirant & motivant', label_en: 'Inspiring & motivating' },
  { value: 'persuasive', label_fr: 'Persuasif & vendeur', label_en: 'Persuasive & sales-driven' },
  { value: 'educational', label_fr: 'Éducatif & pédagogique', label_en: 'Educational' },
];

export function AIWritingAssistant({ open, onClose, onInsert, context = 'description' }: AIWritingAssistantProps) {
  const isFrUI = document.documentElement.lang === 'fr';
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
      const lang = document.documentElement.lang || 'fr';
      const { data, error } = await supabase.functions.invoke('ai-write-content', {
        body: { prompt: prompt.trim(), tone, context, lang },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Clean any markdown remnants and ensure HTML
      let content = data?.content || '';
      // Strip ```html wrapper if model added it
      content = content.replace(/^```html\s*/i, '').replace(/\s*```$/i, '');
      // Convert any remaining markdown bold/italic to HTML
      content = content.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Remove leading/trailing --- separators
      content = content.replace(/^\s*---\s*/g, '').replace(/\s*---\s*$/g, '');
      setResult(content || (document.documentElement.lang === 'fr' ? 'Aucun résultat généré.' : 'No result generated.'));
    } catch (err: any) {
      const isFr = document.documentElement.lang === 'fr';
      toast({ title: isFr ? 'Erreur IA' : 'AI Error', description: err.message || (isFr ? 'Impossible de générer le contenu.' : 'Unable to generate content.'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (result) {
      onInsert(result);
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
            <Sparkles className="h-5 w-5 text-primary" />
            Aide à la rédaction IA
          </DialogTitle>
          <DialogDescription>
            Décrivez brièvement ce que vous voulez et l'IA rédigera un texte complet pour vous.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Décrivez votre besoin</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Une description pour un ebook sur la gestion financière pour les familles africaines. Le livre contient 12 chapitres, des exercices pratiques..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>{isFrUI ? 'Ton souhaité' : 'Desired tone'}</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{isFrUI ? t.label_fr : t.label_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'Rédaction en cours…' : 'Générer le texte'}
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
                  <CheckCircle className="h-4 w-4" /> Insérer dans l'éditeur
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
                  {copied ? 'Copié' : 'Copier'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
