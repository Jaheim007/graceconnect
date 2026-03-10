import { Sparkles } from 'lucide-react';
import { useCreditsBalance, useGrantDailyCredits } from '@/hooks/useCredits';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

function formatCredits(n: number): string {
  if (n >= 1000) return Math.floor(n).toLocaleString('fr-FR');
  if (n >= 100) return Math.floor(n).toString();
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(1);
}

export function CreditBalance() {
  const { user } = useAuth();
  const { data: summary, isLoading } = useCreditsBalance();
  const grantDaily = useGrantDailyCredits();
  const navigate = useNavigate();

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
      <div className="flex items-center gap-1 h-7 px-2 rounded-full bg-muted/50 border border-border animate-pulse shrink-0">
        <Sparkles className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">--</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => navigate('/credits')}
      className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all shrink-0 whitespace-nowrap"
      title={`${summary.balance.toFixed(1)} crédits`}
    >
      <Sparkles className="h-3 w-3 text-primary shrink-0" />
      <span className="text-xs font-bold tabular-nums text-primary leading-none">
        {formatCredits(summary.balance)}
      </span>
    </button>
  );
}
