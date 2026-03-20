import { requireAuth, corsHeaders, jsonResp, adminClient } from '../_shared/auth.ts';
import { consumeCreditsWithRefund, normalizeTier } from '../_shared/credits.ts';
import { aiGenerateText } from '../_shared/ai-fallback.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const { prompt, tone = 'professional', context = 'description', tier, lang = 'fr' } = await req.json();
    const isFr = lang === 'fr';
    if (!prompt || typeof prompt !== 'string') return jsonResp({ error: isFr ? "Le champ 'prompt' est requis." : "'prompt' field is required." }, 400);

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) return jsonResp({ error: 'AI not configured' }, 500);

    const admin = adminClient(auth.supabaseUrl, auth.serviceKey);

    const toneInstructions: Record<string, Record<string, string>> = {
      fr: {
        professional: 'Ton professionnel, clair, structuré. Inspire confiance et expertise.',
        friendly: 'Ton amical, chaleureux, accessible. Crée un lien humain avec le lecteur.',
        inspiring: 'Ton inspirant, motivant, enthousiaste. Donne envie de passer à l\'action.',
        persuasive: 'Ton persuasif, vendeur, convaincant. Transforme le lecteur en acheteur.',
        educational: 'Ton pédagogique, didactique, facile à comprendre. Simplifie les concepts.',
      },
      en: {
        professional: 'Professional, clear, structured tone. Inspires trust and expertise.',
        friendly: 'Warm, friendly, accessible tone. Creates a human connection with the reader.',
        inspiring: 'Inspiring, motivating, enthusiastic tone. Makes people want to take action.',
        persuasive: 'Persuasive, sales-oriented, convincing tone. Turns readers into buyers.',
        educational: 'Educational, didactic, easy-to-understand tone. Simplifies concepts.',
      },
    };

    const contextLabels: Record<string, Record<string, string>> = {
      fr: {
        description: 'une description de produit numérique (ebook, guide, formation)',
        campaign: 'une description de campagne de dons/financement',
        announcement: 'une annonce ou communication officielle',
        bio: 'une biographie ou présentation d\'auteur/créateur',
      },
      en: {
        description: 'a digital product description (ebook, guide, course)',
        campaign: 'a fundraising/donation campaign description',
        announcement: 'an official announcement or communication',
        bio: 'an author/creator biography or introduction',
      },
    };

    const l = isFr ? 'fr' : 'en';
    const toneText = toneInstructions[l]?.[tone] || toneInstructions[l]?.professional || toneInstructions.fr.professional;
    const contextText = contextLabels[l]?.[context] || contextLabels[l]?.description || contextLabels.fr.description;

    const systemPrompt = isFr
      ? `Tu es un COPYWRITER d'élite, expert en marketing digital et en conversion. Tu travailles pour une plateforme africaine de vente de produits numériques (ebooks, guides, formations, audio).

## TA MISSION
Rédiger ${contextText} qui VEND. Chaque mot doit justifier sa présence.

## TON
${toneText}

## STRUCTURE OBLIGATOIRE (HTML)
Tu DOIS produire un texte HTML complet et bien structuré suivant ce schéma :

1. **ACCROCHE** (1 paragraphe <p>) — Une phrase choc qui identifie le problème ou le désir du lecteur.
2. **PROMESSE** (1 paragraphe <p>) — Ce que le lecteur va obtenir. Sois spécifique et concret.
3. **CONTENU / BÉNÉFICES** — Liste de 4-6 bénéfices clés avec <strong>. Utilise <ul><li> ou paragraphes courts.
4. **PREUVE / CRÉDIBILITÉ** (1 paragraphe <p>) — Pourquoi ce produit est différent/meilleur.
5. **APPEL À L'ACTION** (1 paragraphe <p>) — Phrase finale qui pousse à l'achat.

## RÈGLES ABSOLUES
- Rédige UNIQUEMENT en français
- Format HTML PROPRE : <p>, <strong>, <em>, <ul>, <li>, <br>. JAMAIS de markdown.
- Phrases courtes et percutantes (max 20 mots par phrase)
- 2-3 emojis maximum, bien placés (pas en début de texte)
- Entre 200 et 400 mots — COMPLET, pas tronqué
- NE commence JAMAIS par "Voici..." ou "Découvrez notre..."
- NE termine JAMAIS au milieu d'une phrase
- Chaque paragraphe doit être fermé proprement
- Le texte doit être AUTONOME et COMPLET du début à la fin`
      : `You are an ELITE COPYWRITER, expert in digital marketing and conversion. You work for an African platform selling digital products (ebooks, guides, courses, audio).

## YOUR MISSION
Write ${contextText} that SELLS. Every word must justify its presence.

## TONE
${toneText}

## REQUIRED STRUCTURE (HTML)
You MUST produce a complete, well-structured HTML text following this schema:

1. **HOOK** (1 paragraph <p>) — A bold opening that identifies the reader's problem or desire.
2. **PROMISE** (1 paragraph <p>) — What the reader will get. Be specific and concrete.
3. **CONTENT / BENEFITS** — List of 4-6 key benefits with <strong>. Use <ul><li> or short paragraphs.
4. **PROOF / CREDIBILITY** (1 paragraph <p>) — Why this product is different/better.
5. **CALL TO ACTION** (1 paragraph <p>) — Final sentence that drives the purchase.

## ABSOLUTE RULES
- Write ONLY in English
- Clean HTML format: <p>, <strong>, <em>, <ul>, <li>, <br>. NEVER markdown.
- Short, punchy sentences (max 20 words per sentence)
- 2-3 emojis maximum, well-placed (not at the start)
- Between 200 and 400 words — COMPLETE, not truncated
- NEVER start with "Here is..." or "Discover our..."
- NEVER end mid-sentence
- Every paragraph must be properly closed
- Text must be SELF-CONTAINED and COMPLETE from start to finish`;

    const content = await consumeCreditsWithRefund({
      admin,
      userId: auth.userId,
      actionKey: 'write_content',
      tier: normalizeTier(tier),
      action: async () => {
        const raw = await aiGenerateText({
          geminiKey: GEMINI_API_KEY,
          model: 'gemini-2.5-flash',
          system: systemPrompt,
          prompt: `Rédige le texte pour : "${prompt}"`,
          maxOutputTokens: 4096,
          temperature: 0.7,
        });

        // Validate completeness — check for truncation indicators
        const trimmed = raw.trim();
        if (!trimmed || trimmed.length < 50) {
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

        // Ensure all tags are closed properly
        // Fix common truncation: unclosed <p> tags
        const openP = (cleaned.match(/<p[\s>]/gi) || []).length;
        const closeP = (cleaned.match(/<\/p>/gi) || []).length;
        if (openP > closeP) {
          cleaned += '</p>'.repeat(openP - closeP);
        }

        const openUl = (cleaned.match(/<ul[\s>]/gi) || []).length;
        const closeUl = (cleaned.match(/<\/ul>/gi) || []).length;
        if (openUl > closeUl) {
          cleaned += '</ul>'.repeat(openUl - closeUl);
        }

        return cleaned;
      },
    });

    return jsonResp({ content });
  } catch (e: any) {
    if (e?.status === 402) return jsonResp({ error: e.message }, 402);
    if (e?.status === 429) return jsonResp({ error: 'Trop de requêtes. Réessayez.' }, 429);
    console.error('ai-write-content error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Erreur interne.' }, 500);
  }
});
