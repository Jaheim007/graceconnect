import { ReactNode } from 'react';
import { Inbox, Search, Heart, ShoppingBag, Play, Users, Compass, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type EmptyVariant = 'orgs' | 'content' | 'campaigns' | 'purchases' | 'feed' | 'search' | 'members' | 'generic';

const variants: Record<EmptyVariant, { icon: ReactNode; title: string; desc: string; hint?: string }> = {
  orgs: {
    icon: <Users className="h-10 w-10" />,
    title: 'Aucune plateforme',
    desc: 'Soyez le premier à découvrir et rejoindre une communauté.',
    hint: '💡 Cliquez sur "Explorer" dans le menu pour découvrir des communautés.',
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
    hint: '💡 Visitez la boutique d\'une communauté pour découvrir des ressources.',
  },
  feed: {
    icon: <Inbox className="h-10 w-10" />,
    title: 'Votre fil est vide',
    desc: 'Rejoignez des communautés pour voir leur contenu ici.',
    hint: '💡 Commencez par explorer les communautés disponibles.',
  },
  search: {
    icon: <Search className="h-10 w-10" />,
    title: 'Aucun résultat',
    desc: 'Essayez d\'ajuster votre recherche ou vos filtres.',
  },
  members: {
    icon: <Users className="h-10 w-10" />,
    title: 'Aucun membre',
    desc: 'Invitez des personnes à rejoindre cette plateforme.',
    hint: '💡 Partagez le lien de votre page pour recruter des membres.',
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center gap-4',
        className
      )}
    >
      <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground/40">
        {v.icon}
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h3 className="font-semibold text-foreground text-lg">{title || v.title}</h3>
        <p className="text-sm text-muted-foreground">{description || v.desc}</p>
        {v.hint && (
          <p className="text-xs text-muted-foreground/70 mt-2 bg-muted/30 rounded-lg px-3 py-2">
            {v.hint}
          </p>
        )}
      </div>
      {action && (
        <Button onClick={action.onClick} size="sm" className="mt-2 bg-primary text-primary-foreground border-0 gap-1.5">
          {action.label} <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </motion.div>
  );
}
