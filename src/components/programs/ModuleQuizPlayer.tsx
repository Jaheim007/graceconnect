import { useState, useMemo } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, Star, Trophy, RotateCcw, ChevronRight, Lock, Lightbulb
} from 'lucide-react';
import { useQuizAttempts, useSubmitQuizAttempt } from '@/hooks/useModuleQuiz';

interface ModuleQuizPlayerProps {
  quiz: any;
  moduleTitle: string;
  onComplete: (passed: boolean, score: number, total: number, starsEarned: number) => void;
  gamificationEnabled?: boolean;
}

export function ModuleQuizPlayer({ quiz, moduleTitle, onComplete, gamificationEnabled = true }: ModuleQuizPlayerProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const questions = quiz?.questions || [];
  const passingScore = quiz?.passing_score || 60;
  const maxAttempts = (quiz as any)?.max_attempts;

  const { data: previousAttempts = [] } = useQuizAttempts(quiz?.id);
  const submitAttempt = useSubmitQuizAttempt();

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [fillBlankInput, setFillBlankInput] = useState('');

  const attemptNumber = previousAttempts.length + 1;
  const canRetry = !maxAttempts || attemptNumber <= maxAttempts;
  const alreadyPassed = previousAttempts.some((a: any) => a.passed);

  const question = questions[currentQ];

  const result = useMemo(() => {
    if (!showResult) return null;
    let correct = 0;
    questions.forEach((q: any, i: number) => {
      const answer = answers[i];
      if (q.question_type === 'fill_blank') {
        if (typeof answer === 'string' && q.correct_text && answer.toLowerCase().trim() === q.correct_text.toLowerCase().trim()) {
          correct++;
        }
      } else {
        if (answer === q.correct_index) correct++;
      }
    });
    const percentage = Math.round((correct / questions.length) * 100);
    const passed = percentage >= passingScore;
    const starsEarned = percentage >= 90 ? 3 : percentage >= 70 ? 2 : percentage >= passingScore ? 1 : 0;
    return { correct, total: questions.length, percentage, passed, starsEarned };
  }, [showResult, answers, questions, passingScore]);

  const handleAnswer = (answer: number | string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [currentQ]: answer }));
    setSubmitted(true);
    setShowExplanation(currentQ);

    // Auto-advance after 1.5s
    setTimeout(() => {
      setSubmitted(false);
      setShowExplanation(null);
      if (currentQ < questions.length - 1) {
        setCurrentQ(prev => prev + 1);
        setFillBlankInput('');
      } else {
        setShowResult(true);
      }
    }, 2000);
  };

  const handleSubmitResults = async () => {
    if (!result || !quiz) return;
    try {
      await submitAttempt.mutateAsync({
        quiz_id: quiz.id,
        score: result.percentage,
        passed: result.passed,
        answers: answers as any,
        total_questions: result.total,
        correct_count: result.correct,
        attempt_number: attemptNumber,
      });
    } catch (e) {
      console.error('Failed to save quiz attempt', e);
    }
    onComplete(result.passed, result.correct, result.total, gamificationEnabled ? result.starsEarned : 0);
  };

  const handleRetry = () => {
    setCurrentQ(0);
    setAnswers({});
    setShowResult(false);
    setSubmitted(false);
    setFillBlankInput('');
    setShowExplanation(null);
  };

  if (alreadyPassed) {
    const best = previousAttempts.reduce((b: any, a: any) => (!b || a.score > b.score ? a : b), null);
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
          <Trophy className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold">{isFr ? 'Quiz déjà réussi !' : 'Quiz already passed!'}</h3>
        <p className="text-sm text-muted-foreground">
          {isFr ? `Meilleur score : ${best?.score}%` : `Best score: ${best?.score}%`}
        </p>
        <Button onClick={() => onComplete(true, 0, 0, 0)} className="gap-1.5">
          {isFr ? 'Continuer' : 'Continue'} <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (showResult && result) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            'h-20 w-20 rounded-full flex items-center justify-center',
            result.passed ? 'bg-emerald-100 dark:bg-emerald-950/30' : 'bg-destructive/10'
          )}
        >
          {result.passed ? (
            <Trophy className="h-10 w-10 text-emerald-500" />
          ) : (
            <XCircle className="h-10 w-10 text-destructive" />
          )}
        </motion.div>

        <h3 className="text-xl font-bold">
          {result.passed
            ? (isFr ? 'Quiz réussi ! 🎉' : 'Quiz passed! 🎉')
            : (isFr ? 'Quiz échoué' : 'Quiz failed')}
        </h3>

        <div className="text-3xl font-bold">{result.percentage}%</div>

        <p className="text-sm text-muted-foreground">
          {result.correct}/{result.total} {isFr ? 'bonnes réponses' : 'correct answers'}
          {` • ${isFr ? 'Minimum requis' : 'Required'}: ${passingScore}%`}
        </p>

        {gamificationEnabled && result.starsEarned > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1"
          >
            {Array.from({ length: result.starsEarned }).map((_, i) => (
              <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-sm font-medium ml-1">+{result.starsEarned}</span>
          </motion.div>
        )}

        <div className="flex items-center gap-2 pt-2">
          {result.passed ? (
            <Button onClick={handleSubmitResults} className="gap-1.5">
              {isFr ? 'Continuer' : 'Continue'} <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              {canRetry ? (
                <Button onClick={handleRetry} variant="outline" className="gap-1.5">
                  <RotateCcw className="h-4 w-4" /> {isFr ? 'Réessayer' : 'Retry'}
                </Button>
              ) : (
                <p className="text-xs text-destructive">
                  {isFr ? 'Nombre maximum de tentatives atteint.' : 'Maximum attempts reached.'}
                </p>
              )}
              <Button onClick={handleSubmitResults} variant="ghost" className="text-xs">
                {isFr ? 'Voir les résultats' : 'View results'}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-sm text-muted-foreground">{isFr ? 'Aucune question dans ce quiz.' : 'No questions in this quiz.'}</p>
      </div>
    );
  }

  const isCorrect = (qi: number) => {
    const q = questions[qi];
    const a = answers[qi];
    if (q.question_type === 'fill_blank') {
      return typeof a === 'string' && q.correct_text && a.toLowerCase().trim() === q.correct_text.toLowerCase().trim();
    }
    return a === q.correct_index;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="text-[10px]">
            {isFr ? 'Quiz' : 'Quiz'} — {moduleTitle}
          </Badge>
          <span className="text-xs font-medium">{currentQ + 1}/{questions.length}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="space-y-4"
          >
            <h3 className="text-base font-semibold leading-snug">{question.question}</h3>

            {question.question_type === 'fill_blank' ? (
              <div className="space-y-2">
                <Input
                  value={fillBlankInput}
                  onChange={e => setFillBlankInput(e.target.value)}
                  placeholder={isFr ? 'Tapez votre réponse...' : 'Type your answer...'}
                  className="text-sm"
                  disabled={submitted}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && fillBlankInput.trim() && !submitted) {
                      handleAnswer(fillBlankInput.trim());
                    }
                  }}
                />
                {!submitted && (
                  <Button
                    size="sm"
                    onClick={() => handleAnswer(fillBlankInput.trim())}
                    disabled={!fillBlankInput.trim()}
                    className="w-full"
                  >
                    {isFr ? 'Valider' : 'Submit'}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {(question.question_type === 'true_false'
                  ? [isFr ? 'Vrai' : 'True', isFr ? 'Faux' : 'False']
                  : question.options || []
                ).map((opt: string, i: number) => {
                  const isSelected = answers[currentQ] === i;
                  const isAnswered = submitted;
                  const correct = i === question.correct_index;

                  return (
                    <button
                      key={i}
                      disabled={submitted}
                      onClick={() => handleAnswer(i)}
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm',
                        isAnswered && correct
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                          : isAnswered && isSelected && !correct
                            ? 'border-destructive bg-destructive/5'
                            : isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50 hover:bg-muted/30'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 text-[10px] font-bold',
                          isAnswered && correct ? 'border-emerald-500 bg-emerald-500 text-white' :
                          isAnswered && isSelected && !correct ? 'border-destructive bg-destructive text-white' :
                          'border-muted-foreground/30'
                        )}>
                          {isAnswered && correct ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                           isAnswered && isSelected ? <XCircle className="h-3.5 w-3.5" /> :
                           String.fromCharCode(65 + i)}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Explanation after answer */}
            {showExplanation === currentQ && submitted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'rounded-lg p-3 text-xs',
                  isCorrect(currentQ) ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' : 'bg-destructive/5 text-destructive'
                )}
              >
                <div className="flex items-center gap-2 font-semibold mb-1">
                  {isCorrect(currentQ) ? (
                    <><CheckCircle2 className="h-4 w-4" /> {isFr ? 'Correct !' : 'Correct!'}</>
                  ) : (
                    <><XCircle className="h-4 w-4" /> {isFr ? 'Incorrect' : 'Incorrect'}</>
                  )}
                </div>
                {question.explanation && (
                  <p className="flex items-start gap-1 mt-1 opacity-80">
                    <Lightbulb className="h-3 w-3 shrink-0 mt-0.5" /> {question.explanation}
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
