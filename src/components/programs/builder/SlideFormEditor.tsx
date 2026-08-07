import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProgramSlideRow, SlideType } from '@/components/programs/lesson-preview/slideAdapters';
import { SLIDE_TYPE_LABELS } from '@/components/programs/lesson-preview/slideAdapters';

export interface SlideDraft {
  slide_type: SlideType;
  title: string;
  body: string;
  media_url: string;
  caption: string;
  duration_seconds: number | null;
  data: Record<string, any>;
}

export function slideToDraft(row: ProgramSlideRow): SlideDraft {
  return {
    slide_type: row.slide_type,
    title: row.title || '',
    body: row.body || '',
    media_url: row.media_url || '',
    caption: row.caption || '',
    duration_seconds: row.duration_seconds ?? null,
    data: { ...(row.data || {}) },
  };
}

interface SlideFormEditorProps {
  slide: ProgramSlideRow;
  draft: SlideDraft;
  onChange: (patch: Partial<SlideDraft>) => void;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
  canEdit: boolean;
  isFr: boolean;
}

const TYPE_OPTIONS: SlideType[] = ['text', 'image', 'video', 'quiz', 'flashcard', 'assessment'];

export function SlideFormEditor({
  slide, draft, onChange, onSave, saving, dirty, canEdit, isFr,
}: SlideFormEditorProps) {
  const data = draft.data || {};
  const setData = (patch: Record<string, any>) => onChange({ data: { ...data, ...patch } });

  const options: string[] = Array.isArray(data.options) ? data.options : ['', ''];
  const correctIndex: number = typeof data.correctIndex === 'number' ? data.correctIndex : 0;

  const disabled = !canEdit;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">
            {isFr ? 'Diapositive' : 'Slide'} · {isFr ? SLIDE_TYPE_LABELS[draft.slide_type].fr : SLIDE_TYPE_LABELS[draft.slide_type].en}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {isFr ? 'Position' : 'Position'} {slide.display_order + 1}
          </p>
        </div>
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={onSave} disabled={disabled || saving || !dirty}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          {isFr ? 'Enregistrer' : 'Save'}
        </Button>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">{isFr ? 'Type' : 'Type'}</Label>
            <Select
              value={draft.slide_type}
              onValueChange={(v) => onChange({ slide_type: v as SlideType })}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map(t => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {isFr ? SLIDE_TYPE_LABELS[t].fr : SLIDE_TYPE_LABELS[t].en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{isFr ? 'Durée estimée (s)' : 'Estimated duration (s)'}</Label>
            <Input
              type="number" min={0} disabled={disabled}
              value={draft.duration_seconds ?? ''}
              onChange={e => onChange({ duration_seconds: e.target.value === '' ? null : Number(e.target.value) })}
              className="mt-1 h-9 text-xs"
            />
          </div>
        </div>

        {/* ── TEXT ── */}
        {draft.slide_type === 'text' && (
          <>
            <div>
              <Label className="text-xs">{isFr ? 'Titre' : 'Heading'}</Label>
              <Input
                value={draft.title} disabled={disabled}
                onChange={e => onChange({ title: e.target.value })}
                placeholder={isFr ? 'Titre de la diapositive' : 'Slide heading'}
                className="mt-1 h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">{isFr ? 'Contenu court' : 'Short content'}</Label>
              <div className="mt-1">
                <RichTextEditor
                  value={draft.body}
                  onChange={html => onChange({ body: html })}
                  placeholder={isFr ? 'Une seule idée par diapositive…' : 'One idea per slide…'}
                />
              </div>
            </div>
          </>
        )}

        {/* ── IMAGE ── */}
        {draft.slide_type === 'image' && (
          <>
            <div>
              <Label className="text-xs">{isFr ? 'Titre' : 'Heading'}</Label>
              <Input
                value={draft.title} disabled={disabled}
                onChange={e => onChange({ title: e.target.value })}
                className="mt-1 h-9 text-xs"
              />
            </div>
            <ImageUploader
              value={draft.media_url}
              onChange={url => onChange({ media_url: url })}
              folder="program-slides"
              label={isFr ? 'Image de la diapositive' : 'Slide image'}
              aspectRatio="video"
            />
            <div>
              <Label className="text-xs">{isFr ? 'Légende' : 'Caption'}</Label>
              <Input
                value={draft.caption} disabled={disabled}
                onChange={e => onChange({ caption: e.target.value })}
                className="mt-1 h-9 text-xs"
              />
            </div>
          </>
        )}

        {/* ── VIDEO ── */}
        {draft.slide_type === 'video' && (
          <>
            <div>
              <Label className="text-xs">{isFr ? 'Titre' : 'Heading'}</Label>
              <Input
                value={draft.title} disabled={disabled}
                onChange={e => onChange({ title: e.target.value })}
                className="mt-1 h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">{isFr ? 'URL de la vidéo (YouTube, Vimeo ou fichier)' : 'Video URL (YouTube, Vimeo or file)'}</Label>
              <Input
                value={draft.media_url} disabled={disabled}
                onChange={e => onChange({ media_url: e.target.value })}
                placeholder="https://…"
                className="mt-1 h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">{isFr ? 'Légende' : 'Caption'}</Label>
              <Input
                value={draft.caption} disabled={disabled}
                onChange={e => onChange({ caption: e.target.value })}
                className="mt-1 h-9 text-xs"
              />
            </div>
          </>
        )}

        {/* ── QUIZ (mcq) ── */}
        {draft.slide_type === 'quiz' && (
          <>
            <div>
              <Label className="text-xs">{isFr ? 'Question' : 'Question'}</Label>
              <Textarea
                value={data.question || ''} disabled={disabled}
                onChange={e => setData({ question: e.target.value })}
                placeholder={isFr ? 'Pose une question claire…' : 'Ask a clear question…'}
                className="mt-1 min-h-[64px] text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">{isFr ? 'Réponses' : 'Answers'}</Label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button" disabled={disabled}
                    onClick={() => setData({ correctIndex: i })}
                    title={isFr ? 'Marquer comme correcte' : 'Mark as correct'}
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors',
                      correctIndex === i
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </button>
                  <Input
                    value={opt} disabled={disabled}
                    onChange={e => {
                      const next = [...options];
                      next[i] = e.target.value;
                      setData({ options: next });
                    }}
                    placeholder={`${isFr ? 'Option' : 'Option'} ${i + 1}`}
                    className="h-9 text-xs"
                  />
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                    disabled={disabled || options.length <= 2}
                    onClick={() => {
                      const next = options.filter((_, j) => j !== i);
                      setData({ options: next, correctIndex: Math.min(correctIndex, next.length - 1) });
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
                disabled={disabled || options.length >= 6}
                onClick={() => setData({ options: [...options, ''] })}
              >
                <Plus className="h-3 w-3" /> {isFr ? 'Ajouter une option' : 'Add option'}
              </Button>
            </div>

            <div>
              <Label className="text-xs">{isFr ? 'Explication' : 'Explanation'}</Label>
              <Textarea
                value={data.explanation || ''} disabled={disabled}
                onChange={e => setData({ explanation: e.target.value })}
                placeholder={isFr ? 'Pourquoi cette réponse est correcte…' : 'Why this answer is correct…'}
                className="mt-1 min-h-[56px] text-xs"
              />
            </div>
          </>
        )}

        {/* ── FLASHCARD ── */}
        {draft.slide_type === 'flashcard' && (
          <>
            <div>
              <Label className="text-xs">{isFr ? 'Recto' : 'Front'}</Label>
              <Textarea
                value={data.front || ''} disabled={disabled}
                onChange={e => setData({ front: e.target.value })}
                className="mt-1 min-h-[56px] text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">{isFr ? 'Verso' : 'Back'}</Label>
              <Textarea
                value={data.back || ''} disabled={disabled}
                onChange={e => setData({ back: e.target.value })}
                className="mt-1 min-h-[56px] text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">{isFr ? 'Indice (optionnel)' : 'Hint (optional)'}</Label>
              <Input
                value={data.hint || ''} disabled={disabled}
                onChange={e => setData({ hint: e.target.value })}
                className="mt-1 h-9 text-xs"
              />
            </div>
          </>
        )}

        {/* ── ASSESSMENT ── */}
        {draft.slide_type === 'assessment' && (
          <p className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
            {isFr
              ? "Cette diapositive déclenche l'évaluation finale du cours. Les questions se gèrent dans « Quiz & Flashcards »."
              : 'This slide triggers the course final assessment. Questions are managed in "Quiz & Flashcards".'}
          </p>
        )}
      </div>

      {!canEdit && (
        <p className="text-[11px] text-muted-foreground">
          {isFr
            ? 'Lecture seule : votre rôle sur cette plateforme ne permet pas de modifier le contenu.'
            : 'Read-only: your role on this platform cannot edit content.'}
        </p>
      )}
    </div>
  );
}

/** Keeps a local draft in sync with the selected slide row */
export function useSlideDraft(slide: ProgramSlideRow | null) {
  const [draft, setDraft] = useState<SlideDraft | null>(slide ? slideToDraft(slide) : null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(slide ? slideToDraft(slide) : null);
    setDirty(false);
  }, [slide?.id]);

  const patch = (p: Partial<SlideDraft>) => {
    setDraft(prev => (prev ? { ...prev, ...p } : prev));
    setDirty(true);
  };

  return { draft, patch, dirty, setDirty };
}
