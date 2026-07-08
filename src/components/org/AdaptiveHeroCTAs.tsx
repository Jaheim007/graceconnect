import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import {
  CalendarClock, ShoppingBag, Heart, HandHeart, CalendarDays,
  GraduationCap, Star, MapPin, FileText, Share2, MessageSquare,
} from 'lucide-react';
import type { HeroCta, TypePresentation } from '@/lib/siteviral/typePresentation';
import type { Organization, SiteviralFeatureKey } from '@/types/database';
import { isFeatureEnabledForPublic } from '@/lib/siteviral/publicSections';
import type { FeatureReadiness } from '@/hooks/useOrgReadiness';

const ICONS: Record<string, any> = {
  CalendarClock, ShoppingBag, Heart, HandHeart, CalendarDays,
  GraduationCap, Star, MapPin, FileText, Share2, MessageSquare,
};

interface Props {
  presentation: TypePresentation;
  org: Pick<Organization, 'enabled_features' | 'features_confirmed_at'> | null | undefined;
  readiness: FeatureReadiness;
  isAdmin: boolean;
  onNavigateTab: (tab: string) => void;
}

/**
 * Adaptive hero CTA row driven by TYPE_PRESENTATION.
 * Visitors only see CTAs whose gating feature is enabled AND ready.
 * Owners always see enabled CTAs, with an "à configurer" hint when not ready.
 */
export function AdaptiveHeroCTAs({ presentation, org, readiness, isAdmin, onNavigateTab }: Props) {
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const visible = presentation.heroCTAs.filter((cta) => {
    if (!cta.requiresFeature) return true;
    if (!isFeatureEnabledForPublic(org, cta.requiresFeature)) return false;
    if (isAdmin) return true;
    return readiness[cta.requiresFeature] !== false;
  });

  if (visible.length === 0) return null;

  const isReady = (f?: SiteviralFeatureKey) => !f || readiness[f] !== false;

  return (
    <div className="container max-w-5xl px-4 mt-4">
      <div className="flex flex-wrap gap-2">
        {visible.map((cta: HeroCta) => {
          const Icon = cta.icon ? ICONS[cta.icon] : null;
          const notReadyForOwner = isAdmin && cta.requiresFeature && !isReady(cta.requiresFeature);
          const label = fr ? cta.labelFr : cta.labelEn;
          return (
            <Button
              key={cta.kind + cta.target}
              size="sm"
              variant={cta.variant === 'secondary' ? 'outline' : 'default'}
              onClick={() => onNavigateTab(cta.target)}
              className={cn('gap-1.5', notReadyForOwner && 'border-dashed opacity-90')}
              title={notReadyForOwner ? (fr ? 'À configurer' : 'Needs setup') : undefined}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {label}
              {notReadyForOwner && (
                <span className="ml-1 rounded-full bg-primary/15 text-primary px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider">
                  {fr ? 'setup' : 'setup'}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
