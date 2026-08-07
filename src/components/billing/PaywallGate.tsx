import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Zap, Crown, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePlatformPlan, type PlatformPlanTier } from '@/hooks/usePlatformPlan';
import { FullPageLoader } from '@/components/layout/RouteGuard';

interface PaywallGateProps {
  required: 'pro' | 'org';
  children: ReactNode;
  /** Inline mode renders a compact upsell card instead of a full-page paywall */
  inline?: boolean;
  feature?: string;
}

const TIER_RANK: Record<PlatformPlanTier, number> = { free: 0, pro: 1, org: 2 };

/**
 * Generic plan gate. Wrap any subtree that requires Pro or Org tier.
 * - Loading: shows the global spinner.
 * - Insufficient tier: shows upsell card pointing to /pricing or /billing.
 * - Sufficient tier: renders children.
 */
export function PaywallGate({ required, children, inline, feature }: PaywallGateProps) {
  const { tier, isTrialing, refetch } = usePlatformPlan();

  // tier defaults to free when query has not resolved; usePlatformPlan returns
  // 'free' immediately so we don't need a separate loading state here, but if
  // the user is trialing we still consider the requirement met.
  const userRank = TIER_RANK[tier];
  const requiredRank = TIER_RANK[required];
  const hasAccess = userRank >= requiredRank || (required === 'pro' && isTrialing);

  if (hasAccess) return <>{children}</>;

  return (
    <PaywallCard
      required={required}
      inline={inline}
      feature={feature}
      onRefresh={() => refetch()}
    />
  );
}

function PaywallCard({
  required,
  inline,
  feature,
  onRefresh,
}: {
  required: 'pro' | 'org';
  inline?: boolean;
  feature?: string;
  onRefresh: () => void;
}) {
  const isOrg = required === 'org';
  const Icon = isOrg ? Users : Crown;
  const title = isOrg ? 'Réservé au plan Organisation' : 'Réservé au plan Pro';
  const desc = feature
    ? `« ${feature} » nécessite un abonnement ${isOrg ? 'Organisation' : 'Pro'}.`
    : `Cette fonctionnalité nécessite un abonnement ${isOrg ? 'Organisation' : 'Pro'}.`;

  const benefits = isOrg
    ? [
        'Multi-utilisateurs & rôles avancés',
        'Domaines personnalisés illimités',
        'Crédits IA illimités pour toute l\'équipe',
        'Support prioritaire 24/7',
      ]
    : [
        '0 % commission sur tes ventes',
        '5 000 crédits IA / mois inclus',
        'Domaines personnalisés',
        'Statistiques avancées',
      ];

  const card = (
    <Card className="p-6 md:p-8 text-center space-y-4 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
          <Lock className="h-4 w-4" /> {title}
        </h2>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>

      <ul className="text-sm text-left max-w-sm mx-auto space-y-1.5 pt-2">
        {benefits.map((b) => (
          <li key={b} className="flex items-start gap-2">
            
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
        <Button asChild size="lg">
          <Link to="/pricing">
            
            {isOrg ? 'Voir le plan Organisation' : 'Passer Pro'}
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/billing/usage">Voir mes stats d'usage</Link>
        </Button>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        className="text-xs text-muted-foreground hover:text-foreground underline"
      >
        J'ai déjà payé — rafraîchir
      </button>
    </Card>
  );

  if (inline) {
    return <div className="my-6">{card}</div>;
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">{card}</div>
  );
}

/** Convenience wrapper: route guard for Pro-only screens. */
export function RequirePro({ children, feature, inline }: { children: ReactNode; feature?: string; inline?: boolean }) {
  return <PaywallGate required="pro" feature={feature} inline={inline}>{children}</PaywallGate>;
}

/** Convenience wrapper: route guard for Org-only screens. */
export function RequireOrg({ children, feature, inline }: { children: ReactNode; feature?: string; inline?: boolean }) {
  return <PaywallGate required="org" feature={feature} inline={inline}>{children}</PaywallGate>;
}

/** Loader re-export so callers don't depend on RouteGuard internals. */
export { FullPageLoader };
