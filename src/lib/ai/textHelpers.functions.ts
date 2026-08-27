import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const aiSuggestTitles = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { topic: string; style?: string; audience?: string; language?: string; tier?: string }) => {
      if (!input?.topic) throw new Error('topic required');
      return input;
    },
  )
  .handler(async ({ data, context }): Promise<{ titles: string[] }> => {
    const { suggestTitles } = await import('./textHelpers.server');
    return { titles: await suggestTitles(context.userId, data) };
  });

export const aiSuggestSubtitles = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      title?: string;
      topic?: string;
      style?: string;
      audience?: string;
      language?: string;
      tier?: string;
    }) => {
      if (!input?.title && !input?.topic) throw new Error('title or topic required');
      return input;
    },
  )
  .handler(async ({ data, context }): Promise<{ subtitles: string[] }> => {
    const { suggestSubtitles } = await import('./textHelpers.server');
    return { subtitles: await suggestSubtitles(context.userId, data) };
  });

export const aiGenerateDescription = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      title: string;
      product_type?: string;
      price?: number;
      currency?: string;
      language?: string;
      tier?: string;
      existing_description?: string;
      audience?: string;
      tone?: string;
      extra_notes?: string;
    }) => {
      if (!input?.title || input.title.length < 3) {
        throw new Error('Title is required (min 3 chars)');
      }
      return input;
    },
  )
  .handler(async ({ data, context }) => {
    const { generateDescription } = await import('./textHelpers.server');
    return generateDescription(context.userId, data);
  });

export const aiWriteContent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { prompt: string; tone?: string; context?: string; tier?: string; lang?: string }) => {
      if (!input?.prompt || typeof input.prompt !== 'string') {
        throw new Error(input?.lang === 'fr' ? "Le champ 'prompt' est requis." : "'prompt' field is required.");
      }
      return input;
    },
  )
  .handler(async ({ data, context }): Promise<{ content: string }> => {
    const { writeContent } = await import('./textHelpers.server');
    return { content: await writeContent(context.userId, data) };
  });

export const aiTranslateProduct = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      org_id: string;
      product_id: string;
      target_language: string;
      fields?: string[];
      tier?: string;
    }) => {
      if (!input?.org_id || !input?.product_id || !input?.target_language) {
        throw new Error('org_id, product_id, and target_language required');
      }
      return input;
    },
  )
  .handler(async ({ data, context }) => {
    const { translateProduct } = await import('./textHelpers.server');
    const result = await translateProduct(context.userId, data);
    return { ok: true as const, source_language: 'auto', ...result };
  });
