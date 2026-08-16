/**
 * Public API / tool reference for the SiteViral MCP server.
 * Mirrors the tool definitions in `src/lib/mcp/tools/*` — keep in sync when a
 * tool's name, parameters or purpose changes.
 */

export type ToolParam = {
  name: string;
  type: string;
  required?: boolean;
  fr: string;
  en: string;
};

export type ToolDoc = {
  id: string;
  name: string;
  group: 'discovery' | 'import' | 'generate' | 'utility';
  titleFr: string;
  titleEn: string;
  descFr: string;
  descEn: string;
  params: ToolParam[];
  example: string;
};

export const TOOL_GROUPS: { id: ToolDoc['group']; fr: string; en: string }[] = [
  { id: 'discovery', fr: 'Lecture & découverte', en: 'Read & discovery' },
  { id: 'import', fr: 'Importer du contenu', en: 'Import content' },
  { id: 'generate', fr: 'Générer avec l’IA', en: 'Generate with AI' },
  { id: 'utility', fr: 'Utilitaires', en: 'Utilities' },
];

const p = (name: string, type: string, fr: string, en: string, required = false): ToolParam =>
  ({ name, type, fr, en, required });

export const MCP_TOOLS: ToolDoc[] = [
  {
    id: 'who-am-i',
    name: 'who_am_i',
    group: 'discovery',
    titleFr: 'Qui suis-je', titleEn: 'Who am I',
    descFr: "Renvoie l'identifiant, l'email et le client OAuth de l'utilisateur connecté.",
    descEn: "Returns the signed-in user's id, email and OAuth client id.",
    params: [],
    example: `{ "name": "who_am_i", "arguments": {} }`,
  },
  {
    id: 'list-my-organizations',
    name: 'list_my_organizations',
    group: 'discovery',
    titleFr: 'Lister mes plateformes', titleEn: 'List my platforms',
    descFr: "Liste les plateformes (organisations) de l'utilisateur avec son rôle sur chacune.",
    descEn: 'Lists the platforms (organizations) the user belongs to, with their role on each.',
    params: [],
    example: `{ "name": "list_my_organizations", "arguments": {} }`,
  },
  {
    id: 'list-org-products',
    name: 'list_org_products',
    group: 'discovery',
    titleFr: 'Lister les produits', titleEn: 'List products',
    descFr: "Liste les produits digitaux d'une plateforme dont l'utilisateur est membre.",
    descEn: 'Lists the digital products of a platform the user belongs to.',
    params: [p('org_id', 'string', "Identifiant de la plateforme. Requis seulement si l'utilisateur en a plusieurs.", 'Platform id. Required only when the user has several.')],
    example: `{ "name": "list_org_products", "arguments": { "org_id": "…" } }`,
  },
  {
    id: 'get-org-analytics',
    name: 'get_org_analytics',
    group: 'discovery',
    titleFr: 'Analytics de la plateforme', titleEn: 'Platform analytics',
    descFr: 'Résumé : nombre d’achats, revenu brut et commandes récentes sur N jours.',
    descEn: 'Summary: total purchases, gross revenue and recent order count over N days.',
    params: [
      p('org_id', 'string', 'Identifiant de la plateforme.', 'Platform id.'),
      p('days', 'number', 'Fenêtre en jours (30 par défaut).', 'Window in days (defaults to 30).'),
    ],
    example: `{ "name": "get_org_analytics", "arguments": { "days": 30 } }`,
  },
  {
    id: 'list-my-purchases',
    name: 'list_my_purchases',
    group: 'discovery',
    titleFr: 'Lister mes achats', titleEn: 'List my purchases',
    descFr: 'Liste les achats de l’utilisateur : produits digitaux, formations, crédits, dons.',
    descEn: "Lists the user's purchases: digital products, formations, credits, donations.",
    params: [],
    example: `{ "name": "list_my_purchases", "arguments": {} }`,
  },
  {
    id: 'list-my-drafts',
    name: 'list_my_drafts',
    group: 'discovery',
    titleFr: 'Lister mes brouillons', titleEn: 'List my drafts',
    descFr: 'Liste les brouillons de livres et de formations en cours, avec leur avancement.',
    descEn: 'Lists in-progress book and formation drafts, with their progress.',
    params: [],
    example: `{ "name": "list_my_drafts", "arguments": {} }`,
  },
  {
    id: 'get-my-credits',
    name: 'get_my_credits',
    group: 'discovery',
    titleFr: 'Mes crédits', titleEn: 'My credits',
    descFr: 'Solde de crédits de génération de l’utilisateur.',
    descEn: "The user's generation credit balance.",
    params: [],
    example: `{ "name": "get_my_credits", "arguments": {} }`,
  },

  {
    id: 'import-book-from-content',
    name: 'import_book_from_content',
    group: 'import',
    titleFr: 'Importer un livre', titleEn: 'Import a book',
    descFr: "Crée un brouillon de livre à partir du texte final écrit dans la conversation. SiteViral assemble le texte tel quel — aucune réécriture. Envoie le texte complet, jamais un résumé.",
    descEn: 'Creates a book draft from the final text written in the conversation. SiteViral assembles the text as-is — no rewriting. Send the complete text, never a summary.',
    params: [
      p('title', 'string', 'Titre du livre.', 'Book title.', true),
      p('chapters', 'array', 'Chapitres { title, content } — 12 maximum par appel.', 'Chapters { title, content } — max 12 per call.', true),
      p('total_chapters', 'number', 'Nombre total réel de chapitres du livre.', 'The real total number of chapters in the book.', true),
      p('description', 'string', 'Résumé commercial du livre.', 'Sales description of the book.'),
      p('language', 'string', '`fr` ou `en`.', '`fr` or `en`.'),
      p('visuals', 'string', 'none | cover | cover_and_chapters | images_only.', 'none | cover | cover_and_chapters | images_only.'),
      p('org_id', 'string', 'Plateforme cible.', 'Target platform.'),
    ],
    example: `{
  "name": "import_book_from_content",
  "arguments": {
    "title": "De l'homme animal à l'homme spirituel",
    "total_chapters": 12,
    "visuals": "cover",
    "chapters": [
      { "title": "Chapitre 1", "content": "Texte complet…" }
    ]
  }
}`,
  },
  {
    id: 'add-book-chapters',
    name: 'add_book_chapters',
    group: 'import',
    titleFr: 'Ajouter des chapitres', titleEn: 'Add chapters',
    descFr: 'Ajoute le lot suivant de chapitres au même brouillon. Passe toujours `start_order` et `total_chapters`.',
    descEn: 'Adds the next batch of chapters to the same draft. Always pass `start_order` and `total_chapters`.',
    params: [
      p('chapters', 'array', 'Chapitres { title, content } — 12 maximum par appel.', 'Chapters { title, content } — max 12 per call.', true),
      p('start_order', 'number', 'Position du premier chapitre du lot.', 'Position of the first chapter in the batch.', true),
      p('total_chapters', 'number', 'Nombre total réel de chapitres.', 'The real total number of chapters.', true),
      p('project_id', 'string', 'Brouillon cible (renvoyé par l’import).', 'Target draft (returned by the import).'),
    ],
    example: `{
  "name": "add_book_chapters",
  "arguments": { "start_order": 13, "total_chapters": 24, "chapters": [] }
}`,
  },
  {
    id: 'import-course-from-content',
    name: 'import_course_from_content',
    group: 'import',
    titleFr: 'Importer une formation', titleEn: 'Import a formation',
    descFr: 'Crée un brouillon de formation à partir des leçons rédigées dans la conversation.',
    descEn: 'Creates a formation draft from the lessons written in the conversation.',
    params: [
      p('title', 'string', 'Titre de la formation.', 'Formation title.', true),
      p('lessons', 'array', 'Leçons { title, content } — 12 maximum par appel.', 'Lessons { title, content } — max 12 per call.', true),
      p('total_lessons', 'number', 'Nombre total réel de leçons.', 'The real total number of lessons.', true),
      p('description', 'string', 'Résumé commercial.', 'Sales description.'),
      p('language', 'string', '`fr` ou `en`.', '`fr` or `en`.'),
      p('visuals', 'string', 'none | cover | cover_and_lessons | images_only.', 'none | cover | cover_and_lessons | images_only.'),
      p('org_id', 'string', 'Plateforme cible.', 'Target platform.'),
    ],
    example: `{
  "name": "import_course_from_content",
  "arguments": { "title": "Vendre en ligne en Afrique", "total_lessons": 10, "lessons": [] }
}`,
  },
  {
    id: 'add-course-lessons',
    name: 'add_course_lessons',
    group: 'import',
    titleFr: 'Ajouter des leçons', titleEn: 'Add lessons',
    descFr: 'Ajoute le lot suivant de leçons au même brouillon de formation.',
    descEn: 'Adds the next batch of lessons to the same formation draft.',
    params: [
      p('lessons', 'array', 'Leçons { title, content } — 12 maximum par appel.', 'Lessons { title, content } — max 12 per call.', true),
      p('start_order', 'number', 'Position de la première leçon du lot.', 'Position of the first lesson in the batch.', true),
      p('total_lessons', 'number', 'Nombre total réel de leçons.', 'The real total number of lessons.', true),
      p('project_id', 'string', 'Brouillon cible.', 'Target draft.'),
    ],
    example: `{
  "name": "add_course_lessons",
  "arguments": { "start_order": 13, "total_lessons": 20, "lessons": [] }
}`,
  },

  {
    id: 'create-book-draft',
    name: 'create_book_draft',
    group: 'generate',
    titleFr: 'Générer un livre', titleEn: 'Generate a book',
    descFr: "Crée un brouillon de livre et génère son plan avec l'IA de SiteViral. Renvoie un identifiant de job et le lien du brouillon.",
    descEn: "Creates a book draft and generates its outline with SiteViral's AI. Returns a job id and the draft link.",
    params: [
      p('title', 'string', 'Titre de travail.', 'Working title.', true),
      p('topic', 'string', 'Sujet, angle, promesse du livre.', 'Subject, angle, promise of the book.', true),
      p('target_audience', 'string', 'À qui le livre s’adresse.', 'Who the book is for.'),
      p('tone', 'string', 'Ton de voix.', 'Tone of voice.'),
      p('chapter_count', 'number', 'Nombre de chapitres souhaité (4-20, 8 par défaut).', 'Desired chapter count (4-20, defaults to 8).'),
      p('language', 'string', '`fr` ou `en`.', '`fr` or `en`.'),
      p('org_id', 'string', 'Plateforme cible.', 'Target platform.'),
    ],
    example: `{
  "name": "create_book_draft",
  "arguments": { "title": "Discipline", "topic": "Construire une discipline durable", "chapter_count": 10 }
}`,
  },
  {
    id: 'create-course-from-prompt',
    name: 'create_course_from_prompt',
    group: 'generate',
    titleFr: 'Générer une formation (idée)', titleEn: 'Generate a formation (idea)',
    descFr: 'Génère un brouillon de formation complet depuis une simple idée.',
    descEn: 'Generates a full formation draft from a simple idea.',
    params: [
      p('topic', 'string', 'Sujet de la formation.', 'Formation subject.', true),
      p('lesson_count', 'number', 'Nombre de leçons souhaité.', 'Desired lesson count.'),
      p('language', 'string', '`fr` ou `en`.', '`fr` or `en`.'),
      p('org_id', 'string', 'Plateforme cible.', 'Target platform.'),
    ],
    example: `{ "name": "create_course_from_prompt", "arguments": { "topic": "Mobile Money pour vendeurs" } }`,
  },
  {
    id: 'create-course-from-text',
    name: 'create_course_from_text',
    group: 'generate',
    titleFr: 'Générer une formation (texte)', titleEn: 'Generate a formation (text)',
    descFr: 'Transforme un texte source (notes, transcription, article) en formation structurée.',
    descEn: 'Turns source text (notes, transcript, article) into a structured formation.',
    params: [
      p('source_text', 'string', 'Le texte source à transformer.', 'The source text to transform.', true),
      p('title', 'string', 'Titre souhaité.', 'Desired title.'),
      p('language', 'string', '`fr` ou `en`.', '`fr` or `en`.'),
      p('org_id', 'string', 'Plateforme cible.', 'Target platform.'),
    ],
    example: `{ "name": "create_course_from_text", "arguments": { "source_text": "…" } }`,
  },
  {
    id: 'get-generation-status',
    name: 'get_generation_status',
    group: 'generate',
    titleFr: 'Statut de génération', titleEn: 'Generation status',
    descFr: 'Interroge l’avancement d’un job de génération et renvoie le lien du brouillon.',
    descEn: 'Polls the progress of a generation job and returns the draft link.',
    params: [p('job_id', 'string', 'Identifiant renvoyé à la création.', 'Id returned at creation time.', true)],
    example: `{ "name": "get_generation_status", "arguments": { "job_id": "…" } }`,
  },

  {
    id: 'get-draft-link',
    name: 'get_draft_link',
    group: 'utility',
    titleFr: 'Lien du brouillon', titleEn: 'Draft link',
    descFr: 'Re-renvoie le lien direct vers un brouillon dans l’application.',
    descEn: 'Re-fetches the direct link to a draft inside the app.',
    params: [p('project_id', 'string', 'Brouillon concerné.', 'The draft in question.')],
    example: `{ "name": "get_draft_link", "arguments": {} }`,
  },
  {
    id: 'finish-draft-visuals',
    name: 'finish_draft_visuals',
    group: 'utility',
    titleFr: 'Terminer les visuels', titleEn: 'Finish visuals',
    descFr: 'Relance la génération des illustrations manquantes d’un brouillon.',
    descEn: 'Restarts generation of a draft’s missing illustrations.',
    params: [p('project_id', 'string', 'Brouillon concerné.', 'The draft in question.')],
    example: `{ "name": "finish_draft_visuals", "arguments": {} }`,
  },
];
