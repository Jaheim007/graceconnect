import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      return jsonResp({ error: 'LOVABLE_API_KEY not configured' }, 500);
    }

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return jsonResp({ error: 'Unauthorized' }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return jsonResp({ error: 'Unauthorized' }, 401);

    const { org_id, product_id, target_language, fields } = await req.json();
    if (!org_id || !product_id || !target_language) {
      return jsonResp({ error: 'org_id, product_id, and target_language are required' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Permission check
    const { data: member } = await admin
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', org_id)
      .maybeSingle();

    if (!member || !['owner', 'admin', 'editor'].includes(member.role)) {
      return jsonResp({ error: 'Forbidden' }, 403);
    }

    // Load product
    const { data: product, error: prodErr } = await admin
      .from('digital_products')
      .select('title, description, guarantee_text, faq_json, testimonials_json')
      .eq('id', product_id)
      .eq('organization_id', org_id)
      .single();

    if (prodErr || !product) return jsonResp({ error: 'Product not found' }, 404);

    const targetLang = target_language === 'fr' ? 'French' : target_language === 'en' ? 'English' : target_language === 'es' ? 'Spanish' : target_language;

    // Build translation payload
    const toTranslate: Record<string, string> = {};
    const fieldsToTranslate = fields || ['title', 'description', 'guarantee_text'];

    for (const field of fieldsToTranslate) {
      const val = (product as any)[field];
      if (val && typeof val === 'string' && val.trim()) {
        toTranslate[field] = val;
      }
    }

    // Handle FAQ
    let faqItems: any[] = [];
    if (fieldsToTranslate.includes('faq_json') && product.faq_json) {
      try {
        faqItems = Array.isArray(product.faq_json) ? product.faq_json : [];
      } catch { /* ignore */ }
    }

    if (Object.keys(toTranslate).length === 0 && faqItems.length === 0) {
      return jsonResp({ error: 'No content to translate' }, 400);
    }

    const systemPrompt = `You are a professional translator. Translate the following content to ${targetLang}. 
Maintain the original formatting (HTML tags, markdown, etc.).
For product descriptions, keep a persuasive marketing tone.
Return ONLY a JSON object with the same keys, translated values.`;

    const userPrompt = JSON.stringify({
      ...toTranslate,
      ...(faqItems.length > 0 ? { faq_items: faqItems.map(f => ({ question: f.question, answer: f.answer })) } : {}),
    });

    // Call Lovable AI with tool calling for structured output
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'return_translation',
            description: 'Return translated content',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Translated title' },
                description: { type: 'string', description: 'Translated description' },
                guarantee_text: { type: 'string', description: 'Translated guarantee text' },
                faq_items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      question: { type: 'string' },
                      answer: { type: 'string' },
                    },
                    required: ['question', 'answer'],
                  },
                },
              },
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'return_translation' } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return jsonResp({ error: 'Rate limit exceeded, try again later' }, 429);
      if (status === 402) return jsonResp({ error: 'AI credits exhausted' }, 402);
      console.error('AI error:', status, await aiResponse.text());
      return jsonResp({ error: 'Translation failed' }, 500);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return jsonResp({ error: 'No translation returned' }, 500);

    let translated: any;
    try {
      translated = JSON.parse(toolCall.function.arguments);
    } catch {
      return jsonResp({ error: 'Failed to parse translation' }, 500);
    }

    // Audit log
    await admin.from('audit_logs').insert({
      user_id: user.id,
      action: 'product.translated',
      resource_type: 'digital_product',
      resource_id: product_id,
      organization_id: org_id,
      metadata: {
        target_language,
        fields_translated: Object.keys(translated),
      },
    });

    return jsonResp({
      ok: true,
      translated,
      source_language: 'auto',
      target_language,
    });

  } catch (e) {
    console.error('ai-translate-product error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});

function jsonResp(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
