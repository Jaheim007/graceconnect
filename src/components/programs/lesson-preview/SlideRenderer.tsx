import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ContentSlide } from './parseContentSlides';
import { getSlideThemeFor } from './slideThemes';
import { SlideDecoration } from './SlideDecorations';
import { LessonImageBackdrop } from './LessonImageBackdrop';

import { QuizSlide } from './QuizSlide';
import { FlashcardSlide } from './FlashcardSlide';
import { MatchingSlide } from './MatchingSlide';
import { OrderingSlide } from './OrderingSlide';
import { FillInBlankSlide } from './FillInBlankSlide';
import { ChevronDown, BookOpen, Lightbulb, Target, MessageSquareQuote, CheckCircle2, PenLine, Brain } from 'lucide-react';
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
  lessonImageUrl?: string;
  showHeaderCounter?: boolean;
  onStarEarned?: () => void;
  gamificationEnabled?: boolean;
}

const captionClasses: Record<CaptionStyle, string> = {
  light: 'bg-white text-slate-900 shadow-2xl border-2 border-white/80 ring-1 ring-black/5',
  dark: 'bg-slate-900/95 backdrop-blur-md text-white shadow-2xl border border-white/10',
};

/** Whether a caption style produces light (dark text) or dark (white text) */
function isLightCaption(style: CaptionStyle): boolean {
  return style === 'light';
}

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

/** Detect slide semantic type from heading text for visual tagging */
function detectSlideTag(heading?: string, bodyHtml?: string): {
  icon: typeof BookOpen;
  label: string;
  labelFr: string;
} | null {
  if (!heading) return null;
  const h = heading.toLowerCase();
  const b = (bodyHtml || '').toLowerCase();

  if (h.includes('case study') || h.includes('étude de cas') || h.includes('real-world') || h.includes('exemple'))
    return { icon: Lightbulb, label: 'Case Study', labelFr: 'Étude de cas' };
  if (h.includes('exercise') || h.includes('exercice') || h.includes('practice') || h.includes('pratique') || h.includes('activity') || h.includes('activité'))
    return { icon: PenLine, label: 'Exercise', labelFr: 'Exercice' };
  if (h.includes('objective') || h.includes('objectif') || h.includes('goal') || h.includes('outcome'))
    return { icon: Target, label: 'Objective', labelFr: 'Objectif' };
  if (h.includes('reflection') || h.includes('réflexion') || h.includes('think about') || h.includes('self-check'))
    return { icon: Brain, label: 'Reflection', labelFr: 'Réflexion' };
  if (h.includes('summary') || h.includes('résumé') || h.includes('key takeaway') || h.includes('recap') || h.includes('récap'))
    return { icon: CheckCircle2, label: 'Summary', labelFr: 'Résumé' };
  if (h.includes('quote') || h.includes('citation') || b.includes('<blockquote'))
    return { icon: MessageSquareQuote, label: 'Quote', labelFr: 'Citation' };

  return null;
}

// Scrollable container with hidden scrollbar + scroll-down indicator
function ScrollableContent({
  captionStyle,
  captionClasses: captionClassMap,
  theme,
  hasImage,
  children,
}: {
  captionStyle: CaptionStyle;
  captionClasses: Record<CaptionStyle, string>;
  theme: ReturnType<typeof getSlideThemeFor>;
  /** When a real illustration sits behind, the card stays narrower so the photo reads. */
  hasImage?: boolean;
  children: React.ReactNode;
}) {

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight + 4;
    setCanScroll(hasOverflow);
    setIsAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 8);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, [checkScroll, children]);

  return (
    <div className="relative w-full max-w-3xl lg:max-w-4xl max-h-[86%]">
      <div
        ref={scrollRef}
          className={cn(
            'rounded-2xl w-full overflow-y-auto h-full',
            'scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
            cn(captionClassMap[captionStyle], 'px-6 py-6 sm:px-8 sm:py-7', theme.captionGlow)
          )}
      >
        {children}
      </div>
      {canScroll && !isAtBottom && (
        <button
          onClick={() => scrollRef.current?.scrollBy({ top: 120, behavior: 'smooth' })}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-20"
        >
          <ChevronDown className={cn('h-5 w-5 drop-shadow-md', captionStyle === 'light' ? 'text-slate-600' : 'text-white/70')} />
          <ChevronDown className={cn('h-5 w-5 -mt-3 drop-shadow-md', captionStyle === 'light' ? 'text-slate-400' : 'text-white/40')} />
        </button>
      )}
    </div>
  );
}

export function SlideRenderer({
  slide,
  slideIndex,
  totalSlides,
  lessonTitle,
  moduleTitle,
  orgLogoUrl,
  deviceMode,
  customization,
  lessonImageUrl,
  showHeaderCounter = true,
  onStarEarned,
  gamificationEnabled,
}: SlideRendererProps) {
  // Per-course visual signature: the decorative layer is unique to each course
  // instead of the same rotation for everyone.
  const theme = getSlideThemeFor(`${moduleTitle || ''}|${lessonTitle || ''}`, slideIndex);

  const isMobile = deviceMode === 'mobile';
  const c = customization;

  // Interactive slides
  if (slide.type === 'quiz' && slide.quiz) {
    return (
      <QuizSlide
        quiz={slide.quiz} theme={theme} slideIndex={slideIndex} totalSlides={totalSlides}
        lessonTitle={lessonTitle} orgLogoUrl={orgLogoUrl} deviceMode={deviceMode}
        lessonImageUrl={lessonImageUrl}
        onStarEarned={onStarEarned} gamificationEnabled={gamificationEnabled}
      />
    );
  }
  if (slide.type === 'flashcard' && slide.flashcard) {
    return (
      <FlashcardSlide
        flashcard={slide.flashcard} theme={theme} slideIndex={slideIndex} totalSlides={totalSlides}
        lessonTitle={lessonTitle} orgLogoUrl={orgLogoUrl} deviceMode={deviceMode}
        lessonImageUrl={lessonImageUrl}
        onStarEarned={onStarEarned} gamificationEnabled={gamificationEnabled}
      />
    );
  }
  if (slide.type === 'matching' && slide.matching) {
    return (
      <MatchingSlide
        matching={slide.matching} theme={theme} slideIndex={slideIndex} totalSlides={totalSlides}
        lessonTitle={lessonTitle} orgLogoUrl={orgLogoUrl} deviceMode={deviceMode}
        lessonImageUrl={lessonImageUrl}
        onStarEarned={onStarEarned} gamificationEnabled={gamificationEnabled}
      />
    );
  }
  if (slide.type === 'ordering' && slide.ordering) {
    return (
      <OrderingSlide
        ordering={slide.ordering} theme={theme} slideIndex={slideIndex} totalSlides={totalSlides}
        lessonTitle={lessonTitle} orgLogoUrl={orgLogoUrl} deviceMode={deviceMode}
        lessonImageUrl={lessonImageUrl}
        onStarEarned={onStarEarned} gamificationEnabled={gamificationEnabled}
      />
    );
  }
  if (slide.type === 'fill-in-blank' && slide.fillInBlank) {
    return (
      <FillInBlankSlide
        fillInBlank={slide.fillInBlank} theme={theme} slideIndex={slideIndex} totalSlides={totalSlides}
        lessonTitle={lessonTitle} orgLogoUrl={orgLogoUrl} deviceMode={deviceMode}
        lessonImageUrl={lessonImageUrl}
        onStarEarned={onStarEarned} gamificationEnabled={gamificationEnabled}
      />
    );
  }

  const bgStyle: React.CSSProperties = c?.bgColor ? { background: c.bgColor } : {};
  const backgroundImageUrl = c?.bgImageUrl || lessonImageUrl;
  const hasBgImage = !!backgroundImageUrl;
  const layout: string = c?.layout || 'text-only';
  const captionStyle = c?.captionStyle || 'light';
  const captionPos = c?.captionPosition || 'bottom';
  const imgPos = c?.imagePosition || 'middle';

  const gradientClass = !c?.bgColor ? `bg-gradient-to-br ${theme.gradient}` : '';

  const slideTag = detectSlideTag(slide.heading, slide.bodyHtml);

  const Header = () => (
    <div className="flex items-center gap-2.5 px-5 py-3 relative z-20">
      {orgLogoUrl ? (
        <img src={orgLogoUrl} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-white/20" loading="lazy" decoding="async" />
      ) : (
        <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
          {moduleTitle?.[0] || 'C'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span className="text-xs text-white/70 font-medium block truncate">{lessonTitle}</span>
        {moduleTitle && (
          <span className="text-[10px] text-white/50 block truncate">{moduleTitle}</span>
        )}
      </div>
      {showHeaderCounter && (
        <span className="text-[10px] bg-white/15 rounded-full px-2.5 py-0.5 text-white/80 font-medium shrink-0">
          {slideIndex + 1} / {totalSlides}
        </span>
      )}
    </div>
  );

  const AccentLine = ({ className, light }: { className?: string; light?: boolean }) => (
    <div
      className={cn('h-0.5 rounded-full opacity-60 mb-3', className)}
      style={{ background: light ? 'hsl(220, 60%, 30%)' : theme.accentColor, width: '3rem' }}
    />
  );

  const lightMode = isLightCaption(captionStyle);

  const SlideTag = () => {
    if (!slideTag) return null;
    const Icon = slideTag.icon;
    return (
      <div className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider mb-3',
        lightMode
          ? 'bg-slate-800 text-white'
          : cn(theme.tagBg, theme.tagText)
      )}>
        <Icon className="h-3 w-3" />
        {slideTag.label}
      </div>
    );
  };

  const proseClasses = cn(
    'prose max-w-none',
    'prose-headings:font-bold prose-p:leading-relaxed prose-p:mb-3',
    'prose-strong:font-bold prose-em:italic',
    'prose-li:leading-relaxed prose-li:mb-1',
    'prose-ul:mb-3 prose-ol:mb-3',
    'prose-blockquote:border-l-2 prose-blockquote:opacity-80 prose-blockquote:rounded-lg prose-blockquote:px-4 prose-blockquote:py-3 prose-blockquote:my-3 prose-blockquote:bg-white/5',
    'prose-a:text-blue-300',
    'prose-img:rounded-lg prose-img:max-h-[140px] prose-img:w-auto prose-img:mx-auto prose-img:object-contain',
    'prose-video:rounded-lg prose-video:max-h-[160px] prose-video:w-full',
    'prose-iframe:rounded-lg prose-iframe:max-h-[160px] prose-iframe:w-full',
    lightMode
      ? 'prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-900 prose-blockquote:text-slate-600 prose-blockquote:border-slate-300 prose-blockquote:bg-slate-100/50 prose-a:text-blue-600'
      : 'prose-invert prose-headings:text-white prose-p:text-white/90 prose-li:text-white/90 prose-strong:text-white prose-blockquote:text-white/70 prose-blockquote:border-white/30',
    isMobile ? 'prose-sm' : 'prose-base'
  );

  // ── Title Card ──
  if (slide.type === 'title-card') {
    const titleBgImage = c?.bgImageUrl || lessonImageUrl;
    const hasTitleBg = !!titleBgImage;

    return (
      <div className={cn('h-full flex flex-col text-white relative overflow-hidden', gradientClass)} style={bgStyle}>
        {hasTitleBg ? (
          <LessonImageBackdrop imageUrl={titleBgImage} imageClassName={imagePositionClasses[imgPos]} focus="bottom" />
        ) : null}
        {!hasTitleBg && <SlideDecoration theme={theme} />}

        <div className="relative z-20"><Header /></div>
        <div className={cn('flex-1 flex flex-col justify-end px-6 pb-10 z-10 relative')}>
          <div className="max-w-lg">
            {moduleTitle && (
              <p className="text-[11px] uppercase tracking-[0.2em] mb-3 font-semibold text-white/70">{moduleTitle}</p>
            )}
            <AccentLine />
            <h1 className={cn('font-bold leading-tight mb-3', isMobile ? 'text-2xl' : 'text-4xl')}>
              {lessonTitle}
            </h1>
            {slide.bodyHtml && (
              <p className="text-white/60 text-sm leading-relaxed max-w-md" dangerouslySetInnerHTML={{ __html: slide.bodyHtml }} />
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
        <LessonImageBackdrop
          imageUrl={c!.bgImageUrl}
          imageClassName={imagePositionClasses[imgPos]}
          focus={captionPos === 'top' ? 'top' : captionPos === 'middle' ? 'center' : 'bottom'}
        />
        <Header />
        <div className={cn('flex-1 flex flex-col relative z-10 px-6', captionPositionClasses[captionPos])}>
          <div className={cn('rounded-xl px-5 py-6 max-w-lg', captionClasses[captionStyle], 'border border-white/10', theme.captionGlow)}>

            <SlideTag />
            {slide.heading && <h2 className={cn('font-bold leading-snug mb-3', lightMode ? 'text-slate-900' : 'text-white', isMobile ? 'text-xl' : 'text-2xl')}>{slide.heading}</h2>}
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
            <img src={c!.bgImageUrl} alt="" className={cn('absolute inset-0 w-full h-full object-cover', imagePositionClasses[imgPos])} loading="lazy" decoding="async" />
          </div>
          <div className={cn('flex flex-col p-5', isMobile ? 'flex-1' : 'w-1/2', captionPositionClasses[captionPos])}>
            <div className={cn('rounded-xl px-4 py-5 border border-white/10', captionClasses[captionStyle])}>
              <SlideTag />
              {slide.heading && <h2 className={cn('font-bold leading-snug mb-3', lightMode ? 'text-slate-900' : 'text-white', isMobile ? 'text-lg' : 'text-2xl')}>{slide.heading}</h2>}
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
          <img src={c!.bgImageUrl} alt="" className={cn('absolute inset-0 w-full h-full object-cover', imagePositionClasses[imgPos])} loading="lazy" decoding="async" />
        </div>
        <div className={cn('flex-1 flex flex-col relative z-10 px-5 py-4', captionPositionClasses[captionPos])}>
          <div className={cn('rounded-xl px-5 py-5 border border-white/10', captionClasses[captionStyle])}>
            <SlideTag />
            {slide.heading && <h2 className={cn('font-bold leading-snug mb-3', lightMode ? 'text-slate-900' : 'text-white', isMobile ? 'text-xl' : 'text-2xl')}>{slide.heading}</h2>}
            {slide.bodyHtml && <div className={proseClasses} dangerouslySetInnerHTML={{ __html: slide.bodyHtml }} />}
          </div>
        </div>
      </div>
    );
  }

  // Default: Text-only
  return (
    <div className={cn('h-full flex flex-col text-white relative overflow-hidden', gradientClass)} style={bgStyle}>
      {hasBgImage ? (
        <LessonImageBackdrop
          imageUrl={backgroundImageUrl}
          imageClassName={imagePositionClasses[imgPos]}
          focus={captionPos === 'top' ? 'top' : captionPos === 'middle' ? 'center' : 'bottom'}
        />
      ) : null}
      {/* Decorations belong to gradient slides only — they must never sit on top
          of an AI illustration and dull it. */}
      {!hasBgImage && <SlideDecoration theme={theme} />}

      <div className="relative z-20"><Header /></div>

      <div className={cn('absolute inset-0 flex flex-col z-10', isMobile ? 'px-5' : 'px-8', captionPositionClasses[captionPos])}>
        <ScrollableContent
          captionStyle={captionStyle}
          captionClasses={captionClasses}
          theme={theme}
        >
          <SlideTag />
          {slide.heading && (
            <div className="mb-4">
              <AccentLine light={lightMode} />
              <h2 className={cn('font-bold leading-snug', lightMode ? 'text-slate-900' : 'text-white', isMobile ? 'text-xl' : 'text-2xl')}>{slide.heading}</h2>
            </div>
          )}
          {slide.bodyHtml && (
            <div className={proseClasses} dangerouslySetInnerHTML={{ __html: slide.bodyHtml }} />
          )}
        </ScrollableContent>
      </div>
    </div>
  );
}
