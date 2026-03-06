import { motion } from 'framer-motion';
import { CheckCircle, Circle, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';

interface FirstWinChecklistProps {
  hasBook: boolean;
  hasAffiliateLink: boolean;
  hasPurchase: boolean;
  hasOrg: boolean;
}

export function FirstWinChecklist({ hasBook, hasAffiliateLink, hasPurchase, hasOrg }: FirstWinChecklistProps) {
  const { t } = useI18n();

  const steps = [
    { done: true, label: t('dash.create_account'), emoji: '✅' },
    { done: hasBook, label: t('dash.write_book'), emoji: '📖', to: '/ecrire' },
    { done: hasAffiliateLink, label: t('dash.promote_product'), emoji: '💰', to: '/gagner' },
    { done: hasPurchase, label: t('dash.first_purchase'), emoji: '🛒', to: '/discover' },
    { done: hasOrg, label: t('dash.create_center'), emoji: '🏢', to: '/vendre' },
  ];

  const completed = steps.filter(s => s.done).length;
  const progress = Math.round((completed / steps.length) * 100);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-accent" /> {t('dash.first_win')}
        </h3>
        <Badge variant="secondary" className="text-[10px]">{progress}%</Badge>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full bg-accent rounded-full"
        />
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            {step.done ? (
              <CheckCircle className="h-4 w-4 text-accent shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            )}
            <span className={`text-xs flex-1 ${step.done ? 'text-muted-foreground line-through' : 'font-medium'}`}>
              {step.emoji} {step.label}
            </span>
            {!step.done && step.to && (
              <Link to={step.to}>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] gap-1">
                  Go <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
