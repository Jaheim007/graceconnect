import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingBag, Heart, Megaphone, GraduationCap, Calendar, CreditCard, Star, ChevronRight, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserNotification } from '@/types/database';
import { Button } from '@/components/ui/button';

const TYPE_CONFIG: Record<string, { icon: typeof Bell; bg: string; fg: string; ring: string }> = {
  new_product: { icon: ShoppingBag, bg: 'bg-blue-500/12', fg: 'text-blue-500', ring: 'ring-blue-500/20' },
  purchase: { icon: CreditCard, bg: 'bg-emerald-500/12', fg: 'text-emerald-500', ring: 'ring-emerald-500/20' },
  new_announcement: { icon: Megaphone, bg: 'bg-amber-500/12', fg: 'text-amber-500', ring: 'ring-amber-500/20' },
  new_program: { icon: GraduationCap, bg: 'bg-purple-500/12', fg: 'text-purple-500', ring: 'ring-purple-500/20' },
  new_event: { icon: Calendar, bg: 'bg-rose-500/12', fg: 'text-rose-500', ring: 'ring-rose-500/20' },
  donation: { icon: Heart, bg: 'bg-pink-500/12', fg: 'text-pink-500', ring: 'ring-pink-500/20' },
  review: { icon: Star, bg: 'bg-yellow-500/12', fg: 'text-yellow-500', ring: 'ring-yellow-500/20' },
};

const DEFAULT_CONFIG = { icon: Bell, bg: 'bg-primary/12', fg: 'text-primary', ring: 'ring-primary/20' };

interface NotificationItemProps {
  notification: UserNotification;
  locale: string;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function NotificationItem({ notification: n, locale, onMarkRead, onDismiss }: NotificationItemProps) {
  const navigate = useNavigate();
  const config = TYPE_CONFIG[n.notification_type] || DEFAULT_CONFIG;
  const Icon = config.icon;
  const isFr = locale === 'fr';

  const handleClick = () => {
    if (!n.is_read) onMarkRead(n.id);
    if (n.action_url) navigate(n.action_url);
  };

  const timeStr = new Date(n.created_at).toLocaleTimeString(
    isFr ? 'fr-FR' : 'en-US',
    { hour: '2-digit', minute: '2-digit' }
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.985 }}
      className={cn(
        'group relative flex items-start gap-3 overflow-hidden rounded-2xl border p-3.5 cursor-pointer transition-all duration-200',
        n.is_read
          ? 'border-border/60 bg-card/60 hover:border-border hover:bg-card'
          : 'border-primary/20 bg-gradient-to-br from-primary/[0.07] via-card to-card shadow-[0_8px_24px_-18px_hsl(var(--primary)/0.7)] hover:border-primary/35'
      )}
      onClick={handleClick}
    >
      {/* Unread accent bar */}
      {!n.is_read && (
        <span aria-hidden className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-primary" />
      )}

      {/* Icon avatar */}
      <div
        className={cn(
          'grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 ring-inset',
          config.bg,
          config.ring
        )}
      >
        {n.image_url ? (
          <img src={n.image_url} alt="" loading="lazy" className="h-11 w-11 rounded-2xl object-cover" />
        ) : (
          <Icon className={cn('h-5 w-5', config.fg)} />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className={cn('flex-1 text-sm leading-snug', !n.is_read ? 'font-bold text-foreground' : 'font-medium text-foreground/80')}>
            {n.title}
          </p>
          <span className="shrink-0 pt-0.5 text-[11px] tabular-nums text-muted-foreground/70">{timeStr}</span>
        </div>
        {n.body && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-3">{n.body}</p>
        )}

        <div className="mt-2 flex items-center gap-1">
          {n.action_url && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary">
              {isFr ? 'Ouvrir' : 'Open'}
              <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 gap-1 rounded-full px-2 text-[11px] text-muted-foreground hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only">{isFr ? 'Supprimer' : 'Delete'}</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
