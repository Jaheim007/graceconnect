/**
 * Parse a lesson's HTML content into individual slides.
 * Each <h2> or <h3> starts a new slide. Text before the first heading becomes an intro slide.
 */
export interface ContentSlide {
  type: 'title-card' | 'section';
  heading?: string;
  bodyHtml: string;
}

export function parseContentIntoSlides(html: string): ContentSlide[] {
  if (!html?.trim()) return [];

  // Split at <h2> or <h3> tags, keeping the delimiter
  const parts = html.split(/(?=<h[23][^>]*>)/i);
  const slides: ContentSlide[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Extract heading text
    const headingMatch = trimmed.match(/^<h[23][^>]*>(.*?)<\/h[23]>/i);
    if (headingMatch) {
      const heading = headingMatch[1].replace(/<[^>]+>/g, '').trim();
      const body = trimmed.replace(/^<h[23][^>]*>.*?<\/h[23]>/i, '').trim();
      slides.push({ type: 'section', heading, bodyHtml: body });
    } else {
      // Intro content before any heading
      slides.push({ type: 'section', bodyHtml: trimmed });
    }
  }

  return slides;
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
