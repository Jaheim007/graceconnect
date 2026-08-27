import { useNavigate } from '@/lib/router-compat';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import type { TypePresentation } from '@/lib/siteviral/typePresentation';
import type { Organization, SiteviralFeatureKey } from '@/types/database';
import { isFeatureEnabledForPublic } from '@/lib/siteviral/publicSections';
import type { FeatureReadiness } from '@/hooks/useOrgReadiness';

interface Props {
  presentation: TypePresentation;
  org: Pick<Organization, 'enabled_features' | 'features_confirmed_at'> | null | undefined;
  readiness: FeatureReadiness;
  onNavigate?: (path: string) => void;
}

/**
 * Owner-only banner: lists every enabled feature that is not yet "ready"
 * and offers a direct setup button, using the type-aware wording from
 * TYPE_PRESENTATION.emptyPrompts.
 *
 * Rendered only for admins (never for visitors, never inside preview-as-visitor).
 */
export function OwnerSetupPrompts({ presentation, org, readiness, onNavigate }: Props) {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const go = onNavigate ?? navigate;

  const items = (Object.entries(presentation.emptyPrompts) as [SiteviralFeatureKey, { fr: string; en: string; route: string }][])
    .filter(([feature]) => isFeatureEnabledForPublic(org, feature))
    .filter(([feature]) => readiness[feature] === false);

  if (items.length === 0) return null;

  return (
    <div className="container max-w-5xl px-4 mt-6 mb-2">
      <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 via-card to-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">
            {fr ? 'Finalisez votre page publique' : 'Finish setting up your public page'}
          </h3>
          <span className="ml-auto text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
            {fr ? 'Visible par vous uniquement' : 'Owner only'}
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map(([feature, prompt]) => (
            <button
              key={feature}
              onClick={() => go(prompt.route)}
              className="group flex items-center justify-between gap-2 rounded-xl border border-border bg-background/70 hover:bg-background hover:border-primary/40 px-3 py-2.5 text-left transition-all"
            >
              <span className="text-xs font-medium">{fr ? prompt.fr : prompt.en}</span>
              <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
