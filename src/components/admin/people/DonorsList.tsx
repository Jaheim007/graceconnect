import { Heart, Calendar, HandCoins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/currency';

interface Donor {
  donor_key: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  total_donated: number;
  donation_count: number;
  last_donation_at: string;
}

interface Props {
  donors: Donor[];
  isLoading: boolean;
  currency: string;
  isFr: boolean;
}

export default function DonorsList({ donors, isLoading, currency, isFr }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-[88px] rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (donors.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <div className="h-14 w-14 mx-auto mb-4 rounded-2xl bg-rose-500/10 flex items-center justify-center">
          <Heart className="h-7 w-7 text-rose-500 opacity-50" />
        </div>
        <p className="text-sm font-semibold">{isFr ? 'Aucun donateur' : 'No donors yet'}</p>
        <p className="text-xs mt-1 max-w-xs mx-auto opacity-70">
          {isFr
            ? 'Les donateurs apparaîtront ici après leur premier don.'
            : 'Donors will appear here after their first donation.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {donors.map((donor, i) => (
        <motion.div
          key={donor.donor_key || i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 30 }}
          className="group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/40 hover:border-rose-500/20 hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-300"
        >
          {/* Avatar */}
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-500/5 flex items-center justify-center text-sm font-bold text-rose-600 dark:text-rose-400 shrink-0 overflow-hidden ring-2 ring-background shadow-sm">
            {donor.avatar_url ? (
              <img src={donor.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              (donor.display_name?.[0] || donor.email?.[0] || '?').toUpperCase()
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              {donor.display_name || donor.email?.split('@')[0] || (isFr ? 'Donateur' : 'Donor')}
            </p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <HandCoins className="h-3 w-3 opacity-60" />
                <span className="font-semibold">{donor.donation_count}</span>
                <span className="hidden sm:inline opacity-60">{isFr ? 'dons' : 'donations'}</span>
              </span>
              {donor.last_donation_at && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3 opacity-60" />
                  <span className="opacity-60">{format(new Date(donor.last_donation_at), 'dd/MM/yyyy')}</span>
                </span>
              )}
            </div>
          </div>

          {/* Total donated */}
          <div className="text-right shrink-0">
            <p className={cn(
              'text-base font-extrabold tabular-nums',
              donor.total_donated > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
            )}>
              {formatCurrency(donor.total_donated, currency)}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">{isFr ? 'donné' : 'donated'}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
