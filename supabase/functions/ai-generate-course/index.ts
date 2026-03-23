import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResp, requireAuth, adminClient } from '../_shared/auth.ts';
import { consumeCreditsWithRefund, consumeCreditsOrThrow, refundCreditsAsBonus, normalizeTier } from '../_shared/credits.ts';
import { aiGenerateImageBase64 } from '../_shared/ai-fallback.ts';
import { geminiGenerateText } from '../_shared/ai-gemini.ts';

const ACTION_KEY = 'ai_course_structure';
const IMAGE_GEN_CONCURRENCY = 2;
const IMAGE_BUCKET = 'media';
const FUNCTION_HARD_DEADLINE_MS = 150_000;
const IMAGE_MIN_REMAINING_MS = 30_000;
const MAX_COURSE_IMAGES = 5;

function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function imageExtFromMime(mimeType: string): string {
  if (mimeType.includes('jpeg')) return 'jpg';
  if (mimeType.includes('webp')) return 'webp';
  return 'png';
}

function extractCourseJsonCandidate(rawContent: string): string {
  if (!rawContent) return '';

  const codeBlockMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let candidate = codeBlockMatch ? codeBlockMatch[1] : rawContent;
  candidate = candidate
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u0019\u007F]/g, '')
    .trim();

  const start = candidate.indexOf('{');
  if (start >= 0) candidate = candidate.slice(start);

  // DON'T trim at lastIndexOf('}') — truncated payloads need the full tail
  // so closeOpenJsonStructures can properly close them.
  return candidate.trim();
}

function escapeRawNewlinesInStrings(input: string): { value: string; openString: boolean } {
  let out = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      out += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      out += ch;
      inString = !inString;
      continue;
    }

    if (inString && (ch === '\n' || ch === '\r')) {
      out += '\\n';
      if (ch === '\r' && input[i + 1] === '\n') i++;
      continue;
    }

    out += ch;
  }

  return { value: out, openString: inString };
}

function closeOpenJsonStructures(input: string): string {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '{' || ch === '[') {
      stack.push(ch);
      continue;
    }

    if (ch === '}' && stack[stack.length - 1] === '{') {
      stack.pop();
      continue;
    }

    if (ch === ']' && stack[stack.length - 1] === '[') {
      stack.pop();
    }
  }

  return input + stack.reverse().map((token) => (token === '{' ? '}' : ']')).join('');
}

function tryParseCourseJson(rawContent: string): any | null {
  const candidate = extractCourseJsonCandidate(rawContent);
  if (!candidate) return null;

  try {
    return JSON.parse(candidate);
  } catch {
    let repaired = candidate.replace(/,\s*([}\]])/g, '$1').trimEnd();
    const escaped = escapeRawNewlinesInStrings(repaired);
    repaired = escaped.value;

    if (escaped.openString) repaired += '"';
    if (repaired.endsWith('\\')) repaired += '\\';

    repaired = closeOpenJsonStructures(repaired);

    try {
      return JSON.parse(repaired);
    } catch {
      return null;
    }
  }
}

async function repairCourseJsonWithAi(opts: {
  apiKey?: string;
  rawContent: string;
  moduleCount: number;
  language: 'fr' | 'en';
}): Promise<any | null> {
  if (!opts.apiKey || !opts.rawContent?.trim()) return null;

  try {
    const repairedRaw = await geminiGenerateText({
      apiKey: opts.apiKey,
      model: 'gemini-2.5-flash',
      system: `You repair malformed course JSON only. Return ONLY valid JSON. Preserve existing lesson HTML and text whenever possible. If the payload was truncated, complete the unfinished JSON minimally without adding extra fluff. All visible text must stay in ${opts.language === 'fr' ? 'French' : 'English'}. image_prompt fields must stay in English.`,
      prompt: `Repair this malformed course JSON into a valid object with this exact top-level shape: {"course_title":"...","course_description":"...","modules":[{"title":"...","description":"...","emoji":"🎯","lessons":[{"title":"...","content_type":"text","duration_minutes":10,"description":"...","image_prompt":"...","content":"<h2>...</h2>"}]}],"final_assessment":{"title":"...","description":"...","questions":[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]}}. Target up to ${opts.moduleCount} modules. Keep all valid content you can recover, close unfinished HTML tags when obvious, and do not wrap the answer in markdown fences.\n\n${opts.rawContent.slice(0, 120000)}`,
      maxOutputTokens: 12000,
      jsonMode: true,
    });

    return tryParseCourseJson(repairedRaw);
  } catch (error) {
    console.warn('[ai-generate-course] AI JSON repair failed:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const { supabaseUrl, serviceKey, userId } = auth;
    const admin = adminClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { title, description, target_audience, language, tier = 'standard', module_count = 5, generate_images = false, course_goal = 'teach_skill', audience, audience_level = 'intermediate', worldview = 'neutral', pedagogical_style = 'professional', tone = 'professional', depth_level = 'standard', interactivity_level = 'medium' } = body;

    const functionStartedAt = Date.now();
    const remainingBudgetMs = () => FUNCTION_HARD_DEADLINE_MS - (Date.now() - functionStartedAt);

    if (!title?.trim()) return jsonResp({ error: 'Title is required' }, 400);

    const creditTier = normalizeTier(tier);
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!OPENAI_API_KEY && !GEMINI_API_KEY) return jsonResp({ error: 'No AI provider configured' }, 500);

    console.log('[ai-generate-course] Start', {
      userId,
      tier: creditTier,
      module_count,
      generate_images,
      title_len: String(title || '').length,
    });

    // ─── Detect language from prompt (not from interface locale) ───
    // Simple heuristic: check for common French patterns in the title/description
    const textToAnalyze = `${title} ${description || ''}`.toLowerCase();
    const frenchPatterns = /\b(le|la|les|un|une|des|du|de|et|ou|est|sont|pour|dans|avec|sur|par|que|qui|ce|cette|ces|mon|ton|son|nous|vous|ils|elles|créer|comment|apprendre|formation|cours|comprendre|utiliser)\b/g;
    const englishPatterns = /\b(the|a|an|is|are|for|in|with|on|by|that|which|this|my|your|his|our|they|create|how|learn|course|understand|use|what|about)\b/g;
    const frenchMatches = (textToAnalyze.match(frenchPatterns) || []).length;
    const englishMatches = (textToAnalyze.match(englishPatterns) || []).length;
    
    // Use explicit language param as fallback, but prompt language takes priority
    const detectedLang = frenchMatches > englishMatches ? 'fr' : (englishMatches > frenchMatches ? 'en' : (language || 'fr'));
    const isFr = detectedLang === 'fr';

    const result = await consumeCreditsWithRefund({
      admin,
      userId,
      actionKey: ACTION_KEY,
      tier: creditTier,
      idempotencyKey: `course-${userId}-${Date.now()}`,
      metadata: { title, module_count, generate_images, detected_language: detectedLang },
      action: async () => {
        // ─── Target audience (WHO) mapping ───
        const audienceMap: Record<string, string> = {
          general: isFr
            ? 'PUBLIC CIBLE: Grand public. Utilise des exemples universels et accessibles. Évite le jargon spécialisé.'
            : 'TARGET AUDIENCE: General public. Use universal, accessible examples. Avoid specialized jargon.',
          students: isFr
            ? 'PUBLIC CIBLE: Étudiants. Inclus des références académiques, des exercices de mémorisation, et structure le contenu comme un programme universitaire.'
            : 'TARGET AUDIENCE: Students. Include academic references, memorization exercises, and structure content like a university program.',
          professionals: isFr
            ? 'PUBLIC CIBLE: Professionnels. Utilise des exemples du monde de l\'entreprise, des études de cas business, des KPIs et des frameworks professionnels.'
            : 'TARGET AUDIENCE: Professionals. Use corporate examples, business case studies, KPIs and professional frameworks.',
          entrepreneurs: isFr
            ? 'PUBLIC CIBLE: Entrepreneurs. Oriente le contenu vers la croissance, la stratégie, le ROI. Inclus des exemples de startups et de scaling.'
            : 'TARGET AUDIENCE: Entrepreneurs. Orient content toward growth, strategy, ROI. Include startup and scaling examples.',
          teams: isFr
            ? 'PUBLIC CIBLE: Équipes/Employés. Format de formation interne. Inclus des scénarios d\'équipe, des exercices collaboratifs, et des standards de conformité.'
            : 'TARGET AUDIENCE: Teams/Employees. Internal training format. Include team scenarios, collaborative exercises, and compliance standards.',
          creators: isFr
            ? 'PUBLIC CIBLE: Créateurs de contenu. Axe sur la monétisation, le personal branding, la créativité, et les outils de production.'
            : 'TARGET AUDIENCE: Content creators. Focus on monetization, personal branding, creativity, and production tools.',
        };
        const audienceTargetInstruction = audienceMap[audience] || audienceMap.general;

        // ─── Audience level complexity mapping ───
        const audienceLevelMap: Record<string, string> = {
          beginner: isFr
            ? 'NIVEAU: Débutant — Utilise un vocabulaire simple, des analogies du quotidien, et explique chaque concept comme si c\'était la première fois. Pas de jargon technique sans définition.'
            : 'LEVEL: Beginner — Use simple vocabulary, everyday analogies, and explain every concept as if for the first time. No technical jargon without definition.',
          intermediate: isFr
            ? 'NIVEAU: Intermédiaire — Suppose une connaissance de base du sujet. Introduis des concepts plus nuancés avec des exemples concrets.'
            : 'LEVEL: Intermediate — Assume basic knowledge of the subject. Introduce more nuanced concepts with concrete examples.',
          advanced: isFr
            ? 'NIVEAU: Avancé — Suppose une bonne maîtrise. Approfondis avec des analyses critiques, des cas complexes, et des perspectives multiples.'
            : 'LEVEL: Advanced — Assume strong mastery. Deepen with critical analysis, complex cases, and multiple perspectives.',
        };
        const audienceInstruction = audienceLevelMap[audience_level] || audienceLevelMap.intermediate;

        // ─── Worldview-aware content framing (CRITICAL: prevents unwanted religious content) ───
        const worldviewInstructions: Record<string, string> = {
          neutral: isFr
            ? `INSTRUCTION CRITIQUE — CADRE SÉCULIER/NEUTRE: Ce cours est STRICTEMENT séculier. Tu ne dois JAMAIS inclure de versets bibliques, de références coraniques, de prières, de contenu religieux ou spirituel. Même si le sujet pourrait être abordé sous un angle religieux (ex: leadership, mariage, famille), reste STRICTEMENT neutre et professionnel. Cite des experts, chercheurs, auteurs reconnus — PAS de textes sacrés.`
            : `CRITICAL INSTRUCTION — SECULAR/NEUTRAL FRAME: This course is STRICTLY secular. You must NEVER include Bible verses, Quranic references, prayers, religious or spiritual content. Even if the topic could be approached from a religious angle (e.g., leadership, marriage, family), stay STRICTLY neutral and professional. Cite experts, researchers, recognized authors — NOT sacred texts.`,
          christian: isFr
            ? `CADRE CHRÉTIEN: Intègre des versets bibliques pertinents (ex: Jean 3:16, Romains 12:2). Format: <blockquote><strong>📖 [Livre Chapitre:Verset]</strong> — "[Texte du verset]"</blockquote>. Inclus 1-2 références bibliques par leçon. Les explications théologiques doivent soutenir le point d'enseignement.`
            : `CHRISTIAN FRAME: Include relevant Bible verse references (e.g., John 3:16, Romans 12:2). Format: <blockquote><strong>📖 [Book Chapter:Verse]</strong> — "[Verse text]"</blockquote>. Include 1-2 scripture references per lesson. Theological explanations should support the teaching point.`,
          islamic: isFr
            ? `CADRE ISLAMIQUE: Intègre des références du Coran (Sourate + Ayah) et des Hadiths reconnus. Format: <blockquote><strong>📖 [Sourate Nom Ayah:Numéro]</strong> — "[Texte]"</blockquote>. Aligne le contenu avec les enseignements islamiques.`
            : `ISLAMIC FRAME: Include Quran references (Surah + Ayah) and recognized Hadith. Format: <blockquote><strong>📖 [Surah Name Ayah:Number]</strong> — "[Text]"</blockquote>. Align content with Islamic teachings.`,
          interfaith: isFr
            ? `CADRE INTERCONFESSIONNEL: Tu peux inclure des références de différentes traditions spirituelles si pertinent, mais sans favoriser une religion. Reste respectueux et inclusif.`
            : `INTERFAITH FRAME: You may include references from different spiritual traditions if relevant, but without favoring any religion. Stay respectful and inclusive.`,
        };
        const worldviewInstruction = worldviewInstructions[worldview] || worldviewInstructions.neutral;

        // ─── Pedagogical style mapping ───
        const styleInstructions: Record<string, string> = {
          professional: isFr ? 'Ton professionnel et structuré. Vocabulaire d\'entreprise.' : 'Professional, structured tone. Business vocabulary.',
          academic: isFr ? 'Ton académique rigoureux. Citations et théories.' : 'Rigorous academic tone. Citations and theories.',
          conversational: isFr ? 'Ton amical et conversationnel. Tutoiement.' : 'Friendly, conversational tone. Direct address.',
          motivational: isFr ? 'Ton motivant et inspirant. Énergie positive.' : 'Motivational, inspiring tone. Positive energy.',
          practical: isFr ? 'Ton pratique et orienté action. Exemples concrets.' : 'Practical, action-oriented tone. Concrete examples.',
          storytelling: isFr ? 'Ton narratif. Utilise des histoires et anecdotes.' : 'Narrative tone. Use stories and anecdotes.',
        };
        const styleInstruction = styleInstructions[pedagogical_style] || styleInstructions.professional;

        // ─── Depth level mapping ───
        const depthInstructions: Record<string, string> = {
          lightweight: isFr ? 'Contenu léger: 3-4 sections par leçon, 50-80 mots par section. Microlearning rapide.' : 'Lightweight: 3-4 sections per lesson, 50-80 words per section. Quick microlearning.',
          standard: isFr ? 'Contenu standard: 5-7 sections par leçon, 80-150 mots par section. Chaque leçon doit atteindre au minimum 600 mots au total.' : 'Standard: 5-7 sections per lesson, 80-150 words per section. Each lesson MUST reach at least 600 words total.',
          detailed: isFr ? 'Contenu détaillé: 7-9 sections par leçon, 120-200 mots par section. Exemples approfondis, études de cas. Minimum 900 mots par leçon.' : 'Detailed: 7-9 sections per lesson, 120-200 words per section. In-depth examples, case studies. Minimum 900 words per lesson.',
          masterclass: isFr ? 'Contenu masterclass: 9-12 sections par leçon, 150-250 mots par section. Études de cas complètes, frameworks, analyses critiques. Minimum 1200 mots par leçon.' : 'Masterclass: 9-12 sections per lesson, 150-250 words per section. Full case studies, frameworks, critical analysis. Minimum 1200 words per lesson.',
        };
        const depthInstruction = depthInstructions[depth_level] || depthInstructions.standard;

        // ─── Interactivity level mapping ───
        const interactivityInstructions: Record<string, string> = {
          low: 'Include 1 quiz per module only. No flashcards, matching, or ordering exercises.',
          medium: 'Include 1-2 quizzes per lesson, 1 flashcard per lesson, 1 matching per module.',
          high: 'Include 2 quizzes per lesson, 1 flashcard per lesson, 1 matching per module, 1 ordering per module, 1 fill-in-blank per module. Maximum engagement.',
        };
        const interactivityInstruction = interactivityInstructions[interactivity_level] || interactivityInstructions.medium;

        // ─── Course goal mapping ───
        const goalInstructions: Record<string, string> = {
          sell: isFr
            ? 'OBJECTIF: Vendre un produit/service. Structure le cours comme un entonnoir éducatif: démontre l\'expertise, résous un problème concret, et inclus des appels à l\'action subtils. Chaque module doit renforcer la crédibilité et la valeur perçue.'
            : 'GOAL: Sell a product/service. Structure the course as an educational funnel: demonstrate expertise, solve a concrete problem, and include subtle calls to action. Each module should reinforce credibility and perceived value.',
          teach_skill: isFr
            ? 'OBJECTIF: Enseigner une compétence. Priorise la progression pédagogique claire, les exercices pratiques, et la maîtrise mesurable. Le cours doit transformer le niveau de compétence de l\'apprenant.'
            : 'GOAL: Teach a skill. Prioritize clear pedagogical progression, practical exercises, and measurable mastery. The course should transform the learner\'s skill level.',
          train_team: isFr
            ? 'OBJECTIF: Former une équipe. Utilise un format structuré de formation professionnelle avec des objectifs mesurables, des évaluations, des scénarios d\'entreprise, et des standards de conformité. Ton formel et orienté résultats.'
            : 'GOAL: Train a team. Use a structured professional training format with measurable objectives, assessments, business scenarios, and compliance standards. Formal, results-oriented tone.',
          educate: isFr
            ? 'OBJECTIF: Éduquer un public. Rends le contenu accessible et engageant. Utilise des exemples variés, des analogies, et des histoires pour rendre les concepts mémorables.'
            : 'GOAL: Educate an audience. Make content accessible and engaging. Use varied examples, analogies, and stories to make concepts memorable.',
          faith: isFr
            ? 'OBJECTIF: Enseigner la foi/spiritualité. Intègre les enseignements spirituels de manière profonde et respectueuse. Chaque leçon doit nourrir la croissance spirituelle avec des textes sacrés et des réflexions personnelles.'
            : 'GOAL: Teach faith/spirituality. Integrate spiritual teachings deeply and respectfully. Each lesson should nourish spiritual growth with sacred texts and personal reflections.',
          authority: isFr
            ? 'OBJECTIF: Bâtir l\'autorité et la marque personnelle. Positionne le créateur comme expert. Inclus des insights exclusifs, des frameworks originaux, et des perspectives uniques qui démontrent une expertise profonde.'
            : 'GOAL: Build authority/personal brand. Position the creator as an expert. Include exclusive insights, original frameworks, and unique perspectives that demonstrate deep expertise.',
        };
        const goalInstruction = goalInstructions[course_goal] || goalInstructions.teach_skill;

        // ─── Tone mapping ───
        const toneInstructions: Record<string, string> = {
          professional: isFr ? 'Ton professionnel et structuré.' : 'Professional, structured tone.',
          friendly: isFr ? 'Ton amical, chaleureux et accessible.' : 'Friendly, warm and accessible tone.',
          motivational: isFr ? 'Ton motivant, inspirant et énergique.' : 'Motivational, inspiring and energetic tone.',
          academic: isFr ? 'Ton académique rigoureux avec citations.' : 'Rigorous academic tone with citations.',
          conversational: isFr ? 'Ton conversationnel et direct. Tutoiement.' : 'Conversational, direct tone.',
        };
        const toneInstruction = toneInstructions[tone] || toneInstructions.professional;

        const systemPrompt = `You are an ELITE INSTRUCTIONAL DESIGNER and PROFESSIONAL COURSE ARCHITECT.

CRITICAL: ALL content MUST be written in ${isFr ? 'FRENCH (Français)' : 'ENGLISH'}.

## COURSE GOAL (PRIMARY DIRECTIVE)
${goalInstruction}

## TARGET AUDIENCE (WHO THIS COURSE IS FOR)
${audienceTargetInstruction}

## DIFFICULTY LEVEL
${audienceInstruction}

## CONTENT FRAME (MANDATORY — DO NOT IGNORE)
${worldviewInstruction}

## PEDAGOGICAL STYLE
${styleInstruction}

## TONE
${toneInstruction}

## CONTENT DEPTH
${depthInstruction}

## INTERACTIVITY LEVEL
${interactivityInstruction}

Return ONLY valid JSON with this exact structure:
{
  "course_title": "A compelling marketing-ready title for the course in ${isFr ? 'French' : 'English'}",
  "course_description": "A professional 2-3 sentence marketing description in ${isFr ? 'French' : 'English'}",
  "modules": [
    {
      "title": "Module title",
      "description": "Brief module description (1-2 sentences explaining the learning objective)",
      "emoji": "🎯",
      "lessons": [
        {
          "title": "Lesson title",
          "content_type": "text",
          "duration_minutes": 10,
          "description": "Brief lesson description",
          "image_prompt": "A vivid English description for AI image generation: professional illustration showing [specific scene related to lesson content], modern flat design style, educational context",
          "content": "FULL HTML LESSON CONTENT (see structure below)"
        }
      ]
    }
  ],
  "final_assessment": {
    "title": "${isFr ? 'Évaluation finale' : 'Final Assessment'}",
    "description": "${isFr ? 'Testez vos connaissances sur le cours' : 'Test your knowledge of the entire course'}",
    "questions": [
      {
        "question": "Comprehensive question about the course material?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 2,
        "explanation": "Detailed explanation of why this answer is correct, with reference to lesson content."
      }
    ]
  }
}

## MANDATORY LESSON STRUCTURE (each lesson MUST follow this flow):

### 1. INTRODUCTION (1 paragraph)
<h2>🎯 [Concept Name]</h2>
<p>A compelling hook that explains WHY this concept matters and what the learner will gain. Connect to real-world relevance.</p>

### 2. DETAILED EXPLANATION (2-3 paragraphs with sub-headings)
<h3>💡 [Core Concept]</h3>
<p>Clear, structured explanation with depth. Use <strong>bold</strong> for key terms. Break complex ideas into digestible pieces.</p>
<h3>[Supporting Details]</h3>
<p>Expand with nuances, conditions, or layers of understanding.</p>

### 3. EXAMPLE or CASE STUDY (1-2 paragraphs)
<h3>📋 ${isFr ? 'Exemple pratique' : 'Practical Example'}</h3>
<p>A concrete, relatable example or mini case study that illustrates the concept in action. Make it specific and memorable.</p>

### 4. KEY TAKEAWAYS
<h3>🔑 ${isFr ? 'Points clés' : 'Key Takeaways'}</h3>
<ul><li><strong>[Takeaway 1]</strong> — Brief explanation</li><li><strong>[Takeaway 2]</strong> — Brief explanation</li><li><strong>[Takeaway 3]</strong> — Brief explanation</li></ul>

### 5. REFLECTION QUESTION (optional but encouraged)
<h3>🤔 ${isFr ? 'Question de réflexion' : 'Reflection Question'}</h3>
<p><em>[A thought-provoking question that encourages the learner to apply the concept to their own context]</em></p>

### 6. INTERACTIVE ELEMENTS (embedded after relevant sections)
Quiz, Flashcard, Matching, etc. (see gamification rules below)

## COURSE ARCHITECTURE:
- Create ${module_count} modules following a clear pedagogical progression:
  * Module 1: Foundations & Introduction
  * Module 2-${Math.max(2, module_count - 2)}: Core Concepts (progressive complexity)
  * Module ${Math.max(3, module_count - 1)}: Practical Applications & Case Studies
  * Module ${module_count}: Synthesis, Exercises & Next Steps
- Each module: 2-3 lessons
- Each lesson: 5-15 minutes of reading time
- "course_title" should be a MARKETING-READY title (compelling, concise, professional) — NOT the raw prompt
- "course_description" should be a marketing description explaining what the learner will gain
- "image_prompt" for each lesson should be a vivid description in ENGLISH for AI image generation

## CONTENT DEPTH REQUIREMENTS:
- Each lesson MUST have at least 4-6 HTML sections (h2/h3 headings)
- Include SPECIFIC examples, not generic statements
- Use data points, statistics, or concrete numbers when relevant
- Reference domain-appropriate authorities (see domain detection above)
- Each section should be 50-120 words (richer than a summary, digestible for mobile)

## SLIDE COMPATIBILITY:
- Each h2/h3 section doubles as a potential slide
- Include a "🔑 ${isFr ? 'Points clés' : 'Key Takeaways'}" section per lesson (bullet-point highlights ideal for slide summaries)
- Keep individual sections self-contained so they can be displayed as standalone slides

## GAMIFICATION & INTERACTIVE ELEMENTS:
- QUIZ: 1-2 per lesson: <!-- QUIZ:{"question":"...","options":["A","B","C"],"correctIndex":0,"explanation":"..."} -->
- FLASHCARD: 1 per lesson: <!-- FLASHCARD:{"front":"Term or question","back":"Definition or answer"} -->
- MATCHING: 1 per module: <!-- MATCHING:{"pairs":[{"left":"Term","right":"Definition"},{"left":"Term2","right":"Definition2"}]} --> (min 3 pairs)
- ORDERING: optional: <!-- ORDERING:{"instruction":"...","items":["Step 1","Step 2","Step 3"],"correctOrder":[0,1,2]} -->
- FILL-IN-BLANK: 1 per module: <!-- FILLINBLANK:{"sentence":"The ___ is key","answer":"word","hint":"hint","acceptableAnswers":["alt"]} -->
- Place interactive elements AFTER the content they test
- Each quiz: 3-4 options, one correct (correctIndex 0-based)

## FINAL ASSESSMENT:
- 8-10 comprehensive multiple-choice questions covering ALL modules
- Questions should test understanding AND application, not just memorization
- Each question MUST have exactly 4 options
- Mix difficulty: 30% easy, 40% medium, 30% hard
- Include scenario-based questions that require applying learned concepts

## CONTENT STYLE:
- ALL text in ${isFr ? 'FRENCH' : 'ENGLISH'}
- HTML only: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <blockquote>, <strong>, <em>. NO markdown.
- Tone: authoritative yet conversational and motivating
- Use emojis sparingly in headings (🎯, 💡, 🔑, ⚡, 📋, 🤔, 📖)
- The quiz JSON must be valid JSON inside the HTML comment`;


        const userPrompt = `Design a PROFESSIONAL, IN-DEPTH course as an expert instructional designer:

COURSE TOPIC: ${title}
${description ? `ADDITIONAL CONTEXT: ${description}` : ''}
${target_audience ? `TARGET AUDIENCE: ${target_audience}` : ''}
AUDIENCE LEVEL: ${audience_level}
NUMBER OF MODULES: ${module_count}

MANDATORY REQUIREMENTS:
- Write ALL content in ${isFr ? 'FRENCH (Français)' : 'ENGLISH'} — the user's prompt is in ${isFr ? 'French' : 'English'}.
- Generate a compelling "course_title" (marketing-ready) and "course_description" (2-3 sentences).
- For each lesson include an "image_prompt" in English for AI image generation.
- Each lesson MUST follow the full structure: Introduction → Detailed Explanation → Example/Case Study → Key Takeaways → Reflection Question → Interactive elements.
- DETECT THE DOMAIN and include appropriate references (Bible verses for Christian topics, Qur'an for Islamic topics, expert citations for academic topics, frameworks for business topics).
- Include a final_assessment with 8-10 comprehensive questions.
- Each lesson should have 4-6 sections with substantive content (50-120 words per section).
- Return ONLY valid JSON with no markdown fences.
- 2-3 lessons per module, each with rich pedagogical content.
- Make it feel like a professional training program — deep, structured, and actionable.`;

        const openaiModel = creditTier === 'premium' && !generate_images
          ? 'gpt-4o'
          : 'gpt-4o-mini';
        const geminiModel = creditTier === 'premium'
          ? 'gemini-2.5-pro'
          : 'gemini-2.5-flash';

        const requestCourseCompletion = async (promptText: string, maxTokens: number, preferredTimeoutMs: number) => {
          const budgetMs = remainingBudgetMs();
          const safeTimeoutMs = Math.min(preferredTimeoutMs, Math.max(15_000, budgetMs - 8_000));
          if (safeTimeoutMs <= 15_000) {
            const err = new Error('Server timeout budget reached. Please retry with a shorter prompt.');
            (err as any).status = 504;
            throw err;
          }

          const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: promptText },
          ];

          // TEXT: Gemini FIRST (cheaper), OpenAI fallback
          const providers = [
            {
              name: 'Gemini',
              isAvailable: () => Boolean(GEMINI_API_KEY),
              generate: async () => {
                const content = await geminiGenerateText({
                  apiKey: GEMINI_API_KEY!,
                  model: geminiModel,
                  system: systemPrompt,
                  prompt: promptText,
                  maxOutputTokens: maxTokens,
                  jsonMode: true,
                });

                return {
                  choices: [
                    {
                      message: {
                        content,
                      },
                    },
                  ],
                };
              },
            },
            {
              name: 'OpenAI',
              isAvailable: () => Boolean(OPENAI_API_KEY),
              generate: async () => {
                const aiController = new AbortController();
                const aiTimeout = setTimeout(() => aiController.abort(), safeTimeoutMs);
                try {
                  const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${OPENAI_API_KEY}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      model: openaiModel,
                      max_tokens: maxTokens,
                      messages,
                    }),
                    signal: aiController.signal,
                  });

                  if (!aiResponse.ok) {
                    const errText = await aiResponse.text();
                    const err = new Error('OpenAI request failed');
                    (err as any).status = aiResponse.status;
                    (err as any).detail = errText;
                    throw err;
                  }

                  return await aiResponse.json();
                } finally {
                  clearTimeout(aiTimeout);
                }
              },
            },
          ];

          let lastError: any = null;

          for (const provider of providers) {
            if (!provider.isAvailable()) {
              console.warn(`[ai-generate-course] Skipping ${provider.name}: no API key`);
              continue;
            }

            try {
              console.log(`[ai-generate-course] Trying ${provider.name}`);
              const aiData = await provider.generate();
              console.log(`[ai-generate-course] Success with ${provider.name}`);
              return aiData;
            } catch (fetchErr: any) {
              const status = Number(fetchErr?.status || 0);
              const detail = String(fetchErr?.detail || fetchErr?.message || '').toLowerCase();
              console.error(`[ai-generate-course] ${provider.name} error:`, status, fetchErr?.detail || fetchErr?.message || fetchErr);

              if (fetchErr?.name === 'AbortError') {
                const err = new Error('AI generation timed out. Please retry.');
                (err as any).status = 504;
                throw err;
              }

              const shouldFallback = status === 429 || status >= 500 || detail.includes('insufficient_quota') || detail.includes('quota');
              if (shouldFallback) {
                console.warn(`[ai-generate-course] ${provider.name} unavailable/quota hit, trying fallback...`);
                lastError = fetchErr;
                continue;
              }

              if (status === 402) {
                const err = new Error('AI credits exhausted');
                (err as any).status = 402;
                throw err;
              }

              throw fetchErr;
            }
          }

          if (lastError) throw lastError;
          throw new Error('No AI provider available');
        };

        const aiData = await requestCourseCompletion(userPrompt, 30_000, 120_000);
        const content = aiData.choices?.[0]?.message?.content || '';

        let parsed: any = tryParseCourseJson(content);

        if (!parsed) {
          console.warn('[ai-generate-course] Primary output malformed, attempting AI JSON repair');
          parsed = await repairCourseJsonWithAi({
            apiKey: GEMINI_API_KEY || undefined,
            rawContent: content,
            moduleCount: module_count,
            language: isFr ? 'fr' : 'en',
          });
        }

        if (!parsed) {
          console.warn('[ai-generate-course] Primary output still invalid, retrying with compact constraints');
          const retryPrompt = `${userPrompt}\n\nRETRY MODE (MANDATORY):\n- Return STRICT valid JSON only.\n- Keep response compact to avoid truncation.\n- EXACTLY 2 lessons per module.\n- EXACTLY 3 sections per lesson (Introduction, Core Content, Key Takeaways).\n- EXACTLY 1 quiz comment per lesson.\n- EXACTLY 6 final assessment questions.\n- Still include domain-appropriate references where relevant.`;
          const retryData = await requestCourseCompletion(retryPrompt, 8_000, 50_000);
          const retryContent = retryData.choices?.[0]?.message?.content || '';
          parsed = tryParseCourseJson(retryContent);

          if (!parsed) {
            console.warn('[ai-generate-course] Compact retry malformed, attempting AI JSON repair');
            parsed = await repairCourseJsonWithAi({
              apiKey: GEMINI_API_KEY || undefined,
              rawContent: retryContent || content,
              moduleCount: module_count,
              language: isFr ? 'fr' : 'en',
            });
          }

          if (!parsed) {
            const jsonPreview = (retryContent || content || '').trim();
            console.error('[ai-generate-course] JSON repair failed. First 500 chars:', jsonPreview.slice(0, 500));
            console.error('[ai-generate-course] Last 500 chars:', jsonPreview.slice(-500));
            throw new Error('AI returned malformed JSON that could not be repaired');
          }
        }

        if (!parsed.modules || !Array.isArray(parsed.modules)) {
          throw new Error('Invalid AI response structure');
        }

        return parsed;
      },
    });

    console.log('[ai-generate-course] Structure generated', {
      modules: Array.isArray(result?.modules) ? result.modules.length : 0,
      remaining_budget_ms: remainingBudgetMs(),
    });

    // ─── Image generation (after structure, per lesson) ───
    let imagesGenerated = 0;
    if (generate_images && result?.modules) {
      if (!GEMINI_API_KEY && !OPENAI_API_KEY) {
        console.warn('[ai-generate-course] Skipping lesson images: no AI image provider configured');
      } else {
        const allImageJobs: Array<{ lesson: any; imagePrompt: string }> = [];
        for (const mod of result.modules) {
          for (const lesson of (mod.lessons || [])) {
            if (lesson?.image_prompt) allImageJobs.push({ lesson, imagePrompt: lesson.image_prompt });
          }
        }
        // Limit images to avoid timeout — pick evenly spaced lessons
        const imageJobs = allImageJobs.length <= MAX_COURSE_IMAGES
          ? allImageJobs
          : allImageJobs.filter((_, i) => i % Math.ceil(allImageJobs.length / MAX_COURSE_IMAGES) === 0).slice(0, MAX_COURSE_IMAGES);

        let nextJob = 0;
        let creditsExhausted = false;
        let stopImageGeneration = false;

        const refundImageCredits = async (amount: number) => {
          if (amount <= 0) return;
          try {
            await refundCreditsAsBonus({
              admin,
              userId,
              amount,
              source: 'ai_course_image',
              expiresInDays: 30,
            });
          } catch (_) {
            // no-op
          }
        };

        const worker = async () => {
          while (!creditsExhausted && !stopImageGeneration) {
            if (remainingBudgetMs() <= IMAGE_MIN_REMAINING_MS) {
              console.warn('[ai-generate-course] Skipping remaining image jobs to avoid edge timeout');
              stopImageGeneration = true;
              return;
            }

            const idx = nextJob++;
            if (idx >= imageJobs.length) return;

            const { lesson, imagePrompt } = imageJobs[idx];

            let imgDebited = 0;
            try {
              const debitResult = await consumeCreditsOrThrow({
                admin,
                userId,
                actionKey: 'ai_course_image',
                tier: creditTier,
                metadata: { lesson_title: lesson.title },
              });
              if (!('skipped' in debitResult)) imgDebited = debitResult.debited;
            } catch (e: any) {
              if (e?.status === 402) {
                creditsExhausted = true;
                console.warn(`[ai-generate-course] Credits exhausted for images at lesson "${lesson.title}"`);
                return;
              }
              throw e;
            }

            try {
              const budgetMs = remainingBudgetMs();
              if (budgetMs <= IMAGE_MIN_REMAINING_MS) {
                throw new Error('Not enough time remaining for image generation');
              }

              // Use full fallback chain: Gemini Pro → OpenAI → Gemini Flash
              const imageTimeoutMs = Math.min(30_000, Math.max(10_000, budgetMs - 15_000));
              const { base64, mimeType } = await aiGenerateImageBase64({
                geminiKey: GEMINI_API_KEY || '',
                openaiKey: OPENAI_API_KEY || undefined,
                prompt: `Professional educational illustration: ${imagePrompt}. Clean, modern, flat design style. No text in the image.`,
                timeoutMs: imageTimeoutMs,
              });

              const ext = imageExtFromMime(mimeType);
              const imagePath = `ai/courses/${userId}/${crypto.randomUUID()}.${ext}`;
              const bytes = decodeBase64(base64);

              const { error: uploadErr } = await admin.storage
                .from(IMAGE_BUCKET)
                .upload(imagePath, bytes, { contentType: mimeType, upsert: false });
              if (uploadErr) throw uploadErr;

              const { data: publicUrlData } = admin.storage.from(IMAGE_BUCKET).getPublicUrl(imagePath);
              const imageUrl = publicUrlData?.publicUrl;
              if (!imageUrl) throw new Error('Image upload succeeded but no public URL was returned');

              lesson.content = `<div class="lesson-hero-image"><img src="${imageUrl}" alt="${lesson.title}" loading="lazy" style="width:100%;border-radius:12px;margin-bottom:16px;" /></div>${lesson.content}`;
              imagesGenerated++;
            } catch (imgErr: any) {
              const message = String(imgErr?.message || '');
              const status = Number(imgErr?.status || 0);

              if (message.includes('Not enough time remaining') || imgErr?.name === 'AbortError') {
                console.warn('[ai-generate-course] Time budget reached during image generation, returning partial images');
                stopImageGeneration = true;
                await refundImageCredits(imgDebited);
                return;
              }

              console.error(`[ai-generate-course] Image gen error for "${lesson.title}":`, imgErr);
              await refundImageCredits(imgDebited);

              if (status === 429 || status >= 500) {
                console.warn('[ai-generate-course] Image provider is slow/unavailable, returning partial images');
                stopImageGeneration = true;
                return;
              }
            }
          }
        };

        const workerCount = Math.min(IMAGE_GEN_CONCURRENCY, imageJobs.length || 1);
        await Promise.all(Array.from({ length: workerCount }, () => worker()));
      }
    }

    console.log('[ai-generate-course] Completed', {
      images_generated: imagesGenerated,
      elapsed_ms: Date.now() - functionStartedAt,
      remaining_budget_ms: remainingBudgetMs(),
    });

    return jsonResp({ ok: true, ...result, images_generated: imagesGenerated });
  } catch (err: any) {
    console.error('[ai-generate-course] Error:', err);
    const status = err.status || 500;
    return jsonResp({
      error: err.message || 'Internal error',
      credits_refunded: err.message?.includes('refund') || false,
    }, status);
  }
});
