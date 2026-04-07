import { requireAuth, corsHeaders, jsonResp, adminClient } from '../_shared/auth.ts';
import { consumeCreditsWithRefund, normalizeTier } from '../_shared/credits.ts';
import { aiGenerateText, extractJson } from '../_shared/ai-fallback.ts';

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

    // Debit credits with auto-refund on failure (2-pass = slightly higher cost)
    const result = await consumeCreditsWithRefund({
      admin, userId: auth.userId, actionKey: 'translate_product', tier: normalizeTier(tier),
      action: async () => {
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

        if (Object.keys(toTranslate).length === 0 && faqItems.length === 0) throw new Error('No content to translate');

        const payload = JSON.stringify({
          ...toTranslate,
          ...(faqItems.length > 0 ? { faq_items: faqItems.map(f => ({ question: f.question, answer: f.answer })) } : {}),
        });

        // === PASS 1: Initial translation ===
        const pass1Raw = await aiGenerateText({
          geminiKey: GEMINI_API_KEY, model: 'gemini-2.5-flash-lite',
          system: `You are a professional translator specializing in digital product marketing. Translate the following content to ${targetLang}. Maintain all HTML formatting, marketing tone, and persuasive copywriting style. Return ONLY a JSON object with the same keys.`,
          prompt: payload,
          jsonMode: true,
        });

        const pass1 = extractJson(pass1Raw);
        if (!pass1) throw new Error('Failed to parse initial translation');

        // === PASS 2: Quality review & refinement ===
        const reviewPayload = JSON.stringify({
          original: JSON.parse(payload),
          translation: pass1,
          target_language: targetLang,
        });

        const pass2Raw = await aiGenerateText({
          geminiKey: GEMINI_API_KEY, model: 'gemini-2.5-flash-lite',
          system: `You are a bilingual editor reviewing a translation to ${targetLang}. Check for:
1. Accuracy — does it faithfully convey the original meaning?
2. Naturalness — does it read like native ${targetLang} content (not translated)?
3. Marketing tone — is the persuasive copywriting preserved?
4. Grammar & spelling — any errors?
5. Cultural adaptation — are idioms/expressions adapted properly?

Return a JSON object with these keys:
- "refined": the improved translation (same structure as the translation input — only change what needs improving)
- "quality_score": a number 1-10
- "issues_found": array of strings describing issues fixed (empty if none)`,
          prompt: reviewPayload,
          jsonMode: true,
        });

        const pass2 = extractJson(pass2Raw);
        const refined = pass2?.refined || pass1;
        const qualityScore = pass2?.quality_score || null;
        const issuesFound = pass2?.issues_found || [];

        // Audit
        await admin.from('audit_logs').insert({
          user_id: auth.userId, action: 'product.translated', resource_type: 'digital_product',
          resource_id: product_id, organization_id: org_id,
          metadata: {
            target_language,
            fields_translated: Object.keys(refined),
            quality_score: qualityScore,
            issues_found: issuesFound,
            two_pass: true,
          },
        });

        return { translated: refined, target_language, quality_score: qualityScore, issues_found: issuesFound };
      },
    });

    return jsonResp({
      ok: true,
      translated: result.translated,
      source_language: 'auto',
      target_language: result.target_language,
      quality_score: result.quality_score,
      issues_found: result.issues_found,
    });
  } catch (e: any) {
    if (e?.status === 402) return jsonResp({ error: e.message }, 402);
    console.error('ai-translate-product error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});
