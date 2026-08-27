import { useCallback, useRef, useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { AdaptiveLayout } from '@/components/layout/AdaptiveLayout';
import { PlatformSetupStep, type PlatformSetupValues } from '@/components/write/PlatformSetupStep';
import { createWorkspace } from '@/lib/siteviral/createWorkspace';
import { useOrg } from '@/contexts/OrgContext';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';
import type { PlatformIdentity } from '@/lib/siteviral/identities';

interface Props {
  /** Where to go once the platform exists (e.g. /admin/programs). */
  redirectTo: string;
  defaultIdentity?: PlatformIdentity;
  title?: string;
  subtitle?: string;
}

/**
 * The single, professional "create your platform" screen used by every
 * creation entry point (write a book, create a course, sell) when the signed-in
 * user has no platform yet. Same three questions as the wizard's last step:
 * what you sell, platform name, selling currency.
 */
export function PlatformOnboardingScreen({ redirectTo, defaultIdentity = 'creator', title, subtitle }: Props) {
  const navigate = useNavigate();
  const { refetchOrgs, setCurrentOrg } = useOrg();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [submitting, setSubmitting] = useState(false);
  const busyRef = useRef(false);

  const onConfirm = useCallback(async ({ name, currency, world, category }: PlatformSetupValues) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setSubmitting(true);
    try {
      const { org } = await createWorkspace({ name, world, currency, category });
      if (org) setCurrentOrg(org as any);
      await refetchOrgs();
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      toast({
        title: isFr ? '❌ Création impossible' : '❌ Could not create platform',
        description: err?.message,
        variant: 'destructive',
      });
      busyRef.current = false;
      setSubmitting(false);
    }
  }, [navigate, redirectTo, refetchOrgs, setCurrentOrg, toast, isFr]);

  return (
    <AdaptiveLayout>
      <div className="container max-w-2xl px-4 pb-24">
        <PlatformSetupStep
          defaultIdentity={defaultIdentity}
          submitting={submitting}
          onConfirm={onConfirm}
          title={title}
          subtitle={subtitle}
          ctaLabel={isFr ? 'Créer et continuer' : 'Create and continue'}
        />
      </div>
    </AdaptiveLayout>
  );
}
