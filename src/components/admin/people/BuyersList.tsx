import { ShoppingBag, Package, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/currency';

interface Buyer {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  total_spent: number;
  purchase_count: number;
  last_purchase_at: string;
  products: string[];
}

interface Props {
  buyers: Buyer[];
  isLoading: boolean;
  currency: string;
  isFr: boolean;
}

export default function BuyersList({ buyers, isLoading, currency, isFr }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-[88px] rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (buyers.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <div className="h-14 w-14 mx-auto mb-4 rounded-2xl bg-blue-500/10 flex items-center justify-center">
          <ShoppingBag className="h-7 w-7 text-blue-500 opacity-50" />
        </div>
        <p className="text-sm font-semibold">{isFr ? 'Aucun acheteur' : 'No buyers yet'}</p>
        <p className="text-xs mt-1 max-w-xs mx-auto opacity-70">
          {isFr
            ? 'Les acheteurs apparaîtront ici après leur premier achat.'
            : 'Buyers will appear here after their first purchase.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {buyers.map((buyer, i) => (
        <motion.div
          key={buyer.user_id || i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 30 }}
          className="group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/40 hover:border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
        >
          {/* Avatar */}
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400 shrink-0 overflow-hidden ring-2 ring-background shadow-sm">
            {buyer.avatar_url ? (
              <img src={buyer.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              (buyer.display_name?.[0] || buyer.email?.[0] || '?').toUpperCase()
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {buyer.display_name || buyer.email || (isFr ? 'Acheteur' : 'Buyer')}
            </p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Package className="h-3 w-3 opacity-60" />
                <span className="font-semibold">{buyer.purchase_count}</span>
                <span className="hidden sm:inline opacity-60">{isFr ? 'achats' : 'purchases'}</span>
              </span>
              {buyer.last_purchase_at && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3 opacity-60" />
                  <span className="opacity-60">{format(new Date(buyer.last_purchase_at), 'dd/MM/yyyy')}</span>
                </span>
              )}
            </div>
          </div>

          {/* Total spent */}
          <div className="text-right shrink-0">
            <p className={cn(
              'text-base font-extrabold tabular-nums',
              buyer.total_spent > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'
            )}>
              {formatCurrency(buyer.total_spent, currency)}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">{isFr ? 'dépensé' : 'spent'}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
