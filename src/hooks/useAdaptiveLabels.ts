import { useMemo } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useUserProfile, type UserProfileType } from './useUserProfile';

/**
 * Adaptive labels that change vocabulary based on user profile.
 * Religious orgs see "Contributions" instead of "Ventes", etc.
 */
export interface AdaptiveLabels {
  sales: string;
  revenue: string;
  clients: string;
  buy: string;
  price: string;
  mySales: string;
  myRevenue: string;
  dashboard: string;
  earnings: string;
  activity: string;
  /** "Vendre" / "Publier" */
  sellAction: string;
}

type LabelSet = Record<keyof AdaptiveLabels, { fr: string; en: string }>;

const STANDARD_LABELS: LabelSet = {
  sales:      { fr: 'Ventes',        en: 'Sales' },
  revenue:    { fr: 'Revenus',       en: 'Revenue' },
  clients:    { fr: 'Personnes',     en: 'People' },
  buy:        { fr: 'Acheter',       en: 'Buy' },
  price:      { fr: 'Prix',          en: 'Price' },
  mySales:    { fr: 'Mes ventes',    en: 'My Sales' },
  myRevenue:  { fr: 'Mes revenus',   en: 'My Revenue' },
  dashboard:  { fr: 'Tableau de bord', en: 'Dashboard' },
  earnings:   { fr: 'Gains',         en: 'Earnings' },
  activity:   { fr: 'Activité',      en: 'Activity' },
  sellAction: { fr: 'Vendre',        en: 'Sell' },
};

const RELIGIOUS_LABELS: LabelSet = {
  sales:      { fr: 'Contributions',        en: 'Contributions' },
  revenue:    { fr: 'Activité',             en: 'Activity' },
  clients:    { fr: 'Personnes',            en: 'People' },
  buy:        { fr: 'Obtenir',              en: 'Get' },
  price:      { fr: 'Contribution suggérée', en: 'Suggested contribution' },
  mySales:    { fr: 'Nos contributions',    en: 'Our contributions' },
  myRevenue:  { fr: 'Notre activité',       en: 'Our activity' },
  dashboard:  { fr: 'Tableau de bord',      en: 'Dashboard' },
  earnings:   { fr: 'Bilan',                en: 'Overview' },
  activity:   { fr: 'Activité',             en: 'Activity' },
  sellAction: { fr: 'Publier',              en: 'Publish' },
};

function resolveLabels(labelSet: LabelSet, locale: string): AdaptiveLabels {
  const isFr = locale === 'fr';
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(labelSet)) {
    result[key] = isFr ? val.fr : val.en;
  }
  return result as unknown as AdaptiveLabels;
}

/**
 * Returns the right vocabulary based on user profile.
 * Can also accept an override profile for previewing.
 */
export function useAdaptiveLabels(overrideProfile?: UserProfileType): AdaptiveLabels {
  const { locale } = useI18n();
  const { profile: detectedProfile } = useUserProfile();
  const profile = overrideProfile ?? detectedProfile;

  return useMemo(() => {
    const labelSet = profile === 'org-religious' ? RELIGIOUS_LABELS : STANDARD_LABELS;
    return resolveLabels(labelSet, locale);
  }, [profile, locale]);
}
