import { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  useModuleQuiz, useCreateModuleQuiz, useUpdateModuleQuiz, useDeleteModuleQuiz,
  useAddQuizQuestion, useUpdateQuizQuestion, useDeleteQuizQuestion,
  useModuleFlashcards, useAddFlashcard, useUpdateFlashcard, useDeleteFlashcard,
} from '@/hooks/useModuleQuiz';
import { supabase } from '@/integrations/supabase/client';
import {
  Plus, Trash2, Save, Sparkles, HelpCircle, Loader2, GripVertical,
  CheckCircle2, XCircle, ChevronDown, ChevronRight, RotateCcw, Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ModuleQuizEditorProps {
  moduleId: string;
  moduleTitle: string;
  programId: string;
  courseTitle: string;
}

interface QuestionForm {
  id?: string;
  question: string;
  question_type: 'mcq' | 'true_false' | 'fill_blank';
  options: string[];
  correct_index: number;
  correct_text: string;
  explanation: string;
}

const emptyQuestion = (): QuestionForm => ({
  question: '',
  question_type: 'mcq',
  options: ['', '', '', ''],
  correct_index: 0,
  correct_text: '',
  explanation: '',
});

export function ModuleQuizEditor({ moduleId, moduleTitle, programId, courseTitle }: ModuleQuizEditorProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { toast } = useToast();

  const { data: quiz, isLoading: loadingQuiz } = useModuleQuiz(moduleId);
  const { data: flashcards = [], isLoading: loadingFlashcards } = useModuleFlashcards(moduleId);

  const createQuiz = useCreateModuleQuiz();
  const updateQuiz = useUpdateModuleQuiz();
  const deleteQuiz = useDeleteModuleQuiz();
  const addQuestion = useAddQuizQuestion();
  const updateQuestion = useUpdateQuizQuestion();
  const deleteQuestion = useDeleteQuizQuestion();
  const addFlashcard = useAddFlashcard();
  const updateFlashcard = useUpdateFlashcard();
  const deleteFlashcard = useDeleteFlashcard();

  const [editingQuestion, setEditingQuestion] = useState<QuestionForm | null>(null);
  const [passPercentage, setPassPercentage] = useState(quiz?.passing_score || 60);
  const [maxAttempts, setMaxAttempts] = useState<number | null>((quiz as any)?.max_attempts || null);
  const [generating, setGenerating] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [quizTier, setQuizTier] = useState<'standard' | 'premium'>('standard');
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [newFlashFront, setNewFlashFront] = useState('');
  const [newFlashBack, setNewFlashBack] = useState('');

  const questions = (quiz as any)?.questions || [];

  const handleCreateQuiz = async () => {
    try {
      await createQuiz.mutateAsync({
        module_id: moduleId,
        title: `${isFr ? 'Quiz' : 'Quiz'} - ${moduleTitle}`,
        passing_score: passPercentage,
        max_attempts: maxAttempts ?? undefined,
      });
      toast({ title: isFr ? '✅ Quiz créé' : '✅ Quiz created' });
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleSaveSettings = async () => {
    if (!quiz) return;
    try {
      await updateQuiz.mutateAsync({
        id: quiz.id,
        moduleId,
        passing_score: passPercentage,
        max_attempts: maxAttempts,
      });
      toast({ title: isFr ? '✅ Paramètres mis à jour' : '✅ Settings updated' });
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion || !quiz) return;
    const { id, question, question_type, options, correct_index, correct_text, explanation } = editingQuestion;

    if (!question.trim()) return;

    try {
      if (id) {
        await updateQuestion.mutateAsync({
          id,
          question,
          question_type,
          options: question_type === 'true_false' ? [isFr ? 'Vrai' : 'True', isFr ? 'Faux' : 'False'] : options.filter(o => o.trim()),
          correct_index,
          correct_text: correct_text || undefined,
          explanation: explanation || undefined,
        });
      } else {
        await addQuestion.mutateAsync({
          quiz_id: quiz.id,
          question,
          question_type,
          options: question_type === 'true_false' ? [isFr ? 'Vrai' : 'True', isFr ? 'Faux' : 'False'] : options.filter(o => o.trim()),
          correct_index,
          correct_text: correct_text || undefined,
          explanation: explanation || undefined,
          display_order: questions.length,
        });
      }
      setEditingQuestion(null);
      toast({ title: isFr ? '✅ Question sauvegardée' : '✅ Question saved' });
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm(isFr ? 'Supprimer cette question ?' : 'Delete this question?')) return;
    try {
      await deleteQuestion.mutateAsync(qId);
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleAIGenerate = async () => {
    if (!quiz) return;
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('ai-generate-module-quiz', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          module_id: moduleId,
          program_id: programId,
          course_title: courseTitle,
          module_title: moduleTitle,
          language: isFr ? 'fr' : 'en',
          tier: quizTier,
          question_count: quizTier === 'premium' ? 18 : 10,
        },
      });

      if (error) throw error;
      toast({ title: isFr ? '✅ Questions générées par l\'IA !' : '✅ AI generated questions!' });
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleAddFlashcard = async () => {
    if (!newFlashFront.trim() || !newFlashBack.trim()) return;
    try {
      await addFlashcard.mutateAsync({
        module_id: moduleId,
        front_text: newFlashFront.trim(),
        back_text: newFlashBack.trim(),
        display_order: flashcards.length,
      });
      setNewFlashFront('');
      setNewFlashBack('');
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleAIGenerateFlashcards = async () => {
    setGeneratingFlashcards(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('ai-generate-module-flashcards', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          module_id: moduleId,
          course_title: courseTitle,
          module_title: moduleTitle,
          language: isFr ? 'fr' : 'en',
          tier: quizTier,
        },
      });

      if (error) throw error;
      toast({ title: isFr ? '✅ Flashcards générées par l\'IA !' : '✅ AI generated flashcards!' });
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  if (loadingQuiz || loadingFlashcards) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="quiz">
        <TabsList className="w-full">
          <TabsTrigger value="quiz" className="flex-1 text-xs gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" />
            Quiz ({questions.length})
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="flex-1 text-xs gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Flashcards ({flashcards.length})
          </TabsTrigger>
        </TabsList>

        {/* ─── QUIZ TAB ─── */}
        <TabsContent value="quiz" className="space-y-4 mt-3">
          {!quiz ? (
            <div className="text-center py-8 space-y-3 bg-card border border-border rounded-xl p-6">
              <HelpCircle className="h-10 w-10 mx-auto text-muted-foreground/30" />
              <p className="text-sm font-medium">{isFr ? 'Aucun quiz pour ce module' : 'No quiz for this module'}</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {isFr
                  ? 'Ajoutez un quiz de fin de module pour évaluer la compréhension des apprenants.'
                  : 'Add an end-of-module quiz to evaluate learner understanding.'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <Button onClick={handleCreateQuiz} className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> {isFr ? 'Créer un quiz' : 'Create quiz'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Quiz settings */}
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-semibold flex items-center gap-2">
                  <HelpCircle className="h-3.5 w-3.5 text-primary" />
                  {isFr ? 'Paramètres du quiz' : 'Quiz settings'}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px]">{isFr ? '% de réussite' : 'Pass %'}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={passPercentage}
                      onChange={e => setPassPercentage(Number(e.target.value))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">{isFr ? 'Tentatives max' : 'Max attempts'}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={maxAttempts || ''}
                      onChange={e => setMaxAttempts(e.target.value ? Number(e.target.value) : null)}
                      placeholder={isFr ? 'Illimité' : 'Unlimited'}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={handleSaveSettings}>
                  <Save className="h-3 w-3" /> {isFr ? 'Enregistrer' : 'Save'}
                </Button>
              </div>

              {/* Questions list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold">
                    {questions.length} {isFr ? 'question' : 'question'}{questions.length !== 1 ? 's' : ''}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="outline" className="text-xs gap-1.5 h-7" onClick={handleAIGenerate} disabled={generating}>
                      {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      {isFr ? 'Générer avec IA' : 'Generate with AI'}
                    </Button>
                    <Button size="sm" className="text-xs gap-1.5 h-7" onClick={() => setEditingQuestion(emptyQuestion())}>
                      <Plus className="h-3 w-3" /> {isFr ? 'Ajouter' : 'Add'}
                    </Button>
                  </div>
                </div>

                <AnimatePresence>
                  {questions.map((q: any, i: number) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="bg-card border border-border rounded-lg overflow-hidden"
                    >
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
                        onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                      >
                        <span className="text-[10px] font-mono text-muted-foreground w-5 shrink-0">Q{i + 1}</span>
                        <span className="text-xs flex-1 truncate">{q.question}</span>
                        <Badge variant="secondary" className="text-[8px] shrink-0">
                          {q.question_type === 'true_false' ? (isFr ? 'V/F' : 'T/F') : q.question_type === 'fill_blank' ? (isFr ? 'Texte' : 'Fill') : 'QCM'}
                        </Badge>
                        {expandedQ === q.id ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                      </button>

                      {expandedQ === q.id && (
                        <div className="px-3 pb-3 border-t border-border pt-2 space-y-2">
                          <div className="space-y-1">
                            {(q.options || []).map((opt: string, oi: number) => (
                              <div key={oi} className={cn(
                                'flex items-center gap-2 text-xs px-2 py-1.5 rounded',
                                oi === q.correct_index ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
                              )}>
                                {oi === q.correct_index ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 shrink-0 opacity-30" />}
                                {opt}
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <p className="text-[10px] text-muted-foreground italic flex items-start gap-1">
                              <Lightbulb className="h-3 w-3 shrink-0 mt-0.5" /> {q.explanation}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 pt-1">
                            <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => {
                              setEditingQuestion({
                                id: q.id,
                                question: q.question,
                                question_type: q.question_type || 'mcq',
                                options: q.options || ['', '', '', ''],
                                correct_index: q.correct_index,
                                correct_text: q.correct_text || '',
                                explanation: q.explanation || '',
                              });
                            }}>
                              {isFr ? 'Modifier' : 'Edit'}
                            </Button>
                            <Button size="sm" variant="ghost" className="text-[10px] h-6 px-2 text-destructive" onClick={() => handleDeleteQuestion(q.id)}>
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {questions.length === 0 && (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    {isFr ? 'Aucune question. Ajoutez-en ou utilisez l\'IA.' : 'No questions. Add some or use AI.'}
                  </div>
                )}
              </div>

              {/* Question editor modal */}
              {editingQuestion && (
                <div className="bg-card border-2 border-primary/20 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold">
                    {editingQuestion.id ? (isFr ? 'Modifier la question' : 'Edit question') : (isFr ? 'Nouvelle question' : 'New question')}
                  </h4>

                  <div>
                    <Label className="text-[10px]">{isFr ? 'Type' : 'Type'}</Label>
                    <Select value={editingQuestion.question_type} onValueChange={(v: any) => setEditingQuestion({ ...editingQuestion, question_type: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">{isFr ? 'Choix multiples (QCM)' : 'Multiple choice (MCQ)'}</SelectItem>
                        <SelectItem value="true_false">{isFr ? 'Vrai / Faux' : 'True / False'}</SelectItem>
                        <SelectItem value="fill_blank">{isFr ? 'Texte à trous' : 'Fill in the blank'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[10px]">{isFr ? 'Question' : 'Question'}</Label>
                    <Textarea
                      value={editingQuestion.question}
                      onChange={e => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                      placeholder={isFr ? 'Tapez votre question...' : 'Type your question...'}
                      className="text-xs min-h-[60px]"
                    />
                  </div>

                  {editingQuestion.question_type === 'mcq' && (
                    <div className="space-y-2">
                      <Label className="text-[10px]">{isFr ? 'Options (cliquez sur la bonne réponse)' : 'Options (click the correct answer)'}</Label>
                      {editingQuestion.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingQuestion({ ...editingQuestion, correct_index: i })}
                            className={cn(
                              'h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                              editingQuestion.correct_index === i
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-border hover:border-primary'
                            )}
                          >
                            {editingQuestion.correct_index === i && <CheckCircle2 className="h-3.5 w-3.5" />}
                          </button>
                          <Input
                            value={opt}
                            onChange={e => {
                              const opts = [...editingQuestion.options];
                              opts[i] = e.target.value;
                              setEditingQuestion({ ...editingQuestion, options: opts });
                            }}
                            placeholder={`${isFr ? 'Option' : 'Option'} ${i + 1}`}
                            className="h-8 text-xs flex-1"
                          />
                          {editingQuestion.options.length > 2 && (
                            <Button
                              variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                              onClick={() => {
                                const opts = editingQuestion.options.filter((_, j) => j !== i);
                                const ci = editingQuestion.correct_index >= opts.length ? 0 : editingQuestion.correct_index;
                                setEditingQuestion({ ...editingQuestion, options: opts, correct_index: ci });
                              }}
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {editingQuestion.options.length < 6 && (
                        <Button variant="ghost" size="sm" className="text-[10px] h-6 gap-1" onClick={() => setEditingQuestion({ ...editingQuestion, options: [...editingQuestion.options, ''] })}>
                          <Plus className="h-2.5 w-2.5" /> {isFr ? 'Ajouter une option' : 'Add option'}
                        </Button>
                      )}
                    </div>
                  )}

                  {editingQuestion.question_type === 'true_false' && (
                    <div className="space-y-2">
                      <Label className="text-[10px]">{isFr ? 'Bonne réponse' : 'Correct answer'}</Label>
                      <div className="flex gap-2">
                        {[isFr ? 'Vrai' : 'True', isFr ? 'Faux' : 'False'].map((label, i) => (
                          <Button
                            key={i}
                            variant={editingQuestion.correct_index === i ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs flex-1"
                            onClick={() => setEditingQuestion({ ...editingQuestion, correct_index: i })}
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {editingQuestion.question_type === 'fill_blank' && (
                    <div>
                      <Label className="text-[10px]">{isFr ? 'Réponse correcte' : 'Correct answer'}</Label>
                      <Input
                        value={editingQuestion.correct_text}
                        onChange={e => setEditingQuestion({ ...editingQuestion, correct_text: e.target.value })}
                        placeholder={isFr ? 'Tapez la bonne réponse...' : 'Type the correct answer...'}
                        className="h-8 text-xs"
                      />
                    </div>
                  )}

                  <div>
                    <Label className="text-[10px]">{isFr ? 'Explication (optionnel)' : 'Explanation (optional)'}</Label>
                    <Textarea
                      value={editingQuestion.explanation}
                      onChange={e => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                      placeholder={isFr ? 'Expliquez la bonne réponse...' : 'Explain the correct answer...'}
                      className="text-xs min-h-[40px]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" className="text-xs gap-1.5" onClick={handleSaveQuestion}>
                      <Save className="h-3 w-3" /> {isFr ? 'Enregistrer' : 'Save'}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => setEditingQuestion(null)}>
                      {isFr ? 'Annuler' : 'Cancel'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ─── FLASHCARDS TAB ─── */}
        <TabsContent value="flashcards" className="space-y-3 mt-3">
          <p className="text-xs text-muted-foreground">
            {isFr
              ? 'Les flashcards aident les apprenants à mémoriser les concepts clés avant le quiz.'
              : 'Flashcards help learners memorize key concepts before the quiz.'}
          </p>

          {flashcards.map((fc: any) => (
            <div key={fc.id} className="bg-card border border-border rounded-lg p-3 space-y-1.5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{fc.front_text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{fc.back_text}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => deleteFlashcard.mutateAsync(fc.id)}>
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
            </div>
          ))}

          <div className="bg-card border border-dashed border-border rounded-lg p-3 space-y-2">
            <Input
              value={newFlashFront}
              onChange={e => setNewFlashFront(e.target.value)}
              placeholder={isFr ? 'Face avant (question/terme)' : 'Front (question/term)'}
              className="h-8 text-xs"
            />
            <Input
              value={newFlashBack}
              onChange={e => setNewFlashBack(e.target.value)}
              placeholder={isFr ? 'Face arrière (réponse/définition)' : 'Back (answer/definition)'}
              className="h-8 text-xs"
            />
            <Button size="sm" className="text-xs gap-1.5 w-full" onClick={handleAddFlashcard} disabled={!newFlashFront.trim() || !newFlashBack.trim()}>
              <Plus className="h-3 w-3" /> {isFr ? 'Ajouter flashcard' : 'Add flashcard'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
