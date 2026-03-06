import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useMode } from '@/contexts/ModeContext';

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
  const { setMode } = useMode();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

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
        text: 'Complète ton profil pour gagner en crédibilité',
        cta: 'Mon profil', action: () => navigate('/profile'),
      });
    }
    if (!state.hasOrg) {
      all.push({
        id: 'write', emoji: '✏️', priority: 2, bg: 'bg-primary/5 border-primary/20',
        text: "Écris ton premier livre en 5 min avec l'IA",
        cta: 'Commencer', action: () => navigate('/ecrire'),
      });
    }
    if (!state.hasLinks) {
      all.push({
        id: 'ambassador', emoji: '💰', priority: 3, bg: 'bg-emerald-500/5 border-emerald-500/20',
        text: 'Gagne de l\'argent en partageant des produits',
        cta: 'Devenir ambassadeur', action: () => { setMode('ambassador'); navigate('/affiliation'); },
      });
    }
    if (state.hasOrg && !state.hasProducts) {
      all.push({
        id: 'publish', emoji: '🚀', priority: 2, bg: 'bg-amber-500/5 border-amber-500/20',
        text: 'Tu as un espace — publie ton premier produit !',
        cta: 'Publier', action: () => { setMode('creator'); navigate('/admin/products'); },
      });
    }

    return all.filter(n => !dismissedIds.includes(n.id)).sort((a, b) => a.priority - b.priority);
  }, [state, dismissedIds, navigate, setMode]);

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
