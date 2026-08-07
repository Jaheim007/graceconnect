import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useNavigate } from 'react-router-dom';
import { Check, Circle, ArrowRight, Zap, BookOpen, Share2, DollarSign, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Step {
  key: string;
  label: string;
  description: string;
  icon: typeof BookOpen;
  done: boolean;
  action?: { label: string; to: string };
}

/**
 * TTFS Progress Tracker — guides creators toward their first sale.
 * Only shows when the creator hasn't made their first sale yet.
 */
export function TTFSProgressTracker() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const orgId = currentOrg?.id;

  const { data: progress, isLoading } = useQuery({
    queryKey: ['ttfs-progress', orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const [productsRes, publishedRes, affiliatesRes, salesRes] = await Promise.all([
        db.from('digital_products').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        db.from('digital_products').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_published', true),
        db.from('affiliate_links').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        db.from('product_purchases').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'completed'),
      ]);

      return {
        hasProduct: (productsRes.count || 0) > 0,
        hasPublished: (publishedRes.count || 0) > 0,
        hasAmbassadors: (affiliatesRes.count || 0) > 0,
        hasSale: (salesRes.count || 0) > 0,
        salesCount: salesRes.count || 0,
      };
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });

  if (isLoading || !progress) return null;

  // Hide tracker once first sale is achieved
  if (progress.hasSale) return null;

  const steps: Step[] = [
    {
      key: 'create',
      label: 'Créer un produit',
      description: 'Importez un fichier ou créez avec l\'IA',
      icon: BookOpen,
      done: progress.hasProduct,
      action: progress.hasProduct ? undefined : { label: 'Créer', to: '/admin/products/new' },
    },
    {
      key: 'publish',
      label: 'Publier',
      description: 'Rendez votre produit visible au public',
      icon: Zap,
      done: progress.hasPublished,
      action: progress.hasPublished ? undefined : { label: 'Voir produits', to: '/admin/products' },
    },
    {
      key: 'share',
      label: 'Partager votre lien',
      description: 'Diffusez sur WhatsApp, Facebook ou par email',
      icon: Share2,
      done: progress.hasPublished, // considered done if published (sharing is external)
    },
    {
      key: 'ambassadors',
      label: 'Activer les ambassadeurs',
      description: 'Laissez d\'autres promouvoir vos produits',
      icon: Users,
      done: progress.hasAmbassadors,
      action: progress.hasAmbassadors ? undefined : { label: 'Configurer', to: '/admin/affiliation' },
    },
    {
      key: 'sale',
      label: 'Première vente !',
      description: 'Objectif : moins de 48h',
      icon: DollarSign,
      done: progress.hasSale,
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const nextStep = steps.find(s => !s.done);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Objectif : Première vente
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Suivez les étapes pour réaliser votre première vente en moins de 48h
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{progressPercent}%</p>
          <p className="text-[10px] text-muted-foreground">{completedCount}/{steps.length} étapes</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, i) => {
          const isNext = step === nextStep;
          const Icon = step.icon;
          return (
            <div
              key={step.key}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl transition-colors',
                step.done ? 'bg-emerald-500/5' : isNext ? 'bg-primary/5 border border-primary/20' : 'opacity-50'
              )}
            >
              <div className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                step.done ? 'bg-emerald-500/15' : isNext ? 'bg-primary/15' : 'bg-muted'
              )}>
                {step.done ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Icon className={cn('h-4 w-4', isNext ? 'text-primary' : 'text-muted-foreground')} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', step.done && 'line-through text-muted-foreground')}>
                  {step.label}
                </p>
                <p className="text-[11px] text-muted-foreground">{step.description}</p>
              </div>
              {isNext && step.action && (
                <Button
                  size="sm"
                  className="shrink-0 text-xs h-8 gap-1"
                  onClick={() => navigate(step.action!.to)}
                >
                  {step.action.label} <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick action buttons */}
      {!progress.hasProduct && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Commencez maintenant</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Vendre un contenu existant', to: '/admin/products/new', icon: BookOpen },
              { label: 'Créer avec l\'IA', to: '/admin/studio', icon: Zap },
              { label: 'Créer un cours', to: '/admin/programs/new', icon: Users },
            ].map(a => (
              <Button
                key={a.label}
                variant="outline"
                size="sm"
                className="h-auto py-3 flex-col gap-1.5 text-[11px] hover:border-primary/30 hover:bg-primary/5"
                onClick={() => navigate(a.to)}
              >
                <a.icon className="h-4 w-4 text-primary" />
                <span className="text-center leading-tight">{a.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
