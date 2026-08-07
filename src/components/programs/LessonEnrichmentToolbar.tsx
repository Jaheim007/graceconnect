import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n/I18nContext';
import { useToast } from '@/hooks/use-toast';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Loader2, BookOpen, GraduationCap, Dumbbell, Lightbulb, Baby, FileText, ListChecks, Undo2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type EnrichAction = 'expand' | 'case_study' | 'exercise' | 'advanced' | 'simplify' | 'summary' | 'key_takeaways';

interface LessonEnrichmentToolbarProps {
  lessonTitle: string;
  lessonContent: string;
  courseTitle?: string;
  onContentUpdate: (newContent: string, isReplacement: boolean) => void;
}

interface ActionDef {
  key: EnrichAction;
  labelFr: string;
  labelEn: string;
  descFr: string;
  descEn: string;
  icon: typeof Zap;
  color: string;
}

const ACTIONS: ActionDef[] = [
  {
    key: 'expand',
    labelFr: 'Approfondir',
    labelEn: 'Expand',
    descFr: 'Enrichir et approfondir le contenu existant',
    descEn: 'Enrich and deepen existing content',
    icon: BookOpen,
    color: 'text-blue-500',
  },
  {
    key: 'case_study',
    labelFr: 'Étude de cas',
    labelEn: 'Case Study',
    descFr: 'Ajouter une étude de cas concrète',
    descEn: 'Add a concrete case study',
    icon: Lightbulb,
    color: 'text-amber-500',
  },
  {
    key: 'exercise',
    labelFr: 'Exercice pratique',
    labelEn: 'Exercise',
    descFr: 'Ajouter un exercice pratique guidé',
    descEn: 'Add a guided practical exercise',
    icon: Dumbbell,
    color: 'text-green-500',
  },
  {
    key: 'advanced',
    labelFr: 'Insights expert',
    labelEn: 'Expert Insights',
    descFr: 'Ajouter du contenu de niveau expert',
    descEn: 'Add expert-level content',
    icon: GraduationCap,
    color: 'text-purple-500',
  },
  {
    key: 'simplify',
    labelFr: 'Simplifier',
    labelEn: 'Simplify',
    descFr: 'Réécrire pour les débutants',
    descEn: 'Rewrite for beginners',
    icon: Baby,
    color: 'text-pink-500',
  },
  {
    key: 'summary',
    labelFr: 'Résumé',
    labelEn: 'Summary',
    descFr: 'Ajouter un résumé structuré',
    descEn: 'Add a structured summary',
    icon: FileText,
    color: 'text-teal-500',
  },
  {
    key: 'key_takeaways',
    labelFr: 'Aide-mémoire',
    labelEn: 'Cheat Sheet',
    descFr: 'Ajouter un aide-mémoire et FAQ',
    descEn: 'Add a cheat sheet and FAQ',
    icon: ListChecks,
    color: 'text-orange-500',
  },
];

export function LessonEnrichmentToolbar({
  lessonTitle,
  lessonContent,
  courseTitle,
  onContentUpdate,
}: LessonEnrichmentToolbarProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { toast } = useToast();
  const { handleAiError, refreshCredits } = useCreditGuard();

  const [enriching, setEnriching] = useState<EnrichAction | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [previousContent, setPreviousContent] = useState<string | null>(null);

  const handleEnrich = async (action: EnrichAction) => {
    if (!lessonContent?.trim()) {
      toast({
        title: isFr ? 'Contenu requis' : 'Content required',
        description: isFr ? 'La leçon doit avoir du contenu avant enrichissement.' : 'Lesson must have content before enrichment.',
        variant: 'destructive',
      });
      return;
    }

    setEnriching(action);
    setPreviousContent(lessonContent);

    try {
      const { data, error } = await supabase.functions.invoke('ai-enrich-lesson', {
        body: {
          lesson_title: lessonTitle,
          lesson_content: lessonContent,
          course_title: courseTitle,
          action,
          language: isFr ? 'fr' : 'en',
          tier: 'standard',
        },
      });

      if (error) throw error;
      if (data?.error) {
        const err = new Error(data.error);
        (err as any).status = data.status;
        throw err;
      }

      refreshCredits();

      if (data?.enriched_content) {
        onContentUpdate(data.enriched_content, data.is_replacement);
        const actionDef = ACTIONS.find(a => a.key === action);
        toast({
          title: isFr ? 'Leçon enrichie' : 'Lesson enriched',
          description: isFr
            ? `"${actionDef?.labelFr}" appliqué avec succès`
            : `"${actionDef?.labelEn}" applied successfully`,
        });
      }
    } catch (err: any) {
      const isCreditError = handleAiError(err);
      if (!isCreditError) {
        toast({
          title: isFr ? 'Erreur' : 'Error',
          description: err.message,
          variant: 'destructive',
        });
      }
    } finally {
      setEnriching(null);
    }
  };

  const handleUndo = () => {
    if (previousContent) {
      onContentUpdate(previousContent, true);
      setPreviousContent(null);
      toast({ title: isFr ? '↩️ Contenu restauré' : '↩️ Content restored' });
    }
  };

  const hasContent = !!lessonContent?.trim();

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="text-left">
            <span className="text-xs font-semibold">
              {isFr ? 'Enrichissement IA' : 'AI Enrichment'}
            </span>
            <Badge variant="secondary" className="text-[8px] ml-1.5 py-0">
              {ACTIONS.length} {isFr ? 'actions' : 'actions'}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {previousContent && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                handleUndo();
              }}
            >
              <Undo2 className="h-3 w-3" />
            </Button>
          )}
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>

      {/* Actions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 grid grid-cols-1 gap-1.5">
              {ACTIONS.map((action) => {
                const Icon = action.icon;
                const isActive = enriching === action.key;
                const isDisabled = enriching !== null || !hasContent;

                return (
                  <button
                    key={action.key}
                    onClick={() => handleEnrich(action.key)}
                    disabled={isDisabled}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed group"
                  >
                    <div className={`h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors`}>
                      {isActive ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : (
                        <Icon className={`h-3.5 w-3.5 ${action.color}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-tight">
                        {isFr ? action.labelFr : action.labelEn}
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-tight truncate">
                        {isFr ? action.descFr : action.descEn}
                      </p>
                    </div>
                    {isActive && (
                      <Badge variant="outline" className="text-[8px] shrink-0 animate-pulse">
                        {isFr ? 'En cours...' : 'Working...'}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
            {!hasContent && (
              <p className="text-[10px] text-muted-foreground text-center pb-3 px-3">
                {isFr ? 'Ajoutez du contenu à la leçon avant d\'utiliser l\'enrichissement IA.' : 'Add content to the lesson before using AI enrichment.'}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
