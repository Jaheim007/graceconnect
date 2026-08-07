import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Code2, Clock, Eye } from 'lucide-react';
import { useLesson, useUpdateLesson } from '@/hooks/usePrograms';
import { useToast } from '@/hooks/use-toast';

interface LessonSettingsPanelProps {
  lessonId: string;
  programId: string;
  canEdit: boolean;
  isFr: boolean;
  hasSlides: boolean;
  onOpenAdvanced: () => void;
}

/**
 * Lesson-level fields only (title, free preview, duration) — deliberately kept
 * out of the slide editor. Also the entry point to the legacy raw-HTML editor.
 */
export function LessonSettingsPanel({
  lessonId, programId, canEdit, isFr, hasSlides, onOpenAdvanced,
}: LessonSettingsPanelProps) {
  const { data: lesson } = useLesson(lessonId);
  const updateLesson = useUpdateLesson();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [freePreview, setFreePreview] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!lesson) return;
    setTitle((lesson as any).title || '');
    setDuration(String((lesson as any).duration_minutes || ''));
    setFreePreview((lesson as any).is_free_preview || false);
  }, [lesson]);

  const save = async () => {
    setSaving(true);
    try {
      await updateLesson.mutateAsync({
        id: lessonId,
        programId,
        title: title.trim(),
        duration_minutes: duration ? Number(duration) : 0,
        is_free_preview: freePreview,
      });
      toast({ title: isFr ? 'Leçon enregistrée' : 'Lesson saved' });
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{isFr ? 'Réglages de la leçon' : 'Lesson settings'}</h3>
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={save} disabled={!canEdit || saving}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          {isFr ? 'Enregistrer' : 'Save'}
        </Button>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div>
          <Label className="text-xs">{isFr ? 'Titre de la leçon' : 'Lesson title'}</Label>
          <Input
            value={title} disabled={!canEdit}
            onChange={e => setTitle(e.target.value)}
            className="mt-1 h-9 text-xs"
          />
        </div>

        <div>
          <Label className="flex items-center gap-1.5 text-xs">
            <Clock className="h-3 w-3" /> {isFr ? 'Durée (minutes)' : 'Duration (minutes)'}
          </Label>
          <Input
            type="number" min={0} value={duration} disabled={!canEdit}
            onChange={e => setDuration(e.target.value)}
            className="mt-1 h-9 w-32 text-xs"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
          <div className="flex items-start gap-2">
            <Eye className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium">{isFr ? 'Aperçu gratuit' : 'Free preview'}</p>
              <p className="text-[11px] text-muted-foreground">
                {isFr ? 'Visible sans achat ni compte.' : 'Visible without purchase or account.'}
              </p>
            </div>
          </div>
          <Switch checked={freePreview} onCheckedChange={setFreePreview} disabled={!canEdit} />
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-dashed border-border p-4">
        <p className="text-xs font-medium">{isFr ? 'Mode avancé' : 'Advanced mode'}</p>
        <p className="text-[11px] text-muted-foreground">
          {hasSlides
            ? (isFr
              ? 'Cette leçon utilise des diapositives. L’éditeur HTML brut reste disponible pour le contenu hérité.'
              : 'This lesson uses slides. The raw HTML editor stays available for legacy content.')
            : (isFr
              ? 'Cette leçon n’a pas encore de diapositives : elle est lue via son HTML hérité.'
              : 'This lesson has no slides yet: it is played from its legacy HTML.')}
        </p>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onOpenAdvanced}>
          <Code2 className="h-3 w-3" /> {isFr ? 'Éditeur HTML brut' : 'Raw HTML editor'}
        </Button>
      </div>
    </div>
  );
}
