import { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, FileText, Heart, MessageSquare, GraduationCap, Smile, Church, Feather, Users, Baby, User, Briefcase, UserCog, Globe, Wand2, Sparkles, Loader2, BookText, Palette, PenTool, ChevronDown, ChevronUp, Tag, UserPen, Brush, Cross, Moon, Flame, BookHeart, Megaphone, ScrollText, Swords, HandHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useI18n } from '@/i18n/I18nContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { InsufficientCreditsDialog } from '@/components/credits/InsufficientCreditsDialog';
import type { WriteState, BookStyle, WritingTone, TargetAudience, BookLanguage, BookLength, ReligiousTradition, PrayerFormat } from '../WriteWizard';
import { hasGeneratedContent } from '../utils/hasGeneratedContent';

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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');
  const { showCreditDialog, setShowCreditDialog, creditErrorMessage, handleAiError, refreshCredits } = useCreditGuard();

  const styles: { type: BookStyle; icon: typeof BookOpen; label: string; desc: string }[] = [
    { type: 'ebook', icon: BookOpen, label: t('write.style_ebook'), desc: t('write.style_ebook_desc') },
    { type: 'guide', icon: FileText, label: t('write.style_guide'), desc: t('write.style_guide_desc') },
    { type: 'prayers', icon: Heart, label: t('write.style_prayers'), desc: t('write.style_prayers_desc') },
    { type: 'story', icon: BookText, label: t('write.style_story') || 'Conte / Histoire', desc: t('write.style_story_desc') || 'Histoires captivantes, personnages mémorables' },
    { type: 'novel', icon: PenTool, label: t('write.style_novel') || 'Roman / Fiction', desc: t('write.style_novel_desc') || 'Récits fictionnels, nouvelles' },
    { type: 'devotional', icon: Church, label: t('write.style_devotional') || 'Dévotion', desc: t('write.style_devotional_desc') || 'Journal spirituel, méditations quotidiennes' },
    { type: 'activity', icon: Palette, label: t('write.style_activity') || 'Cahier d\'activités', desc: t('write.style_activity_desc') || 'Exercices, quiz, coloriage' },
    { type: 'coloring', icon: Brush, label: t('write.style_coloring') || 'Livre de coloriage', desc: t('write.style_coloring_desc') || 'Pages à colorier, line art' },
  ];

  const religiousTraditions: { type: ReligiousTradition; icon: typeof Church; label: string; desc: string }[] = [
    { type: 'christian', icon: Church, label: t('write.tradition_christian') || 'Chrétien', desc: t('write.tradition_christian_desc') || 'Bible, Jésus, Saint-Esprit' },
    { type: 'muslim', icon: BookOpen, label: t('write.tradition_muslim') || 'Musulman', desc: t('write.tradition_muslim_desc') || 'Coran, Du\'as, Hadiths' },
    { type: 'spiritual', icon: Feather, label: t('write.tradition_spiritual') || 'Spirituel général', desc: t('write.tradition_spiritual_desc') || 'Méditation, énergie, univers' },
    { type: 'interfaith', icon: Heart, label: t('write.tradition_interfaith') || 'Interreligieux', desc: t('write.tradition_interfaith_desc') || 'Universel, multi-traditions' },
  ];

  const prayerFormats: { type: PrayerFormat; icon: typeof Heart; label: string; desc: string }[] = [
    { type: 'simple_prayers', icon: Heart, label: t('write.format_simple_prayers') || 'Prières simples', desc: t('write.format_simple_prayers_desc') || 'Prières douces, dévotionnelles' },
    { type: 'warfare_prayers', icon: Feather, label: t('write.format_warfare') || 'Combat spirituel', desc: t('write.format_warfare_desc') || 'Guerre spirituelle, délivrance' },
    { type: 'proclamations', icon: FileText, label: t('write.format_proclamations') || 'Proclamations', desc: t('write.format_proclamations_desc') || 'Déclarations, décrets de foi' },
    { type: 'invocations', icon: Feather, label: t('write.format_invocations') || 'Invocations', desc: t('write.format_invocations_desc') || 'Du\'as, louanges, supplications' },
    { type: 'religious_teaching', icon: BookOpen, label: t('write.format_teaching') || 'Enseignement religieux', desc: t('write.format_teaching_desc') || 'Principes, doctrine, étude' },
  ];

  const tones: { type: WritingTone; icon: typeof MessageSquare; label: string }[] = [
    { type: 'professional', icon: Briefcase, label: t('write.tone_professional') },
    { type: 'conversational', icon: MessageSquare, label: t('write.tone_conversational') },
    { type: 'humorous', icon: Smile, label: t('write.tone_humorous') },
    { type: 'spiritual', icon: Church, label: t('write.tone_spiritual') },
    { type: 'poetic', icon: Feather, label: t('write.tone_poetic') },
    { type: 'academic', icon: GraduationCap, label: t('write.tone_academic') },
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

  const bookLengths: { type: BookLength; label: string; desc: string; pages: string }[] = [
    { type: 'short', label: t('write.length_short') || 'Court', desc: t('write.length_short_desc') || 'Livret, guide rapide', pages: '30-50' },
    { type: 'medium', label: t('write.length_medium') || 'Moyen', desc: t('write.length_medium_desc') || 'Livre standard', pages: '50-100' },
    { type: 'long', label: t('write.length_long') || 'Long', desc: t('write.length_long_desc') || 'Ouvrage complet', pages: '100-200' },
  ];

  const suggestedTitle = state.topic
    ? state.topic.length > 40 ? state.topic.substring(0, 40) + '…' : state.topic
    : '';
  const hasSavedChapters = hasGeneratedContent(state.chapters);

  const handleBookLengthChange = (length: BookLength) => {
    const chapterDefaults: Record<BookLength, number> = { short: 5, medium: 8, long: 15 };
    const pageDefaults: Record<BookLength, number> = { short: 35, medium: 70, long: 150 };
    update({ bookLength: length, chapterCount: chapterDefaults[length], pageCount: pageDefaults[length] });
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && (state.keywords || []).length < 5 && !state.keywords?.includes(kw)) {
      update({ keywords: [...(state.keywords || []), kw] });
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => {
    update({ keywords: (state.keywords || []).filter(k => k !== kw) });
  };

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
      refreshCredits();
    } catch (err: any) {
      console.error('Title suggestion error:', err);
      if (!handleAiError(err)) {
        toast({ title: '❌ Erreur', description: err?.message, variant: 'destructive' });
      }
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

      {/* ═══ SECTION 1: Identité du livre ═══ */}

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

      {/* Subtitle */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t('write.subtitle_label') || 'Sous-titre'} <span className="text-muted-foreground font-normal text-xs">({t('common.optional') || 'optionnel'})</span>
        </label>
        <Input
          value={state.subtitle || ''}
          onChange={e => update({ subtitle: e.target.value })}
          placeholder={t('write.subtitle_placeholder') || 'Ex: "Découvrir la personne que Dieu a créée"'}
          className="h-10 text-sm"
        />
      </div>

      {/* Author name */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <UserPen className="h-3.5 w-3.5" /> {t('write.author_label') || "Nom de l'auteur"}
        </label>
        <Input
          value={state.authorName || ''}
          onChange={e => update({ authorName: e.target.value })}
          placeholder={t('write.author_placeholder') || 'Le nom qui apparaîtra sur votre livre'}
          className="h-10 text-sm"
        />
      </div>

      {/* ═══ SECTION 2: Style & Public ═══ */}

      {/* Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('write.style_label')}</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {styles.map(s => (
            <button
              key={s.type}
              onClick={() => {
                const patch: Partial<WriteState> = { style: s.type };
                if (s.type !== 'prayers') {
                  patch.religiousTradition = undefined;
                  patch.prayerFormat = undefined;
                }
                update(patch);
              }}
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

      {/* ═══ Prayer sub-selectors (only when style === 'prayers') ═══ */}
      {state.style === 'prayers' && (
        <div className="space-y-4 rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-semibold text-primary">{t('write.prayer_customize') || '🙏 Précisez votre livre de prières'}</p>

          {/* Religious tradition */}
          <div className="space-y-2">
            <label className="text-xs font-medium">{t('write.tradition_label') || 'Tradition religieuse'}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {religiousTraditions.map(rt => (
                <button
                  key={rt.type}
                  onClick={() => update({ religiousTradition: rt.type })}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    state.religiousTradition === rt.type
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <rt.icon className="h-4 w-4 mx-auto mb-1" />
                  <p className="text-[10px] font-semibold leading-tight">{rt.label}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 hidden sm:block">{rt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Prayer format */}
          <div className="space-y-2">
            <label className="text-xs font-medium">{t('write.format_label') || 'Type de contenu'}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {prayerFormats.map(pf => (
                <button
                  key={pf.type}
                  onClick={() => update({ prayerFormat: pf.type })}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    state.prayerFormat === pf.type
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <pf.icon className="h-4 w-4 mx-auto mb-1" />
                  <p className="text-[10px] font-semibold leading-tight">{pf.label}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 hidden sm:block">{pf.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* Keywords / Themes */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5" /> {t('write.keywords_label') || 'Mots-clés / Thèmes'} <span className="text-muted-foreground font-normal text-xs">({t('common.optional') || 'optionnel'})</span>
        </label>
        <div className="flex gap-2">
          <Input
            value={keywordInput}
            onChange={e => setKeywordInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
            placeholder={t('write.keywords_placeholder') || 'Ex: leadership, foi, finances...'}
            className="h-9 text-sm flex-1"
            maxLength={30}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 px-3"
            disabled={(state.keywords || []).length >= 5 || !keywordInput.trim()}
            onClick={addKeyword}
          >
            +
          </Button>
        </div>
        {(state.keywords || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {state.keywords!.map(kw => (
              <span
                key={kw}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
              >
                {kw}
                <button onClick={() => removeKeyword(kw)} className="hover:text-destructive transition-colors ml-0.5">×</button>
              </span>
            ))}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">{t('write.keywords_hint') || 'Max 5 thèmes pour guider le contenu du livre'}</p>
      </div>

      {/* ═══ SECTION 3: Options avancées (collapsible) ═══ */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {t('write.advanced_options') || 'Options avancées'}
      </button>

      {showAdvanced && (
        <div className="space-y-6 border-t border-border pt-4">
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

          {/* Book length */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('write.length_label') || 'Longueur du livre'}</label>
            <div className="grid grid-cols-3 gap-2">
              {bookLengths.map(bl => (
                <button
                  key={bl.type}
                  onClick={() => handleBookLengthChange(bl.type)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    state.bookLength === bl.type
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30 bg-card'
                  }`}
                >
                  <p className="font-bold text-xs">{bl.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{bl.desc}</p>
                  <p className="text-[10px] text-primary font-semibold mt-1">~{bl.pages} p.</p>
                </button>
              ))}
            </div>
          </div>

          {/* Chapter count */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              {t('write.chapters_label') || 'Nombre de chapitres'} : <span className="text-primary font-bold">{state.chapterCount}</span>
            </label>
            <Slider
              value={[state.chapterCount]}
              onValueChange={([v]) => update({ chapterCount: v })}
              min={3}
              max={20}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>3 {t('write.chapters') || 'chapitres'}</span>
              <span>20 {t('write.chapters') || 'chapitres'}</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Actions ═══ */}
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
          {hasSavedChapters ? t('common.next') : t('write.generate')} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <InsufficientCreditsDialog open={showCreditDialog} onOpenChange={setShowCreditDialog} message={creditErrorMessage} />
    </div>
  );
}
