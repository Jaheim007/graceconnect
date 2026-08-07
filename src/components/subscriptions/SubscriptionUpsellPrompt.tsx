import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Zap, ArrowRight, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';

interface SubscriptionUpsellPromptProps {
  organizationId: string;
  organizationSlug?: string;
  organizationName?: string;
}

/**
 * Automatically shows a subscription upsell prompt to repeat buyers (2+ purchases)
 * from the same organization. Prompts them to subscribe for regular access.
 */
export function SubscriptionUpsellPrompt({ organizationId, organizationSlug, organizationName }: SubscriptionUpsellPromptProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const storageKey = `sub_upsell_${organizationId}`;

  // Check if org has subscription plans
  const { data: hasPlans } = useQuery({
    queryKey: ['org-has-sub-plans', organizationId],
    queryFn: async () => {
      const { count } = await db.from('subscription_plans')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true);
      return (count || 0) > 0;
    },
    enabled: !!organizationId,
  });

  // Check user's purchase count from this org
  const { data: purchaseCount = 0 } = useQuery({
    queryKey: ['user-org-purchase-count', user?.id, organizationId],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await db.from('product_purchases')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('status', 'completed');
      return count || 0;
    },
    enabled: !!user && !!organizationId,
  });

  // Check if already subscribed
  const { data: isSubscribed } = useQuery({
    queryKey: ['user-org-subscribed', user?.id, organizationId],
    queryFn: async () => {
      if (!user) return false;
      const { count } = await db.from('user_subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('status', 'active');
      return (count || 0) > 0;
    },
    enabled: !!user && !!organizationId,
  });

  useEffect(() => {
    // Show only for repeat buyers (2+) with plans, not subscribed, not dismissed
    if (
      hasPlans &&
      purchaseCount >= 2 &&
      !isSubscribed &&
      !dismissed &&
      !sessionStorage.getItem(storageKey)
    ) {
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [hasPlans, purchaseCount, isSubscribed, dismissed, storageKey]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem(storageKey, '1');
  };

  const handleSubscribe = () => {
    handleDismiss();
    if (organizationSlug) {
      navigate(`/org/${organizationSlug}?tab=subscription`);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed bottom-20 right-4 z-50 max-w-sm"
        >
          <div className="bg-card border border-primary/20 rounded-2xl p-5 shadow-xl shadow-primary/10 space-y-3">
            <button onClick={handleDismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Repeat className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-sm">
                  {isFr ? 'Devenez abonné !' : 'Become a subscriber!'}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {isFr
                    ? `Vous avez acheté ${purchaseCount} ressources de ${organizationName || 'cette organisation'}`
                    : `You've purchased ${purchaseCount} resources from ${organizationName || 'this organization'}`}
                </p>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <Zap className="h-4 w-4 text-primary shrink-0" />
                {isFr ? 'Avantages abonné' : 'Subscriber benefits'}
              </div>
              <ul className="text-[11px] text-muted-foreground space-y-1">
                <li>✓ {isFr ? 'Accès illimité aux nouvelles ressources' : 'Unlimited access to new resources'}</li>
                <li>✓ {isFr ? 'Réductions exclusives' : 'Exclusive discounts'}</li>
                <li>✓ {isFr ? 'Contenu premium en avant-première' : 'Early access to premium content'}</li>
              </ul>
            </div>

            <Button
              className="w-full gap-2 text-sm"
              onClick={handleSubscribe}
            >
              <CreditCard className="h-4 w-4" />
              {isFr ? 'Voir les abonnements' : 'View subscriptions'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
