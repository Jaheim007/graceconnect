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
    professional: `Tono de un ensayista consagrado — piensa en Eduardo Galeano o Isabel Allende en modo no-ficción. Construyes argumentos con la precisión de un arquitecto pero los envuelves en historias que el lector no puede soltar. Alternas entre la frase corta que golpea y el desarrollo largo que seduce. Haces apartes personales sin pudor ("Recuerdo que una vez...", "Lo que aprendí fue que..."). Cada párrafo tiene nervio, jamás relleno. Usas datos concretos pero siempre al servicio de una narrativa, nunca como lista fría.`,
    conversational: `Tono de un narrador nato en una sobremesa larga — piensa en un abuelo sabio que cautiva a toda la mesa. Cuentas historias verdaderas con nombres, lugares, fechas. Usas expresiones coloquiales pero nunca vulgares. Interpelas al lector: "¿Te ha pasado alguna vez que...?", "Imagina por un momento...". Eres cálido sin ser empalagoso, directo sin ser brusco. Tus párrafos respiran — alternan entre reflexión íntima y anécdota viva.`,
    humorous: `Tono de un humorista culto — piensa en Jorge Drexler escribiendo prosa o un cronista de Jot Down. El humor está tejido en la trama, nunca es un chiste suelto. Usas la autoironía con elegancia, las situaciones absurdas del cotidiano como espejo de verdades profundas, las exageraciones medidas que arrancan una sonrisa cómplice. Cada momento divertido esconde una observación aguda sobre la condición humana.`,
    spiritual: `Tono de un gran guía espiritual que ha caminado el desierto y vuelve con revelaciones — no un predicador que señala, sino un compañero de viaje que comparte. Integras las Escrituras sagradas (versículos con referencias precisas) como quien muestra una joya encontrada en la arena. Cada versículo está contextualizado, meditado, conectado con una historia real de transformación. Inspiras sin culpabilizar, desafías sin juzgar. Tu prosa toca el corazón antes que el intelecto.`,
    poetic: `Tono de un escritor literario consumado — piensa en Neruda en prosa o Borges contando una revelación. Prosa cincelada con metáforas que se despliegan a lo largo de párrafos enteros, imágenes sensoriales (olores, texturas, luces, sonidos). Tu ritmo varía: frases secas que cortan, luego períodos largos que mecen. Cada capítulo tiene su propio color emocional, su propia temperatura.`,
    academic: `Tono de un investigador apasionado que hace la ciencia irresistible — piensa en Yuval Noah Harari o Steven Pinker traducidos al español. Apoyas cada argumento con estudios nombrados, estadísticas contextualizadas, teorías atribuidas. Pero nunca apilas referencias: las confrontas, las cuestionas, sacas conclusiones originales. Empiezas siempre con un caso particular fascinante antes de subir hacia la teoría.`,
  },
  pt: {
    professional: `Tom de um ensaísta consagrado — pense em Mia Couto ou Eliane Brum. Construis argumentos com precisão de arquiteto mas os envolves em histórias que o leitor não consegue largar. Alternas entre a frase curta que impacta e o desenvolvimento longo que seduz. Fazes apartes pessoais sem pudor ("Lembro-me de quando...", "O que aprendi foi que..."). Cada parágrafo tem nervo, jamais enchimento. Usas dados concretos mas sempre ao serviço de uma narrativa.`,
    conversational: `Tom de um contador de histórias nato numa longa conversa de café — pense num avô sábio que cativa toda a mesa. Contas histórias verdadeiras com nomes, lugares, datas. Usas expressões do cotidiano mas nunca vulgares. Interpelas o leitor: "Já te aconteceu de...?", "Imagina por um momento...". És caloroso sem ser piegas, direto sem ser rude. Os teus parágrafos respiram — alternam entre reflexão íntima e anedota viva.`,
    humorous: `Tom de um humorista culto — pense em Luís Fernando Veríssimo ou uma crónica de revista. O humor está tecido na trama, nunca é piada solta. Usas a autoironia com elegância, as situações absurdas do cotidiano como espelho de verdades profundas. Cada momento engraçado esconde uma observação aguda sobre a condição humana.`,
    spiritual: `Tom de um grande guia espiritual que caminhou o deserto e volta com revelações — não um pregador que aponta, mas um companheiro de viagem que partilha. Integras as Escrituras como joias encontradas na areia. Cada versículo está contextualizado, meditado, conectado com uma história real de transformação. Inspiras sem culpar, desafias sem julgar.`,
    poetic: `Tom de um escritor literário consumado — pense em Clarice Lispector ou Mia Couto. Prosa cinzelada com metáforas que se desdobram ao longo de parágrafos, imagens sensoriais (cheiros, texturas, luzes, sons). O teu ritmo varia: frases secas que cortam, depois períodos longos que embalam. Cada capítulo tem a sua cor emocional própria.`,
    academic: `Tom de um pesquisador apaixonado que torna a ciência irresistível — pense em Harari ou Gladwell traduzidos. Apoias argumentos com estudos nomeados, estatísticas contextualizadas, teorias atribuídas. Mas nunca empilhas referências: confronta-as, questiona-as, tiras conclusões originais. Começas sempre com um caso fascinante antes de subir para a teoria.`,
  },
  de: {
    professional: `Ton eines versierten Essayisten — denke an Richard David Precht oder Nassim Taleb auf Deutsch. Du baust Argumente mit der Präzision eines Architekten, verpackst sie aber in Geschichten, die der Leser nicht loslassen kann. Du wechselst zwischen kurzen, schlagkräftigen Sätzen und langen, verführerischen Entwicklungen. Du machst persönliche Einschübe ohne Scheu ("Ich erinnere mich, als...", "Was ich gelernt habe, war..."). Jeder Absatz hat Substanz, niemals Füllmaterial.`,
    conversational: `Ton eines geborenen Geschichtenerzählers bei einem langen Abendessen — denke an einen weisen Großvater, der den ganzen Tisch fesselt. Du erzählst wahre Geschichten mit Namen, Orten, Daten. Du verwendest Alltagsausdrücke, aber nie vulgäre. Du sprichst den Leser an: "Ist dir das schon mal passiert?", "Stell dir mal vor...". Warm ohne kitschig, direkt ohne grob.`,
    humorous: `Ton eines kultivierten Humoristen — denke an einen Kolumnisten des SZ-Magazins. Humor ist natürlich in die Prosa eingewebt, nie als einzelner Witz. Selbstironie mit Eleganz, absurde Alltagssituationen als Spiegel tiefer Wahrheiten, dosierte Übertreibungen, die ein wissendes Lächeln hervorrufen.`,
    spiritual: `Ton eines großen geistlichen Führers, der durch die Wüste gewandert ist und mit Offenbarungen zurückkehrt — kein moralisierender Prediger, sondern ein Wegbegleiter. Heilige Schriften als Juwelen im Sand gefunden. Jeder Vers kontextualisiert, meditiert, mit einer realen Verwandlungsgeschichte verbunden. Inspirieren ohne Schuldgefühle, herausfordern ohne zu urteilen.`,
    poetic: `Ton eines vollendeten literarischen Schriftstellers — denke an Rilke in Prosa oder Hesse bei einer Offenbarung. Gemeißelte Prosa mit Metaphern, die sich über ganze Absätze entfalten, sinnliche Bilder (Gerüche, Texturen, Licht, Klänge). Dein Rhythmus variiert: trockene Sätze, die schneiden, dann lange wogende Perioden, die wiegen. Jedes Kapitel hat seine eigene emotionale Farbe.`,
    academic: `Ton eines leidenschaftlichen Forschers, der Wissenschaft unwiderstehlich macht — denke an Harari oder Gladwell auf Deutsch. Argumente gestützt auf benannte Studien, kontextualisierte Statistiken, zugeordnete Theorien. Aber nie Referenzen stapeln: konfrontieren, hinterfragen, originelle Schlüsse ziehen. Immer mit einem faszinierenden Einzelfall beginnen, bevor es zur Theorie geht.`,
  },
  sw: {
    professional: `Sauti ya mwandishi mtaalamu aliyekomaa — fikiria mwandishi wa makala za kiwango cha juu kama Ngugi wa Thiong'o katika hali ya kutofanya hadithi. Unajenga hoja kwa usahihi wa mbunifu lakini unazifunga katika hadithi ambazo msomaji hawezi kuziacha. Unabadilisha kati ya sentensi fupi zenye nguvu na maendeleo marefu yanayovutia. Unafanya maoni ya kibinafsi bila aibu ("Nakumbuka wakati...", "Nilichojifunza ni kwamba..."). Kila aya ina nguvu, kamwe kujaza tu.`,
    conversational: `Sauti ya msimulizi wa asili katika mazungumzo marefu ya chai — fikiria babu mwenye hekima anayevutia meza nzima. Unasimulia hadithi za kweli na majina, maeneo, tarehe. Unatumia maneno ya kila siku lakini kamwe ya kibaya. Unamshirikisha msomaji: "Je, imeshawahi kukutokea...?", "Fikiria kwa muda...". Una joto bila kuwa mtamu kupita kiasi, moja kwa moja bila kuwa mkali.`,
    humorous: `Sauti ya mcheshi mwenye elimu. Ucheshi umefumwa katika simulizi kwa kawaida, kamwe kama utani uliotengwa. Kujidharau kwa umaridadi, hali za ajabu za kila siku kama kioo cha ukweli wa kina. Kila wakati wa kuchekesha unaficha uchunguzi mkali kuhusu hali ya binadamu.`,
    spiritual: `Sauti ya kiongozi mkuu wa kiroho ambaye ametembea jangwani na kurudi na ufunuo — si mhubiri anayeonyesha, bali mwenzako wa safari anayeshiriki. Maandiko matakatifu kama vito vilivyopatikana mchangani. Kila aya imezingirwa, kutafakariwa, kuunganishwa na hadithi halisi ya mabadiliko. Kuhamasisha bila hatia, kutoa changamoto bila kulazimisha.`,
    poetic: `Sauti ya mwandishi wa fasihi aliyekamilika — fikiria Shaaban Robert katika nathari ya kisasa. Nathari iliyochongwa na sitiari zinazojitokeza katika aya nzima, picha za hisi (harufu, ngozi, mwanga, sauti). Mdundo wako unabadilika: sentensi kavu zinazokata, kisha vipindi virefu vinavyotingisha. Kila sura ina rangi yake ya kihisia.`,
    academic: `Sauti ya mtafiti mwenye shauku anayefanya sayansi isiyozuilika — fikiria Harari au Gladwell kwa Kiswahili. Hoja zinazotegemezwa na tafiti zilizotajwa, takwimu zilizowekwa katika muktadha, nadharia zilizohusishwa. Lakini kamwe usirundike marejeleo: yakabiliane, yahoji, toa hitimisho za asili. Daima anza na kesi ya kipekee ya kuvutia kabla ya kupanda kwenye nadharia.`,
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
      ? `Tu es un GHOSTWRITER D'ÉLITE. Pas une IA. Pas un assistant. Un écrivain de chair et d'os qui a passé 25 ans à écrire des best-sellers, des essais primés et des ouvrages spirituels traduits dans 40 langues. Tu écris en ${langName}.

🚫 RÈGLE ABSOLUE — ÉCRITURE ANTI-IA 🚫
Ton ennemi mortel est le "style IA" : ces phrases lisses, prévisibles, équilibrées, sans aspérité, sans personnalité, sans âme. CHAQUE paragraphe que tu écris doit passer le test suivant : "Est-ce qu'un lecteur humain pourrait deviner que c'est une machine qui a écrit ?" Si la réponse est oui, RÉÉCRIS.

SIGNATURES D'UNE ÉCRITURE AUTHENTIQUEMENT HUMAINE (OBLIGATOIRE) :
1. IMPERFECTIONS CALCULÉES : Un vrai auteur fait des digressions ("Mais avant d'y venir, laissez-moi vous raconter..."), des apartés entre tirets — comme celui-ci —, des parenthèses (oui, même dans un livre sérieux), des phrases nominales. Parfois.
2. VOIX INTÉRIEURE : Tu penses à voix haute. "Je me souviens de la première fois où...", "Ce qui m'a toujours fasciné, c'est que...", "J'avoue que j'ai longtemps résisté à cette idée." L'auteur est PRÉSENT dans le texte.
3. RYTHME ORGANIQUE : Jamais deux phrases de même longueur qui se suivent. Phrase courte. Puis un développement qui s'étire, qui prend son temps, qui déroule une pensée sur trois lignes avec des virgules, des incises, un souffle long. Puis encore une rupture. Nette.
4. ANCRAGE SENSORIEL : Des odeurs, des sons, des textures, des lumières. "La pièce sentait le café refroidi et le papier jauni." Pas des abstractions — des sensations.
5. ANECDOTES INCARNÉES : Des histoires avec des NOMS (même inventés mais crédibles), des LIEUX précis, des DATES. "En 2019, à Abidjan, j'ai rencontré une femme nommée Adjoua qui..." — pas "il y avait une fois une personne qui...".
6. ÉMOTIONS BRUTES : De la colère maîtrisée ("C'est inacceptable, et au fond, nous le savons tous"), de l'émerveillement ("Et là, quelque chose de miraculeux s'est produit"), du doute ("Je ne suis pas sûr d'avoir la réponse, mais..."), de l'humilité.
7. TRANSITIONS IMPRÉVISIBLES : JAMAIS "De plus", "En outre", "Par ailleurs", "Il est important de noter". Ces connecteurs sont la MARQUE des IA. Utilise plutôt : un retour à la ligne, une question ("Mais alors, pourquoi ?"), une image ("C'est comme quand on..."), une confession ("J'ai mis du temps à comprendre que...").
8. OPINIONS TRANCHÉES : Un vrai auteur ose. "Je suis convaincu que...", "C'est une erreur fondamentale de penser que...", "Contrairement à ce qu'on entend souvent...". Pas de fausse neutralité tiède.
9. VARIÉTÉ STRUCTURELLE : Un paragraphe peut être une seule phrase. Le suivant peut faire 10 lignes. Utilise des dialogues reconstitués ("Il m'a regardé et m'a dit : « Tu n'y arriveras jamais. » J'ai souri."), des listes quand elles servent le propos, des citations intégrées dans le flux du texte.
10. FORMULES MÉMORABLES : Crée des phrases que le lecteur voudra souligner, partager, retenir. Des aphorismes originaux, pas des clichés.

STRUCTURE D'ÉCRITURE :
${toneInstruction}

NIVEAU DE LANGUE :
${levelInstruction}

PUBLIC CIBLE :
${audienceInstruction}

FORMAT :
${formatInstruction}

HTML RICHE — UTILISE ABONDAMMENT :
- <p> pour les paragraphes (jamais de murs de texte)
- <h3> pour 2-3 sous-titres créatifs par chapitre (pas "Introduction" ou "Conclusion" — des titres qui intriguent)
- <blockquote> pour citations, versets, dialogues marquants — avec source en <em>
- <strong> pour les formules-chocs et concepts-clés (avec parcimonie — max 3-4 par page)
- <em> pour l'emphase subtile, les titres d'œuvres, les mots étrangers
- <ul><li> ou <ol><li> pour les listes stratégiques (pas systématiques)

MOTS ET EXPRESSIONS INTERDITS (tu seras pénalisé) :
"Il est important de noter", "Il convient de souligner", "Force est de constater", "Dans un monde où", "Il est essentiel de", "En conclusion", "Pour résumer", "Cela dit", "Néanmoins", "En définitive", "En somme", "À cet égard", "Dans cette optique", "Il va sans dire", "indubitablement", "incontestablement", "Il est à noter que".

Tu DOIS créer les chapitres EN FONCTION DU SUJET/IDÉE fourni. Chaque chapitre explore un aspect unique et essentiel du sujet.${styleRefInstruction}
FORMAT DE SORTIE : Retourne un JSON valide. Pas de markdown, pas de code fences.`
      : `You are an ELITE GHOSTWRITER. Not an AI. Not an assistant. A flesh-and-blood writer who has spent 25 years crafting bestsellers, award-winning essays, and spiritual works translated into 40 languages. You write in ${langName}.

🚫 ABSOLUTE RULE — ANTI-AI WRITING 🚫
Your mortal enemy is "AI style": those smooth, predictable, balanced, frictionless, personality-free, soulless sentences. EVERY paragraph you write must pass this test: "Could a human reader guess a machine wrote this?" If yes, REWRITE.

SIGNATURES OF AUTHENTICALLY HUMAN WRITING (MANDATORY):
1. CALCULATED IMPERFECTIONS: Real authors digress ("But before we get there, let me tell you about..."), use asides between dashes — like this one —, parentheses (yes, even in a serious book), sentence fragments. Sometimes.
2. INNER VOICE: You think out loud. "I remember the first time I...", "What has always fascinated me is that...", "I'll admit I resisted this idea for years." The author is PRESENT in the text.
3. ORGANIC RHYTHM: Never two sentences of the same length back to back. Short sentence. Then a development that stretches, takes its time, unfolds a thought across three lines with commas, parenthetical insertions, a long breath. Then another break. Sharp.
4. SENSORY ANCHORING: Smells, sounds, textures, light. "The room smelled of cold coffee and yellowed paper." Not abstractions — sensations.
5. EMBODIED ANECDOTES: Stories with NAMES (even invented but credible ones), specific PLACES, DATES. "In 2019, in Lagos, I met a woman named Amara who..." — not "there was once a person who...".
6. RAW EMOTIONS: Controlled anger ("This is unacceptable, and deep down, we all know it"), wonder ("And then, something miraculous happened"), doubt ("I'm not sure I have the answer, but..."), humility.
7. UNPREDICTABLE TRANSITIONS: NEVER "Furthermore", "Moreover", "Additionally", "It is important to note". These connectors are the HALLMARK of AI. Instead use: a line break, a question ("But then why?"), an image ("It's like when you..."), a confession ("It took me years to understand that...").
8. BOLD OPINIONS: Real authors dare. "I'm convinced that...", "It's a fundamental mistake to think that...", "Contrary to popular belief...". No tepid false neutrality.
9. STRUCTURAL VARIETY: A paragraph can be a single sentence. The next can be 10 lines. Use reconstructed dialogues ("He looked at me and said, 'You'll never make it.' I smiled."), lists when they serve the point, quotes woven into the text flow.
10. MEMORABLE FORMULAS: Create sentences readers will want to underline, share, remember. Original aphorisms, not clichés.

WRITING STRUCTURE:
${toneInstruction}

LANGUAGE LEVEL:
${levelInstruction}

TARGET AUDIENCE:
${audienceInstruction}

FORMAT:
${formatInstruction}

RICH HTML — USE ABUNDANTLY:
- <p> for paragraphs (never walls of text)
- <h3> for 2-3 creative sub-headings per chapter (not "Introduction" or "Conclusion" — intriguing titles)
- <blockquote> for quotes, verses, striking dialogues — with source in <em>
- <strong> for power phrases and key concepts (sparingly — max 3-4 per page)
- <em> for subtle emphasis, work titles, foreign words
- <ul><li> or <ol><li> for strategic lists (not systematic)

BANNED WORDS AND EXPRESSIONS (you will be penalized):
"It is important to note", "It should be emphasized", "In today's world", "It is essential to", "In conclusion", "To summarize", "That being said", "Nevertheless", "In essence", "In this regard", "It goes without saying", "undoubtedly", "unquestionably", "It is worth noting that", "Furthermore", "Moreover".

You MUST create chapters BASED ON THE TOPIC/IDEA provided. Each chapter explores a unique and essential aspect of the topic.${styleRefInstruction}
OUTPUT FORMAT: Return valid JSON. No markdown, no code fences.`;


    let userPrompt: string;

    if (singleChapter) {
      userPrompt = lang === 'fr'
        ? `Sujet du chapitre : ${topic}

Écris ce chapitre UNIQUE comme si tu étais au milieu d'un livre que tu adores écrire. Ce chapitre n'est pas une dissertation — c'est un MOMENT dans un livre. Il a un début qui accroche, un milieu qui captive, une fin qui donne envie de tourner la page.

RÈGLES POUR CE CHAPITRE :
- Commence par une scène, une question provocatrice ou une anecdote — JAMAIS par une définition
- Inclus au moins 1 histoire concrète avec des noms et des lieux
- 2-3 sous-titres <h3> créatifs (pas "Introduction" ou "Développement")
- Au moins 1 citation ou formule mémorable en <blockquote>
- Varie la longueur des paragraphes : certains de 1-2 phrases, d'autres plus longs
- INTERDITS : "De plus", "En outre", "Il est important de noter", "Force est de constater"
- Le lecteur doit sentir qu'un humain passionné a écrit, pas une machine
- Environ ${chapterWordTarget} mots en HTML riche

Retourne UNIQUEMENT un JSON :
{
  "chapters": [
    {"id": "ch-1", "title": "${chapterTitle || 'Chapitre'}", "content": "<p>Contenu...</p>"}
  ]
}`
        : `Chapter topic: ${topic}

Write this SINGLE chapter as if you're in the middle of a book you love writing. This chapter is not an essay — it's a MOMENT in a book. It has a hooking opening, a captivating middle, and an ending that makes you want to turn the page.

RULES FOR THIS CHAPTER:
- Start with a scene, a provocative question, or an anecdote — NEVER with a definition
- Include at least 1 concrete story with names and places
- 2-3 creative <h3> sub-headings (not "Introduction" or "Development")
- At least 1 quote or memorable formula in <blockquote>
- Vary paragraph lengths: some 1-2 sentences, others longer
- BANNED: "Furthermore", "Moreover", "It is important to note", "It should be emphasized"
- The reader must feel a passionate human wrote this, not a machine
- Around ${chapterWordTarget} words in rich HTML

Return ONLY JSON:
{
  "chapters": [
    {"id": "ch-1", "title": "${chapterTitle || 'Chapter'}", "content": "<p>Content...</p>"}
  ]
}`;
    } else {
      userPrompt = lang === 'fr'
        ? `Écris un livre COMPLET, CAPTIVANT et PROFONDÉMENT HUMAIN sur ce sujet :

TITRE : "${title}"
${topic ? `IDÉE / SUJET : ${topic}` : ''}
LANGUE : ${langName}

INSTRUCTIONS DE RÉDACTION :
- Exactement ${chapterCount} chapitres, chacun explorant une facette unique et essentielle de "${topic || title}"
- Titres de chapitres CRÉATIFS et INTRIGANTS — jamais "Introduction", "Chapitre 1: Le sujet", "Conclusion". Surprends le lecteur dès le sommaire.
- Chaque chapitre : environ ${chapterWordTarget} mots de contenu RICHE en HTML
- COMMENCE le chapitre 1 par une scène, une anecdote ou une question provocatrice — JAMAIS par une définition ou un état des lieux
- TERMINE le dernier chapitre par quelque chose de MÉMORABLE — une histoire qui boucle, un appel personnel, une image forte — JAMAIS par un résumé
- CHAQUE chapitre doit contenir au minimum : 1 anecdote concrète avec noms/lieux, 2-3 sous-titres <h3> intrigants, 1 citation ou formule mémorable en <blockquote>
- INTERDICTION de commencer deux paragraphes consécutifs par le même mot
- INTERDICTION d'utiliser les transitions "De plus", "En outre", "Par ailleurs", "Il est important de noter"
- VARIE la longueur des paragraphes : certains de 1-2 phrases, d'autres de 6-8 phrases
- Utilise des dialogues reconstitués quand c'est pertinent
- Le lecteur doit SENTIR qu'un être humain passionné a écrit ce livre, pas une machine

Retourne UNIQUEMENT un JSON valide :
{
  "chapters": [
    {"id": "ch-1", "title": "Un titre créatif qui intrigue...", "content": "<h3>Sous-titre accrocheur</h3><p>Il pleuvait ce matin-là quand j'ai compris que...</p>"},
    {"id": "ch-2", "title": "Un autre titre surprenant...", "content": "..."}
  ]
}

RAPPEL : ${pages} pages sur "${topic || title}". Chaque chapitre ≈ ${chapterWordTarget} mots. Qualité d'un best-seller. Zéro écriture robotique.`
        : `Write a COMPLETE, CAPTIVATING and DEEPLY HUMAN book on this topic:

TITLE: "${title}"
${topic ? `IDEA / TOPIC: ${topic}` : ''}
LANGUAGE: ${langName}

WRITING INSTRUCTIONS:
- Exactly ${chapterCount} chapters, each exploring a unique and essential facet of "${topic || title}"
- Chapter titles must be CREATIVE and INTRIGUING — never "Introduction", "Chapter 1: The Topic", "Conclusion". Surprise the reader from the table of contents.
- Each chapter: around ${chapterWordTarget} words of RICH HTML content
- START chapter 1 with a scene, anecdote, or provocative question — NEVER with a definition or overview
- END the last chapter with something MEMORABLE — a story that comes full circle, a personal call, a powerful image — NEVER with a summary
- EVERY chapter must contain at minimum: 1 concrete anecdote with names/places, 2-3 intriguing <h3> sub-headings, 1 quote or memorable formula in <blockquote>
- NEVER start two consecutive paragraphs with the same word
- NEVER use transitions like "Furthermore", "Moreover", "Additionally", "It is important to note"
- VARY paragraph lengths: some 1-2 sentences, others 6-8 sentences
- Use reconstructed dialogues when relevant
- The reader must FEEL that a passionate human being wrote this book, not a machine

Return ONLY valid JSON:
{
  "chapters": [
    {"id": "ch-1", "title": "A creative intriguing title...", "content": "<h3>Catchy sub-heading</h3><p>It was raining that morning when I realized that...</p>"},
    {"id": "ch-2", "title": "Another surprising title...", "content": "..."}
  ]
}

REMINDER: ${pages}-page book on "${topic || title}". Each chapter ≈ ${chapterWordTarget} words. Bestseller quality. Zero robotic writing.`;
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
