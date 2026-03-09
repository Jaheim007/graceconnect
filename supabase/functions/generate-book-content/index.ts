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
    simple: `Vocabulario simple y oraciones cortas (máximo 15-20 palabras). Comprensible por un niño de 12 años o un no nativo. Evita la jerga. Explica cada concepto nuevo con ejemplos cotidianos. Frases directas, sin subordinadas complejas.`,
    intermediate: `Vocabulario corriente con algunos términos especializados siempre explicados entre paréntesis o por el contexto. Frases de longitud media. Accesible para el público general educado. Puedes usar metáforas simples y referencias culturales ampliamente conocidas.`,
    advanced: `Vocabulario rico, sostenido y variado. El texto puede incluir términos técnicos, giros literarios elaborados, neologismos y un estilo sofisticado. Para un lectorado culto. Juega con los registros, alterna entre lo coloquial y lo elevado para crear contraste y ritmo.`,
  },
  pt: {
    simple: `Vocabulário simples e frases curtas (máximo 15-20 palavras). Compreensível por uma criança de 12 anos ou um não nativo. Evita jargão. Explica cada conceito novo com exemplos do cotidiano. Frases diretas, sem subordinadas complexas.`,
    intermediate: `Vocabulário corrente com alguns termos especializados sempre explicados em contexto. Frases de comprimento médio. Acessível ao público geral educado. Podes usar metáforas simples e referências culturais amplamente conhecidas.`,
    advanced: `Vocabulário rico, sustentado e variado. O texto pode incluir termos técnicos, recursos literários elaborados, neologismos e um estilo sofisticado. Para um leitorado culto. Joga com os registros, alterna entre o coloquial e o elevado para criar contraste e ritmo.`,
  },
  de: {
    simple: `Einfaches Vokabular und kurze Sätze (maximal 15-20 Wörter). Verständlich für ein 12-jähriges Kind oder einen Nicht-Muttersprachler. Vermeide Fachjargon. Erkläre jedes neue Konzept mit Alltagsbeispielen. Direkte Sätze ohne komplexe Nebensätze.`,
    intermediate: `Gebräuchliches Vokabular mit einigen Fachbegriffen, die im Kontext erklärt werden. Sätze mittlerer Länge. Zugänglich für das gebildete allgemeine Publikum. Einfache Metaphern und weithin bekannte kulturelle Referenzen sind erlaubt.`,
    advanced: `Reiches, gehobenes und abwechslungsreiches Vokabular. Der Text kann Fachbegriffe, ausgearbeitete literarische Wendungen, Neologismen und einen anspruchsvollen Stil enthalten. Für ein gebildetes Lesepublikum. Spiele mit Registern, wechsle zwischen umgangssprachlich und gehoben für Kontrast und Rhythmus.`,
  },
  sw: {
    simple: `Maneno rahisi na sentensi fupi (maneno 15-20 zaidi). Inaeleweka na mtoto wa miaka 12 au mtu asiye mzungumzaji wa asili. Epuka istilahi. Eleza kila dhana mpya na mifano ya kila siku. Sentensi za moja kwa moja bila miundo ngumu.`,
    intermediate: `Maneno ya kawaida na istilahi chache zilizofafanuliwa katika muktadha. Sentensi za urefu wa kati. Inapatikana kwa hadhira ya jumla yenye elimu. Sitiari rahisi na marejeleo ya kitamaduni yanayojulikana sana yanaruhusiwa.`,
    advanced: `Maneno tajiri, ya hali ya juu na tofauti. Maandishi yanaweza kujumuisha istilahi za kitaalamu, mbinu za fasihi zilizofanyiwa kazi na mtindo wa kisasa. Kwa wasomaji wenye elimu. Cheza na rejista, badilisha kati ya mazungumzo na ya juu kwa tofauti na mdundo.`,
  },
};

// ─── Target audience instructions ───
const audienceMap: Record<string, Record<string, string>> = {
  fr: {
    general: `Public général, tout âge confondu. Contenu universel et inclusif qui parle à l'humanité partagée du lecteur — ses espoirs, ses peurs, ses rêves. Utilise des exemples transgénérationnels.`,
    children: `Livre pour enfants (6-12 ans). Utilise un langage simple et imagé, des histoires courtes et captivantes avec des personnages attachants qui ont des NOMS et des PERSONNALITÉS distinctes. Dialogues vivants et naturels ("Maman, pourquoi le ciel est bleu ?"). Descriptions colorées et sensorielles. Beaucoup d'imagination mais toujours ancrée dans l'émotion. Chaque chapitre se termine sur une leçon de vie douce, jamais moralisatrice.`,
    teens: `Adolescents (13-18 ans). Ton dynamique et authentique — tu ne fais pas semblant de comprendre les jeunes, tu LES comprends. Exemples de la vraie vie (école, amitié, identité, premiers amours, rêves, pression sociale, réseaux sociaux). Style engageant avec références culturelles ACTUELLES. Tu abordes les sujets difficiles avec honnêteté et empathie, sans condescendance.`,
    adults: `Adultes. Contenu mature avec réflexions profondes qui résonnent avec l'expérience vécue — les défis professionnels, les relations, la quête de sens, les transitions de vie. Analyses nuancées qui reconnaissent la complexité du réel. Perspectives multiples qui enrichissent sans imposer. Le lecteur doit sentir que l'auteur a vécu ce dont il parle.`,
    seniors: `Seniors. Ton respectueux et chaleureux qui honore l'expérience vécue. Références culturelles classiques et intemporelles. Sagesse accumulée présentée non pas comme des leçons mais comme des trésors partagés. Nostalgie constructive — le passé éclaire le présent. Expériences de vie inspirantes qui donnent du sens au chemin parcouru.`,
    professionals: `Professionnels et experts du domaine. Contenu avancé avec données concrètes sourcées, études de cas détaillées avec contexte et résultats, méthodologies éprouvées et applicables immédiatement, frameworks pratiques et résultats mesurables. Le lecteur doit pouvoir AGIR dès la fin de chaque chapitre.`,
  },
  en: {
    general: `General audience, all ages. Universal and inclusive content that speaks to the reader's shared humanity — their hopes, fears, dreams. Use cross-generational examples.`,
    children: `Book for children (6-12 years). Simple, vivid language with short captivating stories featuring lovable characters with NAMES and distinct PERSONALITIES. Natural, lively dialogues ("Mom, why is the sky blue?"). Colorful sensory descriptions. Rich imagination always grounded in emotion. Each chapter ends with a gentle life lesson, never preachy.`,
    teens: `Teenagers (13-18 years). Dynamic, authentic tone — you don't pretend to understand teens, you ACTUALLY understand them. Real-life examples (school, friendship, identity, first love, dreams, social pressure, social media). Engaging style with CURRENT cultural references. Address difficult topics with honesty and empathy, never condescension.`,
    adults: `Adults. Mature content with deep reflections that resonate with lived experience — career challenges, relationships, the search for meaning, life transitions. Nuanced analyses that acknowledge real-world complexity. Multiple perspectives that enrich without imposing. The reader should feel the author has lived what they write about.`,
    seniors: `Seniors. Respectful, warm tone that honors lived experience. Classic, timeless cultural references. Accumulated wisdom presented not as lessons but as shared treasures. Constructive nostalgia — the past illuminating the present. Inspiring life experiences that give meaning to the journey traveled.`,
    professionals: `Professionals and domain experts. Advanced content with sourced concrete data, detailed case studies with context and outcomes, proven and immediately applicable methodologies, practical frameworks and measurable results. The reader should be able to ACT by the end of each chapter.`,
  },
  es: {
    general: `Público general, todas las edades. Contenido universal e inclusivo que habla a la humanidad compartida del lector — sus esperanzas, miedos, sueños. Usa ejemplos transgeneracionales.`,
    children: `Libro para niños (6-12 años). Lenguaje simple e imaginativo con historias cautivadoras, personajes entrañables con NOMBRES y personalidades distintas. Diálogos vivos y naturales. Descripciones sensoriales coloridas. Cada capítulo termina con una lección de vida suave, nunca moralizante.`,
    teens: `Adolescentes (13-18 años). Tono dinámico y auténtico con ejemplos de la vida real (escuela, amistad, identidad, primeros amores, redes sociales). Referencias culturales ACTUALES. Aborda temas difíciles con honestidad y empatía, sin condescendencia.`,
    adults: `Adultos. Contenido maduro con reflexiones profundas que resuenan con la experiencia vivida. Análisis matizados que reconocen la complejidad del mundo real. Perspectivas múltiples que enriquecen sin imponer.`,
    seniors: `Personas mayores. Tono respetuoso y cálido que honra la experiencia vivida. Referencias culturales clásicas. Sabiduría presentada como tesoros compartidos, no como lecciones. Nostalgia constructiva y experiencias inspiradoras.`,
    professionals: `Profesionales y expertos. Contenido avanzado con datos concretos, estudios de caso detallados, metodologías probadas y aplicables inmediatamente. El lector debe poder ACTUAR al final de cada capítulo.`,
  },
  pt: {
    general: `Público geral, todas as idades. Conteúdo universal e inclusivo que fala à humanidade partilhada do leitor — as suas esperanças, medos, sonhos. Usa exemplos transgeracionais.`,
    children: `Livro para crianças (6-12 anos). Linguagem simples e imaginativa com histórias cativantes, personagens adoráveis com NOMES e personalidades distintas. Diálogos vivos e naturais. Descrições sensoriais coloridas. Cada capítulo termina com uma lição de vida suave, nunca moralizante.`,
    teens: `Adolescentes (13-18 anos). Tom dinâmico e autêntico com exemplos da vida real (escola, amizade, identidade, redes sociais). Referências culturais ATUAIS. Aborda temas difíceis com honestidade e empatia, sem condescendência.`,
    adults: `Adultos. Conteúdo maduro com reflexões profundas que ressoam com a experiência vivida. Análises matizadas que reconhecem a complexidade do mundo real.`,
    seniors: `Idosos. Tom respeitoso e caloroso que honra a experiência vivida. Referências culturais clássicas. Sabedoria apresentada como tesouros partilhados. Nostalgia construtiva e experiências inspiradoras.`,
    professionals: `Profissionais e especialistas. Conteúdo avançado com dados concretos, estudos de caso detalhados, metodologias comprovadas e aplicáveis imediatamente. O leitor deve poder AGIR no final de cada capítulo.`,
  },
  de: {
    general: `Allgemeines Publikum, alle Altersgruppen. Universeller, inklusiver Inhalt, der die gemeinsame Menschlichkeit des Lesers anspricht — Hoffnungen, Ängste, Träume. Generationsübergreifende Beispiele verwenden.`,
    children: `Buch für Kinder (6-12 Jahre). Einfache, bildhafte Sprache mit kurzen fesselnden Geschichten, liebenswerten Figuren mit NAMEN und eigenen Persönlichkeiten. Lebendige, natürliche Dialoge. Farbenfrohe, sinnliche Beschreibungen. Jedes Kapitel endet mit einer sanften Lebenslektion, nie moralisierend.`,
    teens: `Teenager (13-18 Jahre). Dynamischer, authentischer Ton mit Beispielen aus dem echten Leben (Schule, Freundschaft, Identität, soziale Medien). AKTUELLE kulturelle Referenzen. Schwierige Themen mit Ehrlichkeit und Empathie ansprechen, nie herablassend.`,
    adults: `Erwachsene. Reifer Inhalt mit tiefen Reflexionen, die mit gelebter Erfahrung resonieren. Nuancierte Analysen, die die Komplexität der realen Welt anerkennen.`,
    seniors: `Senioren. Respektvoller, warmer Ton, der gelebte Erfahrung ehrt. Klassische kulturelle Referenzen. Weisheit als geteilte Schätze präsentiert. Konstruktive Nostalgie und inspirierende Lebenserfahrungen.`,
    professionals: `Fachleute und Experten. Fortgeschrittener Inhalt mit konkreten Daten, detaillierten Fallstudien, bewährten und sofort anwendbaren Methoden. Der Leser soll am Ende jedes Kapitels HANDELN können.`,
  },
  sw: {
    general: `Hadhira ya jumla, umri wote. Maudhui ya ulimwengu na jumuishi yanayozungumza na ubinadamu wa pamoja wa msomaji — matumaini, hofu, ndoto zao. Tumia mifano ya vizazi vyote.`,
    children: `Kitabu cha watoto (miaka 6-12). Lugha rahisi na ya picha na hadithi fupi za kuvutia, wahusika wapenzi wenye MAJINA na tabia tofauti. Mazungumzo hai na ya asili. Maelezo ya rangi na hisi. Kila sura inaisha na somo la maisha laini, kamwe la kuhubiri.`,
    teens: `Vijana (miaka 13-18). Sauti yenye nguvu na ya kweli na mifano ya maisha halisi (shule, urafiki, utambulisho, mitandao ya kijamii). Marejeleo ya kitamaduni ya SASA. Kushughulikia mada ngumu kwa uaminifu na huruma, kamwe kwa kiburi.`,
    adults: `Watu wazima. Yaliyomo ya kukomaa na tafakuri za kina zinazogusa uzoefu ulioishi. Uchambuzi wa nuanced unaotambua ugumu wa ulimwengu halisi.`,
    seniors: `Wazee. Sauti ya heshima na joto inayoheshimu uzoefu ulioishi. Marejeleo ya kitamaduni ya zamani. Hekima iliyowasilishwa kama hazina zilizoshirikiwa. Nostalgia yenye kujenga na uzoefu wa maisha wa kuhamasisha.`,
    professionals: `Wataalamu na wataalam. Yaliyomo ya juu na data halisi, tafiti za kesi zilizofafanuliwa, mbinu zilizothibitishwa na zinazoweza kutumika mara moja. Msomaji anapaswa kuweza KUTENDA mwishoni mwa kila sura.`,
  },
};

// ─── Style format instructions ───
const styleFormatMap: Record<string, Record<string, string>> = {
  fr: {
    ebook: `Structure en chapitres narratifs avec des introductions captivantes, des transitions fluides, des sous-sections claires (<h3>), des paragraphes bien développés, des citations marquantes en <blockquote>, et une conclusion mémorable par chapitre.`,
    guide: `Structure pratique avec des étapes numérotées, des listes à puces (<ul><li>), des encadrés de conseils en <blockquote>, des exercices pratiques, des check-lists, des exemples avant/après et des résumés de chapitre.`,
    prayers: `Structure en sections de prières, méditations guidées et réflexions spirituelles. Inclus des versets sacrés en <blockquote> avec leurs références, des invocations, des moments de silence méditatif et des intentions de prière.`,
    story: `Structure en chapitres narratifs courts et captivants pour enfants ou lecteurs de fiction. Personnages avec des NOMS et des PERSONNALITÉS distinctes. Dialogues vivants et naturels. Descriptions sensorielles colorées. Chaque chapitre se termine sur un cliffhanger ou une leçon de vie douce. Beaucoup d'imagination, de rythme et d'émotion.`,
    novel: `Structure romanesque avec des chapitres narratifs immersifs. Développement de personnages profonds, intrigues et tensions narratives, descriptions atmosphériques, dialogues authentiques, arc narratif avec montée en tension, climax et résolution. Style littéraire avec alternance de scènes d'action et de réflexion.`,
    devotional: `Structure en méditations quotidiennes numérotées (Jour 1, Jour 2...). Chaque méditation comprend : un verset ou passage sacré en <blockquote>, une réflexion personnelle, une application pratique pour la journée, et une prière ou intention. Format de journal spirituel sur 30 ou 90 jours.`,
    activity: `Structure interactive avec des exercices variés par chapitre : quiz, questions de réflexion, espaces à remplir (indiqués par des lignes _____), jeux de mots, défis créatifs, coloriages décrits en texte, labyrinthes de questions. Chaque activité a un objectif pédagogique clair. Instructions simples et encourageantes.`,
  },
  en: {
    ebook: `Structure with narrative chapters featuring captivating introductions, smooth transitions, clear sub-sections (<h3>), well-developed paragraphs, striking quotes in <blockquote>, and a memorable conclusion per chapter.`,
    guide: `Practical structure with numbered steps, bullet lists (<ul><li>), tip boxes in <blockquote>, practical exercises, checklists, before/after examples and chapter summaries.`,
    prayers: `Structure with prayer sections, guided meditations and spiritual reflections. Include sacred verses in <blockquote> with references, invocations, moments of meditative silence and prayer intentions.`,
    story: `Structure with short, captivating narrative chapters for children or fiction readers. Characters with NAMES and distinct PERSONALITIES. Lively, natural dialogues. Colorful sensory descriptions. Each chapter ends with a cliffhanger or gentle life lesson. Lots of imagination, rhythm and emotion.`,
    novel: `Novelistic structure with immersive narrative chapters. Deep character development, plots and narrative tensions, atmospheric descriptions, authentic dialogues, narrative arc with rising tension, climax and resolution. Literary style alternating between action and reflection scenes.`,
    devotional: `Structure as numbered daily meditations (Day 1, Day 2...). Each meditation includes: a sacred verse or passage in <blockquote>, personal reflection, practical application for the day, and a prayer or intention. Spiritual journal format over 30 or 90 days.`,
    activity: `Interactive structure with varied exercises per chapter: quizzes, reflection questions, fill-in spaces (indicated by _____ lines), word games, creative challenges, text-described coloring pages, question mazes. Each activity has a clear educational objective. Simple, encouraging instructions.`,
  },
  es: {
    ebook: `Estructura con capítulos narrativos, introducciones cautivadoras, transiciones fluidas y conclusiones memorables.`,
    guide: `Estructura práctica con pasos numerados, listas, ejercicios y resúmenes.`,
    prayers: `Estructura con secciones de oración, meditaciones y reflexiones espirituales con versículos.`,
    story: `Estructura con capítulos narrativos cortos y cautivadores. Personajes con nombres y personalidades distintas. Diálogos vivos. Descripciones sensoriales. Imaginación y emoción.`,
    novel: `Estructura novelística con capítulos inmersivos. Desarrollo de personajes, intriga, diálogos auténticos y arco narrativo completo.`,
    devotional: `Estructura de meditaciones diarias numeradas con versículos, reflexión y oración.`,
    activity: `Estructura interactiva con ejercicios, quiz, juegos y actividades creativas por capítulo.`,
  },
  pt: {
    ebook: `Estrutura com capítulos narrativos, introduções cativantes, transições fluidas e conclusões memoráveis.`,
    guide: `Estrutura prática com etapas numeradas, listas, exercícios e resumos.`,
    prayers: `Estrutura com seções de oração, meditações e reflexões espirituais com versículos.`,
    story: `Estrutura com capítulos narrativos curtos e cativantes. Personagens com nomes e personalidades distintas. Diálogos vivos. Imaginação e emoção.`,
    novel: `Estrutura romanesca com capítulos imersivos. Desenvolvimento de personagens, intriga e arco narrativo completo.`,
    devotional: `Estrutura de meditações diárias numeradas com versículos, reflexão e oração.`,
    activity: `Estrutura interativa com exercícios, quiz, jogos e atividades criativas por capítulo.`,
  },
  de: {
    ebook: `Struktur mit narrativen Kapiteln, fesselnden Einleitungen, fließenden Übergängen und einprägsamen Schlussfolgerungen.`,
    guide: `Praktische Struktur mit nummerierten Schritten, Listen, Übungen und Zusammenfassungen.`,
    prayers: `Struktur mit Gebetsabschnitten, Meditationen und spirituellen Reflexionen mit Bibelversen.`,
    story: `Struktur mit kurzen, fesselnden Erzählkapiteln. Figuren mit Namen und eigenen Persönlichkeiten. Lebendige Dialoge. Fantasie und Emotion.`,
    novel: `Romanstruktur mit immersiven Kapiteln. Figurenentwicklung, Spannung und vollständiger Erzählbogen.`,
    devotional: `Struktur als nummerierte tägliche Meditationen mit Versen, Reflexion und Gebet.`,
    activity: `Interaktive Struktur mit Übungen, Quiz, Spielen und kreativen Aktivitäten pro Kapitel.`,
  },
  sw: {
    ebook: `Muundo wa sura za simulizi zenye utangulizi wa kuvutia na hitimisho la kukumbukwa.`,
    guide: `Muundo wa vitendo na hatua zilizohesabiwa, orodha na mazoezi.`,
    prayers: `Muundo na sehemu za maombi, kutafakari na tafakuri za kiroho.`,
    story: `Muundo na sura fupi za kuvutia. Wahusika wenye majina na tabia tofauti. Mazungumzo hai. Ndoto na hisia.`,
    novel: `Muundo wa riwaya na sura za kuzamisha. Maendeleo ya wahusika, mvutano na mtiririko kamili wa simulizi.`,
    devotional: `Muundo wa kutafakari za kila siku zilizohesabiwa na aya, tafakuri na maombi.`,
    activity: `Muundo wa maingiliano na mazoezi, maswali, michezo na shughuli za ubunifu kwa kila sura.`,
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
      max_tokens: 7000,
      response_format: { type: 'json_object' },
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

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
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

    // Determine if style is narrative (story/novel) vs expository (ebook/guide/academic etc.)
    const narrativeStyles = ['story', 'novel'];
    const isNarrative = narrativeStyles.includes(style || 'ebook');

    // Build system prompt - adapted by style category
    const systemPrompt = lang === 'fr'
      ? `Tu es un ÉCRIVAIN PROFESSIONNEL expérimenté. Tu écris en ${langName}.${isNarrative ? '' : `

⚠️ RÈGLE FONDAMENTALE — ÉCRITURE DIRECTE ET STANDARD ⚠️
Tu écris un ${style === 'guide' ? 'guide pratique' : style === 'prayers' ? 'livre de prières' : style === 'devotional' ? 'livre de méditations' : style === 'activity' ? 'livre d\'activités' : 'livre'}. PAS un roman. PAS un conte. PAS de la poésie.

CE QUE TU DOIS FAIRE :
- Écrire de manière CLAIRE, DIRECTE et NATURELLE — comme un professionnel qui parle à son lecteur
- Expliquer les concepts de façon précise et concrète
- Utiliser un vocabulaire STANDARD et accessible — pas de mots fleuris ni de tournures poétiques
- Structurer tes idées avec logique : une idée par paragraphe, bien articulé
- Donner des exemples concrets et pratiques quand nécessaire
- Garder un ton humain et personnel sans tomber dans le romanesque

CE QUE TU NE DOIS JAMAIS FAIRE :
- Raconter des histoires fictives ou inventer des scènes dramatiques (sauf si le sujet l'exige)
- Utiliser un style "merveilleux", "rêveur" ou "poétique"
- Mettre des métaphores et images littéraires dans chaque paragraphe
- Écrire comme si tu racontais un roman ou un conte
- Utiliser des titres de chapitres trop créatifs ou mystérieux — préfère des titres CLAIRS qui disent de quoi parle le chapitre
- Exagérer les émotions ou dramatiser inutilement
- Ajouter des descriptions sensorielles inutiles (odeurs, sons, lumières) sauf si pertinent`}${isNarrative ? `

Tu écris un texte NARRATIF (${style}). Tu peux utiliser des techniques littéraires : personnages, dialogues, descriptions sensorielles, tension narrative. Rends le récit vivant et immersif.` : ''}

STYLE D'ÉCRITURE :
${toneInstruction}

NIVEAU DE LANGUE :
${levelInstruction}

PUBLIC CIBLE :
${audienceInstruction}

FORMAT :
${formatInstruction}

HTML — UTILISE :
- <p> pour les paragraphes
- <h3> pour 2-3 sous-titres ${isNarrative ? 'créatifs' : 'clairs et descriptifs'} par chapitre
- <blockquote> pour citations, versets ou points importants
- <strong> pour les concepts-clés (avec parcimonie)
- <em> pour l'emphase subtile
- <ul><li> ou <ol><li> pour les listes quand utile

EXPRESSIONS INTERDITES :
"Il est important de noter", "Force est de constater", "Dans un monde où", "Il est essentiel de", "En conclusion", "Pour résumer", "Il convient de souligner", "Il va sans dire".

Tu DOIS créer les chapitres EN FONCTION DU SUJET/IDÉE fourni. Chaque chapitre explore un aspect unique et essentiel du sujet.${styleRefInstruction}
FORMAT DE SORTIE : Retourne un JSON valide. Pas de markdown, pas de code fences.`
      : `You are an experienced PROFESSIONAL WRITER. You write in ${langName}.${isNarrative ? '' : `

⚠️ FUNDAMENTAL RULE — DIRECT, STANDARD WRITING ⚠️
You are writing a ${style === 'guide' ? 'practical guide' : style === 'prayers' ? 'prayer book' : style === 'devotional' ? 'devotional book' : style === 'activity' ? 'activity book' : 'book'}. NOT a novel. NOT a fairy tale. NOT poetry.

WHAT YOU MUST DO:
- Write in a CLEAR, DIRECT and NATURAL way — like a professional speaking to their reader
- Explain concepts precisely and concretely
- Use STANDARD, accessible vocabulary — no flowery words or poetic turns of phrase
- Structure ideas logically: one idea per paragraph, well-articulated
- Give concrete, practical examples when needed
- Keep a human, personal tone without falling into novelistic writing

WHAT YOU MUST NEVER DO:
- Tell fictional stories or invent dramatic scenes (unless the topic requires it)
- Use a "magical", "dreamy" or "poetic" style
- Put metaphors and literary imagery in every paragraph
- Write as if telling a novel or fairy tale
- Use overly creative or mysterious chapter titles — prefer CLEAR titles that say what the chapter is about
- Exaggerate emotions or dramatize unnecessarily
- Add unnecessary sensory descriptions (smells, sounds, lights) unless relevant`}${isNarrative ? `

You are writing a NARRATIVE text (${style}). You can use literary techniques: characters, dialogues, sensory descriptions, narrative tension. Make the story vivid and immersive.` : ''}

WRITING STYLE:
${toneInstruction}

LANGUAGE LEVEL:
${levelInstruction}

TARGET AUDIENCE:
${audienceInstruction}

FORMAT:
${formatInstruction}

HTML — USE:
- <p> for paragraphs
- <h3> for 2-3 ${isNarrative ? 'creative' : 'clear and descriptive'} sub-headings per chapter
- <blockquote> for quotes, verses, or important points
- <strong> for key concepts (sparingly)
- <em> for subtle emphasis
- <ul><li> or <ol><li> for lists when useful

BANNED EXPRESSIONS:
"It is important to note", "In today's world", "It is essential to", "In conclusion", "To summarize", "It should be emphasized", "It goes without saying".

You MUST create chapters BASED ON THE TOPIC/IDEA provided. Each chapter explores a unique and essential aspect of the topic.${styleRefInstruction}
OUTPUT FORMAT: Return valid JSON. No markdown, no code fences.`;


    let userPrompt: string;

    if (singleChapter) {
      userPrompt = lang === 'fr'
        ? `Sujet du chapitre : ${topic}

Écris ce chapitre UNIQUE.${isNarrative ? ' Ce chapitre est un MOMENT dans un récit — il a un début qui accroche, un milieu captivant, une fin qui donne envie de tourner la page.' : ' Ce chapitre explique et développe clairement le sujet. Il informe, guide et apporte de la valeur au lecteur.'}

RÈGLES :
- ${isNarrative ? 'Commence par une scène ou une anecdote' : 'Commence directement par le contenu — pose le contexte en 1-2 phrases puis entre dans le vif du sujet'}
- 2-3 sous-titres <h3> ${isNarrative ? 'créatifs' : 'clairs et descriptifs'}
- ${isNarrative ? 'Inclus au moins 1 histoire avec des noms et des lieux' : 'Donne des exemples concrets et pratiques'}
- Varie la longueur des paragraphes
- Environ ${chapterWordTarget} mots en HTML
- Écris de façon naturelle et directe

Retourne UNIQUEMENT un JSON :
{
  "chapters": [
    {"id": "ch-1", "title": "${chapterTitle || 'Chapitre'}", "content": "<p>Contenu...</p>"}
  ]
}`
        : `Chapter topic: ${topic}

Write this SINGLE chapter.${isNarrative ? ' This chapter is a MOMENT in a story — it has a hooking opening, captivating middle, and an ending that makes you want to turn the page.' : ' This chapter explains and develops the topic clearly. It informs, guides, and delivers value to the reader.'}

RULES:
- ${isNarrative ? 'Start with a scene or anecdote' : 'Start directly with the content — set context in 1-2 sentences then get to the point'}
- 2-3 ${isNarrative ? 'creative' : 'clear and descriptive'} <h3> sub-headings
- ${isNarrative ? 'Include at least 1 story with names and places' : 'Give concrete, practical examples'}
- Vary paragraph lengths
- Around ${chapterWordTarget} words in rich HTML
- Write naturally and directly

Return ONLY JSON:
{
  "chapters": [
    {"id": "ch-1", "title": "${chapterTitle || 'Chapter'}", "content": "<p>Content...</p>"}
  ]
}`;
    } else {
      // Build editorial strategy injection if available
      let editorialContextFr = '';
      let editorialContextEn = '';
      if (editorialStrategy && typeof editorialStrategy === 'object') {
        const s = editorialStrategy;
        editorialContextFr = `

📋 POSITIONNEMENT ÉDITORIAL (OBLIGATOIRE — guide toute l'écriture) :
- PROBLÈME DU LECTEUR : ${s.reader_problem || ''}
- PROMESSE DU LIVRE : ${s.book_promise || ''}
- ANGLE UNIQUE : ${s.unique_angle || ''}
- THÈSE CENTRALE : ${s.central_thesis || ''}
- ARC NARRATIF : ${s.narrative_arc || ''}
${s.suggested_stories?.length ? `- HISTOIRES À INTÉGRER :\n${s.suggested_stories.map((st: string, i: number) => `  ${i + 1}. ${st}`).join('\n')}` : ''}

⚠️ CHAQUE chapitre doit servir la thèse centrale et l'angle unique. Le livre doit tenir sa promesse au lecteur.`;

        editorialContextEn = `

📋 EDITORIAL POSITIONING (MANDATORY — guides all writing):
- READER PROBLEM: ${s.reader_problem || ''}
- BOOK PROMISE: ${s.book_promise || ''}
- UNIQUE ANGLE: ${s.unique_angle || ''}
- CENTRAL THESIS: ${s.central_thesis || ''}
- NARRATIVE ARC: ${s.narrative_arc || ''}
${s.suggested_stories?.length ? `- STORIES TO INCLUDE:\n${s.suggested_stories.map((st: string, i: number) => `  ${i + 1}. ${st}`).join('\n')}` : ''}

⚠️ EVERY chapter must serve the central thesis and unique angle. The book must deliver on its promise to the reader.`;
      }

      userPrompt = lang === 'fr'
        ? `Écris un livre COMPLET sur ce sujet :

TITRE : "${title}"
${topic ? `IDÉE / SUJET : ${topic}` : ''}
LANGUE : ${langName}
${editorialContextFr}

INSTRUCTIONS :
- Exactement ${chapterCount} chapitres, chacun explorant une facette unique de "${topic || title}"
- Titres de chapitres ${isNarrative ? 'CRÉATIFS et INTRIGANTS' : 'CLAIRS et DESCRIPTIFS — le lecteur doit savoir de quoi parle le chapitre en lisant le titre'}
- Chaque chapitre : environ ${chapterWordTarget} mots en HTML
${isNarrative
  ? `- COMMENCE le chapitre 1 par une scène ou une anecdote
- Inclus des histoires avec des noms et des lieux
- Utilise des dialogues quand c'est pertinent`
  : `- COMMENCE chaque chapitre directement par le contenu — 1-2 phrases de contexte puis entre dans le vif du sujet
- Donne des exemples concrets et pratiques
- Explique clairement, va droit au but
- N'invente PAS d'histoires ou de scènes si le sujet ne s'y prête pas`}
- Varie la longueur des paragraphes
- Écris de façon naturelle, comme un professionnel qui s'adresse à son lecteur

Retourne UNIQUEMENT un JSON valide :
{
  "chapters": [
    {"id": "ch-1", "title": "Titre du chapitre", "content": "<h3>Sous-titre</h3><p>Contenu...</p>"},
    {"id": "ch-2", "title": "Titre du chapitre 2", "content": "..."}
  ]
}

RAPPEL : ${pages} pages sur "${topic || title}". Chaque chapitre ≈ ${chapterWordTarget} mots.`
        : `Write a COMPLETE book on this topic:

TITLE: "${title}"
${topic ? `IDEA / TOPIC: ${topic}` : ''}
LANGUAGE: ${langName}
${editorialContextEn}

INSTRUCTIONS:
- Exactly ${chapterCount} chapters, each exploring a unique facet of "${topic || title}"
- Chapter titles must be ${isNarrative ? 'CREATIVE and INTRIGUING' : 'CLEAR and DESCRIPTIVE — the reader should know what the chapter is about from the title'}
- Each chapter: around ${chapterWordTarget} words in HTML
${isNarrative
  ? `- START chapter 1 with a scene or anecdote
- Include stories with names and places
- Use dialogues when relevant`
  : `- START each chapter directly with the content — 1-2 sentences of context then get to the point
- Give concrete, practical examples
- Explain clearly, get straight to the point
- Do NOT invent stories or scenes if the topic doesn't call for it`}
- Vary paragraph lengths
- Write naturally, like a professional addressing their reader

Return ONLY valid JSON:
{
  "chapters": [
    {"id": "ch-1", "title": "Chapter title", "content": "<h3>Sub-heading</h3><p>Content...</p>"},
    {"id": "ch-2", "title": "Chapter 2 title", "content": "..."}
  ]
}

REMINDER: ${pages}-page book on "${topic || title}". Each chapter ≈ ${chapterWordTarget} words.`;
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
            temperature: isNarrative ? 0.85 : 0.65,
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
          status: 504,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
