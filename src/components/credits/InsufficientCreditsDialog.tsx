import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, ShoppingCart, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCreditsBalance } from '@/hooks/useCredits';
import { useI18n } from '@/i18n/I18nContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InsufficientCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
}

export function InsufficientCreditsDialog({ open, onOpenChange, message }: InsufficientCreditsDialogProps) {
  const navigate = useNavigate();
  const { data: summary } = useCreditsBalance();
  const { t } = useI18n();

  // Compute when daily credits renew (next midnight or from daily_expires_at)
  const nextDailyRenewal = (() => {
    if (summary?.daily_expires_at) {
      const expires = new Date(summary.daily_expires_at);
      if (expires.getTime() > Date.now()) {
        return formatDistanceToNow(expires, { locale: fr, addSuffix: true });
      }
    }
    // Default: next day at midnight
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    return formatDistanceToNow(tomorrow, { locale: fr, addSuffix: true });
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center space-y-3">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-xl">
            {t('credits.insufficient_title') || 'Crédits insuffisants'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {message || (t('credits.insufficient_desc') || "Tu n'as plus assez de crédits pour cette action.")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Current balance */}
          {summary && (
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {t('credits.current_balance') || 'Solde actuel'}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {summary.balance.toFixed(1)}
              </p>
              <p className="text-[10px] text-muted-foreground">crédits</p>
            </div>
          )}

          {/* Option 1: Buy credits */}
          <Button
            className="w-full gap-2 h-12"
            onClick={() => {
              onOpenChange(false);
              navigate('/credits');
            }}
          >
            <ShoppingCart className="h-4 w-4" />
            {t('credits.buy_credits') || 'Acheter des crédits'}
          </Button>

          {/* Option 2: Wait for daily credits */}
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
            <Clock className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold">
                {t('credits.daily_renewal') || 'Crédits gratuits quotidiens'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {t('credits.renewal_in') || 'Prochain rechargement'} {nextDailyRenewal}
              </p>
            </div>
            <Badge variant="secondary" className="text-[10px] shrink-0">
              <Sparkles className="h-3 w-3 mr-0.5" />
              38.5
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
