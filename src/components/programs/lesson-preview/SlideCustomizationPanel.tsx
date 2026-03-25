import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useI18n } from '@/i18n/I18nContext';
import { Sparkles, Image as ImageIcon, Type, Palette, ChevronDown, ChevronUp, ArrowLeft, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CaptionStyle = 'light' | 'dark';
export type CaptionPosition = 'top' | 'middle' | 'bottom';
export type ImagePosition = 'top' | 'middle' | 'bottom' | 'cover';
export type SlideLayout = 'text-only' | 'image-top' | 'image-left' | 'image-right' | 'image-cover' | 'split';

export interface SlideCustomization {
  bgColor: string;
  bgImageUrl: string;
  captionStyle: CaptionStyle;
  captionPosition: CaptionPosition;
  imagePosition: ImagePosition;
  layout: SlideLayout;
}

export const DEFAULT_CUSTOMIZATION: SlideCustomization = {
  bgColor: '',
  bgImageUrl: '',
  captionStyle: 'light',
  captionPosition: 'bottom',
  imagePosition: 'middle',
  layout: 'text-only',
};

const BG_PRESETS = [
  { label: 'Navy', value: 'hsl(220, 60%, 12%)' },
  { label: 'Indigo', value: 'hsl(240, 50%, 15%)' },
  { label: 'Slate', value: 'hsl(215, 30%, 18%)' },
  { label: 'Emerald', value: 'hsl(160, 40%, 12%)' },
  { label: 'Wine', value: 'hsl(340, 45%, 15%)' },
  { label: 'Amber', value: 'hsl(35, 55%, 14%)' },
  { label: 'Charcoal', value: 'hsl(0, 0%, 12%)' },
  { label: 'Royal', value: 'hsl(265, 50%, 18%)' },
];

interface Props {
  customization: SlideCustomization;
  onChange: (c: SlideCustomization) => void;
  onApplyToAll?: (partial: Partial<SlideCustomization>) => void;
  onGenerateImage?: () => void;
  isGenerating?: boolean;
  onBack?: () => void;
}

export function SlideCustomizationPanel({ customization, onChange, onApplyToAll, onGenerateImage, isGenerating, onBack }: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    content: true,
    caption: true,
    background: true,
  });

  const toggle = (key: string) => setExpandedSections(s => ({ ...s, [key]: !s[key] }));
  const update = (partial: Partial<SlideCustomization>) => onChange({ ...customization, ...partial });

  const ApplyToAllButton = ({ partial, disabled }: { partial: Partial<SlideCustomization>; disabled?: boolean }) => {
    if (!onApplyToAll) return null;

    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full h-9 gap-2 text-xs font-semibold border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
        onClick={() => onApplyToAll(partial)}
        disabled={disabled}
      >
        <CheckCheck className="h-3.5 w-3.5" />
        {isFr ? 'Appliquer à toutes les slides' : 'Apply to all slides'}
      </Button>
    );
  };

  const Section = ({ id, icon: Icon, title, children }: { id: string; icon: any; title: string; children: React.ReactNode }) => (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => toggle(id)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</span>
        </div>
        {expandedSections[id] ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {expandedSections[id] && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );

  return (
    <div className="h-full w-full shrink-0 overflow-y-auto overscroll-contain bg-card pb-[env(safe-area-inset-bottom)] md:w-72 md:border-l md:border-border">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3 pr-14 md:pr-4">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 -ml-1"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h3 className="text-sm font-bold text-foreground">{isFr ? 'Personnaliser' : 'Customize'}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">{isFr ? 'Style de la diapositive' : 'Slide style'}</p>
          </div>
        </div>
      </div>

      {/* BACKGROUND IMAGE */}
      <Section id="content" icon={ImageIcon} title={isFr ? 'Image de fond' : 'Background image'}>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {isFr ? 'Cette image reste derrière le texte de la diapositive.' : 'This image stays behind the slide text.'}
        </p>

        <ImageUploader
          value={customization.bgImageUrl}
          onChange={(url) => update({ bgImageUrl: url, layout: 'text-only' })}
          folder="programs/slides"
          label=""
          aspectRatio="video"
        />
        <ApplyToAllButton partial={{ bgImageUrl: customization.bgImageUrl, layout: 'text-only' }} />

        {onGenerateImage && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={onGenerateImage}
            disabled={isGenerating}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isGenerating
              ? (isFr ? 'Génération…' : 'Generating…')
              : (isFr ? 'Générer avec l\'IA' : 'Generate with AI')}
          </Button>
        )}
      </Section>

      {/* CAPTION */}
      <Section id="caption" icon={Type} title="Caption">
        <div>
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {isFr ? 'Style du texte' : 'Caption Style'}
          </Label>
          {/* Visual caption style picker */}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => update({ captionStyle: 'light' })}
              className={cn(
                'relative rounded-lg border-2 p-3 transition-all text-center',
                customization.captionStyle === 'light'
                  ? 'border-primary ring-2 ring-primary/20 bg-background'
                  : 'border-border hover:border-muted-foreground/40 bg-background'
              )}
            >
              <div className="rounded-md bg-background border border-border px-3 py-2 mb-1.5">
                <span className="text-xs font-semibold text-foreground">Aa</span>
              </div>
              <span className="text-[10px] font-medium text-foreground">{isFr ? 'Clair' : 'Light'}</span>
              {customization.captionStyle === 'light' && (
                <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                  <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
            </button>
            <button
              onClick={() => update({ captionStyle: 'dark' })}
              className={cn(
                'relative rounded-lg border-2 p-3 transition-all text-center',
                customization.captionStyle === 'dark'
                  ? 'border-primary ring-2 ring-primary/20 bg-background'
                  : 'border-border hover:border-muted-foreground/40 bg-background'
              )}
            >
              <div className="rounded-md bg-foreground px-3 py-2 mb-1.5">
                <span className="text-xs font-semibold text-background">Aa</span>
              </div>
              <span className="text-[10px] font-medium text-foreground">{isFr ? 'Sombre' : 'Dark'}</span>
              {customization.captionStyle === 'dark' && (
                <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                  <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
            </button>
          </div>
        </div>
        <ApplyToAllButton partial={{ captionStyle: customization.captionStyle }} />

        <div>
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {isFr ? 'Position du texte' : 'Caption Position'}
          </Label>
          <Select value={customization.captionPosition} onValueChange={(v) => update({ captionPosition: v as CaptionPosition })}>
            <SelectTrigger className="mt-1 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="middle">Middle</SelectItem>
              <SelectItem value="bottom">Bottom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ApplyToAllButton partial={{ captionPosition: customization.captionPosition }} />
      </Section>

      {/* BACKGROUND */}
      <Section id="background" icon={Palette} title={isFr ? 'Arrière-plan' : 'Background'}>
        <div className="grid grid-cols-4 gap-2">
          {BG_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => update({ bgColor: preset.value })}
              className={cn(
                'h-8 w-full rounded-md border-2 transition-all hover:scale-110',
                customization.bgColor === preset.value ? 'border-primary ring-2 ring-primary/30' : 'border-border'
              )}
              style={{ background: preset.value }}
              title={preset.label}
            />
          ))}
        </div>
        <button
          onClick={() => update({ bgColor: '' })}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {isFr ? 'Réinitialiser' : 'Reset to default'}
        </button>
        <ApplyToAllButton partial={{ bgColor: customization.bgColor }} />
      </Section>
    </div>
  );
}
