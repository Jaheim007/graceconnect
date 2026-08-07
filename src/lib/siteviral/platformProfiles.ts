/**
 * Restored "Create your platform" onboarding taxonomy.
 *
 * Step 1 — Platform profile (Creator/Author, Organization, NGO, Community,
 * Church/Ministry). Step 4 — First objective, specific to each profile.
 *
 * Profiles map onto the existing world/siteviral_type engine so
 * `createWorkspace()` stays the single creation path. Objectives map onto
 * additive feature keys — nothing is removed from a workspace.
 */
import { User, Building2, HeartHandshake, Users, Church, type LucideIcon } from 'lucide-react';
import type { SiteviralFeatureKey } from '@/types/database';
import type { SiteviralWorld } from '@/lib/siteviral/worlds';

export type PlatformProfileId = 'creator' | 'ngo' | 'community' | 'church';

export interface PlatformObjective {
  id: string;
  emoji: string;
  labelFr: string;
  labelEn: string;
  features: SiteviralFeatureKey[];
}

export interface PlatformProfile {
  id: PlatformProfileId;
  icon: LucideIcon;
  emoji: string;
  labelFr: string; labelEn: string;
  descFr: string; descEn: string;
  /** Engine world used by createWorkspace(). */
  world: SiteviralWorld;
  /** organizations.category value. */
  category: 'church' | 'leader' | 'community' | 'ngo' | 'other';
  objectives: PlatformObjective[];
}

const SELL: SiteviralFeatureKey[] = ['digital_products', 'payment'];

export const PLATFORM_PROFILES: PlatformProfile[] = [
  {
    id: 'creator',
    icon: User, emoji: '✍️',
    labelFr: 'Créateur / Auteur', labelEn: 'Creator / Author',
    descFr: 'Livres, formations et produits digitaux', descEn: 'Books, courses and digital products',
    world: 'digital', category: 'leader',
    objectives: [
      { id: 'sell-digital', emoji: '💰', labelFr: 'Vendre des produits digitaux', labelEn: 'Sell digital products', features: SELL },
      { id: 'write-book', emoji: '📖', labelFr: 'Écrire un livre', labelEn: 'Write a book', features: [...SELL, 'ai_book_creation'] },
      { id: 'create-formation', emoji: '🎓', labelFr: 'Créer une formation', labelEn: 'Create a formation', features: [...SELL, 'ai_formation_creation'] },
      { id: 'affiliation', emoji: '🤝', labelFr: "Utiliser l'affiliation", labelEn: 'Use affiliation', features: [...SELL, 'affiliation'] },
    ],
  },
  {
    id: 'church',
    icon: Church, emoji: '⛪',
    labelFr: 'Église / Ministère', labelEn: 'Church / Ministry',
    descFr: 'Prédications, ressources, offrandes et événements', descEn: 'Sermons, resources, offerings and events',
    world: 'church', category: 'church',
    objectives: [
      { id: 'sermon-to-book', emoji: '📖', labelFr: 'Transformer les prédications en livres/ressources', labelEn: 'Turn sermons into books/resources', features: ['ai_book_creation', ...SELL] },
      { id: 'sell-teachings', emoji: '💰', labelFr: 'Vendre enseignements et ressources spirituelles', labelEn: 'Sell teachings and spiritual resources', features: SELL },
      { id: 'offerings', emoji: '🎁', labelFr: 'Recevoir offrandes, dîmes et dons', labelEn: 'Receive offerings, tithes and donations', features: ['donation_gifts', 'payment', 'kyc'] },
      { id: 'campaigns', emoji: '🚀', labelFr: 'Créer des campagnes de financement', labelEn: 'Create fundraising campaigns', features: ['donation_gifts', 'payment', 'kyc'] },
      { id: 'events', emoji: '📅', labelFr: 'Publier des événements', labelEn: 'Publish events', features: ['events', 'payment'] },
      { id: 'formations', emoji: '🎓', labelFr: 'Créer des formations', labelEn: 'Create formations', features: [...SELL, 'ai_formation_creation'] },
      { id: 'all', emoji: '', labelFr: 'Utiliser plusieurs outils ensemble', labelEn: 'Use several tools together', features: [...SELL, 'donation_gifts', 'events', 'ai_book_creation', 'kyc'] },
    ],
  },
  {
    id: 'ngo',
    icon: HeartHandshake, emoji: '🤲',
    labelFr: 'ONG / Association', labelEn: 'NGO / Association',
    descFr: 'Dons, campagnes et ressources', descEn: 'Donations, campaigns and resources',
    world: 'digital', category: 'ngo',
    objectives: [
      { id: 'donations', emoji: '❤️', labelFr: 'Collecter des dons', labelEn: 'Collect donations', features: ['donation_gifts', 'payment', 'kyc'] },
      { id: 'campaigns', emoji: '🚀', labelFr: 'Créer des campagnes de financement', labelEn: 'Create fundraising campaigns', features: ['donation_gifts', 'payment', 'kyc'] },
      { id: 'sell-resources', emoji: '📄', labelFr: 'Vendre des ressources', labelEn: 'Sell resources', features: SELL },
      { id: 'both', emoji: '🌍', labelFr: 'Dons et ventes digitales', labelEn: 'Donations and digital sales', features: [...SELL, 'donation_gifts', 'kyc'] },
    ],
  },
  {
    id: 'community',
    icon: Users, emoji: '👥',
    labelFr: 'Communauté', labelEn: 'Community',
    descFr: 'Contenus, ressources et soutien', descEn: 'Content, resources and support',
    world: 'digital', category: 'community',
    objectives: [
      { id: 'sell-content', emoji: '💰', labelFr: 'Vendre du contenu', labelEn: 'Sell content', features: SELL },
      { id: 'publish-resources', emoji: '📄', labelFr: 'Publier des ressources', labelEn: 'Publish resources', features: SELL },
      { id: 'support', emoji: '❤️', labelFr: 'Recevoir du soutien', labelEn: 'Receive support', features: ['donation_gifts', 'payment'] },
      { id: 'create-formations', emoji: '🎓', labelFr: 'Créer des formations', labelEn: 'Create formations', features: [...SELL, 'ai_formation_creation'] },
    ],
  },
];

export const getPlatformProfile = (id: PlatformProfileId): PlatformProfile =>
  PLATFORM_PROFILES.find((p) => p.id === id) ?? PLATFORM_PROFILES[0];

/** Map a preselected ?world= param onto a visible platform profile. */
export function profileForWorld(world: string | null | undefined): PlatformProfileId | null {
  if (!world) return null;
  if (world === 'church') return 'church';
  if (world === 'digital') return 'creator';
  return null;
}
