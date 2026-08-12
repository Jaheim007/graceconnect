import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { ArrowLeft, ArrowRight, Edit3, Plus, Trash2, Zap, BookOpen, ChevronRight, RefreshCw, Expand, MessageSquareText, Loader2, GripVertical, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { useI18n } from '@/i18n/I18nContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { WriteState, WriteChapter } from '../WriteWizard';
import { resolveRequestedBookLanguage } from '../utils/bookLanguage';

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
  onBack: () => void;
}

function normalizeChapters(chapters: WriteChapter[]): WriteChapter[] {
  return chapters
    .map((chapter, index) => ({
      id: chapter.id || `ch-${index + 1}`,
      title: chapter.title.trim(),
      content: chapter.content.trim(),
    }))
    .filter((chapter) => chapter.title.length > 0);
}

function htmlToPlainText(html: string, maxLength = 3500): string {
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

export function StepPreview({ state, update, onNext, onBack }: Props) {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [chaptersDraft, setChaptersDraft] = useState<WriteChapter[]>(state.chapters);
  const [activeChapter, setActiveChapter] = useState(0);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(state.title);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<number | null>(null);
  const initializedRef = useRef(false);
  const autosaveTimeoutRef = useRef<number | null>(null);
  const requestedLanguage = resolveRequestedBookLanguage(state.language, locale, state.languageManuallySelected);
  const isEnglishBook = requestedLanguage === 'en';

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (state.chapters.length > 0) {
      setChaptersDraft(state.chapters.map((chapter) => ({ ...chapter })));
      return;
    }

    setChaptersDraft([{ id: 'ch-1', title: t('write.chapter_default_title'), content: '' }]);
  }, [state.chapters, t]);

  useEffect(() => { setTitleDraft(state.title); }, [state.title]);

  useEffect(() => {
    if (!initializedRef.current) return;

    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }

    setIsAutoSaving(true);

    autosaveTimeoutRef.current = window.setTimeout(() => {
      update({ title: titleDraft, chapters: chaptersDraft });
      setLastAutoSavedAt(Date.now());
      setIsAutoSaving(false);
      autosaveTimeoutRef.current = null;
    }, 700);

    return () => {
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = null;
      }
    };
  }, [chaptersDraft, titleDraft, update]);

  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = null;
        update({ title: titleDraft, chapters: chaptersDraft });
      }
    };
  }, [chaptersDraft, titleDraft, update]);

  const normalizedChapters = useMemo(() => normalizeChapters(chaptersDraft), [chaptersDraft]);
  const currentChapter = chaptersDraft[activeChapter] || chaptersDraft[0];

  const updateChapterTitle = (index: number, title: string) => {
    setChaptersDraft((prev) => prev.map((ch, i) => (i === index ? { ...ch, title } : ch)));
  };

  const updateChapterContent = (index: number, content: string) => {
    setChaptersDraft((prev) => prev.map((ch, i) => (i === index ? { ...ch, content } : ch)));
  };

  const addChapter = () => {
    const newChapter = {
      id: `ch-${Date.now()}`,
      title: `${t('write.chapter_label')} ${chaptersDraft.length + 1}`,
      content: '',
    };
    setChaptersDraft((prev) => [...prev, newChapter]);
    setActiveChapter(chaptersDraft.length);
  };

  const removeChapter = (index: number) => {
    if (chaptersDraft.length <= 1) return;
    setChaptersDraft((prev) => prev.filter((_, i) => i !== index));
    if (activeChapter >= chaptersDraft.length - 1) {
      setActiveChapter(Math.max(0, chaptersDraft.length - 2));
    }
  };

  // Drag-and-drop state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndexRef.current === null || dragIndexRef.current === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === dropIndex) {
      dragIndexRef.current = null;
      setDragOverIndex(null);
      return;
    }
    setChaptersDraft((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(dropIndex, 0, moved);
      return copy;
    });
    // Update active chapter to follow the moved item
    if (activeChapter === fromIndex) {
      setActiveChapter(dropIndex);
    } else if (fromIndex < activeChapter && dropIndex >= activeChapter) {
      setActiveChapter(activeChapter - 1);
    } else if (fromIndex > activeChapter && dropIndex <= activeChapter) {
      setActiveChapter(activeChapter + 1);
    }
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const applyEdits = () => {
    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }

    update({ title: titleDraft, chapters: normalizedChapters });
    setIsAutoSaving(false);
    setLastAutoSavedAt(Date.now());
  };

  const handleAiChapterAction = useCallback(async (action: 'regenerate' | 'amplify' | 'custom', customPrompt?: string) => {
    if (!currentChapter || aiLoading) return;
    setAiLoading(true);

    try {
      const bookTitle = (state.title || t('write.my_book')).trim();
      const bookTopic = (state.topic || state.title || currentChapter.title || '').trim();
      const chapterBody = htmlToPlainText(currentChapter.content, 8000);

      const isReligiousStyle = ['prayers', 'devotional'].includes(state.style || '');
      const noReligiousContent = !isReligiousStyle && !state.religiousTradition;
      const hasStyleRef = !!state.styleReference?.trim();

      const noMarkdownRule = isEnglishBook
        ? 'CRITICAL: Output must be clean HTML only. NEVER use markdown syntax: no asterisks (*), no double asterisks (**), no underscores for emphasis, no # headings. Use only HTML tags: <strong> for bold, <em> for italic, <h2>/<h3> for headings, <p> for paragraphs.'
        : 'CRITIQUE : Le contenu doit être en HTML propre UNIQUEMENT. JAMAIS de syntaxe markdown : pas d\'astérisques (*), pas de double astérisques (**), pas d\'underscores pour l\'emphase, pas de # pour les titres. Utilise UNIQUEMENT les balises HTML : <strong> pour le gras, <em> pour l\'italique, <h2>/<h3> pour les titres, <p> pour les paragraphes.';

      const noVerseRule = noReligiousContent
        ? (isEnglishBook
          ? 'IMPORTANT: Do NOT add Bible verses, scripture references, or any religious content. This is a SECULAR book.'
          : 'IMPORTANT : N\'ajoute PAS de versets bibliques, de références scripturaires ni de contenu religieux. C\'est un livre SÉCULIER.')
        : '';

      const styleRefRule = hasStyleRef
        ? (isEnglishBook
          ? `PRIORITY: Write in the style of "${state.styleReference!.trim()}". Every paragraph must sound like this person/style wrote it. Reproduce their vocabulary, rhythm, and tone faithfully.`
          : `PRIORITÉ : Écris dans le style de « ${state.styleReference!.trim()} ». Chaque paragraphe doit sonner comme si cette personne/ce style l'avait écrit. Reproduis fidèlement son vocabulaire, son rythme et son ton.`)
        : '';

      const noFictionRule = isEnglishBook
        ? 'CRITICAL: Do NOT invent fictional characters, fictional personal stories, or fictional anecdotes (like "Sarah", "John", etc.). Only use real facts, statistics, studies, or general scenarios. If the editorial strategy or original content already contains specific stories or characters, you may use those — but NEVER create new fictional ones.'
        : 'CRITIQUE : N\'invente PAS de personnages fictifs, d\'histoires personnelles fictives ou d\'anecdotes fictives (comme « Sarah », « Jean », etc.). Utilise uniquement des faits réels, des statistiques, des études ou des scénarios généraux. Si la stratégie éditoriale ou le contenu original contient déjà des histoires ou personnages spécifiques, tu peux les utiliser — mais ne crée JAMAIS de nouveaux personnages fictifs.';

      const actionInstruction: Record<'regenerate' | 'amplify' | 'custom', string> = {
        regenerate: isEnglishBook
          ? `Rewrite the chapter "${currentChapter.title}" from scratch with a fresh angle while staying faithful to the book's subject.${hasStyleRef ? ` Write exactly in the style of "${state.styleReference!.trim()}".` : ''} ${noFictionRule} The output must be a COMPLETE, FINISHED chapter.`
          : `Réécris entièrement le chapitre "${currentChapter.title}" avec un angle neuf mais fidèle au sujet du livre.${hasStyleRef ? ` Écris exactement dans le style de « ${state.styleReference!.trim()} ».` : ''} ${noFictionRule} Le résultat doit être un chapitre COMPLET et TERMINÉ.`,
        amplify: isEnglishBook
          ? `Deepen and EXPAND the chapter "${currentChapter.title}" significantly. You MUST return the COMPLETE amplified chapter from start to finish — never stop mid-sentence or mid-paragraph. Add more substance, more concrete arguments, more analysis, and more depth to each point. Make it at least 50% longer and richer than the original.${hasStyleRef ? ` The amplified content MUST stay in the style of "${state.styleReference!.trim()}" — use their vocabulary, their rhetorical patterns, their way of making arguments.` : ''} Do NOT change the subject or add topics that weren't in the original. Just go DEEPER into what's already there. ${noFictionRule} The output must be a COMPLETE, FINISHED chapter.`
          : `Enrichis et DÉVELOPPE significativement le chapitre "${currentChapter.title}". Tu DOIS retourner le chapitre amplifié COMPLET du début à la fin — ne t'arrête JAMAIS en pleine phrase ou en plein paragraphe. Ajoute plus de substance, plus d'arguments concrets, plus d'analyse, et plus de profondeur à chaque point. Rends-le au moins 50% plus long et plus riche que l'original.${hasStyleRef ? ` Le contenu amplifié DOIT rester dans le style de « ${state.styleReference!.trim()} » — utilise son vocabulaire, ses schémas rhétoriques, sa façon d'argumenter.` : ''} Ne change PAS le sujet et n'ajoute pas de thèmes absents de l'original. Va juste PLUS EN PROFONDEUR dans ce qui est déjà là. ${noFictionRule} Le résultat doit être un chapitre COMPLET et TERMINÉ.`,
        custom: customPrompt?.trim()
          ? `${customPrompt.trim()} ${noFictionRule}`
          : '',
      };

      const instruction = actionInstruction[action];
      if (!instruction) return;

      const topicPayload = [
        isEnglishBook
          ? `Book context: title "${bookTitle}", topic "${bookTopic}".`
          : `Contexte livre : titre "${bookTitle}", sujet "${bookTopic}".`,
        isEnglishBook
          ? `Format: ${state.style}. Tone: ${state.tone || 'professional'}. Level: ${state.languageLevel || 'intermediate'}. Audience: ${state.targetAudience || 'general'}.`
          : `Format : ${state.style}. Ton : ${state.tone || 'professional'}. Niveau : ${state.languageLevel || 'intermediate'}. Public : ${state.targetAudience || 'general'}.`,
        noMarkdownRule,
        noVerseRule,
        styleRefRule,
        isEnglishBook ? `Instruction: ${instruction}` : `Instruction : ${instruction}`,
        action === 'regenerate'
          ? ''
          : (isEnglishBook ? `Current content to improve: ${chapterBody}` : `Contenu actuel à améliorer : ${chapterBody}`),
      ].filter(Boolean).join('\n\n');

      const { data, error } = await supabase.functions.invoke('generate-book-content', {
        body: {
          title: bookTitle,
          topic: topicPayload,
          style: state.style,
          pageCount: 5,
          language: requestedLanguage,
          tone: state.tone,
          languageLevel: state.languageLevel,
          targetAudience: state.targetAudience,
          styleReference: state.styleReference || '',
          editorialStrategy: state.editorialStrategy || null,
          religiousTradition: state.religiousTradition || null,
          prayerFormat: state.prayerFormat || null,
          singleChapter: true,
          chapterTitle: currentChapter.title,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const aiChapters = data?.chapters;
      if (!Array.isArray(aiChapters) || aiChapters.length === 0 || !aiChapters[0]?.content) {
        throw new Error('Réponse IA invalide pour ce chapitre');
      }

      // Clean markdown artifacts that may leak from AI
      let newContent = (aiChapters[0].content || '')
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(?<![<\w])\*([^*\n]+?)\*(?![>\w])/g, '<em>$1</em>');
      const newTitle = action === 'regenerate' ? (aiChapters[0].title || currentChapter.title) : currentChapter.title;
      updateChapterContent(activeChapter, newContent);
      if (action === 'regenerate') updateChapterTitle(activeChapter, newTitle);
      toast({ title: '✅ ' + t('write.ai_chapter_updated') });
    } catch (err: any) {
      console.error('AI chapter action error:', err);
      toast({ title: '❌ Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setAiLoading(false);
      setShowAiPrompt(false);
      setAiInstruction('');
    }
  }, [currentChapter, activeChapter, aiLoading, state, toast, t]);

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold">{t('write.preview_title')}</h2>
        <p className="text-muted-foreground text-sm">{t('write.preview_sub')}</p>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Left: Book preview card + TOC */}
        <div className="space-y-4">
          {/* Mini book cover */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 p-6 flex justify-center">
              {state.coverUrl ? (
                <img
                  src={state.coverUrl}
                  alt={titleDraft || t('write.my_book')}
                  className="w-[140px] aspect-[3/4] object-cover rounded-lg shadow-xl"
                  loading="lazy"
                />
              ) : (
                <div className="w-[140px] aspect-[3/4] rounded-lg bg-gradient-to-br from-primary to-accent flex flex-col items-center justify-center p-3 shadow-xl">
                  <h3 className="text-primary-foreground font-extrabold text-[10px] leading-tight text-center line-clamp-3 break-words">
                    {titleDraft || t('write.my_book')}
                  </h3>
                </div>
              )}
            </div>


            {/* Editable title */}
            <div className="px-4 pt-3 pb-2">
              {editingTitle ? (
                <Input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                  autoFocus
                  className="h-9 text-sm font-bold"
                />
              ) : (
                <button
                  onClick={() => setEditingTitle(true)}
                  className="w-full text-left group flex items-center gap-1"
                >
                  <span className="font-bold text-sm text-foreground truncate">
                    {titleDraft || t('write.my_book')}
                  </span>
                  <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              )}
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                <span>📄 {state.pageCount} {t('write.pages')}</span>
                <span>·</span>
                <span>📘 {t(`write.style_${state.style}`) || state.style}</span>
              </div>
            </div>

            {/* Table of contents */}
            <div className="border-t border-border">
              <div className="px-4 py-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  {t('write.toc')}
                </p>
              </div>
              <ScrollArea className="max-h-[240px]">
                <div className="px-2 pb-2 space-y-0.5">
                  {chaptersDraft.map((chapter, i) => (
                    <div
                      key={chapter.id}
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDrop={(e) => handleDrop(e, i)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setActiveChapter(i)}
                      className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left text-xs transition-all cursor-grab active:cursor-grabbing group ${
                        activeChapter === i
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-foreground hover:bg-muted/50'
                      } ${dragOverIndex === i ? 'ring-2 ring-primary/40 scale-[1.02]' : ''}`}
                    >
                      <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                      <span className="text-[10px] font-bold w-4 shrink-0 text-center">{i + 1}</span>
                      <span className="truncate flex-1">{chapter.title || '—'}</span>
                      {chaptersDraft.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeChapter(i); }}
                          className="p-0.5 hover:bg-destructive/10 text-destructive rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                      {activeChapter === i && <ChevronRight className="h-3 w-3 shrink-0" />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="px-3 pb-3">
                <Button type="button" variant="ghost" size="sm" className="w-full gap-1 text-xs h-8" onClick={addChapter}>
                  <Plus className="h-3 w-3" /> {t('write.add_chapter')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Chapter editor */}
        <div className="space-y-4">
          {currentChapter && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Chapter header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                <BookOpen className="h-4 w-4 text-primary shrink-0" />
                <Input
                  value={currentChapter.title}
                  onChange={(e) => updateChapterTitle(activeChapter, e.target.value)}
                  placeholder={`${t('write.chapter_label')} ${activeChapter + 1}`}
                  className="h-8 text-sm font-semibold border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => removeChapter(activeChapter)}
                  disabled={chaptersDraft.length <= 1}
                  aria-label={t('write.remove_chapter')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* AI chapter actions toolbar */}
              <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 border-b border-border bg-accent/5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">
                  {t('write.ai_actions')}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-[10px] px-2"
                  disabled={aiLoading}
                  onClick={() => handleAiChapterAction('regenerate')}
                >
                  {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  {t('write.ai_regenerate')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-[10px] px-2"
                  disabled={aiLoading}
                  onClick={() => handleAiChapterAction('amplify')}
                >
                  {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Expand className="h-3 w-3" />}
                  {t('write.ai_amplify')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-[10px] px-2 border-primary/30 text-primary hover:bg-primary/10"
                  disabled={aiLoading}
                  onClick={() => setShowAiPrompt(!showAiPrompt)}
                >
                  <MessageSquareText className="h-3 w-3" />
                  {t('write.ai_custom')}
                </Button>
              </div>

              {/* Custom AI instruction panel */}
              {showAiPrompt && (
                <div className="px-4 py-3 border-b border-border bg-primary/5 space-y-2">
                  <p className="text-xs text-muted-foreground">{t('write.ai_custom_hint')}</p>
                  <Textarea
                    value={aiInstruction}
                    onChange={(e) => setAiInstruction(e.target.value)}
                    placeholder={t('write.ai_custom_placeholder')}
                    className="min-h-[60px] text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setShowAiPrompt(false); setAiInstruction(''); }}
                    >
                      {t('write.cancel') || 'Annuler'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!aiInstruction.trim() || aiLoading}
                      onClick={() => handleAiChapterAction('custom', aiInstruction)}
                      className="gap-1"
                    >
                      {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      {t('write.ai_apply')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Rich text editor */}
              <div className="p-4">
                <RichTextEditor
                  value={currentChapter.content}
                  onChange={(html) => updateChapterContent(activeChapter, html)}
                  placeholder={t('write.preview_content_hint')}
                  showAIButton={true}
                />
              </div>

              {/* Chapter navigation */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeChapter === 0}
                  onClick={() => setActiveChapter(prev => prev - 1)}
                  className="gap-1 text-xs"
                >
                  <ArrowLeft className="h-3 w-3" /> {t('write.prev_chapter') || 'Précédent'}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {activeChapter + 1} / {chaptersDraft.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeChapter === chaptersDraft.length - 1}
                  onClick={() => setActiveChapter(prev => prev + 1)}
                  className="gap-1 text-xs"
                >
                  {t('write.next_chapter') || 'Suivant'} <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" size="lg" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {t('write.back')}
        </Button>
        <Button
          size="lg"
          className="flex-1 h-14 text-base gap-2"
          disabled={normalizedChapters.length === 0}
          onClick={() => { applyEdits(); onNext(); }}
        >
          ✅ {t('write.continue')} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-right text-xs text-muted-foreground flex items-center justify-end gap-1.5">
        {isAutoSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 text-primary" />}
        {isAutoSaving
          ? t('write.saving_draft')
          : lastAutoSavedAt
            ? `${t('write.last_saved')}: ${new Date(lastAutoSavedAt).toLocaleTimeString()}`
            : t('write.autosave_active')}
      </p>

      <p className="text-center text-xs text-muted-foreground">
        <Edit3 className="h-3 w-3 inline mr-1" />
        {t('write.preview_edit_note')}
      </p>
    </div>
  );
}
