import { PenLine, FileText, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/i18n/I18nContext';
import type { WriteState, SourceType } from '../WriteWizard';

const SUGGESTION_KEYS = [
  'write.sug_prayers', 'write.sug_business', 'write.sug_cooking', 'write.sug_health',
  'write.sug_education', 'write.sug_personal', 'write.sug_fiction', 'write.sug_family',
];

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
}

export function StepSource({ state, update, onNext }: Props) {
  const { t } = useI18n();

  const sources: { type: SourceType; icon: typeof PenLine; label: string; desc: string }[] = [
    { type: 'idea', icon: Lightbulb, label: t('write.source_idea'), desc: t('write.source_idea_desc') },
    { type: 'document', icon: FileText, label: t('write.source_doc'), desc: t('write.source_doc_desc') },
  ];

  const canContinue = state.source === 'idea'
    ? state.topic.trim().length >= 3
    : state.uploadedFile !== null;

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
            placeholder={t('write.topic_placeholder')}
            className="min-h-[100px] text-base resize-none"
            autoFocus
          />
          <div>
            <p className="text-xs text-muted-foreground mb-2">{t('write.popular_ideas')}</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTION_KEYS.map(key => {
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
        {t('write.continue')}
      </Button>
    </div>
  );
}
