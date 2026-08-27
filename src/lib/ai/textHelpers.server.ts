// Server-only AI text helpers. Ported from the suggest-titles, suggest-subtitles,
// ai-generate-description, ai-write-content and ai-translate-product edge functions.
import { aiGenerateText, extractJson } from './providers.server';
import { consumeCreditsWithRefund, normalizeTier } from '@/lib/credits/credits.server';

function geminiKey(): string {
  const key = process.env['GEMINI_API_KEY'];
  if (!key) throw new Error('AI not configured');
  return key;
}

async function admin() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin as any;
}

function cleanList(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .slice(0, 3)
    .map((t: any) =>
      String(t)
        .replace(/\(\?:[^)]*\)/g, '')
        .replace(/[|[\]{}()*+?\\^$]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim(),
    )
    .filter((t) => t.length > 2);
}

function cleanHtml(raw: string, minLength: number): string {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length < minLength) throw new Error('AI returned insufficient content');

  let cleaned = trimmed
    .replace(/^```html\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^\s*---\s*/g, '')
    .replace(/\s*---\s*$/g, '');

  const openP = (cleaned.match(/<p[\s>]/gi) || []).length;
  const closeP = (cleaned.match(/<\/p>/gi) || []).length;
  if (openP > closeP) cleaned += '</p>'.repeat(openP - closeP);
  const openUl = (cleaned.match(/<ul[\s>]/gi) || []).length;
  const closeUl = (cleaned.match(/<\/ul>/gi) || []).length;
  if (openUl > closeUl) cleaned += '</ul>'.repeat(openUl - closeUl);

  return cleaned;
}

const SUPPORTED = ['en', 'es', 'pt', 'de', 'sw'];

export async function suggestTitles(
  userId: string,
  input: { topic: string; style?: string; audience?: string; language?: string; tier?: unknown },
): Promise<string[]> {
  const key = geminiKey();
  const db = await admin();
  return consumeCreditsWithRefund({
    admin: db,
    userId,
    actionKey: 'suggest_titles',
    tier: normalizeTier(input.tier),
    action: async () => {
      const lang = SUPPORTED.includes(String(input.language)) ? String(input.language) : 'fr';
      const prompt =
        lang === 'fr'
          ? `Propose exactement 3 titres percutants, créatifs et vendeurs pour un livre.\n\nSujet : "${input.topic}"\nStyle : ${input.style || 'ebook'}\nPublic : ${input.audience || 'général'}\n\nRègles :\n- Titres courts (3-8 mots max)\n- Percutants, mémorables\n- Variés : un provocateur, un promesse claire, un intrigant\n- En français correct et naturel\n- INTERDIT : regex, caractères spéciaux comme (?:), |, [], (), *, +\n- Chaque titre doit être du texte lisible par un humain\n\nRetourne UNIQUEMENT : {"titles": ["Titre 1", "Titre 2", "Titre 3"]}`
          : `Suggest exactly 3 punchy, creative, marketable titles for a book.\n\nTopic: "${input.topic}"\nStyle: ${input.style || 'ebook'}\nAudience: ${input.audience || 'general'}\n\nRules:\n- Short (3-8 words)\n- Varied: one provocative, one clear promise, one intriguing\n- In ${lang}\n- FORBIDDEN: regex patterns, special characters like (?:), |, [], (), *, +\n- Each title must be clean, human-readable text\n\nReturn ONLY: {"titles": ["Title 1", "Title 2", "Title 3"]}`;

      const raw = await aiGenerateText({
        geminiKey: key,
        model: 'gemini-2.5-flash-lite',
        system:
          'You are a professional book title creator. Return ONLY valid JSON. No markdown, no code fences. Every title must be clean human-readable text with no regex, no special syntax, no programming patterns.',
        prompt,
      });

      const clean = cleanList(extractJson(raw)?.titles);
      if (clean.length > 0) return clean;
      throw new Error('Failed to parse titles');
    },
  });
}

export async function suggestSubtitles(
  userId: string,
  input: {
    title?: string;
    topic?: string;
    style?: string;
    audience?: string;
    language?: string;
    tier?: unknown;
  },
): Promise<string[]> {
  const key = geminiKey();
  const db = await admin();
  return consumeCreditsWithRefund({
    admin: db,
    userId,
    actionKey: 'suggest_titles',
    tier: normalizeTier(input.tier),
    action: async () => {
      const lang = SUPPORTED.includes(String(input.language)) ? String(input.language) : 'fr';
      const prompt =
        lang === 'fr'
          ? `Propose exactement 3 sous-titres percutants pour un livre.\n\nTitre : "${input.title}"\nSujet : "${input.topic || ''}"\nStyle : ${input.style || 'ebook'}\nPublic : ${input.audience || 'général'}\n\nRègles :\n- Sous-titres complémentaires au titre (5-12 mots)\n- Qui clarifient la promesse du livre\n- Variés : un descriptif, un émotionnel, un orienté bénéfice\n- En français correct et naturel\n- INTERDIT : regex, caractères spéciaux comme (?:), |, [], (), *, +\n- Chaque sous-titre doit être du texte lisible par un humain\n\nRetourne UNIQUEMENT : {"subtitles": ["Sous-titre 1", "Sous-titre 2", "Sous-titre 3"]}`
          : `Suggest exactly 3 compelling subtitles for a book.\n\nTitle: "${input.title}"\nTopic: "${input.topic || ''}"\nStyle: ${input.style || 'ebook'}\nAudience: ${input.audience || 'general'}\n\nRules:\n- Complementary to the title (5-12 words)\n- Clarify the book's promise\n- Varied: one descriptive, one emotional, one benefit-oriented\n- In ${lang}\n- FORBIDDEN: regex patterns, special characters like (?:), |, [], (), *, +\n- Each subtitle must be clean, human-readable text\n\nReturn ONLY: {"subtitles": ["Subtitle 1", "Subtitle 2", "Subtitle 3"]}`;

      const raw = await aiGenerateText({
        geminiKey: key,
        model: 'gemini-2.5-flash-lite',
        system:
          'You are a professional book subtitle creator. Return ONLY valid JSON. No markdown, no code fences. Every subtitle must be clean human-readable text with no regex, no special syntax, no programming patterns.',
        prompt,
      });

      const clean = cleanList(extractJson(raw)?.subtitles);
      if (clean.length > 0) return clean;
      throw new Error('Failed to parse subtitles');
    },
  });
}

/** Detect the most likely language from a text string. */
function detectLanguage(text: string): string {
  const t = text.toLowerCase();
  const fr =
    /[àâäéèêëïîôùûüÿçœæ]|(?:^|\s)(?:le|la|les|des|du|une?|pour|avec|sur|dans|par|est|sont|qui|que|cette?|mon|ton|son|votre|notre|leur|mais|aussi|très|comment|pourquoi)\s/i;
  const es =
    /[áéíóúñ¿¡]|(?:^|\s)(?:el|los|las|del|una?|para|con|sobre|por|está|son|cómo|qué|pero|también|muy)\s/i;
  const pt =
    /[ãõç]|(?:^|\s)(?:o|os|as|do|da|um|uma|para|com|sobre|por|está|são|como|mas|também|muito)\s/i;
  const de = /[äöüß]|(?:^|\s)(?:der|die|das|ein|eine|für|mit|auf|ist|sind|wie|aber|auch|sehr)\s/i;
  const sw = /(?:^|\s)(?:wa|ya|na|kwa|ni|za|la|katika|kuhusu|jinsi|lakini|pia|sana)\s/i;

  const scores: Record<string, number> = { fr: 0, es: 0, pt: 0, de: 0, sw: 0 };
  if (fr.test(t)) scores['fr'] += 2;
  if (es.test(t)) scores['es'] += 2;
  if (pt.test(t)) scores['pt'] += 2;
  if (de.test(t)) scores['de'] += 2;
  if (sw.test(t)) scores['sw'] += 2;

  scores['fr'] += (t.match(/[éèêëàâçùû]/g) || []).length;
  scores['es'] += (t.match(/[áéíóúñ]/g) || []).length;
  scores['pt'] += (t.match(/[ãõ]/g) || []).length;
  scores['de'] += (t.match(/[äöüß]/g) || []).length;

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]!;
  if (best[1] >= 2) return best[0];
  return 'en';
}

export async function generateDescription(
  userId: string,
  input: {
    title: string;
    product_type?: string;
    price?: number;
    currency?: string;
    language?: string;
    tier?: unknown;
    existing_description?: string;
    audience?: string;
    tone?: string;
    extra_notes?: string;
  },
): Promise<{ description: string; language: string }> {
  const key = geminiKey();
  const db = await admin();
  const { title, product_type, price, currency, existing_description, audience, tone, extra_notes } =
    input;

  const detectedLang = detectLanguage(`${title} ${existing_description || ''}`);
  const lang = detectedLang || input.language || 'fr';

  const description = await consumeCreditsWithRefund({
    admin: db,
    userId,
    actionKey: 'generate_description',
    tier: normalizeTier(input.tier),
    action: async () => {
      const priceText =
        (price ?? 0) > 0
          ? `${price} ${currency || 'XOF'}`
          : lang === 'fr'
            ? 'Gratuit'
            : lang === 'es'
              ? 'Gratis'
              : 'Free';

      const productTypeLabels: Record<string, Record<string, string>> = {
        fr: { pdf: 'PDF / Document', ebook: 'eBook / Livre numérique', video: 'Formation vidéo', audio: 'Audio / Podcast', course: 'Cours en ligne', template: 'Template', software: 'Logiciel / App' },
        en: { pdf: 'PDF / Document', ebook: 'eBook / Digital Book', video: 'Video Course', audio: 'Audio / Podcast', course: 'Online Course', template: 'Template', software: 'Software / App' },
        es: { pdf: 'PDF / Documento', ebook: 'eBook / Libro digital', video: 'Curso en video', audio: 'Audio / Podcast', course: 'Curso en línea', template: 'Plantilla', software: 'Software / App' },
      };
      const typeLabel =
        (productTypeLabels[lang] || productTypeLabels['en']!)[String(product_type)] ||
        String(product_type);

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

      const instr = langInstructions[lang] || langInstructions['en']!;

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
        geminiKey: key,
        model: 'gemini-2.5-flash-lite',
        system: instr.system,
        prompt,
        temperature: 0.7,
        maxOutputTokens: 4096,
      });

      return cleanHtml(raw, 80);
    },
  });

  return { description, language: lang };
}

export async function writeContent(
  userId: string,
  input: { prompt: string; tone?: string; context?: string; tier?: unknown; lang?: string },
): Promise<string> {
  const key = geminiKey();
  const db = await admin();
  const { prompt, tone = 'professional', context = 'description', lang = 'fr' } = input;
  const isFr = lang === 'fr';

  const toneInstructions: Record<string, Record<string, string>> = {
    fr: {
      professional: 'Ton professionnel, clair, structuré. Inspire confiance et expertise.',
      friendly: 'Ton amical, chaleureux, accessible. Crée un lien humain avec le lecteur.',
      inspiring: "Ton inspirant, motivant, enthousiaste. Donne envie de passer à l'action.",
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
      bio: "une biographie ou présentation d'auteur/créateur",
    },
    en: {
      description: 'a digital product description (ebook, guide, course)',
      campaign: 'a fundraising/donation campaign description',
      announcement: 'an official announcement or communication',
      bio: 'an author/creator biography or introduction',
    },
  };

  const l = isFr ? 'fr' : 'en';
  const toneText =
    toneInstructions[l]?.[tone] ||
    toneInstructions[l]?.['professional'] ||
    toneInstructions['fr']!['professional']!;
  const contextText =
    contextLabels[l]?.[context] ||
    contextLabels[l]?.['description'] ||
    contextLabels['fr']!['description']!;

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

  return consumeCreditsWithRefund({
    admin: db,
    userId,
    actionKey: 'write_content',
    tier: normalizeTier(input.tier),
    action: async () => {
      const raw = await aiGenerateText({
        geminiKey: key,
        model: 'gemini-2.5-flash-lite',
        system: systemPrompt,
        prompt: isFr ? `Rédige le texte pour : "${prompt}"` : `Write the text for: "${prompt}"`,
        maxOutputTokens: 4096,
        temperature: 0.7,
      });
      return cleanHtml(raw, 50);
    },
  });
}

export async function translateProduct(
  userId: string,
  input: {
    org_id: string;
    product_id: string;
    target_language: string;
    fields?: string[];
    tier?: unknown;
  },
): Promise<{
  translated: any;
  target_language: string;
  quality_score: number | null;
  issues_found: string[];
}> {
  const key = geminiKey();
  const db = await admin();
  const { org_id, product_id, target_language, fields } = input;

  const { data: member } = await db
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', org_id)
    .maybeSingle();
  if (!member || !['owner', 'admin', 'editor'].includes(String(member.role))) {
    const err: any = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  const { data: product, error: prodErr } = await db
    .from('digital_products')
    .select('title, description, guarantee_text, faq_json')
    .eq('id', product_id)
    .eq('organization_id', org_id)
    .single();
  if (prodErr || !product) {
    const err: any = new Error('Product not found');
    err.status = 404;
    throw err;
  }

  return consumeCreditsWithRefund({
    admin: db,
    userId,
    actionKey: 'translate_product',
    tier: normalizeTier(input.tier),
    action: async () => {
      const targetLang =
        target_language === 'fr'
          ? 'French'
          : target_language === 'en'
            ? 'English'
            : target_language === 'es'
              ? 'Spanish'
              : target_language;

      const toTranslate: Record<string, string> = {};
      const fieldsToTranslate = fields || ['title', 'description', 'guarantee_text'];
      for (const field of fieldsToTranslate) {
        const val = (product as any)[field];
        if (val && typeof val === 'string' && val.trim()) toTranslate[field] = val;
      }

      let faqItems: any[] = [];
      if (fieldsToTranslate.includes('faq_json') && (product as any).faq_json) {
        faqItems = Array.isArray((product as any).faq_json) ? (product as any).faq_json : [];
      }

      if (Object.keys(toTranslate).length === 0 && faqItems.length === 0) {
        throw new Error('No content to translate');
      }

      const payload = JSON.stringify({
        ...toTranslate,
        ...(faqItems.length > 0
          ? { faq_items: faqItems.map((f) => ({ question: f.question, answer: f.answer })) }
          : {}),
      });

      const pass1Raw = await aiGenerateText({
        geminiKey: key,
        model: 'gemini-2.5-flash-lite',
        system: `You are a professional translator specializing in digital product marketing. Translate the following content to ${targetLang}. Maintain all HTML formatting, marketing tone, and persuasive copywriting style. Return ONLY a JSON object with the same keys.`,
        prompt: payload,
        jsonMode: true,
      });

      const pass1 = extractJson(pass1Raw);
      if (!pass1) throw new Error('Failed to parse initial translation');

      const reviewPayload = JSON.stringify({
        original: JSON.parse(payload),
        translation: pass1,
        target_language: targetLang,
      });

      const pass2Raw = await aiGenerateText({
        geminiKey: key,
        model: 'gemini-2.5-flash-lite',
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
      const qualityScore = pass2?.quality_score ?? null;
      const issuesFound = pass2?.issues_found ?? [];

      await db.from('audit_logs').insert({
        user_id: userId,
        action: 'product.translated',
        resource_type: 'digital_product',
        resource_id: product_id,
        organization_id: org_id,
        metadata: {
          target_language,
          fields_translated: Object.keys(refined),
          quality_score: qualityScore,
          issues_found: issuesFound,
          two_pass: true,
        },
      });

      return {
        translated: refined,
        target_language,
        quality_score: qualityScore,
        issues_found: issuesFound,
      };
    },
  });
}
