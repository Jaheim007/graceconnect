/**
 * Completion rules for an AI course draft.
 *
 * Plain-language settings written for a non-technical creator:
 *  - Default score to pass a lesson quiz + how many retries
 *  - Per-lesson override (lesson 1 can ask 50%, lesson 2 can ask 80%)
 *  - Unlock lessons one by one
 *  - Show points to the learner
 *  - Certificate at the end (only meaningful if a score is required)
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { GraduationCap, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import type { CourseRules, LessonRule } from '@/hooks/useCourseDraft';

interface Props {
  rules: CourseRules;
  lessons: { title: string }[];
  onChange: (patch: CourseRules) => void;
}

const ATTEMPT_OPTIONS = [1, 2, 3, 5, 10];

export function CourseCompletionRules({ rules, lessons, onChange }: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [openPerLesson, setOpenPerLesson] = useState(false);

  const passing = rules.passing_score ?? 70;
  const attempts = rules.max_quiz_attempts ?? 3;
  const lessonRules = rules.lesson_rules || {};

  const setLessonRule = (index: number, patch: LessonRule | null) => {
    const next = { ...lessonRules };
    if (patch === null) delete next[String(index)];
    else next[String(index)] = { ...(next[String(index)] || {}), ...patch };
    onChange({ lesson_rules: next });
  };

  const customCount = Object.keys(lessonRules).length;

  return (
    <div className="rounded-xl border border-border bg-card p-3.5 space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">{isFr ? 'Règles de réussite' : 'Completion rules'}</p>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {isFr
            ? 'Chaque leçon se termine par un quiz. Les cartes mémo au milieu de la leçon servent à réviser et montrent la réponse ; le quiz final ne montre jamais les réponses, l’apprenant voit seulement son score à la fin.'
            : 'Every lesson ends with a quiz. The flashcards inside the lesson are for revision and do show the answer; the final quiz never reveals answers — the learner only sees their score at the end.'}
        </p>
      </div>

      {/* Default score */}
      <div className="space-y-2 rounded-lg border border-border p-3">
        <div className="flex items-center justify-between">
          <Label className="text-[12px]">
            {isFr ? 'Score à obtenir pour valider une leçon (par défaut)' : 'Score needed to pass a lesson (default)'}
          </Label>
          <span className="text-[12px] font-semibold">{passing}%</span>
        </div>
        <Slider
          value={[passing]}
          min={0}
          max={100}
          step={5}
          onValueChange={([v]) => onChange({ passing_score: v })}
          aria-label={isFr ? 'Score requis' : 'Required score'}
        />
        <p className="text-[11px] text-muted-foreground">
          {passing === 0
            ? (isFr ? 'Aucun score requis : le quiz reste informatif.' : 'No score required: the quiz stays informative.')
            : (isFr
                ? `En dessous de ${passing}%, l’apprenant doit refaire le quiz de la leçon.`
                : `Below ${passing}%, the learner has to retake that lesson's quiz.`)}
        </p>

        <div className="pt-1">
          <Label className="text-[12px]">{isFr ? 'Nombre d’essais autorisés par quiz' : 'Retries allowed per quiz'}</Label>
          <Select value={String(attempts)} onValueChange={(v) => onChange({ max_quiz_attempts: Number(v) })}>
            <SelectTrigger className="h-9 mt-1.5 max-w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ATTEMPT_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} {isFr ? (n > 1 ? 'essais' : 'essai') : (n > 1 ? 'attempts' : 'attempt')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Per-lesson overrides */}
      <div className="rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setOpenPerLesson((o) => !o)}
          className="flex w-full items-center justify-between gap-2 p-3 text-left"
        >
          <div>
            <p className="text-[12px] font-medium">
              {isFr ? 'Régler leçon par leçon (optionnel)' : 'Set it lesson by lesson (optional)'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {customCount > 0
                ? (isFr ? `${customCount} leçon(s) avec des règles personnalisées` : `${customCount} lesson(s) with custom rules`)
                : (isFr ? 'Toutes les leçons suivent la règle par défaut' : 'All lessons follow the default rule')}
            </p>
          </div>
          {openPerLesson ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {openPerLesson && (
          <div className="border-t border-border divide-y divide-border">
            {lessons.length === 0 && (
              <p className="p-3 text-[11px] text-muted-foreground">
                {isFr ? 'Aucune leçon pour le moment.' : 'No lessons yet.'}
              </p>
            )}
            {lessons.map((l, i) => {
              const rule = lessonRules[String(i)];
              const score = rule?.passing_score ?? passing;
              const tries = rule?.max_attempts ?? attempts;
              return (
                <div key={i} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12px] font-medium leading-tight line-clamp-1">{i + 1}. {l.title}</p>
                    {rule && (
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px]" onClick={() => setLessonRule(i, null)}>
                        <RotateCcw className="h-3 w-3" />
                        {isFr ? 'Par défaut' : 'Default'}
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] text-muted-foreground">{isFr ? 'Score requis' : 'Required score'}</Label>
                        <span className={cn('text-[11px] font-semibold', rule?.passing_score != null && 'text-primary')}>{score}%</span>
                      </div>
                      <Slider
                        value={[score]}
                        min={0}
                        max={100}
                        step={5}
                        onValueChange={([v]) => setLessonRule(i, { passing_score: v })}
                        aria-label={`${isFr ? 'Score requis leçon' : 'Required score lesson'} ${i + 1}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">{isFr ? 'Essais' : 'Attempts'}</Label>
                      <Select value={String(tries)} onValueChange={(v) => setLessonRule(i, { max_attempts: Number(v) })}>
                        <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ATTEMPT_OPTIONS.map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n} {isFr ? (n > 1 ? 'essais' : 'essai') : (n > 1 ? 'attempts' : 'attempt')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Behaviour switches, each with a plain explanation */}
      <div className="space-y-2.5">
        <RuleSwitch
          id="rule-sequential"
          label={isFr ? 'Débloquer les leçons une par une' : 'Unlock lessons one by one'}
          help={isFr
            ? 'L’apprenant doit terminer la leçon 1 avant d’ouvrir la leçon 2. Désactivé, il peut aller où il veut.'
            : 'The learner must finish lesson 1 before opening lesson 2. Turned off, they can jump anywhere.'}
          checked={rules.require_sequential_lessons !== false}
          onChange={(v) => onChange({ require_sequential_lessons: v })}
        />
        <RuleSwitch
          id="rule-gamification"
          label={isFr ? 'Afficher les points gagnés' : 'Show the points earned'}
          help={isFr
            ? 'L’apprenant gagne des points en répondant correctement et voit son total à la fin de chaque leçon. Purement motivant : cela ne change pas la réussite.'
            : 'The learner earns points for correct answers and sees the total at the end of each lesson. Purely motivational: it does not affect passing.'}
          checked={rules.gamification_enabled !== false}
          onChange={(v) => onChange({ gamification_enabled: v })}
        />
        <RuleSwitch
          id="rule-certificate"
          label={isFr ? 'Délivrer un certificat à la fin' : 'Issue a certificate at the end'}
          help={isFr
            ? 'Le certificat est envoyé automatiquement quand toutes les leçons sont validées avec le score demandé.'
            : 'The certificate is issued automatically once every lesson is passed with the required score.'}
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
