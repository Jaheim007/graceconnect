import { Coins, Zap, Gift, ShoppingBag, Clock } from 'lucide-react';
import { useCreditsBalance, useGrantDailyCredits } from '@/hooks/useCredits';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function formatCredits(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(1);
}

function timeUntil(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'expiré';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h${mins > 0 ? mins + 'm' : ''}`;
  return `${mins}m`;
}

export function CreditBalance() {
  const { user } = useAuth();
  const { data: summary, isLoading } = useCreditsBalance();
  const grantDaily = useGrantDailyCredits();
  const navigate = useNavigate();

  // Auto-grant daily credits on mount if needed
  useEffect(() => {
    if (!user || !summary) return;
    const today = new Date().toISOString().slice(0, 10);
    if (summary.last_daily_grant !== today) {
      grantDaily.mutate();
    }
  }, [user, summary?.last_daily_grant]);

  if (!user) return null;

  if (isLoading || !summary) {
    return (
      <div className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-muted/50 border border-border animate-pulse">
        <Coins className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">--</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => navigate('/credits')}
            className="flex items-center gap-2 h-8 px-3 rounded-full border border-border hover:border-primary/30 bg-card/80 hover:bg-card transition-all group"
          >
            <Coins className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold tabular-nums">
              {formatCredits(summary.balance)}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-56 p-3">
          <div className="space-y-2">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-primary" />
              {summary.balance.toFixed(1)} crédits
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-blue-500" /> Quotidiens
                </span>
                <span>
                  {summary.daily_remaining.toFixed(1)}
                  {summary.daily_expires_at && (
                    <span className="ml-1 text-[10px] opacity-70">
                      <Clock className="h-2.5 w-2.5 inline mr-0.5" />
                      {timeUntil(summary.daily_expires_at)}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Gift className="h-3 w-3 text-green-500" /> Bonus
                </span>
                <span>{summary.bonus_remaining.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ShoppingBag className="h-3 w-3 text-purple-500" /> Achetés
                </span>
                <span>{summary.purchased_remaining.toFixed(1)}</span>
              </div>
            </div>
            <div className="pt-1.5 border-t border-border text-[10px] text-center text-muted-foreground">
              Cliquez pour voir le détail et acheter
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
