import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://siteviral.com";

const staticPages = [
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/discover", priority: "0.9", changefreq: "daily" },
  { loc: "/affiliate-program", priority: "0.7", changefreq: "weekly" },
  { loc: "/ambassador-program", priority: "0.7", changefreq: "weekly" },
  { loc: "/about", priority: "0.6", changefreq: "monthly" },
  { loc: "/devenir-partenaire", priority: "0.7", changefreq: "monthly" },
  { loc: "/faq", priority: "0.5", changefreq: "monthly" },
  { loc: "/contact", priority: "0.5", changefreq: "monthly" },
  { loc: "/changelog", priority: "0.4", changefreq: "monthly" },
  { loc: "/gagner", priority: "0.7", changefreq: "weekly" },
  { loc: "/vendre", priority: "0.7", changefreq: "monthly" },
  { loc: "/ecrire", priority: "0.7", changefreq: "monthly" },
  { loc: "/blog", priority: "0.7", changefreq: "weekly" },
  { loc: "/blog/quest-ce-que-siteviral", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/siteviral-vs-shopify", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/siteviral-vs-patreon", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/siteviral-vs-systeme-io", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/siteviral-vs-gofundme", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/siteviral-pas-un-mlm", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/comment-siteviral-gagne-argent", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/10-choses-siteviral", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/siteviral-en-30-secondes", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/mobile-money-vente-digitale-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/comment-un-pasteur-peut-vendre-ses-predications", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/guide-ong-collecte-fonds-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/vendre-formation-en-ligne-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/devenir-ambassadeur-etudiant-guide", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/auteur-vendre-ebook-sans-amazon", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/musicien-monetiser-beats-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/diaspora-soutenir-projets-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/siteviral-vs-gumroad-comparaison", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/siteviral-vs-flutterwave-store", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/cas-etude-eglise-cameroun", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/cas-etude-formateur-cote-ivoire", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/securite-paiement-mobile-money", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/top-10-produits-numeriques-vendre-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/erreurs-vente-en-ligne-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/programme-ambassadeur-vs-mlm", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/photographe-vendre-presets-en-ligne", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/podcaster-monetiser-episodes", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/association-gerer-cotisations-en-ligne", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/seo-siteviral-referencer-page", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/whatsapp-marketing-siteviral", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/creer-premier-produit-numerique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/mobile-money-vs-carte-bancaire-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/siteviral-vs-sendowl", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/cas-etude-etudiant-ambassadeur-senegal", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/cas-etude-musicien-kinshasa", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/prix-optimal-produit-numerique-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/construire-audience-zero-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/protection-contenu-numerique-piratage", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/lancer-campagne-dons-reussie", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/tendances-economie-creatrice-afrique-2026", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/coach-transformer-expertise-revenus-passifs", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/designer-vendre-templates-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/siteviral-what-is-it-english", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/ambassador-program-earn-money-africa", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/entrepreneur-lancer-saas-produit-numerique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/cas-etude-photographe-dakar", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/cas-etude-ong-burkina-education", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/fiscalite-vente-en-ligne-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/email-marketing-vendeurs-siteviral", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/creer-bundle-augmenter-panier-moyen", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/optimiser-page-vendeur-conversions", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/partenaire-siteviral-b2b-guide", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/accessibilite-inclusion-numerique-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/avenir-economie-numerique-afrique-2030", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/comment-fixer-prix-produit-numerique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/ecrire-description-produit-qui-vend", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/lancer-programme-ambassadeur-guide", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/collecter-dons-eglise-en-ligne", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/vendre-formation-en-ligne-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/creer-ebook-qui-se-vend", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/erreurs-debutants-vente-en-ligne", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/monetiser-groupe-whatsapp", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/strategie-contenu-reseaux-sociaux-createurs", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/mobile-money-avenir-paiement-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/optimiser-page-organisation-siteviral", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/gagner-argent-etudiant-ambassadeur", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/siteviral-vs-teachable", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/diaspora-soutenir-afrique-numeriquement", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/securite-paiement-siteviral", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/ong-digitaliser-collecte-fonds", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/creer-contenu-numerique-smartphone", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/siteviral-vs-gumroad", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/psychology-achat-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/automatiser-ventes-siteviral", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/vendre-musique-en-ligne-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/photographe-vendre-photos-en-ligne", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/coach-vendre-services-en-ligne", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/enseignant-monetiser-cours-vacances", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/association-gerer-cotisations-en-ligne", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/whatsapp-marketing-vendre-plus", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/code-promo-strategie-boost-ventes", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/siteviral-vs-stripe-link", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/creer-vente-flash-siteviral", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/bundle-produits-augmenter-panier-moyen", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/construire-marque-personnelle-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/erreurs-couverture-ebook", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/temoignages-clients-booster-ventes", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/cooperatives-gestion-numerique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/analytics-comprendre-donnees-ventes", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/email-marketing-createurs-africains", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/produit-gratuit-strategie-acquisition", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/siteviral-vs-flutterwave-store", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/reussir-lancement-produit-numerique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/designer-vendre-templates-en-ligne", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/podcast-monetiser-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/femme-entrepreneur-digital-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/juriste-vendre-modeles-juridiques", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/agence-digitale-revendre-siteviral", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/centre-formation-vendre-cours-distance", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/seo-page-siteviral-google", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/storytelling-vendre-plus", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/creer-programme-fidelite-clients", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/leader-musulman-monetiser-contenu", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/missionnaire-financer-mission", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/ministere-gerer-dons-offrandes-ligne", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/retraite-partager-experience-en-ligne", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/sante-professionnel-vendre-guides", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/finance-expert-vendre-formations", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/media-en-ligne-paywall-contenu-premium", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/diaspora-creer-entreprise-distance", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/etudiant-creer-premier-ebook", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/contenu-evergreen-vs-actualite", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/protection-contenu-numerique-piratage", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/siteviral-vs-sendowl", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/siteviral-vs-ko-fi", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/creer-offre-irresistible", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/recurrence-revenus-createurs", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/gerer-service-client-createur", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/diversifier-sources-revenus-numeriques", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/preparer-ramadan-collecte-ventes", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/preparer-noel-ventes-numeriques", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/rentrée-scolaire-vendre-contenus-educatifs", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/collaborer-entre-createurs", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/transformer-expertise-en-revenus", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/creer-page-de-vente-convertit", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/utiliser-urgence-rarete-ethiquement", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/mesurer-roi-ambassadeurs", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/tontine-numerique-mobile-money", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/intelligence-artificielle-createurs-africains", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/erreurs-juridiques-createurs-eviter", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/scalabilite-business-numerique-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/pourquoi-commencer-maintenant", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/guide-affiliate-marketing-debutants", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/influenceurs", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/formateurs", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/coaches", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/eglises", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/associations", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/ong", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/auteurs", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/musiciens", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/podcasters", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/blogueurs", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/photographes", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/designers", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/consultants", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/entrepreneurs", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/etudiants", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/createurs-video", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/medias", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/agences", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/centres-formation", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/cooperatives", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/diaspora", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/enseignants", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/femmes-entrepreneures", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/finance", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/juristes", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/leaders-musulmans", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/ministeres", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/missionnaires", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/retraites", priority: "0.6", changefreq: "monthly" },
  { loc: "/pour/sante", priority: "0.6", changefreq: "monthly" },
  { loc: "/guide/affiliation-sans-investissement", priority: "0.5", changefreq: "monthly" },
  { loc: "/guide/alternative-gofundme", priority: "0.5", changefreq: "monthly" },
  { loc: "/guide/boutique-digitale-gratuite", priority: "0.5", changefreq: "monthly" },
  { loc: "/guide/gagner-sans-contenu", priority: "0.5", changefreq: "monthly" },
  { loc: "/guide/mobile-money-ecommerce", priority: "0.5", changefreq: "monthly" },
  { loc: "/guide/monetiser-contenu-religieux", priority: "0.5", changefreq: "monthly" },
  { loc: "/guide/plateforme-dons-afrique", priority: "0.5", changefreq: "monthly" },
  { loc: "/guide/vendre-cours-en-ligne", priority: "0.5", changefreq: "monthly" },
  { loc: "/guide/vendre-ebook-afrique", priority: "0.5", changefreq: "monthly" },
  { loc: "/promo/catalogue", priority: "0.7", changefreq: "weekly" },
  { loc: "/promo/gratuits", priority: "0.7", changefreq: "weekly" },
  { loc: "/promo/stars", priority: "0.7", changefreq: "weekly" },
  { loc: "/promo/ai-creations", priority: "0.7", changefreq: "weekly" },
  { loc: "/comparer", priority: "0.5", changefreq: "monthly" },
  { loc: "/presse", priority: "0.4", changefreq: "monthly" },
  { loc: "/etudes-de-cas", priority: "0.5", changefreq: "monthly" },
  { loc: "/partenaires", priority: "0.4", changefreq: "monthly" },
  { loc: "/tutoriels", priority: "0.5", changefreq: "monthly" },
  { loc: "/status", priority: "0.3", changefreq: "daily" },
  { loc: "/help", priority: "0.4", changefreq: "monthly" },
  { loc: "/terms", priority: "0.3", changefreq: "yearly" },
  { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
  { loc: "/refund-policy", priority: "0.3", changefreq: "yearly" },
  { loc: "/security", priority: "0.3", changefreq: "yearly" },
  { loc: "/compliance", priority: "0.3", changefreq: "yearly" },
  { loc: "/acceptable-use", priority: "0.3", changefreq: "yearly" },
  { loc: "/payout-policy", priority: "0.3", changefreq: "yearly" },
  { loc: "/aml", priority: "0.3", changefreq: "yearly" },
  { loc: "/dpa", priority: "0.3", changefreq: "yearly" },
  { loc: "/subprocessors", priority: "0.3", changefreq: "yearly" },
  { loc: "/ambassador-terms", priority: "0.3", changefreq: "yearly" },
  { loc: "/partner-terms", priority: "0.3", changefreq: "yearly" },
  { loc: "/pricing", priority: "0.9", changefreq: "monthly" },
  { loc: "/courses", priority: "0.8", changefreq: "daily" },
  { loc: "/new-this-week", priority: "0.8", changefreq: "weekly" },
  { loc: "/churches", priority: "0.8", changefreq: "monthly" },
  { loc: "/marketplace/templates", priority: "0.6", changefreq: "weekly" },
  { loc: "/developers", priority: "0.7", changefreq: "weekly" },
  { loc: "/docs", priority: "0.7", changefreq: "weekly" },
  { loc: "/docs/api", priority: "0.6", changefreq: "weekly" },
  { loc: "/integrations", priority: "0.6", changefreq: "monthly" },
  { loc: "/roadmap", priority: "0.5", changefreq: "weekly" },
  { loc: "/newsletter", priority: "0.5", changefreq: "monthly" },
  { loc: "/glossary", priority: "0.5", changefreq: "monthly" },
  { loc: "/plan-du-site", priority: "0.4", changefreq: "monthly" },
  { loc: "/brand", priority: "0.4", changefreq: "yearly" },
  { loc: "/cookies", priority: "0.3", changefreq: "yearly" },
  { loc: "/legal-notices", priority: "0.3", changefreq: "yearly" },
  { loc: "/copyright", priority: "0.3", changefreq: "yearly" },
  { loc: "/data-deletion", priority: "0.3", changefreq: "yearly" },
  { loc: "/report", priority: "0.3", changefreq: "yearly" },
  // ─── Verticals, hubs and discovery surfaces ───
  { loc: "/church/about", priority: "0.6", changefreq: "monthly" },
  { loc: "/showcase", priority: "0.5", changefreq: "weekly" },
  { loc: "/founders", priority: "0.5", changefreq: "monthly" },
];

const lastmodTag = (value?: string | null) =>
  value ? `\n    <lastmod>${String(value).split("T")[0]}</lastmod>` : "";

const ORG_SUB_PAGES = [
  { suffix: "", priority: "0.8" },
  { suffix: "/store", priority: "0.7" },
  { suffix: "/content", priority: "0.6" },
  { suffix: "/events", priority: "0.6" },
  { suffix: "/donate", priority: "0.6" },
  { suffix: "/photos", priority: "0.5" },
  { suffix: "/offerings", priority: "0.5" },
  { suffix: "/dons", priority: "0.5" },
];

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Check if request comes from an org domain
    const reqUrl = new URL(req.url);
    const domainParam = reqUrl.searchParams.get('domain') || req.headers.get('x-forwarded-host') || '';
    let orgFilter: string | null = null;
    let siteBase = SITE_URL;

    if (domainParam && domainParam !== 'siteviral.com' && domainParam !== 'www.siteviral.com') {
      // Resolve org from domain
      const { data: domainData } = await sb
        .from('org_domains')
        .select('organization_id')
        .eq('domain', domainParam)
        .eq('is_verified', true)
        .limit(1)
        .single();

      if (domainData) {
        orgFilter = domainData.organization_id;
        siteBase = `https://${domainParam}`;
      } else if (domainParam.endsWith('.siteviral.com')) {
        const sub = domainParam.replace('.siteviral.com', '');
        const { data: org } = await sb
          .from('organizations')
          .select('id')
          .eq('slug', sub)
          .single();
        if (org) {
          orgFilter = org.id;
          siteBase = `https://${domainParam}`;
        }
      }
    }

    // If org-filtered sitemap, only show org content
    if (orgFilter) {
      return await generateOrgSitemap(sb, orgFilter, siteBase);
    }

    // Global sitemap.
    // PostgREST caps a single response at 1000 rows, so every content query is
    // paginated — otherwise newly published items silently fall out of the sitemap
    // once a table passes 1000 published rows.
    const PAGE = 1000;
    const fetchAll = async (build: () => any): Promise<any[]> => {
      const all: any[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await build().range(from, from + PAGE - 1);
        if (error) {
          console.error("sitemap query failed:", error.message);
          break;
        }
        if (!data?.length) break;
        all.push(...data);
        if (data.length < PAGE) break;
      }
      return all;
    };

    const [orgs, products, campaigns, events, offerings, announcements, programs, mediaContent] =
      await Promise.all([
        fetchAll(() => sb.from("organizations").select("slug, updated_at").eq("is_active", true).eq("is_suspended", false)),
        fetchAll(() => sb.from("digital_products").select("id, slug, updated_at, organizations(slug)").eq("is_published", true)),
        fetchAll(() => sb.from("donation_campaigns").select("id, updated_at, organizations(slug)").eq("is_active", true).eq("is_published", true)),
        fetchAll(() => sb.from("events").select("id, updated_at, organizations(slug)").eq("is_published", true)),
        fetchAll(() => sb.from("offerings").select("id, updated_at, organizations(slug)").eq("is_active", true)),
        fetchAll(() => sb.from("announcements").select("id, updated_at, organization_id, organizations(slug)").eq("is_published", true)),
        fetchAll(() => sb.from("programs").select("id, updated_at, organizations(slug)").eq("is_published", true)),
        fetchAll(() => sb.from("media_content").select("id, updated_at, organizations(slug)").eq("is_published", true)),
      ]);


    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    for (const p of staticPages) {
      xml += `  <url>
    <loc>${SITE_URL}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>
`;
    }

    if (orgs) {
      for (const org of orgs) {
        for (const sub of ORG_SUB_PAGES) {
          xml += `  <url>
    <loc>${SITE_URL}/org/${org.slug}${sub.suffix}</loc>${lastmodTag(org.updated_at)}
    <changefreq>daily</changefreq>
    <priority>${sub.priority}</priority>
  </url>
`;
        }
      }
    }

    if (products) {
      for (const p of products) {
        const orgSlug = (p as any).organizations?.slug;
        if (!orgSlug) continue;
        const pPath = p.slug ? `/org/${orgSlug}/p/${p.slug}` : `/org/${orgSlug}/product/${p.id}`;
        xml += `  <url>
    <loc>${SITE_URL}${pPath}</loc>${lastmodTag(p.updated_at)}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    if (campaigns) {
      for (const c of campaigns) {
        xml += `  <url>
    <loc>${SITE_URL}/campaign/${c.id}</loc>${lastmodTag(c.updated_at)}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }

    if (events) {
      for (const e of events) {
        xml += `  <url>
    <loc>${SITE_URL}/event/${e.id}</loc>${lastmodTag(e.updated_at)}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }

    if (offerings) {
      for (const o of offerings) {
        xml += `  <url>
    <loc>${SITE_URL}/offering/${o.id}</loc>${lastmodTag((o as any).updated_at)}
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
`;
      }
    }

    if (announcements) {
      for (const a of announcements) {
        xml += `  <url>
    <loc>${SITE_URL}/announcement/${a.id}</loc>${lastmodTag(a.updated_at)}
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
`;
      }
    }

    if (programs) {
      for (const p of programs) {
        xml += `  <url>
    <loc>${SITE_URL}/program/${p.id}</loc>${lastmodTag((p as any).updated_at)}
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
`;
      }
    }

    if (mediaContent) {
      for (const m of mediaContent) {
        xml += `  <url>
    <loc>${SITE_URL}/watch/${m.id}</loc>${lastmodTag((m as any).updated_at)}
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
`;
      }
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response("Error generating sitemap", { status: 500 });
  }
});

/** Generate an org-specific sitemap for custom domains */
async function generateOrgSitemap(sb: any, orgId: string, siteBase: string): Promise<Response> {

  const [
    { data: org },
    { data: products },
    { data: campaigns },
    { data: events },
    { data: offerings },
    { data: announcements },
    { data: programs },
  ] = await Promise.all([
    sb.from("organizations").select("slug, updated_at").eq("id", orgId).single(),
    sb.from("digital_products").select("id, slug, updated_at").eq("organization_id", orgId).eq("is_published", true),
    sb.from("donation_campaigns").select("id, updated_at").eq("organization_id", orgId).eq("is_active", true).eq("is_published", true),
    sb.from("events").select("id, updated_at").eq("organization_id", orgId).eq("is_published", true),
    sb.from("offerings").select("id, updated_at").eq("organization_id", orgId).eq("is_active", true),
    sb.from("announcements").select("id, updated_at").eq("organization_id", orgId).eq("is_published", true),
    sb.from("programs").select("id, updated_at").eq("organization_id", orgId).eq("is_published", true),
  ]);

  if (!org) {
    return new Response("Org not found", { status: 404 });
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Home + sections (on custom domain, paths are direct: /, /store, /events, etc.)
  const orgSections = [
    { path: "/", priority: "1.0" },
    { path: "/store", priority: "0.8" },
    { path: "/content", priority: "0.7" },
    { path: "/events", priority: "0.7" },
    { path: "/donate", priority: "0.7" },
    { path: "/photos", priority: "0.6" },
    { path: "/offerings", priority: "0.6" },
  ];

  for (const s of orgSections) {
    xml += `  <url>
    <loc>${siteBase}${s.path}</loc>${lastmodTag(org.updated_at)}
    <changefreq>daily</changefreq>
    <priority>${s.priority}</priority>
  </url>
`;
  }

  // Products
  if (products) {
    for (const p of products) {
      const pPath = p.slug ? `/p/${p.slug}` : `/product/${p.id}`;
      xml += `  <url>
    <loc>${siteBase}${pPath}</loc>${lastmodTag(p.updated_at)}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }
  }

  // Campaigns
  if (campaigns) {
    for (const c of campaigns) {
      xml += `  <url>
    <loc>${siteBase}/campaign/${c.id}</loc>${lastmodTag(c.updated_at)}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }
  }

  // Events
  if (events) {
    for (const e of events) {
      xml += `  <url>
    <loc>${siteBase}/event/${e.id}</loc>${lastmodTag(e.updated_at)}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }
  }

  // Offerings
  if (offerings) {
    for (const o of offerings) {
      xml += `  <url>
    <loc>${siteBase}/offering/${o.id}</loc>${lastmodTag((o as any).updated_at)}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }
  }

  // Announcements
  if (announcements) {
    for (const a of announcements) {
      xml += `  <url>
    <loc>${siteBase}/announcement/${a.id}</loc>${lastmodTag(a.updated_at)}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }
  }

  // Programs
  if (programs) {
    for (const p of programs) {
      xml += `  <url>
    <loc>${siteBase}/program/${p.id}</loc>${lastmodTag((p as any).updated_at)}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }
  }

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
