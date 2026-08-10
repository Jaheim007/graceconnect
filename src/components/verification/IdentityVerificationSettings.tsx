import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShieldCheck, Shield, Building, User, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import IdentityVerificationWizard from './IdentityVerificationWizard';
import { resolveVerificationFlow, verificationTypeFor } from '@/lib/siteviral/verificationFlow';

interface Props {
  orgId: string;
  orgCategory?: string | null;
  kycStatus?: string | null;
}

/**
 * Settings → Identity verification.
 *
 * Shows the platform's verification state and starts the *correct* flow
 * automatically: KYC (personal ID) for Creator / Community platforms, KYB
 * (legal registration + statutes + representative ID) for Church / NGO.
 * The user is never asked to pick.
 */
export default function IdentityVerificationSettings({ orgId, orgCategory, kycStatus }: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const [started, setStarted] = useState(false);

  const flow = resolveVerificationFlow(orgCategory);
  const forcedType = verificationTypeFor(orgCategory);
  const isKyb = flow === 'kyb';

  const status = kycStatus || 'none';
  const verified = status === 'level1' || status === 'level2' || status === 'approved';
  const pending = status === 'pending';

  const { data: submission } = useQuery({
    queryKey: ['org-kyc-submission', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await db
        .from('kyc_submissions')
        .select('status, verification_type, submitted_at, reviewed_at, rejection_reason')
        .eq('organization_id', orgId)
        .maybeSingle();
      return data as any;
    },
  });

  const verifiedDate = submission?.reviewed_at
    ? new Date(submission.reviewed_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  /* ── Verified state ── */
  if (verified) {
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="relative p-6 sm:p-8 text-center">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-16 h-40 bg-emerald-500/10 blur-3xl" />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto h-16 w-16 rounded-2xl bg-emerald-500/15 ring-1 ring-inset ring-emerald-500/30 grid place-items-center"
          >
            <ShieldCheck className="h-8 w-8 text-emerald-600" />
          </motion.div>
          <div className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t('Vérifié', 'Verified')}
          </div>
          <h2 className="relative mt-3 text-lg font-bold tracking-tight">
            {isKyb
              ? t('Organisation vérifiée', 'Organization verified')
              : t('Identité vérifiée', 'Identity verified')}
          </h2>
          <p className="relative mt-1.5 text-sm text-muted-foreground max-w-md mx-auto">
            {t(
              'Votre identité est vérifiée. Vous avez un accès complet aux retraits et aux paiements.',
              'Your identity is verified. You have full access to withdrawals and payouts.'
            )}
          </p>
          {verifiedDate && (
            <p className="relative mt-3 text-xs text-muted-foreground">
              {t('Vérification complétée le', 'Verification completed on')}{' '}
              <span className="font-semibold text-foreground">{verifiedDate}</span>
            </p>
          )}
          <div className="relative mt-5 inline-flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {isKyb ? <Building className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
            {isKyb
              ? t('Vérification organisation (KYB)', 'Organization verification (KYB)')
              : t('Vérification personnelle (KYC)', 'Personal verification (KYC)')}
          </div>
        </div>
      </div>
    );
  }

  /* ── Wizard (started, pending or rejected retry) ── */
  if (started || pending || status === 'rejected') {
    return (
      <IdentityVerificationWizard
        mode="org"
        entityId={orgId}
        status={status}
        rejectionReason={submission?.rejection_reason || null}
        orgCategory={orgCategory || undefined}
        forcedVerificationType={forcedType}
      />
    );
  }

  /* ── Not verified: explain + single CTA ── */
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="relative p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-16 h-40 bg-primary/10 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 ring-1 ring-inset ring-primary/20 grid place-items-center shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight">
              {t("Vérification d'identité", 'Identity verification')}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isKyb
                ? t(
                    "Nous confirmons que votre organisation existe légalement et que vous êtes autorisé à la représenter.",
                    'We confirm your organization legally exists and that you are authorized to represent it.'
                  )
                : t(
                    'Nous confirmons votre identité personnelle avec une pièce officielle et un selfie.',
                    'We confirm your personal identity with a government ID and a selfie.'
                  )}
            </p>
          </div>
        </div>

        <div className="relative mt-5 rounded-xl border border-amber-500/25 bg-amber-500/8 p-4">
          <p className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            {t('Pourquoi est-ce requis ?', 'Why is it required?')}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            {t(
              'La vérification débloque les retraits et les versements de vos revenus. Vous pouvez continuer à vendre, collecter des dons et gérer votre plateforme sans être vérifié — mais pas retirer votre argent.',
              'Verification unlocks withdrawals and payouts of your earnings. You can keep selling, collecting donations and running your platform without it — but not withdraw your money.'
            )}
          </p>
        </div>

        <div className="relative mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('Ce que vous devez préparer', "What you'll need")}
          </p>
          {(isKyb
            ? [
                t("Document d'enregistrement légal de l'organisation", 'Legal registration document of the organization'),
                t('Statuts / règlement intérieur', 'Bylaws / statutes'),
                t("Pièce d'identité du représentant + selfie", "Representative's government ID + selfie"),
              ]
            : [
                t("Une pièce d'identité officielle", 'A government-issued ID'),
                t('Un selfie (contrôle de vivacité)', 'A selfie (liveness check)'),
                t('Vos coordonnées de paiement', 'Your payout details'),
              ]
          ).map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 p-3">
              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span className="text-xs">{item}</span>
            </div>
          ))}
        </div>

        <Button className="relative mt-5 w-full sm:w-auto gap-2" onClick={() => setStarted(true)}>
          {t('Commencer la vérification', 'Start verification')}
          <ArrowRight className="h-4 w-4" />
        </Button>

        <p className="relative mt-3 text-[11px] text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          {t('Environ 5 minutes. Réponse sous 48h ouvrées.', 'About 5 minutes. Reviewed within 2 business days.')}
        </p>
      </div>
    </div>
  );
}
