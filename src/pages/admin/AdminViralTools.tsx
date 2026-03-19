import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { AdminPageShell } from './AdminPageShell';
import {
  MailCheck, Bell, CreditCard, Clock, Webhook, FlaskConical,
  ArrowRight, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function AdminViralTools() {
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';

  const tools = [
    { to: '/admin/crm', icon: MailCheck, label: 'CRM', desc: t('create_hub.crm_desc'), color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' },
    { to: '/admin/notifications', icon: Bell, label: t('create_hub.notifications'), desc: t('create_hub.notifications_desc'), color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    { to: '/admin/subscriptions', icon: CreditCard, label: t('create_hub.subscriptions'), desc: t('create_hub.subscriptions_desc'), color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' },
    { to: '/admin/waitlists', icon: Clock, label: t('create_hub.waitlists'), desc: t('create_hub.waitlists_desc'), color: 'text-slate-500 bg-slate-500/10 border-slate-500/20' },
    { to: '/admin/webhooks', icon: Webhook, label: 'Webhooks', desc: t('create_hub.webhooks_desc'), color: 'text-gray-500 bg-gray-500/10 border-gray-500/20' },
    { to: '/admin/experiments', icon: FlaskConical, label: t('create_hub.experiments'), desc: t('create_hub.experiments_desc'), color: 'text-lime-500 bg-lime-500/10 border-lime-500/20' },
  ];

  return (
    <AdminPageShell
      title="Viral Tools"
      subtitle={isFr ? 'Outils avancés pour automatiser et optimiser' : 'Advanced tools to automate and optimize'}
      backRoute="/admin/create"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {tools.map((item, i) => {
          const colorParts = item.color.split(' ');
          const iconColor = colorParts[0] + ' ' + colorParts[1];
          const borderColor = colorParts[2];

          return (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={item.to}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md group',
                  borderColor,
                  'hover:border-primary/30'
                )}
              >
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', iconColor)}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{item.label}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </AdminPageShell>
  );
}
