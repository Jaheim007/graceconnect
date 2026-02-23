/**
 * Auto-detect user's country from timezone, then map to default currency.
 * Fallback: IP geolocation via free API.
 */

/** Timezone → ISO country code mapping (covers major African + global timezones) */
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  // West Africa (XOF zone)
  'Africa/Abidjan': 'CI', 'Africa/Bamako': 'ML', 'Africa/Dakar': 'SN',
  'Africa/Ouagadougou': 'BF', 'Africa/Lome': 'TG', 'Africa/Niamey': 'NE',
  'Africa/Conakry': 'GN', 'Africa/Bissau': 'GW',
  // Central Africa (XAF zone)
  'Africa/Douala': 'CM', 'Africa/Libreville': 'GA', 'Africa/Brazzaville': 'CG',
  'Africa/Bangui': 'CF', 'Africa/Ndjamena': 'TD', 'Africa/Malabo': 'GQ',
  // Nigeria
  'Africa/Lagos': 'NG',
  // Ghana
  'Africa/Accra': 'GH',
  // Kenya / East Africa
  'Africa/Nairobi': 'KE', 'Africa/Dar_es_Salaam': 'TZ', 'Africa/Kampala': 'UG',
  'Africa/Addis_Ababa': 'ET', 'Africa/Mogadishu': 'SO', 'Africa/Asmara': 'ER',
  // South Africa
  'Africa/Johannesburg': 'ZA', 'Africa/Harare': 'ZW', 'Africa/Maputo': 'MZ',
  'Africa/Lusaka': 'ZM', 'Africa/Blantyre': 'MW', 'Africa/Gaborone': 'BW',
  // North Africa
  'Africa/Casablanca': 'MA', 'Africa/Tunis': 'TN', 'Africa/Algiers': 'DZ',
  'Africa/Cairo': 'EG', 'Africa/Tripoli': 'LY',
  // Europe
  'Europe/Paris': 'FR', 'Europe/London': 'GB', 'Europe/Berlin': 'DE',
  'Europe/Madrid': 'ES', 'Europe/Rome': 'IT', 'Europe/Brussels': 'BE',
  'Europe/Amsterdam': 'NL', 'Europe/Zurich': 'CH', 'Europe/Lisbon': 'PT',
  'Europe/Vienna': 'AT', 'Europe/Dublin': 'IE', 'Europe/Luxembourg': 'LU',
  'Europe/Helsinki': 'FI', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK', 'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ',
  'Europe/Bucharest': 'RO', 'Europe/Athens': 'GR', 'Europe/Istanbul': 'TR',
  // Americas
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
  'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA', 'America/Halifax': 'CA',
  'America/Mexico_City': 'MX', 'America/Sao_Paulo': 'BR', 'America/Argentina/Buenos_Aires': 'AR',
  // Asia / Middle East
  'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Kolkata': 'IN',
  'Asia/Shanghai': 'CN', 'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR',
  'Asia/Singapore': 'SG', 'Asia/Hong_Kong': 'HK',
  // Oceania
  'Australia/Sydney': 'AU', 'Pacific/Auckland': 'NZ',
};

/** Country code → default currency */
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // XOF zone (UEMOA)
  CI: 'XOF', SN: 'XOF', ML: 'XOF', BF: 'XOF', TG: 'XOF', NE: 'XOF', GN: 'XOF', GW: 'XOF', BJ: 'XOF',
  // XAF zone (CEMAC)
  CM: 'XAF', GA: 'XAF', CG: 'XAF', CF: 'XAF', TD: 'XAF', GQ: 'XAF',
  // Individual African currencies
  NG: 'NGN', GH: 'GHS', KE: 'KES', TZ: 'KES', UG: 'KES',
  ZA: 'ZAR', ZW: 'ZAR', MZ: 'ZAR', ZM: 'ZAR', BW: 'ZAR', MW: 'ZAR',
  MA: 'MAD', TN: 'TND', DZ: 'EUR', EG: 'USD', LY: 'USD',
  ET: 'USD', SO: 'USD', ER: 'USD',
  // Europe (EUR zone)
  FR: 'EUR', DE: 'EUR', ES: 'EUR', IT: 'EUR', BE: 'EUR', NL: 'EUR',
  PT: 'EUR', AT: 'EUR', IE: 'EUR', LU: 'EUR', FI: 'EUR', GR: 'EUR',
  // Europe (non-EUR)
  GB: 'GBP', CH: 'EUR', SE: 'EUR', NO: 'EUR', DK: 'EUR',
  PL: 'EUR', CZ: 'EUR', RO: 'EUR', TR: 'EUR',
  // Americas
  US: 'USD', CA: 'USD', MX: 'USD', BR: 'USD', AR: 'USD',
  // Asia
  AE: 'USD', SA: 'USD', IN: 'USD', CN: 'USD', JP: 'USD', KR: 'USD',
  SG: 'USD', HK: 'USD',
  // Oceania
  AU: 'USD', NZ: 'USD',
};

/** Detect country from browser timezone */
export function detectCountryFromTimezone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_TO_COUNTRY[tz] || null;
  } catch {
    return null;
  }
}

/** Get default currency for a country code */
export function getCurrencyForCountry(countryCode: string): string {
  return COUNTRY_TO_CURRENCY[countryCode] || 'USD';
}

/** Detect currency from timezone (synchronous, instant) */
export function detectCurrencyFromTimezone(): string {
  const country = detectCountryFromTimezone();
  if (country) return getCurrencyForCountry(country);
  return 'USD';
}

/** Detect country via IP geolocation (async fallback) */
export async function detectCountryFromIP(): Promise<string | null> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data.country_code || null;
  } catch {
    return null;
  }
}

/**
 * Full detection: timezone first (instant), then IP fallback if timezone is ambiguous.
 * Returns { country, currency }
 */
export async function detectUserLocation(): Promise<{ country: string | null; currency: string }> {
  // 1. Try timezone (instant)
  const tzCountry = detectCountryFromTimezone();
  if (tzCountry) {
    return { country: tzCountry, currency: getCurrencyForCountry(tzCountry) };
  }

  // 2. Fallback to IP geolocation
  const ipCountry = await detectCountryFromIP();
  if (ipCountry) {
    return { country: ipCountry, currency: getCurrencyForCountry(ipCountry) };
  }

  // 3. Ultimate fallback
  return { country: null, currency: 'USD' };
}
