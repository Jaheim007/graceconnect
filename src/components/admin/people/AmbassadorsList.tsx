import { Link2, MousePointerClick, ShoppingCart, TrendingUp, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/currency';

interface Props {
  ambassadors: any[];
  isLoading: boolean;
  currency: string;
  isFr: boolean;
}

export default function AmbassadorsList({ ambassadors, isLoading, currency, isFr }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-[88px] rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (ambassadors.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <div className="h-14 w-14 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <Link2 className="h-7 w-7 text-emerald-500 opacity-50" />
        </div>
        <p className="text-sm font-semibold">{isFr ? 'Aucun ambassadeur' : 'No ambassadors yet'}</p>
        <p className="text-xs mt-1 max-w-xs mx-auto opacity-70">
          {isFr
            ? 'Activez l\'affiliation dans les paramètres pour attirer des ambassadeurs.'
            : 'Enable affiliation in settings to attract ambassadors.'}
        </p>
        <Link
          to="/admin/settings"
          className="inline-flex items-center gap-1 text-xs text-primary mt-3 hover:underline font-medium"
        >
          {isFr ? 'Paramètres d\'affiliation' : 'Affiliation settings'}
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {ambassadors.map((ambassador: any, i: number) => {
        const convRate = ambassador.clicks > 0
          ? ((ambassador.conversions || 0) / ambassador.clicks * 100).toFixed(1)
          : '0';
        const earned = ambassador.total_earned || 0;

        return (
          <motion.div
            key={ambassador.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 30 }}
            className="group relative flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/40 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 overflow-hidden"
          >
            {/* Subtle gradient accent on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Avatar */}
            <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0 overflow-hidden ring-2 ring-background shadow-sm">
              {ambassador.profile?.avatar_url ? (
                <img src={ambassador.profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                (ambassador.profile?.display_name?.[0] || '?').toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="relative flex-1 min-w-0">
              <p className="text-sm font-semibold truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {ambassador.profile?.display_name || (isFr ? 'Ambassadeur' : 'Ambassador')}
              </p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                  {ambassador.code}
                </span>
                <StatChip icon={MousePointerClick} value={ambassador.clicks || 0} label={isFr ? 'clics' : 'clicks'} />
                <StatChip icon={ShoppingCart} value={ambassador.conversions || 0} label={isFr ? 'ventes' : 'sales'} />
                <StatChip icon={TrendingUp} value={`${convRate}%`} label={isFr ? 'conv.' : 'conv.'} />
              </div>
            </div>

            {/* Earnings */}
            <div className="relative text-right shrink-0">
              <p className={cn(
                'text-base font-extrabold tabular-nums',
                earned > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
              )}>
                {formatCurrency(earned, currency)}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">{isFr ? 'gagné' : 'earned'}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function StatChip({ icon: Icon, value, label }: { icon: any; value: string | number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      <Icon className="h-3 w-3 opacity-60" />
      <span className="font-semibold">{value}</span>
      <span className="hidden sm:inline opacity-60">{label}</span>
    </span>
  );
}
