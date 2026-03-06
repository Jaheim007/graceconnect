import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Sparkles, User, ShoppingBag, Share2, BookOpen, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { useMode } from '@/contexts/ModeContext';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  actionLabel: string;
}

export function OnboardingChecklist() {
  const { user, profile } = useAuth();
  const { userOrgs } = useOrg();
  const navigate = useNavigate();
  const { setMode } = useMode();
  const [dismissed, setDismissed] = useState(false);

  // Check completed steps
  const { data: completionData } = useQuery({
    queryKey: ['onboarding-progress', user?.id],
    queryFn: async () => {
      if (!user) return { hasProfile: false, hasPurchase: false, hasLink: false, hasOrg: false };

      const [purchaseRes, linkRes] = await Promise.all([
        db.from('product_purchases').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed'),
        db.from('affiliate_links').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      return {
        hasProfile: !!(profile?.display_name && profile?.avatar_url),
        hasPurchase: (purchaseRes.count || 0) > 0,
        hasLink: (linkRes.count || 0) > 0,
        hasOrg: userOrgs.length > 0,
      };
    },
    enabled: !!user,
  });

  if (!completionData || dismissed) return null;

  const steps: Step[] = [
    {
      id: 'profile',
      label: 'Complète ton profil',
      description: 'Ajoute ta photo et ton nom',
      icon: <User className="h-4 w-4" />,
      action: () => navigate('/profile'),
      actionLabel: 'Mon profil',
    },
    {
      id: 'discover',
      label: 'Découvre un produit',
      description: 'Explore le catalogue',
      icon: <ShoppingBag className="h-4 w-4" />,
      action: () => navigate('/marketplace'),
      actionLabel: 'Explorer',
    },
    {
      id: 'share',
      label: 'Partage et gagne',
      description: 'Deviens ambassadeur',
      icon: <Share2 className="h-4 w-4" />,
      action: () => { setMode('ambassador'); navigate('/affiliation'); },
      actionLabel: 'Commencer',
    },
    {
      id: 'create',
      label: 'Écris ton premier livre',
      description: "L'IA t'aide à écrire",
      icon: <BookOpen className="h-4 w-4" />,
      action: () => navigate('/ecrire'),
      actionLabel: 'Écrire',
    },
  ];

  const completed: Record<string, boolean> = {
    profile: completionData.hasProfile,
    discover: completionData.hasPurchase,
    share: completionData.hasLink,
    create: completionData.hasOrg,
  };

  const completedCount = Object.values(completed).filter(Boolean).length;
  const allDone = completedCount === steps.length;

  if (allDone) return null;

  const pct = Math.round((completedCount / steps.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-primary/20 rounded-2xl p-5 relative"
    >
      <button onClick={() => setDismissed(true)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-bold text-sm">Bien démarrer</h2>
        <span className="ml-auto text-xs font-semibold text-primary">{completedCount}/{steps.length}</span>
      </div>

      <Progress value={pct} className="h-1.5 mb-4" />

      <div className="space-y-1.5">
        {steps.map((step) => {
          const done = completed[step.id];
          return (
            <button
              key={step.id}
              onClick={done ? undefined : step.action}
              disabled={done}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all',
                done
                  ? 'bg-primary/5 opacity-60'
                  : 'bg-muted/30 border border-border/50 hover:border-primary/40'
              )}
            >
              <div className={cn(
                'h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-colors',
                done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                {done ? <Check className="h-3.5 w-3.5" /> : step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-semibold', done && 'line-through')}>{step.label}</p>
                <p className="text-[10px] text-muted-foreground">{step.description}</p>
              </div>
              {!done && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
