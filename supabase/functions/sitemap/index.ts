import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://siteviral.com";

const staticPages = [
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/discover", priority: "0.9", changefreq: "daily" },
  { loc: "/spotlight", priority: "0.8", changefreq: "daily" },
  { loc: "/ambassador", priority: "0.8", changefreq: "weekly" },
  { loc: "/affiliate-program", priority: "0.7", changefreq: "weekly" },
  { loc: "/ambassador-program", priority: "0.7", changefreq: "weekly" },
  { loc: "/features", priority: "0.7", changefreq: "monthly" },
  { loc: "/about", priority: "0.6", changefreq: "monthly" },
  { loc: "/install", priority: "0.6", changefreq: "monthly" },
  { loc: "/devenir-partenaire", priority: "0.7", changefreq: "monthly" },
  { loc: "/faq", priority: "0.5", changefreq: "monthly" },
  { loc: "/contact", priority: "0.5", changefreq: "monthly" },
  { loc: "/resources", priority: "0.5", changefreq: "monthly" },
  { loc: "/changelog", priority: "0.4", changefreq: "monthly" },
  { loc: "/gagner", priority: "0.7", changefreq: "weekly" },
  { loc: "/vendre", priority: "0.7", changefreq: "monthly" },
  { loc: "/ecrire", priority: "0.7", changefreq: "monthly" },
  { loc: "/migrer", priority: "0.6", changefreq: "monthly" },
  { loc: "/protection", priority: "0.5", changefreq: "monthly" },
  { loc: "/blog", priority: "0.7", changefreq: "weekly" },
  { loc: "/blog/quest-ce-que-siteviral", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/comment-vendre-ebook-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/mobile-money-paiement-en-ligne", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/affiliation-sans-investissement", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/creer-boutique-digitale", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/monetiser-contenu-religieux", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/plateforme-dons-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/alternative-gofundme-afrique", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/gagner-argent-sans-contenu", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog/vendre-cours-en-ligne", priority: "0.6", changefreq: "monthly" },
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
  { loc: "/calculateur", priority: "0.5", changefreq: "monthly" },
  { loc: "/temoignages", priority: "0.5", changefreq: "monthly" },
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
];

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

    // Global sitemap
    const [
      { data: orgs },
      { data: products },
      { data: campaigns },
      { data: events },
      { data: offerings },
      { data: announcements },
      { data: programs },
      { data: mediaContent },
    ] = await Promise.all([
      sb.from("organizations").select("slug, updated_at").eq("is_active", true).eq("is_suspended", false),
      sb.from("digital_products").select("id, slug, updated_at, organizations(slug)").eq("is_published", true),
      sb.from("donation_campaigns").select("id, updated_at, organizations(slug)").eq("is_active", true).eq("is_published", true),
      sb.from("events").select("id, updated_at, organizations(slug)").eq("is_published", true),
      sb.from("offerings").select("id, updated_at, organizations(slug)").eq("is_active", true),
      sb.from("announcements").select("id, updated_at, organization_id, organizations(slug)").eq("is_published", true),
      sb.from("programs").select("id, updated_at, organizations(slug)").eq("is_published", true),
      sb.from("media_content").select("id, updated_at, organizations(slug)").eq("is_published", true),
    ]);

    const today = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    for (const p of staticPages) {
      xml += `  <url>
    <loc>${SITE_URL}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>
`;
    }

    if (orgs) {
      for (const org of orgs) {
        const lastmod = org.updated_at?.split("T")[0] || today;
        for (const sub of ORG_SUB_PAGES) {
          xml += `  <url>
    <loc>${SITE_URL}/org/${org.slug}${sub.suffix}</loc>
    <lastmod>${lastmod}</lastmod>
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
    <loc>${SITE_URL}${pPath}</loc>
    <lastmod>${p.updated_at?.split("T")[0] || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    if (campaigns) {
      for (const c of campaigns) {
        xml += `  <url>
    <loc>${SITE_URL}/campaign/${c.id}</loc>
    <lastmod>${c.updated_at?.split("T")[0] || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }

    if (events) {
      for (const e of events) {
        xml += `  <url>
    <loc>${SITE_URL}/event/${e.id}</loc>
    <lastmod>${e.updated_at?.split("T")[0] || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }

    if (offerings) {
      for (const o of offerings) {
        xml += `  <url>
    <loc>${SITE_URL}/offering/${o.id}</loc>
    <lastmod>${(o as any).updated_at?.split("T")[0] || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
`;
      }
    }

    if (announcements) {
      for (const a of announcements) {
        xml += `  <url>
    <loc>${SITE_URL}/announcement/${a.id}</loc>
    <lastmod>${a.updated_at?.split("T")[0] || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
`;
      }
    }

    if (programs) {
      for (const p of programs) {
        xml += `  <url>
    <loc>${SITE_URL}/program/${p.id}</loc>
    <lastmod>${(p as any).updated_at?.split("T")[0] || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
`;
      }
    }

    if (mediaContent) {
      for (const m of mediaContent) {
        xml += `  <url>
    <loc>${SITE_URL}/watch/${m.id}</loc>
    <lastmod>${(m as any).updated_at?.split("T")[0] || today}</lastmod>
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
  const today = new Date().toISOString().split("T")[0];

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
    <loc>${siteBase}${s.path}</loc>
    <lastmod>${org.updated_at?.split("T")[0] || today}</lastmod>
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
    <loc>${siteBase}${pPath}</loc>
    <lastmod>${p.updated_at?.split("T")[0] || today}</lastmod>
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
    <loc>${siteBase}/campaign/${c.id}</loc>
    <lastmod>${c.updated_at?.split("T")[0] || today}</lastmod>
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
    <loc>${siteBase}/event/${e.id}</loc>
    <lastmod>${e.updated_at?.split("T")[0] || today}</lastmod>
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
    <loc>${siteBase}/offering/${o.id}</loc>
    <lastmod>${(o as any).updated_at?.split("T")[0] || today}</lastmod>
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
    <loc>${siteBase}/announcement/${a.id}</loc>
    <lastmod>${a.updated_at?.split("T")[0] || today}</lastmod>
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
    <loc>${siteBase}/program/${p.id}</loc>
    <lastmod>${(p as any).updated_at?.split("T")[0] || today}</lastmod>
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
