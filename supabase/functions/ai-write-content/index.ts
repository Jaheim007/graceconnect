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

    const toneInstructions: Record<string, string> = {
      professional: 'Ton professionnel, clair, structuré. Inspire confiance et expertise.',
      friendly: 'Ton amical, chaleureux, accessible. Crée un lien humain avec le lecteur.',
      inspiring: 'Ton inspirant, motivant, enthousiaste. Donne envie de passer à l\'action.',
      persuasive: 'Ton persuasif, vendeur, convaincant. Transforme le lecteur en acheteur.',
      educational: 'Ton pédagogique, didactique, facile à comprendre. Simplifie les concepts.',
    };

    const contextLabels: Record<string, string> = {
      description: 'une description de produit numérique (ebook, guide, formation)',
      campaign: 'une description de campagne de dons/financement',
      announcement: 'une annonce ou communication officielle',
      bio: 'une biographie ou présentation d\'auteur/créateur',
    };

    const systemPrompt = `Tu es un COPYWRITER d'élite, expert en marketing digital et en conversion. Tu travailles pour une plateforme africaine de vente de produits numériques (ebooks, guides, formations, audio).

## TA MISSION
Rédiger ${contextLabels[context] || contextLabels.description} qui VEND. Chaque mot doit justifier sa présence.

## TON
${toneInstructions[tone] || toneInstructions.professional}

## STRUCTURE OBLIGATOIRE (HTML)
Tu DOIS produire un texte HTML complet et bien structuré suivant ce schéma :

1. **ACCROCHE** (1 paragraphe <p>) — Une phrase choc qui identifie le problème ou le désir du lecteur. Commence par une question percutante ou une affirmation audacieuse.

2. **PROMESSE** (1 paragraphe <p>) — Ce que le lecteur va obtenir. Sois spécifique et concret.

3. **CONTENU / BÉNÉFICES** — Liste de 4-6 bénéfices clés avec <strong> pour les mots importants. Utilise des puces HTML (<ul><li>) ou des paragraphes courts.

4. **PREUVE / CRÉDIBILITÉ** (1 paragraphe <p>) — Pourquoi ce produit est différent/meilleur. Expertise, témoignages, chiffres.

5. **APPEL À L'ACTION** (1 paragraphe <p>) — Phrase finale qui pousse à l'achat. Crée l'urgence ou la rareté.

## RÈGLES ABSOLUES
- Rédige UNIQUEMENT en français
- Format HTML PROPRE : <p>, <strong>, <em>, <ul>, <li>, <br>. JAMAIS de markdown.
- Phrases courtes et percutantes (max 20 mots par phrase)
- 2-3 emojis maximum, bien placés (pas en début de texte)
- Entre 200 et 400 mots — COMPLET, pas tronqué
- NE commence JAMAIS par "Voici..." ou "Découvrez notre..."
- NE termine JAMAIS au milieu d'une phrase
- Chaque paragraphe doit être fermé proprement
- Le texte doit être AUTONOME et COMPLET du début à la fin`;

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
