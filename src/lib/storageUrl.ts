/**
 * Normalise any Supabase storage / API URL so it always uses
 * the branded custom domain instead of the raw project ref.
 *
 * Works on URLs already using the custom domain (no-op) and
 * on the raw `xzgpzbrgsxtcsktiprik.supabase.co` domain.
 */

const RAW_HOST = 'xzgpzbrgsxtcsktiprik.supabase.co';
const BRANDED_ORIGIN = 'https://api.siteviral.com';

export function brandUrl(url: string | null | undefined): string {
  if (!url) return '';
  return url.split(`https://${RAW_HOST}`).join(BRANDED_ORIGIN);
}
