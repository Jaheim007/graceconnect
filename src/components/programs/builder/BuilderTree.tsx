import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GripVertical, Plus, Trash2, Copy, ChevronDown, ChevronRight, BookOpen,
  FileText, ImageIcon, Video, HelpCircle, Layers, Award, Settings2,
} from 'lucide-react';
import type { ProgramSlideRow, SlideType } from '@/components/programs/lesson-preview/slideAdapters';
import { SLIDE_TYPE_LABELS } from '@/components/programs/lesson-preview/slideAdapters';

const SLIDE_ICONS: Record<SlideType, typeof FileText> = {
  text: FileText,
  image: ImageIcon,
  video: Video,
  quiz: HelpCircle,
  flashcard: Layers,
  assessment: Award,
};

export interface TreeLesson {
  id: string;
  title: string;
  duration_minutes?: number | null;
}

export interface TreeModule {
  id: string;
  title: string;
  lessons?: TreeLesson[];
}

interface BuilderTreeProps {
  modules: TreeModule[];
  slideMap: Record<string, ProgramSlideRow[]>;
  selectedLessonId: string | null;
  selectedSlideId: string | null;
  canEdit: boolean;
  isFr: boolean;
  onSelectLesson: (lessonId: string, moduleId: string) => void;
  onSelectSlide: (slideId: string, lessonId: string, moduleId: string) => void;
  onOpenLessonSettings: (lessonId: string, moduleId: string) => void;
  onAddLesson: (moduleId: string) => void;
  onDuplicateLesson: (lessonId: string, moduleId: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  onAddSlide: (lessonId: string, type: SlideType) => void;
  onDuplicateSlide: (slide: ProgramSlideRow) => void;
  onDeleteSlide: (slideId: string) => void;
  onReorderLessons: (moduleId: string, orderedIds: string[]) => void;
  onReorderSlides: (lessonId: string, orderedIds: string[]) => void;
  onAddModule: () => void;
}

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const SLIDE_TYPES: SlideType[] = ['text', 'image', 'video', 'quiz', 'flashcard'];

export function BuilderTree({
  modules, slideMap, selectedLessonId, selectedSlideId, canEdit, isFr,
  onSelectLesson, onSelectSlide, onOpenLessonSettings,
  onAddLesson, onDuplicateLesson, onDeleteLesson,
  onAddSlide, onDuplicateSlide, onDeleteSlide,
  onReorderLessons, onReorderSlides, onAddModule,
}: BuilderTreeProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [dragLesson, setDragLesson] = useState<{ moduleId: string; index: number } | null>(null);
  const [dragSlide, setDragSlide] = useState<{ lessonId: string; index: number } | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  const toggle = (id: string) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2 shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {isFr ? 'Structure' : 'Structure'}
        </span>
        {canEdit && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddModule}
            title={isFr ? 'Ajouter un module' : 'Add module'}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
        {modules.map(mod => {
          const lessons = mod.lessons || [];
          const isCollapsed = collapsed.has(mod.id);
          return (
            <div key={mod.id} className="rounded-xl border border-border/50 bg-muted/20">
              <button
                type="button"
                onClick={() => toggle(mod.id)}
                className="flex w-full items-center gap-1.5 px-2 py-2 text-left"
              >
                {isCollapsed
                  ? <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  : <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />}
                <BookOpen className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {mod.title}
                </span>
                <span className="text-[9px] text-muted-foreground/60">{lessons.length}</span>
              </button>

              {!isCollapsed && (
                <div className="space-y-1 px-1.5 pb-2">
                  {lessons.map((lesson, li) => {
                    const slides = slideMap[lesson.id] || [];
                    const lessonActive = selectedLessonId === lesson.id;
                    const lessonKey = `lesson:${lesson.id}`;
                    return (
                      <div key={lesson.id}>
                        {/* ── Lesson row (draggable) ── */}
                        <div
                          draggable={canEdit}
                          onDragStart={() => canEdit && setDragLesson({ moduleId: mod.id, index: li })}
                          onDragEnd={() => { setDragLesson(null); setOverKey(null); }}
                          onDragOver={e => {
                            if (!dragLesson || dragLesson.moduleId !== mod.id) return;
                            e.preventDefault();
                            setOverKey(lessonKey);
                          }}
                          onDrop={e => {
                            if (!dragLesson || dragLesson.moduleId !== mod.id) return;
                            e.preventDefault();
                            if (dragLesson.index !== li) {
                              onReorderLessons(
                                mod.id,
                                move(lessons.map(l => l.id), dragLesson.index, li),
                              );
                            }
                            setDragLesson(null);
                            setOverKey(null);
                          }}
                          className={cn(
                            'group flex items-center gap-1 rounded-lg px-1.5 py-1.5 transition-colors',
                            lessonActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50',
                            overKey === lessonKey && 'ring-1 ring-primary/60',
                          )}
                        >
                          {canEdit && (
                            <GripVertical className="h-3 w-3 shrink-0 cursor-grab text-muted-foreground/50" />
                          )}
                          <button
                            type="button"
                            className="flex-1 min-w-0 text-left"
                            onClick={() => onSelectLesson(lesson.id, mod.id)}
                          >
                            <span className="block truncate text-xs font-medium">{lesson.title}</span>
                            <span className="text-[9px] text-muted-foreground">
                              {slides.length} {isFr ? 'diapo' : 'slide'}{slides.length !== 1 ? 's' : ''}
                            </span>
                          </button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                            title={isFr ? 'Réglages de la leçon' : 'Lesson settings'}
                            onClick={() => onOpenLessonSettings(lesson.id, mod.id)}
                          >
                            <Settings2 className="h-3 w-3" />
                          </Button>
                          {canEdit && (
                            <>
                              <Button
                                variant="ghost" size="icon"
                                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                                title={isFr ? 'Dupliquer' : 'Duplicate'}
                                onClick={() => onDuplicateLesson(lesson.id, mod.id)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost" size="icon"
                                className="h-6 w-6 shrink-0 text-destructive opacity-0 group-hover:opacity-100"
                                title={isFr ? 'Supprimer' : 'Delete'}
                                onClick={() => onDeleteLesson(lesson.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>

                        {/* ── Slides (draggable within lesson) ── */}
                        <div className="ml-4 space-y-0.5 border-l border-border/50 pl-2">
                          {slides.map((slide, si) => {
                            const Icon = SLIDE_ICONS[slide.slide_type] || FileText;
                            const key = `slide:${slide.id}`;
                            const label =
                              slide.title
                              || (slide.data?.question as string)
                              || (isFr ? SLIDE_TYPE_LABELS[slide.slide_type].fr : SLIDE_TYPE_LABELS[slide.slide_type].en);
                            return (
                              <div
                                key={slide.id}
                                draggable={canEdit}
                                onDragStart={e => {
                                  if (!canEdit) return;
                                  e.stopPropagation();
                                  setDragSlide({ lessonId: lesson.id, index: si });
                                }}
                                onDragEnd={() => { setDragSlide(null); setOverKey(null); }}
                                onDragOver={e => {
                                  if (!dragSlide || dragSlide.lessonId !== lesson.id) return;
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setOverKey(key);
                                }}
                                onDrop={e => {
                                  if (!dragSlide || dragSlide.lessonId !== lesson.id) return;
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (dragSlide.index !== si) {
                                    onReorderSlides(
                                      lesson.id,
                                      move(slides.map(s => s.id), dragSlide.index, si),
                                    );
                                  }
                                  setDragSlide(null);
                                  setOverKey(null);
                                }}
                                className={cn(
                                  'group/slide flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors',
                                  selectedSlideId === slide.id
                                    ? 'bg-primary/15 text-primary'
                                    : 'hover:bg-muted/50',
                                  overKey === key && 'ring-1 ring-primary/60',
                                )}
                              >
                                {canEdit && (
                                  <GripVertical className="h-2.5 w-2.5 shrink-0 cursor-grab text-muted-foreground/40" />
                                )}
                                <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
                                <button
                                  type="button"
                                  className="flex-1 min-w-0 truncate text-left text-[11px]"
                                  onClick={() => onSelectSlide(slide.id, lesson.id, mod.id)}
                                >
                                  {label}
                                </button>
                                {canEdit && (
                                  <>
                                    <Button
                                      variant="ghost" size="icon"
                                      className="h-5 w-5 shrink-0 opacity-0 group-hover/slide:opacity-100"
                                      title={isFr ? 'Dupliquer' : 'Duplicate'}
                                      onClick={() => onDuplicateSlide(slide)}
                                    >
                                      <Copy className="h-2.5 w-2.5" />
                                    </Button>
                                    <Button
                                      variant="ghost" size="icon"
                                      className="h-5 w-5 shrink-0 text-destructive opacity-0 group-hover/slide:opacity-100"
                                      title={isFr ? 'Supprimer' : 'Delete'}
                                      onClick={() => onDeleteSlide(slide.id)}
                                    >
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            );
                          })}

                          {canEdit && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                >
                                  <Plus className="h-3 w-3" />
                                  {isFr ? 'Diapositive' : 'Slide'}
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                {SLIDE_TYPES.map(t => {
                                  const Icon = SLIDE_ICONS[t];
                                  return (
                                    <DropdownMenuItem key={t} onClick={() => onAddSlide(lesson.id, t)}>
                                      <Icon className="mr-2 h-3.5 w-3.5" />
                                      {isFr ? SLIDE_TYPE_LABELS[t].fr : SLIDE_TYPE_LABELS[t].en}
                                    </DropdownMenuItem>
                                  );
                                })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onAddLesson(mod.id)}
                      className="flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    >
                      <Plus className="h-3 w-3" /> {isFr ? 'Nouvelle leçon' : 'New lesson'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {modules.length === 0 && (
          <div className="space-y-3 py-8 text-center">
            <Layers className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">{isFr ? 'Aucun module' : 'No modules'}</p>
            {canEdit && (
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={onAddModule}>
                <Plus className="h-3 w-3" /> {isFr ? 'Ajouter un module' : 'Add module'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
