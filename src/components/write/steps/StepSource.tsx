import { useState } from 'react';
import { PenLine, FileText, Lightbulb, History, PlusCircle, Clock3, Video, Mic, Camera, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/i18n/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { InsufficientCreditsDialog } from '@/components/credits/InsufficientCreditsDialog';
import type { WriteState, SourceType, SavedWriteDraftSummary } from '../WriteWizard';

const SUGGESTION_KEYS = [
  'write.sug_prayers', 'write.sug_business', 'write.sug_cooking', 'write.sug_health',
  'write.sug_education', 'write.sug_personal', 'write.sug_fiction', 'write.sug_family',
];

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
  savedDrafts: SavedWriteDraftSummary[];
  activeDraftId: string;
  onCreateDraft: () => void;
  onLoadDraft: (draftId: string) => void;
  onDeleteDraft: (draftId: string) => void;
  lastSavedAt: number | null;
}

export function StepSource({
  state,
  update,
  onNext,
  savedDrafts,
  activeDraftId,
  onCreateDraft,
  onLoadDraft,
  onDeleteDraft,
  lastSavedAt,
}: Props) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [transcribing, setTranscribing] = useState(false);
  const [showTranscriptionPreview, setShowTranscriptionPreview] = useState(false);
  const { showCreditDialog, setShowCreditDialog, creditErrorMessage, handleAiError, refreshCredits } = useCreditGuard();

  const sources: { type: SourceType; icon: typeof PenLine; label: string; desc: string }[] = [
    { type: 'idea', icon: Lightbulb, label: t('write.source_idea'), desc: t('write.source_idea_desc') },
    { type: 'document', icon: FileText, label: t('write.source_doc'), desc: t('write.source_doc_desc') },
    { type: 'audio', icon: Mic, label: t('write.source_audio'), desc: t('write.source_audio_desc') },
    { type: 'notes_photo', icon: Camera, label: t('write.source_notes'), desc: t('write.source_notes_desc') },
  ];

  const canContinue = (() => {
    if (transcribing) return false;
    switch (state.source) {
      case 'idea': return state.topic.trim().length >= 3;
      case 'document': return state.uploadedFile !== null || state.topic.trim().length >= 3;
      case 'youtube': return state.topic.trim().length >= 3 || (state.sourceUrl || '').trim().length > 10;
      case 'audio': return state.uploadedFile !== null || state.topic.trim().length >= 3;
      case 'notes_photo': return state.uploadedFile !== null || state.topic.trim().length >= 3;
      default: return false;
    }
  })();

  // Sources that involve transcription (not plain "idea")
  const isTranscriptionSource = state.source !== 'idea';

  // Determine if we need to run transcription before proceeding
  const needsTranscription = (() => {
    // Already transcribed (topic has content) → no need to re-transcribe
    if (state.topic.trim().length >= 3) return false;
    switch (state.source) {
      case 'youtube': return (state.sourceUrl || '').trim().length > 10;
      case 'audio': return state.uploadedFile !== null;
      case 'notes_photo': return state.uploadedFile !== null;
      case 'document': return state.uploadedFile !== null;
      default: return false;
    }
  })();

  // If topic already has transcription content and source is transcription-based,
  // show the preview when user clicks continue (no need to re-transcribe)
  const shouldShowPreviewOnContinue = isTranscriptionSource && state.topic.trim().length >= 3 && !showTranscriptionPreview;

  const uploadAndTranscribe = async (file: File, sourceType: string) => {
    const path = `transcribe/${Date.now()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from('org-uploads').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

    const { data, error } = await supabase.functions.invoke('transcribe-source', {
      body: { source_type: sourceType, storage_path: path },
    });
    if (error || !data?.ok) throw new Error(data?.error || error?.message || 'Transcription failed');
    return data.text as string;
  };

  const handleTranscribeAndNext = async () => {
    // If topic already has content from a previous transcription, show preview
    if (shouldShowPreviewOnContinue) {
      setShowTranscriptionPreview(true);
      return;
    }
    if (!needsTranscription) {
      onNext();
      return;
    }

    setTranscribing(true);
    try {
      let text = '';

      if (state.source === 'youtube') {
        const { data, error } = await supabase.functions.invoke('transcribe-source', {
          body: { source_type: 'youtube', url: state.sourceUrl },
        });
        if (error || !data?.ok) throw new Error(data?.error || 'Transcription failed');
        text = data.text;
      } else if (state.uploadedFile) {
        text = await uploadAndTranscribe(state.uploadedFile, state.source);
      }

      update({ topic: text });
      toast({ title: `✅ ${t('write.transcribe_success')}` });
      setTranscribing(false);
      setShowTranscriptionPreview(true);
    } catch (err: any) {
      console.error('Transcription error:', err);
      setTranscribing(false);
      toast({ title: `❌ ${t('write.transcribe_error')}`, description: err?.message, variant: 'destructive' });
    }
  };

  const handleConfirmTranscription = () => {
    setShowTranscriptionPreview(false);
    onNext();
  };

  const visibleDrafts = savedDrafts.slice(0, 8);

  if (showTranscriptionPreview) {
    return (
      <div className="space-y-6 pt-8">
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            ✅ {t('write.transcription_ready') || 'Transcription terminée'}
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {t('write.transcription_review_desc') || 'Vérifiez et corrigez le texte extrait avant de continuer. L\'IA utilisera ce contenu pour générer votre livre.'}
          </p>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <FileText className="h-4 w-4" />
            {t('write.extracted_content') || 'Contenu extrait'}
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              {state.topic.length} {t('write.characters') || 'caractères'}
            </span>
          </div>
          <Textarea
            value={state.topic}
            onChange={(e) => update({ topic: e.target.value })}
            className="min-h-[200px] sm:min-h-[300px] text-sm resize-y bg-background"
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 h-12"
            onClick={() => setShowTranscriptionPreview(false)}
          >
            ← {t('write.back') || 'Retour'}
          </Button>
          <Button
            size="lg"
            className="flex-1 h-12 gap-2"
            disabled={state.topic.trim().length < 3}
            onClick={handleConfirmTranscription}
          >
            <PenLine className="h-5 w-5" />
            {t('write.confirm_and_continue') || 'Confirmer et continuer'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold">
          ✏️ {t('write.hero')} <span className="text-primary">{t('write.hero_highlight')}</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          {t('write.hero_sub')}
        </p>
      </div>

      {/* Draft manager */}
      <DraftManager
        t={t}
        visibleDrafts={visibleDrafts}
        activeDraftId={activeDraftId}
        onCreateDraft={onCreateDraft}
        onLoadDraft={onLoadDraft}
        onDeleteDraft={onDeleteDraft}
        lastSavedAt={lastSavedAt}
      />

      {/* Source selection */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sources.map((s) => (
          <button
            key={s.type}
            onClick={() => update({ source: s.type })}
            className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-all ${
              state.source === s.type
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border hover:border-primary/30 bg-card'
            }`}
          >
            <s.icon className={`h-5 w-5 sm:h-6 sm:w-6 mb-2 sm:mb-3 ${state.source === s.type ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="font-bold text-xs sm:text-sm">{s.label}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">{s.desc}</p>
          </button>
        ))}
      </div>

      {/* Source-specific inputs */}
      <SourceInput state={state} update={update} t={t} transcribing={transcribing} />

      <Button
        size="lg"
        className="w-full h-14 text-base gap-2"
        disabled={!canContinue || transcribing}
        onClick={needsTranscription || shouldShowPreviewOnContinue ? handleTranscribeAndNext : onNext}
      >
        {transcribing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {t('write.transcribing')}
          </>
        ) : (
          <>
            <PenLine className="h-5 w-5" />
            {t('write.continue')}
          </>
        )}
      </Button>
    </div>
  );
}

/* ---------- Draft Manager Sub-component ---------- */
function DraftManager({ t, visibleDrafts, activeDraftId, onCreateDraft, onLoadDraft, onDeleteDraft, lastSavedAt }: {
  t: (key: string) => string;
  visibleDrafts: SavedWriteDraftSummary[];
  activeDraftId: string;
  onCreateDraft: () => void;
  onLoadDraft: (id: string) => void;
  onDeleteDraft: (id: string) => void;
  lastSavedAt: number | null;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <History className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm font-semibold truncate">{t('write.saved_drafts')}</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onCreateDraft}>
          <PlusCircle className="h-3.5 w-3.5" /> {t('write.new_draft')}
        </Button>
      </div>
      {lastSavedAt && (
        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <Clock3 className="h-3 w-3" />
          <span>{t('write.last_saved')}: {new Date(lastSavedAt).toLocaleTimeString()}</span>
        </div>
      )}
      {visibleDrafts.length > 0 ? (
        <div className="space-y-2">
          {visibleDrafts.map((draft) => (
            <div
              key={draft.id}
              className={`rounded-xl border px-3 py-2 flex items-center gap-2 justify-between ${
                draft.id === activeDraftId ? 'border-primary/40 bg-primary/5' : 'border-border bg-background'
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate flex items-center gap-1.5">
                  {draft.name}
                  {draft.id.startsWith('db:') && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent-foreground font-medium">☁️</span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {new Date(draft.updatedAt).toLocaleString()} · {t('write.step')} {draft.step + 1}/9
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {draft.id === activeDraftId ? (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold whitespace-nowrap">
                    {t('write.current_draft')}
                  </span>
                ) : (
                  <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => onLoadDraft(draft.id)}>
                    {t('write.resume_draft')}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteDraft(draft.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t('write.no_saved_draft')}</p>
      )}
    </div>
  );
}

/* ---------- Source Input Sub-component ---------- */
function SourceInput({ state, update, t, transcribing }: {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  t: (key: string) => string;
  transcribing: boolean;
}) {
  switch (state.source) {
    case 'idea':
      return (
        <div className="space-y-4">
          <Textarea
            value={state.topic}
            onChange={(e) => update({ topic: e.target.value })}
            placeholder={t('write.topic_placeholder')}
            className="min-h-[100px] text-base resize-none"
            autoFocus
          />
          <div>
            <p className="text-xs text-muted-foreground mb-2">{t('write.popular_ideas')}</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTION_KEYS.map((key) => {
                const label = t(key);
                return (
                  <button
                    key={key}
                    onClick={() => update({ topic: label.replace(/^[^\s]+\s/, '') })}
                    className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );

    case 'document':
      return (
        <div className="space-y-3">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-8 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-sm">
              {state.uploadedFile ? state.uploadedFile.name : t('write.upload_click')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t('write.upload_formats')}</p>
            {state.uploadedFile && (
              <p className="text-[11px] text-muted-foreground mt-1">
                {(state.uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            )}
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 18 * 1024 * 1024) {
                    // File size limit for AI processing
                    alert(t('write.file_too_large') || 'File too large (max 18 MB)');
                    return;
                  }
                  update({ uploadedFile: file, title: file.name.replace(/\.[^.]+$/, '') });
                }
              }}
            />
          </label>
          {state.topic.trim().length > 0 && (
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground mb-1">📝 {t('write.transcribe_success')}</p>
              <p className="text-sm line-clamp-4">{state.topic.slice(0, 300)}…</p>
            </div>
          )}
        </div>
      );

    case 'youtube':
      return (
        <div className="space-y-4">
          <Input
            value={state.sourceUrl || ''}
            onChange={(e) => update({ sourceUrl: e.target.value })}
            placeholder={t('write.youtube_placeholder')}
            className="text-base"
            autoFocus
            disabled={transcribing}
          />
          {state.topic.trim().length > 0 && (
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground mb-1">📝 {t('write.transcribe_success')}</p>
              <p className="text-sm line-clamp-4">{state.topic.slice(0, 300)}…</p>
            </div>
          )}
        </div>
      );

    case 'audio':
      return (
        <div className="space-y-3">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-8 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
            <Mic className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-sm">
              {state.uploadedFile ? state.uploadedFile.name : t('write.upload_audio')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t('write.audio_formats')}</p>
            {state.uploadedFile && (
              <p className="text-[11px] text-muted-foreground mt-1">
                {(state.uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            )}
            <input
              type="file"
              accept=".mp3,.wav,.m4a,.ogg,.aac,.flac,.wma"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 18 * 1024 * 1024) {
                    alert(t('write.file_too_large') || 'File too large (max 18 MB)');
                    return;
                  }
                  update({ uploadedFile: file, title: file.name.replace(/\.[^.]+$/, '') });
                }
              }}
            />
          </label>
          {state.topic.trim().length > 0 && (
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground mb-1">📝 {t('write.transcribe_success')}</p>
              <p className="text-sm line-clamp-4">{state.topic.slice(0, 300)}…</p>
            </div>
          )}
        </div>
      );

    case 'notes_photo':
      return (
        <div className="space-y-3">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-8 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
            <Camera className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-sm">
              {state.uploadedFile ? state.uploadedFile.name : t('write.upload_notes')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t('write.notes_formats')}</p>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) update({ uploadedFile: file });
              }}
            />
          </label>
          {state.topic.trim().length > 0 && (
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground mb-1">📝 {t('write.transcribe_success')}</p>
              <p className="text-sm line-clamp-4">{state.topic.slice(0, 300)}…</p>
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}
