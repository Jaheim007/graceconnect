import { Link } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import {
  PackageCheck, BookOpen, MonitorPlay, Megaphone, CalendarCheck2,
  HeartHandshake, Percent, ArrowRight, Gift, LayoutPanelTop, GraduationCap,
  FolderOpen, ChevronDown, TrendingUp, ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const secondaryItems = [
  { to: '/admin/media', icon: MonitorPlay, labelFr: 'Ajouter un média', labelEn: 'Add a media', descFr: 'Vidéos, audio et podcasts', descEn: 'Videos, audio and podcasts', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', countKey: 'media' as const },
  { to: '/admin/campaigns', icon: HeartHandshake, labelFr: 'Créer une campagne', labelEn: 'Create a campaign', descFr: 'Collectes de fonds et dons', descEn: 'Fundraising and donations', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  { to: '/admin/events', icon: CalendarCheck2, labelFr: 'Créer un événement', labelEn: 'Create an event', descFr: 'Événements en personne ou en ligne', descEn: 'In-person or online events', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  { to: '/admin/announcements', icon: Megaphone, labelFr: 'Créer une annonce', labelEn: 'Create an announcement', descFr: 'Nouvelles et actualités', descEn: 'News and updates for your community', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { to: '/admin/promo-codes', icon: Percent, labelFr: 'Créer un code promo', labelEn: 'Create a promo code', descFr: 'Réductions pour vos produits', descEn: 'Discounts for your products', color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' },
  { to: '/admin/popups', icon: LayoutPanelTop, labelFr: 'Créer un pop-up', labelEn: 'Create a pop-up banner', descFr: 'Pop-ups ciblés', descEn: 'Engage visitors with targeted pop-ups', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
];


export default function AdminContentHub() {
  const { currentOrg } = useOrg();
  const { locale } = useI18n();
  const { fmt } = useDisplayCurrency();
  const [showMore, setShowMore] = useState(false);
  const isFr = locale === 'fr';

  const { data: counts } = useQuery({
    queryKey: ['content-hub-counts', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return null;
      const [products, programs, media, revenue] = await Promise.all([
        db.from('digital_products').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrg.id),
        db.from('programs').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrg.id),
        db.from('media_content').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrg.id),
        db.from('product_purchases').select('amount').eq('organization_id', currentOrg.id).eq('status', 'completed'),
      ]);
      const totalRevenue = (revenue.data || []).reduce((sum, r) => sum + (r.amount || 0), 0);
      return { products: products.count || 0, programs: programs.count || 0, media: media.count || 0, revenue: totalRevenue };
    },
    enabled: !!currentOrg?.id,
    staleTime: 60_000,
  });

  return (
    <div className="space-y-5">
      {/* Back to settings */}
      <Link
        to="/admin/settings"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {isFr ? 'Paramètres' : 'Settings'}
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <FolderOpen className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {isFr ? 'Mes Contenus' : 'My Content'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isFr ? 'Ajoutez et gérez vos produits, formations et ressources' : 'Add and manage your products, courses and resources'}
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { value: String(counts?.products ?? 0), label: isFr ? 'Produits' : 'Products', color: 'text-primary' },
          { value: String(counts?.programs ?? 0), label: 'Formations', color: 'text-emerald-500' },
          { value: fmt(counts?.revenue ?? 0, currentOrg?.currency), label: isFr ? 'Revenus' : 'Revenue', color: 'text-amber-500' },
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

      {/* Primary grid: Add product + Add formation */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { to: '/admin/products', icon: PackageCheck, labelFr: 'Ajouter un produit', labelEn: 'Add a digital product', descFr: 'Ebooks, templates et plus', descEn: 'Sell ebooks, templates & more', color: 'text-primary bg-primary/10 border-primary/20' },
          { to: '/admin/programs', icon: BookOpen, labelFr: 'Ajouter une formation', labelEn: 'Add a formation', descFr: 'Formations et cours en ligne', descEn: 'Online formations and training', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
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
                  'flex flex-col gap-2.5 p-3.5 rounded-2xl border transition-all group hover:shadow-md hover:-translate-y-0.5',
                  borderColor
                )}
              >
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', bgColor)}>
                  <item.icon className={cn('h-5 w-5', textColor)} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs leading-tight">{isFr ? item.labelFr : item.labelEn}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{isFr ? item.descFr : item.descEn}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Quick access to existing content */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          to="/admin/products"
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-primary/20 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors"
        >
          <PackageCheck className="h-3.5 w-3.5" />
          {isFr ? `Voir mes produits (${counts?.products ?? 0})` : `View my products (${counts?.products ?? 0})`}
          <ArrowRight className="h-3 w-3" />
        </Link>
        <Link
          to="/admin/programs"
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 text-xs font-semibold hover:bg-emerald-500/10 transition-colors"
        >
          <GraduationCap className="h-3.5 w-3.5" />
          {isFr ? `Voir mes formations (${counts?.programs ?? 0})` : `View my courses (${counts?.programs ?? 0})`}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* More tools */}
      <div>
        <button
          onClick={() => setShowMore(v => !v)}
          className="sm:hidden w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {isFr ? 'Plus d\'outils' : 'More tools'}
          <ChevronDown className={cn('h-4 w-4 transition-transform', showMore && 'rotate-180')} />
        </button>

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
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-xs">{isFr ? item.labelFr : item.labelEn}</h3>
                        {'countKey' in item && item.countKey && counts?.[item.countKey] != null && (
                          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', bgColor, textColor)}>
                            {counts[item.countKey]}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{isFr ? item.descFr : item.descEn}</p>
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
