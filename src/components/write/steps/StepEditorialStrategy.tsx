import { useEffect, useRef, useState } from 'react';
import { Loader2, Target, Lightbulb, BookOpen, Zap, RefreshCw, CheckCircle, ChevronDown, ChevronUp, Pencil, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/i18n/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { InsufficientCreditsDialog } from '@/components/credits/InsufficientCreditsDialog';
import type { WriteState } from '../WriteWizard';
import { hasGeneratedContent } from '../utils/hasGeneratedContent';
import { resolveRequestedBookLanguage } from '../utils/bookLanguage';

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export interface EditorialStrategy {
  reader_problem: string;
  book_promise: string;
  unique_angle: string;
  central_thesis: string;
  narrative_arc: string;
  suggested_stories: string[];
  improved_title: string;
}

type Phase = 'loading' | 'ready' | 'error';

export function StepEditorialStrategy({ state, update, onNext, onBack }: Props) {
  const { t, locale } = useI18n();
  const [phase, setPhase] = useState<Phase>('loading');
  const [strategy, setStrategy] = useState<EditorialStrategy | null>(state.editorialStrategy || null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showStories, setShowStories] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const ran = useRef(false);
  const { showCreditDialog, setShowCreditDialog, creditErrorMessage, handleAiError, refreshCredits } = useCreditGuard();
  const requestedLanguage = resolveRequestedBookLanguage(state.language, locale, state.languageManuallySelected);

  const generate = async () => {
    setPhase('loading');
    setErrorMsg('');

    try {
      // Refresh session to avoid stale JWT / "Session not found" errors
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('generate-editorial-strategy', {
        headers: { Authorization: `Bearer ${token}` },
        body: {
          topic: state.topic || state.title || '',
          title: state.title || '',
          style: state.style,
          audience: state.targetAudience,
          tone: state.tone,
          language: requestedLanguage,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.strategy) throw new Error('No strategy returned');

      const s = data.strategy as EditorialStrategy;
      setStrategy(s);
      update({ editorialStrategy: s });
      refreshCredits();
      setPhase('ready');
    } catch (err: any) {
      console.error('Editorial strategy error:', err);
      if (!handleAiError(err)) {
        setPhase('error');
        setErrorMsg(err?.message || 'Erreur de génération');
      }
    }
  };

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (state.editorialStrategy) {
      setStrategy(state.editorialStrategy);
      setPhase('ready');
      return;
    }

    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFieldEdit = (field: keyof EditorialStrategy, value: string) => {
    if (!strategy) return;
    const updated = { ...strategy, [field]: value };
    setStrategy(updated);
    update({ editorialStrategy: updated });
    setEditingField(null);
  };

  const handleAcceptTitle = () => {
    if (strategy?.improved_title) {
      update({ title: strategy.improved_title });
    }
  };

  const skipStrategy = () => {
    update({ editorialStrategy: undefined });
    onNext();
  };

  if (phase === 'loading') {
    return (
      <div className="space-y-8 pt-16 text-center">
        <div className="h-20 w-20 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold">{t('write.strategy_generating')}</h2>
          <p className="text-sm text-muted-foreground">{t('write.strategy_generating_sub')}</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="space-y-6 pt-16 text-center">
        <div className="h-20 w-20 mx-auto rounded-3xl bg-destructive/10 flex items-center justify-center">
          <Target className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-extrabold">{t('write.strategy_error')}</h2>
        <p className="text-sm text-muted-foreground">{errorMsg}</p>
        <div className="flex gap-2 justify-center flex-wrap">
          <Button variant="outline" onClick={onBack} className="gap-2">
            {t('write.back')}
          </Button>
          <Button onClick={() => { ran.current = false; void generate(); }} className="gap-2">
            <RefreshCw className="h-4 w-4" /> {t('write.ai_regenerate')}
          </Button>
          <Button variant="ghost" onClick={skipStrategy}>
            {t('write.strategy_skip')}
          </Button>
        </div>
      </div>
    );
  }

  if (!strategy) return null;

  const fields: { key: keyof EditorialStrategy; icon: typeof Target; label: string; color: string }[] = [
    { key: 'reader_problem', icon: Target, label: t('write.strategy_problem'), color: 'text-red-500' },
    { key: 'book_promise', icon: Zap, label: t('write.strategy_promise'), color: 'text-amber-500' },
    { key: 'unique_angle', icon: Lightbulb, label: t('write.strategy_angle'), color: 'text-blue-500' },
    { key: 'central_thesis', icon: BookOpen, label: t('write.strategy_thesis'), color: 'text-primary' },
    { key: 'narrative_arc', icon: BookOpen, label: t('write.strategy_arc'), color: 'text-emerald-500' },
  ];

  const hasGeneratedBook = hasGeneratedContent(state.chapters);

  return (
    <div className="space-y-6 pt-8">
      <div className="text-center space-y-2">
        <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
          <Target className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-extrabold">{t('write.strategy_title')}</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{t('write.strategy_sub')}</p>
      </div>

      {/* Improved title suggestion */}
      {strategy.improved_title && strategy.improved_title !== state.title && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-primary mb-1">{t('write.strategy_suggested_title')}</p>
            <p className="font-bold text-sm">« {strategy.improved_title} »</p>
          </div>
          <Button size="sm" variant="outline" onClick={handleAcceptTitle} className="shrink-0 gap-1">
            <CheckCircle className="h-3.5 w-3.5" /> {t('write.strategy_accept_title')}
          </Button>
        </div>
      )}

      {/* Strategy cards */}
      <div className="space-y-3">
        {fields.map(({ key, icon: Icon, label, color }) => (
          <div key={key} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                  <button
                    onClick={() => setEditingField(editingField === key ? null : key)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
                {editingField === key ? (
                  <div className="space-y-2">
                    <Textarea
                      defaultValue={strategy[key] as string}
                      rows={3}
                      className="text-sm"
                      onBlur={(e) => handleFieldEdit(key, e.target.value)}
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground">{t('write.strategy_edit_hint')}</p>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{typeof strategy[key] === 'string' ? (strategy[key] as string).replace(/\*+/g, '') : String(strategy[key] ?? '')}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Suggested stories (collapsible + editable) */}
      {strategy.suggested_stories && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setShowStories(!showStories)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold">{t('write.strategy_stories')} ({strategy.suggested_stories.length})</span>
            </div>
            {showStories ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showStories && (
            <div className="px-4 pb-4 space-y-2">
              {strategy.suggested_stories.map((story, i) => (
                <div key={i} className="flex gap-2 text-sm items-start group">
                  <span className="text-primary font-bold shrink-0 mt-0.5">{i + 1}.</span>
                  {editingField === `story_${i}` ? (
                    <Textarea
                      defaultValue={story}
                      rows={2}
                      className="text-sm flex-1"
                      autoFocus
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        const updated = [...strategy.suggested_stories];
                        if (val) {
                          updated[i] = val;
                        } else {
                          updated.splice(i, 1);
                        }
                        const newStrategy = { ...strategy, suggested_stories: updated };
                        setStrategy(newStrategy);
                        update({ editorialStrategy: newStrategy });
                        setEditingField(null);
                      }}
                    />
                  ) : (
                    <span
                      className="text-muted-foreground flex-1 cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => setEditingField(`story_${i}`)}
                      title={t('write.strategy_click_edit') || 'Clique pour modifier'}
                    >
                      {story}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      const updated = strategy.suggested_stories.filter((_, idx) => idx !== i);
                      const newStrategy = { ...strategy, suggested_stories: updated };
                      setStrategy(newStrategy);
                      update({ editorialStrategy: newStrategy });
                    }}
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                    title={t('common.delete') || 'Supprimer'}
                  >
                    ×
                  </button>
                </div>
              ))}
              {/* Add custom story */}
              <button
                onClick={() => {
                  const updated = [...strategy.suggested_stories, ''];
                  const newStrategy = { ...strategy, suggested_stories: updated };
                  setStrategy(newStrategy);
                  update({ editorialStrategy: newStrategy });
                  setEditingField(`story_${updated.length - 1}`);
                }}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium mt-2 transition-colors"
              >
                <span>+</span> {t('write.strategy_add_story') || 'Ajouter ma propre histoire'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          {t('common.back')}
        </Button>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => { ran.current = false; void generate(); }}
          className="gap-1"
        >
          <RefreshCw className="h-3.5 w-3.5" /> {t('write.strategy_regenerate')}
        </Button>
        <Button onClick={onNext} className="gap-2">
          {hasGeneratedBook ? t('common.next') : t('write.strategy_continue')} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <InsufficientCreditsDialog open={showCreditDialog} onOpenChange={setShowCreditDialog} message={creditErrorMessage} />
    </div>
  );
}
