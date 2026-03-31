import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * og-proxy — Universal bot-aware OG proxy for SPA social previews.
 *
 * Bots receive a static OG HTML page (200) with proper tags.
 * Human users are 302-redirected to the SPA at siteviral.com/<path>.
 *
 * Supports org custom domains: when ?domain= is provided or x-forwarded-host
 * points to an org domain, the canonical URL uses that domain.
 */

const SITE_URL = 'https://siteviral.com';
const DEFAULT_TITLE = 'Siteviral — Créez votre plateforme digitale, vendez et gagnez';
const DEFAULT_DESCRIPTION =
  'Créez votre plateforme digitale, vendez vos produits numériques, collectez des dons via Mobile Money et gagnez en partageant du contenu.';
const DEFAULT_IMAGE = 'https://siteviral.com/og-image.png';

// ─── Bot detection ───

const SOCIAL_BOT_PATTERNS = [
  'facebookexternalhit', 'facebot', 'meta-externalagent', 'meta-externalfetcher',
  'whatsapp', 'twitterbot', 'linkedinbot',
  'slackbot', 'slack-imgproxy', 'discordbot', 'telegrambot',
  'pinterestbot', 'redditbot', 'vkshare',
];

const SEARCH_BOT_PATTERNS = [
  'googlebot', 'google-inspectiontool', 'googleother',
  'bingbot', 'yandexbot', 'baiduspider', 'duckduckbot',
];

const ALL_BOT_PATTERNS = [...SOCIAL_BOT_PATTERNS, ...SEARCH_BOT_PATTERNS];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return ALL_BOT_PATTERNS.some((pattern) => ua.includes(pattern));
}

function isSearchBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return SEARCH_BOT_PATTERNS.some((pattern) => ua.includes(pattern));
}

// ─── HTML helpers ───

const escapeHtml = (v: string) =>
  v
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function renderOgHtml(title: string, description: string, image: string, canonicalUrl: string, siteName?: string): string {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const img = escapeHtml(image);
  const url = escapeHtml(canonicalUrl);
  const sn = escapeHtml(siteName || 'Siteviral');
  const fbAppId = Deno.env.get('FB_APP_ID') || '';

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:image:secure_url" content="${img}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${url}" />
    <meta property="og:site_name" content="${sn}" />
    <meta property="og:locale" content="fr_FR" />${fbAppId ? `\n    <meta property="fb:app_id" content="${escapeHtml(fbAppId)}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@siteviral" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${img}" />
    <link rel="canonical" href="${url}" />
  </head>
  <body>
    <header>
      <h1>${t}</h1>
      <p>${d}</p>
    </header>
    <nav>
      <a href="https://siteviral.com/discover">Explorer</a> |
      <a href="https://siteviral.com/features">Fonctionnalités</a> |
      <a href="https://siteviral.com/ambassador">Ambassadeur</a>
    </nav>
    <main>
      <section>
        <p>${d}</p>
        <p>Découvrez ${sn} sur Siteviral — votre plateforme digitale tout-en-un pour créer, vendre et partager du contenu numérique.</p>
      </section>
    </main>
  </body>
</html>`;
}

// ─── DB resolution ───

interface MetaResult {
  title: string;
  description: string;
  image: string;
}

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

/** Resolve org from a custom domain or subdomain */
async function resolveOrgFromDomain(domain: string): Promise<{ orgId: string; slug: string; name: string } | null> {
  if (!domain || domain === 'siteviral.com' || domain === 'www.siteviral.com' || domain === 'api.siteviral.com') return null;

  const sb = getSupabase();

  // Check org_domains table
  const { data } = await sb
    .from('org_domains')
    .select('organization_id, organizations(slug, name)')
    .eq('domain', domain)
    .eq('is_verified', true)
    .limit(1)
    .single();

  if (data) {
    return {
      orgId: data.organization_id,
      slug: (data as any).organizations?.slug,
      name: (data as any).organizations?.name,
    };
  }

  // Fallback: *.siteviral.com subdomain
  if (domain.endsWith('.siteviral.com')) {
    const sub = domain.replace('.siteviral.com', '');
    if (sub && sub !== 'www' && sub !== 'api') {
      const { data: org } = await sb
        .from('organizations')
        .select('id, slug, name')
        .eq('slug', sub)
        .single();
      if (org) return { orgId: org.id, slug: org.slug, name: org.name };
    }
  }

  return null;
}

const BLOG_META: Record<string, { title: string; description: string }> = {
  'quest-ce-que-siteviral': { title: "Qu'est-ce que Siteviral ? Le guide complet", description: "Découvrez ce qu'est Siteviral, comment ça marche, pour qui c'est fait et pourquoi c'est différent." },
  'comment-vendre-ebook-afrique': { title: 'Comment vendre un ebook en Afrique', description: 'Guide complet pour vendre vos ebooks en Afrique avec Mobile Money via Siteviral.' },
  'mobile-money-paiement-en-ligne': { title: 'Mobile Money : paiement en ligne en Afrique', description: 'Comment accepter les paiements Mobile Money pour vos produits numériques.' },
  'affiliation-sans-investissement': { title: 'Affiliation sans investissement', description: "Gagnez de l'argent en partageant des liens sans investir un centime." },
  'creer-boutique-digitale': { title: 'Créer une boutique digitale', description: 'Comment créer votre boutique en ligne de produits numériques en 5 minutes.' },
  'monetiser-contenu-religieux': { title: 'Monétiser du contenu religieux', description: 'Comment les églises et ministères peuvent monétiser prédications, livres et formations.' },
  'plateforme-dons-afrique': { title: 'Plateforme de dons en Afrique', description: 'La meilleure plateforme pour collecter des dons en Afrique via Mobile Money.' },
  'alternative-gofundme-afrique': { title: 'Alternative à GoFundMe en Afrique', description: 'Siteviral : la meilleure alternative à GoFundMe pour collecter des fonds en Afrique.' },
  'gagner-argent-sans-contenu': { title: "Gagner de l'argent sans créer de contenu", description: "Comment gagner de l'argent en ligne sans produire de contenu grâce à l'affiliation." },
  'vendre-cours-en-ligne': { title: 'Vendre des cours en ligne', description: 'Guide pour créer et vendre vos formations en ligne avec Siteviral.' },
};

async function resolveFromPath(path: string): Promise<MetaResult | null> {
  const supabase = getSupabase();
  let m: RegExpMatchArray | null;
  const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

  // /org/:slug/product/:id  OR  /org/:slug/p/:productSlug
  m = path.match(/^\/org\/[^\/]+\/(?:product|p)\/([^\/\?#]+)/);
  if (m) {
    const identifier = decodeURIComponent(m[1]);
    let data: any = null;
    if (isUuid(identifier)) {
      ({ data } = await supabase
        .from('digital_products')
        .select('title, description, cover_image_url, organizations(name)')
        .eq('id', identifier)
        .eq('is_published', true)
        .maybeSingle());
    }
    if (!data) {
      ({ data } = await supabase
        .from('digital_products')
        .select('title, description, cover_image_url, organizations(name)')
        .eq('slug', identifier)
        .eq('is_published', true)
        .maybeSingle());
    }
    if (data) {
      const orgName = (data as any).organizations?.name || 'Siteviral';
      return {
        title: `${data.title} — ${orgName}`,
        description: stripHtml(data.description || `Découvrez ${data.title}`).slice(0, 300),
        image: data.cover_image_url || DEFAULT_IMAGE,
      };
    }
  }

  // /org/:slug
  m = path.match(/^\/org\/([^\/\?#]+)$/);
  if (m) {
    const { data } = await supabase
      .from('organizations')
      .select('name, description, logo_url, banner_url')
      .eq('slug', decodeURIComponent(m[1]))
      .eq('is_active', true)
      .maybeSingle();
    if (data)
      return {
        title: `${data.name} — Siteviral`,
        description: stripHtml(data.description || `Découvrez ${data.name} sur Siteviral`).slice(0, 300),
        image: data.banner_url || data.logo_url || DEFAULT_IMAGE,
      };
  }

  // /org/:slug/store, /content, /events, etc.
  m = path.match(/^\/org\/([^\/\?#]+)\/(store|content|events|donate|photos|offerings|dons)/);
  if (m) {
    const sectionNames: Record<string, string> = {
      store: 'Boutique', content: 'Contenu', events: 'Événements',
      donate: 'Dons', photos: 'Photos', offerings: 'Offrandes', dons: 'Offrandes',
    };
    const { data } = await supabase
      .from('organizations')
      .select('name, description, logo_url, banner_url')
      .eq('slug', decodeURIComponent(m[1]))
      .eq('is_active', true)
      .maybeSingle();
    if (data)
      return {
        title: `${sectionNames[m[2]] || m[2]} — ${data.name}`,
        description: stripHtml(data.description || `Découvrez ${data.name} sur Siteviral`).slice(0, 300),
        image: data.banner_url || data.logo_url || DEFAULT_IMAGE,
      };
  }

  // /product/:id (standalone)
  m = path.match(/^\/product\/([^\/\?#]+)/);
  if (m) {
    const { data } = await supabase
      .from('digital_products')
      .select('title, description, cover_image_url, organizations(name)')
      .eq('id', decodeURIComponent(m[1]))
      .eq('is_published', true)
      .maybeSingle();
    if (data) {
      const orgName = (data as any).organizations?.name || 'Siteviral';
      return {
        title: `${data.title} — ${orgName}`,
        description: stripHtml(data.description || `Découvrez ${data.title}`).slice(0, 300),
        image: data.cover_image_url || DEFAULT_IMAGE,
      };
    }
  }

  // /campaign/:id
  m = path.match(/^\/campaign\/([^\/\?#]+)/);
  if (m) {
    const { data } = await supabase
      .from('donation_campaigns')
      .select('title, description, image_url, organizations(name)')
      .eq('id', decodeURIComponent(m[1]))
      .maybeSingle();
    if (data)
      return {
        title: `${data.title} — ${(data as any).organizations?.name || 'Siteviral'}`,
        description: stripHtml(data.description || `Soutenez ${data.title}`).slice(0, 300),
        image: data.image_url || DEFAULT_IMAGE,
      };
  }

  // /event/:id
  m = path.match(/^\/event\/([^\/\?#]+)/);
  if (m) {
    const { data } = await supabase
      .from('events')
      .select('title, description, image_url, organizations(name)')
      .eq('id', decodeURIComponent(m[1]))
      .maybeSingle();
    if (data)
      return {
        title: `${data.title} — ${(data as any).organizations?.name || 'Siteviral'}`,
        description: stripHtml(data.description || data.title).slice(0, 300),
        image: data.image_url || DEFAULT_IMAGE,
      };
  }

  // /offering/:id
  m = path.match(/^\/offering\/([^\/\?#]+)/);
  if (m) {
    const { data } = await supabase
      .from('offerings')
      .select('title, description, image_url, organizations(name)')
      .eq('id', decodeURIComponent(m[1]))
      .maybeSingle();
    if (data)
      return {
        title: `${(data as any).title || 'Offrande'} — ${(data as any).organizations?.name || 'Siteviral'}`,
        description: stripHtml((data as any).description || 'Participez à cette offrande').slice(0, 300),
        image: (data as any).image_url || DEFAULT_IMAGE,
      };
  }

  // /announcement/:id
  m = path.match(/^\/announcement\/([^\/\?#]+)/);
  if (m) {
    const { data } = await supabase
      .from('announcements')
      .select('title, body, image_url, organizations(name)')
      .eq('id', decodeURIComponent(m[1]))
      .maybeSingle();
    if (data)
      return {
        title: `${data.title} — ${(data as any).organizations?.name || 'Siteviral'}`,
        description: stripHtml(data.body || data.title).slice(0, 300),
        image: data.image_url || DEFAULT_IMAGE,
      };
  }

  // /program/:id
  m = path.match(/^\/program\/([^\/\?#]+)/);
  if (m) {
    const { data } = await supabase
      .from('programs')
      .select('title, description, cover_image_url, organizations(name)')
      .eq('id', decodeURIComponent(m[1]))
      .maybeSingle();
    if (data)
      return {
        title: `${data.title} — ${(data as any).organizations?.name || 'Siteviral'}`,
        description: stripHtml(data.description || data.title).slice(0, 300),
        image: data.cover_image_url || DEFAULT_IMAGE,
      };
  }

  // /blog/:slug
  m = path.match(/^\/blog\/([^\/\?#]+)/);
  if (m) {
    const slug = decodeURIComponent(m[1]);
    const meta = BLOG_META[slug];
    if (meta) return { title: meta.title, description: meta.description, image: DEFAULT_IMAGE };
  }

  return null;
}

// ─── Main handler ───

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  const reqUrl = new URL(req.url);

  const forwardedUserAgent =
    req.headers.get('x-original-user-agent') ||
    req.headers.get('x-bot-user-agent') ||
    '';
  const userAgent = forwardedUserAgent || req.headers.get('user-agent') || '';
  const forceBot =
    req.headers.get('x-force-og-bot') === '1' ||
    reqUrl.searchParams.get('bot') === '1';

  // ── Resolve org from domain param or x-forwarded-host ──
  const domainParam = reqUrl.searchParams.get('domain') || req.headers.get('x-forwarded-host') || '';
  let orgContext: { orgId: string; slug: string; name: string } | null = null;
  let baseUrl = SITE_URL;

  if (domainParam) {
    try {
      orgContext = await resolveOrgFromDomain(domainParam);
      if (orgContext) {
        baseUrl = `https://${domainParam}`;
      }
    } catch {
      // fallback to default
    }
  }

  // Extract the path
  let contentPath = reqUrl.searchParams.get('path');

  // ── Safety: never intercept payment/checkout routes ──
  const rawPath = contentPath || reqUrl.pathname;
  if (/\/(payment|checkout|success|cancel|pay\b)/i.test(rawPath)) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${baseUrl}${rawPath.startsWith('/') ? rawPath : `/${rawPath}`}`,
        'Cache-Control': 'no-cache, no-store',
        'X-OG-Proxy-Mode': 'payment-bypass',
      },
    });
  }

  if (!contentPath) {
    const fullPath = reqUrl.pathname;
    const proxyIdx = fullPath.indexOf('/og-proxy');
    if (proxyIdx !== -1) {
      contentPath = fullPath.substring(proxyIdx + '/og-proxy'.length) || '/';
    } else {
      contentPath = fullPath || '/';
    }
  }

  // Normalize
  try {
    contentPath = decodeURIComponent(contentPath);
  } catch {
    // keep raw value
  }
  if (/^https?:\/\//i.test(contentPath)) {
    const parsed = new URL(contentPath);
    contentPath = `${parsed.pathname}${parsed.search}`;
  }
  if (!contentPath.startsWith('/')) contentPath = `/${contentPath}`;

  // If on org domain and path is "/" or a section, prefix with /org/slug
  if (orgContext && !contentPath.startsWith('/org/')) {
    const sections = ['store', 'content', 'events', 'donate', 'photos', 'offerings', 'dons', 'programs'];
    const clean = contentPath.replace(/^\//, '');
    if (contentPath === '/' || contentPath === '') {
      contentPath = `/org/${orgContext.slug}`;
    } else if (sections.includes(clean)) {
      contentPath = `/org/${orgContext.slug}/${clean}`;
    } else if (clean.startsWith('product/') || clean.startsWith('p/')) {
      contentPath = `/org/${orgContext.slug}/${clean}`;
    }
  }

  const canonicalUrl = `${baseUrl}${contentPath}`;
  const siteName = orgContext?.name || 'Siteviral';

  // ─── Human user → 302 redirect to SPA ───
  if (!forceBot && !isBot(userAgent)) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: canonicalUrl,
        'Cache-Control': 'no-cache, no-store',
        'X-OG-Proxy-Mode': 'human-redirect',
      },
    });
  }

  // ─── Bot → serve static OG HTML (200) ───
  let meta: MetaResult | null = null;
  try {
    meta = await resolveFromPath(contentPath);
  } catch (err) {
    console.error('[og-proxy] resolveFromPath error:', err);
  }

  const title = (meta?.title || DEFAULT_TITLE).slice(0, 180);
  const description = (meta?.description || DEFAULT_DESCRIPTION).slice(0, 300);
  let image = meta?.image || DEFAULT_IMAGE;
  try { image = new URL(image).toString(); } catch { image = DEFAULT_IMAGE; }

  // Search bots (Google, Bing) should index the page; social bots should not
  const robotsTag = isSearchBot(userAgent) ? 'index, follow' : 'noindex';

  return new Response(renderOgHtml(title, description, image, canonicalUrl, siteName), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=600',
      'Vary': 'User-Agent',
      'X-Robots-Tag': robotsTag,
      'X-OG-Proxy-Mode': forceBot ? 'forced-bot' : 'bot-html',
    },
  });
});
