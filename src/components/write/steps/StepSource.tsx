import { PenLine, FileText, Lightbulb, History, PlusCircle, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/i18n/I18nContext';
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
  lastSavedAt,
}: Props) {
  const { t } = useI18n();

  const sources: { type: SourceType; icon: typeof PenLine; label: string; desc: string }[] = [
    { type: 'idea', icon: Lightbulb, label: t('write.source_idea'), desc: t('write.source_idea_desc') },
    { type: 'document', icon: FileText, label: t('write.source_doc'), desc: t('write.source_doc_desc') },
  ];

  const canContinue = state.source === 'idea'
    ? state.topic.trim().length >= 3
    : state.uploadedFile !== null;

  const visibleDrafts = savedDrafts.slice(0, 4);

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
                  draft.id === activeDraftId
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-background'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{draft.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {new Date(draft.updatedAt).toLocaleString()} · {t('write.step')} {draft.step + 1}/9
                  </p>
                </div>

                {draft.id === activeDraftId ? (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold whitespace-nowrap">
                    {t('write.current_draft')}
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => onLoadDraft(draft.id)}
                  >
                    {t('write.resume_draft')}
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t('write.no_saved_draft')}</p>
        )}
      </div>

      {/* Source selection */}
      <div className="grid grid-cols-2 gap-3">
        {sources.map((s) => (
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
      )}

      {/* Document upload */}
      {state.source === 'document' && (
        <div className="space-y-3">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-8 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-sm">
              {state.uploadedFile ? state.uploadedFile.name : t('write.upload_click')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t('write.upload_formats')}</p>
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
              onChange={(e) => {
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
        {t('write.continue')}
      </Button>
    </div>
  );
}
