import { cn } from '@/lib/utils';
import { ContentSlide, getSlideGradient } from './parseContentSlides';
import type { SlideCustomization, CaptionStyle, CaptionPosition, ImagePosition } from './SlideCustomizationPanel';

interface SlideRendererProps {
  slide: ContentSlide;
  slideIndex: number;
  totalSlides: number;
  lessonTitle: string;
  moduleTitle: string;
  orgLogoUrl?: string | null;
  deviceMode: 'mobile' | 'tablet' | 'desktop';
  customization?: SlideCustomization;
}

const captionClasses: Record<CaptionStyle, string> = {
  default: 'bg-card/95 backdrop-blur-sm text-foreground',
  light: 'bg-white/95 text-slate-900',
  dark: 'bg-slate-900/95 text-white',
  'transparent-light': 'bg-transparent text-white [text-shadow:_0_1px_8px_rgba(0,0,0,0.6)]',
  'transparent-dark': 'bg-transparent text-slate-900 [text-shadow:_0_1px_8px_rgba(255,255,255,0.5)]',
};

const captionPositionClasses: Record<CaptionPosition, string> = {
  top: 'justify-start',
  middle: 'justify-center',
  bottom: 'justify-end',
};

const imagePositionClasses: Record<ImagePosition, string> = {
  top: 'object-top',
  middle: 'object-center',
  bottom: 'object-bottom',
  cover: 'object-cover',
};

export function SlideRenderer({
  slide,
  slideIndex,
  totalSlides,
  lessonTitle,
  moduleTitle,
  orgLogoUrl,
  deviceMode,
  customization,
}: SlideRendererProps) {
  const gradient = getSlideGradient(slideIndex);
  const isMobile = deviceMode === 'mobile';
  const c = customization;

  const bgStyle: React.CSSProperties = c?.bgColor
    ? { background: c.bgColor }
    : {};

  const hasBgImage = !!c?.bgImageUrl;
  const layout = c?.layout || 'text-only';
  const captionStyle = c?.captionStyle || 'default';
  const captionPos = c?.captionPosition || 'bottom';
  const imgPos = c?.imagePosition || 'middle';

  // Header bar (shared across all slide types)
  const Header = () => (
    <div className="flex items-center gap-2.5 px-5 py-3 relative z-20 border-b border-white/10">
      {orgLogoUrl ? (
        <img src={orgLogoUrl} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-white/20" />
      ) : (
        <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
          {moduleTitle?.[0] || 'C'}
        </div>
      )}
      <span className="text-xs text-white/60 flex-1 truncate">{lessonTitle}</span>
      <span className="text-[10px] bg-white/15 rounded-full px-2.5 py-0.5 text-white/80 font-medium">
        {slideIndex + 1} / {totalSlides}
      </span>
    </div>
  );

  // Decorative swirl (like EdApp reference)
  const Swirl = () => (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-20" viewBox="0 0 800 600" fill="none">
      <path
        d="M400 -50 C 500 100, 200 200, 450 350 S 300 500, 400 650"
        stroke="currentColor"
        strokeWidth="60"
        className="text-primary/40"
        strokeLinecap="round"
      />
    </svg>
  );

  // ── Title Card ──
  if (slide.type === 'title-card') {
    return (
      <div
        className={cn('h-full flex flex-col text-white relative overflow-hidden', !c?.bgColor && `bg-gradient-to-br ${gradient}`)}
        style={bgStyle}
      >
        {hasBgImage && (
          <img src={c!.bgImageUrl} alt="" className={cn('absolute inset-0 w-full h-full object-cover z-0', imagePositionClasses[imgPos])} />
        )}
        {hasBgImage && <div className="absolute inset-0 bg-black/50 z-[1]" />}
        <Swirl />
        <Header />

        <div className={cn('flex-1 flex flex-col px-6 relative z-10', captionPositionClasses[captionPos])}>
          <div className={cn(
            'rounded-xl px-6 py-8 max-w-lg',
            captionStyle === 'transparent-light' || captionStyle === 'transparent-dark'
              ? captionClasses[captionStyle]
              : captionClasses[captionStyle] + ' shadow-2xl'
          )}>
            <div className="w-12 h-0.5 bg-current opacity-30 mb-4" />
            <h1 className={cn('font-bold leading-tight mb-2', isMobile ? 'text-2xl' : 'text-3xl')}>
              {lessonTitle}
            </h1>
            {slide.bodyHtml && (
              <p className="opacity-60 text-sm" dangerouslySetInnerHTML={{ __html: slide.bodyHtml }} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Content Slides ──

  // Layout: Image Cover (full bg image with text overlay)
  if (layout === 'image-cover' && hasBgImage) {
    return (
      <div className="h-full flex flex-col text-white relative overflow-hidden" style={bgStyle}>
        <img src={c!.bgImageUrl} alt="" className={cn('absolute inset-0 w-full h-full object-cover z-0', imagePositionClasses[imgPos])} />
        <div className="absolute inset-0 bg-black/60 z-[1]" />
        <Swirl />
        <Header />
        <div className={cn('flex-1 flex flex-col relative z-10 px-6', captionPositionClasses[captionPos])}>
          <div className={cn('rounded-xl px-5 py-6 max-w-lg', captionClasses[captionStyle])}>
            {slide.heading && <h2 className={cn('font-bold leading-snug mb-3', isMobile ? 'text-xl' : 'text-2xl')}>{slide.heading}</h2>}
            {slide.bodyHtml && (
              <div className="prose prose-sm max-w-none prose-headings:font-bold prose-p:leading-relaxed prose-li:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: slide.bodyHtml }} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Layout: Split (image left/right)
  if ((layout === 'split' || layout === 'image-left' || layout === 'image-right') && hasBgImage) {
    const imgFirst = layout !== 'image-right';
    return (
      <div className={cn('h-full flex flex-col text-white relative overflow-hidden', !c?.bgColor && `bg-gradient-to-br ${gradient}`)} style={bgStyle}>
        <Swirl />
        <Header />
        <div className={cn('flex-1 flex relative z-10 min-h-0', isMobile ? 'flex-col' : imgFirst ? 'flex-row' : 'flex-row-reverse')}>
          {/* Image half */}
          <div className={cn('relative', isMobile ? 'h-1/3' : 'w-1/2')}>
            <img src={c!.bgImageUrl} alt="" className={cn('absolute inset-0 w-full h-full object-cover', imagePositionClasses[imgPos])} />
          </div>
          {/* Text half */}
          <div className={cn('flex flex-col p-5', isMobile ? 'flex-1 overflow-y-auto' : 'w-1/2 overflow-y-auto', captionPositionClasses[captionPos])}>
            <div className={cn('rounded-xl px-4 py-5', captionClasses[captionStyle])}>
              {slide.heading && <h2 className={cn('font-bold leading-snug mb-3', isMobile ? 'text-lg' : 'text-2xl')}>{slide.heading}</h2>}
              {slide.bodyHtml && (
                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-li:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: slide.bodyHtml }} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layout: Image Top
  if (layout === 'image-top' && hasBgImage) {
    return (
      <div className={cn('h-full flex flex-col text-white relative overflow-hidden', !c?.bgColor && `bg-gradient-to-br ${gradient}`)} style={bgStyle}>
        <Swirl />
        <Header />
        <div className="relative h-2/5 shrink-0 z-10">
          <img src={c!.bgImageUrl} alt="" className={cn('absolute inset-0 w-full h-full object-cover', imagePositionClasses[imgPos])} />
        </div>
        <div className={cn('flex-1 flex flex-col relative z-10 overflow-y-auto px-5 py-4', captionPositionClasses[captionPos])}>
          <div className={cn('rounded-xl px-5 py-5', captionClasses[captionStyle])}>
            {slide.heading && <h2 className={cn('font-bold leading-snug mb-3', isMobile ? 'text-xl' : 'text-2xl')}>{slide.heading}</h2>}
            {slide.bodyHtml && (
              <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-li:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: slide.bodyHtml }} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default: Text-only (or fallback)
  return (
    <div
      className={cn('h-full flex flex-col text-white relative overflow-hidden', !c?.bgColor && `bg-gradient-to-br ${gradient}`)}
      style={bgStyle}
    >
      {hasBgImage && (
        <img src={c!.bgImageUrl} alt="" className={cn('absolute inset-0 w-full h-full object-cover z-0', imagePositionClasses[imgPos])} />
      )}
      {hasBgImage && <div className="absolute inset-0 bg-black/50 z-[1]" />}
      <Swirl />
      <Header />

      <div className={cn('flex-1 flex flex-col overflow-y-auto relative z-10', isMobile ? 'px-5 py-4' : 'px-8 py-6', captionPositionClasses[captionPos])}>
        <div className={cn(
          'rounded-xl max-w-2xl w-full',
          captionStyle === 'transparent-light' || captionStyle === 'transparent-dark'
            ? cn(captionClasses[captionStyle], 'px-1 py-1')
            : cn(captionClasses[captionStyle], 'px-6 py-5 shadow-xl')
        )}>
          {slide.heading && (
            <div className="mb-4">
              <div className="w-10 h-0.5 bg-current opacity-30 mb-3" />
              <h2 className={cn('font-bold leading-snug', isMobile ? 'text-xl' : 'text-2xl')}>{slide.heading}</h2>
            </div>
          )}
          {slide.bodyHtml && (
            <div
              className={cn(
                'prose prose-sm max-w-none',
                'prose-headings:font-bold prose-p:leading-relaxed',
                'prose-strong:font-bold prose-em:italic',
                'prose-li:leading-relaxed',
                'prose-blockquote:border-l-2 prose-blockquote:opacity-75 prose-blockquote:rounded-lg prose-blockquote:px-4 prose-blockquote:py-3',
                'prose-a:text-blue-300',
                captionStyle === 'light' || captionStyle === 'transparent-dark'
                  ? 'prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-900'
                  : 'prose-invert prose-headings:text-white prose-p:text-white/85 prose-li:text-white/85 prose-strong:text-white',
                isMobile ? 'text-sm' : 'text-base'
              )}
              dangerouslySetInnerHTML={{ __html: slide.bodyHtml }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
