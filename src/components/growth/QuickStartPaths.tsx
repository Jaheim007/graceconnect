import { motion } from 'framer-motion';
import { BookOpen, Store, Share2, Wallet } from 'lucide-react';
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

  // Smart routing: logged-in users go to functional pages, not marketing
  const sellRoute = hasManageableOrg ? '/admin/products' : '/create-org';
  const shareRoute = '/gagner';
  const earnRoute = '/gagner';

  const paths = [
    {
      id: 'write',
      icon: BookOpen,
      emoji: '✏️',
      title: isFr ? 'Écrire' : 'Write',
      subtitle: isFr ? "L'IA écrit ton livre" : 'AI writes your book',
      route: '/ecrire',
      accent: 'border-primary/30 hover:border-primary/60',
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      id: 'sell',
      icon: Store,
      emoji: '🛒',
      title: isFr ? 'Vendre' : 'Sell',
      subtitle: isFr ? 'Publie et monétise' : 'Publish & monetize',
      route: sellRoute,
      accent: 'border-amber-500/30 hover:border-amber-500/60',
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      id: 'share',
      icon: Share2,
      emoji: '📲',
      title: isFr ? 'Partager' : 'Share',
      subtitle: isFr ? 'Deviens ambassadeur' : 'Become ambassador',
      route: shareRoute,
      accent: 'border-emerald-500/30 hover:border-emerald-500/60',
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      id: 'earn',
      icon: Wallet,
      emoji: '💰',
      title: isFr ? 'Gagner' : 'Earn',
      subtitle: isFr ? 'Suis tes revenus' : 'Track your earnings',
      route: earnRoute,
      accent: 'border-violet-500/30 hover:border-violet-500/60',
      iconColor: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {paths.map((path, i) => (
        <motion.button
          key={path.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.2 }}
          onClick={() => navigate(path.route)}
          className={cn(
            'flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-card transition-all',
            path.accent
          )}
        >
          <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', path.bgColor)}>
            <path.icon className={cn('h-4 w-4', path.iconColor)} />
          </div>
          <span className="text-[11px] font-bold">{path.title}</span>
          <span className="text-[9px] text-muted-foreground leading-tight text-center">{path.subtitle}</span>
        </motion.button>
      ))}
    </div>
  );
}
