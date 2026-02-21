import { ReactNode } from 'react';
import { Inbox, Search, Heart, ShoppingBag, Play, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EmptyVariant = 'orgs' | 'content' | 'campaigns' | 'purchases' | 'feed' | 'search' | 'members' | 'generic';

const variants: Record<EmptyVariant, { icon: ReactNode; title: string; desc: string }> = {
  orgs: {
    icon: <Users className="h-10 w-10" />,
    title: 'Aucune organisation',
    desc: 'Soyez le premier à découvrir et rejoindre une communauté.',
  },
  content: {
    icon: <Play className="h-10 w-10" />,
    title: 'Aucun contenu publié',
    desc: 'Revenez bientôt pour des vidéos, audios et plus encore.',
  },
  campaigns: {
    icon: <Heart className="h-10 w-10" />,
    title: 'Aucune campagne active',
    desc: 'Il n\'y a pas de campagne de dons en cours.',
  },
  purchases: {
    icon: <ShoppingBag className="h-10 w-10" />,
    title: 'Aucun achat',
    desc: 'Vous n\'avez pas encore acheté de produit.',
  },
  feed: {
    icon: <Inbox className="h-10 w-10" />,
    title: 'Votre fil est vide',
    desc: 'Rejoignez des communautés pour voir leur contenu ici.',
  },
  search: {
    icon: <Search className="h-10 w-10" />,
    title: 'Aucun résultat',
    desc: 'Essayez d\'ajuster votre recherche ou vos filtres.',
  },
  members: {
    icon: <Users className="h-10 w-10" />,
    title: 'Aucun membre',
    desc: 'Invitez des personnes à rejoindre cette organisation.',
  },
  generic: {
    icon: <Inbox className="h-10 w-10" />,
    title: 'Rien ici pour le moment',
    desc: 'Revenez plus tard.',
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
