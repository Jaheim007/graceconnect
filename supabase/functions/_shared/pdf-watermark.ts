/**
 * Shared helper to apply / skip "Made with SiteViral" footer watermark
 * on PDF generation depending on the owner's platform tier.
 *
 * Free tier  → adds discreet footer "Made with SiteViral · siteviral.com"
 * Pro/Org/Founder → skipped (white-label)
 */

import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

export async function shouldWatermark(
  db: { rpc: (name: string, args: any) => Promise<{ data: any; error: any }> },
  ownerUserId: string | null | undefined,
): Promise<boolean> {
  if (!ownerUserId) return true;
  try {
    const { data } = await db.rpc('get_user_platform_tier', { _user_id: ownerUserId });
    const tier = (data as string) || 'free';
    return !(tier === 'pro' || tier === 'org' || tier === 'founder');
  } catch {
    return true;
  }
}

export async function applyWatermark(pdfDoc: PDFDocument, locale: 'fr' | 'en' = 'en') {
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const text = locale === 'fr'
    ? 'Créé avec SiteViral · siteviral.com'
    : 'Made with SiteViral · siteviral.com';
  const pages = pdfDoc.getPages();
  for (const page of pages) {
    const { width } = page.getSize();
    const fontSize = 8;
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: 14,
      size: fontSize,
      font,
      color: rgb(0.55, 0.55, 0.55),
      opacity: 0.7,
    });
  }
}
