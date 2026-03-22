import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingBag, Heart, Megaphone, GraduationCap, Calendar, CreditCard, Star, MoreHorizontal, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserNotification } from '@/types/database';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const TYPE_CONFIG: Record<string, { icon: typeof Bell; bg: string; fg: string }> = {
  new_product: { icon: ShoppingBag, bg: 'bg-blue-500/10', fg: 'text-blue-500' },
  purchase: { icon: CreditCard, bg: 'bg-emerald-500/10', fg: 'text-emerald-500' },
  new_announcement: { icon: Megaphone, bg: 'bg-amber-500/10', fg: 'text-amber-500' },
  new_program: { icon: GraduationCap, bg: 'bg-purple-500/10', fg: 'text-purple-500' },
  new_event: { icon: Calendar, bg: 'bg-rose-500/10', fg: 'text-rose-500' },
  donation: { icon: Heart, bg: 'bg-pink-500/10', fg: 'text-pink-500' },
  review: { icon: Star, bg: 'bg-yellow-500/10', fg: 'text-yellow-500' },
};

const DEFAULT_CONFIG = { icon: Bell, bg: 'bg-primary/10', fg: 'text-primary' };

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

  const handleClick = () => {
    if (!n.is_read) onMarkRead(n.id);
    if (n.action_url) navigate(n.action_url);
  };

  const timeStr = new Date(n.created_at).toLocaleTimeString(
    locale === 'fr' ? 'fr-FR' : 'en-US',
    { hour: '2-digit', minute: '2-digit' }
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
      className={cn(
        'group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors',
        n.is_read
          ? 'hover:bg-muted/50'
          : 'bg-primary/[0.04] hover:bg-primary/[0.08]'
      )}
      onClick={handleClick}
    >
      {/* Unread dot */}
      <div className="w-2 shrink-0 flex justify-center">
        {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary" />}
      </div>

      {/* Icon avatar */}
      <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', config.bg)}>
        {n.image_url ? (
          <img src={n.image_url} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <Icon className={cn('h-4.5 w-4.5', config.fg)} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm leading-snug', !n.is_read ? 'font-semibold text-foreground' : 'text-foreground/80')}>
          {n.title}
        </p>
        {n.body && (
          <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
        )}
        <p className="text-[11px] text-muted-foreground/60 mt-1">{timeStr}</p>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }} className="text-destructive gap-2">
            <Trash2 className="h-3.5 w-3.5" /> Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
