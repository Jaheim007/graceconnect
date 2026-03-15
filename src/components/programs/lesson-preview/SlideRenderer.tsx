import { cn } from '@/lib/utils';
import { ContentSlide, getSlideGradient } from './parseContentSlides';

interface SlideRendererProps {
  slide: ContentSlide;
  slideIndex: number;
  totalSlides: number;
  lessonTitle: string;
  moduleTitle: string;
  orgLogoUrl?: string | null;
  deviceMode: 'mobile' | 'tablet' | 'desktop';
}

export function SlideRenderer({
  slide,
  slideIndex,
  totalSlides,
  lessonTitle,
  moduleTitle,
  orgLogoUrl,
  deviceMode,
}: SlideRendererProps) {
  const gradient = getSlideGradient(slideIndex);
  const isMobile = deviceMode === 'mobile';

  // Title card slide (first slide of a lesson)
  if (slide.type === 'title-card') {
    return (
      <div className={cn(
        'h-full flex flex-col bg-gradient-to-br text-white relative overflow-hidden',
        gradient
      )}>
        {/* Decorative circles */}
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-white/5" />
        <div className="absolute bottom-[-15%] left-[-15%] w-[50%] h-[50%] rounded-full bg-white/5" />

        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-3 relative z-10">
          {orgLogoUrl ? (
            <img src={orgLogoUrl} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-white/20" />
          ) : (
            <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
              {moduleTitle?.[0] || 'C'}
            </div>
          )}
          <span className="text-xs text-white/70 flex-1 truncate">{moduleTitle}</span>
          <span className="text-xs bg-white/15 rounded-full px-2.5 py-0.5 font-medium">
            {slideIndex + 1} / {totalSlides}
          </span>
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 text-center">
          <div className="w-16 h-0.5 bg-white/30 mb-6" />
          <h1 className={cn(
            'font-bold leading-tight mb-3',
            isMobile ? 'text-2xl' : 'text-3xl'
          )}>
            {lessonTitle}
          </h1>
          {slide.bodyHtml && (
            <p className="text-white/60 text-sm max-w-md"
               dangerouslySetInnerHTML={{ __html: slide.bodyHtml }} />
          )}
        </div>
      </div>
    );
  }

  // Regular content section slide
  return (
    <div className={cn(
      'h-full flex flex-col bg-gradient-to-br text-white relative overflow-hidden',
      gradient
    )}>
      {/* Decorative */}
      <div className="absolute top-[-30%] right-[-20%] w-[55%] h-[55%] rounded-full bg-white/[0.03]" />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3 relative z-10 border-b border-white/10">
        {orgLogoUrl ? (
          <img src={orgLogoUrl} alt="" className="h-6 w-6 rounded-full object-cover ring-1 ring-white/20" />
        ) : (
          <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
            {moduleTitle?.[0] || 'C'}
          </div>
        )}
        <span className="text-xs text-white/60 flex-1 truncate">{lessonTitle}</span>
        <span className="text-[10px] bg-white/15 rounded-full px-2 py-0.5">
          {slideIndex + 1} / {totalSlides}
        </span>
      </div>

      {/* Content area */}
      <div className={cn(
        'flex-1 overflow-y-auto relative z-10',
        isMobile ? 'px-5 py-4' : 'px-8 py-6'
      )}>
        {slide.heading && (
          <div className="mb-5">
            <div className="w-10 h-0.5 bg-white/30 mb-3" />
            <h2 className={cn(
              'font-bold leading-snug',
              isMobile ? 'text-xl' : 'text-2xl'
            )}>
              {slide.heading}
            </h2>
          </div>
        )}

        {slide.bodyHtml && (
          <div
            className={cn(
              'prose prose-invert prose-sm max-w-none',
              'prose-headings:text-white prose-p:text-white/85 prose-p:leading-relaxed',
              'prose-strong:text-white prose-em:text-white/90',
              'prose-li:text-white/85 prose-li:leading-relaxed',
              'prose-blockquote:border-white/30 prose-blockquote:text-white/75 prose-blockquote:bg-white/5 prose-blockquote:rounded-lg prose-blockquote:px-4 prose-blockquote:py-3',
              'prose-ul:space-y-1 prose-ol:space-y-1',
              'prose-a:text-blue-300',
              isMobile ? 'text-sm' : 'text-base'
            )}
            dangerouslySetInnerHTML={{ __html: slide.bodyHtml }}
          />
        )}
      </div>
    </div>
  );
}
