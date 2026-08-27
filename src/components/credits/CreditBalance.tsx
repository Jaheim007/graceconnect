import { useCreditsBalance, useGrantDailyCredits } from '@/hooks/useCredits';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from '@/lib/router-compat';
import { useEffect } from 'react';
import { useI18n } from '@/i18n/I18nContext';

function formatCredits(n: number, numLoc: string): string {
  if (n >= 1000) return Math.floor(n).toLocaleString(numLoc);
  if (n >= 100) return Math.floor(n).toString();
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(1);
}

/** Animated spinning coin icon */
function CoinIcon({ className }: { className?: string }) {
  return (
    <span className={className} style={{ display: 'inline-flex', perspective: '60px' }}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
        style={{
          animation: 'coin-spin 3s ease-in-out infinite',
        }}
      >
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fill="currentColor"
          fontSize="11"
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
        >
          C
        </text>
      </svg>
    </span>
  );
}

export function CreditBalance() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const numLoc = isFr ? 'fr-FR' : 'en-US';
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
        <CoinIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">--</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => navigate('/credits')}
      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all shrink-0 whitespace-nowrap"
      title={`${summary.balance.toFixed(1)} ${isFr ? 'crédits' : 'credits'}`}
    >
      <CoinIcon className="h-4 w-4 text-primary shrink-0" />
      <span className="text-xs font-bold tabular-nums text-primary leading-none">
        {formatCredits(summary.balance, numLoc)}
      </span>
    </button>
  );
}
