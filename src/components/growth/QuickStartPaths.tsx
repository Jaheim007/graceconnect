import { motion } from 'framer-motion';
import {
  BookOpen, Store, Share2, Compass, ArrowRight, Calendar, Receipt, Gift,
  Sparkles, MessageSquare, MapPin, Ticket, Star, ShieldCheck, CreditCard,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import type { SiteviralFeatureKey } from '@/types/database';

interface Tile {
  id: string;
  icon: LucideIcon;
  fr: string; en: string;
  subFr: string; subEn: string;
  route: string;
  border: string; iconColor: string; bgColor: string;
}

/** Map of every SiteViral feature → dashboard tile. */
function tileFor(key: SiteviralFeatureKey, hasManageableOrg: boolean): Tile | null {
  switch (key) {
    case 'appointment': return {
      id: 'booking', icon: Calendar,
      fr: 'Rendez-vous', en: 'Bookings',
      subFr: 'Agenda et réservations', subEn: 'Calendar & bookings',
      route: '/dashboard/booking',
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
    case 'order_generator': return {
      id: 'orders', icon: Receipt,
      fr: 'Commandes & devis', en: 'Orders & quotes',
      subFr: 'Génère et suis tes commandes', subEn: 'Track your orders',
      route: '/dashboard/orders',
      border: 'border-blue-500/30 hover:border-blue-500/60',
      iconColor: 'text-blue-500', bgColor: 'bg-blue-500/10',
    };
    case 'donation_gifts': return {
      id: 'giving', icon: Gift,
      fr: 'Dons & offrandes', en: 'Donations',
      subFr: 'Campagnes et cadeaux', subEn: 'Campaigns & gifts',
      route: '/dashboard/giving',
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
      fr: 'Contenu & formations IA', en: 'AI content & courses',
      subFr: 'Posts, cours, scripts', subEn: 'Posts, courses, scripts',
      route: '/creer-formation',
      border: 'border-fuchsia-500/30 hover:border-fuchsia-500/60',
      iconColor: 'text-fuchsia-500', bgColor: 'bg-fuchsia-500/10',
    };
    case 'product_comments': return {
      id: 'comments', icon: MessageSquare,
      fr: 'Commentaires', en: 'Comments',
      subFr: 'Modère les avis produits', subEn: 'Moderate product reviews',
      route: '/dashboard/comments',
      border: 'border-cyan-500/30 hover:border-cyan-500/60',
      iconColor: 'text-cyan-500', bgColor: 'bg-cyan-500/10',
    };
    case 'location': return {
      id: 'location', icon: MapPin,
      fr: "Zone d'intervention", en: 'Service area',
      subFr: 'Adresse et carte', subEn: 'Address & map',
      route: '/dashboard/location',
      border: 'border-red-500/30 hover:border-red-500/60',
      iconColor: 'text-red-500', bgColor: 'bg-red-500/10',
    };
    case 'events': return {
      id: 'events', icon: Ticket,
      fr: 'Événements & billets', en: 'Events & tickets',
      subFr: 'Crée et vends des billets', subEn: 'Create & sell tickets',
      route: '/dashboard/events',
      border: 'border-indigo-500/30 hover:border-indigo-500/60',
      iconColor: 'text-indigo-500', bgColor: 'bg-indigo-500/10',
    };
    case 'reviews': return {
      id: 'reviews', icon: Star,
      fr: 'Avis clients', en: 'Client reviews',
      subFr: 'Notes et retours', subEn: 'Ratings & feedback',
      route: '/dashboard/reviews',
      border: 'border-yellow-500/30 hover:border-yellow-500/60',
      iconColor: 'text-yellow-500', bgColor: 'bg-yellow-500/10',
    };
    case 'kyc': return {
      id: 'kyc', icon: ShieldCheck,
      fr: 'Vérification (KYC)', en: 'Verification (KYC)',
      subFr: 'Sois payé plus vite', subEn: 'Get paid faster',
      route: '/dashboard/kyc',
      border: 'border-slate-500/30 hover:border-slate-500/60',
      iconColor: 'text-slate-500', bgColor: 'bg-slate-500/10',
    };
    case 'affiliation': return {
      id: 'share', icon: Share2,
      fr: 'Gagner', en: 'Earn',
      subFr: 'Partage et gagne', subEn: 'Share & earn',
      route: '/gagner',
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
      iconColor: 'text-emerald-500', bgColor: 'bg-emerald-500/10',
    };
    case 'payment': return {
      id: 'payments', icon: CreditCard,
      fr: 'Paiements', en: 'Payments',
      subFr: 'Mobile Money & payouts', subEn: 'Mobile Money & payouts',
      route: '/dashboard/payments',
      border: 'border-amber-500/30 hover:border-amber-500/60',
      iconColor: 'text-amber-500', bgColor: 'bg-amber-500/10',
    };
  }
  return null;
}

// Default (no org / no vertical yet): keep the original digital creator paths.
const DEFAULT_KEYS: SiteviralFeatureKey[] = ['ai_book_creation', 'digital_products', 'affiliation'];

/** Order tiles get shown in inside the dashboard. */
const DISPLAY_ORDER: SiteviralFeatureKey[] = [
  'appointment',
  'digital_products',
  'ai_book_creation',
  'ai_formation_creation',
  'order_generator',
  'donation_gifts',
  'events',
  'location',
  'reviews',
  'product_comments',
  'affiliation',
  'kyc',
  'payment',
];

export function QuickStartPaths() {
  const navigate = useNavigate();
  const { userOrgs, canManage, currentOrg } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const hasManageableOrg = userOrgs.some((o) => canManage(o.id));
  const enabled = (currentOrg?.enabled_features ?? []) as SiteviralFeatureKey[];
  const useDefaults = !currentOrg || enabled.length === 0;
  const keys = useDefaults ? DEFAULT_KEYS : DISPLAY_ORDER.filter((k) => enabled.includes(k));

  const paths: Tile[] = keys
    .map((k) => tileFor(k, hasManageableOrg))
    .filter((t): t is Tile => !!t)
    .slice(0, 6);

  // Always append "Discover"
  paths.push({
    id: 'discover', icon: Compass,
    fr: 'Découvrir', en: 'Discover',
    subFr: 'Livres, cours et plus', subEn: 'Books, courses & more',
    route: '/discover',
    border: 'border-violet-500/30 hover:border-violet-500/60',
    iconColor: 'text-violet-500', bgColor: 'bg-violet-500/10',
  });

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
