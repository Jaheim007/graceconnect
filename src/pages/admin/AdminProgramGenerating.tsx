/**
 * AI course generation — /admin/programs/generating
 *
 * The creation dialogs no longer show the generation animation themselves: they
 * close immediately and hand the request over to this page. One single loading
 * surface, no dialog → page loader hand-off, no double animation.
 */
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AdminPageShell } from './AdminPageShell';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { useStartCourseDraft } from '@/hooks/useCourseDraft';
import { draftErrorMessage } from '@/lib/courseDraftErrors';
import { CourseGenerationLoader } from '@/components/programs/CourseGenerationLoader';
import { InsufficientCreditsDialog } from '@/components/credits/InsufficientCreditsDialog';

type StartInput = Parameters<ReturnType<typeof useStartCourseDraft>['mutateAsync']>[0];

interface GenerationState {
  input?: StartInput;
  mode?: 'ai' | 'convert';
}

export default function AdminProgramGenerating() {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { handleAiError, refreshCredits, showCreditDialog, setShowCreditDialog, creditErrorMessage } = useCreditGuard();

  const state = (location.state || {}) as GenerationState;
  const startDraft = useStartCourseDraft();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    if (!state.input) {
      navigate('/admin/programs', { replace: true });
      return;
    }
    started.current = true;
    startDraft.mutate(state.input, {
      onSuccess: (result) => {
        refreshCredits();
        navigate(`/admin/programs/draft/${result.project_id}`, { replace: true });
      },
      onError: (err: any) => {
        const isCreditError = handleAiError(err);
        if (!isCreditError) setError(draftErrorMessage(err, isFr));
        else setError(isFr ? 'Crédits insuffisants pour cette génération.' : 'Not enough credits for this generation.');
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <AdminPageShell title={isFr ? 'Génération échouée' : 'Generation failed'}>
        <div className="max-w-md mx-auto flex flex-col items-center gap-4 py-16 text-center">
          <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/programs')}>
              {isFr ? 'Retour aux cours' : 'Back to courses'}
            </Button>
            <Button
              onClick={() => {
                setError(null);
                started.current = false;
                navigate('/admin/programs/generating', { replace: true, state });
              }}
            >
              {isFr ? 'Réessayer' : 'Retry'}
            </Button>
          </div>
        </div>
        <InsufficientCreditsDialog open={showCreditDialog} onOpenChange={setShowCreditDialog} message={creditErrorMessage} />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell title={isFr ? 'Génération du cours' : 'Generating course'}>
      <CourseGenerationLoader phase="generating" mode={state.mode || 'ai'} />
      <p className="mt-4 text-center text-[12px] text-muted-foreground">
        {isFr
          ? 'Vous pouvez quitter cette page : le brouillon est enregistré automatiquement dans le cloud.'
          : 'You can leave this page: the draft is auto-saved to the cloud.'}
      </p>
    </AdminPageShell>
  );
}
