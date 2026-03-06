import { useEffect, useState, useRef } from 'react';
import { Loader2, CheckCircle, Sparkles } from 'lucide-react';
import type { WriteState } from '../WriteWizard';

const MOTIVATIONAL = [
  '✨ L\'IA structure tes idées…',
  '📝 Rédaction du chapitre en cours…',
  '🎯 Ton livre prend forme…',
  '🔥 Plus que quelques instants…',
  '📖 Mise en page finale…',
  '🚀 Presque prêt !',
];

const CHAPTER_TEMPLATES: Record<string, string[]> = {
  ebook: ['Introduction', 'Chapitre 1 : Les fondamentaux', 'Chapitre 2 : Aller plus loin', 'Chapitre 3 : Mise en pratique', 'Chapitre 4 : Études de cas', 'Chapitre 5 : Stratégies avancées', 'Conclusion'],
  guide: ['Avant de commencer', 'Étape 1 : Préparation', 'Étape 2 : Mise en œuvre', 'Étape 3 : Optimisation', 'Étape 4 : Résultats', 'Ressources complémentaires', 'Prochaines étapes'],
  prayers: ['Ouverture', 'Prière du matin', 'Méditation de gratitude', 'Prière de guérison', 'Prière de protection', 'Prière du soir', 'Bénédiction finale'],
};

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
}

export function StepGenerating({ state, update, onNext }: Props) {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [visibleChapters, setVisibleChapters] = useState<string[]>([]);
  const done = useRef(false);

  const chapters = CHAPTER_TEMPLATES[state.style] || CHAPTER_TEMPLATES.ebook;

  useEffect(() => {
    // Simulate generation progress
    const totalDuration = 6000; // 6 seconds
    const interval = 100;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const pct = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(pct);

      // Show chapters progressively
      const chapterIdx = Math.floor((pct / 100) * chapters.length);
      setVisibleChapters(chapters.slice(0, chapterIdx));

      // Rotate messages
      const mi = Math.floor((pct / 100) * MOTIVATIONAL.length);
      setMsgIndex(Math.min(mi, MOTIVATIONAL.length - 1));

      if (pct >= 100 && !done.current) {
        done.current = true;
        clearInterval(timer);
        update({ chapters });
        setTimeout(onNext, 800);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [chapters, update, onNext]);

  return (
    <div className="space-y-8 pt-16 text-center">
      <div className="space-y-4">
        <div className="h-20 w-20 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center">
          {progress < 100 ? (
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          ) : (
            <CheckCircle className="h-10 w-10 text-primary" />
          )}
        </div>

        <h2 className="text-2xl font-extrabold">
          {progress < 100 ? 'L\'IA écrit ton livre…' : '✅ Livre créé !'}
        </h2>

        <p className="text-sm text-muted-foreground animate-pulse">
          {MOTIVATIONAL[msgIndex]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="max-w-sm mx-auto space-y-2">
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
      </div>

      {/* Chapters appearing */}
      <div className="text-left max-w-sm mx-auto space-y-2">
        {visibleChapters.map((ch, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-left-2 duration-300"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-foreground">{ch}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        « <strong className="text-foreground">{state.title || 'Mon livre'}</strong> » — {state.pageCount} pages
      </p>
    </div>
  );
}
