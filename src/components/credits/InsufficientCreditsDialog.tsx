import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, ShoppingCart, Sparkles, Gift, TrendingUp, Share2, BookOpen, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCreditsBalance } from '@/hooks/useCredits';
import { useI18n } from '@/i18n/I18nContext';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

interface InsufficientCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
}

const EARN_ACTIONS_FR = [
  { icon: Clock, label: 'Crédits quotidiens', desc: 'Connecte-toi chaque jour', reward: '+38,5/jour', color: 'text-blue-500', bg: 'bg-blue-500/10', route: null },
  { icon: TrendingUp, label: 'Vends un produit', desc: '1,5% cashback automatique', reward: 'Cashback', color: 'text-emerald-500', bg: 'bg-emerald-500/10', route: '/admin/products' },
  { icon: Share2, label: 'Deviens affilié', desc: 'Partage & gagne des commissions', reward: 'Commissions', color: 'text-purple-500', bg: 'bg-purple-500/10', route: '/gagner' },
  { icon: BookOpen, label: 'Publie du contenu', desc: 'Crée et vends des produits numériques', reward: 'Revenus', color: 'text-amber-500', bg: 'bg-amber-500/10', route: '/admin/products/new' },
];

const EARN_ACTIONS_EN = [
  { icon: Clock, label: 'Daily credits', desc: 'Log in every day', reward: '+38.5/day', color: 'text-blue-500', bg: 'bg-blue-500/10', route: null },
  { icon: TrendingUp, label: 'Sell a product', desc: '1.5% automatic cashback', reward: 'Cashback', color: 'text-emerald-500', bg: 'bg-emerald-500/10', route: '/admin/products' },
  { icon: Share2, label: 'Become an affiliate', desc: 'Share & earn commissions', reward: 'Commissions', color: 'text-purple-500', bg: 'bg-purple-500/10', route: '/gagner' },
  { icon: BookOpen, label: 'Publish content', desc: 'Create & sell digital products', reward: 'Revenue', color: 'text-amber-500', bg: 'bg-amber-500/10', route: '/admin/products/new' },
];

export function InsufficientCreditsDialog({ open, onOpenChange, message }: InsufficientCreditsDialogProps) {
  const navigate = useNavigate();
  const { data: summary } = useCreditsBalance();
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';
  const dateLoc = isFr ? fr : enUS;
  const EARN_ACTIONS = isFr ? EARN_ACTIONS_FR : EARN_ACTIONS_EN;

  const nextDailyRenewal = (() => {
    if (summary?.daily_expires_at) {
      const expires = new Date(summary.daily_expires_at);
      if (expires.getTime() > Date.now()) {
        return formatDistanceToNow(expires, { locale: dateLoc, addSuffix: true });
      }
    }
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    return formatDistanceToNow(tomorrow, { locale: dateLoc, addSuffix: true });
  })();

  const goTo = (route: string) => {
    onOpenChange(false);
    navigate(route);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-3">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <DialogTitle className="text-xl">
            {t('credits.insufficient_title') || (isFr ? 'Crédits insuffisants' : 'Insufficient credits')}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {message || (t('credits.insufficient_desc') || (isFr ? "Tu n'as plus assez de crédits pour cette action." : "You don't have enough credits for this action."))}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Current balance */}
          {summary && (
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">{isFr ? 'Solde actuel' : 'Current balance'}</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {summary.balance.toFixed(1)}
              </p>
              <p className="text-[10px] text-muted-foreground">{isFr ? 'crédits' : 'credits'}</p>
            </div>
          )}

          {/* CTA: Buy credits */}
          <Button
            className="w-full gap-2 h-12"
            onClick={() => goTo('/credits')}
          >
            <ShoppingCart className="h-4 w-4" />
            {isFr ? 'Acheter des crédits' : 'Buy credits'}
          </Button>

          {/* Earn credits section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">
                {isFr ? 'Gagne des crédits gratuitement' : 'Earn free credits'}
              </p>
            </div>

            <div className="space-y-1.5">
              {EARN_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-border/50 hover:bg-accent/50 transition-colors text-left group"
                  onClick={() => {
                    if (action.route) goTo(action.route);
                  }}
                  disabled={!action.route}
                >
                  <div className={`h-9 w-9 rounded-lg ${action.bg} flex items-center justify-center shrink-0`}>
                    <action.icon className={`h-4 w-4 ${action.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-tight">{action.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{action.desc}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {action.reward}
                  </Badge>
                  {action.route && (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Daily renewal info */}
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
            <Clock className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold">{isFr ? 'Prochain rechargement gratuit' : 'Next free refill'}</p>
              <p className="text-[10px] text-muted-foreground">
                {nextDailyRenewal}
              </p>
            </div>
            <Badge variant="secondary" className="text-[10px] shrink-0">
              <Sparkles className="h-3 w-3 mr-0.5" />
              +38{isFr ? ',5' : '.5'}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
