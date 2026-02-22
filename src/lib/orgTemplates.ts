import { Locale } from '@/i18n/locales';

/**
 * Org category templates — pre-filled defaults when creating a new org.
 * These provide sensible starting configurations per vertical.
 */
export interface OrgTemplate {
  category: string;
  label: string;
  emoji: string;
  defaults: {
    monetization_enabled: boolean;
    affiliation_enabled: boolean;
    currency: string;
    platform_fee_percent: number;
    affiliation_commission_percent: number;
  };
  suggestedFeatures: string[];
}

export const ORG_TEMPLATES: OrgTemplate[] = [
  {
    category: 'church',
    label: 'Organization',
    emoji: '🏢',
    defaults: {
      monetization_enabled: true,
      affiliation_enabled: false,
      currency: 'USD',
      platform_fee_percent: 10,
      affiliation_commission_percent: 10,
    },
    suggestedFeatures: ['donations', 'events', 'announcements', 'media'],
  },
  {
    category: 'ministry',
    label: 'Association',
    emoji: '🤝',
    defaults: {
      monetization_enabled: true,
      affiliation_enabled: true,
      currency: 'USD',
      platform_fee_percent: 10,
      affiliation_commission_percent: 15,
    },
    suggestedFeatures: ['donations', 'programs', 'events', 'products'],
  },
  {
    category: 'leader',
    label: 'Leader',
    emoji: '👤',
    defaults: {
      monetization_enabled: true,
      affiliation_enabled: true,
      currency: 'USD',
      platform_fee_percent: 10,
      affiliation_commission_percent: 10,
    },
    suggestedFeatures: ['products', 'programs', 'media', 'events'],
  },
  {
    category: 'ngo',
    label: 'NGO',
    emoji: '🌍',
    defaults: {
      monetization_enabled: true,
      affiliation_enabled: false,
      currency: 'USD',
      platform_fee_percent: 8,
      affiliation_commission_percent: 5,
    },
    suggestedFeatures: ['donations', 'events', 'announcements', 'photos'],
  },
  {
    category: 'community',
    label: 'Community',
    emoji: '🏘️',
    defaults: {
      monetization_enabled: false,
      affiliation_enabled: false,
      currency: 'USD',
      platform_fee_percent: 10,
      affiliation_commission_percent: 10,
    },
    suggestedFeatures: ['events', 'announcements', 'photos', 'media'],
  },
  {
    category: 'other',
    label: 'Other',
    emoji: '🔷',
    defaults: {
      monetization_enabled: true,
      affiliation_enabled: false,
      currency: 'USD',
      platform_fee_percent: 10,
      affiliation_commission_percent: 10,
    },
    suggestedFeatures: ['products', 'events', 'announcements'],
  },
];

export function getTemplateForCategory(category: string): OrgTemplate | undefined {
  return ORG_TEMPLATES.find(t => t.category === category);
}
