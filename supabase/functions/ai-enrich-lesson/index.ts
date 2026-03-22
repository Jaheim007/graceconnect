import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResp, requireAuth, adminClient } from '../_shared/auth.ts';
import { consumeCreditsWithRefund, normalizeTier } from '../_shared/credits.ts';
import { geminiGenerateText } from '../_shared/ai-gemini.ts';

const ACTION_KEY = 'ai_lesson_enrich';

type EnrichAction = 'expand' | 'case_study' | 'exercise' | 'advanced' | 'simplify' | 'summary' | 'key_takeaways';

const ACTION_PROMPTS: Record<string, Record<EnrichAction, string>> = {
  fr: {
    expand: `ENRICHIS et APPROFONDIS cette leçon. Ajoute :
- Des explications plus détaillées et nuancées pour chaque concept
- Des sous-sections supplémentaires avec des titres <h3>
- Des données, statistiques ou faits concrets quand pertinent
- Des connexions entre les concepts
- Des paragraphes plus substantiels (100-200 mots par section)
Le résultat doit faire au minimum 1200 mots. Garde la structure existante et enrichis-la.`,

    case_study: `Ajoute une ÉTUDE DE CAS DÉTAILLÉE à cette leçon. Inclus :
- <h2>📋 Étude de cas</h2>
- Le contexte et la situation initiale (entreprise, personne ou organisation réelle ou réaliste)
- Le défi ou problème rencontré
- La solution appliquée en lien avec les concepts de la leçon
- Les résultats obtenus (avec des chiffres concrets)
- <h3>💡 Leçons tirées</h3> avec 3-4 enseignements clés
- L'étude doit faire 400-600 mots et être placée APRÈS le contenu existant.`,

    exercise: `Ajoute un EXERCICE PRATIQUE DÉTAILLÉ à cette leçon. Inclus :
- <h2>🏋️ Exercice pratique</h2>
- Une mise en situation claire et réaliste
- Des instructions étape par étape (numérotées)
- Les outils ou ressources nécessaires
- <h3>✅ Critères de réussite</h3> pour que l'apprenant s'auto-évalue
- <h3>💡 Conseils</h3> pour bien réaliser l'exercice
- L'exercice doit faire 300-500 mots et être placé APRÈS le contenu existant.`,

    advanced: `Ajoute des INSIGHTS AVANCÉS de niveau expert à cette leçon :
- <h2>🎓 Approfondissement expert</h2>
- Nuances et subtilités que seuls les experts connaissent
- Erreurs courantes et pièges à éviter
- Perspectives multiples et débats dans le domaine
- Tendances actuelles et innovations récentes
- Références à des experts, études ou publications reconnues
- Ce contenu doit faire 400-600 mots et être placé APRÈS le contenu existant.`,

    simplify: `RÉÉCRIS cette leçon pour un PUBLIC DÉBUTANT :
- Utilise un vocabulaire simple et accessible
- Remplace le jargon technique par des mots courants (avec définitions si nécessaire)
- Ajoute des analogies du quotidien pour illustrer chaque concept
- Découpe les idées complexes en petites étapes
- Ajoute des exemples concrets et familiers
- Garde le même nombre de sections mais simplifie le langage
- Le résultat doit rester complet (minimum 800 mots).`,

    summary: `Ajoute un RÉSUMÉ STRUCTURÉ à la fin de cette leçon :
- <h2>📝 Résumé de la leçon</h2>
- Un paragraphe récapitulatif de 3-4 phrases
- <h3>🔑 Points essentiels à retenir</h3> avec une liste de 5-7 points clés
- <h3>📋 Checklist d'auto-évaluation</h3> avec 4-5 questions que l'apprenant peut se poser
- <h3>🚀 Pour aller plus loin</h3> avec 2-3 suggestions d'approfondissement
- Place ce résumé APRÈS tout le contenu existant.`,

    key_takeaways: `Ajoute une section POINTS CLÉS ET AIDE-MÉMOIRE :
- <h2>🗂️ Aide-mémoire</h2>
- Un tableau ou liste structurée des concepts clés avec définitions courtes
- <h3>💡 Formules / Règles à retenir</h3> les principes fondamentaux en format mémorisable
- <h3>❓ FAQ rapide</h3> 3-4 questions fréquentes avec réponses courtes
- Place cette section APRÈS tout le contenu existant.`,
  },
  en: {
    expand: `ENRICH and DEEPEN this lesson. Add:
- More detailed and nuanced explanations for each concept
- Additional sub-sections with <h3> headings
- Data, statistics, or concrete facts when relevant
- Connections between concepts
- More substantial paragraphs (100-200 words per section)
The result must be at minimum 1200 words. Keep the existing structure and enrich it.`,

    case_study: `Add a DETAILED CASE STUDY to this lesson. Include:
- <h2>📋 Case Study</h2>
- Context and initial situation (real or realistic company, person, or organization)
- The challenge or problem encountered
- The solution applied, linked to the lesson concepts
- Results obtained (with concrete numbers)
- <h3>💡 Lessons Learned</h3> with 3-4 key takeaways
- The case study should be 400-600 words and placed AFTER existing content.`,

    exercise: `Add a DETAILED PRACTICAL EXERCISE to this lesson. Include:
- <h2>🏋️ Practical Exercise</h2>
- A clear, realistic scenario
- Step-by-step instructions (numbered)
- Required tools or resources
- <h3>✅ Success Criteria</h3> for self-evaluation
- <h3>💡 Tips</h3> for completing the exercise well
- The exercise should be 300-500 words and placed AFTER existing content.`,

    advanced: `Add ADVANCED EXPERT-LEVEL INSIGHTS to this lesson:
- <h2>🎓 Expert Deep Dive</h2>
- Nuances and subtleties that only experts know
- Common mistakes and pitfalls to avoid
- Multiple perspectives and debates in the field
- Current trends and recent innovations
- References to recognized experts, studies, or publications
- This content should be 400-600 words and placed AFTER existing content.`,

    simplify: `REWRITE this lesson for a BEGINNER AUDIENCE:
- Use simple, accessible vocabulary
- Replace technical jargon with common words (with definitions if needed)
- Add everyday analogies to illustrate each concept
- Break complex ideas into small steps
- Add concrete, familiar examples
- Keep the same number of sections but simplify the language
- The result must remain complete (minimum 800 words).`,

    summary: `Add a STRUCTURED SUMMARY at the end of this lesson:
- <h2>📝 Lesson Summary</h2>
- A recap paragraph of 3-4 sentences
- <h3>🔑 Key Points to Remember</h3> with a list of 5-7 key points
- <h3>📋 Self-Assessment Checklist</h3> with 4-5 questions the learner can ask themselves
- <h3>🚀 Going Further</h3> with 2-3 suggestions for deeper learning
- Place this summary AFTER all existing content.`,

    key_takeaways: `Add a KEY POINTS & CHEAT SHEET section:
- <h2>🗂️ Cheat Sheet</h2>
- A structured table or list of key concepts with short definitions
- <h3>💡 Rules / Formulas to Remember</h3> fundamental principles in memorable format
- <h3>❓ Quick FAQ</h3> 3-4 common questions with short answers
- Place this section AFTER all existing content.`,
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const { supabaseUrl, serviceKey, userId } = auth;
    const admin = adminClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { lesson_title, lesson_content, course_title, action, language = 'fr', tier = 'standard', depth_level = 'intermediate' } = body;

    if (!lesson_content?.trim()) return jsonResp({ error: 'Lesson content is required' }, 400);
    if (!action || !ACTION_PROMPTS.en[action as EnrichAction]) {
      return jsonResp({ error: `Invalid action. Valid: ${Object.keys(ACTION_PROMPTS.en).join(', ')}` }, 400);
    }

    const creditTier = normalizeTier(tier);
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) return jsonResp({ error: 'AI not configured' }, 500);

    const isFr = language === 'fr';
    const lang = isFr ? 'fr' : 'en';
    const actionPrompt = ACTION_PROMPTS[lang][action as EnrichAction];

    const result = await consumeCreditsWithRefund({
      admin,
      userId,
      actionKey: ACTION_KEY,
      tier: creditTier,
      idempotencyKey: `enrich-${userId}-${Date.now()}`,
      metadata: { action, lesson_title },
      action: async () => {
        const systemPrompt = `You are an ELITE INSTRUCTIONAL DESIGNER and CONTENT ENRICHMENT SPECIALIST.
You enhance existing course lessons to make them deeper, richer, and more valuable.

CRITICAL RULES:
- Write EXCLUSIVELY in ${isFr ? 'FRENCH' : 'ENGLISH'}
- Output ONLY valid HTML (h2, h3, p, ul, ol, li, blockquote, strong, em, br). NO markdown.
- ${action === 'simplify' || action === 'expand' ? 'Return the COMPLETE rewritten/enriched lesson content.' : 'Return ONLY the NEW content to be APPENDED to the existing lesson.'}
- Maintain the same pedagogical tone and style as the original content
- Be specific, concrete, and actionable — never generic
- Use emojis sparingly in headings only (🎯, 💡, 🔑, ⚡, 📋, 🤔, 📖, 🏋️, 🎓, 📝, 🗂️)`;

        const userPrompt = `COURSE: ${course_title || 'Untitled'}
LESSON: ${lesson_title || 'Untitled'}

CURRENT LESSON CONTENT:
${lesson_content.slice(0, 12000)}

ACTION REQUESTED:
${actionPrompt}`;

        const geminiModel = creditTier === 'premium' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

        const enrichedContent = await geminiGenerateText({
          apiKey: GEMINI_API_KEY,
          model: geminiModel,
          system: systemPrompt,
          prompt: userPrompt,
          maxOutputTokens: 8000,
        });

        // Clean markdown artifacts
        let cleaned = enrichedContent
          .replace(/```html?\s*/gi, '')
          .replace(/```/g, '')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .trim();

        return { enriched_content: cleaned, action, is_replacement: action === 'simplify' || action === 'expand' };
      },
    });

    return jsonResp(result);
  } catch (e: any) {
    console.error('[ai-enrich-lesson] Error:', e);
    if (e?.status === 402) return jsonResp({ error: e.message || 'Credits exhausted' }, 402);
    if (e?.status === 429) return jsonResp({ error: 'Rate limit exceeded' }, 429);
    return jsonResp({ error: e.message || 'Internal error' }, 500);
  }
});
