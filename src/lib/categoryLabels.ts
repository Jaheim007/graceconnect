/** Shared org category → human-readable label mapping */
export const ORG_CATEGORY_LABELS: Record<string, string> = {
  church: 'Organisation',
  ministry: 'Association',
  leader: 'Leader',
  ngo: 'ONG',
  community: 'Communauté',
  other: 'Autre',
};

export function getOrgCategoryLabel(category: string | null | undefined): string {
  if (!category) return 'Autre';
  return ORG_CATEGORY_LABELS[category] || category;
}
