import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, XCircle, HelpCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface QuizWidgetProps {
  lessonId: string;
  onComplete?: (passed: boolean) => void;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: { text: string; is_correct: boolean }[];
  explanation?: string;
  order_index: number;
}

export function QuizWidget({ lessonId, onComplete }: QuizWidgetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const { data: questions = [] } = useQuery({
    queryKey: ['quiz-questions', lessonId],
    queryFn: async () => {
      const { data } = await db
        .from('quiz_questions')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index');
      return (data || []) as QuizQuestion[];
    },
    enabled: !!lessonId,
  });

  const { data: bestAttempt } = useQuery({
    queryKey: ['quiz-best-attempt', lessonId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await db
        .from('quiz_attempts')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('user_id', user.id)
        .order('score', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!lessonId,
  });

  const submitAttempt = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      let score = 0;
      const answerDetails: any[] = [];
      for (const q of questions) {
        const selectedIdx = answers[q.id];
        const isCorrect = selectedIdx !== undefined && q.options[selectedIdx]?.is_correct;
        if (isCorrect) score++;
        answerDetails.push({ question_id: q.id, selected: selectedIdx, correct: isCorrect });
      }
      const total = questions.length;
      const passed = total > 0 && score / total >= 0.7;

      const { error } = await db.from('quiz_attempts').insert({
        user_id: user.id,
        lesson_id: lessonId,
        score,
        total,
        answers: answerDetails,
        passed,
      });
      if (error) throw error;
      return { score, total, passed };
    },
    onSuccess: (result) => {
      setSubmitted(true);
      qc.invalidateQueries({ queryKey: ['quiz-best-attempt', lessonId] });
      if (result.passed) {
        toast({ title: `🎉 ${result.score}/${result.total} — Réussi !` });
        onComplete?.(true);
      } else {
        toast({ title: `${result.score}/${result.total} — Essayez encore`, variant: 'destructive' });
        onComplete?.(false);
      }
    },
  });

  if (questions.length === 0) return null;

  const q = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;
  const selectedAnswer = answers[q?.id];

  const handleRetry = () => {
    setAnswers({});
    setCurrentIdx(0);
    setSubmitted(false);
    setShowExplanation(false);
  };

  if (submitted) {
    const score = questions.reduce((s, qu) => {
      const idx = answers[qu.id];
      return s + (idx !== undefined && qu.options[idx]?.is_correct ? 1 : 0);
    }, 0);
    const passed = score / questions.length >= 0.7;

    return (
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="text-center space-y-2">
          <div className={cn('h-16 w-16 rounded-full mx-auto flex items-center justify-center', passed ? 'bg-primary/10' : 'bg-destructive/10')}>
            {passed ? <CheckCircle className="h-8 w-8 text-primary" /> : <XCircle className="h-8 w-8 text-destructive" />}
          </div>
          <h3 className="font-bold text-lg">{score}/{questions.length}</h3>
          <p className="text-sm text-muted-foreground">
            {passed ? 'Félicitations ! Quiz réussi ✨' : 'Score insuffisant. Il faut 70% pour valider.'}
          </p>
          {bestAttempt && (
            <Badge variant="outline" className="text-[10px]">
              Meilleur score : {bestAttempt.score}/{bestAttempt.total}
            </Badge>
          )}
        </div>
        <Button onClick={handleRetry} variant="outline" className="w-full gap-1.5 text-xs">
          <RotateCcw className="h-3.5 w-3.5" /> Réessayer
        </Button>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">Quiz</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{currentIdx + 1}/{questions.length}</span>
      </div>
      <Progress value={progress} className="h-1.5" />

      <motion.div key={q.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
        <p className="text-sm font-medium">{q.question}</p>
        <div className="space-y-2">
          {q.options.map((opt, oi) => (
            <button
              key={oi}
              onClick={() => {
                setAnswers({ ...answers, [q.id]: oi });
                setShowExplanation(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm text-left transition-all',
                selectedAnswer === oi
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border hover:border-primary/30'
              )}
            >
              {selectedAnswer === oi ? (
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              {opt.text}
            </button>
          ))}
        </div>

        {showExplanation && q.explanation && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">{q.explanation}</p>
        )}
      </motion.div>

      <div className="flex gap-2">
        {currentIdx > 0 && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setCurrentIdx(currentIdx - 1); setShowExplanation(false); }}>
            ← Précédent
          </Button>
        )}
        <div className="flex-1" />
        {currentIdx < questions.length - 1 ? (
          <Button size="sm" className="text-xs" disabled={selectedAnswer === undefined} onClick={() => { setCurrentIdx(currentIdx + 1); setShowExplanation(false); }}>
            Suivant →
          </Button>
        ) : (
          <Button size="sm" className="text-xs" disabled={selectedAnswer === undefined || submitAttempt.isPending} onClick={() => submitAttempt.mutate()}>
            Terminer le quiz
          </Button>
        )}
      </div>
    </div>
  );
}
