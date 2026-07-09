import {
  BookOpen, Store, Share2, Package, Calendar, Receipt, Gift,
  Sparkles, MessageSquare, Ticket, Star, LayoutDashboard, Inbox,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SiteviralFeatureKey, SiteviralType } from '@/types/database';
import type { ActionNavItem } from './actionNavItems';

interface Ctx {
  isAuthenticated: boolean;
  hasPurchases: boolean;
  hasManageableOrg: boolean;
  hasOrgs: boolean;
  isSuperadmin: boolean;
}

/**
 * Per-vertical booking dashboard route.
 * Uses the *bookings list* pages (not the pro home) so the tap lands on the
 * actual appointment feed.
 */
function bookingRouteFor(type: SiteviralType | null | undefined): string {
  switch (type) {
    case 'beauty':                 return '/beauty/bookings';
    case 'artisans_home_services': return '/home/bookings';
    case 'tutors_home_teachers':   return '/education/bookings';
    case 'church':                 return '/church/pro/appointments';
    case 'instrumentists':
    case 'services':
    case 'sport':
    case 'influencers':            return '/events/pro';
    default:                       return '/admin';
  }
}

/**
 * Per-vertical revenue route.
 */
function revenueRouteFor(type: SiteviralType | null | undefined): string {
  switch (type) {
    case 'artisans_home_services': return '/home/pro/revenue';
    case 'tutors_home_teachers':   return '/education/pro/revenue';
    case 'instrumentists':
    case 'services':
    case 'influencers':            return '/events/pro/revenue';
    default:                       return '/admin/sales';
  }
}

/**
 * Per-vertical inbox route. Returns null when the vertical has no dedicated
 * messages surface (falls back to the generic /admin inbox in that case).
 */
function messagesRouteFor(type: SiteviralType | null | undefined): string | null {
  switch (type) {
    case 'beauty':                 return '/beauty/messages';
    case 'artisans_home_services': return '/home/messages';
    case 'tutors_home_teachers':   return '/education/messages';
    case 'instrumentists':
    case 'services':
    case 'sport':
    case 'influencers':            return '/events/messages';
    default:                       return null;
  }
}

interface Spec {
  id: string;
  icon: LucideIcon;
  titleFr: string; titleEn: string;
  descFr: string; descEn: string;
  route: string;
  tone: 'primary' | 'sky' | 'amber' | 'emerald' | 'violet' | 'pink' | 'blue'
      | 'fuchsia' | 'cyan' | 'indigo' | 'yellow' | 'teal';
}

const TONE: Record<Spec['tone'], { border: string; iconBg: string; iconColor: string }> = {
  primary:  { border: 'border-primary/30 hover:border-primary/60',           iconBg: 'bg-primary/12',           iconColor: 'text-primary' },
  sky:      { border: 'border-sky-500/30 hover:border-sky-500/60',           iconBg: 'bg-sky-500/12',           iconColor: 'text-sky-500' },
  amber:    { border: 'border-amber-500/30 hover:border-amber-500/60',       iconBg: 'bg-amber-500/12',         iconColor: 'text-amber-500' },
  emerald:  { border: 'border-emerald-500/30 hover:border-emerald-500/60',   iconBg: 'bg-emerald-500/12',       iconColor: 'text-emerald-500' },
  violet:   { border: 'border-violet-500/30 hover:border-violet-500/60',     iconBg: 'bg-violet-500/12',        iconColor: 'text-violet-500' },
  pink:     { border: 'border-pink-500/30 hover:border-pink-500/60',         iconBg: 'bg-pink-500/12',          iconColor: 'text-pink-500' },
  blue:     { border: 'border-blue-500/30 hover:border-blue-500/60',         iconBg: 'bg-blue-500/12',          iconColor: 'text-blue-500' },
  fuchsia:  { border: 'border-fuchsia-500/30 hover:border-fuchsia-500/60',   iconBg: 'bg-fuchsia-500/12',       iconColor: 'text-fuchsia-500' },
  cyan:     { border: 'border-cyan-500/30 hover:border-cyan-500/60',         iconBg: 'bg-cyan-500/12',          iconColor: 'text-cyan-500' },
  indigo:   { border: 'border-indigo-500/30 hover:border-indigo-500/60',     iconBg: 'bg-indigo-500/12',        iconColor: 'text-indigo-500' },
  yellow:   { border: 'border-yellow-500/30 hover:border-yellow-500/60',     iconBg: 'bg-yellow-500/12',        iconColor: 'text-yellow-500' },
  teal:     { border: 'border-teal-500/30 hover:border-teal-500/60',         iconBg: 'bg-teal-500/12',          iconColor: 'text-teal-500' },
};

function toItem(s: Spec): ActionNavItem {
  const t = TONE[s.tone];
  return {
    id: s.id, icon: s.icon, emoji: '',
    titleFr: s.titleFr, titleEn: s.titleEn,
    descFr: s.descFr, descEn: s.descEn,
    route: s.route,
    borderClass: t.border, iconBg: t.iconBg, iconColor: t.iconColor,
  };
}

/**
 * Map a functional feature key to a nav item.
 *
 * Excluded on purpose (Settings-only, never in nav):
 *   - kyc         → identity verification, handled in Settings + popup
 *   - payment     → payment integration, handled in Settings
 *   - location    → service area / map, handled in Settings
 */
function specFor(
  key: SiteviralFeatureKey,
  hasManageableOrg: boolean,
  type: SiteviralType | null | undefined,
): Spec | null {
  switch (key) {
    case 'appointment': return {
      id: 'booking', icon: Calendar, tone: 'pink',
      titleFr: 'Rendez-vous', titleEn: 'Bookings',
      descFr: 'Agenda et réservations', descEn: 'Calendar & bookings',
      route: bookingRouteFor(type),
    };
    case 'digital_products': return {
      id: 'sell', icon: Store, tone: 'amber',
      titleFr: 'Vendre', titleEn: 'Sell',
      descFr: 'Publie et monétise', descEn: 'Publish & monetize',
      route: hasManageableOrg ? '/admin/products' : '/create-org',
    };
    case 'order_generator': return {
      id: 'orders', icon: Receipt, tone: 'blue',
      titleFr: 'Commandes', titleEn: 'Orders',
      descFr: 'Devis et commandes clients', descEn: 'Quotes & client orders',
      route: '/admin/sales',
    };
    case 'donation_gifts': return {
      id: 'giving', icon: Gift, tone: 'emerald',
      titleFr: 'Dons', titleEn: 'Giving',
      descFr: 'Campagnes et cadeaux', descEn: 'Campaigns & gifts',
      route: '/admin/campaigns',
    };
    case 'ai_book_creation': return {
      id: 'write', icon: BookOpen, tone: 'primary',
      titleFr: 'Écrire', titleEn: 'Write',
      descFr: "Ton livre avec l'IA", descEn: 'Your book with AI',
      route: '/ecrire',
    };
    case 'ai_formation_creation': return {
      id: 'ai-content', icon: Sparkles, tone: 'fuchsia',
      titleFr: 'Formations IA', titleEn: 'AI courses',
      descFr: 'Cours et contenus', descEn: 'Courses & content',
      route: hasManageableOrg ? '/admin/programs' : '/creer-formation',
    };
    case 'product_comments': return {
      id: 'comments', icon: MessageSquare, tone: 'cyan',
      titleFr: 'Commentaires', titleEn: 'Comments',
      descFr: 'Modère les retours', descEn: 'Moderate feedback',
      route: '/admin/crm',
    };
    case 'events': return {
      id: 'events', icon: Ticket, tone: 'indigo',
      titleFr: 'Événements', titleEn: 'Events',
      descFr: 'Billets et invitations', descEn: 'Tickets & invites',
      route: '/admin/events',
    };
    case 'reviews': return {
      id: 'reviews', icon: Star, tone: 'yellow',
      titleFr: 'Avis', titleEn: 'Reviews',
      descFr: 'Notes clients', descEn: 'Client ratings',
      route: '/admin/crm',
    };
    case 'affiliation': return {
      id: 'share', icon: Share2, tone: 'emerald',
      titleFr: 'Gagner', titleEn: 'Earn',
      descFr: 'Partage et gagne', descEn: 'Share & earn',
      route: '/admin/affiliation',
    };
    // Platform config — never in nav
    case 'kyc':
    case 'payment':
    case 'location':
      return null;
  }
  return null;
}

/**
 * Nav display order — operational tools first, then growth/earn.
 * KYC / payment / location deliberately excluded (Settings-only).
 */
const ORDER: SiteviralFeatureKey[] = [
  'appointment',
  'order_generator',
  'digital_products',
  'donation_gifts',
  'events',
  'ai_book_creation',
  'ai_formation_creation',
  'product_comments',
  'reviews',
  'affiliation',
];

/**
 * Builds a strictly matrix-driven nav list for a confirmed SiteViral type.
 * Returns null when the caller should fall back to the generic digital nav.
 *
 * Rules (per user directive):
 *   - Show ONLY the operational features enabled for this vertical.
 *   - KYC / Payment integration / Location go to Settings, never in nav.
 *   - "Discover" and "My workspace" are NOT appended for confirmed providers —
 *     they're already inside their workspace.
 *   - Revenue tile appended when the org can manage sales.
 */
export function buildFeatureNavItems(
  ctx: Ctx,
  enabled: SiteviralFeatureKey[],
  type: SiteviralType | null | undefined,
): ActionNavItem[] | null {
  if (!type || enabled.length === 0) return null;

  const items: ActionNavItem[] = [];

  // Personal shortcut — only if the user already bought something.
  if (ctx.isAuthenticated && ctx.hasPurchases) {
    items.push(toItem({
      id: 'purchases', icon: Package, tone: 'primary',
      titleFr: 'Mes achats', titleEn: 'My purchases',
      descFr: 'Livres et ressources', descEn: 'Books & resources',
      route: '/resources',
    }));
  }

  // Matrix-driven operational tools
  for (const key of ORDER) {
    if (!enabled.includes(key)) continue;
    const spec = specFor(key, ctx.hasManageableOrg, type);
    if (spec) items.push(toItem(spec));
  }

  // Revenue — every provider needs to see their money
  if (ctx.isAuthenticated && ctx.hasManageableOrg) {
    items.push(toItem({
      id: 'revenue', icon: LayoutDashboard, tone: 'teal',
      titleFr: 'Revenus', titleEn: 'Revenue',
      descFr: 'Ventes et retraits', descEn: 'Sales & payouts',
      route: revenueRouteFor(type),
    }));
  }

  return items;
}
