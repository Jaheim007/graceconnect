import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ═══════════════════════════════════════════════════════════════
// TONE MAP — Grounded, natural, anti-flowery instructions
// Based on analysis of REAL published books:
// - "Le Sorcier Va Mourir" (prayer/spiritual combat)
// - "Gérez Mieux Votre Entreprise" (professional manual)
// - "Ce que j'aurais aimé savoir avant de me marier" (personal dev)
// ═══════════════════════════════════════════════════════════════

const toneMap: Record<string, Record<string, string>> = {
  fr: {
    professional: `Ton d'un auteur qui SAIT de quoi il parle et qui explique clairement. Comme un expert qui donne une conférence — il est précis, structuré, va droit au but. Il utilise des données, des exemples concrets, des cas réels. Il n'embellit pas, il ne dramatise pas. Il dit les choses telles qu'elles sont. Ses phrases sont nettes. Il peut interpeller le lecteur ("Posez-vous la question...") mais sans excès. Il assume ses positions avec autorité. ZÉRO poésie, ZÉRO métaphore inutile. Le style est celui d'un bon article de fond, pas d'un roman.`,
    conversational: `Ton d'un ami sage qui partage son vécu autour d'un café. Il raconte SA vie, SES erreurs, SES leçons — avec des prénoms réels, des situations précises ("Quand j'ai rencontré Marie en 2015...", "Je me souviens du jour où..."). Il alterne entre anecdotes personnelles et conseils pratiques. Il pose des questions au lecteur ("Vous vous êtes déjà retrouvé dans cette situation ?"). Il utilise un langage courant, des expressions naturelles. Il est chaleureux mais jamais mièvre. Pas de grandes envolées lyriques — juste un être humain qui parle à un autre être humain.`,
    humorous: `Ton d'un chroniqueur qui fait sourire en disant la vérité. L'humour vient de l'observation fine du quotidien, de l'autodérision, des situations absurdes que tout le monde connaît. Pas de blagues forcées. L'humour est AU SERVICE du message — il rend les idées mémorables. Le style est celui d'une bonne chronique de radio ou d'un stand-up intelligent. Derrière chaque trait d'esprit, il y a une vérité utile.`,
    spiritual: `Ton d'un prédicateur/leader spirituel qui parle avec AUTORITÉ et CONVICTION. Il cite les Écritures avec les références complètes (livre, chapitre, verset) et les explique concrètement. Il interpelle directement le lecteur : "Mesdames et messieurs", "Écoutez bien", "Vous devez comprendre que...". Il ne tourne pas autour du pot. Il est FERME, DIRECT, PUISSANT. Il donne des instructions claires ("Faites ceci", "Priez ainsi"). Il utilise des listes numérotées pour structurer ses enseignements. Il n'est PAS doux ni rêveur — il est un guerrier spirituel qui enseigne avec force. Style similaire à un sermon percutant, pas à un poème mystique.`,
    poetic: `Ton littéraire assumé — ici et UNIQUEMENT ici, les métaphores, les images, le rythme poétique sont bienvenus. Prose ciselée avec des descriptions sensorielles (odeurs, textures, sons, lumières). Phrases courtes qui claquent alternant avec des périodes longues. Ce ton est RÉSERVÉ aux œuvres explicitement littéraires/poétiques. Ne jamais l'appliquer par défaut.`,
    academic: `Ton d'un chercheur rigoureux qui vulgarise sans simplifier. Chaque affirmation est sourcée ou argumentée. Il structure sa pensée : hypothèse, développement, conclusion. Il utilise des études, des statistiques, des théories nommées. Mais il reste lisible — pas de jargon inaccessible. Il commence souvent par un cas concret avant de monter vers la théorie. Le style ressemble à un cours magistral passionnant, pas à un article de journal scientifique.`,
  },
  en: {
    professional: `Tone of an author who KNOWS their subject and explains clearly. Like an expert giving a talk — precise, structured, to the point. Uses data, concrete examples, real cases. Doesn't embellish or dramatize. States things as they are. Sentences are crisp. May address the reader ("Ask yourself...") but without excess. Owns their positions with authority. ZERO poetry, ZERO unnecessary metaphors. Style of a solid long-form article, not a novel.`,
    conversational: `Tone of a wise friend sharing their experience over coffee. They tell THEIR life, THEIR mistakes, THEIR lessons — with real names, specific situations ("When I met Sarah in 2015...", "I remember the day when..."). Alternates between personal stories and practical advice. Asks the reader questions ("Have you been in this situation?"). Uses everyday language, natural expressions. Warm but never sappy. No lyrical flights — just one human being talking to another.`,
    humorous: `Tone of a columnist who makes you smile while telling the truth. Humor comes from keen observation of everyday life, self-deprecation, absurd situations everyone knows. No forced jokes. Humor SERVES the message — makes ideas memorable. Style of a good radio column or smart stand-up. Behind every witticism lies a useful truth.`,
    spiritual: `Tone of a preacher/spiritual leader speaking with AUTHORITY and CONVICTION. Quotes Scripture with full references (book, chapter, verse) and explains them concretely. Directly addresses the reader: "Ladies and gentlemen", "Listen carefully", "You must understand that...". Doesn't beat around the bush. Is FIRM, DIRECT, POWERFUL. Gives clear instructions ("Do this", "Pray like this"). Uses numbered lists to structure teachings. Is NOT soft or dreamy — is a spiritual warrior teaching with force. Style like a hard-hitting sermon, not a mystic poem.`,
    poetic: `Literary tone — here and ONLY here, metaphors, imagery, poetic rhythm are welcome. Crafted prose with sensory descriptions. Short sharp sentences alternating with long flowing periods. This tone is RESERVED for explicitly literary/poetic works. Never apply by default.`,
    academic: `Tone of a rigorous researcher who popularizes without oversimplifying. Every claim is sourced or argued. Structures thought: hypothesis, development, conclusion. Uses studies, statistics, named theories. But stays readable — no inaccessible jargon. Often starts with a concrete case before building to theory.`,
  },
  es: {
    professional: `Tono de un experto que SABE de lo que habla y explica con claridad. Preciso, estructurado, directo. Datos concretos, ejemplos reales. CERO poesía, CERO metáforas innecesarias.`,
    conversational: `Tono de un amigo sabio compartiendo su experiencia. Cuenta SU vida, SUS errores, con nombres y situaciones reales. Alterna entre anécdotas personales y consejos prácticos. Lenguaje cotidiano, natural.`,
    humorous: `Tono de un cronista que hace sonreír diciendo la verdad. Humor al servicio del mensaje. Autodepreciación, situaciones absurdas del cotidiano.`,
    spiritual: `Tono de un líder espiritual que habla con AUTORIDAD. Cita las Escrituras con referencias completas. Interpela directamente: "Escuchen bien". FIRME, DIRECTO, PODEROSO. Instrucciones claras. Listas numeradas.`,
    poetic: `Tono literario — SOLO aquí se permiten metáforas e imágenes poéticas. Reservado para obras explícitamente literarias.`,
    academic: `Tono de investigador riguroso que vulgariza sin simplificar. Afirmaciones argumentadas, estudios citados, estructura clara.`,
  },
  pt: {
    professional: `Tom de especialista que explica com clareza. Preciso, estruturado, direto. Dados concretos, exemplos reais. ZERO poesia.`,
    conversational: `Tom de amigo sábio partilhando experiência. Conta a SUA vida com nomes e situações reais. Linguagem natural.`,
    humorous: `Tom de cronista que faz sorrir dizendo a verdade. Humor ao serviço da mensagem.`,
    spiritual: `Tom de líder espiritual com AUTORIDADE. Citações com referências completas. FIRME, DIRETO, PODEROSO.`,
    poetic: `Tom literário — APENAS aqui se permitem metáforas e imagens poéticas.`,
    academic: `Tom de investigador rigoroso que populariza sem simplificar.`,
  },
  de: {
    professional: `Ton eines Experten der WEISS wovon er spricht und klar erklärt. Präzise, strukturiert, direkt. KEINE Poesie, KEINE unnötigen Metaphern.`,
    conversational: `Ton eines weisen Freundes der seine Erfahrung teilt. Erzählt SEIN Leben mit echten Namen und Situationen. Natürliche Sprache.`,
    humorous: `Ton eines Kolumnisten der zum Lächeln bringt. Humor dient der Botschaft. Selbstironie, absurde Alltagssituationen.`,
    spiritual: `Ton eines geistlichen Führers mit AUTORITÄT. Bibelzitate mit vollständigen Referenzen. FEST, DIREKT, KRAFTVOLL.`,
    poetic: `Literarischer Ton — NUR hier sind Metaphern und poetische Bilder willkommen.`,
    academic: `Ton eines rigorosen Forschers der populär macht ohne zu vereinfachen.`,
  },
  sw: {
    professional: `Sauti ya mtaalamu anayeeleza kwa uwazi. Sahihi, iliyoundwa, ya moja kwa moja. SIFURI ushairi.`,
    conversational: `Sauti ya rafiki mwenye hekima anayeshiriki uzoefu. Lugha ya asili, hadithi za kweli.`,
    humorous: `Sauti ya mwandishi wa habari anayekufanya utabasamu. Ucheshi unatumikia ujumbe.`,
    spiritual: `Sauti ya kiongozi wa kiroho na MAMLAKA. Maandiko na marejeleo kamili. IMARA, ya MOJA kwa MOJA.`,
    poetic: `Sauti ya fasihi — HAPA TU sitiari na picha za kishairi zinaruhusiwa.`,
    academic: `Sauti ya mtafiti mkali anayeeleza bila kupunguza.`,
  },
};

// ─── Language level instructions ───
const levelMap: Record<string, Record<string, string>> = {
  fr: {
    simple: `Vocabulaire simple, phrases courtes (max 15-20 mots). Compréhensible par un enfant de 12 ans. Pas de jargon. Explique chaque concept.`,
    intermediate: `Vocabulaire courant avec quelques termes spécialisés expliqués. Phrases de longueur moyenne. Grand public éduqué.`,
    advanced: `Vocabulaire riche et varié. Termes techniques possibles, style soutenu. Pour un lectorat cultivé.`,
  },
  en: {
    simple: `Simple vocabulary, short sentences (max 15-20 words). Understandable by a 12-year-old. No jargon. Explain every new concept.`,
    intermediate: `Common vocabulary with some specialized terms explained in context. Medium-length sentences. Educated general public.`,
    advanced: `Rich, varied vocabulary. Technical terms possible, sophisticated style. For well-read audience.`,
  },
  es: {
    simple: `Vocabulario simple, oraciones cortas (máximo 15-20 palabras). Comprensible por un niño de 12 años.`,
    intermediate: `Vocabulario corriente con términos especializados explicados. Público general educado.`,
    advanced: `Vocabulario rico y variado. Términos técnicos posibles. Para lectores cultos.`,
  },
  pt: {
    simple: `Vocabulário simples, frases curtas. Compreensível por criança de 12 anos.`,
    intermediate: `Vocabulário corrente com termos explicados. Público geral educado.`,
    advanced: `Vocabulário rico e variado. Para leitores cultos.`,
  },
  de: {
    simple: `Einfaches Vokabular, kurze Sätze. Verständlich für 12-Jährige.`,
    intermediate: `Gebräuchliches Vokabular mit erklärten Fachbegriffen. Gebildetes Publikum.`,
    advanced: `Reiches Vokabular. Fachbegriffe möglich. Für gebildete Leser.`,
  },
  sw: {
    simple: `Maneno rahisi, sentensi fupi. Inaeleweka na mtoto wa miaka 12.`,
    intermediate: `Maneno ya kawaida na istilahi zilizofafanuliwa. Hadhira yenye elimu.`,
    advanced: `Maneno tajiri na tofauti. Kwa wasomaji wenye elimu.`,
  },
};

// ─── Target audience instructions ───
const audienceMap: Record<string, Record<string, string>> = {
  fr: {
    general: `Public général, tout âge. Contenu universel et inclusif. Exemples transgénérationnels.`,
    children: `Enfants (6-12 ans). Langage simple et imagé, histoires courtes, personnages avec des NOMS. Dialogues naturels. Chaque chapitre a une leçon douce, jamais moralisatrice.`,
    teens: `Adolescents (13-18 ans). Ton dynamique et authentique. Exemples de la vraie vie (école, amitié, identité, réseaux sociaux). Références culturelles actuelles.`,
    adults: `Adultes. Réflexions profondes qui résonnent avec l'expérience vécue — défis professionnels, relations, quête de sens. Analyses nuancées.`,
    seniors: `Seniors. Ton respectueux et chaleureux. Références classiques. Sagesse présentée comme des trésors partagés.`,
    professionals: `Professionnels et experts. Données concrètes, études de cas détaillées, méthodologies applicables immédiatement. Le lecteur doit pouvoir AGIR dès la fin de chaque chapitre.`,
  },
  en: {
    general: `General audience, all ages. Universal, inclusive content. Cross-generational examples.`,
    children: `Children (6-12). Simple vivid language, short stories, characters with NAMES. Natural dialogues. Gentle life lessons, never preachy.`,
    teens: `Teenagers (13-18). Dynamic, authentic tone. Real-life examples. Current cultural references.`,
    adults: `Adults. Deep reflections resonating with lived experience. Nuanced analyses.`,
    seniors: `Seniors. Respectful, warm tone. Classic references. Wisdom as shared treasures.`,
    professionals: `Professionals and experts. Concrete data, case studies, actionable methodologies. Reader should ACT by chapter end.`,
  },
  es: {
    general: `Público general. Contenido universal e inclusivo.`,
    children: `Niños (6-12). Lenguaje simple, historias cortas, personajes con NOMBRES.`,
    teens: `Adolescentes (13-18). Tono auténtico, ejemplos reales.`,
    adults: `Adultos. Reflexiones profundas, análisis matizados.`,
    seniors: `Personas mayores. Tono respetuoso y cálido.`,
    professionals: `Profesionales. Datos concretos, metodologías aplicables.`,
  },
  pt: {
    general: `Público geral. Conteúdo universal e inclusivo.`,
    children: `Crianças (6-12). Linguagem simples, histórias curtas.`,
    teens: `Adolescentes (13-18). Tom autêntico, exemplos reais.`,
    adults: `Adultos. Reflexões profundas.`,
    seniors: `Idosos. Tom respeitoso e caloroso.`,
    professionals: `Profissionais. Dados concretos, metodologias aplicáveis.`,
  },
  de: {
    general: `Allgemeines Publikum. Universeller Inhalt.`,
    children: `Kinder (6-12). Einfache Sprache, kurze Geschichten.`,
    teens: `Teenager (13-18). Authentischer Ton, echte Beispiele.`,
    adults: `Erwachsene. Tiefe Reflexionen.`,
    seniors: `Senioren. Respektvoller, warmer Ton.`,
    professionals: `Fachleute. Konkrete Daten, anwendbare Methoden.`,
  },
  sw: {
    general: `Hadhira ya jumla. Maudhui ya ulimwengu.`,
    children: `Watoto (6-12). Lugha rahisi, hadithi fupi.`,
    teens: `Vijana (13-18). Sauti ya kweli, mifano halisi.`,
    adults: `Watu wazima. Tafakuri za kina.`,
    seniors: `Wazee. Sauti ya heshima na joto.`,
    professionals: `Wataalamu. Data halisi, mbinu zinazoweza kutumika.`,
  },
};

// ═══════════════════════════════════════════════════════════════
// STYLE FORMAT MAP — Detailed structural guidance from REAL books
// ═══════════════════════════════════════════════════════════════

const styleFormatMap: Record<string, Record<string, string>> = {
  fr: {
    ebook: `STRUCTURE DE VRAI LIVRE DE DÉVELOPPEMENT PERSONNEL (inspiré de Myles Munroe "Understanding Your Potential" et Gary Chapman) :

STRUCTURE OBLIGATOIRE DU LIVRE :
1. PREMIER CHAPITRE = "Introduction" ou "Préface" — L'auteur pose LE PROBLÈME central avec une anecdote forte ou une histoire marquante. Il explique POURQUOI il écrit ce livre et ce que le lecteur va en tirer.
2. CHAPITRES CENTRAUX — Chaque chapitre développe UN aspect du sujet :
   - Commence par une affirmation forte, une question ou une courte histoire
   - Développe l'idée avec des exemples CONCRETS (noms, lieux, dates, situations réelles)
   - Inclut des listes à puces quand c'est pertinent (ex: liste des échecs de Lincoln avant sa victoire)
   - Utilise des citations en <blockquote> avec la source
   - Termine par des QUESTIONS DE RÉFLEXION ou "Points à retenir" (3-5 questions pratiques)
3. DERNIER CHAPITRE = Conclusion ou "Osez croire" — Synthèse et appel à l'action

TITRES DES CHAPITRES — Style questions ou affirmations directes :
Exemples RÉELS tirés de vrais livres : "Qui êtes-vous ?", "Qu'est-il arrivé au vrai vous ?", "La clé de votre potentiel", "Si seulement j'avais su que..."

FORMAT :
- Paragraphes de 3-5 phrases, JAMAIS de pavés
- Sous-titres <h3> clairs et fonctionnels
- Listes <ul><li> pour les exemples concrets
- <blockquote> pour les citations et principes-clés
- L'auteur ASSUME ses opinions et parle à la première personne`,

    guide: `STRUCTURE DE VRAI MANUEL PRATIQUE (style "Gérez Mieux Votre Entreprise" de l'OIT) :

STRUCTURE OBLIGATOIRE :
1. PREMIER CHAPITRE = Introduction méthodologique — "Ce que vous allez apprendre", "Comment utiliser ce guide"
2. CHAPITRES = Parties numérotées avec sous-sections (1.1, 1.2, 1.3)
3. DERNIER CHAPITRE = Résumé + Plan d'action

CHAQUE CHAPITRE DOIT CONTENIR :
- Un OBJECTIF clair en début ("À la fin de ce chapitre, vous saurez...")
- Des CAS PRATIQUES avec noms fictifs (ex: "M. Kouadio, propriétaire d'une boutique à Abidjan...")
- Des EXERCICES pratiques : questions, situations à résoudre, espaces de réflexion
- Des LISTES structurées <ol><li> et <ul><li>
- Des encadrés <blockquote> pour les INFORMATIONS IMPORTANTES
- Un RÉSUMÉ en fin de chapitre

TITRES 100% FONCTIONNELS :
"Qu'est-ce que X ?", "Comment faire Y ?", "Les 5 étapes pour Z", "Erreurs courantes à éviter"

ZÉRO narration littéraire, ZÉRO métaphore — c'est un OUTIL de travail`,

    prayers: `STRUCTURE DE VRAI LIVRE DE COMBAT SPIRITUEL (inspiré de D.K. Olukoya "Commander le Matin" et "Le Sorcier Va Mourir") :

STRUCTURE OBLIGATOIRE :
1. PREMIER CHAPITRE = Enseignement fondamental qui pose le CADRE SPIRITUEL avec autorité. Explique le POURQUOI du combat.
2. CHAPITRES CENTRAUX = Alternance entre :
   - ENSEIGNEMENT BIBLIQUE avec versets en <blockquote> suivis d'EXPLICATIONS concrètes
   - TÉMOIGNAGES RÉELS (histoires de délivrance, exemples de la vraie vie avec noms et situations)
   - POINTS DE PRIÈRE NUMÉROTÉS (10-21 prières par section)
3. DERNIER CHAPITRE = Section de prières intensives / déclarations de victoire

STYLE DES PRIÈRES — Formules DIRECTES et COMMANDANTES :
"1. Tout pouvoir qui [description], meurs au nom de Jésus."
"2. Chaque [ennemi spirituel], je te [action] par le feu, au nom de Jésus."
"3. Ô [élément], lève-toi et [action], au nom de Jésus."

VERSETS BIBLIQUES :
- Cités avec référence COMPLÈTE (Livre chapitre:verset)
- En <blockquote> avec le texte complet
- TOUJOURS suivis d'une EXPLICATION et APPLICATION

SOUS-TITRES EN MAJUSCULES — Style D.K. Olukoya :
"L'AUTORITÉ DU CROYANT", "LE SERPENT MALÉFIQUE", "IGNORANCE COÛTEUSE", "QUESTIONS PERTINENTES"

TON : AUCUNE douceur. C'est un COMBAT. Interpellation directe du lecteur. Autorité totale.`,

    story: `STRUCTURE DE VRAI ROMAN/CONTE (inspiré de "Des larmes d'or vert" de Marie-Amélie Laporte) :

STRUCTURE OBLIGATOIRE :
1. Les PERSONNAGES ont des NOMS complets, des descriptions physiques, un passé, des motivations
2. Les DIALOGUES utilisent le TIRET (—) PAS les guillemets :
   — Cela fait plusieurs mois que je fais attention à toi, dit-il.
   — No problem ! Je ne t'avais pas remarqué.
3. Chaque chapitre a un TITRE ÉVOCATEUR (pas descriptif) : "Espoirs déçus", "Le double visage", "Drôle de pastis"
4. Les DESCRIPTIONS sont SENSORIELLES mais PRÉCISES (lieux réels, dates, contexte social)
5. L'histoire AVANCE dans chaque chapitre — pas de remplissage

FORMAT :
- Longs paragraphes narratifs entrecoupés de dialogues
- Pas de listes, pas de sous-titres — c'est de la PROSE PURE
- Descriptions des LIEUX (ville, rue, intérieur) pour ancrer dans le réel
- Le temps passe : indiquer les dates/saisons ("Septembre 2016", "Un matin glorieux de printemps")`,

    novel: `STRUCTURE ROMANESQUE COMPLÈTE :
- Chapitres immersifs avec arc narratif (situation initiale → conflit → résolution)
- Personnages avec NOMS, traits physiques, voix distinctes
- Dialogues avec tirets (—)
- Descriptions d'ambiance et de lieu
- Tension narrative, rebondissements
- Fin qui donne envie de relire ou qui marque le lecteur`,

    devotional: `STRUCTURE DE MÉDITATIONS QUOTIDIENNES :
- Format numéroté : "Jour 1", "Jour 2"...
- Chaque méditation : verset sacré en <blockquote> avec référence complète → réflexion personnelle de l'auteur → application pratique concrète → prière courte
- Ton intime et personnel, comme un journal spirituel
- L'auteur partage ses PROPRES expériences de foi
- 30 ou 90 jours`,

    activity: `STRUCTURE INTERACTIVE (Cahier d'activités) :
- Exercices variés : quiz, questions de réflexion, espaces à remplir (_____)
- Chaque activité a un objectif pédagogique clair
- Instructions simples et encourageantes
- Réponses en fin de chapitre
- Illustrations décrites entre [crochets]`,
  },
  en: {
    ebook: `REAL PERSONAL DEVELOPMENT BOOK STRUCTURE (inspired by Myles Munroe "Understanding Your Potential" and Gary Chapman):

MANDATORY STRUCTURE:
1. FIRST CHAPTER = "Introduction" or "Preface" — Author states THE PROBLEM with a powerful story or anecdote. Explains WHY they wrote this book.
2. CORE CHAPTERS — Each develops ONE aspect:
   - Starts with a bold statement, question, or short story
   - Develops with CONCRETE examples (names, places, dates, real situations)
   - Includes bullet lists when relevant (e.g., Lincoln's failures list)
   - Uses <blockquote> quotes with sources
   - Ends with REFLECTION QUESTIONS or "Key Takeaways" (3-5 practical questions)
3. LAST CHAPTER = Conclusion or "Dare to Believe" — Synthesis and call to action

CHAPTER TITLES — Questions or direct statements:
Real examples: "Who Are You?", "What Happened to the Real You?", "The Key to Your Potential", "Challenge Your Ability"

FORMAT:
- Paragraphs of 3-5 sentences, NEVER walls of text
- Clear functional <h3> sub-headings
- <ul><li> for concrete examples
- <blockquote> for quotes and key principles
- Author OWNS their opinions and speaks in first person`,

    guide: `REAL PRACTICAL MANUAL STRUCTURE:
- PARTS with numbered sections (1., 2., 3.) and sub-sections (1.1, 1.2)
- 100% FUNCTIONAL titles: "What is X?", "How to Y?", "The 5 steps for Z"
- CASE STUDIES with fictional character/business names
- EXERCISES: reflection questions, scenarios
- <blockquote> for IMPORTANT info boxes
- Summary at end of each section
- ZERO literary narrative, ZERO metaphors — it's a WORK TOOL`,

    prayers: `REAL SPIRITUAL WARFARE BOOK STRUCTURE (inspired by D.K. Olukoya "Commanding the Morning"):
- Biblical TEACHING with full verse references in <blockquote>
- REAL TESTIMONIES (deliverance stories, real-life examples)
- NUMBERED PRAYER POINTS (10-21 per section) — DIRECT, COMMANDING:
  "1. Every power [description], die in the name of Jesus."
  "2. Every [spiritual enemy], I [action] you by fire, in the name of Jesus."
- CAPITALIZED sub-headings: "THE BELIEVER'S AUTHORITY", "COSTLY IGNORANCE"
- NO softness. This is WARFARE.`,

    story: `REAL NOVEL STRUCTURE (inspired by literary fiction):
- Characters with FULL NAMES, physical descriptions, backstory
- Dialogues with dashes (—) not quotes
- EVOCATIVE chapter titles: not descriptive
- SENSORY descriptions anchored in real places and dates
- PURE PROSE: no lists, no sub-headings`,

    novel: `Full novelistic structure: immersive chapters, named characters, dash dialogues (—), narrative arc, tension, resolution.`,
    devotional: `Daily meditations: Day 1, Day 2... Each with verse + personal reflection + application + prayer.`,
    activity: `Interactive: quizzes, fill-in spaces, creative challenges. Clear objectives per activity.`,
  },
  es: {
    ebook: `Estructura de libro real: problema, experiencia del autor, ejemplos concretos, preguntas de reflexión al final de cada capítulo.`,
    guide: `Manual práctico: partes numeradas, casos prácticos con nombres, ejercicios, listas, resúmenes.`,
    prayers: `Libro de combate espiritual: versículos con referencias, testimonios reales, puntos de oración NUMERADOS y COMANDANTES.`,
    story: `Novela: personajes con nombres completos, diálogos con rayas (—), descripciones sensoriales, prosa pura.`,
    novel: `Estructura novelística completa con arco narrativo.`,
    devotional: `Meditaciones diarias numeradas con versículos, reflexión y oración.`,
    activity: `Estructura interactiva con ejercicios y actividades.`,
  },
  pt: {
    ebook: `Estrutura de livro real: problema, experiência do autor, exemplos concretos, perguntas de reflexão.`,
    guide: `Manual prático: partes numeradas, casos práticos, exercícios, resumos.`,
    prayers: `Livro de combate espiritual: versículos com referências, testemunhos reais, pontos de oração NUMERADOS.`,
    story: `Romance: personagens com nomes completos, diálogos com travessões (—), prosa pura.`,
    novel: `Estrutura romanesca completa.`,
    devotional: `Meditações diárias numeradas.`,
    activity: `Estrutura interativa com exercícios.`,
  },
  de: {
    ebook: `Echte Buchstruktur: Problem, Autorenerfahrung, konkrete Beispiele, Reflexionsfragen.`,
    guide: `Praktisches Handbuch: nummerierte Teile, Fallstudien, Übungen, Zusammenfassungen.`,
    prayers: `Geistliches Kampfbuch: Bibelverse mit Referenzen, echte Zeugnisse, NUMMERIERTE Gebetspunkte.`,
    story: `Roman: Figuren mit vollständigen Namen, Dialoge mit Gedankenstrich (—), reine Prosa.`,
    novel: `Romanstruktur mit immersiven Kapiteln.`,
    devotional: `Nummerierte tägliche Meditationen.`,
    activity: `Interaktive Struktur mit Übungen.`,
  },
  sw: {
    ebook: `Muundo wa kitabu halisi: tatizo, uzoefu wa mwandishi, mifano halisi, maswali ya kutafakari.`,
    guide: `Mwongozo wa vitendo: sehemu zilizohesabiwa, mifano, mazoezi, muhtasari.`,
    prayers: `Kitabu cha vita vya kiroho: aya na marejeleo, ushuhuda halisi, pointi za maombi ZILIZOHESABIWA.`,
    story: `Riwaya: wahusika wenye majina kamili, mazungumzo na dashi (—), nathari safi.`,
    novel: `Muundo kamili wa riwaya.`,
    devotional: `Kutafakari za kila siku zilizohesabiwa.`,
    activity: `Muundo wa maingiliano na mazoezi.`,
  },
};

// ─── Language name map ───
const langNameMap: Record<string, string> = {
  fr: 'français', en: 'English', es: 'español', pt: 'português', de: 'Deutsch', sw: 'Kiswahili',
};

function getInstruction(map: Record<string, Record<string, string>>, lang: string, key: string, fallbackKey: string): string {
  const langMap = map[lang] || map['fr'] || map['en'];
  return langMap[key] || langMap[fallbackKey] || Object.values(langMap)[0] || '';
}

const MAX_CHAPTERS = 8;
const MIN_CHAPTERS = 3;
const MIN_VALID_CHAPTER_RATIO = 0.7;
const MAX_RETRIES = 3;

function extractJsonObjectCandidate(raw: string): string | null {
  const text = raw.trim();
  const start = text.indexOf('{');
  if (start < 0) return null;

  let inString = false;
  let escaped = false;
  let depth = 0;

  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (escaped) { escaped = false; continue; }
    if (char === '\\') { escaped = true; continue; }
    if (char === '"') { inString = !inString; continue; }
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
  try { return JSON.parse(cleaned); } catch { return null; }
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
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      max_tokens: 7000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `You repair malformed JSON only. Return ONLY valid JSON with this shape: {"chapters":[{"id":"ch-1","title":"...","content":"<p>...</p>"}]}. Keep HTML in content. Do not summarize.` },
        { role: 'user', content: `Repair this malformed payload into valid JSON. Keep as much original content as possible. Expected chapter count around ${chapterCount}.\n\n${rawContent.slice(0, 80000)}` },
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
  return false;
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════
// ANTI-AI WRITING RULES — The core of producing REAL books
// ═══════════════════════════════════════════════════════════════

function getAntiAiRules(lang: string, style: string): string {
  const isNarrative = ['story', 'novel'].includes(style);
  if (isNarrative) return ''; // Narrative styles can use literary techniques

  if (lang === 'fr') {
    return `

═══ RÈGLES ANTI-IA — PRODUIRE UN VRAI LIVRE, PAS UN LIVRE IA ═══

Tu dois écrire comme un VRAI AUTEUR HUMAIN, pas comme une IA. Voici les différences :

CE QU'UN VRAI AUTEUR FAIT :
✅ Il va DROIT AU BUT — pas de longue introduction qui tourne autour du pot
✅ Il utilise des mots SIMPLES et COURANTS — le mot juste, pas le mot fleuri
✅ Il structure ses idées avec des titres CLAIRS ("Comment faire X", "Les 3 erreurs à éviter", "Pourquoi Y est important")
✅ Il donne des EXEMPLES CONCRETS tirés de la réalité (noms, lieux, chiffres, dates)
✅ Il INTERPELLE le lecteur directement quand c'est naturel
✅ Il alterne phrases courtes et phrases longues NATURELLEMENT
✅ Il a un POINT DE VUE qu'il assume — il ne reste pas neutre sur tout
✅ Il écrit comme il PARLERAIT à quelqu'un — avec sa vraie voix

CE QU'UNE IA FAIT (ET QUE TU NE DOIS JAMAIS FAIRE) :
❌ Commencer par "Dans un monde où...", "Il est important de noter que...", "Depuis la nuit des temps..."
❌ Mettre des métaphores dans chaque paragraphe ("une lumière qui brille", "un chemin sinueux", "une danse entre...")
❌ Utiliser des adjectifs en cascade ("magnifique, resplendissant et inoubliable")
❌ Dramatiser inutilement ("Ce jour-là, tout allait changer à jamais...")
❌ Faire des transitions pompeuses ("Fort de cette compréhension, explorons maintenant...")
❌ Être vague et générique au lieu de donner des détails précis
❌ Terminer chaque chapitre par une phrase "inspirante" artificielle
❌ Utiliser un ton uniformément enthousiaste et positif — un vrai auteur a des moments de doute, de critique, de nuance

MOTS ET EXPRESSIONS STRICTEMENT INTERDITS :
"Force est de constater", "Il est indéniable que", "Dans un monde en perpétuelle évolution",
"Au cœur de", "Un voyage extraordinaire", "Une danse entre", "Tisser les fils de",
"Plonger dans les profondeurs de", "Explorer les méandres de", "Un souffle nouveau",
"Transcender", "Sublimer", "Résonner au plus profond", "Éveiller la conscience",
"Embrasser le changement", "Un monde de possibilités", "La clé réside dans",
"Mosaïque de", "Tapisserie de", "Symphonie de", "Alchimie de"`;
  }

  return `

═══ ANTI-AI WRITING RULES — PRODUCE A REAL BOOK, NOT AN AI BOOK ═══

Write like a REAL HUMAN AUTHOR, not an AI. Here's the difference:

WHAT A REAL AUTHOR DOES:
✅ Gets STRAIGHT TO THE POINT — no long winding introductions
✅ Uses SIMPLE, COMMON words — the right word, not the fancy word
✅ Structures ideas with CLEAR headings ("How to do X", "3 mistakes to avoid", "Why Y matters")
✅ Gives CONCRETE EXAMPLES from reality (names, places, numbers, dates)
✅ ADDRESSES the reader directly when natural
✅ Alternates short and long sentences NATURALLY
✅ Has a POINT OF VIEW and owns it — doesn't stay neutral on everything
✅ Writes like they would TALK to someone — with their real voice

WHAT AN AI DOES (AND YOU MUST NEVER DO):
❌ Start with "In a world where...", "It is important to note...", "Since the dawn of time..."
❌ Put metaphors in every paragraph ("a light that shines", "a winding path", "a dance between...")
❌ Use cascading adjectives ("magnificent, resplendent and unforgettable")
❌ Dramatize unnecessarily ("That day, everything was about to change forever...")
❌ Make pompous transitions ("With this understanding, let us now explore...")
❌ Be vague and generic instead of giving precise details
❌ End every chapter with an artificial "inspirational" sentence
❌ Use a uniformly enthusiastic, positive tone — real authors have doubt, criticism, nuance

STRICTLY BANNED WORDS/PHRASES:
"It goes without saying", "In today's ever-changing world", "At the heart of",
"An extraordinary journey", "A dance between", "Weave the threads of",
"Delve into the depths of", "Explore the intricacies of", "A breath of fresh",
"Transcend", "Elevate", "Resonate deeply", "Awaken consciousness",
"Embrace change", "A world of possibilities", "The key lies in",
"Mosaic of", "Tapestry of", "Symphony of", "Alchemy of"`;
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

    const { title, topic, style, pageCount, language, tone, languageLevel, targetAudience, singleChapter, chapterTitle, styleReference, editorialStrategy } = await req.json();

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
      : chapterCount >= 6 ? '320-520' : '420-650';

    const _tone = tone || 'professional';
    const _level = languageLevel || 'intermediate';
    const _audience = targetAudience || 'general';
    const _style = style || 'ebook';

    const toneInstruction = getInstruction(toneMap, lang, _tone, 'professional');
    const levelInstruction = getInstruction(levelMap, lang, _level, 'intermediate');
    const audienceInstruction = getInstruction(audienceMap, lang, _audience, 'general');
    const formatInstruction = getInstruction(styleFormatMap, lang, _style, 'ebook');
    const antiAiRules = getAntiAiRules(lang, _style);

    // Narrative detection
    const narrativeStyles = ['story', 'novel'];
    const isNarrative = narrativeStyles.includes(_style);

    // Style reference
    let styleRefInstruction = '';
    if (styleReference && styleReference.trim().length > 0) {
      const ref = styleReference.trim();
      styleRefInstruction = lang === 'fr'
        ? `\n\n⚠️ RÉFÉRENCE DE STYLE PRIORITAIRE ⚠️
L'auteur veut que tu écrives dans le style de : «${ref}»
- Si c'est un NOM (auteur, prédicateur, etc.) : reproduis FIDÈLEMENT son style réel — vocabulaire, rythme, niveau de langue, façon de structurer.
- Si c'est un EXTRAIT : analyse et reproduis le style exactement.
- Cette référence ÉCRASE les autres instructions de ton en cas de conflit.
- CHAQUE paragraphe doit sonner comme si ${ref} l'avait écrit.`
        : `\n\n⚠️ PRIORITY STYLE REFERENCE ⚠️
Author wants you to write in the style of: "${ref}"
- If it's a NAME: faithfully reproduce their real style — vocabulary, rhythm, language level, structure.
- If it's an EXCERPT: analyze and reproduce the style exactly.
- This reference OVERRIDES other tone instructions if they conflict.
- EVERY paragraph must sound like ${ref} wrote it.`;
    }

    // Temperature: lower for non-narrative to reduce AI-ness
    const temperature = isNarrative ? 0.8 : 0.5;

    // ═══ BUILD SYSTEM PROMPT ═══
    const systemPrompt = lang === 'fr'
      ? `Tu es un ÉCRIVAIN PROFESSIONNEL. Tu écris en ${langName}.

TON OBJECTIF : Produire un VRAI livre qui ressemble à un livre écrit par un VRAI auteur humain — pas un texte généré par IA.
${antiAiRules}

STYLE D'ÉCRITURE :
${toneInstruction}

NIVEAU DE LANGUE :
${levelInstruction}

PUBLIC CIBLE :
${audienceInstruction}

STRUCTURE ET FORMAT :
${formatInstruction}

HTML — UTILISE :
- <p> pour les paragraphes
- <h3> pour les sous-titres (2-3 par chapitre)
- <blockquote> pour citations, versets ou points importants
- <strong> pour les concepts-clés (avec parcimonie)
- <em> pour l'emphase
- <ul><li> ou <ol><li> pour les listes
${styleRefInstruction}
FORMAT DE SORTIE : JSON valide uniquement. Pas de markdown, pas de code fences.`

      : `You are a PROFESSIONAL WRITER. You write in ${langName}.

YOUR GOAL: Produce a REAL book that reads like it was written by a REAL human author — not AI-generated text.
${antiAiRules}

WRITING STYLE:
${toneInstruction}

LANGUAGE LEVEL:
${levelInstruction}

TARGET AUDIENCE:
${audienceInstruction}

STRUCTURE AND FORMAT:
${formatInstruction}

HTML — USE:
- <p> for paragraphs
- <h3> for sub-headings (2-3 per chapter)
- <blockquote> for quotes, verses, or important points
- <strong> for key concepts (sparingly)
- <em> for emphasis
- <ul><li> or <ol><li> for lists
${styleRefInstruction}
OUTPUT FORMAT: Valid JSON only. No markdown, no code fences.`;

    // ═══ BUILD USER PROMPT ═══
    let userPrompt: string;

    // Style-specific chapter title guidance
    const titleGuidance = lang === 'fr'
      ? (_style === 'guide'
        ? 'Titres 100% FONCTIONNELS : "Qu\'est-ce que X ?", "Comment Y", "Les étapes pour Z". Premier chapitre = "Introduction" ou "Comment utiliser ce guide"'
        : _style === 'prayers'
        ? 'Titres NUMÉROTÉS et DIRECTS en MAJUSCULES : "LES ORDONNANCES DU CIEL", "LE MYSTÈRE DU DEUXIÈME CIEL", "COMMANDER LE MATIN". Sous-titres aussi en MAJUSCULES.'
        : _style === 'ebook'
        ? 'Titres sous forme de QUESTIONS ou AFFIRMATIONS DIRECTES : "Qui êtes-vous ?", "Qu\'est-il arrivé au vrai vous ?", "Osez croire en votre potentiel". Premier chapitre = Introduction/Préface avec anecdote forte.'
        : _style === 'story' || _style === 'novel'
        ? 'Titres ÉVOCATEURS et LITTÉRAIRES : "Espoirs déçus", "Le double visage", "In vino veritas". Pas de titres descriptifs.'
        : 'Titres CLAIRS et DESCRIPTIFS')
      : (_style === 'guide'
        ? '100% FUNCTIONAL titles: "What is X?", "How to Y", "Steps for Z". First chapter = "Introduction" or "How to use this guide"'
        : _style === 'prayers'
        ? 'CAPITALIZED, DIRECT titles: "THE ORDINANCES OF HEAVEN", "THE MYSTERY OF THE SECOND HEAVEN", "COMMANDING THE MORNING"'
        : _style === 'ebook'
        ? 'QUESTION or STATEMENT titles: "Who Are You?", "What Happened to the Real You?", "Dare to Believe in Your Potential". First chapter = Introduction/Preface with strong anecdote.'
        : _style === 'story' || _style === 'novel'
        ? 'EVOCATIVE, LITERARY titles — not descriptive'
        : 'CLEAR, DESCRIPTIVE titles');

    if (singleChapter) {
      userPrompt = lang === 'fr'
        ? `Sujet du chapitre : ${topic}

Écris ce chapitre.

RÈGLES :
- Commence DIRECTEMENT par le contenu — pas d'introduction vague
- 2-3 sous-titres <h3> clairs
- Donne des exemples CONCRETS (noms, situations, chiffres)
- Environ ${chapterWordTarget} mots en HTML
- Écris comme un VRAI auteur, pas comme une IA

Retourne UNIQUEMENT un JSON :
{
  "chapters": [
    {"id": "ch-1", "title": "${chapterTitle || 'Chapitre'}", "content": "<p>Contenu...</p>"}
  ]
}`
        : `Chapter topic: ${topic}

Write this chapter.

RULES:
- Start DIRECTLY with the content — no vague introduction
- 2-3 clear <h3> sub-headings
- Give CONCRETE examples (names, situations, numbers)
- Around ${chapterWordTarget} words in HTML
- Write like a REAL author, not an AI

Return ONLY JSON:
{
  "chapters": [
    {"id": "ch-1", "title": "${chapterTitle || 'Chapter'}", "content": "<p>Content...</p>"}
  ]
}`;
    } else {
      // Editorial strategy injection
      let editorialContext = '';
      if (editorialStrategy && typeof editorialStrategy === 'object') {
        const s = editorialStrategy;
        editorialContext = lang === 'fr'
          ? `\n📋 POSITIONNEMENT ÉDITORIAL :\n- PROBLÈME DU LECTEUR : ${s.reader_problem || ''}\n- PROMESSE DU LIVRE : ${s.book_promise || ''}\n- ANGLE UNIQUE : ${s.unique_angle || ''}\n- THÈSE CENTRALE : ${s.central_thesis || ''}\n⚠️ Chaque chapitre doit servir la thèse et tenir la promesse.\n`
          : `\n📋 EDITORIAL POSITIONING:\n- READER PROBLEM: ${s.reader_problem || ''}\n- BOOK PROMISE: ${s.book_promise || ''}\n- UNIQUE ANGLE: ${s.unique_angle || ''}\n- CENTRAL THESIS: ${s.central_thesis || ''}\n⚠️ Every chapter must serve the thesis and deliver the promise.\n`;
      }

      userPrompt = lang === 'fr'
        ? `Écris un livre COMPLET :

TITRE : "${title}"
${topic ? `SUJET : ${topic}` : ''}
${editorialContext}
INSTRUCTIONS :
- Exactement ${chapterCount} chapitres
- ${titleGuidance}
- Chaque chapitre : environ ${chapterWordTarget} mots en HTML
- COMMENCE chaque chapitre directement par le contenu, pas par une vague introduction
- Donne des exemples CONCRETS et RÉELS
- Écris comme un VRAI auteur humain — avec ta propre voix, tes propres opinions
- Varie la longueur des paragraphes (3-6 phrases max)

Retourne UNIQUEMENT un JSON valide :
{
  "chapters": [
    {"id": "ch-1", "title": "Titre clair", "content": "<h3>Sous-titre</h3><p>Contenu...</p>"},
    {"id": "ch-2", "title": "Titre clair 2", "content": "..."}
  ]
}

RAPPEL : ${pages} pages. Chaque chapitre ≈ ${chapterWordTarget} mots. VRAI livre, pas texte IA.`
        : `Write a COMPLETE book:

TITLE: "${title}"
${topic ? `TOPIC: ${topic}` : ''}
${editorialContext}
INSTRUCTIONS:
- Exactly ${chapterCount} chapters
- ${titleGuidance}
- Each chapter: around ${chapterWordTarget} words in HTML
- START each chapter directly with content, not a vague introduction
- Give CONCRETE, REAL examples
- Write like a REAL human author — with your own voice, your own opinions
- Vary paragraph lengths (3-6 sentences max)

Return ONLY valid JSON:
{
  "chapters": [
    {"id": "ch-1", "title": "Clear title", "content": "<h3>Sub-heading</h3><p>Content...</p>"},
    {"id": "ch-2", "title": "Clear title 2", "content": "..."}
  ]
}

REMINDER: ${pages}-page book. Each chapter ≈ ${chapterWordTarget} words. REAL book, not AI text.`;
    }

    const requestTimeoutMs = singleChapter ? 50_000 : 85_000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);
    const maxTokens = singleChapter ? 3200 : 16000;

    let aiRes: Response | null = null;
    try {
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            max_tokens: maxTokens,
            temperature,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
          signal: controller.signal,
        });

        if (aiRes.ok) break;

        const shouldRetry = (aiRes.status === 429 || aiRes.status >= 500) && attempt < MAX_RETRIES - 1;
        if (shouldRetry) {
          const backoffMs = 900 * (2 ** attempt);
          console.warn(`[generate-book-content] AI request failed (${aiRes.status}), retrying in ${backoffMs}ms`);
          await wait(backoffMs);
          continue;
        }
        break;
      }
    } catch (error) {
      if (isAbortError(error)) {
        return new Response(JSON.stringify({ error: 'Generation timeout. Please retry.' }), {
          status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!aiRes) {
      return new Response(JSON.stringify({ error: 'AI request failed before completion' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

    if (!singleChapter) {
      const minimumExpected = Math.max(2, Math.ceil(chapterCount * MIN_VALID_CHAPTER_RATIO));
      if (normalizedChapters.length < minimumExpected) {
        console.warn(`[generate-book-content] Partial generation detected: got ${normalizedChapters.length}/${chapterCount} chapters`);
        return new Response(JSON.stringify({
          error: `Partial generation (${normalizedChapters.length}/${chapterCount} chapters). Please retry.`,
          partial: true,
          received_chapters: normalizedChapters.length,
          expected_chapters: chapterCount,
        }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
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
