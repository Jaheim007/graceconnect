import { requireAuth, corsHeaders, jsonResp, adminClient } from '../_shared/auth.ts';
import { consumeCreditsOrThrow, normalizeTier } from '../_shared/credits.ts';
import { geminiGenerateText, extractJson } from '../_shared/ai-gemini.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) return jsonResp({ error: 'AI not configured' }, 500);

    const { org_id, product_id, target_language, fields, tier } = await req.json();
    if (!org_id || !product_id || !target_language) return jsonResp({ error: 'org_id, product_id, and target_language required' }, 400);

    const admin = adminClient(auth.supabaseUrl, auth.serviceKey);

    // Permission check
    const { data: member } = await admin.from('organization_members').select('role').eq('user_id', auth.userId).eq('organization_id', org_id).maybeSingle();
    if (!member || !['owner', 'admin', 'editor'].includes(member.role)) return jsonResp({ error: 'Forbidden' }, 403);

    // Load product
    const { data: product, error: prodErr } = await admin.from('digital_products').select('title, description, guarantee_text, faq_json').eq('id', product_id).eq('organization_id', org_id).single();
    if (prodErr || !product) return jsonResp({ error: 'Product not found' }, 404);

    // Debit credits
    await consumeCreditsOrThrow({ admin, userId: auth.userId, actionKey: 'translate_product', tier: normalizeTier(tier) });

    const targetLang = target_language === 'fr' ? 'French' : target_language === 'en' ? 'English' : target_language === 'es' ? 'Spanish' : target_language;

    const toTranslate: Record<string, string> = {};
    const fieldsToTranslate = fields || ['title', 'description', 'guarantee_text'];
    for (const field of fieldsToTranslate) {
      const val = (product as any)[field];
      if (val && typeof val === 'string' && val.trim()) toTranslate[field] = val;
    }

    let faqItems: any[] = [];
    if (fieldsToTranslate.includes('faq_json') && product.faq_json) {
      try { faqItems = Array.isArray(product.faq_json) ? product.faq_json : []; } catch { /* ignore */ }
    }

    if (Object.keys(toTranslate).length === 0 && faqItems.length === 0) return jsonResp({ error: 'No content to translate' }, 400);

    const payload = JSON.stringify({
      ...toTranslate,
      ...(faqItems.length > 0 ? { faq_items: faqItems.map(f => ({ question: f.question, answer: f.answer })) } : {}),
    });

    const raw = await geminiGenerateText({
      apiKey: GEMINI_API_KEY, model: 'gemini-2.5-flash',
      system: `You are a professional translator. Translate to ${targetLang}. Maintain HTML formatting and marketing tone. Return ONLY a JSON object with the same keys.`,
      prompt: payload,
      jsonMode: true,
    });

    const translated = extractJson(raw);
    if (!translated) return jsonResp({ error: 'Failed to parse translation' }, 500);

    // Audit
    await admin.from('audit_logs').insert({
      user_id: auth.userId, action: 'product.translated', resource_type: 'digital_product',
      resource_id: product_id, organization_id: org_id,
      metadata: { target_language, fields_translated: Object.keys(translated) },
    });

    return jsonResp({ ok: true, translated, source_language: 'auto', target_language });
  } catch (e: any) {
    if (e?.status === 402) return jsonResp({ error: e.message }, 402);
    console.error('ai-translate-product error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});
