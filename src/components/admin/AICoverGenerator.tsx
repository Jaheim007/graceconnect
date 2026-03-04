import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageIcon, Loader2, Sparkles, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AICoverGeneratorProps {
  open: boolean;
  onClose: () => void;
  onInsert: (imageUrl: string) => void;
  context?: string;
}

const STYLE_OPTIONS = [
  { value: 'professional', label: 'Professionnel & épuré' },
  { value: 'vibrant', label: 'Vibrant & coloré' },
  { value: 'minimalist', label: 'Minimaliste' },
  { value: 'creative', label: 'Créatif & artistique' },
  { value: 'religious', label: 'Spirituel & religieux' },
];

const FORMAT_OPTIONS = [
  { value: 'book', label: 'Couverture de livre (2:3)' },
  { value: 'video', label: 'Bannière vidéo (16:9)' },
  { value: 'square', label: 'Carré (1:1)' },
];

const TEXT_OPTIONS = [
  { value: 'with', label: 'Avec titre sur la couverture' },
  { value: 'without', label: 'Sans texte (visuel uniquement)' },
];

export function AICoverGenerator({ open, onClose, onInsert, context = 'product' }: AICoverGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('professional');
  const [format, setFormat] = useState('book');
  const [textMode, setTextMode] = useState('with');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-cover', {
        body: { prompt: prompt.trim(), style, format, context, include_text: textMode === 'with' },
      });

      if (error) {
        let errorMessage = "Impossible de générer l'image.";
        const errorWithContext = error as { context?: Response; message?: string };

        if (errorWithContext.context) {
          const payload = await errorWithContext.context.json().catch(() => null);
          if (payload?.error && typeof payload.error === 'string') {
            errorMessage = payload.error;
          }
        } else if (errorWithContext.message) {
          errorMessage = errorWithContext.message;
        }

        throw new Error(errorMessage);
      }
      if (data?.error) throw new Error(data.error);

      if (data?.imageUrl) {
        setResult(data.imageUrl);
      } else {
        throw new Error('Aucune image générée.');
      }
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message || 'Impossible de générer l\'image.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (result) {
      onInsert(result);
      onClose();
      setPrompt('');
      setResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Générer une couverture IA
          </DialogTitle>
          <DialogDescription>
            Décrivez votre contenu et l'IA créera une couverture professionnelle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Décrivez votre produit / contenu</Label>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Un ebook sur la gestion financière pour les familles africaines"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Style visuel</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Texte sur la couverture</Label>
            <Select value={textMode} onValueChange={setTextMode}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEXT_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'Génération en cours… (15-30s)' : 'Générer la couverture'}
          </Button>

          {result && (
            <div className="space-y-3">
              <div className="rounded-xl border border-border overflow-hidden bg-muted/30">
                <img src={result} alt="Couverture générée" className="w-full max-h-80 object-contain" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleInsert} className="flex-1 gap-2">
                  <ImageIcon className="h-4 w-4" /> Utiliser cette couverture
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" /> Regénérer
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
