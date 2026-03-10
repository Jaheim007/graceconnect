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
    ebook: `STRUCTURE DE VRAI LIVRE DE DÉVELOPPEMENT / LEADERSHIP (inspiré de Myles Munroe, Gary Chapman et John C. Maxwell) :

STRUCTURE OBLIGATOIRE DU LIVRE :
1. PREMIER CHAPITRE = "Introduction" ou "Fondation" — pose le problème, l'enjeu, la promesse du livre.
2. CHAPITRES CENTRAUX — chaque chapitre traite UN principe opérationnel :
   - OUVERTURE DIRECTE (thèse forte ou question)
   - EXPLICATION structurée en 2-4 sous-parties
   - EXEMPLE concret (personne, organisation, situation réelle)
   - APPLICATION (actions à exécuter)
3. DERNIER CHAPITRE = Synthèse stratégique + plan d'action final

MODÈLES DE TITRES (style auteur humain, non-poétique) :
- Style "loi" (Maxwell) : "ADAPTABLE — Si vous ne changez pas, l'équipe vous changera"
- Style "principe" : "Le principe de X"
- Style "question" : "Qui êtes-vous quand tout vacille ?"

FORMAT :
- Paragraphes nets de 3-5 phrases
- Sous-titres <h3> FONCTIONNELS (pas décoratifs)
- <ol><li> pour étapes / lois / actions
- <blockquote> pour principes clés ou citations sourcées
- Fin de chapitre: "À RETENIR" ou "Questions de réflexion" (3-5 points)`,

    guide: `STRUCTURE DE VRAI MANUEL PROFESSIONNEL / TECHNIQUE (style OIT + manuel métier) :

STRUCTURE OBLIGATOIRE :
1. PREMIER CHAPITRE = "Comment utiliser ce guide" + périmètre + résultat attendu
2. CHAPITRES = progression logique : Diagnostic → Méthode → Mise en œuvre → Contrôle
3. DERNIER CHAPITRE = Feuille de route 30/60/90 jours + checklist de déploiement

CHAQUE CHAPITRE DOIT CONTENIR :
- OBJECTIF clair au début ("À la fin de ce chapitre, vous saurez...")
- MÉTHODE étape par étape (1, 2, 3...)
- CAS PRATIQUE réaliste (nom, contexte, contraintes)
- ERREURS COURANTES + comment les éviter
- CHECKLIST d'exécution ou mini-plan d'action
- RÉSUMÉ opérationnel final

TITRES 100% FONCTIONNELS :
"Qu'est-ce que X ?", "Comment mettre en place Y", "Procédure complète", "Indicateurs à suivre"

INTERDIT : narration romanesque, métaphores fleuries, intro vague. C'est un outil de travail.`,

    prayers: `STRUCTURE ADAPTATIVE DE LIVRE DE PRIÈRES / LIVRE RELIGIEUX :

Ce prompt s'adapte à la tradition et au format choisis par l'utilisateur.

STRUCTURE PAR DÉFAUT (prières chrétiennes simples) :
1. INTRODUCTION : pourquoi prier, comment utiliser ce livre
2. CHAPITRES THÉMATIQUES — chaque chapitre couvre UN thème de prière :
   - Court enseignement introductif (1-2 paragraphes)
   - Verset ou texte sacré en <blockquote> avec référence
   - 5-10 PRIÈRES numérotées, sincères, personnelles
   - Courte méditation ou réflexion finale
3. CHAPITRE FINAL : engagement de prière, bénédiction

STYLE :
- Ton chaleureux, intime, accessible
- Les prières sont à la PREMIÈRE PERSONNE ("Seigneur, je viens à toi...")
- Varier les types : louange, demande, intercession, action de grâce, confession
- Versets/textes sacrés avec références COMPLÈTES

FORMAT :
- <blockquote> pour versets/textes sacrés
- <ol><li> pour prières numérotées
- <em> pour les paroles de prière en italique
- Chaque prière fait 3-6 phrases (pas trop longue, pas trop courte)`,

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

    devotional: `STRUCTURE DE VRAI JOURNAL SPIRITUEL / DÉVOTION QUOTIDIENNE (inspiré de "Jesus Calling" de Sarah Young et "Chaque Jour les Écritures") :

STRUCTURE OBLIGATOIRE :
1. FORMAT NUMÉROTÉ systématique : "Jour 1", "Jour 2"... (ou "Méditation 1", etc.)
2. CHAQUE MÉDITATION suit ce schéma EXACT :
   a) VERSET DU JOUR en <blockquote> avec référence COMPLÈTE (Livre Chapitre:Verset)
   b) RÉFLEXION DE L'AUTEUR — ton intime, personnel, comme un journal. L'auteur parle à la PREMIÈRE PERSONNE de SES expériences ("J'ai vécu un moment où...", "Un matin, en priant, j'ai compris que...")
   c) APPLICATION CONCRÈTE — une action précise pour aujourd'hui ("Aujourd'hui, prenez 5 minutes pour...", "Écrivez dans votre journal...")
   d) PRIÈRE COURTE — 3-5 phrases, personnelle et sincère
3. PROGRESSION THÉMATIQUE sur 30, 60 ou 90 jours (pas des méditations aléatoires)
4. PREMIER JOUR = Introduction + comment utiliser ce journal
5. DERNIER JOUR = Bilan + engagement de persévérance

STYLE :
- Ton intime, chaleureux mais JAMAIS mièvre
- Comme une conversation entre l'auteur et Dieu, que le lecteur écoute
- Versets tirés de DIFFÉRENTS livres de la Bible (pas toujours les mêmes)
- Chaque méditation = 300-500 mots (concis, pas de remplissage)

INTERDIT : sermon magistral, ton académique, listes de règles. C'est un JOURNAL SPIRITUEL, pas un cours de théologie.`,

    activity: `STRUCTURE DE VRAI CAHIER D'ACTIVITÉS / WORKBOOK PROFESSIONNEL (inspiré de cahiers pédagogiques publiés) :

STRUCTURE OBLIGATOIRE :
1. PAGE D'ACCUEIL DU CHAPITRE : titre engageant + icône/emoji + "Ce que tu vas apprendre" (3 points)
2. CHAQUE CHAPITRE = 5-8 ACTIVITÉS VARIÉES parmi :
   - ✏️ QUIZ à choix multiples (A/B/C/D) avec cases à cocher □
   - 📝 QUESTIONS OUVERTES avec lignes de réponse : ___________________________
   - 🧩 EXERCICES DE CORRESPONDANCE (Relie la colonne A à la colonne B)
   - 🎨 ESPACES CRÉATIFS : "Dessine ici..." avec cadre vide [ESPACE DESSIN]
   - 🔍 MOTS CACHÉS ou MOTS CROISÉS (grille formatée en <table>)
   - ✅ VRAI ou FAUX avec cases □ VRAI □ FAUX
   - 📖 TEXTES À TROUS : "Le soleil est une _______ qui produit de la _______ et de la _______."
   - 🎯 DÉFIS PRATIQUES : "Cette semaine, essaie de..."
   - 🗣️ ACTIVITÉS DE GROUPE : "Avec un ami, discutez de..."
   - 📊 TABLEAUX À REMPLIR avec colonnes vides
3. CHAQUE ACTIVITÉ a :
   - Un OBJECTIF PÉDAGOGIQUE clair ("Tu apprendras à...")
   - Des INSTRUCTIONS simples, directes, encourageantes
   - Un NIVEAU DE DIFFICULTÉ visuel (⭐, ⭐⭐, ⭐⭐⭐)
   - De l'ESPACE pour écrire/dessiner (représenté par des lignes, des cases, des cadres)
4. FIN DE CHAPITRE = "📋 CORRIGÉ" avec les réponses des quiz/exercices
5. DERNIER CHAPITRE = "🏆 Certificat de réussite" + bilan des apprentissages

FORMAT HTML SPÉCIFIQUE :
- <table> pour les grilles, correspondances, tableaux à remplir
- <ul><li>□ pour les choix multiples et vrai/faux
- <hr/> entre chaque activité
- <strong>Activité N :</strong> pour numéroter
- [ESPACE DESSIN], [ESPACE RÉPONSE], [LIGNES RÉPONSE] pour les espaces interactifs
- Emojis abondants pour rendre le cahier vivant et engageant

ADAPTATION AU PUBLIC :
- ENFANTS (6-10 ans) : phrases courtes, vocabulaire simple, beaucoup de dessins, couleurs, mascottes
- ADOLESCENTS : défis, quiz culture, activités sociales, ton dynamique
- ADULTES : exercices de réflexion, auto-évaluation, plans d'action, journaling

INTERDIT : longs paragraphes de texte, ton magistral, exercices monotones. C'est un cahier INTERACTIF, pas un manuel scolaire.`,

    coloring: `STRUCTURE DE LIVRE DE COLORIAGE PROFESSIONNEL :

STRUCTURE OBLIGATOIRE :
1. CHAQUE CHAPITRE = 1 THÈME (ex: "Les animaux de la ferme", "Les fruits", "Les véhicules", "Les personnages bibliques")
2. CHAQUE PAGE = 1 SCÈNE À COLORIER décrite entre [ILLUSTRATION: description détaillée]
3. Format MINIMAL de texte — le livre est 90% IMAGES, 10% texte

CONTENU DE CHAQUE PAGE :
- [ILLUSTRATION: Description PRÉCISE et DÉTAILLÉE de la scène en line art — personnages, objets, décor, composition]
- Titre court et fun (ex: "🦁 Le lion courageux", "🌻 Le jardin fleuri")
- Optionnel : 1-2 phrases simples liées à l'image (fait amusant, verset court, consigne créative)

ADAPTATION AU PUBLIC :
- ENFANTS 3-6 ans : formes TRÈS simples, gros contours, peu de détails, 1-2 éléments par page
- ENFANTS 6-10 ans : scènes moyennement détaillées, personnages expressifs, décors
- ADOS/ADULTES : mandalas, motifs complexes, scènes détaillées, patterns zen

FORMAT HTML :
- <h2> pour le titre de chaque page/scène
- <p class="coloring-desc">[ILLUSTRATION: ...]</p> pour la description de chaque illustration à générer
- Très peu de texte entre les illustrations
- Pas de longs paragraphes — ce n'est PAS un livre de lecture

INTERDIT : longs textes, exercices écrits, quiz. C'est un livre VISUEL à colorier.`,
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

    prayers: `ADAPTIVE PRAYER / RELIGIOUS BOOK STRUCTURE:
- Intro: why pray, how to use this book
- Thematic chapters: short teaching + scripture in <blockquote> + 5-10 NUMBERED prayers (first person, sincere)
- Vary prayer types: praise, petition, intercession, thanksgiving, confession
- Final chapter: prayer commitment, blessing
- Warm, intimate, accessible tone
- Complete scripture references`,

    story: `REAL NOVEL STRUCTURE (inspired by literary fiction):
- Characters with FULL NAMES, physical descriptions, backstory
- Dialogues with dashes (—) not quotes
- EVOCATIVE chapter titles: not descriptive
- SENSORY descriptions anchored in real places and dates
- PURE PROSE: no lists, no sub-headings`,

    novel: `Full novelistic structure: immersive chapters, named characters, dash dialogues (—), narrative arc, tension, resolution.`,
    devotional: `REAL DAILY DEVOTIONAL STRUCTURE (inspired by "Jesus Calling", "Our Daily Bread"):
- Numbered format: "Day 1", "Day 2"... (or "Meditation 1", etc.)
- Each entry follows: VERSE in <blockquote> with full reference → AUTHOR'S PERSONAL REFLECTION (first person, intimate) → CONCRETE APPLICATION for today → SHORT PRAYER (3-5 sentences)
- Thematic progression over 30/60/90 days
- First day = intro + how to use this journal
- Tone: intimate, warm, like a spiritual diary. NOT a lecture.`,
    activity: `PROFESSIONAL ACTIVITY BOOK / WORKBOOK STRUCTURE:
1. CHAPTER LANDING: engaging title + emoji + "What you'll learn" (3 points)
2. EACH CHAPTER = 5-8 VARIED ACTIVITIES:
   - ✏️ MULTIPLE CHOICE QUIZ (A/B/C/D) with checkboxes □
   - 📝 OPEN QUESTIONS with answer lines: ___________________________
   - 🧩 MATCHING EXERCISES (Match column A to column B)
   - 🎨 CREATIVE SPACES: "Draw here..." with empty frame [DRAWING SPACE]
   - ✅ TRUE or FALSE with boxes □ TRUE □ FALSE
   - 📖 FILL-IN-THE-BLANK texts
   - 🎯 PRACTICAL CHALLENGES: "This week, try to..."
   - 📊 TABLES TO FILL with empty columns
3. Each activity has: clear objective, simple instructions, difficulty level (⭐⭐⭐)
4. END OF CHAPTER = "📋 ANSWER KEY"
5. LAST CHAPTER = "🏆 Certificate of completion"
HTML: <table> for grids, <ul><li>□ for choices, <hr/> between activities, emojis throughout.
FORBIDDEN: long text paragraphs, lecture tone, monotonous exercises.`,
    coloring: `PROFESSIONAL COLORING BOOK STRUCTURE:
- Each chapter = 1 THEME (animals, vehicles, characters, etc.)
- Each page = 1 SCENE described in [ILLUSTRATION: detailed description of line art scene]
- 90% IMAGES, 10% text. Minimal text — this is a VISUAL book
- Short fun title per page + optional 1-2 sentence fact or instruction
- [ILLUSTRATION: ...] descriptions must be PRECISE for image generation
- Adapt complexity to audience (toddlers=simple shapes, adults=mandalas/detailed patterns)
FORBIDDEN: long paragraphs, quizzes, written exercises. This is for COLORING.`,
  },
  es: {
    ebook: `Estructura de libro real: problema, experiencia del autor, ejemplos concretos, preguntas de reflexión al final de cada capítulo.`,
    guide: `Manual práctico: partes numeradas, casos prácticos con nombres, ejercicios, listas, resúmenes.`,
    prayers: `Libro de oraciones: versículos/textos sagrados con referencias, oraciones NUMERADAS en primera persona, tono cálido e íntimo.`,
    story: `Novela: personajes con nombres completos, diálogos con rayas (—), descripciones sensoriales, prosa pura.`,
    novel: `Estructura novelística completa con arco narrativo.`,
    devotional: `Meditaciones diarias numeradas con versículos, reflexión y oración.`,
    activity: `Estructura interactiva con ejercicios y actividades.`,
    coloring: `Libro de colorear: cada página = 1 escena descrita en [ILUSTRACIÓN: ...]. Mínimo texto, máximo visual.`,
  },
  pt: {
    ebook: `Estrutura de livro real: problema, experiência do autor, exemplos concretos, perguntas de reflexão.`,
    guide: `Manual prático: partes numeradas, casos práticos, exercícios, resumos.`,
    prayers: `Livro de orações: versículos/textos sagrados com referências, orações NUMERADAS em primeira pessoa, tom caloroso.`,
    story: `Romance: personagens com nomes completos, diálogos com travessões (—), prosa pura.`,
    novel: `Estrutura romanesca completa.`,
    devotional: `Meditações diárias numeradas.`,
    activity: `Estrutura interativa com exercícios.`,
    coloring: `Livro de colorir: cada página = 1 cena descrita em [ILUSTRAÇÃO: ...]. Mínimo texto, máximo visual.`,
  },
  de: {
    ebook: `Echte Buchstruktur: Problem, Autorenerfahrung, konkrete Beispiele, Reflexionsfragen.`,
    guide: `Praktisches Handbuch: nummerierte Teile, Fallstudien, Übungen, Zusammenfassungen.`,
    prayers: `Gebetbuch: Bibelverse/heilige Texte mit Referenzen, NUMMERIERTE Gebete in erster Person, warmer Ton.`,
    story: `Roman: Figuren mit vollständigen Namen, Dialoge mit Gedankenstrich (—), reine Prosa.`,
    novel: `Romanstruktur mit immersiven Kapiteln.`,
    devotional: `Nummerierte tägliche Meditationen.`,
    activity: `Interaktive Struktur mit Übungen.`,
    coloring: `Malbuch: jede Seite = 1 Szene beschrieben in [ILLUSTRATION: ...]. Minimaler Text, maximales Visuelles.`,
  },
  sw: {
    ebook: `Muundo wa kitabu halisi: tatizo, uzoefu wa mwandishi, mifano halisi, maswali ya kutafakari.`,
    guide: `Mwongozo wa vitendo: sehemu zilizohesabiwa, mifano, mazoezi, muhtasari.`,
    prayers: `Kitabu cha maombi: aya/maandiko matakatifu na marejeleo, maombi YALIYOHESABIWA kwa nafsi ya kwanza, sauti ya joto.`,
    story: `Riwaya: wahusika wenye majina kamili, mazungumzo na dashi (—), nathari safi.`,
    novel: `Muundo kamili wa riwaya.`,
    devotional: `Kutafakari za kila siku zilizohesabiwa.`,
    activity: `Muundo wa maingiliano na mazoezi.`,
    coloring: `Kitabu cha kupaka rangi: kila ukurasa = eneo 1 lililoelezwa katika [MCHORO: ...]. Maandishi kidogo.`,
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

const MAX_CHAPTERS = 20;
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
  const repairRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: 'You repair malformed JSON only. Return ONLY valid JSON with this shape: {"chapters":[{"id":"ch-1","title":"...","content":"<p>...</p>"}]}. Keep HTML in content. Do not summarize.' }] },
      contents: [{ role: 'user', parts: [{ text: `Repair this malformed payload into valid JSON. Expected ${chapterCount} chapters.\n\n${rawContent.slice(0, 80000)}` }] }],
      generationConfig: { maxOutputTokens: 7000, responseMimeType: 'application/json' },
    }),
  });
  if (!repairRes.ok) return null;
  const repairData = await repairRes.json().catch(() => null);
  const repairedRaw = repairData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
"Mosaïque de", "Tapisserie de", "Symphonie de", "Alchimie de",
"Naviguer dans", "Incarner", "S'épanouir", "Façonner", "Illuminer",
"Vibrer", "Insuffler", "Catalyser", "Rayonner", "Florissant"

STRUCTURE INTERDITE — Ne fais JAMAIS :
❌ Un premier paragraphe qui "présente le chapitre" de manière vague
❌ Un dernier paragraphe qui "résume" avec une phrase inspirante creuse
❌ Des transitions entre chapitres ("Dans le chapitre suivant, nous verrons...")
❌ Des répétitions de la même idée en reformulant 3 fois
❌ Un ton uniformément positif — un vrai auteur est parfois dur, critique, direct`;
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

type EditorialProfile = 'business_manual' | 'leadership' | 'spiritual_warfare' | 'simple_prayers' | 'islamic_devotional' | 'proclamations' | 'religious_teaching' | 'personal_growth' | 'narrative' | 'devotional_journal' | 'activity_workbook' | 'coloring_book';

function detectEditorialProfile(style: string, tone: string, title: string, topic: string, audience: string, religiousTradition?: string, prayerFormat?: string): EditorialProfile {
  const haystack = `${title} ${topic}`.toLowerCase();
  const narrativeStyles = ['story', 'novel'];
  if (narrativeStyles.includes(style)) return 'narrative';

  // Devotional — must be checked BEFORE prayers
  if (style === 'devotional') return 'devotional_journal';

  // Activity book
  if (style === 'activity') return 'activity_workbook';

  // Coloring book
  if (style === 'coloring') return 'coloring_book';

  // ═══ PRAYERS — Route based on religiousTradition + prayerFormat ═══
  if (style === 'prayers') {
    // If user selected a specific format, use it
    if (prayerFormat === 'warfare_prayers') return 'spiritual_warfare';
    if (prayerFormat === 'proclamations') return 'proclamations';
    if (prayerFormat === 'religious_teaching') return 'religious_teaching';
    if (prayerFormat === 'invocations') {
      if (religiousTradition === 'muslim') return 'islamic_devotional';
      return 'simple_prayers';
    }
    if (prayerFormat === 'simple_prayers') return 'simple_prayers';
    
    // Fallback: detect from tradition
    if (religiousTradition === 'muslim') return 'islamic_devotional';
    if (religiousTradition === 'spiritual' || religiousTradition === 'interfaith') return 'simple_prayers';
    
    // Default Christian: check signals for warfare vs simple
    const warfareSignals = ['combat', 'guerre', 'warfare', 'delivrance', 'satan', 'bataille', 'commanding', 'fire'];
    if (warfareSignals.some((w) => haystack.includes(w))) return 'spiritual_warfare';
    return 'simple_prayers';
  }

  // Non-prayer spiritual content
  const spiritualSignals = ['prière', 'priere', 'anges', 'ange', 'spirituel', 'combat', 'delivrance', 'foi', 'satan', 'bataille', 'guerre', 'jesus', 'bible', 'miracle'];
  if (tone === 'spiritual' || spiritualSignals.some((word) => haystack.includes(word))) {
    return 'spiritual_warfare';
  }

  const leadershipSignals = ['leadership', 'équipe', 'equipe', 'manager', 'travail en équipe', 'collaboration', 'influence', 'lois', 'principes'];
  if (leadershipSignals.some((word) => haystack.includes(word))) {
    return 'leadership';
  }

  const businessSignals = ['entreprise', 'business', 'startup', 'marketing', 'vente', 'sales', 'finance', 'gestion', 'productivité', 'productivite', 'technologie', 'tech', 'processus', 'stratégie', 'strategie'];
  if (style === 'guide' || audience === 'professionals' || businessSignals.some((word) => haystack.includes(word))) {
    return 'business_manual';
  }

  return 'personal_growth';
}

function getEditorialBlueprint(lang: string, profile: EditorialProfile): string {
  if (lang === 'fr') {
    switch (profile) {
      case 'spiritual_warfare':
        return `Blueprint guerre spirituelle (chrétien) :
- Progression: fondation doctrinale → application concrète → points de prière impératifs
- Chaque chapitre contient au moins 2 versets complets (Livre Chapitre:Verset) + explication concrète
- Prières COMMANDANTES : "Je déclare...", "J'ordonne...", "Je résiste..."
- Ton ferme, autoritaire. Sous-titres MAJUSCULES. C'est un COMBAT.`;
      case 'simple_prayers':
        return `Blueprint prières simples / dévotionnelles :
- Chaque chapitre = 1 thème de prière (gratitude, guérison, famille, paix...)
- Structure : court enseignement (1-2 §) → texte sacré en blockquote → 5-10 prières NUMÉROTÉES à la 1ère personne
- Ton chaleureux, intime, sincère — PAS un sermon
- Varier les types : louange, demande, intercession, confession, action de grâce
- Adapter au contexte religieux choisi (chrétien, spirituel, etc.)`;
      case 'islamic_devotional':
        return `Blueprint livre de prières / invocations islamiques :
- Chaque chapitre = 1 thème (repentance, protection, guidance, gratitude, famille, santé...)
- Structure : enseignement court avec référence Coran (Sourate:Verset) ou Hadith → Du'as NUMÉROTÉES en arabe translittéré + traduction
- Inclure les formules consacrées : Bismillah, Alhamdulillah, SubhanAllah, Astaghfirullah
- Ton respectueux, humble devant Allah
- Format : <blockquote> pour versets coraniques, <ol><li> pour du'as numérotées
- Chaque du'a = translittération + traduction + contexte d'usage`;
      case 'proclamations':
        return `Blueprint livre de proclamations / déclarations :
- Chaque chapitre = 1 domaine de proclamation (identité, finances, santé, famille, destinée...)
- Structure : fondement scripturaire → DÉCLARATIONS NUMÉROTÉES en MAJUSCULES ou en gras
- "JE DÉCLARE que...", "JE PROCLAME que...", "JE DÉCRÈTE que..."
- Ton fort, affirmatif, sans hésitation
- Chaque proclamation s'appuie sur un texte sacré référencé
- Format : <strong> pour les déclarations, <blockquote> pour les textes fondateurs`;
      case 'religious_teaching':
        return `Blueprint livre d'enseignement religieux / doctrinal :
- Chaque chapitre = 1 principe ou doctrine expliquée en profondeur
- Structure : question/problème → enseignement avec multiples références scripturaires → application pratique
- Citer abondamment les textes sacrés (Bible, Coran, ou autre selon la tradition)
- Ton académique mais accessible — comme un cours de théologie/sciences religieuses
- Terminer chaque chapitre par "Points clés à retenir" + questions de réflexion
- PAS de prières — c'est un livre d'ÉTUDE et de COMPRÉHENSION`;
      case 'business_manual':
        return `Blueprint professionnel/tech :
- Progression: problème métier → méthode → cas pratique → checklist d'exécution
- Chaque chapitre doit livrer un livrable concret (cadre, procédure, indicateurs)
- Titres strictement fonctionnels et explicites
- Interdit: récits romanesques, métaphores décoratives, généralités vagues`;
      case 'leadership':
        return `Blueprint leadership :
- Chaque chapitre = 1 principe fort + 1 phrase-slogan utile + 1 application terrain
- Utiliser des titres mémorables mais fonctionnels (principe + promesse)
- Conclure avec "Actions immédiates" (3 points)
- Interdit: abstractions sans exemple réel`;
      case 'narrative':
        return `Blueprint narratif :
- Arcs de scènes, dialogues crédibles, ancrage temporel et géographique
- Pas de langage de manuel ni de checklist`;
      case 'devotional_journal':
        return `Blueprint dévotion quotidienne :
- Chaque entrée = 1 verset (blockquote) + réflexion intime 1ère personne + application concrète + prière courte
- Progression thématique cohérente sur la durée du journal
- Ton personnel et chaleureux — PAS un sermon, PAS un cours
- Varier les livres bibliques cités (AT + NT)`;
      case 'activity_workbook':
        return `Blueprint cahier d'activités :
- Chaque chapitre = 5-8 activités VARIÉES en types (quiz, vrai/faux, dessin, texte à trous, correspondance, défi)
- Chaque activité = objectif + instructions + espace de réponse + niveau de difficulté
- Corrigé en fin de chapitre
- Adapté au public cible (enfants = simple/coloré, ados = dynamique, adultes = réflexif)
- Format interactif : cases □, lignes _____, tableaux <table>, émojis`;
      case 'coloring_book':
        return `Blueprint livre de coloriage :
- Chaque chapitre = 1 thème visuel (animaux, nature, personnages, véhicules...)
- Chaque page = [ILLUSTRATION: description détaillée de la scène line art] + titre court
- Texte MINIMAL — le livre est à 90% visuel
- Descriptions d'illustrations PRÉCISES pour la génération d'images
- Adapter la complexité au public (enfants = formes simples, adultes = motifs détaillés)`;
      default:
        return `Blueprint développement personnel :
- Question centrale → démonstration → outils concrets → mise en pratique
- Chaque chapitre finit par des questions de réflexion ou actions`;
    }
  }

  switch (profile) {
    case 'spiritual_warfare':
      return `Spiritual warfare blueprint: doctrine foundation → practical application → commanding prayer points. At least 2 full scripture references per chapter. Firm, authoritative tone.`;
    case 'simple_prayers':
      return `Simple prayers blueprint: each chapter = 1 prayer theme. Structure: short teaching + scripture in blockquote + 5-10 NUMBERED first-person prayers. Warm, intimate, sincere tone. Vary types: praise, petition, intercession, confession, thanksgiving.`;
    case 'islamic_devotional':
      return `Islamic prayers blueprint: each chapter = 1 theme. Structure: Quran reference (Surah:Verse) or Hadith + NUMBERED Du'as in transliterated Arabic + translation. Include Bismillah, Alhamdulillah, SubhanAllah. Respectful, humble tone before Allah.`;
    case 'proclamations':
      return `Proclamations blueprint: each chapter = 1 domain (identity, finances, health, family...). NUMBERED DECLARATIONS in bold/caps: "I DECLARE...", "I PROCLAIM...". Each backed by scripture. Strong, affirmative tone.`;
    case 'religious_teaching':
      return `Religious teaching blueprint: each chapter = 1 doctrine/principle. Multiple scripture references. Academic but accessible. End with "Key points" + reflection questions. NO prayers — this is a STUDY book.`;
    case 'business_manual':
      return `Professional blueprint: business problem → method → case study → execution checklist. Functional chapter titles only.`;
    case 'leadership':
      return `Leadership blueprint: one principle per chapter, one memorable line, one field application, then immediate actions.`;
    case 'narrative':
      return `Narrative blueprint: scene arcs, credible dialogue, time/place anchoring, no handbook-style sections.`;
    case 'devotional_journal':
      return `Devotional blueprint: each entry = 1 verse (blockquote) + intimate first-person reflection + concrete application + short prayer. Thematic progression. Warm personal tone, NOT a lecture.`;
    case 'activity_workbook':
      return `Activity workbook blueprint: 5-8 varied activities per chapter (quiz, true/false, matching, fill-in-blank, creative, challenges). Clear objectives, answer key at end. Adapted to target audience.`;
    case 'coloring_book':
      return `Coloring book blueprint: each page = [ILLUSTRATION: detailed line art scene description] + short title. 90% visual, 10% text. Precise descriptions for image generation.`;
    default:
      return `Personal growth blueprint: core question → explanation → practical tools → reader application.`;
  }
}

function getTemperatureForProfile(profile: EditorialProfile, isNarrative: boolean): number {
  if (isNarrative) return 0.8;
  if (profile === 'business_manual') return 0.38;
  if (profile === 'leadership') return 0.42;
  if (profile === 'spiritual_warfare') return 0.45;
  if (profile === 'simple_prayers') return 0.48;
  if (profile === 'islamic_devotional') return 0.45;
  if (profile === 'proclamations') return 0.42;
  if (profile === 'religious_teaching') return 0.40;
  if (profile === 'devotional_journal') return 0.50;
  if (profile === 'activity_workbook') return 0.42;
  if (profile === 'coloring_book') return 0.40;
  return 0.44;
}

function getTitleGuidance(lang: string, style: string, profile: EditorialProfile): string {
  if (lang === 'fr') {
    if (profile === 'business_manual') {
      return 'Titres STRICTEMENT FONCTIONNELS : "Qu’est-ce que X ?", "Procédure Y", "Checklist Z". Premier chapitre = "Comment utiliser ce livre" ou "Fondations".';
    }
    if (profile === 'leadership') {
      return 'Titres de type PRINCIPE + IMPACT : "ADAPTABLE — Si vous ne changez pas, l\'équipe vous changera", "LE PRINCIPE DE CLARTÉ".';
    }
    if (profile === 'spiritual_warfare') {
      return 'Titres DIRECTS ET AUTORITAIRES (souvent en MAJUSCULES) : "IL Y A UNE GUERRE", "VOTRE STATUT EN CHRIST", "DÉCLAREZ LA VICTOIRE".';
    }
    if (profile === 'simple_prayers') {
      return 'Titres thématiques et chaleureux : "Prières pour la paix intérieure", "Gratitude et louange", "Quand le cœur est lourd".';
    }
    if (profile === 'islamic_devotional') {
      return 'Titres respectueux avec formules : "Du\'as pour la guidance divine", "Invocations du matin et du soir", "Se rapprocher d\'Allah".';
    }
    if (profile === 'proclamations') {
      return 'Titres FORTS et AFFIRMATIFS : "JE SUIS BÉNI", "MA DESTINÉE EST SCELLÉE", "DÉCLARATIONS DE VICTOIRE".';
    }
    if (profile === 'religious_teaching') {
      return 'Titres académiques mais accessibles : "Comprendre la grâce", "Les fondements de la foi", "Qu\'enseigne réellement le texte ?".';
    }
    if (profile === 'devotional_journal') {
      return 'Titres numérotés et thématiques : "Jour 1 — La confiance", "Jour 15 — Lâcher prise". Le numéro du jour EST le titre.';
    }
    if (profile === 'activity_workbook') {
      return 'Titres engageants et ludiques : "🎯 Chapitre 3 : Découvre tes talents !", "🧩 Les animaux du monde". Utiliser des emojis.';
    }
    if (profile === 'coloring_book') {
      return 'Titres courts et visuels : "🦁 Les animaux de la savane", "🌸 Le jardin enchanté", "🚀 L\'espace". Emojis + thème.';
    }
    if (style === 'story' || style === 'novel') {
      return 'Titres ÉVOCATEURS et littéraires, non techniques.';
    }
    return 'Titres clairs, précis, orientés problème/résultat.';
  }

  if (profile === 'business_manual') return 'STRICTLY functional titles: "What is X?", "Procedure Y", "Checklist Z".';
  if (profile === 'leadership') return 'Principle-driven titles with impact promise.';
  if (profile === 'spiritual_warfare') return 'Direct, authoritative, often capitalized titles.';
  if (profile === 'simple_prayers') return 'Warm thematic titles: "Prayers for Inner Peace", "Gratitude and Praise".';
  if (profile === 'islamic_devotional') return 'Respectful titles with formulas: "Du\'as for Divine Guidance", "Morning and Evening Invocations".';
  if (profile === 'proclamations') return 'STRONG affirmative titles: "I AM BLESSED", "DECLARATIONS OF VICTORY".';
  if (profile === 'religious_teaching') return 'Academic but accessible: "Understanding Grace", "What Does the Text Really Teach?".';
  if (profile === 'devotional_journal') return 'Numbered thematic titles: "Day 1 — Trust", "Day 15 — Letting Go".';
  if (profile === 'activity_workbook') return 'Engaging playful titles with emojis: "🎯 Chapter 3: Discover Your Talents!"';
  if (profile === 'coloring_book') return 'Short visual titles with emojis: "🦁 Safari Animals", "🌸 Enchanted Garden"';
  if (style === 'story' || style === 'novel') return 'Evocative literary titles.';
  return 'Clear, precise, result-oriented titles.';
}

import { requireAuth, corsHeaders as sharedCors, jsonResp as jResp, adminClient } from '../_shared/auth.ts';
import { consumeCreditsOrThrow, refundCreditsAsBonus, normalizeTier } from '../_shared/credits.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auth + credit debit
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;
    const admin = adminClient(auth.supabaseUrl, auth.serviceKey);

    const { title, subtitle, authorName, topic, style, pageCount, chapterCount: requestedChapterCount, keywords, language, tone, languageLevel, targetAudience, singleChapter, chapterTitle, styleReference, editorialStrategy, religiousTradition, prayerFormat, tier } = await req.json();

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
      : Number(requestedChapterCount) > 0
        ? Math.max(MIN_CHAPTERS, Math.min(MAX_CHAPTERS, Number(requestedChapterCount)))
        : Math.max(MIN_CHAPTERS, Math.min(MAX_CHAPTERS, Math.round(pages / 5)));
    const chapterWordTarget = singleChapter
      ? '450-700'
      : chapterCount >= 6 ? '320-520' : '420-650';
    const subtitleLine = subtitle ? (lang === 'fr' ? `\nSous-titre : "${subtitle}"` : `\nSubtitle: "${subtitle}"`) : '';
    const authorLine = authorName ? (lang === 'fr' ? `\nAuteur : ${authorName}` : `\nAuthor: ${authorName}`) : '';
    const keywordsLine = Array.isArray(keywords) && keywords.length > 0
      ? (lang === 'fr' ? `\nThèmes clés à couvrir : ${keywords.join(', ')}` : `\nKey themes to cover: ${keywords.join(', ')}`)
      : '';

    const _tone = tone || 'professional';
    const _level = languageLevel || 'intermediate';
    const _audience = targetAudience || 'general';
    const _style = style || 'ebook';

    const toneInstruction = getInstruction(toneMap, lang, _tone, 'professional');
    const levelInstruction = getInstruction(levelMap, lang, _level, 'intermediate');
    const audienceInstruction = getInstruction(audienceMap, lang, _audience, 'general');
    const formatInstruction = getInstruction(styleFormatMap, lang, _style, 'ebook');
    const antiAiRules = getAntiAiRules(lang, _style);

    // Narrative detection + editorial profile
    const narrativeStyles = ['story', 'novel'];
    const isNarrative = narrativeStyles.includes(_style);
    const editorialProfile = detectEditorialProfile(_style, _tone, title || '', topic || '', _audience, religiousTradition, prayerFormat);
    const editorialBlueprint = getEditorialBlueprint(lang, editorialProfile);

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

    // Temperature by editorial profile
    const temperature = getTemperatureForProfile(editorialProfile, isNarrative);

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

BLUEPRINT ÉDITORIAL À APPLIQUER (NON NÉGOCIABLE) :
${editorialBlueprint}

GARDE-FOUS D'AUTHENTICITÉ :
- Chaque chapitre doit apporter une matière exploitable immédiatement
- Interdit de générer des titres vagues, lyriques ou décoratifs hors fiction
- Interdit d'écrire des paragraphes de remplissage
- Chaque chapitre doit contenir au moins 1 élément concret vérifiable (cadre, étape, cas, référence, verset, checklist)

HTML — FORMATAGE PROFESSIONNEL (comme un vrai livre édité) :
- <p> pour les paragraphes de corps de texte (3-5 phrases chacun)
- <h2> pour les TITRES DE SECTIONS MAJUSCULES (ex: "1. LE PÉCHÉ", "A- CINQ RAISONS MAJEURES")
- <h3> pour les sous-sections (ex: "1.1. L'orgueil", "4.2. Solution dans l'ancien testament")
- <blockquote> pour les VERSETS BIBLIQUES complets avec référence en <strong> (ex: <blockquote><strong>Éphésiens 6v12</strong> : <em>"nous n'avons pas à lutter contre la chair et le sang..."</em></blockquote>)
- <ol><li> pour les listes NUMÉROTÉES (points de prière, étapes, arguments)
- <ul><li> pour les listes à puces (thèmes, exemples)
- <strong> pour les mots-clés, références bibliques et concepts importants
- <em> pour les citations, les versets en italique, l'emphase
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

MANDATORY EDITORIAL BLUEPRINT:
${editorialBlueprint}

AUTHENTICITY GUARDRAILS:
- Each chapter must deliver immediately usable substance
- No vague, lyrical, decorative chapter titles outside fiction
- No filler paragraphs
- Each chapter must include at least one concrete artifact (framework, step, case, reference, verse, or checklist)

HTML — PROFESSIONAL FORMATTING (like a real published book):
- <p> for body text paragraphs (3-5 sentences each)
- <h2> for MAJOR SECTION TITLES (e.g. "1. THE PROBLEM", "A- FIVE MAJOR REASONS")
- <h3> for sub-sections (e.g. "1.1. Pride", "4.2. Old Testament solution")
- <blockquote> for FULL SCRIPTURE VERSES with reference in <strong> (e.g. <blockquote><strong>Ephesians 6:12</strong>: <em>"For we wrestle not against flesh..."</em></blockquote>)
- <ol><li> for NUMBERED lists (prayer points, steps, arguments)
- <ul><li> for bullet lists (themes, examples)
- <strong> for key terms, biblical references, important concepts
- <em> for quotes, verse text in italics, emphasis
${styleRefInstruction}
OUTPUT FORMAT: Valid JSON only. No markdown, no code fences.`;

    // ═══ BUILD USER PROMPT ═══
    let userPrompt: string;

    // Style/profile-specific chapter title guidance
    const titleGuidance = getTitleGuidance(lang, _style, editorialProfile);

    if (singleChapter) {
      userPrompt = lang === 'fr'
        ? `Sujet du chapitre : ${topic}

Écris ce chapitre.

RÈGLES :
- Commence DIRECTEMENT par le contenu — pas d'introduction vague
- Respecte ce guide de titre: ${titleGuidance}
- Applique strictement ce blueprint: ${editorialBlueprint}
- 2-3 sous-titres <h3> clairs
- Donne des exemples CONCRETS (noms, situations, chiffres)
- Termine avec une section actionnable adaptée au profil (checklist, actions immédiates, questions de réflexion ou points de prière)
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
- Start DIRECTLY with content — no vague opening
- Follow this title guidance: ${titleGuidance}
- Strictly apply this blueprint: ${editorialBlueprint}
- Use 2-3 clear <h3> sub-headings
- Give CONCRETE examples (names, situations, numbers)
- End with an actionable section adapted to the profile (checklist, immediate actions, reflection questions, or prayer points)
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

TITRE : "${title}"${subtitleLine}${authorLine}
${topic ? `SUJET : ${topic}` : ''}${keywordsLine}
${editorialContext}
INSTRUCTIONS :
- Exactement ${chapterCount} chapitres
- ${titleGuidance}
- Applique strictement ce blueprint : ${editorialBlueprint}
- Chaque chapitre : environ ${chapterWordTarget} mots en HTML
- COMMENCE chaque chapitre directement par le contenu, pas par une vague introduction
- Donne des exemples CONCRETS et RÉELS
- Chaque chapitre doit produire un bloc actionnable (checklist, actions immédiates, questions de réflexion, ou points de prière selon le profil)
- Écris comme un VRAI auteur humain — avec une voix ferme et identifiable
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

TITLE: "${title}"${subtitleLine}${authorLine}
${topic ? `TOPIC: ${topic}` : ''}${keywordsLine}
${editorialContext}
INSTRUCTIONS:
- Exactly ${chapterCount} chapters
- ${titleGuidance}
- Strictly apply this blueprint: ${editorialBlueprint}
- Each chapter: around ${chapterWordTarget} words in HTML
- START each chapter directly with content, not a vague intro
- Give CONCRETE, REAL examples
- Every chapter must include an actionable block (checklist, immediate actions, reflection questions, or prayer points depending on profile)
- Write like a REAL human author with a distinct voice
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

    // Credit debit (will be refunded on AI failure)
    const creditActionKey = singleChapter ? 'generate_chapter' : 'generate_book';
    let creditDebited = 0;
    const debitResult = await consumeCreditsOrThrow({ admin, userId: auth.userId, actionKey: creditActionKey, tier: normalizeTier(tier) });
    if (!('skipped' in debitResult)) creditDebited = debitResult.debited;

    let aiRes: Response | null = null;
    let usedProvider = 'gemini';
    try {
      // ─── Try Gemini first ───
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
              responseMimeType: 'application/json',
            },
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

      // ─── If Gemini failed, fallback to OpenAI ───
      if (!aiRes || !aiRes.ok) {
        const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
        if (OPENAI_API_KEY) {
          console.warn(`[generate-book-content] Gemini failed (${aiRes?.status}), falling back to OpenAI`);
          usedProvider = 'openai';

          const openaiController = new AbortController();
          const openaiTimeout = setTimeout(() => openaiController.abort(), requestTimeoutMs);
          try {
            aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt },
                ],
                temperature,
                max_tokens: maxTokens,
                response_format: { type: 'json_object' },
              }),
              signal: openaiController.signal,
            });
          } finally {
            clearTimeout(openaiTimeout);
          }
        }
      }
    } catch (error) {
      if (isAbortError(error)) {
        // Refund on timeout
        if (creditDebited > 0) { try { await refundCreditsAsBonus({ admin, userId: auth.userId, amount: creditDebited, source: creditActionKey, expiresInDays: 30 }); } catch (_) {} }
        return new Response(JSON.stringify({ error: 'Generation timeout. Please retry.', credits_refunded: creditDebited > 0 }), {
          status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!aiRes) {
      if (creditDebited > 0) { try { await refundCreditsAsBonus({ admin, userId: auth.userId, amount: creditDebited, source: creditActionKey, expiresInDays: 30 }); } catch (_) {} }
      return new Response(JSON.stringify({ error: 'AI request failed before completion', credits_refunded: creditDebited > 0 }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!aiRes.ok) {
      // Refund on AI error
      if (creditDebited > 0) { try { await refundCreditsAsBonus({ admin, userId: auth.userId, amount: creditDebited, source: creditActionKey, expiresInDays: 30 }); } catch (_) {} }
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.', credits_refunded: creditDebited > 0 }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await aiRes.text();
      console.error(`${usedProvider} error:`, aiRes.status, errText);
      return new Response(JSON.stringify({ error: `AI error (${aiRes.status})`, credits_refunded: creditDebited > 0 }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiRes.json();
    const rawContent = usedProvider === 'openai'
      ? (aiData?.choices?.[0]?.message?.content || '')
      : (aiData?.candidates?.[0]?.content?.parts?.[0]?.text || '');

    let parsed = tryParsePayload(rawContent);
    if (!parsed) {
      console.error('Direct parse failed, attempting AI JSON repair. Payload preview:', rawContent.slice(0, 500));
      parsed = await repairJsonWithAi(GEMINI_API_KEY, rawContent, chapterCount);
    }

    if (!parsed) {
      if (creditDebited > 0) { try { await refundCreditsAsBonus({ admin, userId: auth.userId, amount: creditDebited, source: creditActionKey, expiresInDays: 30 }); } catch (_) {} }
      return new Response(JSON.stringify({ error: 'Failed to parse AI response', credits_refunded: creditDebited > 0 }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedChapters = normalizeGeneratedChapters(parsed);
    if (normalizedChapters.length === 0) {
      if (creditDebited > 0) { try { await refundCreditsAsBonus({ admin, userId: auth.userId, amount: creditDebited, source: creditActionKey, expiresInDays: 30 }); } catch (_) {} }
      return new Response(JSON.stringify({ error: 'AI returned empty chapters', credits_refunded: creditDebited > 0 }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!singleChapter) {
      const minimumExpected = Math.max(2, Math.ceil(chapterCount * MIN_VALID_CHAPTER_RATIO));
      if (normalizedChapters.length < minimumExpected) {
        console.warn(`[generate-book-content] Partial generation detected: got ${normalizedChapters.length}/${chapterCount} chapters`);
        if (creditDebited > 0) { try { await refundCreditsAsBonus({ admin, userId: auth.userId, amount: creditDebited, source: creditActionKey, expiresInDays: 30 }); } catch (_) {} }
        return new Response(JSON.stringify({
          error: `Partial generation (${normalizedChapters.length}/${chapterCount} chapters). Please retry.`,
          partial: true,
          received_chapters: normalizedChapters.length,
          expected_chapters: chapterCount,
          credits_refunded: creditDebited > 0,
        }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ chapters: normalizedChapters }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    if (e?.status === 402) {
      return new Response(JSON.stringify({ error: e.message }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    console.error('generate-book-content error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
