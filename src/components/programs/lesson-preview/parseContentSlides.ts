/**
 * Parse a lesson's HTML content into individual slides.
 * Splits at <h2>/<h3> headings AND enforces max content length per slide.
 * Also extracts quiz blocks embedded in content.
 */
export interface ContentSlide {
  type: 'title-card' | 'section' | 'quiz' | 'quiz-result' | 'final-assessment' | 'course-completion' | 'flashcard' | 'matching' | 'ordering' | 'fill-in-blank';
  heading?: string;
  bodyHtml: string;
  quiz?: QuizData;
  assessment?: AssessmentData;
  flashcard?: FlashcardData;
  matching?: MatchingData;
  ordering?: OrderingData;
  fillInBlank?: FillInBlankData;
}

export interface FlashcardData {
  front: string;
  back: string;
  hint?: string;
}

export interface MatchingData {
  pairs: { left: string; right: string }[];
}

export interface OrderingData {
  instruction?: string;
  items: string[];
  correctOrder: number[];
}

export interface FillInBlankData {
  sentence: string;
  answer: string;
  hint?: string;
  acceptableAnswers?: string[];
}

export interface QuizData {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  /**
   * Graded quizzes (AI course pipeline) never reveal the answer while the
   * learner answers: the result is shown once the lesson quiz is finished.
   * Legacy / hand-made quizzes keep the instant-feedback behaviour.
   */
  revealAnswers?: boolean;
}


export interface AssessmentData {
  title: string;
  description: string;
  questions: QuizData[];
}

/** Max characters of plain text per slide before splitting */
const MAX_CHARS_PER_SLIDE = 350;
/** Minimum characters of plain text – slides below this get merged */
const MIN_CHARS_PER_SLIDE = 40;

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Check if HTML block is essentially just an image with no meaningful text */
function isImageOnlyBlock(html: string): boolean {
  // Strip all img/video/iframe tags, then check if remaining text is negligible
  const withoutMedia = html
    .replace(/<img[^>]*>/gi, '')
    .replace(/<video[^>]*>[\s\S]*?<\/video>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
  return stripHtml(withoutMedia).length < 10;
}

function splitLongBody(bodyHtml: string): string[] {
  const plain = stripHtml(bodyHtml);
  if (plain.length <= MAX_CHARS_PER_SLIDE) return [bodyHtml];

  // Split by paragraphs, list items, or blockquotes
  const blocks = bodyHtml.split(/(?=<(?:p|li|blockquote|ul|ol)[^>]*>)/i).filter(b => b.trim());
  
  const chunks: string[] = [];
  let current = '';
  let currentLen = 0;

  for (const block of blocks) {
    const blockPlain = stripHtml(block);
    
    if (currentLen + blockPlain.length > MAX_CHARS_PER_SLIDE && current.trim()) {
      chunks.push(current.trim());
      current = block;
      currentLen = blockPlain.length;
    } else {
      current += block;
      currentLen += blockPlain.length;
    }
  }
  
  if (current.trim()) chunks.push(current.trim());

  // Post-process: merge chunks that are too small into adjacent chunks
  const merged: string[] = [];
  for (const chunk of chunks) {
    const chunkText = stripHtml(chunk);
    if (merged.length > 0 && chunkText.length < MIN_CHARS_PER_SLIDE) {
      // Merge with previous chunk
      merged[merged.length - 1] += chunk;
    } else {
      merged.push(chunk);
    }
  }
  // If the last chunk ended up too small, merge it back
  if (merged.length > 1 && stripHtml(merged[merged.length - 1]).length < MIN_CHARS_PER_SLIDE) {
    const last = merged.pop()!;
    merged[merged.length - 1] += last;
  }

  return merged.length > 0 ? merged : [bodyHtml];
}

/**
 * Extract quiz JSON blocks from lesson content.
 * Format: <!-- QUIZ:{"question":"...","options":["A","B","C"],"correctIndex":1,"explanation":"..."} -->
 */
function extractInteractives(html: string): {
  cleanHtml: string;
  quizzes: QuizData[];
  flashcards: FlashcardData[];
  matchings: MatchingData[];
  orderings: OrderingData[];
  fillInBlanks: FillInBlankData[];
} {
  const quizzes: QuizData[] = [];
  const flashcards: FlashcardData[] = [];
  const matchings: MatchingData[] = [];
  const orderings: OrderingData[] = [];
  const fillInBlanks: FillInBlankData[] = [];

  let cleanHtml = html;

  // Extract quizzes: <!-- QUIZ:{...} -->
  cleanHtml = cleanHtml.replace(/<!--\s*QUIZ:([\s\S]*?)-->/gi, (_, json) => {
    try {
      const quiz = JSON.parse(json.trim());
      if (quiz.question && Array.isArray(quiz.options)) {
        quizzes.push({
          question: quiz.question,
          options: quiz.options,
          correctIndex: typeof quiz.correctIndex === 'number' ? quiz.correctIndex : 0,
          explanation: quiz.explanation || '',
        });
      }
    } catch { /* skip invalid */ }
    return '';
  });

  // Extract flashcards: <!-- FLASHCARD:{"front":"...","back":"..."} -->
  cleanHtml = cleanHtml.replace(/<!--\s*FLASHCARD:([\s\S]*?)-->/gi, (_, json) => {
    try {
      const fc = JSON.parse(json.trim());
      if (fc.front && fc.back) {
        flashcards.push({ front: fc.front, back: fc.back, hint: fc.hint });
      }
    } catch { /* skip */ }
    return '';
  });

  // Extract matching: <!-- MATCHING:{"pairs":[{"left":"...","right":"..."}]} -->
  cleanHtml = cleanHtml.replace(/<!--\s*MATCHING:([\s\S]*?)-->/gi, (_, json) => {
    try {
      const m = JSON.parse(json.trim());
      if (Array.isArray(m.pairs) && m.pairs.length >= 2) {
        matchings.push({ pairs: m.pairs });
      }
    } catch { /* skip */ }
    return '';
  });

  // Extract ordering: <!-- ORDERING:{"items":["..."],"correctOrder":[0,1,2]} -->
  cleanHtml = cleanHtml.replace(/<!--\s*ORDERING:([\s\S]*?)-->/gi, (_, json) => {
    try {
      const o = JSON.parse(json.trim());
      if (Array.isArray(o.items) && Array.isArray(o.correctOrder)) {
        orderings.push({ instruction: o.instruction, items: o.items, correctOrder: o.correctOrder });
      }
    } catch { /* skip */ }
    return '';
  });

  // Extract fill-in-the-blank: <!-- FILLINBLANK:{"sentence":"...","answer":"..."} -->
  cleanHtml = cleanHtml.replace(/<!--\s*FILLINBLANK:([\s\S]*?)-->/gi, (_, json) => {
    try {
      const fb = JSON.parse(json.trim());
      if (fb.sentence && fb.answer) {
        fillInBlanks.push({ sentence: fb.sentence, answer: fb.answer, hint: fb.hint, acceptableAnswers: fb.acceptableAnswers });
      }
    } catch { /* skip */ }
    return '';
  });

  return { cleanHtml, quizzes, flashcards, matchings, orderings, fillInBlanks };
}

export function parseContentIntoSlides(html: string): ContentSlide[] {
  if (!html?.trim()) return [];

  // Extract all interactive elements
  const { cleanHtml, quizzes, flashcards, matchings, orderings, fillInBlanks } = extractInteractives(html);

  // Split at <h2> or <h3> tags
  const parts = cleanHtml.split(/(?=<h[23][^>]*>)/i);
  const slides: ContentSlide[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const headingMatch = trimmed.match(/^<h[23][^>]*>(.*?)<\/h[23]>/i);
    if (headingMatch) {
      const heading = headingMatch[1].replace(/<[^>]+>/g, '').trim();
      const body = trimmed.replace(/^<h[23][^>]*>.*?<\/h[23]>/i, '').trim();
      
      const bodyChunks = splitLongBody(body);
      bodyChunks.forEach((chunk, i) => {
        slides.push({
          type: 'section',
          heading: i === 0 ? heading : undefined,
          bodyHtml: chunk,
        });
      });
    } else {
      const bodyChunks = splitLongBody(trimmed);
      bodyChunks.forEach(chunk => {
        slides.push({ type: 'section', bodyHtml: chunk });
      });
    }
  }

  // Filter out image-only slides
  const filtered: ContentSlide[] = [];
  for (const slide of slides) {
    if (isImageOnlyBlock(slide.bodyHtml) && !slide.heading) {
      if (filtered.length > 0) {
        filtered[filtered.length - 1].bodyHtml += slide.bodyHtml;
      }
    } else {
      filtered.push(slide);
    }
  }
  const finalSlides = filtered.length > 0 ? filtered : slides;

  // Collect all interactive slides to distribute
  const interactives: ContentSlide[] = [];
  for (const q of quizzes) interactives.push({ type: 'quiz', bodyHtml: '', quiz: q });
  for (const fc of flashcards) interactives.push({ type: 'flashcard', bodyHtml: '', flashcard: fc });
  for (const m of matchings) interactives.push({ type: 'matching', bodyHtml: '', matching: m });
  for (const o of orderings) interactives.push({ type: 'ordering', bodyHtml: '', ordering: o });
  for (const fb of fillInBlanks) interactives.push({ type: 'fill-in-blank', bodyHtml: '', fillInBlank: fb });

  // Insert interactive slides distributed evenly among content
  if (interactives.length > 0) {
    const result: ContentSlide[] = [];
    const interval = Math.max(1, Math.floor(finalSlides.length / (interactives.length + 1)));
    let intIdx = 0;

    for (let i = 0; i < finalSlides.length; i++) {
      result.push(finalSlides[i]);
      if (intIdx < interactives.length && (i + 1) % interval === 0 && i > 0) {
        result.push(interactives[intIdx]);
        intIdx++;
      }
    }
    while (intIdx < interactives.length) {
      result.push(interactives[intIdx]);
      intIdx++;
    }

    return result;
  }

  return finalSlides;
}

// Gradient palettes for slide backgrounds
const SLIDE_GRADIENTS = [
  'from-[hsl(220,70%,18%)] to-[hsl(240,60%,25%)]',
  'from-[hsl(250,55%,22%)] to-[hsl(280,50%,30%)]',
  'from-[hsl(200,65%,15%)] to-[hsl(220,60%,22%)]',
  'from-[hsl(170,50%,15%)] to-[hsl(200,55%,22%)]',
  'from-[hsl(300,40%,18%)] to-[hsl(330,45%,25%)]',
  'from-[hsl(35,60%,18%)] to-[hsl(20,50%,22%)]',
];

export function getSlideGradient(index: number): string {
  return SLIDE_GRADIENTS[index % SLIDE_GRADIENTS.length];
}
