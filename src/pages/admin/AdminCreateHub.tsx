import { Link } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import {
  ShoppingBag, GraduationCap, Play, Megaphone, CalendarDays,
  Heart, Tag, ArrowRight, Sparkles, MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const createItems = [
  { to: '/admin/products', icon: ShoppingBag, labelKey: 'create_hub.products', descKey: 'create_hub.products_desc', color: 'text-primary bg-primary/10 border-primary/20' },
  { to: '/admin/media', icon: Play, labelKey: 'create_hub.media', descKey: 'create_hub.media_desc', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { to: '/admin/programs', icon: GraduationCap, labelKey: 'create_hub.programs', descKey: 'create_hub.programs_desc', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { to: '/admin/campaigns', icon: Heart, labelKey: 'create_hub.campaigns', descKey: 'create_hub.campaigns_desc', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  { to: '/admin/events', icon: CalendarDays, labelKey: 'create_hub.events', descKey: 'create_hub.events_desc', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  { to: '/admin/announcements', icon: Megaphone, labelKey: 'create_hub.announcements', descKey: 'create_hub.announcements_desc', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { to: '/admin/promo-codes', icon: Tag, labelKey: 'create_hub.promos', descKey: 'create_hub.promos_desc', color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' },
  { to: '/admin/offerings', icon: Heart, labelKey: 'create_hub.donations', descKey: 'create_hub.donations_desc', color: 'text-pink-500 bg-pink-500/10 border-pink-500/20' },
  { to: '/admin/popups', icon: MessageSquare, labelKey: 'create_hub.popups', descKey: 'create_hub.popups_desc', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
];

export default function AdminCreateHub() {
  const { currentOrg } = useOrg();
  const { t } = useI18n();

  const { data: counts } = useQuery({
    queryKey: ['create-hub-counts', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return {};
      const [products, programs, media, campaigns, announcements, events] = await Promise.all([
        db.from('digital_products').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrg.id),
        db.from('programs').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrg.id),
        db.from('media_content').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrg.id),
        db.from('donation_campaigns').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrg.id),
        db.from('announcements').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrg.id),
        db.from('events').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrg.id),
      ]);
      return {
        '/admin/products': products.count || 0,
        '/admin/programs': programs.count || 0,
        '/admin/media': media.count || 0,
        '/admin/campaigns': campaigns.count || 0,
        '/admin/announcements': announcements.count || 0,
        '/admin/events': events.count || 0,
      } as Record<string, number>;
    },
    enabled: !!currentOrg?.id,
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Viral AI Studio</h1>
          <p className="text-sm text-muted-foreground">{t('create_hub.subtitle')}</p>
        </div>
      </div>

      {/* AI Writer CTA — Write a book */}
      <Link
        to="/ecrire"
        className="relative flex items-center gap-4 p-5 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 hover:border-primary/50 transition-all group overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
        />
        <motion.div
          className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-lg shadow-primary/30"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </motion.div>
        <div className="relative flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base">{t('create_hub.ai_writer')}</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary">AI</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{t('create_hub.ai_writer_desc')}</p>
        </div>
        <ArrowRight className="relative h-5 w-5 text-primary shrink-0 group-hover:translate-x-1.5 transition-transform" />
      </Link>

      {/* AI Course CTA — Create a course */}
      <Link
        to="/admin/programs/new"
        className="relative flex items-center gap-4 p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-accent/5 to-emerald-500/5 hover:border-emerald-500/50 transition-all group overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'linear', repeatDelay: 2.5 }}
        />
        <motion.div
          className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <GraduationCap className="h-7 w-7 text-white" />
        </motion.div>
        <div className="relative flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base">{t('create_hub.ai_course')}</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500">AI</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{t('create_hub.ai_course_desc')}</p>
        </div>
        <ArrowRight className="relative h-5 w-5 text-emerald-500 shrink-0 group-hover:translate-x-1.5 transition-transform" />
      </Link>

      {/* Grid of content types */}
      <div className="grid gap-3 sm:grid-cols-2">
        {createItems.map((item, i) => {
          const count = counts?.[item.to];
          const colorParts = item.color.split(' ');
          const textColor = colorParts[0];
          const bgColor = colorParts[1];
          const borderColor = colorParts[2];

          return (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 260, damping: 24 }}
            >
              <Link
                to={item.to}
                className={cn(
                  'relative flex items-center gap-4 p-5 rounded-2xl border transition-all group overflow-hidden',
                  'hover:shadow-lg hover:-translate-y-0.5',
                  borderColor,
                  'hover:border-opacity-60'
                )}
              >
                {/* Subtle shimmer on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className={cn(
                  'relative h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
                  bgColor
                )}>
                  <item.icon className={cn('h-5 w-5', textColor)} />
                </div>
                <div className="relative flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">{t(item.labelKey)}</h3>
                    {count !== undefined && count > 0 && (
                      <span className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        bgColor, textColor
                      )}>{count}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{t(item.descKey)}</p>
                </div>
                <ArrowRight className={cn(
                  'relative h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all',
                  textColor
                )} />
              </Link>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
