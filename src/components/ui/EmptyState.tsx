import { ReactNode } from 'react';
import { Inbox, Search, Heart, ShoppingBag, Play, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EmptyVariant = 'orgs' | 'content' | 'campaigns' | 'purchases' | 'feed' | 'search' | 'members' | 'generic';

const variants: Record<EmptyVariant, { icon: ReactNode; title: string; desc: string }> = {
  orgs: {
    icon: <Users className="h-10 w-10" />,
    title: 'No organizations yet',
    desc: 'Be the first to discover and join a community.',
  },
  content: {
    icon: <Play className="h-10 w-10" />,
    title: 'No content published',
    desc: 'Check back soon for videos, audio, and more.',
  },
  campaigns: {
    icon: <Heart className="h-10 w-10" />,
    title: 'No active campaigns',
    desc: 'There are no donation campaigns running right now.',
  },
  purchases: {
    icon: <ShoppingBag className="h-10 w-10" />,
    title: 'No purchases yet',
    desc: "You haven't bought any digital products yet.",
  },
  feed: {
    icon: <Inbox className="h-10 w-10" />,
    title: 'Your feed is empty',
    desc: 'Join communities to see content from organizations here.',
  },
  search: {
    icon: <Search className="h-10 w-10" />,
    title: 'No results found',
    desc: 'Try adjusting your search or filters.',
  },
  members: {
    icon: <Users className="h-10 w-10" />,
    title: 'No members yet',
    desc: 'Invite people to join this organization.',
  },
  generic: {
    icon: <Inbox className="h-10 w-10" />,
    title: 'Nothing here yet',
    desc: 'Come back later.',
  },
};

interface EmptyStateProps {
  variant?: EmptyVariant;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({
  variant = 'generic',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const v = variants[variant];
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center gap-4',
        className
      )}
    >
      <div className="text-muted-foreground/50">{v.icon}</div>
      <div className="space-y-1.5">
        <h3 className="font-semibold text-foreground">{title || v.title}</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{description || v.desc}</p>
      </div>
      {action && (
        <Button onClick={action.onClick} size="sm" className="mt-2 gold-gradient text-primary-foreground border-0 shadow-gold">
          {action.label}
        </Button>
      )}
    </div>
  );
}
