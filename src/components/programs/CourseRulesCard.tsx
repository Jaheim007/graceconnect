/**
 * Course rules — the step that comes AFTER reviewing the generated lessons.
 *
 * The creator sets the cover (AI-generated with credits, Canva, or a URL) and
 * the completion rules applied at publish time: passing score for the lesson
 * quizzes, how many retries a learner gets, whether lessons unlock in order,
 * stars/gamification, and the certificate.
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { ImageIcon, Loader2, ExternalLink, SlidersHorizontal, Wand2 } from 'lucide-react';
import type { CourseRules } from '@/hooks/useCourseDraft';

interface Props {
  orgId?: string;
  title: string;
  tier?: 'standard' | 'premium';
  rules: CourseRules;
  onChange: (patch: CourseRules) => void;
}

const CANVA_NEW_DESIGN = 'https://www.canva.com/design?create&type=TAEqBrs4Kk4&category=tACZCvjI6Ss';

export function CourseRulesCard({ orgId, title, tier = 'standard', rules, onChange }: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { toast } = useToast();
  const { handleAiError, refreshCredits } = useCreditGuard();
  const [generating, setGenerating] = useState(false);

  const passing = rules.passing_score ?? 70;
  const attempts = rules.max_quiz_attempts ?? 3;

  const generateCover = async () => {
    if (!title.trim()) return;
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('ai-generate-course-cover', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        body: { title, tier, org_id: orgId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      onChange({ cover_image_url: (data as any).url });
      refreshCredits();
      toast({ title: isFr ? 'Couverture générée' : 'Cover generated' });
    } catch (e: any) {
      if (!handleAiError(e)) {
        toast({
          title: isFr ? 'Génération échouée' : 'Generation failed',
          description: e?.message,
          variant: 'destructive',
        });
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3.5 space-y-4">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">{isFr ? 'Règles du cours' : 'Course rules'}</p>
      </div>

      {/* Cover */}
      <div className="space-y-2">
        <Label className="text-[12px]">{isFr ? 'Couverture du cours' : 'Course cover'}</Label>
        <div className="grid gap-3 sm:grid-cols-[200px_1fr] items-start">
          <div className="relative rounded-lg overflow-hidden aspect-[16/9] bg-muted">
            {rules.cover_image_url ? (
              <img src={rules.cover_image_url} alt={isFr ? 'Couverture du cours' : 'Course cover'} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <ImageIcon className="h-6 w-6" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="gap-1.5" onClick={generateCover} disabled={generating}>
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                {isFr ? 'Générer avec l’IA' : 'Generate with AI'}
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" asChild>
                <a href={CANVA_NEW_DESIGN} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Canva
                </a>
              </Button>
            </div>
            <Input
              value={rules.cover_image_url || ''}
              onChange={(e) => onChange({ cover_image_url: e.target.value })}
              placeholder={isFr ? 'ou collez l’URL de votre image (1280×720)' : 'or paste your image URL (1280×720)'}
              className="h-9 text-[12px]"
            />
            <p className="text-[11px] text-muted-foreground">
              {isFr
                ? 'La génération IA consomme des crédits. Format conseillé : 16/9 (1280×720).'
                : 'AI generation uses credits. Recommended format: 16:9 (1280×720).'}
            </p>
          </div>
        </div>
      </div>

      {/* Passing score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[12px]">{isFr ? 'Score requis pour valider une leçon' : 'Score required to pass a lesson'}</Label>
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
          {isFr
            ? 'Le quiz se trouve à la fin de chaque leçon. Les réponses ne sont pas dévoilées pendant le quiz : l’apprenant voit son résultat à la fin.'
            : 'The quiz sits at the end of each lesson. Answers are not revealed during the quiz: the learner sees their result at the end.'}
        </p>
      </div>

      {/* Attempts */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[12px]">{isFr ? 'Tentatives autorisées par leçon' : 'Attempts allowed per lesson'}</Label>
          <Select value={String(attempts)} onValueChange={(v) => onChange({ max_quiz_attempts: Number(v) })}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 5, 10].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} {isFr ? (n > 1 ? 'tentatives' : 'tentative') : (n > 1 ? 'attempts' : 'attempt')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="rule-sequential" className="text-[12px]">
              {isFr ? 'Leçons dans l’ordre' : 'Lessons in order'}
            </Label>
            <Switch
              id="rule-sequential"
              checked={rules.require_sequential_lessons !== false}
              onCheckedChange={(v) => onChange({ require_sequential_lessons: v })}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="rule-gamification" className="text-[12px]">
              {isFr ? 'Points et récompenses' : 'Points and rewards'}
            </Label>
            <Switch
              id="rule-gamification"
              checked={rules.gamification_enabled !== false}
              onCheckedChange={(v) => onChange({ gamification_enabled: v })}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="rule-certificate" className="text-[12px]">
              {isFr ? 'Certificat à la fin' : 'Certificate at the end'}
            </Label>
            <Switch
              id="rule-certificate"
              checked={rules.certificate_enabled !== false}
              onCheckedChange={(v) => onChange({ certificate_enabled: v })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
