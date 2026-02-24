import { useOrgPlans, useSubscribe, useMySubscriptions } from '@/hooks/useSubscriptions';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Props {
  orgId: string;
  currency?: string;
}

export function SubscriptionPlansWidget({ orgId, currency = 'XOF' }: Props) {
  const { data: plans = [] } = useOrgPlans(orgId, true);
  const { data: mySubs = [] } = useMySubscriptions();
  const subscribe = useSubscribe();
  const { user } = useAuth();
  const { locale } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isFr = locale === 'fr';

  if (plans.length === 0) return null;

  const activePlanIds = new Set(
    mySubs.filter((s: any) => s.status === 'active' && s.organization_id === orgId).map((s: any) => s.plan_id)
  );

  const handleSubscribe = async (planId: string) => {
    if (!user) { navigate('/auth'); return; }
    try {
      await subscribe.mutateAsync({ planId, orgId });
      toast({ title: isFr ? '✅ Abonnement activé !' : '✅ Subscription activated!' });
    } catch (err: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const intervalLabel = (interval: string) => {
    if (isFr) return interval === 'monthly' ? '/mois' : interval === 'quarterly' ? '/trimestre' : '/an';
    return interval === 'monthly' ? '/mo' : interval === 'quarterly' ? '/qtr' : '/yr';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">{isFr ? 'Plans d\'abonnement' : 'Subscription Plans'}</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan, i) => {
          const isActive = activePlanIds.has(plan.id);
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-card border rounded-2xl p-4 space-y-3 transition-all ${isActive ? 'border-primary ring-1 ring-primary/20' : 'border-border hover:border-primary/30'}`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{plan.name}</h4>
                {isActive && (
                  <Badge variant="outline" className="text-[10px] border-0 bg-primary/10 text-primary">
                    {isFr ? 'Actif' : 'Active'}
                  </Badge>
                )}
              </div>
              <div>
                <span className="text-2xl font-bold">{formatCurrency(plan.price, currency, locale)}</span>
                <span className="text-xs text-muted-foreground">{intervalLabel(plan.interval)}</span>
              </div>
              {plan.description && <p className="text-xs text-muted-foreground">{plan.description}</p>}
              {plan.features && plan.features.length > 0 && (
                <ul className="space-y-1.5">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-xs">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                size="sm"
                className="w-full text-xs gap-1.5"
                variant={isActive ? 'outline' : 'default'}
                disabled={isActive || subscribe.isPending}
                onClick={() => handleSubscribe(plan.id)}
              >
                {isActive ? (
                  <><Check className="h-3.5 w-3.5" /> {isFr ? 'Abonné' : 'Subscribed'}</>
                ) : (
                  <><Star className="h-3.5 w-3.5" /> {isFr ? 'S\'abonner' : 'Subscribe'}</>
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
