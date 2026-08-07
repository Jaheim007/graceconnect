/**
 * Adapters between persisted `program_slides` rows and the runtime
 * `ContentSlide` shape the player/renderer already understands.
 *
 * Legacy lessons store one HTML blob in `program_lessons.content` and are
 * parsed at render time (parseContentIntoSlides). New lessons store real
 * rows in `program_slides`. Both funnel into `ContentSlide`.
 */
import type { ContentSlide } from './parseContentSlides';

export type SlideType = 'text' | 'image' | 'video' | 'quiz' | 'flashcard' | 'assessment';

/** Sub-kind for interactive slides, stored inside `data.kind` */
export type QuizKind = 'mcq' | 'matching' | 'ordering' | 'fill_in_blank';

export interface ProgramSlideRow {
  id: string;
  lesson_id: string;
  display_order: number;
  slide_type: SlideType;
  title: string | null;
  body: string | null;
  media_url: string | null;
  caption: string | null;
  data: Record<string, any>;
  duration_seconds: number | null;
}

export type NewSlideInput = Omit<ProgramSlideRow, 'id'>;

function escapeAttr(value: string): string {
  return value.replace(/"/g, '&quot;');
}

function mediaHtml(row: ProgramSlideRow): string {
  if (!row.media_url) return '';
  const alt = escapeAttr(row.caption || row.title || '');
  if (row.slide_type === 'video') {
    const url = row.media_url;
    const isEmbed = /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
    if (isEmbed) {
      const src = url
        .replace('youtu.be/', 'www.youtube.com/embed/')
        .replace('watch?v=', 'embed/');
      return `<iframe src="${escapeAttr(src)}" allowfullscreen title="${alt}"></iframe>`;
    }
    return `<video src="${escapeAttr(url)}" controls playsinline preload="none"></video>`;
  }
  return `<img src="${escapeAttr(row.media_url)}" alt="${alt}" loading="lazy" />`;
}

/** Persisted row → runtime slide */
export function rowToContentSlide(row: ProgramSlideRow): ContentSlide {
  const data = row.data || {};

  if (row.slide_type === 'quiz') {
    const kind: QuizKind = data.kind || 'mcq';
    if (kind === 'matching' && Array.isArray(data.pairs)) {
      return { type: 'matching', bodyHtml: '', matching: { pairs: data.pairs } };
    }
    if (kind === 'ordering' && Array.isArray(data.items)) {
      return {
        type: 'ordering',
        bodyHtml: '',
        ordering: {
          instruction: data.instruction,
          items: data.items,
          correctOrder: data.correctOrder || data.items.map((_: unknown, i: number) => i),
        },
      };
    }
    if (kind === 'fill_in_blank' && data.sentence) {
      return {
        type: 'fill-in-blank',
        bodyHtml: '',
        fillInBlank: {
          sentence: data.sentence,
          answer: data.answer || '',
          hint: data.hint,
          acceptableAnswers: data.acceptableAnswers,
        },
      };
    }
    return {
      type: 'quiz',
      bodyHtml: '',
      quiz: {
        question: data.question || row.title || '',
        options: Array.isArray(data.options) ? data.options : [],
        correctIndex: typeof data.correctIndex === 'number' ? data.correctIndex : 0,
        explanation: data.explanation || '',
      },
    };
  }

  if (row.slide_type === 'flashcard') {
    return {
      type: 'flashcard',
      bodyHtml: '',
      flashcard: {
        front: data.front || row.title || '',
        back: data.back || row.body || '',
        hint: data.hint,
      },
    };
  }

  if (row.slide_type === 'assessment') {
    return { type: 'final-assessment', bodyHtml: '' };
  }

  // text / image / video
  const media = mediaHtml(row);
  const caption = row.caption ? `<p class="slide-caption">${row.caption}</p>` : '';
  const body = row.body || '';
  const bodyHtml = row.slide_type === 'text' ? body : `${media}${body}${caption}`;

  return {
    type: 'section',
    heading: row.title || undefined,
    bodyHtml,
  };
}

/** Runtime slide (from legacy HTML parsing) → row payload, for backfill */
export function contentSlideToRow(
  slide: ContentSlide,
  lessonId: string,
  displayOrder: number,
): NewSlideInput {
  const base = {
    lesson_id: lessonId,
    display_order: displayOrder,
    title: null as string | null,
    body: null as string | null,
    media_url: null as string | null,
    caption: null as string | null,
    duration_seconds: null as number | null,
    data: {} as Record<string, any>,
  };

  switch (slide.type) {
    case 'quiz':
      return {
        ...base,
        slide_type: 'quiz',
        title: slide.quiz?.question || null,
        data: { kind: 'mcq', ...slide.quiz },
      };
    case 'matching':
      return { ...base, slide_type: 'quiz', data: { kind: 'matching', ...slide.matching } };
    case 'ordering':
      return { ...base, slide_type: 'quiz', data: { kind: 'ordering', ...slide.ordering } };
    case 'fill-in-blank':
      return { ...base, slide_type: 'quiz', data: { kind: 'fill_in_blank', ...slide.fillInBlank } };
    case 'flashcard':
      return { ...base, slide_type: 'flashcard', data: { ...slide.flashcard } };
    case 'final-assessment':
      return { ...base, slide_type: 'assessment' };
    default: {
      // section / title-card → text slide, promoting a lone image to an image slide
      const imgMatch = slide.bodyHtml?.match(/<img[^>]+src=["']([^"']+)["']/i);
      const textOnly = (slide.bodyHtml || '').replace(/<img[^>]*>/gi, '').trim();
      if (imgMatch && !textOnly) {
        return {
          ...base,
          slide_type: 'image',
          title: slide.heading || null,
          media_url: imgMatch[1],
        };
      }
      return {
        ...base,
        slide_type: 'text',
        title: slide.heading || null,
        body: slide.bodyHtml || '',
      };
    }
  }
}

export const SLIDE_TYPE_LABELS: Record<SlideType, { fr: string; en: string }> = {
  text: { fr: 'Texte', en: 'Text' },
  image: { fr: 'Image', en: 'Image' },
  video: { fr: 'Vidéo', en: 'Video' },
  quiz: { fr: 'Question', en: 'Quiz' },
  flashcard: { fr: 'Carte mémo', en: 'Flashcard' },
  assessment: { fr: 'Évaluation', en: 'Assessment' },
};

export function emptySlide(lessonId: string, order: number, type: SlideType): NewSlideInput {
  const base: NewSlideInput = {
    lesson_id: lessonId,
    display_order: order,
    slide_type: type,
    title: null,
    body: null,
    media_url: null,
    caption: null,
    duration_seconds: null,
    data: {},
  };
  if (type === 'quiz') {
    base.data = { kind: 'mcq', question: '', options: ['', ''], correctIndex: 0, explanation: '' };
  }
  if (type === 'flashcard') base.data = { front: '', back: '' };
  return base;
}
