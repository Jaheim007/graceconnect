/**
 * Documentation content for /docs. Plain typed content modules — no CMS.
 * Each section renders as an anchored block in the docs page.
 */

export type DocsBlock =
  | { kind: 'p'; fr: string; en: string }
  | { kind: 'steps'; fr: string[]; en: string[] }
  | { kind: 'code'; label: string; code: string }
  | { kind: 'note'; fr: string; en: string };

export type DocsSection = {
  id: string;
  titleFr: string;
  titleEn: string;
  blocks: DocsBlock[];
};

export const DOCS_SECTIONS: DocsSection[] = [
  {
    id: 'getting-started',
    titleFr: 'Premiers pas',
    titleEn: 'Getting started',
    blocks: [
      {
        kind: 'p',
        fr: "SiteViral est la plateforme où tu crées, vends et encaisses ton contenu digital : livres, formations, produits, dons. Tu n'as besoin d'aucune clé pour commencer — tout part d'un compte et d'une plateforme.",
        en: 'SiteViral is where you create, sell and get paid for digital content: books, formations, products, donations. You need no key to start — everything begins with an account and a platform.',
      },
      {
        kind: 'steps',
        fr: [
          'Crée ton compte, puis ta plateforme (nom, identité, devise).',
          'Publie un premier produit : livre, formation ou fichier.',
          'Renseigne ton moyen de versement (Mobile Money ou compte bancaire) et complète la vérification.',
          'Partage ton lien produit, ton flyer ou intègre le bouton de paiement sur ton site.',
        ],
        en: [
          'Create your account, then your platform (name, identity, currency).',
          'Publish a first product: book, formation or file.',
          'Add your payout method (Mobile Money or bank account) and complete verification.',
          'Share your product link, your flyer, or embed the checkout button on your own site.',
        ],
      },
      {
        kind: 'note',
        fr: 'Aucun abonnement obligatoire : SiteViral prélève 10 % sur les ventes, et 0 % sur les offrandes.',
        en: 'No mandatory subscription: SiteViral takes 10% on sales, and 0% on offerings.',
      },
    ],
  },
  {
    id: 'connect-assistant',
    titleFr: 'Connecter un assistant IA (MCP)',
    titleEn: 'Connect an AI assistant (MCP)',
    blocks: [
      {
        kind: 'p',
        fr: "SiteViral expose un serveur MCP. En le branchant à ChatGPT, Claude, Gemini ou tout client MCP, l'assistant peut créer des brouillons de livres et de formations directement dans ta plateforme, lire tes produits et suivre l'avancement d'une génération.",
        en: 'SiteViral exposes an MCP server. Connect it to ChatGPT, Claude, Gemini or any MCP client and the assistant can create book and formation drafts straight into your platform, read your products and track generation progress.',
      },
      {
        kind: 'steps',
        fr: [
          "Copie l'URL du connecteur depuis Réglages → Connexions assistants dans l'application.",
          'Dans ChatGPT : Réglages → Connecteurs → « Ajouter un connecteur » → colle le lien.',
          'Dans Claude : Réglages → Connectors → « Add custom connector » → colle le lien.',
          'Autre client : ajoute un serveur MCP distant et colle le lien comme URL.',
          "Autorise l'accès : la connexion utilise ton compte SiteViral via OAuth, aucune clé à copier.",
        ],
        en: [
          'Copy the connector URL from Settings → Assistant connections in the app.',
          'In ChatGPT: Settings → Connectors → "Add connector" → paste the link.',
          'In Claude: Settings → Connectors → "Add custom connector" → paste the link.',
          'Any other client: add a remote MCP server and paste the link as the URL.',
          'Approve access: the connection uses your SiteViral account over OAuth, no key to copy.',
        ],
      },
      {
        kind: 'code',
        label: 'connector url',
        code: 'https://<your-project>.supabase.co/functions/v1/mcp',
      },
      {
        kind: 'note',
        fr: 'Tout ce que l’assistant crée arrive en BROUILLON. Rien n’est publié ni mis en vente sans ton action dans l’application.',
        en: 'Everything the assistant creates lands as a DRAFT. Nothing is published or put on sale without your action in the app.',
      },
    ],
  },
  {
    id: 'embed-checkout',
    titleFr: 'Intégrer le paiement sur ton site',
    titleEn: 'Embed checkout on your site',
    blocks: [
      {
        kind: 'p',
        fr: "Le widget SiteViral ajoute un bouton d'achat sur n'importe quel site (WordPress, Wix, site statique). Le paiement s'ouvre dans une fenêtre sécurisée : Mobile Money ou carte.",
        en: 'The SiteViral widget adds a buy button to any site (WordPress, Wix, static HTML). Checkout opens in a secure frame: Mobile Money or card.',
      },
      {
        kind: 'code',
        label: 'html',
        code: `<div data-siteviral-product="PRODUCT_ID"
     data-siteviral-text="Acheter maintenant"
     data-siteviral-color="#d4920a"
     data-siteviral-ref="AFFILIATE_CODE"></div>
<script src="https://siteviral.com/embed.js" defer></script>`,
      },
      {
        kind: 'steps',
        fr: [
          "Récupère l'identifiant produit depuis la page du produit dans ton espace admin.",
          'Colle le bloc HTML là où tu veux voir le bouton.',
          "Ajoute `data-siteviral-ref` avec un code ambassadeur pour attribuer la vente.",
        ],
        en: [
          'Get the product id from the product page in your admin space.',
          'Paste the HTML block where you want the button.',
          'Add `data-siteviral-ref` with an ambassador code to attribute the sale.',
        ],
      },
    ],
  },
  {
    id: 'products-pricing',
    titleFr: 'Produits & tarification',
    titleEn: 'Products & pricing',
    blocks: [
      {
        kind: 'p',
        fr: "Un produit peut être un livre, une formation, un fichier ou un accès. Chaque produit a un prix dans la devise de ta plateforme, une description, une couverture, et peut porter une commission ambassadeur.",
        en: 'A product can be a book, a formation, a file or an access pass. Each product has a price in your platform currency, a description, a cover, and can carry an ambassador commission.',
      },
      {
        kind: 'steps',
        fr: [
          'Gratuit : sert d’aimant, capture les acheteurs pour la suite.',
          'Payant unique : paiement une fois, accès immédiat.',
          'Formation à paliers : plusieurs niveaux d’accès sur le même contenu.',
          'Offrande / don : montant libre, 0 % de commission plateforme.',
        ],
        en: [
          'Free: works as a lead magnet, captures buyers for later.',
          'One-time paid: pay once, instant access.',
          'Tiered formation: several access levels on the same content.',
          'Offering / donation: free amount, 0% platform fee.',
        ],
      },
    ],
  },
  {
    id: 'payments-payouts',
    titleFr: 'Paiements & versements',
    titleEn: 'Payments & payouts',
    blocks: [
      {
        kind: 'p',
        fr: "Les acheteurs paient en Mobile Money (Wave, Orange, MTN, Moov) ou par carte. L'accès au contenu est délivré dès la confirmation du paiement, sans intervention manuelle.",
        en: 'Buyers pay by Mobile Money (Wave, Orange, MTN, Moov) or card. Access is delivered the moment payment is confirmed, with no manual step.',
      },
      {
        kind: 'steps',
        fr: [
          'Une vente est encaissée puis affichée dans ton tableau de bord avec le détail des frais.',
          'Les revenus vendeur passent par un délai de sécurité avant versement.',
          'Les versements exigent une vérification d’identité complétée.',
          'Chaque versement est retraçable dans ton historique.',
        ],
        en: [
          'A sale is collected then shown in your dashboard with a fee breakdown.',
          'Seller revenue goes through a security hold before payout.',
          'Payouts require completed identity verification.',
          'Every payout is traceable in your history.',
        ],
      },
    ],
  },
  {
    id: 'errors',
    titleFr: 'Erreurs & limites',
    titleEn: 'Errors & limits',
    blocks: [
      {
        kind: 'steps',
        fr: [
          '`Not authenticated` — la connexion assistant a expiré : reconnecte le connecteur.',
          '`No workspace available` — crée une plateforme, ou passe `org_id` si tu en as plusieurs.',
          '`Insufficient credits` — recharge tes crédits depuis la page facturation.',
          'Import : 12 chapitres ou leçons maximum par appel — enchaîne les lots jusqu’au total déclaré.',
        ],
        en: [
          '`Not authenticated` — the assistant session expired: reconnect the connector.',
          '`No workspace available` — create a platform, or pass `org_id` when you have several.',
          '`Insufficient credits` — top up from the billing page.',
          'Import: max 12 chapters or lessons per call — chain batches until the declared total.',
        ],
      },
    ],
  },
];
