export const CHURCH_DENOMINATIONS = [
  { value: 'pentecostal', fr: 'Pentecôtiste', en: 'Pentecostal' },
  { value: 'catholic', fr: 'Catholique', en: 'Catholic' },
  { value: 'protestant', fr: 'Protestant', en: 'Protestant' },
  { value: 'evangelical', fr: 'Évangélique', en: 'Evangelical' },
  { value: 'baptist', fr: 'Baptiste', en: 'Baptist' },
  { value: 'methodist', fr: 'Méthodiste', en: 'Methodist' },
  { value: 'orthodox', fr: 'Orthodoxe', en: 'Orthodox' },
  { value: 'adventist', fr: 'Adventiste', en: 'Adventist' },
  { value: 'anglican', fr: 'Anglicane', en: 'Anglican' },
  { value: 'ministry', fr: 'Ministère', en: 'Ministry' },
  { value: 'other', fr: 'Autre', en: 'Other' },
] as const;

export type ChurchDenomination = typeof CHURCH_DENOMINATIONS[number]['value'];

export function getDenominationLabel(value: string | null | undefined, locale: string = 'fr'): string {
  if (!value) return locale === 'fr' ? 'Autre' : 'Other';
  const entry = CHURCH_DENOMINATIONS.find((d) => d.value === value);
  if (!entry) return value;
  return locale === 'fr' ? entry.fr : entry.en;
}
