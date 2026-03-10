import { requireAuth, corsHeaders, jsonResp, adminClient } from '../_shared/auth.ts';
import { consumeCreditsWithRefund, normalizeTier } from '../_shared/credits.ts';
import { aiGenerateText } from '../_shared/ai-fallback.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const { title, product_type, price, currency, language, tier, existing_description } = await req.json();
    if (!title || title.length < 3) return jsonResp({ error: 'Title is required (min 3 chars)' }, 400);

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) return jsonResp({ error: 'AI not configured' }, 500);

    const admin = adminClient(auth.supabaseUrl, auth.serviceKey);

    const result = await consumeCreditsWithRefund({
      admin, userId: auth.userId, actionKey: 'generate_description', tier: normalizeTier(tier),
      action: async () => {
        // Detect language from title content (French characters/patterns), not just UI locale
        const frenchPatterns = /[àâäéèêëïîôùûüÿçœæ]|(?:^|\s)(?:le|la|les|de|du|des|un|une|pour|avec|sur|dans|par|en|et|ou|qui|que|ce|cette|mon|ton|son|votre|notre|leur)\s/i;
        const isFr = language === 'fr' || frenchPatterns.test(title);
        
        const priceText = price > 0 ? `${price} ${currency || 'XOF'}` : (isFr ? 'Gratuit' : 'Free');

        const productTypeLabels: Record<string, string> = {
          pdf: 'PDF / Document',
          ebook: 'eBook / Livre numérique',
          video: 'Formation vidéo',
          audio: 'Audio / Podcast',
          course: 'Formation en ligne',
          template: 'Template / Modèle',
          software: 'Logiciel / App',
        };

        const typeLabel = productTypeLabels[product_type] || product_type;

        const systemPrompt = isFr
          ? `Tu es un COPYWRITER d'élite spécialisé en produits numériques africains. Tu DOIS écrire UNIQUEMENT en français. JAMAIS un seul mot en anglais.`
          : `You are an elite COPYWRITER for digital products. Write ONLY in English.`;

        const prompt = isFr
          ? `Rédige une description de vente PROFESSIONNELLE et COMPLÈTE en HTML pour ce produit numérique.

PRODUIT:
- Titre : "${title}"
- Type : ${typeLabel}
- Prix : ${priceText}
${existing_description ? `- Description existante (à améliorer) : ${existing_description.slice(0, 500)}` : ''}

STRUCTURE OBLIGATOIRE (HTML uniquement, PAS de markdown) :

1. <p> ACCROCHE — Une phrase choc qui parle au lecteur. Identifie son problème ou désir profond. Commence par une question percutante ou une affirmation audacieuse.

2. <p> PROMESSE — Ce que le lecteur va concrètement obtenir grâce à ce produit. Sois spécifique.

3. <ul><li> BÉNÉFICES — 4 à 6 bénéfices concrets avec <strong> sur les mots clés. Chaque bénéfice = un résultat tangible.

4. <p> CRÉDIBILITÉ — Pourquoi ce produit est différent/meilleur. Expertise, résultats, méthode unique.

5. <p> APPEL À L'ACTION — Phrase finale qui pousse à l'achat. Crée l'urgence ou montre la valeur.

RÈGLES ABSOLUES :
- TOUT en français, JAMAIS d'anglais
- HTML propre : <p>, <strong>, <em>, <ul>, <li>
- 2-3 emojis bien placés (pas au début)
- 200-350 mots, texte COMPLET du début à la fin
- Ne commence JAMAIS par "Voici..." ou "Découvrez notre..."
- Ne termine JAMAIS au milieu d'une phrase
- Pas de titres H1/H2/H3
- Phrases courtes et percutantes (max 20 mots)`
          : `Write a PROFESSIONAL and COMPLETE HTML sales description for this digital product.

PRODUCT:
- Title: "${title}"
- Type: ${typeLabel}
- Price: ${priceText}
${existing_description ? `- Existing description (to improve): ${existing_description.slice(0, 500)}` : ''}

MANDATORY STRUCTURE (HTML only, NO markdown):

1. <p> HOOK — A punchy sentence addressing the reader's problem or desire.
2. <p> PROMISE — What they'll concretely get from this product.
3. <ul><li> BENEFITS — 4-6 concrete benefits with <strong> on keywords.
4. <p> CREDIBILITY — Why this product is different/better.
5. <p> CALL TO ACTION — Final push to buy.

RULES:
- Clean HTML: <p>, <strong>, <em>, <ul>, <li>
- 2-3 well-placed emojis
- 200-350 words, COMPLETE text
- Never start with "Here is..." or "Discover our..."
- No H1/H2/H3 headings
- Short, punchy sentences`;

        const raw = await aiGenerateText({
          geminiKey: GEMINI_API_KEY,
          model: 'gemini-2.5-flash',
          system: systemPrompt,
          prompt,
          temperature: 0.7,
          maxOutputTokens: 4096,
        });

        // Validate completeness
        const trimmed = raw.trim();
        if (!trimmed || trimmed.length < 80) {
          throw new Error('AI returned insufficient content');
        }

        // Clean markdown artifacts
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

    return jsonResp({ description: result });
  } catch (e: any) {
    if (e?.status === 402) return jsonResp({ error: e.message }, 402);
    console.error('ai-generate-description error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});
