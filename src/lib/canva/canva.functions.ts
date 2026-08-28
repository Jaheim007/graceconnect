import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const canvaExchangeCode = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string; redirect_uri: string; code_verifier: string }) => {
    if (!input?.code) throw new Error('missing_code');
    if (!input?.redirect_uri) throw new Error('missing_redirect_uri');
    if (!input?.code_verifier) throw new Error('missing_code_verifier');
    return {
      code: String(input.code),
      redirect_uri: String(input.redirect_uri),
      code_verifier: String(input.code_verifier),
    };
  })
  .handler(async ({ data }) => {
    const { exchangeCanvaCode } = await import('./canva.server');
    return exchangeCanvaCode(data);
  });

export const canvaRefreshToken = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { refresh_token: string }) => {
    if (!input?.refresh_token) throw new Error('missing_refresh_token');
    return { refresh_token: String(input.refresh_token) };
  })
  .handler(async ({ data }) => {
    const { refreshCanvaToken } = await import('./canva.server');
    return refreshCanvaToken(data.refresh_token);
  });

export const canvaCreateDesign = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    canva_token: string;
    title?: string | null;
    width?: number | null;
    height?: number | null;
    preset?: string | null;
  }) => {
    if (!input?.canva_token) throw new Error('missing_canva_token');
    return {
      canva_token: String(input.canva_token),
      title: input.title ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      preset: input.preset ?? null,
    };
  })
  .handler(async ({ data }) => {
    const { createCanvaDesign } = await import('./canva.server');
    return createCanvaDesign(data);
  });

export const canvaExportDesign = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { canva_token: string; design_id: string; format?: string | null }) => {
    if (!input?.canva_token) throw new Error('missing_canva_token');
    if (!input?.design_id) throw new Error('missing_design_id');
    return {
      canva_token: String(input.canva_token),
      design_id: String(input.design_id),
      format: input.format ?? null,
    };
  })
  .handler(async ({ data }) => {
    const { exportCanvaDesign } = await import('./canva.server');
    return exportCanvaDesign(data);
  });
