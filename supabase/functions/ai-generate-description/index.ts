import { requireAuth, corsHeaders, jsonResp, adminClient } from '../_shared/auth.ts';
import { consumeCreditsWithRefund, normalizeTier } from '../_shared/credits.ts';
import { aiGenerateText } from '../_shared/ai-fallback.ts';

/**
 * Detect the most likely language from a text string.
 * Returns ISO code: 'fr', 'en', 'es', 'pt', 'de', 'sw', etc.
 */
function detectLanguage(text: string): string {
  const t = text.toLowerCase();

  // French indicators
  const fr = /[àâäéèêëïîôùûüÿçœæ]|(?:^|\s)(?:le|la|les|des|du|une?|pour|avec|sur|dans|par|est|sont|qui|que|cette?|mon|ton|son|votre|notre|leur|mais|aussi|très|comment|pourquoi)\s/i;
  // Spanish indicators
  const es = /[áéíóúñ¿¡]|(?:^|\s)(?:el|los|las|del|una?|para|con|sobre|por|está|son|cómo|qué|pero|también|muy)\s/i;
  // Portuguese indicators
  const pt = /[ãõç]|(?:^|\s)(?:o|os|as|do|da|um|uma|para|com|sobre|por|está|são|como|mas|também|muito)\s/i;
  // German indicators
  const de = /[äöüß]|(?:^|\s)(?:der|die|das|ein|eine|für|mit|auf|ist|sind|wie|aber|auch|sehr)\s/i;
  // Swahili indicators
  const sw = /(?:^|\s)(?:wa|ya|na|kwa|ni|za|la|katika|kuhusu|jinsi|lakini|pia|sana)\s/i;

  // Score each language
  const scores: Record<string, number> = { fr: 0, es: 0, pt: 0, de: 0, sw: 0 };
  if (fr.test(t)) scores.fr += 2;
  if (es.test(t)) scores.es += 2;
  if (pt.test(t)) scores.pt += 2;
  if (de.test(t)) scores.de += 2;
  if (sw.test(t)) scores.sw += 2;

  // Count accented chars specific to each
  scores.fr += (t.match(/[éèêëàâçùû]/g) || []).length;
  scores.es += (t.match(/[áéíóúñ]/g) || []).length;
  scores.pt += (t.match(/[ãõ]/g) || []).length;
  scores.de += (t.match(/[äöüß]/g) || []).length;

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (best[1] >= 2) return best[0];

  // Default: if no strong signal, assume English
  return 'en';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const { title, product_type, price, currency, language, tier, existing_description, audience, tone, extra_notes } = await req.json();
    if (!title || title.length < 3) return jsonResp({ error: 'Title is required (min 3 chars)' }, 400);

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) return jsonResp({ error: 'AI not configured' }, 500);

    const admin = adminClient(auth.supabaseUrl, auth.serviceKey);

    // Detect language from title content first, fall back to UI locale hint
    const detectedLang = detectLanguage(title + ' ' + (existing_description || ''));
    const lang = detectedLang || language || 'fr';

    const result = await consumeCreditsWithRefund({
      admin, userId: auth.userId, actionKey: 'generate_description', tier: normalizeTier(tier),
      action: async () => {
        const priceText = price > 0 ? `${price} ${currency || 'XOF'}` : (lang === 'fr' ? 'Gratuit' : lang === 'es' ? 'Gratis' : 'Free');

        const productTypeLabels: Record<string, Record<string, string>> = {
          fr: { pdf: 'PDF / Document', ebook: 'eBook / Livre numérique', video: 'Formation vidéo', audio: 'Audio / Podcast', course: 'Formation en ligne', template: 'Template / Modèle', software: 'Logiciel / App' },
          en: { pdf: 'PDF / Document', ebook: 'eBook / Digital Book', video: 'Video Course', audio: 'Audio / Podcast', course: 'Online Course', template: 'Template', software: 'Software / App' },
          es: { pdf: 'PDF / Documento', ebook: 'eBook / Libro digital', video: 'Curso en video', audio: 'Audio / Podcast', course: 'Curso en línea', template: 'Plantilla', software: 'Software / App' },
        };
        const typeLabel = (productTypeLabels[lang] || productTypeLabels.en)?.[product_type] || product_type;

        const langInstructions: Record<string, { system: string; structure: string; rules: string }> = {
          fr: {
            system: `Tu es un COPYWRITER d'élite spécialisé en produits numériques. Tu DOIS écrire UNIQUEMENT en français.`,
            structure: `1. <p> ACCROCHE — Une phrase choc qui parle au lecteur. Identifie son problème ou désir profond.
2. <p> PROMESSE — Ce que le lecteur va concrètement obtenir grâce à ce produit.
3. <ul><li> BÉNÉFICES — 4 à 6 bénéfices concrets avec <strong> sur les mots clés.
4. <p> CRÉDIBILITÉ — Pourquoi ce produit est différent/meilleur.
5. <p> APPEL À L'ACTION — Phrase finale qui pousse à l'achat.`,
            rules: `- TOUT en français
- HTML propre : <p>, <strong>, <em>, <ul>, <li>
- 2-3 emojis bien placés (pas au début)
- 200-350 mots, texte COMPLET
- Ne commence JAMAIS par "Voici..." ou "Découvrez notre..."
- Ne termine JAMAIS au milieu d'une phrase
- Pas de titres H1/H2/H3
- Phrases courtes et percutantes`,
          },
          en: {
            system: `You are an elite COPYWRITER for digital products. You MUST write ONLY in English.`,
            structure: `1. <p> HOOK — A punchy sentence addressing the reader's problem or desire.
2. <p> PROMISE — What they'll concretely get from this product.
3. <ul><li> BENEFITS — 4-6 concrete benefits with <strong> on keywords.
4. <p> CREDIBILITY — Why this product is different/better.
5. <p> CALL TO ACTION — Final push to buy.`,
            rules: `- ONLY in English
- Clean HTML: <p>, <strong>, <em>, <ul>, <li>
- 2-3 well-placed emojis
- 200-350 words, COMPLETE text
- Never start with "Here is..." or "Discover our..."
- Never end mid-sentence
- No H1/H2/H3 headings
- Short, punchy sentences`,
          },
          es: {
            system: `Eres un COPYWRITER de élite para productos digitales. DEBES escribir SOLO en español.`,
            structure: `1. <p> GANCHO — Una frase impactante sobre el problema o deseo del lector.
2. <p> PROMESA — Lo que obtendrá concretamente con este producto.
3. <ul><li> BENEFICIOS — 4 a 6 beneficios concretos con <strong>.
4. <p> CREDIBILIDAD — Por qué este producto es diferente/mejor.
5. <p> LLAMADA A LA ACCIÓN — Frase final que impulsa la compra.`,
            rules: `- TODO en español
- HTML limpio: <p>, <strong>, <em>, <ul>, <li>
- 2-3 emojis bien colocados
- 200-350 palabras, texto COMPLETO
- Nunca empieces con "Aquí está..." o "Descubre nuestro..."
- Nunca termines a mitad de frase
- Sin títulos H1/H2/H3`,
          },
        };

        const instr = langInstructions[lang] || langInstructions.en;

        const prompt = `Write a PROFESSIONAL and COMPLETE HTML sales description for this digital product.

PRODUCT:
- Title: "${title}"
- Type: ${typeLabel}
- Price: ${priceText}
${existing_description ? `- Existing description (to improve): ${existing_description.slice(0, 500)}` : ''}
${audience ? `- Target audience (write FOR these people, speak to them directly): ${String(audience).slice(0, 300)}` : ''}
${tone ? `- Required tone of voice (respect it strictly): ${String(tone).slice(0, 120)}` : ''}
${extra_notes ? `- Extra instructions from the creator: ${String(extra_notes).slice(0, 300)}` : ''}

MANDATORY STRUCTURE (HTML only, NO markdown):
${instr.structure}

RULES:
${instr.rules}`;

        const raw = await aiGenerateText({
          geminiKey: GEMINI_API_KEY,
          model: 'gemini-2.5-flash-lite',
          system: instr.system,
          prompt,
          temperature: 0.7,
          maxOutputTokens: 4096,
        });

        const trimmed = raw.trim();
        if (!trimmed || trimmed.length < 80) {
          throw new Error('AI returned insufficient content');
        }

        let cleaned = trimmed
          .replace(/^```html\s*/i, '')
          .replace(/\s*```$/i, '')
          .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/^\s*---\s*/g, '')
          .replace(/\s*---\s*$/g, '');

        // Auto-close unclosed tags
        const openP = (cleaned.match(/<p[\s>]/gi) || []).length;
        const closeP = (cleaned.match(/<\/p>/gi) || []).length;
        if (openP > closeP) cleaned += '</p>'.repeat(openP - closeP);
        const openUl = (cleaned.match(/<ul[\s>]/gi) || []).length;
        const closeUl = (cleaned.match(/<\/ul>/gi) || []).length;
        if (openUl > closeUl) cleaned += '</ul>'.repeat(openUl - closeUl);

        return cleaned;
      },
    });

    return jsonResp({ description: result, language: lang });
  } catch (e: any) {
    if (e?.status === 402) return jsonResp({ error: e.message }, 402);
    console.error('ai-generate-description error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});
