import { Lock, LogIn, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { setPendingAction } from '@/lib/pendingAction';
import { buildCourseSlideLink } from '@/lib/coursePreview';

interface PreviewPaywallSlideProps {
  programId: string;
  courseTitle: string;
  priceLabel?: string;
  /** the slide the visitor was trying to reach */
  lockedSlideId: string | null;
  lockedSlideIndex: number;
  lessonTitle?: string;
  previewedSlides: number;
  onRequestAccess?: () => void;
}

/**
 * Rendered in place of the first non-preview slide.
 * The exact blocked slide is encoded into the post-sign-in returnTo so the
 * visitor lands back on that slide instead of restarting the course.
 */
export function PreviewPaywallSlide({
  programId,
  courseTitle,
  priceLabel,
  lockedSlideId,
  lockedSlideIndex,
  lessonTitle,
  previewedSlides,
  onRequestAccess,
}: PreviewPaywallSlideProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const navigate = useNavigate();
  const { user } = useAuth();

  const returnTo = buildCourseSlideLink(programId, { slideId: lockedSlideId, slideIndex: lockedSlideIndex });

  const handleSignIn = () => {
    setPendingAction('resume_course', returnTo, {
      programId,
      slideId: lockedSlideId,
      slideIndex: lockedSlideIndex,
    });
    navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-5 px-6 py-10 text-center bg-gradient-to-b from-muted/40 to-background">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Lock className="h-7 w-7 text-primary" />
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-bold">
          {isFr ? 'Fin de l’aperçu gratuit' : 'End of the free preview'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isFr
            ? `Vous avez vu ${previewedSlides} diapositive${previewedSlides !== 1 ? 's' : ''} de « ${courseTitle} ». La suite${lessonTitle ? ` (${lessonTitle})` : ''} est réservée aux inscrits.`
            : `You have seen ${previewedSlides} slide${previewedSlides !== 1 ? 's' : ''} of “${courseTitle}”. The rest${lessonTitle ? ` (${lessonTitle})` : ''} is for enrolled learners.`}
        </p>
        <p className="text-xs text-muted-foreground">
          {isFr
            ? 'Après connexion, vous reprendrez exactement sur cette diapositive.'
            : 'After signing in you will land back on this exact slide.'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-sm">
        {user ? (
          <Button size="lg" className="w-full gap-2 font-semibold" onClick={onRequestAccess}>
            <ShoppingCart className="h-4 w-4" />
            {priceLabel
              ? (isFr ? `Débloquer — ${priceLabel}` : `Unlock — ${priceLabel}`)
              : (isFr ? 'Débloquer le cours' : 'Unlock the course')}
          </Button>
        ) : (
          <>
            <Button size="lg" className="w-full gap-2 font-semibold" onClick={handleSignIn}>
              <LogIn className="h-4 w-4" />
              {isFr ? 'Créer un compte / Se connecter' : 'Sign up / Sign in'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
