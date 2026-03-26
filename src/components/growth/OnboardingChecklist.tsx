import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Sparkles, User, ShoppingBag, Share2, BookOpen, X, DollarSign, Target, Star, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

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
  const [dismissed, setDismissed] = useState(false);
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const { data: completionData } = useQuery({
    queryKey: ['onboarding-progress', user?.id],
    queryFn: async () => {
      if (!user) return { hasProfile: false, hasPurchase: false, hasLink: false, hasOrg: false, hasProduct: false, hasFirstSale: false };
      const [purchaseRes, linkRes, productRes] = await Promise.all([
        db.from('product_purchases').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed'),
        db.from('affiliate_links').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        db.from('digital_products').select('id', { count: 'exact', head: true }).eq('created_by', user.id),
      ]);
      return {
        hasProfile: !!(profile?.display_name && profile?.avatar_url),
        hasPurchase: (purchaseRes.count || 0) > 0,
        hasLink: (linkRes.count || 0) > 0,
        hasOrg: userOrgs.length > 0,
        hasProduct: (productRes.count || 0) > 0,
        hasFirstSale: false, // Will be enhanced later
      };
    },
    enabled: !!user,
  });

  if (!completionData || dismissed) return null;

  const steps: Step[] = [
    {
      id: 'profile',
      label: isFr ? 'Complète ton profil' : 'Complete your profile',
      description: isFr ? 'Ajoute ta photo et ton nom' : 'Add your photo and name',
      icon: <User className="h-4 w-4" />,
      action: () => navigate('/profile'),
      actionLabel: isFr ? 'Mon profil' : 'My profile',
    },
    {
      id: 'create',
      label: isFr ? 'Crée ton premier produit' : 'Create your first product',
      description: isFr ? 'Livre, formation ou fichier avec l\'IA' : 'Book, course or file with AI',
      icon: <BookOpen className="h-4 w-4" />,
      action: () => navigate('/ecrire'),
      actionLabel: isFr ? 'Créer' : 'Create',
    },
    {
      id: 'share',
      label: isFr ? 'Partage et gagne' : 'Share and earn',
      description: isFr ? 'Deviens ambassadeur, touche des commissions' : 'Become an ambassador, earn commissions',
      icon: <Share2 className="h-4 w-4" />,
      action: () => navigate('/gagner'),
      actionLabel: isFr ? 'Commencer' : 'Start',
    },
    {
      id: 'discover',
      label: isFr ? 'Fais ta première vente' : 'Make your first sale',
      description: isFr ? 'Partage ton lien et vends' : 'Share your link and sell',
      icon: <DollarSign className="h-4 w-4" />,
      action: () => navigate('/admin/sales'),
      actionLabel: isFr ? 'Voir' : 'View',
    },
  ];

  const completed: Record<string, boolean> = {
    profile: completionData.hasProfile,
    create: completionData.hasProduct || completionData.hasOrg,
    share: completionData.hasLink,
    discover: completionData.hasPurchase,
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
        <Rocket className="h-4 w-4 text-primary" />
        <h2 className="font-bold text-sm">{isFr ? '🚀 Mes premiers pas' : '🚀 My first steps'}</h2>
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
                done ? 'bg-primary/5 opacity-60' : 'bg-muted/30 border border-border/50 hover:border-primary/40'
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

      {/* Motivational footer */}
      <div className="mt-3 pt-3 border-t border-border/30 text-center">
        <p className="text-[10px] text-muted-foreground">
          {isFr ? '💡 Des créateurs comme toi gagnent déjà chaque jour sur SiteViral' : '💡 Creators like you are already earning daily on SiteViral'}
        </p>
      </div>
    </motion.div>
  );
}
