import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n/I18nContext';
import { useToast } from '@/hooks/use-toast';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sparkles, Loader2, AlertTriangle, CheckCircle2, TrendingUp,
  BookOpen, Zap, Brain, Target, BarChart3, ChevronDown, ChevronUp,
  ArrowRight, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Analysis engine (pure client-side) ───

interface ModuleData {
  id: string;
  title: string;
  lessons: LessonData[];
}

interface LessonData {
  id: string;
  title: string;
  content?: string;
  duration_minutes?: number;
}

interface LessonIssue {
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  type: 'shallow' | 'no_example' | 'no_exercise' | 'no_quiz' | 'too_short' | 'missing_takeaways';
  severity: 'critical' | 'warning' | 'info';
  labelFr: string;
  labelEn: string;
  suggestedAction: string;
}

interface CourseAnalysis {
  totalWords: number;
  totalLessons: number;
  totalModules: number;
  avgWordsPerLesson: number;
  depthScore: number; // 0-100
  engagementScore: number; // 0-100
  overallScore: number; // 0-100
  grade: 'elite' | 'strong' | 'average' | 'weak';
  issues: LessonIssue[];
  strengths: string[];
}

function stripHtml(html: string): string {
  return html?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '';
}

function countWords(html: string): number {
  const text = stripHtml(html);
  return text ? text.split(/\s+/).filter(w => w.length > 1).length : 0;
}

function analyzeCourse(modules: ModuleData[], isFr: boolean): CourseAnalysis {
  const issues: LessonIssue[] = [];
  const strengths: string[] = [];
  let totalWords = 0;
  let totalLessons = 0;
  let lessonsWithExamples = 0;
  let lessonsWithExercises = 0;
  let lessonsWithQuizzes = 0;
  let lessonsWithTakeaways = 0;

  for (const mod of modules) {
    for (const lesson of mod.lessons) {
      totalLessons++;
      const content = lesson.content || '';
      const words = countWords(content);
      totalWords += words;
      const lowerContent = content.toLowerCase();

      // Check for examples
      const hasExample = /exemple|example|cas pratique|case study|étude de cas|📋/i.test(content);
      if (hasExample) lessonsWithExamples++;
      else if (words > 50) {
        issues.push({
          lessonId: lesson.id, lessonTitle: lesson.title, moduleTitle: mod.title,
          type: 'no_example', severity: 'warning',
          labelFr: 'Pas d\'exemple concret', labelEn: 'No concrete example',
          suggestedAction: 'case_study',
        });
      }

      // Check for exercises
      const hasExercise = /exercice|exercise|🏋️|pratique.*exerc/i.test(content);
      if (hasExercise) lessonsWithExercises++;

      // Check for quizzes
      const hasQuiz = /QUIZ:|quiz|questionnaire/i.test(content);
      if (hasQuiz) lessonsWithQuizzes++;

      // Check for key takeaways
      const hasTakeaways = /points clés|key takeaways|🔑|aide-mémoire|cheat sheet/i.test(content);
      if (hasTakeaways) lessonsWithTakeaways++;
      else if (words > 100) {
        issues.push({
          lessonId: lesson.id, lessonTitle: lesson.title, moduleTitle: mod.title,
          type: 'missing_takeaways', severity: 'info',
          labelFr: 'Pas de résumé/points clés', labelEn: 'No summary/key takeaways',
          suggestedAction: 'key_takeaways',
        });
      }

      // Check depth
      if (words < 200 && words > 10) {
        issues.push({
          lessonId: lesson.id, lessonTitle: lesson.title, moduleTitle: mod.title,
          type: 'shallow', severity: 'critical',
          labelFr: `Contenu trop léger (${words} mots)`, labelEn: `Content too shallow (${words} words)`,
          suggestedAction: 'expand',
        });
      } else if (words < 400 && words >= 200) {
        issues.push({
          lessonId: lesson.id, lessonTitle: lesson.title, moduleTitle: mod.title,
          type: 'too_short', severity: 'warning',
          labelFr: `Contenu court (${words} mots)`, labelEn: `Short content (${words} words)`,
          suggestedAction: 'expand',
        });
      }
    }
  }

  const avgWords = totalLessons > 0 ? Math.round(totalWords / totalLessons) : 0;

  // Depth score: based on word count
  const depthScore = Math.min(100, Math.round(
    (avgWords >= 1000 ? 100 : avgWords >= 600 ? 80 : avgWords >= 400 ? 60 : avgWords >= 200 ? 40 : 20)
  ));

  // Engagement score: based on interactive elements
  const exampleRate = totalLessons > 0 ? lessonsWithExamples / totalLessons : 0;
  const exerciseRate = totalLessons > 0 ? lessonsWithExercises / totalLessons : 0;
  const quizRate = totalLessons > 0 ? lessonsWithQuizzes / totalLessons : 0;
  const takeawayRate = totalLessons > 0 ? lessonsWithTakeaways / totalLessons : 0;
  const engagementScore = Math.min(100, Math.round(
    (exampleRate * 30) + (exerciseRate * 25) + (quizRate * 25) + (takeawayRate * 20)
  ));

  const overallScore = Math.round(depthScore * 0.5 + engagementScore * 0.3 + Math.min(100, totalLessons * 7) * 0.2);

  const grade: CourseAnalysis['grade'] =
    overallScore >= 80 ? 'elite' : overallScore >= 60 ? 'strong' : overallScore >= 40 ? 'average' : 'weak';

  // Strengths
  if (avgWords >= 600) strengths.push(isFr ? 'Contenu détaillé et approfondi' : 'Detailed and in-depth content');
  if (exampleRate >= 0.7) strengths.push(isFr ? 'Riche en exemples concrets' : 'Rich in concrete examples');
  if (quizRate >= 0.5) strengths.push(isFr ? 'Bon engagement interactif' : 'Good interactive engagement');
  if (modules.length >= 4) strengths.push(isFr ? 'Structure modulaire complète' : 'Complete modular structure');
  if (totalLessons >= 10) strengths.push(isFr ? 'Volume de contenu substantiel' : 'Substantial content volume');

  return {
    totalWords, totalLessons, totalModules: modules.length,
    avgWordsPerLesson: avgWords, depthScore, engagementScore, overallScore, grade,
    issues, strengths,
  };
}

// ─── Component ───

interface CourseIntelligencePanelProps {
  modules: ModuleData[];
  courseTitle: string;
  programId: string;
  onLessonSelect: (lessonId: string) => void;
  onRefresh: () => void;
}

const GRADE_CONFIG = {
  elite: { color: 'text-green-500', bg: 'bg-green-500/10', labelFr: 'Élite', labelEn: 'Elite', icon: '🔥' },
  strong: { color: 'text-blue-500', bg: 'bg-blue-500/10', labelFr: 'Solide', labelEn: 'Strong', icon: '💪' },
  average: { color: 'text-amber-500', bg: 'bg-amber-500/10', labelFr: 'Moyen', labelEn: 'Average', icon: '⚠️' },
  weak: { color: 'text-red-500', bg: 'bg-red-500/10', labelFr: 'Faible', labelEn: 'Weak', icon: '🔴' },
};

const DEPTH_LEVELS = [
  { value: 'beginner', labelFr: 'Débutant', labelEn: 'Beginner' },
  { value: 'intermediate', labelFr: 'Intermédiaire', labelEn: 'Intermediate' },
  { value: 'advanced', labelFr: 'Avancé', labelEn: 'Advanced' },
  { value: 'expert', labelFr: 'Expert', labelEn: 'Expert' },
];

export function CourseIntelligencePanel({
  modules, courseTitle, programId, onLessonSelect, onRefresh,
}: CourseIntelligencePanelProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { toast } = useToast();
  const { handleAiError, refreshCredits } = useCreditGuard();

  const [expanded, setExpanded] = useState(false);
  const [depthLevel, setDepthLevel] = useState('intermediate');
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceProgress, setEnhanceProgress] = useState(0);
  const [showIssues, setShowIssues] = useState(false);

  const analysis = useMemo(() => analyzeCourse(modules, isFr), [modules, isFr]);
  const gradeConf = GRADE_CONFIG[analysis.grade];
  const criticalIssues = analysis.issues.filter(i => i.severity === 'critical');
  const warnings = analysis.issues.filter(i => i.severity === 'warning');

  const handleAutoEnhance = async () => {
    if (analysis.issues.length === 0) {
      toast({ title: isFr ? '✅ Cours déjà optimal' : '✅ Course already optimal' });
      return;
    }

    setEnhancing(true);
    setEnhanceProgress(0);

    // Get unique lessons that need enrichment (prioritize critical issues first)
    const lessonActions = new Map<string, { lessonId: string; action: string; title: string; content: string }>();
    for (const issue of [...criticalIssues, ...warnings]) {
      if (!lessonActions.has(issue.lessonId)) {
        const lesson = modules.flatMap(m => m.lessons).find(l => l.id === issue.lessonId);
        if (lesson) {
          lessonActions.set(issue.lessonId, {
            lessonId: issue.lessonId,
            action: issue.suggestedAction,
            title: lesson.title,
            content: lesson.content || '',
          });
        }
      }
    }

    const actions = Array.from(lessonActions.values());
    let completed = 0;

    try {
      for (const item of actions) {
        try {
          const { data, error } = await supabase.functions.invoke('ai-enrich-lesson', {
            body: {
              lesson_title: item.title,
              lesson_content: item.content,
              course_title: courseTitle,
              action: item.action,
              language: isFr ? 'fr' : 'en',
              tier: 'standard',
              depth_level: depthLevel,
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
            const newContent = data.is_replacement
              ? data.enriched_content
              : (item.content + '\n' + data.enriched_content);

            await supabase.from('program_lessons')
              .update({ content: newContent })
              .eq('id', item.lessonId);
          }

          completed++;
          setEnhanceProgress(Math.round((completed / actions.length) * 100));
        } catch (err: any) {
          if (err?.status === 402 || err?.status === 429) {
            handleAiError(err);
            break;
          }
          console.warn(`[AutoEnhance] Skipping lesson ${item.title}:`, err.message);
          completed++;
          setEnhanceProgress(Math.round((completed / actions.length) * 100));
        }
      }

      onRefresh();
      toast({
        title: isFr ? '✨ Cours amélioré' : '✨ Course enhanced',
        description: isFr
          ? `${completed}/${actions.length} leçons enrichies`
          : `${completed}/${actions.length} lessons enriched`,
      });
    } catch (err: any) {
      handleAiError(err);
    } finally {
      setEnhancing(false);
      setEnhanceProgress(0);
    }
  };

  if (modules.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Compact header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 p-3 hover:bg-muted/30 transition-colors"
      >
        <div className={`h-8 w-8 rounded-lg ${gradeConf.bg} flex items-center justify-center shrink-0`}>
          <span className="text-sm">{gradeConf.icon}</span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold">{isFr ? 'Intelligence du cours' : 'Course Intelligence'}</span>
            <Badge variant="outline" className={`text-[8px] ${gradeConf.color} border-current`}>
              {isFr ? gradeConf.labelFr : gradeConf.labelEn}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {analysis.totalWords.toLocaleString()} {isFr ? 'mots' : 'words'} · {analysis.totalLessons} {isFr ? 'leçons' : 'lessons'}
            {criticalIssues.length > 0 && (
              <span className="text-red-500 ml-1">· {criticalIssues.length} {isFr ? 'problèmes' : 'issues'}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="text-right hidden sm:block">
            <span className={`text-lg font-bold ${gradeConf.color}`}>{analysis.overallScore}</span>
            <span className="text-[9px] text-muted-foreground">/100</span>
          </div>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-3 space-y-3">
              {/* Score bars */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <BookOpen className="h-2.5 w-2.5" /> {isFr ? 'Profondeur' : 'Depth'}
                    </span>
                    <span className="text-[10px] font-semibold">{analysis.depthScore}/100</span>
                  </div>
                  <Progress value={analysis.depthScore} className="h-1.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Zap className="h-2.5 w-2.5" /> {isFr ? 'Engagement' : 'Engagement'}
                    </span>
                    <span className="text-[10px] font-semibold">{analysis.engagementScore}/100</span>
                  </div>
                  <Progress value={analysis.engagementScore} className="h-1.5" />
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: analysis.totalModules, labelFr: 'Modules', labelEn: 'Modules' },
                  { value: analysis.totalLessons, labelFr: 'Leçons', labelEn: 'Lessons' },
                  { value: analysis.avgWordsPerLesson, labelFr: 'Mots/leçon', labelEn: 'Words/lesson' },
                  { value: `${Math.round(analysis.totalWords / 200)}m`, labelFr: 'Lecture', labelEn: 'Read time' },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-2 rounded-lg bg-muted/30">
                    <p className="text-sm font-bold">{stat.value}</p>
                    <p className="text-[9px] text-muted-foreground">{isFr ? stat.labelFr : stat.labelEn}</p>
                  </div>
                ))}
              </div>

              {/* Strengths */}
              {analysis.strengths.length > 0 && (
                <div className="space-y-1">
                  {analysis.strengths.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] text-green-600">
                      <CheckCircle2 className="h-3 w-3 shrink-0" /> {s}
                    </div>
                  ))}
                </div>
              )}

              {/* Issues toggle */}
              {analysis.issues.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowIssues(!showIssues)}
                    className="flex items-center gap-1.5 text-[10px] text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {criticalIssues.length} {isFr ? 'critiques' : 'critical'}, {warnings.length} {isFr ? 'avertissements' : 'warnings'}
                    {showIssues ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                  </button>

                  <AnimatePresence>
                    {showIssues && (
                      <motion.div
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 space-y-1 max-h-[200px] overflow-y-auto">
                          {analysis.issues.map((issue, i) => (
                            <button
                              key={i}
                              onClick={() => onLessonSelect(issue.lessonId)}
                              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                            >
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                issue.severity === 'critical' ? 'bg-red-500' : issue.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-400'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-medium truncate">{issue.lessonTitle}</p>
                                <p className="text-[9px] text-muted-foreground">{isFr ? issue.labelFr : issue.labelEn}</p>
                              </div>
                              <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Depth control + Auto-enhance */}
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select value={depthLevel} onValueChange={setDepthLevel}>
                      <SelectTrigger className="h-8 text-[11px]">
                        <Brain className="h-3 w-3 mr-1 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPTH_LEVELS.map(l => (
                          <SelectItem key={l.value} value={l.value} className="text-xs">
                            {isFr ? l.labelFr : l.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleAutoEnhance}
                    disabled={enhancing || analysis.issues.length === 0}
                    size="sm"
                    className="gap-1.5 text-xs h-8"
                  >
                    {enhancing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {enhancing
                      ? `${enhanceProgress}%`
                      : isFr ? 'Améliorer tout' : 'Enhance All'}
                  </Button>
                </div>

                {enhancing && (
                  <Progress value={enhanceProgress} className="h-1.5" />
                )}

                <p className="text-[9px] text-muted-foreground text-center">
                  {isFr
                    ? `${analysis.issues.length} améliorations possibles · ~${analysis.issues.length * 2} crédits`
                    : `${analysis.issues.length} improvements available · ~${analysis.issues.length * 2} credits`}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
