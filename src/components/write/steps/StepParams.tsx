import { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, FileText, Heart, MessageSquare, GraduationCap, Smile, Church, Feather, BookMarked, Users, Baby, User, Briefcase, UserCog, Globe, Wand2, Sparkles, Loader2, BookText, Palette, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useI18n } from '@/i18n/I18nContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { WriteState, BookStyle, WritingTone, LanguageLevel, TargetAudience, BookLanguage } from '../WriteWizard';

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepParams({ state, update, onNext, onBack }: Props) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [suggestingTitles, setSuggestingTitles] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);

  const styles: { type: BookStyle; icon: typeof BookOpen; label: string; desc: string }[] = [
    { type: 'ebook', icon: BookOpen, label: t('write.style_ebook'), desc: t('write.style_ebook_desc') },
    { type: 'guide', icon: FileText, label: t('write.style_guide'), desc: t('write.style_guide_desc') },
    { type: 'prayers', icon: Heart, label: t('write.style_prayers'), desc: t('write.style_prayers_desc') },
    { type: 'story', icon: BookText, label: t('write.style_story') || 'Conte / Histoire', desc: t('write.style_story_desc') || 'Histoires captivantes, personnages mémorables' },
    { type: 'novel', icon: PenTool, label: t('write.style_novel') || 'Roman / Fiction', desc: t('write.style_novel_desc') || 'Récits fictionnels, nouvelles' },
    { type: 'devotional', icon: Church, label: t('write.style_devotional') || 'Dévotion', desc: t('write.style_devotional_desc') || 'Journal spirituel, méditations quotidiennes' },
    { type: 'activity', icon: Palette, label: t('write.style_activity') || 'Cahier d\'activités', desc: t('write.style_activity_desc') || 'Exercices, quiz, coloriage' },
  ];

  const tones: { type: WritingTone; icon: typeof MessageSquare; label: string }[] = [
    { type: 'professional', icon: Briefcase, label: t('write.tone_professional') },
    { type: 'conversational', icon: MessageSquare, label: t('write.tone_conversational') },
    { type: 'humorous', icon: Smile, label: t('write.tone_humorous') },
    { type: 'spiritual', icon: Church, label: t('write.tone_spiritual') },
    { type: 'poetic', icon: Feather, label: t('write.tone_poetic') },
    { type: 'academic', icon: GraduationCap, label: t('write.tone_academic') },
  ];

  const levels: { type: LanguageLevel; label: string; desc: string }[] = [
    { type: 'simple', label: t('write.level_simple'), desc: t('write.level_simple_desc') },
    { type: 'intermediate', label: t('write.level_intermediate'), desc: t('write.level_intermediate_desc') },
    { type: 'advanced', label: t('write.level_advanced'), desc: t('write.level_advanced_desc') },
  ];

  const audiences: { type: TargetAudience; icon: typeof Users; label: string }[] = [
    { type: 'general', icon: Users, label: t('write.audience_general') },
    { type: 'children', icon: Baby, label: t('write.audience_children') },
    { type: 'teens', icon: User, label: t('write.audience_teens') },
    { type: 'adults', icon: UserCog, label: t('write.audience_adults') },
    { type: 'professionals', icon: Briefcase, label: t('write.audience_professionals') },
  ];

  const languages: { type: BookLanguage; flag: string; label: string }[] = [
    { type: 'fr', flag: '🇫🇷', label: t('write.lang_fr') },
    { type: 'en', flag: '🇬🇧', label: t('write.lang_en') },
    { type: 'es', flag: '🇪🇸', label: t('write.lang_es') },
    { type: 'pt', flag: '🇧🇷', label: t('write.lang_pt') },
    { type: 'de', flag: '🇩🇪', label: t('write.lang_de') },
    { type: 'sw', flag: '🇰🇪', label: t('write.lang_sw') },
  ];

  const suggestedTitle = state.topic
    ? state.topic.length > 40 ? state.topic.substring(0, 40) + '…' : state.topic
    : '';

  const handleSuggestTitles = async () => {
    if (suggestingTitles) return;
    setSuggestingTitles(true);
    setTitleSuggestions([]);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-titles', {
        body: {
          topic: state.topic || state.title || '',
          style: state.style,
          audience: state.targetAudience,
          language: state.language || 'fr',
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (Array.isArray(data?.titles)) {
        setTitleSuggestions(data.titles);
      }
    } catch (err: any) {
      console.error('Title suggestion error:', err);
      toast({ title: '❌ Erreur', description: err?.message, variant: 'destructive' });
    } finally {
      setSuggestingTitles(false);
    }
  };

  return (
    <div className="space-y-6 pt-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold">{t('write.customize')}</h2>
        <p className="text-muted-foreground text-sm">{t('write.customize_sub')}</p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{t('write.title_label')}</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs h-7 text-primary"
            disabled={suggestingTitles || !state.topic?.trim()}
            onClick={handleSuggestTitles}
          >
            {suggestingTitles ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {t('write.suggest_titles') || '✨ Suggérer des titres'}
          </Button>
        </div>
        <Input
          value={state.title || suggestedTitle}
          onChange={e => update({ title: e.target.value })}
          placeholder={t('write.title_placeholder')}
          className="h-12 text-base"
        />
        {/* Title suggestions */}
        {titleSuggestions.length > 0 && (
          <div className="space-y-1.5">
            {titleSuggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => { update({ title: suggestion }); setTitleSuggestions([]); }}
                className="w-full text-left px-3 py-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-sm"
              >
                <span className="text-primary font-bold mr-2">{i + 1}.</span>
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('write.style_label')}</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {styles.map(s => (
            <button
              key={s.type}
              onClick={() => update({ style: s.type })}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                state.style === s.type
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30 bg-card'
              }`}
            >
              <s.icon className={`h-4 w-4 mx-auto mb-1.5 ${state.style === s.type ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="font-bold text-xs">{s.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Tone */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('write.tone_label')}</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {tones.map(to => (
            <button
              key={to.type}
              onClick={() => update({ tone: to.type })}
              className={`p-2 rounded-lg border text-center transition-all ${
                state.tone === to.type
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              <to.icon className="h-3.5 w-3.5 mx-auto mb-1" />
              <p className="text-[10px] font-semibold leading-tight">{to.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom style reference */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Wand2 className="h-3.5 w-3.5" /> {t('write.style_ref_label')}
        </label>
        <Textarea
          value={state.styleReference || ''}
          onChange={e => update({ styleReference: e.target.value })}
          placeholder={t('write.style_ref_placeholder')}
          className="min-h-[80px] text-sm resize-none"
          maxLength={1000}
        />
        <p className="text-[10px] text-muted-foreground">{t('write.style_ref_hint')}</p>
      </div>

      {/* Language level */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('write.level_label')}</label>
        <div className="grid grid-cols-3 gap-2">
          {levels.map(l => (
            <button
              key={l.type}
              onClick={() => update({ languageLevel: l.type })}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                state.languageLevel === l.type
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30 bg-card'
              }`}
            >
              <p className="font-bold text-xs">{l.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{l.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Target audience */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('write.audience_label')}</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {audiences.map(a => (
            <button
              key={a.type}
              onClick={() => update({ targetAudience: a.type })}
              className={`p-2 rounded-lg border text-center transition-all ${
                state.targetAudience === a.type
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              <a.icon className="h-3.5 w-3.5 mx-auto mb-1" />
              <p className="text-[10px] font-semibold leading-tight">{a.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5" /> {t('write.language_label')}
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {languages.map(l => (
            <button
              key={l.type}
              onClick={() => update({ language: l.type })}
              className={`p-2 rounded-lg border text-center transition-all ${
                state.language === l.type
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="text-lg block">{l.flag}</span>
              <p className="text-[10px] font-semibold leading-tight mt-0.5">{l.label}</p>
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
