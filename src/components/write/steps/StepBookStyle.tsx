import { useState } from 'react';
import { Sparkles, BookOpen, Church, GraduationCap, Briefcase, Heart, Feather, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import type { WriteState, BookStyle, WritingTone, LanguageLevel, ReligiousTradition } from '../WriteWizard';

export type LandingTonePreset =
  | 'neutral'
  | 'spiritual'
  | 'study_guide'
  | 'business'
  | 'personal_growth'
  | 'story';

interface Preset {
  id: LandingTonePreset;
  icon: typeof BookOpen;
  labelFr: string;
  labelEn: string;
  descFr: string;
  descEn: string;
  patch: {
    style: BookStyle;
    tone: WritingTone;
    religiousTradition?: ReligiousTradition;
  };
}

const PRESETS: Preset[] = [
  {
    id: 'neutral',
    icon: BookOpen,
    labelFr: 'Neutre',
    labelEn: 'Neutral',
    descFr: 'Clair et direct, pour tous les publics',
    descEn: 'Clear and direct, for any reader',
    patch: { style: 'ebook', tone: 'professional' },
  },
  {
    id: 'spiritual',
    icon: Church,
    labelFr: 'Spirituel / Chrétien',
    labelEn: 'Spiritual / Christian',
    descFr: 'Versets, foi, ton pastoral',
    descEn: 'Scripture, faith, pastoral voice',
    patch: { style: 'ebook', tone: 'spiritual', religiousTradition: 'christian' },
  },
  {
    id: 'study_guide',
    icon: GraduationCap,
    labelFr: "Guide d'étude",
    labelEn: 'Study guide',
    descFr: 'Étapes, exercices, questions',
    descEn: 'Steps, exercises, questions',
    patch: { style: 'guide', tone: 'professional' },
  },
  {
    id: 'business',
    icon: Briefcase,
    labelFr: 'Business',
    labelEn: 'Business',
    descFr: 'Méthode, exemples concrets, résultats',
    descEn: 'Method, real examples, results',
    patch: { style: 'ebook', tone: 'professional' },
  },
  {
    id: 'personal_growth',
    icon: Heart,
    labelFr: 'Développement personnel',
    labelEn: 'Personal growth',
    descFr: 'Chaleureux, conversationnel, motivant',
    descEn: 'Warm, conversational, motivating',
    patch: { style: 'ebook', tone: 'conversational' },
  },
  {
    id: 'story',
    icon: Feather,
    labelFr: 'Histoire / Récit',
    labelEn: 'Story / Narrative',
    descFr: 'Scènes, personnages, narration',
    descEn: 'Scenes, characters, narration',
    patch: { style: 'story', tone: 'conversational' },
  },
];

const LEVELS: { id: LanguageLevel; fr: string; en: string }[] = [
  { id: 'simple', fr: 'Simple', en: 'Simple' },
  { id: 'intermediate', fr: 'Standard', en: 'Standard' },
  { id: 'advanced', fr: 'Approfondi', en: 'In-depth' },
];

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
}

/**
 * Shown once, right after a visitor signs in with a book preview generated on the
 * landing page. It only re-tunes the VOICE of the book (tone, framing, reading
 * level) — never the platform type, which stays an explicit choice later on.
 */
export function StepBookStyle({ state, update, onNext }: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [selected, setSelected] = useState<LandingTonePreset>('neutral');
  const [level, setLevel] = useState<LanguageLevel>(state.languageLevel || 'intermediate');

  const confirm = (preset: LandingTonePreset) => {
    const found = PRESETS.find((p) => p.id === preset) || PRESETS[0];
    update({
      ...found.patch,
      religiousTradition: found.patch.religiousTradition,
      languageLevel: level,
      landingTonePreset: found.id,
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {isFr ? 'Dernière étape avant la rédaction' : 'Last step before writing'}
        </div>
        <h2 className="text-2xl sm:text-3xl font-heading font-bold">
          {isFr ? 'Quel style pour ton livre ?' : 'What style for your book?'}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {state.title
            ? (isFr ? `« ${state.title} » — choisis la voix, on écrit tous les chapitres.` : `“${state.title}” — pick the voice, we write every chapter.`)
            : (isFr ? 'Choisis la voix, on écrit tous les chapitres.' : 'Pick the voice, we write every chapter.')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRESETS.map((p) => {
          const Icon = p.icon;
          const active = selected === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              className={`text-left rounded-2xl border p-4 transition-all ${
                active
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-[1.01]'
                  : 'border-border/60 bg-card/50 hover:border-primary/40 hover:bg-card'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`shrink-0 rounded-xl p-2 ${active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{isFr ? p.labelFr : p.labelEn}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{isFr ? p.descFr : p.descEn}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          {isFr ? 'Niveau de lecture' : 'Reading level'}
        </p>
        <div className="flex gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLevel(l.id)}
              className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                level === l.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 text-muted-foreground hover:border-primary/40'
              }`}
            >
              {isFr ? l.fr : l.en}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row-reverse gap-3">
        <Button size="lg" className="flex-1 gap-2" onClick={() => confirm(selected)}>
          {isFr ? 'Générer mon livre' : 'Generate my book'}
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="lg" className="text-muted-foreground" onClick={() => confirm('neutral')}>
          {isFr ? 'Passer (neutre)' : 'Skip (neutral)'}
        </Button>
      </div>
    </div>
  );
}

export default StepBookStyle;
