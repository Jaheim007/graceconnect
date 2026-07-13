import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Check, Plus, Settings2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgFeatures } from '@/hooks/useOrgFeatures';
import { useI18n } from '@/i18n/I18nContext';
import { db } from '@/lib/db';
import { FEATURE_META } from '@/lib/siteviral/config';
import { FEATURE_ROUTES } from '@/lib/siteviral/featureRoutes';
import type { SiteviralFeatureKey } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Adaptive dashboard header: renders active-feature cards + first-action prompts
 * based on the org's siteviral_type + enabled_features.
 *
 * - Non-destructive: renders nothing until org is loaded.
 * - Public page gating deferred: this only affects the admin/workspace surface.
 */
export function AdaptiveDashboard() {
  const { currentOrg } = useOrg();
  const { features, typeMeta, isLoading } = useOrgFeatures();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const isFr = locale === 'fr';

  const siteviralType = currentOrg?.siteviral_type as string | null | undefined;

  const activeKeys = useMemo(() => {
    const all = Array.from(features) as SiteviralFeatureKey[];
    if (siteviralType === 'digital_products') {
      // Digital sellers see only: Sell, Write a book, Create a course.
      // Product comments, events & donations are hidden here.
      const allow: SiteviralFeatureKey[] = [
        'digital_products', 'ai_book_creation', 'ai_formation_creation',
      ];
      const filtered = all.filter((k) => allow.includes(k));
      // Ensure Create a course is always available as a first-class action.
      if (!filtered.includes('ai_formation_creation')) filtered.push('ai_formation_creation');
      return filtered;
    }
    return all;
  }, [features, siteviralType]);

  // Detect empty state for the "first action" section — cheap counts only.
  const { data: emptiness } = useQuery({
    queryKey: ['adaptive-dashboard-emptiness', currentOrg?.id],
    enabled: !!currentOrg?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const orgId = currentOrg!.id;
      const [products, events, campaigns, programs] = await Promise.all([
        db.from('digital_products').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        db.from('events').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        db.from('donation_campaigns').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        db.from('programs').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      ]);
      return {
        digital_products: (products.count ?? 0) === 0,
        events: (events.count ?? 0) === 0,
        donation_gifts: (campaigns.count ?? 0) === 0,
        ai_formation_creation: (programs.count ?? 0) === 0,
      } as Partial<Record<SiteviralFeatureKey, boolean>>;
    },
  });

  if (isLoading || !currentOrg) return null;

  // First-action candidates: enabled + empty (or always-empty features like
  // appointment/location/affiliation which are quick-setup prompts).
  const alwaysPromptable: SiteviralFeatureKey[] = [
    'appointment', 'location', 'affiliation', 'ai_book_creation',
    'kyc', 'payment', 'reviews', 'product_comments',
  ];
  const firstActions = activeKeys.filter((k) => {
    if (emptiness?.[k]) return true;
    return alwaysPromptable.includes(k);
  }).slice(0, 4);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            {isFr ? 'Votre espace SiteViral' : 'Your SiteViral workspace'}
          </div>
          <h2 className="mt-1 text-xl font-bold leading-tight sm:text-2xl">
            {typeMeta
              ? (isFr ? typeMeta.labelFr : typeMeta.labelEn)
              : (isFr ? 'Fonctionnalités actives' : 'Active features')}
          </h2>
          {typeMeta && (
            <p className="text-xs text-muted-foreground">
              {isFr ? typeMeta.descFr : typeMeta.descEn}
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/admin/features')}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {isFr ? 'Ajouter des fonctionnalités' : 'Add functionalities'}
        </Button>
      </div>

      {/* First-action prompts */}
      {firstActions.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isFr ? 'Prochaines actions' : 'Next actions'}
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {firstActions.map((key, i) => {
              const meta = FEATURE_META[key];
              const route = FEATURE_ROUTES[key];
              const Icon = (Icons as any)[meta.icon] ?? Sparkles;
              return (
                <motion.button
                  key={key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(route.firstActionRoute)}
                  className="group flex items-center gap-3 rounded-2xl border bg-card p-3.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {isFr ? meta.labelFr : meta.labelEn}
                    </div>
                    <div className="truncate text-sm font-semibold">
                      {isFr ? route.firstActionFr : route.firstActionEn}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active-feature grid */}
      {activeKeys.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isFr ? 'Vos fonctionnalités actives' : 'Your active features'}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {activeKeys.length} {isFr ? 'active(s)' : 'active'}
            </span>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {activeKeys.map((key) => {
              const meta = FEATURE_META[key];
              const route = FEATURE_ROUTES[key];
              const Icon = (Icons as any)[meta.icon] ?? Sparkles;
              return (
                <button
                  key={key}
                  onClick={() => navigate(route.setupRoute)}
                  className={cn(
                    'group flex items-start gap-3 rounded-2xl border bg-card p-3.5 text-left transition-all',
                    'hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]'
                  )}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold">
                        {isFr ? meta.labelFr : meta.labelEn}
                      </span>
                      <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[9px]">
                        <Check className="h-2.5 w-2.5" />
                        {isFr ? 'Actif' : 'On'}
                      </Badge>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                      {isFr ? meta.descFr : meta.descEn}
                    </p>
                  </div>
                  <Settings2 className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
