import type { SiteviralType } from '@/types/database';

/**
 * Per-SiteViral-type overrides for the shared action nav items.
 * Keyed by nav item `id` (see actionNavItems.ts). Only fields present are
 * overridden — anything omitted keeps the default digital-flavoured copy.
 *
 * This is what lets the sidebar feel like a "Church app" for a church
 * workspace, a "Beauty app" for a salon, etc., without duplicating the
 * whole nav model.
 */
export interface ActionNavOverride {
  titleFr?: string;
  titleEn?: string;
  descFr?: string;
  descEn?: string;
  emoji?: string;
}

type OverrideMap = Partial<Record<string, ActionNavOverride>>;

export const ACTION_NAV_OVERRIDES: Partial<Record<SiteviralType, OverrideMap>> = {
  church: {
    write: {
      titleFr: 'Livre → Sermon',
      titleEn: 'Book → Sermon',
      descFr: 'Transforme un livre en série d’enseignements',
      descEn: 'Turn a book into a sermon series',
      emoji: '📖',
    },
    course: {
      titleFr: 'Formation biblique IA',
      titleEn: 'AI Bible teaching',
      descFr: 'Crée un enseignement ou une école biblique',
      descEn: 'Create a teaching or Bible school',
      emoji: '🎓',
    },
    sell: {
      titleFr: 'Enseignements & ressources',
      titleEn: 'Teachings & resources',
      descFr: 'Publie sermons, PDF, ressources pour ton église',
      descEn: 'Publish sermons, PDFs and resources for your church',
      emoji: '📚',
    },
    share: {
      titleFr: 'Inviter mon église',
      titleEn: 'Invite my church',
      descFr: 'Invite tes fidèles et gagne des commissions',
      descEn: 'Invite members and earn commissions',
      emoji: '🤝',
    },
    sales: {
      titleFr: 'Dons & revenus',
      titleEn: 'Donations & revenue',
      descFr: 'Dons reçus, ventes de ressources et retraits',
      descEn: 'Donations received, resource sales and payouts',
    },
  },
  beauty: {
    write: {
      titleFr: 'Guide beauté IA',
      titleEn: 'AI beauty guide',
      descFr: 'Crée un guide ou ebook beauté avec l’IA',
      descEn: 'Create a beauty guide or ebook with AI',
    },
    course: {
      titleFr: 'Formation beauté',
      titleEn: 'Beauty course',
      descFr: 'Vends tes techniques en formation vidéo',
      descEn: 'Sell your techniques as a video course',
    },
    sell: {
      titleFr: 'Vendre mes services',
      titleEn: 'Sell my services',
      descFr: 'Prestations, forfaits et produits beauté',
      descEn: 'Services, packages and beauty products',
    },
  },
  artisans_home_services: {
    sell: {
      titleFr: 'Mes prestations',
      titleEn: 'My services',
      descFr: 'Publie tes services et interventions',
      descEn: 'Publish your services and jobs',
    },
    write: {
      titleFr: 'Guide métier IA',
      titleEn: 'AI trade guide',
      descFr: 'Crée un guide métier ou catalogue',
      descEn: 'Create a trade guide or catalog',
    },
  },
  tutors_home_teachers: {
    sell: {
      titleFr: 'Mes cours',
      titleEn: 'My lessons',
      descFr: 'Vends cours particuliers et supports',
      descEn: 'Sell private lessons and materials',
    },
    write: {
      titleFr: 'Support de cours IA',
      titleEn: 'AI course material',
      descFr: 'Crée un support de cours avec l’IA',
      descEn: 'Create a lesson support with AI',
    },
  },
};

export function applyNavOverride<T extends { id: string; titleFr: string; titleEn: string; descFr: string; descEn: string; emoji: string }>(
  item: T,
  type: SiteviralType | null | undefined,
): T {
  if (!type) return item;
  const bucket = ACTION_NAV_OVERRIDES[type];
  const patch = bucket?.[item.id];
  if (!patch) return item;
  return {
    ...item,
    titleFr: patch.titleFr ?? item.titleFr,
    titleEn: patch.titleEn ?? item.titleEn,
    descFr: patch.descFr ?? item.descFr,
    descEn: patch.descEn ?? item.descEn,
    emoji: patch.emoji ?? item.emoji,
  };
}
