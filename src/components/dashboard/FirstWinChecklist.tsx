import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, ArrowRight, PenLine, Share2, Upload, Store, BookOpen, Users, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';

interface FirstWinChecklistProps {
  hasBook: boolean;
  hasAffiliateLink: boolean;
  hasPurchase: boolean;
  hasOrg: boolean;
}

/**
 * Gamified onboarding checklist — shows progress toward "First Win"
 */
export function FirstWinChecklist({ hasBook, hasAffiliateLink, hasPurchase, hasOrg }: FirstWinChecklistProps) {
  const steps = [
    { done: true, label: 'Créer un compte', emoji: '✅' },
    { done: hasBook, label: 'Écrire ou importer un livre', emoji: '📖', to: '/ecrire' },
    { done: hasAffiliateLink, label: 'Promouvoir un produit', emoji: '💰', to: '/gagner' },
    { done: hasPurchase, label: 'Faire ton premier achat', emoji: '🛒', to: '/discover' },
    { done: hasOrg, label: 'Créer ton centre digital', emoji: '🏢', to: '/vendre' },
  ];

  const completed = steps.filter(s => s.done).length;
  const progress = Math.round((completed / steps.length) * 100);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-accent" /> Premier succès
        </h3>
        <Badge variant="secondary" className="text-[10px]">{progress}%</Badge>
      </div>

      {/* Progress bar */}
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
