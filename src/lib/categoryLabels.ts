/** Shared org category → human-readable label mapping */
export const ORG_CATEGORY_LABELS: Record<string, Record<string, string>> = {
  church: { fr: 'Organisation', en: 'Organization' },
  ministry: { fr: 'Association', en: 'Association' },
  leader: { fr: 'Leader', en: 'Leader' },
  ngo: { fr: 'ONG', en: 'NGO' },
  community: { fr: 'Communauté', en: 'Community' },
  other: { fr: 'Autre', en: 'Other' },
};

export function getOrgCategoryLabel(category: string | null | undefined, locale: string = 'fr'): string {
  if (!category) return locale === 'fr' ? 'Autre' : 'Other';
  const entry = ORG_CATEGORY_LABELS[category];
  if (!entry) return category;
  return entry[locale] || entry.fr || category;
}
