// Server-only Canva integration. Ported from the `canva-auth` and
// `canva-design` edge functions. Client credentials never leave the server.

const CANVA_API = 'https://api.canva.com/rest/v1';

function creds() {
  const id = process.env['CANVA_CLIENT_ID'];
  const secret = process.env['CANVA_CLIENT_SECRET'];
  if (!id || !secret) throw new Error('Canva credentials not configured');
  return { id, secret };
}

function basicAuth() {
  const { id, secret } = creds();
  return `Basic ${btoa(`${id}:${secret}`)}`;
}

export interface CanvaTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
  scope?: string;
}

async function oauthToken(params: Record<string, string>): Promise<CanvaTokens> {
  const res = await fetch(`${CANVA_API}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuth(),
    },
    body: new URLSearchParams(params),
  });
  const data = (await res.json()) as Record<string, any>;
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'Canva token request failed');
  }
  return data as CanvaTokens;
}

export function exchangeCanvaCode(input: {
  code: string;
  redirect_uri: string;
  code_verifier: string;
}) {
  return oauthToken({
    grant_type: 'authorization_code',
    code: input.code,
    redirect_uri: input.redirect_uri,
    code_verifier: input.code_verifier,
  });
}

export function refreshCanvaToken(refreshToken: string) {
  return oauthToken({ grant_type: 'refresh_token', refresh_token: refreshToken });
}

function canvaHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function createCanvaDesign(input: {
  canva_token: string;
  title?: string | null;
  width?: number | null;
  height?: number | null;
  preset?: string | null;
}) {
  const designBody: Record<string, any> = {};
  if (input.title) designBody.title = input.title;
  designBody.design_type = input.preset
    ? { type: 'preset', name: input.preset }
    : { type: 'custom', width: input.width || 600, height: input.height || 900 };

  const res = await fetch(`${CANVA_API}/designs`, {
    method: 'POST',
    headers: canvaHeaders(input.canva_token),
    body: JSON.stringify(designBody),
  });
  const data = (await res.json()) as Record<string, any>;
  if (!res.ok) {
    throw new Error(data.message || data.error?.message || 'Failed to create design');
  }
  return {
    design_id: data.design?.id as string | undefined,
    edit_url: data.design?.urls?.edit_url as string | undefined,
    view_url: data.design?.urls?.view_url as string | undefined,
    thumbnail_url: data.design?.thumbnail?.url as string | undefined,
  };
}

export async function exportCanvaDesign(input: {
  canva_token: string;
  design_id: string;
  format?: string | null;
}) {
  const headers = canvaHeaders(input.canva_token);

  const exportRes = await fetch(`${CANVA_API}/exports`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      design_id: input.design_id,
      format: { type: input.format || 'png' },
    }),
  });
  const exportData = (await exportRes.json()) as Record<string, any>;
  if (!exportRes.ok) throw new Error(exportData.message || 'Export failed');

  const jobId = exportData.job?.id as string | undefined;
  if (!jobId) throw new Error('No export job ID returned');

  let exportUrl: string | null = null;
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const statusRes = await fetch(`${CANVA_API}/exports/${jobId}`, { headers });
    const statusData = (await statusRes.json()) as Record<string, any>;
    if (statusData.job?.status === 'success') {
      exportUrl = statusData.job?.urls?.[0] ?? null;
      break;
    }
    if (statusData.job?.status === 'failed') throw new Error('Export job failed');
  }
  if (!exportUrl) throw new Error('Export timed out');

  const imageRes = await fetch(exportUrl);
  const imageBuffer = new Uint8Array(await imageRes.arrayBuffer());

  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const fileName = `canva-covers/${input.design_id}-${Date.now()}.png`;
  const { error: uploadErr } = await supabaseAdmin.storage
    .from('org-uploads')
    .upload(fileName, imageBuffer, { contentType: 'image/png', upsert: true });
  if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

  const { data: urlData } = supabaseAdmin.storage.from('org-uploads').getPublicUrl(fileName);
  const brandedUrl = urlData.publicUrl.replace(
    'https://xzgpzbrgsxtcsktiprik.supabase.co',
    'https://api.siteviral.com',
  );

  return { cover_url: brandedUrl, canva_url: exportUrl };
}
