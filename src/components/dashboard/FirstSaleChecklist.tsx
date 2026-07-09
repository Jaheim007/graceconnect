import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ChevronDown, Rocket, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/hooks/useClientAnalytics';
import type { SiteviralType } from '@/types/database';

interface Step {
  id: string;
  label: { fr: string; en: string };
  cta: { fr: string; en: string };
  done: boolean;
  href?: string;
  onClick?: () => void;
}

/**
 * "Your first sale in 24h" — guided onboarding checklist for creators.
 *
 * Reads existing data (org, products, ambassador status, sales) to compute
 * progress. Persists collapsed/dismissed state in localStorage.
 *
 * Auto-hides once the user has at least one completed sale OR has dismissed it.
 */
export function FirstSaleChecklist() {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const isFr = locale === 'fr';

  const storageKey = `first_sale_checklist_v1_${user?.id || 'anon'}`;

  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !user?.id) return;
    const raw = localStorage.getItem(storageKey);
    if (raw === 'dismissed') setDismissed(true);
    else if (raw === 'collapsed') setCollapsed(true);
  }, [storageKey, user?.id]);

  const orgId = currentOrg?.id;

  // ── Signals (read-only, no business logic changes) ──
  const { data: signals } = useQuery({
    queryKey: ['first-sale-signals', orgId, user?.id],
    queryFn: async () => {
      if (!orgId || !user?.id) return null;

      const [productsRes, salesRes, affRes, orgRes] = await Promise.all([
        db.from('digital_products').select('id, is_published').eq('organization_id', orgId).limit(5),
        db.from('product_purchases').select('id').eq('organization_id', orgId).eq('status', 'completed').limit(1),
        db.from('affiliate_links').select('code').eq('user_id', user.id).limit(1),
        db.from('organizations').select('logo_url, description').eq('id', orgId).maybeSingle(),
      ]);

      const products = productsRes.data || [];
      return {
        hasOrg: true,
        hasProduct: products.length > 0,
        hasPublishedProduct: products.some((p: any) => p.is_published),
        hasSale: (salesRes.data || []).length > 0,
        hasAffiliateCode: (affRes.data || []).length > 0,
        hasOrgBranding: !!(orgRes.data?.logo_url && orgRes.data?.description),
      };
    },
    enabled: !!orgId && !!user?.id,
    staleTime: 60_000,
  });

  const type = (currentOrg?.siteviral_type as SiteviralType | null) ?? null;

  const steps: Step[] = useMemo(() => {
    const s = signals;
    return buildStepsForType(type, s, navigate);
  }, [signals, navigate, type]);

  const completedCount = steps.filter(s => s.done).length;
  const total = steps.length;
  const percent = Math.round((completedCount / total) * 100);

  // Auto-hide once user has a sale (success state) or dismissed
  if (dismissed || signals?.hasSale) return null;
  if (!signals) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(storageKey, 'dismissed');
    trackEvent('first_sale_checklist_dismissed', { completed: completedCount }, user?.id);
  };

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (next) localStorage.setItem(storageKey, 'collapsed');
    else localStorage.removeItem(storageKey);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Rocket className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm sm:text-base truncate">
              {goalTitle(type, isFr)}
            </h3>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{total} {isFr ? 'étapes' : 'steps'} · {percent}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" onClick={toggleCollapsed} className="h-7 w-7">
            <ChevronDown className={cn('h-4 w-4 transition-transform', collapsed && '-rotate-90')} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-7 w-7 text-muted-foreground">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Progress value={percent} className="h-1.5 mb-3" />

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5 overflow-hidden"
          >
            {steps.map(step => (
              <li
                key={step.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-2 py-2 transition-colors',
                  step.done ? 'opacity-60' : 'hover:bg-muted/50',
                )}
              >
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className={cn('text-sm flex-1 min-w-0 truncate', step.done && 'line-through')}>
                  {step.label[isFr ? 'fr' : 'en']}
                </span>
                {!step.done && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      trackEvent('first_sale_step_click', { step: step.id }, user?.id);
                      step.onClick?.();
                    }}
                    className="h-7 px-2 text-xs shrink-0"
                  >
                    {step.cta[isFr ? 'fr' : 'en']}
                  </Button>
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
