import { motion } from 'framer-motion';
import { BookOpen, Store, Share2, Compass, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';

export function QuickStartPaths() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userOrgs, canManage } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const hasManageableOrg = userOrgs.some(o => canManage(o.id));

  const paths = [
    {
      id: 'write',
      icon: BookOpen,
      title: isFr ? 'Écrire un livre' : 'Write a book',
      subtitle: isFr ? "L'IA écrit, tu publies" : 'AI writes, you publish',
      route: '/ecrire',
      border: 'border-primary/30 hover:border-primary/60',
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      id: 'sell',
      icon: Store,
      title: isFr ? 'Vendre' : 'Sell',
      subtitle: isFr ? 'Publie et monétise' : 'Publish & monetize',
      route: hasManageableOrg ? '/admin/products' : '/create-org',
      border: 'border-amber-500/30 hover:border-amber-500/60',
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      id: 'share',
      icon: Share2,
      title: isFr ? 'Gagner' : 'Earn',
      subtitle: isFr ? 'Partage et gagne' : 'Share & earn',
      route: '/gagner',
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      id: 'discover',
      icon: Compass,
      title: isFr ? 'Découvrir' : 'Discover',
      subtitle: isFr ? 'Livres, cours et plus' : 'Books, courses & more',
      route: '/discover',
      border: 'border-violet-500/30 hover:border-violet-500/60',
      iconColor: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
  ];

  return (
    <div className="space-y-2">
      {paths.map((path, i) => (
        <motion.button
          key={path.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.2 }}
          onClick={() => navigate(path.route)}
          className={cn(
            'w-full flex items-center gap-3 p-3 rounded-xl border bg-card transition-all group text-left',
            'hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]',
            path.border
          )}
        >
          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', path.bgColor)}>
            <path.icon className={cn('h-4.5 w-4.5', path.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold block">{path.title}</span>
            <span className="text-[11px] text-muted-foreground">{path.subtitle}</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
        </motion.button>
      ))}
    </div>
  );
}
