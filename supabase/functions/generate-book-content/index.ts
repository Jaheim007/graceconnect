import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── Tone instructions by language ───
const toneMap: Record<string, Record<string, string>> = {
  fr: {
    professional: `Ton professionnel, structuré et engageant. Utilise des exemples concrets, des données chiffrées quand c'est pertinent, des explications claires et des transitions fluides entre les idées. Chaque paragraphe doit apporter une valeur ajoutée.`,
    conversational: `Ton conversationnel et accessible. Écris comme si tu racontais une histoire à un ami proche. Utilise des anecdotes personnelles, des questions rhétoriques, un langage simple et chaleureux. Crée une connexion émotionnelle avec le lecteur.`,
    humorous: `Ton humoristique et léger. Utilise de l'humour subtil, des métaphores amusantes, de l'ironie bienveillante et un style divertissant. Fais rire ou sourire le lecteur tout en transmettant un message profond. Intègre des situations cocasses et des analogies surprenantes.`,
    spiritual: `Ton spirituel, méditatif et inspirant. Intègre des versets bibliques (avec références précises : livre, chapitre, verset), des sourates du Coran, des citations de saints, des prières ou des méditations selon le contexte religieux. Utilise un langage profond, réconfortant et porteur d'espérance. Chaque chapitre doit nourrir l'âme du lecteur.`,
    poetic: `Ton poétique et littéraire. Utilise des métaphores filées, des images évocatrices, des comparaisons saisissantes, un rythme varié et un style lyrique. Chaque paragraphe doit être une invitation au voyage intérieur, avec une prose ciselée et musicale.`,
    academic: `Ton académique et rigoureux. Utilise des références bibliographiques, des données empiriques, des analyses approfondies, des études de cas, des méthodologies éprouvées et un vocabulaire précis. Structure l'argumentation de manière logique et étayée.`,
  },
  en: {
    professional: `Professional, structured and engaging tone. Use concrete examples, relevant data points, clear explanations and smooth transitions between ideas. Every paragraph should add value.`,
    conversational: `Conversational and accessible tone. Write as if telling a story to a close friend. Use personal anecdotes, rhetorical questions, simple and warm language. Create an emotional connection with the reader.`,
    humorous: `Humorous and light tone. Use subtle humor, funny metaphors, gentle irony and an entertaining style. Make the reader laugh or smile while conveying a deep message. Include amusing situations and surprising analogies.`,
    spiritual: `Spiritual, meditative and inspiring tone. Include Bible verses (with precise references: book, chapter, verse), Quran surahs, quotes from saints, prayers or meditations as contextually relevant. Use deep, comforting and hope-filled language. Each chapter should nourish the reader's soul.`,
    poetic: `Poetic and literary tone. Use extended metaphors, evocative imagery, striking comparisons, varied rhythm and a lyrical style. Each paragraph should be an invitation to inner journey, with polished, musical prose.`,
    academic: `Academic and rigorous tone. Use bibliographic references, empirical data, in-depth analyses, case studies, proven methodologies and precise vocabulary. Structure arguments logically and with evidence.`,
  },
  es: {
    professional: `Tono profesional, estructurado y atractivo. Usa ejemplos concretos, datos relevantes y explicaciones claras con transiciones fluidas.`,
    conversational: `Tono conversacional y accesible. Escribe como si contaras una historia a un amigo cercano, con anécdotas y lenguaje cálido.`,
    humorous: `Tono humorístico y ligero. Usa humor sutil, metáforas divertidas e ironía amable mientras transmites mensajes profundos.`,
    spiritual: `Tono espiritual, meditativo e inspirador. Incluye versículos bíblicos, suras del Corán, citas espirituales y oraciones según el contexto.`,
    poetic: `Tono poético y literario. Usa metáforas, imágenes evocadoras y un estilo lírico y expresivo.`,
    academic: `Tono académico y riguroso. Usa referencias, datos, análisis profundos y vocabulario preciso.`,
  },
  pt: {
    professional: `Tom profissional, estruturado e envolvente. Use exemplos concretos, dados relevantes e explicações claras.`,
    conversational: `Tom conversacional e acessível. Escreva como se estivesse contando uma história para um amigo próximo.`,
    humorous: `Tom humorístico e leve. Use humor sutil, metáforas engraçadas e um estilo divertido.`,
    spiritual: `Tom espiritual, meditativo e inspirador. Inclua versículos bíblicos, suras do Alcorão e citações espirituais.`,
    poetic: `Tom poético e literário. Use metáforas, imagens evocativas e um estilo lírico.`,
    academic: `Tom acadêmico e rigoroso. Use referências, dados empíricos e análises aprofundadas.`,
  },
  de: {
    professional: `Professioneller, strukturierter und ansprechender Ton. Verwende konkrete Beispiele, relevante Daten und klare Erklärungen.`,
    conversational: `Gesprächiger und zugänglicher Ton. Schreibe, als würdest du einem engen Freund eine Geschichte erzählen.`,
    humorous: `Humorvoller und leichter Ton. Verwende subtilen Humor, lustige Metaphern und einen unterhaltsamen Stil.`,
    spiritual: `Spiritueller, meditativer und inspirierender Ton. Integriere Bibelverse, Koransuren und spirituelle Zitate.`,
    poetic: `Poetischer und literarischer Ton. Verwende Metaphern, eindrucksvolle Bilder und einen lyrischen Stil.`,
    academic: `Akademischer und rigoroser Ton. Verwende Referenzen, empirische Daten und präzises Vokabular.`,
  },
  sw: {
    professional: `Sauti ya kitaalamu, iliyopangwa vizuri na yenye kuvutia. Tumia mifano halisi na maelezo wazi.`,
    conversational: `Sauti ya mazungumzo na rahisi kueleweka. Andika kama unavyozungumza na rafiki wa karibu.`,
    humorous: `Sauti ya ucheshi na nyepesi. Tumia ucheshi mzuri na sitiari za kuchekesha.`,
    spiritual: `Sauti ya kiroho, ya kutafakari na yenye kuhamasisha. Jumuisha mistari ya Biblia na Qurani.`,
    poetic: `Sauti ya kishairi na ya fasihi. Tumia sitiari, picha za kuvutia na mtindo wa kishairi.`,
    academic: `Sauti ya kitaaluma na makini. Tumia marejeleo, data na uchambuzi wa kina.`,
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { title, topic, style, pageCount, language, tone, languageLevel, targetAudience, singleChapter, chapterTitle } = await req.json();

    if (!title && !topic) {
      return new Response(JSON.stringify({ error: 'title or topic required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lang = language || 'fr';
    const langName = langNameMap[lang] || langNameMap['fr'];
    const pages = pageCount || 20;
    const chapterCount = singleChapter ? 1 : Math.max(3, Math.min(12, Math.round(pages / 3)));

    const _tone = tone || 'professional';
    const _level = languageLevel || 'intermediate';
    const _audience = targetAudience || 'general';

    const toneInstruction = getInstruction(toneMap, lang, _tone, 'professional');
    const levelInstruction = getInstruction(levelMap, lang, _level, 'intermediate');
    const audienceInstruction = getInstruction(audienceMap, lang, _audience, 'general');
    const formatInstruction = getInstruction(styleFormatMap, lang, style || 'ebook', 'ebook');

    // Build system prompt - always in the target language for best results
    const systemPrompt = lang === 'fr'
      ? `Tu es un AUTEUR PROFESSIONNEL de renommée internationale. Tu rédiges des livres complets, captivants et de très haute qualité littéraire en ${langName}.

RÈGLES D'ÉCRITURE FONDAMENTALES :
1. Chaque chapitre DOIT être un texte riche, détaillé et immersif de 500-800 mots minimum
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

Tu DOIS créer les chapitres EN FONCTION DU SUJET/IDÉE fourni. Chaque chapitre explore un aspect unique et essentiel du sujet.
FORMAT DE SORTIE : Retourne un JSON valide. Pas de markdown, pas de code fences.`
      : `You are a WORLD-CLASS PROFESSIONAL AUTHOR. You write complete, captivating, and exceptionally high-quality books in ${langName}.

FUNDAMENTAL WRITING RULES:
1. Each chapter MUST be a rich, detailed and immersive text of 500-800 words minimum
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

You MUST create chapters BASED ON THE TOPIC/IDEA provided. Each chapter explores a unique and essential aspect of the topic.
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

Le contenu doit faire 500-900 mots en HTML riche avec sous-titres <h3>, paragraphes <p>, mots-clés en <strong>, citations en <blockquote>, listes <ul><li> si pertinent.`
        : `${topic}

Return ONLY a JSON with this structure:
{
  "chapters": [
    {"id": "ch-1", "title": "${chapterTitle || 'Chapter'}", "content": "<p>Rich and detailed HTML content...</p>"}
  ]
}

Content should be 500-900 words in rich HTML with sub-headings <h3>, paragraphs <p>, keywords in <strong>, quotes in <blockquote>, lists <ul><li> when relevant.`;
    } else {
      userPrompt = lang === 'fr'
        ? `Crée un livre COMPLET et CAPTIVANT sur le sujet suivant :

TITRE : "${title}"
${topic ? `IDÉE / SUJET : ${topic}` : ''}
LANGUE D'ÉCRITURE : ${langName}

CONSIGNES DÉTAILLÉES :
- Crée exactement ${chapterCount} chapitres qui explorent chaque facette importante de CE sujet
- Les titres de chapitres doivent être CRÉATIFS, ACCROCHEURS et directement liés au sujet "${topic || title}"
- Chaque chapitre : 500-800 mots de contenu RICHE en HTML
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

RAPPEL CRITIQUE : Livre de ${pages} pages sur "${topic || title}". Chaque chapitre = 500-800 mots MINIMUM. Qualité professionnelle. Zéro contenu générique.`
        : `Create a COMPLETE and CAPTIVATING book on the following topic:

TITLE: "${title}"
${topic ? `IDEA / TOPIC: ${topic}` : ''}
WRITING LANGUAGE: ${langName}

DETAILED INSTRUCTIONS:
- Create exactly ${chapterCount} chapters exploring every important facet of THIS topic
- Chapter titles must be CREATIVE, CATCHY and directly related to "${topic || title}"
- Each chapter: 500-800 words of RICH HTML content
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

CRITICAL REMINDER: ${pages}-page book on "${topic || title}". Each chapter = 500-800 words MINIMUM. Professional quality. Zero generic content.`;
    }

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
    });

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

    const cleaned = rawContent.replace(/```[\w]*\n?/gi, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error('Failed to parse AI response:', rawContent.slice(0, 500));
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr);
      return new Response(JSON.stringify({ error: 'Invalid AI response format' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.error('generate-book-content error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
