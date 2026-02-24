import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Home, ShoppingBag, Bell, User, BarChart3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

const TOUR_VERSION = 'v2';
const TOUR_STORAGE_KEY = `gc_onboarding_done_${TOUR_VERSION}`;

interface TourStep {
  selector: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right';
  fallbackPosition?: { top: number; left: number };
}

const STEPS: TourStep[] = [
  {
    selector: '[data-tour="admin-overview"]',
    title: 'Dashboard Overview',
    description: 'See your platform performance at a glance — revenue, members, and engagement metrics.',
    icon: <BarChart3 className="h-5 w-5" />,
    position: 'right',
  },
  {
    selector: '[data-tour="admin-media"]',
    title: 'Content Management',
    description: 'Upload and manage videos, audio, and other media content for your community.',
    icon: <Home className="h-5 w-5" />,
    position: 'right',
  },
  {
    selector: '[data-tour="admin-products"]',
    title: 'Digital Products',
    description: 'Create and sell ebooks, courses, and digital resources to your audience.',
    icon: <ShoppingBag className="h-5 w-5" />,
    position: 'right',
  },
];

function getTooltipStyles(
  rect: DOMRect | null,
  position: TourStep['position'],
  fallback?: { top: number; left: number }
): React.CSSProperties {
  const base: React.CSSProperties = { position: 'fixed', zIndex: 10002 };
  const isMobile = window.innerWidth < 640;

  if (!rect) {
    return fallback
      ? { ...base, top: fallback.top, left: fallback.left }
      : { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }

  const gap = 14;

  // On mobile, always position below the target element, centered horizontally
  if (isMobile) {
    return {
      ...base,
      top: Math.min(rect.bottom + gap, window.innerHeight - 220),
      left: 16,
      right: 16,
      transform: 'none',
    };
  }

  switch (position) {
    case 'bottom':
      return { ...base, top: rect.bottom + gap, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' };
    case 'top':
      return { ...base, bottom: window.innerHeight - rect.top + gap, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' };
    case 'left':
      return { ...base, top: rect.top + rect.height / 2, right: window.innerWidth - rect.left + gap, transform: 'translateY(-50%)' };
    case 'right':
      return { ...base, top: rect.top + rect.height / 2, left: rect.right + gap, transform: 'translateY(-50%)' };
  }
}

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number>(0);
  const { user } = useAuth();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

  // Only show for authenticated users on /admin routes
  useEffect(() => {
    if (!user || !isAdminRoute) {
      setActive(false);
      return;
    }
    const done = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!done) {
      const t = setTimeout(() => setActive(true), 1200);
      return () => clearTimeout(t);
    }
  }, [user, isAdminRoute]);

  // Track target element position
  const updateRect = useCallback(() => {
    if (!active) return;
    const currentStep = STEPS[step];
    if (!currentStep) return;
    const el = document.querySelector(currentStep.selector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
    rafRef.current = requestAnimationFrame(updateRect);
  }, [active, step]);

  useEffect(() => {
    if (active) {
      rafRef.current = requestAnimationFrame(updateRect);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, updateRect]);

  const finish = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setActive(false);
  }, []);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  }, [step, finish]);

  const prev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  // Keyboard navigation
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, next, prev, finish]);

  if (!active) return null;

  const currentStep = STEPS[step];
  const spotlightPadding = 8;
  const spotlightRadius = 12;

  return createPortal(
    <AnimatePresence>
      {active && (
        <>
          {/* Overlay with spotlight cutout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000]"
            onClick={finish}
          >
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <mask id="tour-spotlight">
                  <rect width="100%" height="100%" fill="white" />
                  {targetRect && (
                    <rect
                      x={targetRect.left - spotlightPadding}
                      y={targetRect.top - spotlightPadding}
                      width={targetRect.width + spotlightPadding * 2}
                      height={targetRect.height + spotlightPadding * 2}
                      rx={spotlightRadius}
                      ry={spotlightRadius}
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.65)"
                mask="url(#tour-spotlight)"
              />
            </svg>
          </motion.div>

          {/* Spotlight ring */}
          {targetRect && (
            <motion.div
              key={`ring-${step}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed z-[10001] pointer-events-none rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-transparent"
              style={{
                top: targetRect.top - spotlightPadding,
                left: targetRect.left - spotlightPadding,
                width: targetRect.width + spotlightPadding * 2,
                height: targetRect.height + spotlightPadding * 2,
              }}
            />
          )}

          {/* Tooltip card */}
          <motion.div
            key={`tooltip-${step}`}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={getTooltipStyles(targetRect, currentStep.position, currentStep.fallbackPosition)}
            className="w-full sm:w-[320px] max-w-[calc(100vw-32px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-card border border-border rounded-2xl shadow-elevated p-5 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                    {currentStep.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{currentStep.title}</h3>
                    <p className="text-[10px] text-muted-foreground">
                      Step {step + 1} / {STEPS.length}
                    </p>
                  </div>
                </div>
                <button
                  onClick={finish}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Close tour"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentStep.description}
              </p>

              {/* Progress bar */}
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-all duration-300',
                      i <= step ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={finish}
                    className="h-8 text-xs text-muted-foreground"
                  >
                    Skip
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prev}
                    disabled={step === 0}
                    className="h-8 text-xs gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Back
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={next}
                  className="h-8 text-xs gap-1 bg-primary text-primary-foreground"
                >
                  {step === STEPS.length - 1 ? (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Done
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
