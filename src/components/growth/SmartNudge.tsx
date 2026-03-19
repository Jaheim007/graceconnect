import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

interface Nudge {
  id: string;
  emoji: string;
  text: string;
  cta: string;
  action: () => void;
  priority: number;
  bg: string;
}

export function SmartNudge() {
  const { user, profile } = useAuth();
  const { userOrgs } = useOrg();
  const navigate = useNavigate();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const { t } = useI18n();

  const { data: state } = useQuery({
    queryKey: ['smart-nudge', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [purchases, links, products] = await Promise.all([
        db.from('product_purchases').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed'),
        db.from('affiliate_links').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        userOrgs.length > 0
          ? db.from('digital_products').select('id', { count: 'exact', head: true }).eq('organization_id', userOrgs[0].id).eq('is_published', true)
          : { count: 0 },
      ]);
      return {
        hasPurchases: (purchases.count || 0) > 0,
        hasLinks: (links.count || 0) > 0,
        hasProducts: (products.count || 0) > 0,
        hasProfile: !!(profile?.display_name && profile?.avatar_url),
        hasOrg: userOrgs.length > 0,
      };
    },
    enabled: !!user,
  });

  const nudges = useMemo(() => {
    if (!state) return [];
    const all: Nudge[] = [];

    if (!state.hasProfile) {
      all.push({
        id: 'profile', emoji: '👤', priority: 1, bg: 'bg-primary/5 border-primary/20',
        text: t('nudge.profile'), cta: t('nudge.profile_cta'), action: () => navigate('/profile'),
      });
    }
    if (!state.hasOrg) {
      all.push({
        id: 'create-platform', emoji: '🏪', priority: 1, bg: 'bg-amber-500/5 border-amber-500/20',
        text: t('nudge.create_platform'), cta: t('nudge.create_platform_cta'), action: () => navigate('/create-org'),
      });
      all.push({
        id: 'write', emoji: '✏️', priority: 2, bg: 'bg-primary/5 border-primary/20',
        text: t('nudge.write'), cta: t('nudge.write_cta'), action: () => navigate('/ecrire'),
      });
    }
    if (!state.hasLinks) {
      all.push({
        id: 'ambassador', emoji: '💰', priority: 3, bg: 'bg-emerald-500/5 border-emerald-500/20',
        text: t('nudge.ambassador'), cta: t('nudge.ambassador_cta'), action: () => navigate('/affiliation'),
      });
    }
    if (state.hasOrg && !state.hasProducts) {
      all.push({
        id: 'publish', emoji: '🚀', priority: 2, bg: 'bg-amber-500/5 border-amber-500/20',
        text: t('nudge.publish'), cta: t('nudge.publish_cta'), action: () => navigate('/admin/products'),
      });
    }

    return all.filter(n => !dismissedIds.includes(n.id)).sort((a, b) => a.priority - b.priority);
  }, [state, dismissedIds, navigate, t]);

  const nudge = nudges[0];
  if (!nudge) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={nudge.id}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className={cn('rounded-xl border p-3 flex items-center gap-3', nudge.bg)}
      >
        <span className="text-lg shrink-0">{nudge.emoji}</span>
        <p className="text-xs flex-1 min-w-0">{nudge.text}</p>
        <button
          onClick={nudge.action}
          className="text-[11px] font-semibold text-primary whitespace-nowrap flex items-center gap-1 hover:underline"
        >
          {nudge.cta} <ArrowRight className="h-3 w-3" />
        </button>
        <button
          onClick={() => setDismissedIds(prev => [...prev, nudge.id])}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
