import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/i18n/I18nContext';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { supabase } from '@/integrations/supabase/client';
import { useCreateProgram, useCreateModule, useCreateLesson } from '@/hooks/usePrograms';
import { Sparkles, Loader2, BookOpen, HelpCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS_FR = [
  { icon: BookOpen, text: 'Créer un cours de 10 minutes pour former le personnel au service client' },
  { icon: HelpCircle, text: 'Créer un quiz de 20 questions sur la sécurité au travail' },
  { icon: BookOpen, text: 'Créer un cours de 5 leçons sur le marketing digital' },
  { icon: HelpCircle, text: 'Créer un quiz de 5 minutes sur les réglementations alimentaires' },
  { icon: BookOpen, text: 'Négociation et influence dans le leadership' },
  { icon: BookOpen, text: 'Formation sur les bases de la comptabilité pour entrepreneurs' },
];

const SUGGESTIONS_EN = [
  { icon: BookOpen, text: 'Create a 10-minute course to train hotel staff on customer service etiquette' },
  { icon: HelpCircle, text: 'Create a 20-question quiz on machine safety in factories and warehouses' },
  { icon: BookOpen, text: 'Create a 2-lesson course about scaffolding safety' },
  { icon: HelpCircle, text: 'Create a 5-minute quiz on food regulations' },
  { icon: BookOpen, text: 'Negotiation and influence in leadership' },
  { icon: BookOpen, text: 'Introduction to financial literacy for small business owners' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (programId: string) => void;
}

export function CreateWithAIDialog({ open, onOpenChange, onCreated }: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const { handleAiError, refreshCredits } = useCreditGuard();

  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const createProgram = useCreateProgram();
  const createModule = useCreateModule();
  const createLesson = useCreateLesson();

  const suggestions = isFr ? SUGGESTIONS_FR : SUGGESTIONS_EN;

  const handleCreate = async () => {
    if (!prompt.trim() || !currentOrg || !user) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-course', {
        body: {
          title: prompt.trim(),
          language: isFr ? 'fr' : 'en',
          tier: 'standard',
          module_count: 5,
        },
      });

      if (error) throw error;
      if (data?.error) {
        const err = new Error(data.error);
        (err as any).status = data.status;
        throw err;
      }

      refreshCredits();

      // Create program and apply structure
      const result = await createProgram.mutateAsync({
        organization_id: currentOrg.id,
        title: prompt.trim().slice(0, 100),
        description: prompt.trim(),
        created_by: user.id,
      });

      if (data?.modules) {
        for (let mi = 0; mi < data.modules.length; mi++) {
          const mod = data.modules[mi];
          const modResult = await createModule.mutateAsync({
            program_id: result.id,
            title: mod.title,
            description: mod.description,
            display_order: mi,
          });
          for (let li = 0; li < (mod.lessons || []).length; li++) {
            const lesson = mod.lessons[li];
            await createLesson.mutateAsync({
              module_id: modResult.id,
              title: lesson.title,
              content_type: lesson.content_type || 'text',
              duration_minutes: lesson.duration_minutes,
              display_order: li,
              programId: result.id,
            });
          }
        }
      }

      toast({ title: isFr ? '✅ Cours créé avec l\'IA !' : '✅ Course created with AI!' });
      onOpenChange(false);
      setPrompt('');
      onCreated(result.id);
    } catch (err: any) {
      const isCreditError = handleAiError(err);
      if (!isCreditError) {
        toast({ title: isFr ? 'Erreur' : 'Error', description: err.message, variant: 'destructive' });
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {isFr ? 'Créer avec l\'IA' : 'Create with AI'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {isFr
              ? 'Utilisez l\'IA pour générer du contenu de formation en quelques secondes.'
              : 'Use AI to generate training content in seconds.'}
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={isFr ? 'Décrivez ce que vous souhaitez créer...' : 'Describe what you\'d like to create...'}
            rows={4}
            className="resize-none"
            disabled={generating}
          />

          {/* Suggestion chips */}
          <div className="grid grid-cols-2 gap-2">
            {suggestions.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(s.text)}
                  disabled={generating}
                  className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 text-left transition-colors group"
                >
                  <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">{s.text}</span>
                  <Plus className="h-3 w-3 text-muted-foreground/50 shrink-0 mt-0.5 ml-auto" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button type="button" className="text-xs text-primary hover:underline">
            {isFr ? 'Comment ça marche ?' : 'How does this work?'}
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
              {isFr ? 'Annuler' : 'Cancel'}
            </Button>
            <Button onClick={handleCreate} disabled={!prompt.trim() || generating} className="gap-1.5">
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {generating ? (isFr ? 'Création...' : 'Creating...') : (isFr ? 'Créer' : 'Create')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
