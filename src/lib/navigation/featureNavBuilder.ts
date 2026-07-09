import {
  BookOpen, Store, Share2, Compass, Package, LayoutDashboard,
  Building2, Shield, Calendar, Receipt, Gift, Sparkles, MessageSquare,
  MapPin, Ticket, Star, ShieldCheck, CreditCard,
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

function bookingRouteFor(type: SiteviralType | null | undefined): string {
  switch (type) {
    case 'beauty': return '/beauty/bookings';
    case 'artisans_home_services': return '/home/pro/dashboard';
    case 'tutors_home_teachers': return '/education/tutor/bookings';
    case 'church': return '/church/pro/appointments';
    default: return '/events/pro/dashboard';
  }
}

interface Spec {
  id: string;
  icon: LucideIcon;
  titleFr: string; titleEn: string;
  descFr: string; descEn: string;
  route: string;
  tone: 'primary' | 'sky' | 'amber' | 'emerald' | 'violet' | 'pink' | 'blue'
      | 'fuchsia' | 'cyan' | 'red' | 'indigo' | 'yellow' | 'slate' | 'teal' | 'orange' | 'rose';
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
  red:      { border: 'border-red-500/30 hover:border-red-500/60',           iconBg: 'bg-red-500/12',           iconColor: 'text-red-500' },
  indigo:   { border: 'border-indigo-500/30 hover:border-indigo-500/60',     iconBg: 'bg-indigo-500/12',        iconColor: 'text-indigo-500' },
  yellow:   { border: 'border-yellow-500/30 hover:border-yellow-500/60',     iconBg: 'bg-yellow-500/12',        iconColor: 'text-yellow-500' },
  slate:    { border: 'border-slate-500/30 hover:border-slate-500/60',       iconBg: 'bg-slate-500/12',         iconColor: 'text-slate-500' },
  teal:     { border: 'border-teal-500/30 hover:border-teal-500/60',         iconBg: 'bg-teal-500/12',          iconColor: 'text-teal-500' },
  orange:   { border: 'border-orange-500/30 hover:border-orange-500/60',     iconBg: 'bg-orange-500/12',        iconColor: 'text-orange-500' },
  rose:     { border: 'border-rose-500/30 hover:border-rose-500/60',         iconBg: 'bg-rose-500/12',          iconColor: 'text-rose-500' },
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
      descFr: 'Génère et suis tes commandes', descEn: 'Track your orders',
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
    case 'location': return {
      id: 'location', icon: MapPin, tone: 'red',
      titleFr: 'Zone', titleEn: 'Area',
      descFr: "Zone d'intervention", descEn: 'Service area',
      route: '/admin/settings',
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
    case 'kyc': return {
      id: 'kyc', icon: ShieldCheck, tone: 'slate',
      titleFr: 'Vérification', titleEn: 'Verification',
      descFr: 'KYC pour payouts', descEn: 'KYC for payouts',
      route: '/admin/kyc',
    };
    case 'affiliation': return {
      id: 'share', icon: Share2, tone: 'emerald',
      titleFr: 'Gagner', titleEn: 'Earn',
      descFr: 'Partage et gagne', descEn: 'Share & earn',
      route: '/admin/affiliation',
    };
    case 'payment': return {
      id: 'payments', icon: CreditCard, tone: 'amber',
      titleFr: 'Paiements', titleEn: 'Payments',
      descFr: 'Mobile Money & payouts', descEn: 'Mobile Money & payouts',
      route: '/admin/payouts',
    };
  }
  return null;
}

/** Display priority — most-used-per-day first (mobile bottom nav truncates). */
const ORDER: SiteviralFeatureKey[] = [
  'appointment',
  'order_generator',
  'digital_products',
  'donation_gifts',
  'events',
  'ai_book_creation',
  'ai_formation_creation',
  'reviews',
  'product_comments',
  'location',
  'affiliation',
  'payment',
  'kyc',
];

/**
 * Builds a vertical-aware nav list from the org's enabled_features.
 * Falls back to null so callers can use their generic list when there's no
 * confirmed type on the current org.
 */
export function buildFeatureNavItems(
  ctx: Ctx,
  enabled: SiteviralFeatureKey[],
  type: SiteviralType | null | undefined,
): ActionNavItem[] | null {
  if (!type || enabled.length === 0) return null;

  const items: ActionNavItem[] = [];

  if (ctx.isAuthenticated && ctx.hasPurchases) {
    items.push(toItem({
      id: 'purchases', icon: Package, tone: 'primary',
      titleFr: 'Mes achats', titleEn: 'My purchases',
      descFr: 'Livres et ressources', descEn: 'Books & resources',
      route: '/resources',
    }));
  }

  for (const key of ORDER) {
    if (!enabled.includes(key)) continue;
    const spec = specFor(key, ctx.hasManageableOrg, type);
    if (spec) items.push(toItem(spec));
  }

  // Universal discovery entry
  items.push(toItem({
    id: 'discover', icon: Compass, tone: 'violet',
    titleFr: 'Découvrir', titleEn: 'Discover',
    descFr: 'Explorer la plateforme', descEn: 'Explore the platform',
    route: '/discover',
  }));

  if (ctx.isAuthenticated && ctx.hasManageableOrg) {
    items.push(toItem({
      id: 'sales', icon: LayoutDashboard, tone: 'teal',
      titleFr: 'Revenus', titleEn: 'Revenue',
      descFr: 'Ventes et retraits', descEn: 'Sales & payouts',
      route: '/admin/sales',
    }));
  }

  if (ctx.isAuthenticated && ctx.hasOrgs) {
    items.push(toItem({
      id: 'orgs', icon: Building2, tone: 'orange',
      titleFr: 'Ma plateforme', titleEn: 'My workspace',
      descFr: 'Gérer mon espace', descEn: 'Manage my space',
      route: ctx.hasManageableOrg ? '/admin' : '/create-org',
    }));
  }

  if (ctx.isSuperadmin) {
    items.push(toItem({
      id: 'superadmin', icon: Shield, tone: 'rose',
      titleFr: 'Super Admin', titleEn: 'Super Admin',
      descFr: 'Gérer la plateforme', descEn: 'Platform admin',
      route: '/superadmin',
    }));
  }

  return items;
}
