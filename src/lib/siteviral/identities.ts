/**
 * WHO the platform owner is — the single question asked at platform creation.
 *
 * This is NOT "what do you sell" (that is a world/feature concern): it is the
 * owner's identity, which decides the workspace category (and therefore the
 * label shown in the platform switcher and the dashboard shape).
 */
import type { SiteviralWorld } from '@/lib/siteviral/worlds';

export type OrgCategory = 'church' | 'leader' | 'community' | 'ngo' | 'other';

export type PlatformIdentity = 'creator' | 'church' | 'ngo' | 'community';

export interface PlatformIdentityMeta {
  id: PlatformIdentity;
  labelFr: string;
  labelEn: string;
  descFr: string;
  descEn: string;
  world: SiteviralWorld;
  category: OrgCategory;
}

export const PLATFORM_IDENTITIES: PlatformIdentityMeta[] = [
  {
    id: 'creator',
    labelFr: 'Créateur / Auteur',
    labelEn: 'Creator / Author',
    descFr: 'Je vends mes livres, formations et contenus',
    descEn: 'I sell my books, courses and content',
    world: 'digital',
    category: 'leader',
  },
  {
    id: 'church',
    labelFr: 'Église / Ministère',
    labelEn: 'Church / Ministry',
    descFr: 'Enseignements, offrandes, événements',
    descEn: 'Teachings, offerings, events',
    world: 'church',
    category: 'church',
  },
  {
    id: 'ngo',
    labelFr: 'ONG / Association',
    labelEn: 'NGO / Association',
    descFr: 'Collecte de dons, publications, projets',
    descEn: 'Fundraising, publications, projects',
    world: 'church',
    category: 'ngo',
  },
  {
    id: 'community',
    labelFr: 'Communauté / Groupe',
    labelEn: 'Community / Group',
    descFr: 'Membres, contenus partagés, cotisations',
    descEn: 'Members, shared content, contributions',
    world: 'church',
    category: 'community',
  },
];

export function identityMeta(id: PlatformIdentity): PlatformIdentityMeta {
  return PLATFORM_IDENTITIES.find((i) => i.id === id) ?? PLATFORM_IDENTITIES[0];
}
