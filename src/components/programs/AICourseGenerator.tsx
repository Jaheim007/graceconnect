import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { Zap, Loader2, BookOpen, Users, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CourseStructure {
  modules: Array<{
    title: string;
    description?: string;
    lessons: Array<{
      title: string;
      content_type: string;
      duration_minutes: number;
      description?: string;
    }>;
  }>;
}

interface AICourseGeneratorProps {
  onGenerated: (structure: CourseStructure) => void;
  onCancel: () => void;
}

export function AICourseGenerator({ onGenerated, onCancel }: AICourseGeneratorProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { toast } = useToast();
  const { handleAiError, refreshCredits } = useCreditGuard();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState('');
  const [moduleCount, setModuleCount] = useState('5');
  const [tier, setTier] = useState('standard');
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState<'form' | 'generating' | 'preview'>('form');
  const [generatedStructure, setGeneratedStructure] = useState<CourseStructure | null>(null);

  const handleGenerate = async () => {
    if (!title.trim()) return;
    setGenerating(true);
    setStep('generating');

    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-course', {
        body: {
          title: title.trim(),
          description: description.trim() || undefined,
          target_audience: audience.trim() || undefined,
          language: isFr ? 'fr' : 'en',
          tier,
          module_count: parseInt(moduleCount),
        },
      });

      if (error) throw error;
      if (data?.error) {
        const err = new Error(data.error);
        (err as any).status = data.status;
        throw err;
      }

      refreshCredits();

      if (data?.modules) {
        setGeneratedStructure(data);
        setStep('preview');
      } else {
        throw new Error(isFr ? 'Structure invalide' : 'Invalid structure');
      }
    } catch (err: any) {
      const isCreditError = handleAiError(err);
      if (!isCreditError) {
        toast({ title: isFr ? 'Erreur' : 'Error', description: err.message, variant: 'destructive' });
      }
      setStep('form');
    } finally {
      setGenerating(false);
    }
  };

  const handleAccept = () => {
    if (generatedStructure) {
      onGenerated(generatedStructure);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">{isFr ? 'Générer avec l\'IA' : 'Generate with AI'}</h3>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {isFr ? 'Décrivez votre cours et l\'IA créera la structure complète' : 'Describe your course and AI will create the complete structure'}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-4">
            <div>
              <Label className="text-xs">{isFr ? 'Titre du cours *' : 'Course title *'}</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={isFr ? 'Ex: Marketing Digital pour Débutants' : 'E.g.: Digital Marketing for Beginners'} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={isFr ? "Décrivez les objectifs et le contenu souhaité..." : "Describe objectives and desired content..."} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs flex items-center gap-1"><Users className="h-3 w-3" /> {isFr ? 'Public cible' : 'Target audience'}</Label>
                <Input value={audience} onChange={e => setAudience(e.target.value)} placeholder={isFr ? 'Débutants, pros...' : 'Beginners, pros...'} className="h-9" />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1"><Layers className="h-3 w-3" /> {isFr ? 'Nombre de modules' : 'Number of modules'}</Label>
                <Select value={moduleCount} onValueChange={setModuleCount}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[3, 4, 5, 6, 7, 8, 10].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} modules</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">{isFr ? 'Qualité IA' : 'AI Quality'}</Label>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleGenerate} disabled={!title.trim() || generating} className="gap-1.5 flex-1">
                <Zap className="h-3.5 w-3.5" /> {isFr ? 'Générer la structure' : 'Generate structure'}
              </Button>
              <Button variant="outline" onClick={onCancel}>{isFr ? 'Annuler' : 'Cancel'}</Button>
            </div>
          </motion.div>
        )}

        {step === 'generating' && (
          <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-10 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <div>
              <p className="text-sm font-medium">{isFr ? 'L\'IA structure votre cours...' : 'AI is structuring your course...'}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{isFr ? 'Cela peut prendre 15-30 secondes' : 'This may take 15-30 seconds'}</p>
            </div>
          </motion.div>
        )}

        {step === 'preview' && generatedStructure && (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-4">
            <p className="text-xs text-muted-foreground">{isFr ? 'Structure générée — vérifiez et acceptez :' : 'Generated structure — review and accept:'}</p>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {generatedStructure.modules.map((mod, mi) => (
                <div key={mi} className="p-3 rounded-xl border border-border bg-muted/20 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground">M{mi + 1}</span>
                    <span className="text-sm font-semibold">{mod.title}</span>
                  </div>
                  {mod.description && <p className="text-[10px] text-muted-foreground">{mod.description}</p>}
                  <div className="space-y-1 ml-5">
                    {mod.lessons.map((lesson, li) => (
                      <div key={li} className="flex items-center gap-2 text-xs">
                        <span className="text-[9px] font-mono text-muted-foreground w-4">{li + 1}</span>
                        <BookOpen className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="flex-1 truncate">{lesson.title}</span>
                        <span className="text-[9px] text-muted-foreground">{lesson.duration_minutes}min</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleAccept} className="gap-1.5 flex-1">
                <Zap className="h-3.5 w-3.5" /> {isFr ? 'Appliquer cette structure' : 'Apply this structure'}
              </Button>
              <Button variant="outline" onClick={() => setStep('form')}>{isFr ? 'Régénérer' : 'Regenerate'}</Button>
              <Button variant="ghost" onClick={onCancel}>{isFr ? 'Annuler' : 'Cancel'}</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
