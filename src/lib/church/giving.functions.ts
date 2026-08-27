import { createServerFn } from '@tanstack/react-start';

// Public: given a gift reference, return only non-sensitive fields (no donor PII).
export const churchGivingStatus = createServerFn({ method: 'POST' })
  .inputValidator((input: { reference: string }) => {
    if (!input?.reference) throw new Error('reference required');
    return { reference: String(input.reference) };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const db = supabaseAdmin as any;
    const { data: row } = await db
      .from('church_donations')
      .select('status, amount, currency, giving_type, completed_at, church_id')
      .eq('reference', data.reference)
      .maybeSingle();
    if (!row) return { status: 'unknown' as const };
    return row;
  });

// Public: given a completed purchase reference, return a short-lived signed URL
// for the sermon PDF and bump the download counter.
export const churchSermonPdfDownload = createServerFn({ method: 'POST' })
  .inputValidator((input: { reference: string }) => {
    if (!input?.reference) throw new Error('reference required');
    return { reference: String(input.reference) };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const db = supabaseAdmin as any;

    const { data: purchase } = await db
      .from('church_sermon_pdf_purchases')
      .select('id, pdf_id, status, download_count, pdf:church_sermon_pdfs(id, title, storage_path, page_count)')
      .eq('reference', data.reference)
      .maybeSingle();
    if (!purchase) return { error: 'Purchase not found' };
    if (purchase.status !== 'succeeded') {
      return { error: 'Purchase not completed', status: purchase.status };
    }

    const path = purchase.pdf?.storage_path;
    if (!path) return { error: 'PDF missing' };

    const { data: signed, error: sigErr } = await db.storage
      .from('church-sermons')
      .createSignedUrl(path, 60 * 10, { download: `${purchase.pdf.title}.pdf` });
    if (sigErr || !signed) return { error: sigErr?.message || 'Signing failed' };

    await db
      .from('church_sermon_pdf_purchases')
      .update({ download_count: (purchase.download_count || 0) + 1 })
      .eq('id', purchase.id);

    return {
      ok: true as const,
      download_url: signed.signedUrl,
      title: purchase.pdf.title,
      pages: purchase.pdf.page_count,
      expires_in: 600,
    };
  });
