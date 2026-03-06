import { ArrowLeft, ArrowRight, Edit3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WriteState } from '../WriteWizard';

interface Props {
  state: WriteState;
  onNext: () => void;
  onBack: () => void;
}

export function StepPreview({ state, onNext, onBack }: Props) {
  return (
    <div className="space-y-8 pt-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold">
          ✅ Ton livre est prêt !
        </h2>
        <p className="text-muted-foreground text-sm">Voici un aperçu. Tu pourras le modifier après publication.</p>
      </div>

      {/* Book preview card */}
      <div className="rounded-2xl border-2 border-primary/20 bg-card overflow-hidden">
        {/* Cover mock */}
        <div className="bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 p-8 text-center">
          <div className="max-w-[200px] mx-auto aspect-[3/4] rounded-lg bg-gradient-to-br from-primary to-accent flex flex-col items-center justify-center p-4 shadow-xl">
            <Sparkles className="h-8 w-8 text-primary-foreground/80 mb-3" />
            <h3 className="text-primary-foreground font-extrabold text-sm leading-tight text-center">
              {state.title || 'Mon livre'}
            </h3>
            <p className="text-primary-foreground/60 text-[10px] mt-2">Par toi</p>
          </div>
        </div>

        {/* Table of contents */}
        <div className="p-6 space-y-3">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Sommaire</p>
          {state.chapters.map((ch, i) => (
            <div key={i} className="flex items-center gap-3 text-sm border-b border-border/50 pb-2 last:border-0">
              <span className="text-xs font-bold text-primary w-6">{i + 1}</span>
              <span className="text-foreground">{ch}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <span>📄 {state.pageCount} pages</span>
            <span>·</span>
            <span>📘 {state.style === 'ebook' ? 'Ebook' : state.style === 'guide' ? 'Guide pratique' : 'Livre de prières'}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <Button
          size="lg"
          className="flex-1 h-14 text-base gap-2"
          onClick={onNext}
        >
          ✅ Continuer <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        <Edit3 className="h-3 w-3 inline mr-1" />
        Tu pourras modifier le contenu dans l'éditeur après publication
      </p>
    </div>
  );
}
