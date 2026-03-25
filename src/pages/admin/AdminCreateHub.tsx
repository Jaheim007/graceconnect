import { Link } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import {
  PackageCheck, BookOpen, MonitorPlay, Megaphone, CalendarCheck2,
  HeartHandshake, Percent, ArrowRight, Gift, LayoutPanelTop, GraduationCap,
  Wand2, PenLine, Zap, ChevronDown, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

/* ── Secondary items (hidden behind "More" on mobile) ── */
const secondaryItems = [
  { to: '/admin/media', icon: MonitorPlay, labelKey: 'create_hub.media', descKey: 'create_hub.media_desc', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { to: '/admin/campaigns', icon: HeartHandshake, labelKey: 'create_hub.campaigns', descKey: 'create_hub.campaigns_desc', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  { to: '/admin/events', icon: CalendarCheck2, labelKey: 'create_hub.events', descKey: 'create_hub.events_desc', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  { to: '/admin/announcements', icon: Megaphone, labelKey: 'create_hub.announcements', descKey: 'create_hub.announcements_desc', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { to: '/admin/promo-codes', icon: Percent, labelKey: 'create_hub.promos', descKey: 'create_hub.promos_desc', color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' },
  { to: '/admin/offerings', icon: Gift, labelKey: 'create_hub.donations', descKey: 'create_hub.donations_desc', color: 'text-pink-500 bg-pink-500/10 border-pink-500/20' },
  { to: '/admin/popups', icon: LayoutPanelTop, labelKey: 'create_hub.popups', descKey: 'create_hub.popups_desc', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
];

export default function AdminCreateHub() {
  const { currentOrg } = useOrg();
  const { t } = useI18n();
  const { fmt } = useDisplayCurrency();
  const [showMore, setShowMore] = useState(false);

  const { data: counts } = useQuery({
    queryKey: ['create-hub-counts', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return null;
      const [products, programs, media, revenue] = await Promise.all([
        db.from('digital_products').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrg.id),
        db.from('programs').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrg.id),
        db.from('media_content').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrg.id),
        db.from('product_purchases').select('amount').eq('organization_id', currentOrg.id).eq('status', 'completed'),
      ]);
      const totalRevenue = (revenue.data || []).reduce((sum, r) => sum + (r.amount || 0), 0);
      return {
        products: products.count || 0,
        programs: programs.count || 0,
        media: media.count || 0,
        revenue: totalRevenue,
      };
    },
    enabled: !!currentOrg?.id,
    staleTime: 60_000,
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Viral AI Studio</h1>
          <p className="text-sm text-muted-foreground">{t('create_hub.subtitle')}</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { value: String(counts?.products ?? 0), label: 'Produits', color: 'text-primary' },
          { value: String(counts?.programs ?? 0), label: 'Formations', color: 'text-emerald-500' },
          { value: String(counts?.media ?? 0), label: 'Médias', color: 'text-blue-500' },
          { value: fmt(counts?.revenue ?? 0, currentOrg?.currency), label: 'Revenus', color: 'text-amber-500' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="text-center p-3 rounded-xl border border-border bg-card"
          >
            <p className={cn('text-sm font-extrabold leading-none', s.color)}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* AI Writer CTA — Write a book */}
      <Link
        to="/ecrire"
        className="relative flex items-center gap-4 p-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 hover:border-primary/50 transition-all group overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
        />
        <motion.div
          className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-lg shadow-primary/30"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PenLine className="h-6 w-6 text-primary-foreground" />
        </motion.div>
        <div className="relative flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm">{t('create_hub.ai_writer')}</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">AI</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t('create_hub.ai_writer_desc')}</p>
        </div>
        <ArrowRight className="relative h-4 w-4 text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* AI Course CTA — Create a formation */}
      <Link
        to="/admin/programs"
        className="relative flex items-center gap-4 p-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-accent/5 to-emerald-500/5 hover:border-emerald-500/50 transition-all group overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'linear', repeatDelay: 2.5 }}
        />
        <motion.div
          className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <GraduationCap className="h-6 w-6 text-white" />
        </motion.div>
        <div className="relative flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm">{t('create_hub.ai_course')}</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500">AI</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t('create_hub.ai_course_desc')}</p>
        </div>
        <ArrowRight className="relative h-4 w-4 text-emerald-500 shrink-0 group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* Primary grid: Add product + Add formation */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { to: '/admin/products', icon: PackageCheck, labelKey: 'create_hub.products', descKey: 'create_hub.products_desc', color: 'text-primary bg-primary/10 border-primary/20' },
          { to: '/admin/programs', icon: BookOpen, labelKey: 'create_hub.programs', descKey: 'create_hub.programs_desc', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
        ].map((item, i) => {
          const [textColor, bgColor, borderColor] = item.color.split(' ');
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
                  'flex items-center gap-3 p-4 rounded-2xl border transition-all group hover:shadow-md hover:-translate-y-0.5',
                  borderColor
                )}
              >
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', bgColor)}>
                  <item.icon className={cn('h-5 w-5', textColor)} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs">{t(item.labelKey)}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{t(item.descKey)}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* More tools — collapsible on mobile, always shown on desktop */}
      <div>
        <button
          onClick={() => setShowMore(v => !v)}
          className="sm:hidden w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('create_hub.more_tools')}
          <ChevronDown className={cn('h-4 w-4 transition-transform', showMore && 'rotate-180')} />
        </button>

        {/* Desktop: always visible | Mobile: collapsible */}
        <div className={cn('sm:block', showMore ? 'block' : 'hidden')}>
          <div className="grid gap-2 sm:grid-cols-2">
            {secondaryItems.map((item, i) => {
              const [textColor, bgColor, borderColor] = item.color.split(' ');
              return (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    to={item.to}
                    className={cn(
                      'flex items-center gap-3 p-3.5 rounded-xl border transition-all group hover:shadow-sm hover:-translate-y-0.5',
                      borderColor
                    )}
                  >
                    <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', bgColor)}>
                      <item.icon className={cn('h-4 w-4', textColor)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-xs">{t(item.labelKey)}</h3>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{t(item.descKey)}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
