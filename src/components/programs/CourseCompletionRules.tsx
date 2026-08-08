/**
 * Completion rules for an AI course draft.
 *
 * The creator makes ONE clear choice first:
 *   1. No score needed (default) — quizzes are there to learn.
 *   2. Same score for every lesson.
 *   3. A different score per lesson.
 *
 * Retries are their own choice, and "unlimited" is a first-class option
 * (stored as 0). Lessons always unlock one after the other — that is the
 * learning model on SiteViral, so it is stated, not offered as a switch.
 */
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { GraduationCap, ListOrdered, Check } from 'lucide-react';
import type { CourseRules, LessonRule, ScoreMode } from '@/hooks/useCourseDraft';

interface Props {
  rules: CourseRules;
  lessons: { title: string }[];
  onChange: (patch: CourseRules) => void;
}

/** 0 = unlimited retries. */
const ATTEMPT_OPTIONS = [0, 1, 2, 3, 5, 10];

function attemptLabel(n: number, isFr: boolean) {
  if (n === 0) return isFr ? 'Essais illimités' : 'Unlimited retries';
  if (n === 1) return isFr ? '1 essai' : '1 attempt';
  return isFr ? `${n} essais` : `${n} attempts`;
}

export function CourseCompletionRules({ rules, lessons, onChange }: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  // Legacy drafts only carried require_score; derive the mode from them.
  const mode: ScoreMode =
    rules.score_mode ?? (rules.require_score ? (rules.lesson_rules && Object.keys(rules.lesson_rules).length ? 'per_lesson' : 'global') : 'none');

  const passing = rules.passing_score ?? 70;
  const attempts = rules.max_quiz_attempts ?? 0;
  const lessonRules = rules.lesson_rules || {};

  const setMode = (m: ScoreMode) => {
    onChange({ score_mode: m, require_score: m !== 'none' });
  };

  const setLessonRule = (index: number, patch: LessonRule | null) => {
    const next = { ...lessonRules };
    if (patch === null) delete next[String(index)];
    else next[String(index)] = { ...(next[String(index)] || {}), ...patch };
    onChange({ lesson_rules: next });
  };

  const MODES: { id: ScoreMode; title: string; help: string }[] = [
    {
      id: 'none',
      title: isFr ? 'Aucun score demandé' : 'No score needed',
      help: isFr
        ? 'L’apprenant fait les quiz pour apprendre et avance librement.'
        : 'The learner takes the quizzes to learn and moves on freely.',
    },
    {
      id: 'global',
      title: isFr ? 'Le même score pour toutes les leçons' : 'The same score for every lesson',
      help: isFr
        ? 'Un seul réglage s’applique à toutes les leçons.'
        : 'One setting applies to the whole course.',
    },
    {
      id: 'per_lesson',
      title: isFr ? 'Un score différent selon la leçon' : 'A different score per lesson',
      help: isFr
        ? 'Vous choisissez leçon par leçon (les autres suivent le réglage par défaut).'
        : 'You choose lesson by lesson (the rest follow the default setting).',
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-3.5 space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">{isFr ? 'Règles de réussite' : 'Completion rules'}</p>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {isFr
            ? 'Chaque leçon se termine par un quiz. Les cartes mémo au milieu de la leçon montrent la réponse ; le quiz final ne la montre jamais, l’apprenant voit seulement son score.'
            : 'Every lesson ends with a quiz. The flashcards inside the lesson do show the answer; the final quiz never does — the learner only sees their score.'}
        </p>
      </div>

      {/* Sequential unlock is the model, not an option */}
      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3">
        <ListOrdered className="h-4 w-4 mt-0.5 text-primary shrink-0" />
        <p className="text-[11px] text-muted-foreground">
          {isFr
            ? 'Les leçons se débloquent une par une : l’apprenant doit terminer la leçon 1 avant d’ouvrir la leçon 2.'
            : 'Lessons unlock one by one: the learner must finish lesson 1 before opening lesson 2.'}
        </p>
      </div>

      {/* Step 1 — one single decision */}
      <div className="space-y-2">
        <p className="text-[12px] font-medium">
          {isFr ? 'Faut-il un score pour passer à la leçon suivante ?' : 'Is a score needed to move to the next lesson?'}
        </p>
        <div className="grid gap-2">
          {MODES.map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                aria-pressed={active}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                  active ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                    active ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40',
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-medium">{m.title}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">{m.help}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2 — the default setting (used by both scored modes) */}
      {mode !== 'none' && (
        <div className="space-y-4 rounded-lg border border-border p-3">
          <p className="text-[12px] font-medium">
            {mode === 'global'
              ? (isFr ? 'Réglage pour toutes les leçons' : 'Setting for every lesson')
              : (isFr ? 'Réglage par défaut' : 'Default setting')}
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[12px]">{isFr ? 'Score à obtenir' : 'Score to reach'}</Label>
              <span className="text-[12px] font-semibold">{passing}%</span>
            </div>
            <Slider
              value={[passing]}
              min={10}
              max={100}
              step={5}
              onValueChange={([v]) => onChange({ passing_score: v })}
              aria-label={isFr ? 'Score requis' : 'Required score'}
            />
          </div>

          <div>
            <Label className="text-[12px]">{isFr ? 'Nombre d’essais' : 'Number of retries'}</Label>
            <Select value={String(attempts)} onValueChange={(v) => onChange({ max_quiz_attempts: Number(v) })}>
              <SelectTrigger className="h-9 mt-1.5 max-w-[240px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ATTEMPT_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>{attemptLabel(n, isFr)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {attempts === 0
                ? (isFr ? 'L’apprenant peut refaire le quiz autant de fois qu’il veut.' : 'The learner can retake the quiz as many times as they want.')
                : (isFr ? `Après ${attempts} essai(s), l’apprenant doit revoir la leçon.` : `After ${attempts} attempt(s), the learner has to review the lesson.`)}
            </p>
          </div>
        </div>
      )}

      {/* Step 3 — per-lesson list, only in per-lesson mode */}
      {mode === 'per_lesson' && (
        <div className="rounded-lg border border-border">
          <div className="border-b border-border p-3">
            <p className="text-[12px] font-medium">{isFr ? 'Leçon par leçon' : 'Lesson by lesson'}</p>
            <p className="text-[11px] text-muted-foreground">
              {isFr
                ? 'Activez une leçon pour lui donner son propre score et ses propres essais.'
                : 'Switch a lesson on to give it its own score and retries.'}
            </p>
          </div>
          <div className="divide-y divide-border">
            {lessons.length === 0 && (
              <p className="p-3 text-[11px] text-muted-foreground">{isFr ? 'Aucune leçon pour le moment.' : 'No lessons yet.'}</p>
            )}
            {lessons.map((l, i) => {
              const rule = lessonRules[String(i)];
              const custom = !!rule;
              const score = rule?.passing_score ?? passing;
              const tries = rule?.max_attempts ?? attempts;
              return (
                <div key={i} className="p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium leading-tight line-clamp-1">{i + 1}. {l.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {custom
                          ? `${score}% · ${attemptLabel(tries, isFr)}`
                          : (isFr ? 'Suit le réglage par défaut' : 'Follows the default setting')}
                      </p>
                    </div>
                    <Switch
                      checked={custom}
                      onCheckedChange={(v) => setLessonRule(i, v ? { passing_score: passing, max_attempts: attempts } : null)}
                      aria-label={`${isFr ? 'Régler la leçon' : 'Customise lesson'} ${i + 1}`}
                    />
                  </div>

                  {custom && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px] text-muted-foreground">{isFr ? 'Score requis' : 'Required score'}</Label>
                          <span className="text-[11px] font-semibold text-primary">{score}%</span>
                        </div>
                        <Slider
                          value={[score]}
                          min={10}
                          max={100}
                          step={5}
                          onValueChange={([v]) => setLessonRule(i, { passing_score: v })}
                          aria-label={`${isFr ? 'Score requis leçon' : 'Required score lesson'} ${i + 1}`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-muted-foreground">{isFr ? 'Essais' : 'Retries'}</Label>
                        <Select value={String(tries)} onValueChange={(v) => setLessonRule(i, { max_attempts: Number(v) })}>
                          <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ATTEMPT_OPTIONS.map((n) => (
                              <SelectItem key={n} value={String(n)}>{attemptLabel(n, isFr)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Extras, each with a plain explanation */}
      <div className="space-y-2.5">
        <RuleSwitch
          id="rule-gamification"
          label={isFr ? 'Afficher les points gagnés' : 'Show the points earned'}
          help={isFr
            ? 'L’apprenant gagne des points en répondant correctement et voit son total à la fin de chaque leçon. Purement motivant.'
            : 'The learner earns points for correct answers and sees the total at the end of each lesson. Purely motivational.'}
          checked={rules.gamification_enabled !== false}
          onChange={(v) => onChange({ gamification_enabled: v })}
        />
        <RuleSwitch
          id="rule-certificate"
          label={isFr ? 'Délivrer un certificat à la fin' : 'Issue a certificate at the end'}
          help={isFr
            ? 'Le certificat est envoyé automatiquement quand toutes les leçons sont terminées.'
            : 'The certificate is issued automatically once every lesson is completed.'}
          checked={rules.certificate_enabled !== false}
          onChange={(v) => onChange({ certificate_enabled: v })}
        />
      </div>
    </div>
  );
}

function RuleSwitch({ id, label, help, checked, onChange }: {
  id: string; label: string; help: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-[12px]">{label}</Label>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{help}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
