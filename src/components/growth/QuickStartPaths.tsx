import { motion } from 'framer-motion';
import {
  BookOpen, Store, Share2, Compass, ArrowRight, Calendar, Gift,
  Sparkles, Ticket,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import type { SiteviralFeatureKey, SiteviralType } from '@/types/database';

interface Tile {
  id: string;
  icon: LucideIcon;
  fr: string; en: string;
  subFr: string; subEn: string;
  route: string;
  border: string; iconColor: string; bgColor: string;
}

/** Per-vertical bookings-list route. */
function bookingRouteFor(type: SiteviralType | null | undefined): string {
  switch (type) {
    case 'beauty':                 return '/beauty/bookings';
    case 'artisans_home_services': return '/home/bookings';
    case 'tutors_home_teachers':   return '/education/bookings';
    case 'church':                 return '/church/pro/appointments';
    case 'instrumentists':
    case 'influencers':
    case 'sport':
    case 'services':
    default:                       return '/events/pro';
  }
}

/**
 * Feature → dashboard tile.
 * Platform-config features (kyc / payment / location) are NEVER shown as tiles —
 * they belong in Settings.
 */
function tileFor(key: SiteviralFeatureKey, hasManageableOrg: boolean, type: SiteviralType | null | undefined): Tile | null {
  switch (key) {
    case 'appointment': return {
      id: 'booking', icon: Calendar,
      fr: 'Rendez-vous', en: 'Bookings',
      subFr: 'Agenda et réservations', subEn: 'Calendar & bookings',
      route: bookingRouteFor(type),
      border: 'border-pink-500/30 hover:border-pink-500/60',
      iconColor: 'text-pink-500', bgColor: 'bg-pink-500/10',
    };
    case 'digital_products': return {
      id: 'sell', icon: Store,
      fr: 'Vendre', en: 'Sell',
      subFr: 'Publie et monétise', subEn: 'Publish & monetize',
      route: hasManageableOrg ? '/admin/products' : '/create-org',
      border: 'border-amber-500/30 hover:border-amber-500/60',
      iconColor: 'text-amber-500', bgColor: 'bg-amber-500/10',
    };
    // Hidden in the current digital-first experience (kept for later).
    case 'order_generator': return null;
    case 'donation_gifts': return {
      id: 'giving', icon: Gift,
      fr: 'Dons & offrandes', en: 'Donations',
      subFr: 'Campagnes et cadeaux', subEn: 'Campaigns & gifts',
      route: '/admin/campaigns',
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
      iconColor: 'text-emerald-500', bgColor: 'bg-emerald-500/10',
    };
    case 'ai_book_creation': return {
      id: 'write', icon: BookOpen,
      fr: 'Écrire un livre', en: 'Write a book',
      subFr: "L'IA écrit, tu publies", subEn: 'AI writes, you publish',
      route: '/ecrire',
      border: 'border-primary/30 hover:border-primary/60',
      iconColor: 'text-primary', bgColor: 'bg-primary/10',
    };
    case 'ai_formation_creation': return {
      id: 'ai-content', icon: Sparkles,
      fr: 'Créer une formation', en: 'Create a course',
      subFr: "L'IA t'aide à créer ton cours", subEn: 'AI helps you build your course',
      route: hasManageableOrg ? '/admin/programs' : '/creer-formation',
      border: 'border-fuchsia-500/30 hover:border-fuchsia-500/60',
      iconColor: 'text-fuchsia-500', bgColor: 'bg-fuchsia-500/10',
    };
    case 'product_comments': return null;
    // Hidden — events & tickets are not part of the core SiteViral experience.
    case 'events': return null;

    case 'reviews': return null;
    case 'affiliation': return {
      id: 'share', icon: Share2,
      fr: 'Gagner', en: 'Earn',
      subFr: 'Partage et gagne', subEn: 'Share & earn',
      route: '/admin/affiliation',
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
      iconColor: 'text-emerald-500', bgColor: 'bg-emerald-500/10',
    };
    // Platform config — never shown as a tile
    case 'kyc':
    case 'payment':
    case 'location':
      return null;
  }
  return null;
}


// Default (no org / no vertical yet): keep the original digital creator paths.
const DEFAULT_KEYS: SiteviralFeatureKey[] = ['ai_book_creation', 'digital_products', 'affiliation'];

/** Digital-first dashboard tiles. Legacy service-era tools (orders & quotes,
 * product comments, reviews, bookings) are hidden from the main experience. */
const DISPLAY_ORDER: SiteviralFeatureKey[] = [
  'digital_products',
  'ai_book_creation',
  'ai_formation_creation',
  'donation_gifts',
  'events',
  'affiliation',
];

export function QuickStartPaths() {
  const navigate = useNavigate();
  const { userOrgs, canManage, currentOrg } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const hasManageableOrg = userOrgs.some((o) => canManage(o.id));
  const enabled = (currentOrg?.enabled_features ?? []) as SiteviralFeatureKey[];
  const typeConfirmed = !!currentOrg?.type_confirmed_at;
  const useDefaults = !currentOrg || enabled.length === 0 || !typeConfirmed;
  const keys = useDefaults ? DEFAULT_KEYS : DISPLAY_ORDER.filter((k) => enabled.includes(k));

  const paths: Tile[] = keys
    .map((k) => tileFor(k, hasManageableOrg, (currentOrg?.siteviral_type as SiteviralType) ?? null))
    .filter((t): t is Tile => !!t)
    .slice(0, 8);

  // Append "Discover" only when the user has no confirmed vertical yet.
  if (useDefaults) {
    paths.push({
      id: 'discover', icon: Compass,
      fr: 'Découvrir', en: 'Discover',
      subFr: 'Livres, cours et plus', subEn: 'Books, courses & more',
      route: '/discover',
      border: 'border-violet-500/30 hover:border-violet-500/60',
      iconColor: 'text-violet-500', bgColor: 'bg-violet-500/10',
    });
  }

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
            <span className="text-sm font-bold block">{isFr ? path.fr : path.en}</span>
            <span className="text-[11px] text-muted-foreground">{isFr ? path.subFr : path.subEn}</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
        </motion.button>
      ))}
    </div>
  );
}
