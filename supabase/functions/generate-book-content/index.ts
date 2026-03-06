import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── Tone instructions by language ───
const toneMap: Record<string, Record<string, string>> = {
  fr: {
    professional: `Ton d'un auteur professionnel chevronné, comme un essayiste du Monde Diplomatique ou de Harvard Business Review. Tu construis une argumentation serrée mais accessible, tu interpelles le lecteur par des questions provocatrices, tu ponctues tes démonstrations d'anecdotes vécues et de cas concrets tirés de la vie réelle. Tu assumes tes opinions avec assurance. Ton style est incisif, jamais fade. Tu varies entre phrases courtes percutantes et développements plus longs et nuancés. Tu n'hésites pas à faire des apartés personnels ("J'ai longtemps cru que...", "Ce qui m'a frappé, c'est...").`,
    conversational: `Ton d'un conteur né qui partage son expérience au coin du feu. Tu tutoies l'intelligence du lecteur sans le noyer dans le jargon. Tu racontes des histoires vraies — les tiennes ou celles de gens que tu as rencontrés. Tu utilises des expressions du quotidien, des métaphores tirées de la vie de tous les jours. Tu interpelles : "Vous voyez ce que je veux dire ?", "Imaginez un instant...". Tes paragraphes respirent, alternent entre réflexion et récit. Tu es chaleureux sans être mièvre, simple sans être simpliste.`,
    humorous: `Ton d'un humoriste cultivé — pense à un mélange entre Terry Pratchett et un chroniqueur de magazine. L'humour est intégré naturellement dans la prose, jamais forcé. Tu utilises l'autodérision, les situations absurdes du quotidien, les exagérations savamment dosées. Tu fais des parallèles inattendus et des comparaisons décalées. L'humour sert le propos — il rend les idées mémorables. Derrière chaque moment drôle, il y a une vérité profonde. Tu n'as pas peur des digressions amusantes si elles enrichissent le texte.`,
    spiritual: `Ton d'un grand guide spirituel — pas un prédicateur qui fait la morale, mais un sage qui partage des révélations intimes. Intègre les Écritures sacrées (versets bibliques avec références livre/chapitre/verset, sourates du Coran, sagesses ancestrales) comme des joyaux dans un écrin de réflexion personnelle. Chaque verset est contextualisé, médité, appliqué à la vie quotidienne du lecteur. Tu partages des témoignages de transformation, des moments de doute suivis d'illumination. Ta prose est à la fois profonde et accessible — elle touche le cœur avant l'intellect. Tu inspires sans culpabiliser, tu défies sans brusquer.`,
    poetic: `Ton d'un écrivain littéraire accompli — ta prose est ciselée comme celle de Khalil Gibran, d'Aimé Césaire ou de Gabriel García Márquez. Tu tisses des métaphores filées qui traversent les paragraphes, tu crées des images sensorielles (odeurs, textures, sons, lumières). Ton rythme varie — phrases brèves et sèches qui claquent, puis longues périodes ondulantes qui bercent. Tu utilises l'anaphore, la gradation, le chiasme naturellement, pas comme des exercices de style mais comme des respirations du texte. Chaque chapitre a sa propre couleur émotionnelle.`,
    academic: `Ton d'un chercheur passionné qui rend la science accessible — pense à Yuval Noah Harari ou Malcolm Gladwell. Tu appuies tes arguments sur des études nommées, des statistiques contextualisées, des théories attribuées à leurs auteurs. Mais tu ne te contentes pas d'empiler les références : tu les mets en perspective, tu les confrontes, tu en tires des conclusions originales. Tu poses des questions que personne ne se pose. Tu structures ta pensée avec rigueur mais tu gardes un souffle narratif. Tu commences souvent par un cas particulier fascinant avant de monter vers la théorie.`,
  },
  en: {
    professional: `Tone of a seasoned professional author, like an essayist from The Atlantic or Harvard Business Review. You build tight but accessible arguments, provoke readers with challenging questions, punctuate demonstrations with lived anecdotes and real-world cases. You own your opinions with confidence. Your style is incisive, never bland. You alternate between punchy short sentences and longer nuanced developments. You make personal asides ("I used to believe...", "What struck me was...").`,
    conversational: `Tone of a born storyteller sharing experience by the fireside. You respect the reader's intelligence without drowning them in jargon. You tell true stories — yours or people you've met. You use everyday expressions and real-life metaphors. You engage: "You know what I mean?", "Picture this for a moment...". Your paragraphs breathe, alternating between reflection and narrative. You're warm without being saccharine, simple without being simplistic.`,
    humorous: `Tone of a cultured humorist — think Terry Pratchett meets a magazine columnist. Humor is woven naturally into the prose, never forced. You use self-deprecation, absurd everyday situations, carefully measured exaggeration. You draw unexpected parallels and quirky comparisons. Humor serves the point — it makes ideas memorable. Behind every funny moment lies a profound truth. You're not afraid of amusing digressions if they enrich the text.`,
    spiritual: `Tone of a great spiritual guide — not a moralizing preacher, but a wise soul sharing intimate revelations. Integrate sacred Scriptures (Bible verses with book/chapter/verse references, Quran surahs, ancestral wisdom) like jewels set in personal reflection. Each verse is contextualized, meditated upon, applied to the reader's daily life. You share transformation testimonies, moments of doubt followed by illumination. Your prose is both deep and accessible — touching the heart before the intellect. You inspire without guilt-tripping, challenge without forcing.`,
    poetic: `Tone of an accomplished literary writer — your prose is crafted like Khalil Gibran, Toni Morrison, or García Márquez. You weave extended metaphors across paragraphs, create sensory imagery (smells, textures, sounds, light). Your rhythm varies — short, dry sentences that crack, then long undulating periods that soothe. You use anaphora, gradation, chiasmus naturally, not as style exercises but as the text's breathing. Each chapter has its own emotional color.`,
    academic: `Tone of a passionate researcher making science accessible — think Yuval Noah Harari or Malcolm Gladwell. You support arguments with named studies, contextualized statistics, theories attributed to their authors. But you don't just stack references: you put them in perspective, confront them, draw original conclusions. You ask questions nobody asks. You structure thought rigorously while maintaining narrative momentum. You often start with a fascinating particular case before building toward theory.`,
  },
  es: {
    professional: `Tono de un autor profesional experimentado. Construyes argumentos sólidos pero accesibles, usas anécdotas reales y casos concretos. Alternas entre frases cortas e impactantes y desarrollos más largos. Haces apartes personales naturalmente.`,
    conversational: `Tono de un narrador nato que comparte su experiencia. Cuentas historias verdaderas con expresiones cotidianas. Interpelas al lector con preguntas y comparaciones de la vida real. Eres cálido sin ser empalagoso.`,
    humorous: `Tono de un humorista culto. El humor está integrado naturalmente: autodescripción, situaciones absurdas cotidianas, exageraciones medidas. Detrás de cada momento divertido hay una verdad profunda.`,
    spiritual: `Tono de un gran guía espiritual que comparte revelaciones íntimas. Integra las Escrituras sagradas como joyas en una reflexión personal profunda. Inspiras sin culpabilizar, desafías sin forzar.`,
    poetic: `Tono de un escritor literario consumado. Prosa cincelada con metáforas, imágenes sensoriales y ritmo variado. Cada capítulo tiene su propio color emocional.`,
    academic: `Tono de un investigador apasionado que hace la ciencia accesible. Apoyas argumentos con estudios, estadísticas y teorías, pero siempre con un hilo narrativo cautivador.`,
  },
  pt: {
    professional: `Tom de um autor profissional experiente. Argumentação sólida mas acessível, anedotas reais, casos concretos. Alternar entre frases curtas impactantes e desenvolvimentos mais longos.`,
    conversational: `Tom de um contador de histórias nato. Histórias verdadeiras com expressões do cotidiano. Interpela o leitor com perguntas e comparações da vida real. Caloroso sem ser piegas.`,
    humorous: `Tom de um humorista culto. Humor integrado naturalmente: autoironia, situações absurdas, exageros medidos. Por trás de cada momento engraçado há uma verdade profunda.`,
    spiritual: `Tom de um grande guia espiritual que compartilha revelações íntimas. Integra as Escrituras como joias em uma reflexão pessoal. Inspira sem culpar, desafia sem forçar.`,
    poetic: `Tom de um escritor literário consumado. Prosa cinzelada com metáforas, imagens sensoriais e ritmo variado.`,
    academic: `Tom de um pesquisador apaixonado que torna a ciência acessível. Estudos, estatísticas e teorias, mas sempre com um fio narrativo cativante.`,
  },
  de: {
    professional: `Ton eines erfahrenen Berufsautors. Solide aber zugängliche Argumentation, reale Anekdoten, konkrete Fälle. Wechsel zwischen kurzen, wirkungsvollen Sätzen und längeren Entwicklungen.`,
    conversational: `Ton eines geborenen Geschichtenerzählers. Wahre Geschichten mit alltäglichen Ausdrücken. Leser ansprechen mit Fragen und Vergleichen aus dem echten Leben.`,
    humorous: `Ton eines kultivierten Humoristen. Natürlich eingewebter Humor: Selbstironie, absurde Alltagssituationen, dosierte Übertreibungen.`,
    spiritual: `Ton eines großen geistlichen Führers, der intime Offenbarungen teilt. Heilige Schriften als Juwelen in persönlicher Reflexion. Inspirieren ohne Schuldgefühle.`,
    poetic: `Ton eines vollendeten literarischen Schriftstellers. Gemeißelte Prosa mit Metaphern, sinnlichen Bildern und variierendem Rhythmus.`,
    academic: `Ton eines leidenschaftlichen Forschers, der Wissenschaft zugänglich macht. Studien, Statistiken und Theorien, aber immer mit fesselndem Erzählfaden.`,
  },
  sw: {
    professional: `Sauti ya mwandishi mtaalamu mwenye uzoefu. Hoja imara lakini inayopatikana, hadithi za kweli, kesi halisi. Badilisha kati ya sentensi fupi zenye athari na maendeleo marefu zaidi.`,
    conversational: `Sauti ya msimulizi wa asili. Hadithi za kweli na maneno ya kila siku. Mshirikishe msomaji na maswali na mfano kutoka maisha halisi.`,
    humorous: `Sauti ya mcheshi mwenye elimu. Ucheshi uliounganishwa kwa kawaida: kujidharau, hali za ajabu za kila siku, kutia chumvi kwa kipimo.`,
    spiritual: `Sauti ya kiongozi mkuu wa kiroho anayeshiriki ufunuo wa karibu. Maandiko matakatifu kama vito katika tafakuri ya kibinafsi.`,
    poetic: `Sauti ya mwandishi wa fasihi aliyekamilika. Nathari iliyochongwa na sitiari, picha za hisi na mdundo tofauti.`,
    academic: `Sauti ya mtafiti mwenye shauku anayefanya sayansi kupatikana. Tafiti, takwimu na nadharia, lakini daima na uzi wa simulizi wa kuvutia.`,
  },
};

// ─── Language level instructions ───
const levelMap: Record<string, Record<string, string>> = {
  fr: {
    simple: `Utilise un vocabulaire simple et des phrases courtes (max 15-20 mots). Le texte doit être compréhensible par un enfant de 12 ans ou un non-natif. Évite le jargon. Explique chaque concept nouveau.`,
    intermediate: `Utilise un vocabulaire courant avec quelques termes spécialisés toujours expliqués entre parenthèses ou par le contexte. Phrases de longueur moyenne. Accessible au grand public éduqué.`,
    advanced: `Utilise un vocabulaire riche, soutenu et varié. Le texte peut inclure des termes techniques, des tournures littéraires élaborées, des néologismes et un style sophistiqué. Pour un lectorat cultivé.`,
  },
  en: {
    simple: `Use simple vocabulary and short sentences (max 15-20 words). Text should be understandable by a 12-year-old or non-native speaker. Avoid jargon. Explain every new concept.`,
    intermediate: `Use common vocabulary with some specialized terms always explained in context. Medium-length sentences. Accessible to the educated general public.`,
    advanced: `Use rich, sophisticated and varied vocabulary. Text can include technical terms, elaborate literary devices, and a polished style. For a well-read audience.`,
  },
  es: {
    simple: `Usa vocabulario simple y oraciones cortas. El texto debe ser comprensible para todos.`,
    intermediate: `Usa vocabulario común con algunos términos especializados explicados en contexto.`,
    advanced: `Usa vocabulario rico y sofisticado con términos técnicos y estilo literario elaborado.`,
  },
  pt: {
    simple: `Use vocabulário simples e frases curtas. O texto deve ser compreensível por todos.`,
    intermediate: `Use vocabulário comum com alguns termos especializados explicados no contexto.`,
    advanced: `Use vocabulário rico e sofisticado com termos técnicos e estilo literário elaborado.`,
  },
  de: {
    simple: `Verwende einfaches Vokabular und kurze Sätze. Der Text soll für alle verständlich sein.`,
    intermediate: `Verwende gebräuchliches Vokabular mit einigen Fachbegriffen, die im Kontext erklärt werden.`,
    advanced: `Verwende reiches und anspruchsvolles Vokabular mit Fachbegriffen und elaboriertem Stil.`,
  },
  sw: {
    simple: `Tumia maneno rahisi na sentensi fupi. Maandishi yawe yanaeleweka na kila mtu.`,
    intermediate: `Tumia maneno ya kawaida na istilahi chache zilizofafanuliwa katika muktadha.`,
    advanced: `Tumia maneno tajiri na ya hali ya juu na istilahi za kitaalamu.`,
  },
};

// ─── Target audience instructions ───
const audienceMap: Record<string, Record<string, string>> = {
  fr: {
    general: `Public général, tout âge confondu. Contenu universel et inclusif.`,
    children: `Livre pour enfants (6-12 ans). Utilise un langage simple et imagé, des histoires courtes et captivantes, des personnages attachants, des dialogues vivants, des descriptions colorées et beaucoup d'imagination. Chaque chapitre doit se terminer sur une leçon de vie douce.`,
    teens: `Adolescents (13-18 ans). Utilise un ton dynamique et moderne, des exemples de la vie quotidienne des jeunes (école, amitié, identité, rêves), un style engageant avec des références culturelles actuelles. Aborde les sujets avec authenticité.`,
    adults: `Adultes. Contenu mature avec réflexions profondes, exemples de la vie professionnelle et personnelle, analyses nuancées et perspectives multiples.`,
    seniors: `Seniors. Ton respectueux et chaleureux, références culturelles classiques, sagesse accumulée, nostalgie constructive et expériences de vie inspirantes.`,
    professionals: `Professionnels et experts du domaine. Contenu avancé avec données concrètes, études de cas détaillées, méthodologies éprouvées, frameworks pratiques et résultats mesurables.`,
  },
  en: {
    general: `General audience, all ages. Universal and inclusive content.`,
    children: `Book for children (6-12 years). Use simple and vivid language, short captivating stories, lovable characters, lively dialogues, colorful descriptions and lots of imagination. Each chapter should end with a gentle life lesson.`,
    teens: `Teenagers (13-18 years). Use a dynamic, modern tone with everyday examples (school, friendship, identity, dreams), engaging style with current cultural references. Address topics with authenticity.`,
    adults: `Adults. Mature content with deep reflections, professional and personal life examples, nuanced analyses and multiple perspectives.`,
    seniors: `Seniors. Respectful and warm tone, classic cultural references, accumulated wisdom, constructive nostalgia and inspiring life experiences.`,
    professionals: `Professionals and domain experts. Advanced content with concrete data, detailed case studies, proven methodologies, practical frameworks and measurable outcomes.`,
  },
  es: {
    general: `Público general, todas las edades.`,
    children: `Libro para niños (6-12 años). Lenguaje simple, historias cautivadoras e imaginación.`,
    teens: `Adolescentes (13-18 años). Tono dinámico con ejemplos de la vida cotidiana juvenil.`,
    adults: `Adultos. Contenido maduro con reflexiones profundas.`,
    seniors: `Personas mayores. Tono respetuoso con sabiduría y experiencia.`,
    professionals: `Profesionales. Contenido avanzado con datos y metodologías.`,
  },
  pt: {
    general: `Público geral, todas as idades.`,
    children: `Livro para crianças (6-12 anos). Linguagem simples e muita imaginação.`,
    teens: `Adolescentes (13-18 anos). Tom dinâmico com exemplos do cotidiano jovem.`,
    adults: `Adultos. Conteúdo maduro com reflexões profundas.`,
    seniors: `Idosos. Tom respeitoso com sabedoria e experiência.`,
    professionals: `Profissionais. Conteúdo avançado com dados e metodologias.`,
  },
  de: {
    general: `Allgemeines Publikum, alle Altersgruppen.`,
    children: `Buch für Kinder (6-12 Jahre). Einfache Sprache und viel Fantasie.`,
    teens: `Teenager (13-18 Jahre). Dynamischer Ton mit Beispielen aus dem Jugendalltag.`,
    adults: `Erwachsene. Reifer Inhalt mit tiefen Reflexionen.`,
    seniors: `Senioren. Respektvoller Ton mit Weisheit und Erfahrung.`,
    professionals: `Fachleute. Fortgeschrittener Inhalt mit Daten und Methoden.`,
  },
  sw: {
    general: `Hadhira ya jumla, umri wote.`,
    children: `Kitabu cha watoto (miaka 6-12). Lugha rahisi na mawazo mengi.`,
    teens: `Vijana (miaka 13-18). Sauti yenye nguvu na mifano ya maisha ya kila siku.`,
    adults: `Watu wazima. Yaliyomo ya kukomaa na tafakuri za kina.`,
    seniors: `Wazee. Sauti ya heshima na hekima.`,
    professionals: `Wataalamu. Yaliyomo ya juu na data na mbinu.`,
  },
};

// ─── Style format instructions ───
const styleFormatMap: Record<string, Record<string, string>> = {
  fr: {
    ebook: `Structure en chapitres narratifs avec des introductions captivantes, des transitions fluides, des sous-sections claires (<h3>), des paragraphes bien développés, des citations marquantes en <blockquote>, et une conclusion mémorable par chapitre.`,
    guide: `Structure pratique avec des étapes numérotées, des listes à puces (<ul><li>), des encadrés de conseils en <blockquote>, des exercices pratiques, des check-lists, des exemples avant/après et des résumés de chapitre.`,
    prayers: `Structure en sections de prières, méditations guidées et réflexions spirituelles. Inclus des versets sacrés en <blockquote> avec leurs références, des invocations, des moments de silence méditatif et des intentions de prière.`,
  },
  en: {
    ebook: `Structure with narrative chapters featuring captivating introductions, smooth transitions, clear sub-sections (<h3>), well-developed paragraphs, striking quotes in <blockquote>, and a memorable conclusion per chapter.`,
    guide: `Practical structure with numbered steps, bullet lists (<ul><li>), tip boxes in <blockquote>, practical exercises, checklists, before/after examples and chapter summaries.`,
    prayers: `Structure with prayer sections, guided meditations and spiritual reflections. Include sacred verses in <blockquote> with references, invocations, moments of meditative silence and prayer intentions.`,
  },
  es: {
    ebook: `Estructura con capítulos narrativos, introducciones cautivadoras, transiciones fluidas y conclusiones memorables.`,
    guide: `Estructura práctica con pasos numerados, listas, ejercicios y resúmenes.`,
    prayers: `Estructura con secciones de oración, meditaciones y reflexiones espirituales con versículos.`,
  },
  pt: {
    ebook: `Estrutura com capítulos narrativos, introduções cativantes, transições fluidas e conclusões memoráveis.`,
    guide: `Estrutura prática com etapas numeradas, listas, exercícios e resumos.`,
    prayers: `Estrutura com seções de oração, meditações e reflexões espirituais com versículos.`,
  },
  de: {
    ebook: `Struktur mit narrativen Kapiteln, fesselnden Einleitungen, fließenden Übergängen und einprägsamen Schlussfolgerungen.`,
    guide: `Praktische Struktur mit nummerierten Schritten, Listen, Übungen und Zusammenfassungen.`,
    prayers: `Struktur mit Gebetsabschnitten, Meditationen und spirituellen Reflexionen mit Bibelversen.`,
  },
  sw: {
    ebook: `Muundo wa sura za simulizi zenye utangulizi wa kuvutia na hitimisho la kukumbukwa.`,
    guide: `Muundo wa vitendo na hatua zilizohesabiwa, orodha na mazoezi.`,
    prayers: `Muundo na sehemu za maombi, kutafakari na tafakuri za kiroho.`,
  },
};

// ─── Language name map for prompts ───
const langNameMap: Record<string, string> = {
  fr: 'français', en: 'English', es: 'español', pt: 'português', de: 'Deutsch', sw: 'Kiswahili',
};

function getInstruction(map: Record<string, Record<string, string>>, lang: string, key: string, fallbackKey: string): string {
  const langMap = map[lang] || map['fr'] || map['en'];
  return langMap[key] || langMap[fallbackKey] || Object.values(langMap)[0] || '';
}

const MAX_CHAPTERS = 8;
const MIN_CHAPTERS = 3;

function extractJsonObjectCandidate(raw: string): string | null {
  const text = raw.trim();
  const start = text.indexOf('{');
  if (start < 0) return null;

  let inString = false;
  let escaped = false;
  let depth = 0;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  return null;
}

function parseCandidate(candidate: string): any | null {
  const cleaned = candidate
    .replace(/```[\w]*\n?/gi, '')
    .replace(/```\n?/g, '')
    .replace(/,\s*([}\]])/g, '$1')
    .trim();

  if (!cleaned) return null;

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function tryParsePayload(raw: string): any | null {
  const direct = parseCandidate(raw);
  if (direct) return direct;

  const candidate = extractJsonObjectCandidate(raw);
  if (!candidate) return null;

  return parseCandidate(candidate);
}

function normalizeGeneratedChapters(parsed: any): { id: string; title: string; content: string }[] {
  const chapters = Array.isArray(parsed?.chapters) ? parsed.chapters : [];

  return chapters
    .map((chapter: any, index: number) => ({
      id: typeof chapter?.id === 'string' && chapter.id.trim().length > 0 ? chapter.id.trim() : `ch-${index + 1}`,
      title: typeof chapter?.title === 'string' ? chapter.title.trim() : '',
      content: typeof chapter?.content === 'string' ? chapter.content.trim() : '',
    }))
    .filter((chapter: { id: string; title: string; content: string }) => chapter.title.length > 0 && chapter.content.length > 30);
}

async function repairJsonWithAi(apiKey: string, rawContent: string, chapterCount: number): Promise<any | null> {
  const repairRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `You repair malformed JSON only. Return ONLY valid JSON with this shape: {"chapters":[{"id":"ch-1","title":"...","content":"<p>...</p>"}]}. Keep HTML in content. Do not summarize.`,
        },
        {
          role: 'user',
          content: `Repair this malformed payload into valid JSON. Keep as much original content as possible. Expected chapter count around ${chapterCount}.\n\n${rawContent.slice(0, 80000)}`,
        },
      ],
    }),
  });

  if (!repairRes.ok) return null;
  const repairData = await repairRes.json().catch(() => null);
  const repairedRaw = repairData?.choices?.[0]?.message?.content || '';
  return tryParsePayload(repairedRaw);
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  if (error instanceof Error && error.name === 'AbortError') return true;
  if (typeof error === 'object' && error !== null && 'name' in error) {
    return (error as { name?: string }).name === 'AbortError';
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { title, topic, style, pageCount, language, tone, languageLevel, targetAudience, singleChapter, chapterTitle, styleReference } = await req.json();

    if (!title && !topic) {
      return new Response(JSON.stringify({ error: 'title or topic required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lang = language || 'fr';
    const langName = langNameMap[lang] || langNameMap['fr'];
    const pages = Number(pageCount) > 0 ? Number(pageCount) : 20;
    const chapterCount = singleChapter
      ? 1
      : Math.max(MIN_CHAPTERS, Math.min(MAX_CHAPTERS, Math.round(pages / 5)));
    const chapterWordTarget = singleChapter
      ? '450-700'
      : chapterCount >= 6
        ? '320-520'
        : '420-650';

    const _tone = tone || 'professional';
    const _level = languageLevel || 'intermediate';
    const _audience = targetAudience || 'general';

    const toneInstruction = getInstruction(toneMap, lang, _tone, 'professional');
    const levelInstruction = getInstruction(levelMap, lang, _level, 'intermediate');
    const audienceInstruction = getInstruction(audienceMap, lang, _audience, 'general');
    const formatInstruction = getInstruction(styleFormatMap, lang, style || 'ebook', 'ebook');

    // Build custom style reference instruction if provided
    let styleRefInstruction = '';
    if (styleReference && styleReference.trim().length > 0) {
      const ref = styleReference.trim();
      styleRefInstruction = lang === 'fr'
        ? `\n\n⚠️ INSTRUCTION PRIORITAIRE — RÉFÉRENCE DE STYLE PERSONNALISÉE ⚠️
L'auteur a EXPLICITEMENT demandé que tu imites un style particulier. C'est l'instruction LA PLUS IMPORTANTE de tout ce prompt.

RÉFÉRENCE FOURNIE : «${ref}»

ANALYSE ET APPLICATION OBLIGATOIRES :
- Si c'est un NOM D'AUTEUR, DE PRÉDICATEUR ou de PERSONNALITÉ (ex: Bishop Olukoya, Joel Osteen, Victor Hugo, etc.) : tu DOIS connaître leur style d'écriture/de prédication et le reproduire FIDÈLEMENT. Étudie leur vocabulaire typique, leurs tournures de phrases, leur rythme, leur façon de structurer leurs arguments, leurs expressions récurrentes, leur niveau de langue réel.
- Si c'est un EXTRAIT DE TEXTE : analyse le vocabulaire, la longueur des phrases, le rythme, les figures de style, le niveau de langue et reproduis-les exactement.
- Le ton défini plus haut (${_tone}) est SECONDAIRE. La référence de style est PRIORITAIRE et ÉCRASE le ton prédéfini en cas de conflit.
- Le niveau de langue défini plus haut peut aussi être ajusté pour correspondre à la référence. Si la référence utilise un langage simple et direct, utilise un langage simple et direct, MÊME si le niveau demandé est "avancé".
- CHAQUE paragraphe que tu écris doit sonner comme si ${ref} l'avait écrit lui-même/elle-même.`
        : `\n\n⚠️ PRIORITY INSTRUCTION — CUSTOM STYLE REFERENCE ⚠️
The author has EXPLICITLY requested that you mimic a specific style. This is the MOST IMPORTANT instruction in this entire prompt.

REFERENCE PROVIDED: "${ref}"

MANDATORY ANALYSIS AND APPLICATION:
- If it's an AUTHOR, PREACHER, or PUBLIC FIGURE name (e.g., Bishop Olukoya, Joel Osteen, Victor Hugo, etc.): you MUST know their writing/preaching style and reproduce it FAITHFULLY. Study their typical vocabulary, sentence patterns, rhythm, argument structure, recurring expressions, and actual language level.
- If it's a TEXT EXCERPT: analyze the vocabulary, sentence length, rhythm, literary devices, language level and reproduce them exactly.
- The tone defined above (${_tone}) is SECONDARY. The style reference is the PRIORITY and OVERRIDES the predefined tone if they conflict.
- The language level defined above may also be adjusted to match the reference. If the reference uses simple, direct language, use simple, direct language, EVEN if the requested level is "advanced".
- EVERY paragraph you write must sound as if ${ref} wrote it themselves.`;
    }

    // Build system prompt - always in the target language for best results
    const systemPrompt = lang === 'fr'
      ? `Tu es un AUTEUR PROFESSIONNEL de renommée internationale. Tu rédiges des livres complets, captivants et de très haute qualité littéraire en ${langName}.

RÈGLES D'ÉCRITURE FONDAMENTALES :
1. Chaque chapitre DOIT être un texte riche, détaillé et immersif d'environ ${chapterWordTarget} mots
2. JAMAIS de contenu superficiel ou générique - chaque phrase doit apporter de la valeur
3. Utilise des exemples concrets, des anecdotes, des histoires vraies ou plausibles
4. Crée des transitions fluides et élégantes entre les paragraphes et chapitres
5. Varie la structure : paragraphes narratifs, listes, citations, dialogues si pertinent
6. Le premier chapitre doit ACCROCHER le lecteur immédiatement
7. Le dernier chapitre doit laisser une IMPRESSION DURABLE et un appel à l'action

STYLE D'ÉCRITURE :
${toneInstruction}

NIVEAU DE LANGUE :
${levelInstruction}

PUBLIC CIBLE :
${audienceInstruction}

FORMAT ET STRUCTURE :
${formatInstruction}

QUALITÉ DU HTML :
- Utilise abondamment : <p>, <h3>, <strong>, <em>, <ul>, <li>, <ol>, <blockquote>
- Les citations et versets DOIVENT être en <blockquote> avec source en <em>
- Les mots-clés importants en <strong>
- Les listes pour structurer les points importants
- Les sous-titres <h3> pour aérer le texte (2-3 par chapitre)

Tu DOIS créer les chapitres EN FONCTION DU SUJET/IDÉE fourni. Chaque chapitre explore un aspect unique et essentiel du sujet.${styleRefInstruction}
FORMAT DE SORTIE : Retourne un JSON valide. Pas de markdown, pas de code fences.`
      : `You are a WORLD-CLASS PROFESSIONAL AUTHOR. You write complete, captivating, and exceptionally high-quality books in ${langName}.

FUNDAMENTAL WRITING RULES:
1. Each chapter MUST be a rich, detailed and immersive text of around ${chapterWordTarget} words
2. NEVER superficial or generic content - every sentence must add value
3. Use concrete examples, anecdotes, true or plausible stories
4. Create smooth and elegant transitions between paragraphs and chapters
5. Vary the structure: narrative paragraphs, lists, quotes, dialogues when relevant
6. The first chapter must HOOK the reader immediately
7. The last chapter must leave a LASTING IMPRESSION and a call to action

WRITING STYLE:
${toneInstruction}

LANGUAGE LEVEL:
${levelInstruction}

TARGET AUDIENCE:
${audienceInstruction}

FORMAT AND STRUCTURE:
${formatInstruction}

HTML QUALITY:
- Use abundantly: <p>, <h3>, <strong>, <em>, <ul>, <li>, <ol>, <blockquote>
- Quotes and verses MUST be in <blockquote> with source in <em>
- Important keywords in <strong>
- Lists to structure key points
- Sub-headings <h3> to break up text (2-3 per chapter)

You MUST create chapters BASED ON THE TOPIC/IDEA provided. Each chapter explores a unique and essential aspect of the topic.${styleRefInstruction}
OUTPUT FORMAT: Return valid JSON. No markdown, no code fences.`;


    let userPrompt: string;

    if (singleChapter) {
      userPrompt = lang === 'fr'
        ? `${topic}

Retourne UNIQUEMENT un JSON avec cette structure :
{
  "chapters": [
    {"id": "ch-1", "title": "${chapterTitle || 'Chapitre'}", "content": "<p>Contenu HTML riche et détaillé...</p>"}
  ]
}

Le contenu doit faire environ ${chapterWordTarget} mots en HTML riche avec sous-titres <h3>, paragraphes <p>, mots-clés en <strong>, citations en <blockquote>, listes <ul><li> si pertinent.`
        : `${topic}

Return ONLY a JSON with this structure:
{
  "chapters": [
    {"id": "ch-1", "title": "${chapterTitle || 'Chapter'}", "content": "<p>Rich and detailed HTML content...</p>"}
  ]
}

Content should be around ${chapterWordTarget} words in rich HTML with sub-headings <h3>, paragraphs <p>, keywords in <strong>, quotes in <blockquote>, lists <ul><li> when relevant.`;
    } else {
      userPrompt = lang === 'fr'
        ? `Crée un livre COMPLET et CAPTIVANT sur le sujet suivant :

TITRE : "${title}"
${topic ? `IDÉE / SUJET : ${topic}` : ''}
LANGUE D'ÉCRITURE : ${langName}

CONSIGNES DÉTAILLÉES :
- Crée exactement ${chapterCount} chapitres qui explorent chaque facette importante de CE sujet
- Les titres de chapitres doivent être CRÉATIFS, ACCROCHEURS et directement liés au sujet "${topic || title}"
- Chaque chapitre : environ ${chapterWordTarget} mots de contenu RICHE en HTML
- Le contenu doit être SUBSTANTIEL : exemples réels, anecdotes, données, citations pertinentes
- Chapitre 1 : Introduction percutante qui pose le contexte, l'enjeu et donne envie de lire la suite
- Chapitres intermédiaires : Exploration approfondie, chaque chapitre un angle unique
- Dernier chapitre : Conclusion mémorable avec synthèse, appel à l'action et ouverture inspirante
- Utilise ABONDAMMENT le HTML riche : <h3> pour sous-titres, <blockquote> pour citations/versets, <strong> pour mots-clés, <ul><li> pour listes, <em> pour emphase
- NE crée JAMAIS de chapitres génériques ou vides. Chaque mot compte.
- Respecte scrupuleusement le ton, le niveau de langue et le public cible

Retourne UNIQUEMENT un JSON valide :
{
  "chapters": [
    {"id": "ch-1", "title": "Titre créatif et accrocheur...", "content": "<h3>Sous-titre</h3><p>Contenu riche et détaillé avec <strong>mots-clés</strong>...</p><blockquote>Citation pertinente</blockquote>"},
    {"id": "ch-2", "title": "Titre créatif et accrocheur...", "content": "..."}
  ]
}

RAPPEL CRITIQUE : Livre de ${pages} pages sur "${topic || title}". Chaque chapitre ≈ ${chapterWordTarget} mots. Qualité professionnelle. Zéro contenu générique.`
        : `Create a COMPLETE and CAPTIVATING book on the following topic:

TITLE: "${title}"
${topic ? `IDEA / TOPIC: ${topic}` : ''}
WRITING LANGUAGE: ${langName}

DETAILED INSTRUCTIONS:
- Create exactly ${chapterCount} chapters exploring every important facet of THIS topic
- Chapter titles must be CREATIVE, CATCHY and directly related to "${topic || title}"
- Each chapter: around ${chapterWordTarget} words of RICH HTML content
- Content must be SUBSTANTIAL: real examples, anecdotes, data, relevant quotes
- Chapter 1: Powerful introduction setting context, stakes and making readers want more
- Middle chapters: Deep exploration, each chapter a unique angle
- Last chapter: Memorable conclusion with synthesis, call to action and inspiring opening
- Use ABUNDANT rich HTML: <h3> for sub-headings, <blockquote> for quotes/verses, <strong> for keywords, <ul><li> for lists, <em> for emphasis
- NEVER create generic or empty chapters. Every word counts.
- Strictly respect the tone, language level and target audience

Return ONLY valid JSON:
{
  "chapters": [
    {"id": "ch-1", "title": "Creative catchy title...", "content": "<h3>Sub-heading</h3><p>Rich detailed content with <strong>keywords</strong>...</p><blockquote>Relevant quote</blockquote>"},
    {"id": "ch-2", "title": "Creative catchy title...", "content": "..."}
  ]
}

CRITICAL REMINDER: ${pages}-page book on "${topic || title}". Each chapter ≈ ${chapterWordTarget} words. Professional quality. Zero generic content.`;
    }

    const requestTimeoutMs = singleChapter ? 50_000 : 85_000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

    let aiRes: Response;
    try {
      aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (isAbortError(error)) {
        return new Response(JSON.stringify({ error: 'Generation timeout. Please retry.' }), {
          status: 504,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await aiRes.text();
      console.error('AI gateway error:', aiRes.status, errText);
      return new Response(JSON.stringify({ error: `AI error (${aiRes.status})` }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiRes.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '';

    let parsed = tryParsePayload(rawContent);
    if (!parsed) {
      console.error('Direct parse failed, attempting AI JSON repair. Payload preview:', rawContent.slice(0, 500));
      parsed = await repairJsonWithAi(LOVABLE_API_KEY, rawContent, chapterCount);
    }

    if (!parsed) {
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedChapters = normalizeGeneratedChapters(parsed);
    if (normalizedChapters.length === 0) {
      return new Response(JSON.stringify({ error: 'AI returned empty chapters' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ chapters: normalizedChapters }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('generate-book-content error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
