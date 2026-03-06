import { useState } from 'react';
import { ArrowLeft, ArrowRight, Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { ImageUploader } from '@/components/ui/ImageUploader';
import type { WriteState } from '../WriteWizard';

const COVER_GRADIENTS = [
  'from-primary to-accent',
  'from-violet-600 to-pink-500',
  'from-emerald-600 to-teal-400',
  'from-orange-500 to-red-500',
  'from-blue-600 to-cyan-400',
  'from-rose-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-indigo-600 to-blue-400',
];

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepCover({ state, update, onNext, onBack }: Props) {
  const { t } = useI18n();
  const [coverUrl, setCoverUrl] = useState('');

  const handleCoverUrlChange = (url: string) => {
    setCoverUrl(url);
    if (url) {
      update({ coverFile: null, coverTemplate: -1 });
    }
  };

  return (
    <div className="space-y-8 pt-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold">{t('write.cover_title')}</h2>
        <p className="text-muted-foreground text-sm">{t('write.cover_sub')}</p>
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-4 gap-3">
        {COVER_GRADIENTS.map((gradient, i) => (
          <button
            key={i}
            onClick={() => { update({ coverTemplate: i, coverFile: null }); setCoverUrl(''); }}
            className={cn(
              'aspect-[3/4] rounded-xl bg-gradient-to-br flex flex-col items-center justify-center p-2 transition-all border-2',
              gradient,
              state.coverTemplate === i && !state.coverFile && !coverUrl
                ? 'border-primary ring-2 ring-primary/30 scale-105'
                : 'border-transparent hover:scale-105'
            )}
          >
            <Sparkles className="h-4 w-4 text-white/80 mb-1" />
            <p className="text-white font-bold text-[8px] leading-tight text-center line-clamp-2">
              {state.title || t('write.my_book')}
            </p>
          </button>
        ))}
      </div>

      {/* Canva + Upload via ImageUploader */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">{t('write.cover_upload_label')}</p>
        <ImageUploader
          value={coverUrl}
          onChange={handleCoverUrlChange}
          folder="book-covers"
          label={t('write.cover_title')}
          aspectRatio="book"
          showCanva={true}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {t('write.back')}
        </Button>
        <Button size="lg" className="flex-1 h-14 text-base gap-2" onClick={onNext}>
          {t('write.continue')} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
