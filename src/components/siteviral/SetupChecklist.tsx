import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Circle, ArrowRight, ListChecks, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgFeatures } from '@/hooks/useOrgFeatures';
import { useOrgReadiness } from '@/hooks/useOrgReadiness';
import { useI18n } from '@/i18n/I18nContext';
import { FEATURE_ROUTES } from '@/lib/siteviral/featureRoutes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ChecklistItem {
  key: string;
  labelFr: string;
  labelEn: string;
  done: boolean;
  route: string;
  /** Only show when the corresponding feature is active. Undefined = always. */
  requiresFeature?: string;
}

/**
 * Setup checklist: guides the user from "feature activated" → "feature configured"
 * → "visible public section". Read-only: never mutates data.
 */
export function SetupChecklist() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const { currentOrg } = useOrg();
  const { features } = useOrgFeatures();
  const { readiness, counts, isLoading } = useOrgReadiness();
  const isFr = locale === 'fr';

  const items: ChecklistItem[] = useMemo(() => {
    if (!currentOrg) return [];
    const orgAny = currentOrg as any;
    const profileDone = !!(currentOrg.name && currentOrg.description && currentOrg.logo_url);
    const kycDone = currentOrg.kyc_status === 'level1' || currentOrg.kyc_status === 'level2';
    const kycPending = currentOrg.kyc_status === 'pending';

    return [
      {
        key: 'profile',
        labelFr: 'Profil de la page complété',
        labelEn: 'Page profile completed',
        done: profileDone,
        route: '/admin/settings',
      },
      {
        key: 'payment',
        labelFr: 'Paiements configurés',
        labelEn: 'Payments configured',
        done: !!(orgAny.paystack_subaccount_code || orgAny.payout_method),
        route: '/admin/settings',
        requiresFeature: 'payment',
      },
      {
        key: 'digital_products',
        labelFr: 'Premier produit ajouté',
        labelEn: 'First product added',
        done: counts.products > 0,
        route: FEATURE_ROUTES.digital_products.firstActionRoute,
        requiresFeature: 'digital_products',
      },
      {
        key: 'appointment',
        labelFr: 'Rendez-vous configurés',
        labelEn: 'Appointments set up',
        done: !!readiness.appointment,
        route: FEATURE_ROUTES.appointment.setupRoute,
        requiresFeature: 'appointment',
      },
      {
        key: 'donation_gifts',
        labelFr: 'Dons / campagne configurés',
        labelEn: 'Donations / campaign set up',
        done: counts.campaigns + counts.offerings > 0,
        route: FEATURE_ROUTES.donation_gifts.firstActionRoute,
        requiresFeature: 'donation_gifts',
      },
      {
        key: 'events',
        labelFr: 'Premier événement publié',
        labelEn: 'First event published',
        done: counts.events > 0,
        route: FEATURE_ROUTES.events.firstActionRoute,
        requiresFeature: 'events',
      },
      {
        key: 'ai_formation_creation',
        labelFr: 'Première formation publiée',
        labelEn: 'First formation published',
        done: counts.programs > 0,
        route: FEATURE_ROUTES.ai_formation_creation.firstActionRoute,
        requiresFeature: 'ai_formation_creation',
      },
      {
        key: 'location',
        labelFr: 'Localisation renseignée',
        labelEn: 'Location added',
        done: !!readiness.location,
        route: FEATURE_ROUTES.location.setupRoute,
        requiresFeature: 'location',
      },
      {
        key: 'kyc',
        labelFr: kycPending ? 'KYC en attente de vérification' : 'KYC vérifié',
        labelEn: kycPending ? 'KYC pending review' : 'KYC verified',
        done: kycDone,
        route: '/admin/kyc',
      },
      {
        key: 'public_page',
        labelFr: 'Page publique prête',
        labelEn: 'Public page ready',
        // "Ready" = profile done + at least one publicly-visible section has data.
        done: profileDone && (counts.products + counts.campaigns + counts.offerings + counts.events + counts.programs + counts.photos > 0),
        route: `/org/${currentOrg.slug}`,
      },
    ];
  }, [currentOrg, counts, readiness]);

  if (isLoading || !currentOrg) return null;

  const visible = items.filter(i => !i.requiresFeature || features.has(i.requiresFeature as any));
  const doneCount = visible.filter(i => i.done).length;
  const total = visible.length;
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  return (
    <section className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <ListChecks className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {isFr ? 'Prêt pour le public' : 'Page readiness'}
            </div>
            <div className="text-sm font-semibold">
              {doneCount} / {total} {isFr ? 'étapes complétées' : 'steps completed'}
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => window.open(`/org/${currentOrg.slug}?as=visitor`, '_blank')}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {isFr ? 'Aperçu visiteur' : 'Preview as visitor'}
        </Button>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full bg-primary"
        />
      </div>

      {/* Items */}
      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {visible.map((item) => (
          <li key={item.key}>
            <button
              onClick={() => navigate(item.route)}
              className={cn(
                'group flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs transition-all',
                item.done
                  ? 'border-primary/20 bg-primary/5 text-foreground'
                  : 'border-border bg-background hover:border-foreground/20 hover:-translate-y-0.5'
              )}
            >
              {item.done ? (
                <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </div>
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
              )}
              <span className={cn('flex-1 truncate', item.done && 'text-muted-foreground line-through decoration-primary/40')}>
                {isFr ? item.labelFr : item.labelEn}
              </span>
              {!item.done && (
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
