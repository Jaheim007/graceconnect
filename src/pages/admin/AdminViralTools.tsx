import { Link } from '@/lib/router-compat';
import { useI18n } from '@/i18n/I18nContext';
import { AdminPageShell } from './AdminPageShell';
import { MailCheck, Bell, CreditCard, Clock, Webhook, FlaskConical, ArrowRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function AdminViralTools() {
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';

  const tools = [
    {
      to: '/admin/crm',
      icon: MailCheck,
      label: 'CRM',
      desc: isFr ? 'Campagnes email & contacts' : 'Email campaigns & contacts',
      gradient: 'from-sky-500/20 via-sky-500/5 to-transparent',
      iconBg: 'bg-sky-500/15',
      iconColor: 'text-sky-400',
      borderHover: 'hover:border-sky-500/40',
    },
    {
      to: '/admin/notifications',
      icon: Bell,
      label: isFr ? 'Notifications' : 'Notifications',
      desc: isFr ? 'Alertes push & email' : 'Push & email alerts',
      gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-400',
      borderHover: 'hover:border-amber-500/40',
    },
    {
      to: '/admin/subscriptions',
      icon: CreditCard,
      label: isFr ? 'Abonnements' : 'Subscriptions',
      desc: isFr ? 'Plans de facturation récurrente' : 'Recurring billing plans',
      gradient: 'from-violet-500/20 via-violet-500/5 to-transparent',
      iconBg: 'bg-violet-500/15',
      iconColor: 'text-violet-400',
      borderHover: 'hover:border-violet-500/40',
    },
    {
      to: '/admin/waitlists',
      icon: Clock,
      label: isFr ? 'Listes d\'attente' : 'Waitlists',
      desc: isFr ? 'Listes de pré-lancement' : 'Pre-launch signup lists',
      gradient: 'from-teal-500/20 via-teal-500/5 to-transparent',
      iconBg: 'bg-teal-500/15',
      iconColor: 'text-teal-400',
      borderHover: 'hover:border-teal-500/40',
    },
    {
      to: '/admin/webhooks',
      icon: Webhook,
      label: 'Webhooks',
      desc: isFr ? 'Intégrations externes' : 'External integrations',
      gradient: 'from-rose-500/20 via-rose-500/5 to-transparent',
      iconBg: 'bg-rose-500/15',
      iconColor: 'text-rose-400',
      borderHover: 'hover:border-rose-500/40',
    },
    {
      to: '/admin/experiments',
      icon: FlaskConical,
      label: isFr ? 'Tests A/B' : 'A/B Tests',
      desc: isFr ? 'Tester & optimiser les conversions' : 'Test & optimize conversions',
      gradient: 'from-lime-500/20 via-lime-500/5 to-transparent',
      iconBg: 'bg-lime-500/15',
      iconColor: 'text-lime-400',
      borderHover: 'hover:border-lime-500/40',
    },
  ];

  return (
    <AdminPageShell
      title="Viral Tools"
      subtitle={isFr ? 'Outils avancés pour automatiser et optimiser' : 'Advanced tools to automate and optimize'}
      backRoute="/admin/content"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((item, i) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: 'spring', stiffness: 260, damping: 24 }}
          >
            <Link
              to={item.to}
              className={cn(
                'relative flex items-center gap-4 p-5 rounded-2xl border border-border/60 transition-all duration-300 group overflow-hidden',
                'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
                item.borderHover
              )}
            >
              {/* Gradient glow background */}
              <div className={cn(
                'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                item.gradient
              )} />

              {/* Shimmer on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -skew-x-12" />

              {/* Icon */}
              <div className={cn(
                'relative h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110',
                item.iconBg
              )}>
                <item.icon className={cn('h-5.5 w-5.5', item.iconColor)} />
              </div>

              {/* Text */}
              <div className="relative flex-1 min-w-0">
                <h3 className="font-semibold text-sm tracking-tight">{item.label}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.desc}</p>
              </div>

              {/* Arrow */}
              <ArrowRight className={cn(
                'relative h-4 w-4 shrink-0 transition-all duration-300',
                'text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-1'
              )} />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Decorative bottom hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-2 pt-6 text-xs text-muted-foreground/50"
      >
        
        <span>{isFr ? 'Plus d\'outils bientôt' : 'More tools coming soon'}</span>
      </motion.div>
    </AdminPageShell>
  );
}
