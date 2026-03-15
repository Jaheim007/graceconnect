import { cn } from '@/lib/utils';
import { ContentSlide } from './parseContentSlides';
import { getSlideTheme } from './slideThemes';
import { SlideDecoration } from './SlideDecorations';
import { QuizSlide } from './QuizSlide';
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
  onStarEarned?: () => void;
}

const captionClasses: Record<CaptionStyle, string> = {
  default: 'bg-card/95 backdrop-blur-sm text-foreground',
  light: 'bg-white/95 text-slate-900',
  dark: 'bg-slate-900/95 text-white',
  'transparent-light': 'bg-transparent text-white [text-shadow:_0_1px_8px_rgba(0,0,0,0.6)]',
  'transparent-dark': 'bg-transparent text-slate-900 [text-shadow:_0_1px_8px_rgba(255,255,255,0.5)]',
};

const captionPositionClasses: Record<CaptionPosition, string> = {
  top: 'justify-start pt-4',
  middle: 'justify-center items-center',
  bottom: 'justify-end pb-4',
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
  onStarEarned,
}: SlideRendererProps) {
  const theme = getSlideTheme(slideIndex);
  const isMobile = deviceMode === 'mobile';
  const c = customization;

  // Quiz slides have their own renderer
  if (slide.type === 'quiz' && slide.quiz) {
    return (
      <QuizSlide
        quiz={slide.quiz}
        theme={theme}
        slideIndex={slideIndex}
        totalSlides={totalSlides}
        lessonTitle={lessonTitle}
        orgLogoUrl={orgLogoUrl}
        deviceMode={deviceMode}
        onStarEarned={onStarEarned}
      />
    );
  }

  const bgStyle: React.CSSProperties = c?.bgColor ? { background: c.bgColor } : {};
  const hasBgImage = !!c?.bgImageUrl;
  const layout = c?.layout || 'text-only';
  const captionStyle = c?.captionStyle || 'default';
  const captionPos = c?.captionPosition || 'bottom';
  const imgPos = c?.imagePosition || 'middle';

  const gradientClass = !c?.bgColor ? `bg-gradient-to-br ${theme.gradient}` : '';

  const Header = () => (
    <div className="flex items-center gap-2.5 px-5 py-3 relative z-20">
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

  const AccentLine = ({ className }: { className?: string }) => (
    <div
      className={cn('h-0.5 rounded-full opacity-50 mb-4', className)}
      style={{ background: theme.accentColor, width: '3rem' }}
    />
  );

  const proseClasses = cn(
    'prose max-w-none',
    'prose-headings:font-bold prose-p:leading-relaxed',
    'prose-strong:font-bold prose-em:italic',
    'prose-li:leading-relaxed',
    'prose-blockquote:border-l-2 prose-blockquote:opacity-75 prose-blockquote:rounded-lg prose-blockquote:px-4 prose-blockquote:py-3',
    'prose-a:text-blue-300',
    'prose-img:rounded-lg prose-img:max-h-[200px] prose-img:w-auto prose-img:mx-auto prose-img:object-contain',
    'prose-video:rounded-lg prose-video:max-h-[200px] prose-video:w-full',
    'prose-iframe:rounded-lg prose-iframe:max-h-[200px] prose-iframe:w-full',
    captionStyle === 'light' || captionStyle === 'transparent-dark'
      ? 'prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-900'
      : 'prose-invert prose-headings:text-white prose-p:text-white/85 prose-li:text-white/85 prose-strong:text-white',
    isMobile ? 'prose-sm' : 'prose-base'
  );

  // ── Title Card ──
  if (slide.type === 'title-card') {
    return (
      <div className={cn('h-full flex flex-col text-white relative overflow-hidden', gradientClass)} style={bgStyle}>
        {hasBgImage && <img src={c!.bgImageUrl} alt="" className={cn('absolute inset-0 w-full h-full object-cover z-0', imagePositionClasses[imgPos])} />}
        {hasBgImage && <div className="absolute inset-0 bg-black/50 z-[1]" />}
        <SlideDecoration theme={theme} />
        <div className="relative z-20"><Header /></div>
        <div className={cn('absolute inset-0 flex flex-col px-6 z-10', captionPositionClasses[captionPos])}>
          <div className={cn(
            'rounded-xl px-6 py-8 max-w-lg',
            captionStyle === 'transparent-light' || captionStyle === 'transparent-dark'
              ? captionClasses[captionStyle]
              : cn(captionClasses[captionStyle], 'shadow-2xl', theme.captionGlow)
          )}>
            <AccentLine />
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

  // Image Cover layout
  if (layout === 'image-cover' && hasBgImage) {
    return (
      <div className="h-full flex flex-col text-white relative overflow-hidden" style={bgStyle}>
        <img src={c!.bgImageUrl} alt="" className={cn('absolute inset-0 w-full h-full object-cover z-0', imagePositionClasses[imgPos])} />
        <div className="absolute inset-0 bg-black/60 z-[1]" />
        <SlideDecoration theme={theme} />
        <Header />
        <div className={cn('flex-1 flex flex-col relative z-10 px-6', captionPositionClasses[captionPos])}>
          <div className={cn('rounded-xl px-5 py-6 max-w-lg', captionClasses[captionStyle], theme.captionGlow)}>
            {slide.heading && <h2 className={cn('font-bold leading-snug mb-3', isMobile ? 'text-xl' : 'text-2xl')}>{slide.heading}</h2>}
            {slide.bodyHtml && <div className={proseClasses} dangerouslySetInnerHTML={{ __html: slide.bodyHtml }} />}
          </div>
        </div>
      </div>
    );
  }

  // Split / Image Left / Image Right
  if ((layout === 'split' || layout === 'image-left' || layout === 'image-right') && hasBgImage) {
    const imgFirst = layout !== 'image-right';
    return (
      <div className={cn('h-full flex flex-col text-white relative overflow-hidden', gradientClass)} style={bgStyle}>
        <SlideDecoration theme={theme} />
        <Header />
        <div className={cn('flex-1 flex relative z-10 min-h-0', isMobile ? 'flex-col' : imgFirst ? 'flex-row' : 'flex-row-reverse')}>
          <div className={cn('relative', isMobile ? 'h-1/3' : 'w-1/2')}>
            <img src={c!.bgImageUrl} alt="" className={cn('absolute inset-0 w-full h-full object-cover', imagePositionClasses[imgPos])} />
          </div>
          <div className={cn('flex flex-col p-5', isMobile ? 'flex-1' : 'w-1/2', captionPositionClasses[captionPos])}>
            <div className={cn('rounded-xl px-4 py-5', captionClasses[captionStyle])}>
              {slide.heading && <h2 className={cn('font-bold leading-snug mb-3', isMobile ? 'text-lg' : 'text-2xl')}>{slide.heading}</h2>}
              {slide.bodyHtml && <div className={proseClasses} dangerouslySetInnerHTML={{ __html: slide.bodyHtml }} />}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Image Top
  if (layout === 'image-top' && hasBgImage) {
    return (
      <div className={cn('h-full flex flex-col text-white relative overflow-hidden', gradientClass)} style={bgStyle}>
        <SlideDecoration theme={theme} />
        <Header />
        <div className="relative h-2/5 shrink-0 z-10">
          <img src={c!.bgImageUrl} alt="" className={cn('absolute inset-0 w-full h-full object-cover', imagePositionClasses[imgPos])} />
        </div>
        <div className={cn('flex-1 flex flex-col relative z-10 px-5 py-4', captionPositionClasses[captionPos])}>
          <div className={cn('rounded-xl px-5 py-5', captionClasses[captionStyle])}>
            {slide.heading && <h2 className={cn('font-bold leading-snug mb-3', isMobile ? 'text-xl' : 'text-2xl')}>{slide.heading}</h2>}
            {slide.bodyHtml && <div className={proseClasses} dangerouslySetInnerHTML={{ __html: slide.bodyHtml }} />}
          </div>
        </div>
      </div>
    );
  }

  // Default: Text-only
  return (
    <div className={cn('h-full flex flex-col text-white relative overflow-hidden', gradientClass)} style={bgStyle}>
      {hasBgImage && <img src={c!.bgImageUrl} alt="" className={cn('absolute inset-0 w-full h-full object-cover z-0', imagePositionClasses[imgPos])} />}
      {hasBgImage && <div className="absolute inset-0 bg-black/50 z-[1]" />}
      <SlideDecoration theme={theme} />
      <div className="relative z-20"><Header /></div>

      <div className={cn('absolute inset-0 flex flex-col z-10', isMobile ? 'px-5' : 'px-8', captionPositionClasses[captionPos])}>
        <div className={cn(
          'rounded-xl max-w-2xl w-full overflow-y-auto max-h-[70%]',
          captionStyle === 'transparent-light' || captionStyle === 'transparent-dark'
            ? cn(captionClasses[captionStyle], 'px-1 py-1')
            : cn(captionClasses[captionStyle], 'px-6 py-5 shadow-xl', theme.captionGlow)
        )}>
          {slide.heading && (
            <div className="mb-4">
              <AccentLine />
              <h2 className={cn('font-bold leading-snug', isMobile ? 'text-xl' : 'text-2xl')}>{slide.heading}</h2>
            </div>
          )}
          {slide.bodyHtml && (
            <div className={proseClasses} dangerouslySetInnerHTML={{ __html: slide.bodyHtml }} />
          )}
        </div>
      </div>
    </div>
  );
}
