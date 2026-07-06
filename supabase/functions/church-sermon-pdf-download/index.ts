// church-sermon-pdf-download: Given a purchase reference, returns a short-lived
// signed URL to download the PDF from the private storage bucket.
// Also increments the download_count.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get('reference') || (await req.json().catch(() => ({})))?.reference;
    if (!reference) return json({ error: 'reference required' }, 400);

    const db = createClient(SUPABASE_URL, SERVICE);
    const { data: purchase } = await db
      .from('church_sermon_pdf_purchases')
      .select('id, pdf_id, status, download_count, pdf:church_sermon_pdfs(id, title, storage_path, page_count)')
      .eq('reference', reference)
      .maybeSingle();
    if (!purchase) return json({ error: 'Purchase not found' }, 404);
    if (purchase.status !== 'succeeded') return json({ error: 'Purchase not completed', status: purchase.status }, 402);

    const path = (purchase as any).pdf?.storage_path;
    if (!path) return json({ error: 'PDF missing' }, 500);

    const { data: signed, error: sigErr } = await db.storage.from('church-sermons').createSignedUrl(path, 60 * 10, { download: `${(purchase as any).pdf.title}.pdf` });
    if (sigErr || !signed) return json({ error: sigErr?.message || 'Signing failed' }, 500);

    await db.from('church_sermon_pdf_purchases').update({
      download_count: (purchase.download_count || 0) + 1,
    }).eq('id', purchase.id);

    return json({
      ok: true,
      download_url: signed.signedUrl,
      title: (purchase as any).pdf.title,
      pages: (purchase as any).pdf.page_count,
      expires_in: 600,
    });
  } catch (e: any) {
    return json({ error: e?.message || 'Internal error' }, 500);
  }
});
