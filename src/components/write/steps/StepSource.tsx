import { PenLine, FileText, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { WriteState, SourceType } from '../WriteWizard';

const SUGGESTIONS = [
  '🙏 Prières & Méditations',
  '💼 Business & Entrepreneuriat',
  '🍳 Cuisine & Recettes',
  '💪 Santé & Bien-être',
  '📚 Éducation & Formation',
  '🧠 Développement personnel',
  '✨ Fiction & Romans',
  '👶 Enfants & Famille',
];

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
}

export function StepSource({ state, update, onNext }: Props) {
  const sources: { type: SourceType; icon: typeof PenLine; label: string; desc: string }[] = [
    { type: 'idea', icon: Lightbulb, label: "J'ai une idée", desc: 'Décris ton sujet, l\'IA écrit pour toi' },
    { type: 'document', icon: FileText, label: "J'ai un document", desc: 'Upload PDF, DOCX ou TXT' },
  ];

  const canContinue = state.source === 'idea'
    ? state.topic.trim().length >= 3
    : state.uploadedFile !== null;

  return (
    <div className="space-y-8 pt-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold">
          ✏️ Écris ton livre en <span className="text-primary">5 minutes</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Choisis comment tu veux commencer. L'IA fait le reste.
        </p>
      </div>

      {/* Source selection */}
      <div className="grid grid-cols-2 gap-3">
        {sources.map(s => (
          <button
            key={s.type}
            onClick={() => update({ source: s.type })}
            className={`p-5 rounded-2xl border-2 text-left transition-all ${
              state.source === s.type
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border hover:border-primary/30 bg-card'
            }`}
          >
            <s.icon className={`h-6 w-6 mb-3 ${state.source === s.type ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="font-bold text-sm">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
          </button>
        ))}
      </div>

      {/* Idea input */}
      {state.source === 'idea' && (
        <div className="space-y-4">
          <Textarea
            value={state.topic}
            onChange={e => update({ topic: e.target.value })}
            placeholder="Décris ton sujet… ex: Un guide de 20 recettes africaines faciles pour étudiants"
            className="min-h-[100px] text-base resize-none"
            autoFocus
          />
          <div>
            <p className="text-xs text-muted-foreground mb-2">💡 Idées populaires :</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => update({ topic: s.replace(/^[^\s]+\s/, '') })}
                  className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Document upload */}
      {state.source === 'document' && (
        <div className="space-y-3">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-8 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-sm">
              {state.uploadedFile ? state.uploadedFile.name : 'Clique pour uploader'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">PDF, DOCX ou TXT (max 20 Mo)</p>
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  update({ uploadedFile: file, title: file.name.replace(/\.[^.]+$/, '') });
                }
              }}
            />
          </label>
        </div>
      )}

      <Button
        size="lg"
        className="w-full h-14 text-base gap-2"
        disabled={!canContinue}
        onClick={onNext}
      >
        <PenLine className="h-5 w-5" />
        Continuer
      </Button>
    </div>
  );
}
