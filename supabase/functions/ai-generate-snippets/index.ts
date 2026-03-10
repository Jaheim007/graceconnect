import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResp } from '../_shared/auth.ts';
import { consumeCreditsOrThrow } from '../_shared/credits.ts';
import { aiGenerateText, extractJson } from '../_shared/ai-fallback.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    // Auth (may be auto-triggered without user context)
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id || null;
    }

    const { product_id, org_id } = await req.json();
    if (!product_id || !org_id) return jsonResp({ error: 'product_id and org_id required' }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // Fetch product
    const { data: product, error: pErr } = await admin.from('digital_products')
      .select('title, description, product_type, price, currency, cover_image_url')
      .eq('id', product_id).eq('organization_id', org_id).single();
    if (pErr || !product) return jsonResp({ error: 'Product not found' }, 404);

    const { data: org } = await admin.from('organizations').select('name, slug').eq('id', org_id).single();

    // Debit credits only if user-initiated (not auto-triggered)
    if (userId) {
      try {
        await consumeCreditsOrThrow({ admin, userId, actionKey: 'generate_snippets', tier: 'standard' });
      } catch (e: any) {
        if (e?.status === 402) return jsonResp({ error: e.message }, 402);
        throw e;
      }
    }

    if (!GEMINI_API_KEY) {
      const snippets = generateFallbackSnippets(product, org);
      await saveSnippets(admin, product_id, org_id, snippets);
      return jsonResp({ ok: true, count: snippets.length, method: 'fallback' });
    }

    const prompt = `Tu es un expert en marketing viral. Génère des extraits partageables pour ce produit numérique.\n\nProduit: "${product.title}"\nDescription: ${product.description || 'Non fournie'}\nType: ${product.product_type || 'ebook'}\nCréateur: ${org?.name || 'Créateur'}\n\nGénère exactement 10 éléments viraux au format JSON array. Chaque élément: {"type":"quote"|"hook"|"benefit"|"social_post", "text":"...", "platform":"whatsapp"|"facebook"|"twitter"|"instagram"|"universal"}`;

    const raw = await geminiGenerateText({
      apiKey: GEMINI_API_KEY, model: 'gemini-2.5-flash-lite',
      system: 'Tu génères du contenu marketing viral en français. Réponds uniquement en JSON array.',
      prompt,
    });

    let aiSnippets = extractJson(raw);
    if (!Array.isArray(aiSnippets)) aiSnippets = generateFallbackSnippets(product, org);

    await saveSnippets(admin, product_id, org_id, aiSnippets);
    return jsonResp({ ok: true, count: aiSnippets.length, method: 'ai' });
  } catch (err) {
    console.error('Snippet generation error:', err);
    return jsonResp({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});

function generateFallbackSnippets(product: any, org: any) {
  const title = product.title;
  const creator = org?.name || 'Créateur';
  return [
    { type: 'hook', text: `Découvrez "${title}" — le contenu qui fait le buzz ! 🔥`, platform: 'universal' },
    { type: 'quote', text: `"${title}" par ${creator} — un contenu à ne pas manquer.`, platform: 'universal' },
    { type: 'benefit', text: `${title} — Accédez à un contenu premium.`, platform: 'universal' },
    { type: 'social_post', text: `🚀 Je viens de découvrir "${title}" sur Siteviral. À partager !`, platform: 'whatsapp' },
    { type: 'social_post', text: `📚 "${title}" par ${creator} — Disponible maintenant. #Siteviral`, platform: 'twitter' },
  ];
}

async function saveSnippets(admin: any, productId: string, orgId: string, snippets: any[]) {
  await admin.from('viral_snippets').delete().eq('product_id', productId);
  const rows = snippets.map((s: any, i: number) => ({
    product_id: productId, organization_id: orgId,
    snippet_type: s.type || 'quote', text: s.text,
    platform: s.platform || 'universal', display_order: i,
  }));
  const { error } = await admin.from('viral_snippets').insert(rows);
  if (error) console.error('Failed to save snippets:', error);
}
