import { ArrowLeft, ArrowRight, BookOpen, FileText, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useI18n } from '@/i18n/I18nContext';
import type { WriteState, BookStyle } from '../WriteWizard';

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepParams({ state, update, onNext, onBack }: Props) {
  const { t } = useI18n();

  const styles: { type: BookStyle; icon: typeof BookOpen; label: string; desc: string }[] = [
    { type: 'ebook', icon: BookOpen, label: t('write.style_ebook'), desc: t('write.style_ebook_desc') },
    { type: 'guide', icon: FileText, label: t('write.style_guide'), desc: t('write.style_guide_desc') },
    { type: 'prayers', icon: Heart, label: t('write.style_prayers'), desc: t('write.style_prayers_desc') },
  ];

  const suggestedTitle = state.topic
    ? state.topic.length > 40 ? state.topic.substring(0, 40) + '…' : state.topic
    : '';

  return (
    <div className="space-y-8 pt-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold">{t('write.customize')}</h2>
        <p className="text-muted-foreground text-sm">{t('write.customize_sub')}</p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('write.title_label')}</label>
        <Input
          value={state.title || suggestedTitle}
          onChange={e => update({ title: e.target.value })}
          placeholder={t('write.title_placeholder')}
          className="h-12 text-base"
        />
      </div>

      {/* Style */}
      <div className="space-y-3">
        <label className="text-sm font-medium">{t('write.style_label')}</label>
        <div className="grid grid-cols-3 gap-2">
          {styles.map(s => (
            <button
              key={s.type}
              onClick={() => update({ style: s.type })}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                state.style === s.type
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30 bg-card'
              }`}
            >
              <s.icon className={`h-5 w-5 mx-auto mb-2 ${state.style === s.type ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="font-bold text-xs">{s.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Page count */}
      <div className="space-y-3">
        <label className="text-sm font-medium">
          {t('write.pages_label')} : <span className="text-primary font-bold">{state.pageCount}</span>
        </label>
        <Slider
          value={[state.pageCount]}
          onValueChange={([v]) => update({ pageCount: v })}
          min={10}
          max={50}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>10 pages</span>
          <span>50 pages</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {t('write.back')}
        </Button>
        <Button
          size="lg"
          className="flex-1 h-14 text-base gap-2"
          disabled={!(state.title || suggestedTitle).trim()}
          onClick={() => {
            if (!state.title && suggestedTitle) update({ title: suggestedTitle });
            onNext();
          }}
        >
          {t('write.generate')} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
