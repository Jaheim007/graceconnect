import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useI18n } from '@/i18n/I18nContext';
import { Sparkles, Image as ImageIcon, Type, Palette, Layout, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CaptionStyle = 'default' | 'light' | 'dark' | 'transparent-light' | 'transparent-dark';
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
  captionStyle: 'default',
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
  onGenerateImage?: () => void;
  isGenerating?: boolean;
}

export function SlideCustomizationPanel({ customization, onChange, onGenerateImage, isGenerating }: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    content: true,
    caption: true,
    background: true,
    layout: true,
  });

  const toggle = (key: string) => setExpandedSections(s => ({ ...s, [key]: !s[key] }));
  const update = (partial: Partial<SlideCustomization>) => onChange({ ...customization, ...partial });

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
    <div className="w-72 border-l border-border bg-card overflow-y-auto shrink-0">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-bold text-foreground">{isFr ? 'Personnaliser' : 'Customize'}</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">{isFr ? 'Style de la diapositive' : 'Slide style'}</p>
      </div>

      {/* CONTENT / IMAGE */}
      <Section id="content" icon={ImageIcon} title="Content">
        <ImageUploader
          value={customization.bgImageUrl}
          onChange={(url) => update({ bgImageUrl: url })}
          folder="programs/slides"
          label=""
          aspectRatio="video"
        />
        
        <div>
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {isFr ? 'Position de l\'image' : 'Image Position'}
          </Label>
          <Select value={customization.imagePosition} onValueChange={(v) => update({ imagePosition: v as ImagePosition })}>
            <SelectTrigger className="mt-1 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="middle">Middle</SelectItem>
              <SelectItem value="bottom">Bottom</SelectItem>
              <SelectItem value="cover">Cover</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
          <Select value={customization.captionStyle} onValueChange={(v) => update({ captionStyle: v as CaptionStyle })}>
            <SelectTrigger className="mt-1 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="transparent-light">Transparent Light Text</SelectItem>
              <SelectItem value="transparent-dark">Transparent Dark Text</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
      </Section>

      {/* LAYOUT */}
      <Section id="layout" icon={Layout} title="Layout">
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: 'text-only', label: isFr ? 'Texte' : 'Text' },
            { key: 'image-top', label: isFr ? 'Image haut' : 'Img Top' },
            { key: 'image-left', label: isFr ? 'Image gauche' : 'Img Left' },
            { key: 'image-right', label: isFr ? 'Image droite' : 'Img Right' },
            { key: 'image-cover', label: 'Cover' },
            { key: 'split', label: 'Split' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => update({ layout: key })}
              className={cn(
                'rounded-lg border-2 px-2 py-2.5 text-[10px] font-medium transition-all',
                customization.layout === key
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}
