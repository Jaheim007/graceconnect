import {
  BookOpen, Store, Share2, Compass, Package, LayoutDashboard,
  Building2, GraduationCap, Shield, Sparkles, Calendar,
  Scissors, Search
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SiteviralFeatureKey } from '@/types/database';

export interface ActionNavItem {
  id: string;
  icon: LucideIcon;
  emoji: string;
  titleFr: string;
  titleEn: string;
  descFr: string;
  descEn: string;
  route: string;
  borderClass: string;
  iconBg: string;
  iconColor: string;
  /** Optional SiteViral feature gate. Only hidden when the org has a confirmed
   *  type AND the key is not in enabled_features. Never hidden otherwise. */
  featureKey?: SiteviralFeatureKey;
}

interface NavContext {
  isAuthenticated: boolean;
  hasPurchases: boolean;
  hasManageableOrg: boolean;
  hasOrgs: boolean;
  isSuperadmin: boolean;
}

/**
 * Returns the list of ActionHub nav items based on user context.
 * Routes must be resolved by the caller when they depend on org state.
 */
export function getActionNavItems(
  ctx: NavContext,
  resolveRoute?: (id: string) => string
): ActionNavItem[] {
  const r = (id: string, fallback: string) => resolveRoute?.(id) ?? fallback;

  const items: ActionNavItem[] = [];

  if (ctx.isAuthenticated && ctx.hasPurchases) {
    items.push({
      id: 'purchases',
      icon: Package,
      emoji: '📚',
      titleFr: 'Mes achats',
      titleEn: 'My Purchases',
      descFr: 'Accéder à mes livres et ressources',
      descEn: 'Access my books and resources',
      route: '/resources',
      borderClass: 'border-primary/30 hover:border-primary/60',
      iconBg: 'bg-primary/15',
      iconColor: 'text-primary',
    });
  }

  items.push({
    id: 'write',
    icon: BookOpen,
    emoji: '✏️',
    titleFr: 'Écrire un livre',
    titleEn: 'Write a book',
    descFr: "Crée ton livre avec l'IA et vends-le",
    descEn: 'Create your book with AI and sell it',
    route: '/ecrire',
    borderClass: 'border-primary/30 hover:border-primary/60',
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
    featureKey: 'ai_book_creation',
  });

  items.push({
    id: 'course',
    icon: GraduationCap,
    emoji: '🎓',
    titleFr: 'Créer une formation',
    titleEn: 'Create a course',
    descFr: "Crée ta formation avec l'IA en quelques minutes",
    descEn: 'Create your course with AI in minutes',
    route: r('course', '/creer-formation'),
    borderClass: 'border-sky-500/30 hover:border-sky-500/60',
    iconBg: 'bg-sky-500/15',
    iconColor: 'text-sky-500',
    featureKey: 'ai_formation_creation',
  });

  items.push({
    id: 'sell',
    icon: Store,
    emoji: '🛒',
    titleFr: 'Vendre',
    titleEn: 'Sell',
    descFr: 'Vends tes livres, formations et plus',
    descEn: 'Sell your books, courses & more',
    route: r('sell', '/vendre'),
    borderClass: 'border-amber-500/30 hover:border-amber-500/60',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-500',
  });

  items.push({
    id: 'share',
    icon: Share2,
    emoji: '💰',
    titleFr: 'Gagner',
    titleEn: 'Earn',
    descFr: "Partage et gagne de l'argent",
    descEn: 'Share & earn money',
    route: '/gagner',
    borderClass: 'border-emerald-500/30 hover:border-emerald-500/60',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-500',
  });

  items.push({
    id: 'discover',
    icon: Compass,
    emoji: '🔍',
    titleFr: 'Découvrir',
    titleEn: 'Discover',
    descFr: 'Voir et acheter des livres, formations et plus',
    descEn: 'Browse & buy books, courses & more',
    route: '/discover',
    borderClass: 'border-violet-500/30 hover:border-violet-500/60',
    iconBg: 'bg-violet-500/15',
    iconColor: 'text-violet-500',
  });

  if (ctx.isAuthenticated && ctx.hasManageableOrg) {
    items.push({
      id: 'sales',
      icon: LayoutDashboard,
      emoji: '💵',
      titleFr: 'Mes ventes & revenus',
      titleEn: 'My Sales & Earnings',
      descFr: 'Ventes, dons reçus, commissions et retraits',
      descEn: 'Sales, donations, commissions & payouts',
      route: '/admin/sales',
      borderClass: 'border-teal-500/30 hover:border-teal-500/60',
      iconBg: 'bg-teal-500/15',
      iconColor: 'text-teal-500',
    });
  }

  if (ctx.isAuthenticated && ctx.hasOrgs) {
    items.push({
      id: 'orgs',
      icon: Building2,
      emoji: '🏪',
      titleFr: 'Mes organisations',
      titleEn: 'My organizations',
      descFr: 'Voir ou créer une boutique / organisation',
      descEn: 'View or create a store / organization',
      route: r('orgs', '/create-org'),
      borderClass: 'border-orange-500/30 hover:border-orange-500/60',
      iconBg: 'bg-orange-500/15',
      iconColor: 'text-orange-500',
    });
  }

  if (ctx.isSuperadmin) {
    items.push({
      id: 'superadmin',
      icon: Shield,
      emoji: '🛡️',
      titleFr: 'Super Admin',
      titleEn: 'Super Admin',
      descFr: 'Gérer la plateforme',
      descEn: 'Manage the platform',
      route: '/superadmin',
      borderClass: 'border-rose-500/30 hover:border-rose-500/60',
      iconBg: 'bg-rose-500/15',
      iconColor: 'text-rose-500',
    });
  }

  return items;
}

/**
 * Beauty vertical nav items — used when the user is inside /beauty/*.
 * The bottom nav swaps to this set so the app feels like a dedicated Beauty app.
 */
export function getBeautyNavItems(ctx: NavContext): ActionNavItem[] {
  const items: ActionNavItem[] = [];

  if (ctx.isAuthenticated) {
    items.push({
      id: 'beauty-bookings',
      icon: Calendar,
      emoji: '📅',
      titleFr: 'Mes rendez-vous',
      titleEn: 'My appointments',
      descFr: 'Mes rendez-vous beauté',
      descEn: 'My beauty appointments',
      route: '/beauty/bookings',
      borderClass: 'border-amber-500/30 hover:border-amber-500/60',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-500',
    });
  }

  items.push({
    id: 'beauty-search',
    icon: Search,
    emoji: '🔎',
    titleFr: 'Explorer',
    titleEn: 'Explore',
    descFr: 'Trouver un expert beauté',
    descEn: 'Find a beauty expert',
    route: '/beauty/search',
    borderClass: 'border-rose-500/30 hover:border-rose-500/60',
    iconBg: 'bg-rose-500/15',
    iconColor: 'text-rose-500',
  });

  // Messages intentionally NOT in bottom nav — accessed via avatar menu / RDV details.


  items.push({
    id: 'beauty-pro',
    icon: Scissors,
    emoji: '💇🏾',
    titleFr: 'Proposer mes services',
    titleEn: 'Offer my services',
    descFr: 'Créer mon profil et recevoir des clients',
    descEn: 'Create my profile and get clients',
    route: '/beauty/pro/onboarding',
    borderClass: 'border-fuchsia-500/30 hover:border-fuchsia-500/60',
    iconBg: 'bg-fuchsia-500/15',
    iconColor: 'text-fuchsia-500',
  });

  return items;
}

