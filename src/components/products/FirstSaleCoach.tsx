import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Image as ImageIcon, Pencil, Rocket, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import {
  diagnoseFirstSale,
  isInLaunchWindow,
  launchDaysLeft,
  needsIntervention,
  wasShared,
  LAUNCH_WINDOW_DAYS,
  type FixKind,
} from '@/lib/firstSale';

type Props = {
  products: any[];
  onShare: (product: any) => void;
  onEdit: (product: any) => void;
  className?: string;
};

/**
 * First-sale engine, seller side:
 * - shows the remaining Discover placement window for a fresh product
 * - after the window, diagnoses what is missing and offers the one-tap fix
 */
export function FirstSaleCoach({ products, onShare, onEdit, className }: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const target = useMemo(() => {
    const stuck = products.find(needsIntervention);
    if (stuck) return { product: stuck, mode: 'intervention' as const };
    const fresh = products
      .filter((p) => isInLaunchWindow(p) && (p.sales_count || 0) === 0)
      .sort((a, b) => launchDaysLeft(a) - launchDaysLeft(b))[0];
    return fresh ? { product: fresh, mode: 'launch' as const } : null;
  }, [products]);

  if (!target) return null;

  const { product, mode } = target;
  const issues = diagnoseFirstSale(product, { shared: wasShared(product.id) });

  const act = (kind: FixKind) => {
    if (kind === 'share') onShare(product);
    else onEdit(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4 sm:p-5',
        mode === 'intervention'
          ? 'border-amber-500/30 bg-amber-500/5'
          : 'border-primary/25 bg-primary/5',
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl',
          mode === 'intervention' ? 'bg-amber-500/20' : 'bg-primary/20',
        )}
      />

      <div className="relative flex items-start gap-3">
        <div
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
            mode === 'intervention' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-primary/15 text-primary',
          )}
        >
          {mode === 'intervention' ? <AlertCircle className="h-4.5 w-4.5" /> : <Rocket className="h-4.5 w-4.5" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-sm font-bold tracking-tight">
              {mode === 'intervention'
                ? isFr ? 'Toujours aucune vente — voici quoi corriger' : 'Still no sale — here is what to fix'
                : isFr ? 'Fenêtre de lancement active' : 'Launch window active'}
            </h3>
            {mode === 'launch' && (
              <Badge variant="outline" className="border-0 bg-primary/10 text-[10px] font-semibold text-primary">
                {isFr
                  ? `${launchDaysLeft(product)} j restants sur ${LAUNCH_WINDOW_DAYS}`
                  : `${launchDaysLeft(product)} of ${LAUNCH_WINDOW_DAYS} days left`}
              </Badge>
            )}
          </div>

          <p className="mt-1 truncate text-xs text-muted-foreground">{product.title}</p>

          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {mode === 'intervention'
              ? isFr
                ? 'Ce produit est en ligne depuis plus de deux semaines sans vente. Les points ci-dessous sont ce qui bloque le plus souvent.'
                : 'This product has been live for over two weeks with no sale. The points below are what usually blocks it.'
              : isFr
                ? 'Il est mis en avant sur Découvrir. Profitez-en : partagez-le au moins une fois pendant cette fenêtre.'
                : 'It is featured on Discover right now. Make it count: share it at least once during this window.'}
          </p>

          {issues.length > 0 && (
            <ul className="mt-3 space-y-2">
              {issues.slice(0, 4).map((issue) => (
                <li
                  key={issue.kind}
                  className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-background/60 p-2.5"
                >
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{isFr ? issue.titleFr : issue.titleEn}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      {isFr ? issue.hintFr : issue.hintEn}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 shrink-0 gap-1 rounded-lg px-2 text-[11px]"
                    onClick={() => act(issue.kind)}
                  >
                    {issue.kind === 'share' ? <ImageIcon className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                    {isFr ? 'Corriger' : 'Fix'}
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" className="h-8 gap-1.5 rounded-lg text-xs" onClick={() => onShare(product)}>
              <ImageIcon className="h-3.5 w-3.5" />
              {isFr ? 'Kit de partage' : 'Share kit'}
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-lg text-xs" onClick={() => onEdit(product)}>
              {isFr ? 'Modifier le produit' : 'Edit product'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
