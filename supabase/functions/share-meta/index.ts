import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AI_BOT_UA_PATTERNS, resolveRichPage, renderRichHtml } from './rich.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://siteviral.com';
const DEFAULT_TITLE = 'Siteviral — Créez votre plateforme digitale, vendez et gagnez';
const DEFAULT_DESCRIPTION =
  'Créez votre plateforme digitale, vendez vos produits numériques, collectez des dons via Mobile Money et gagnez en partageant du contenu.';
const DEFAULT_IMAGE = 'https://siteviral.com/og-image.png';

const escapeHtml = (v: string) =>
  v
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

/** Truncate at a word boundary so previews never cut mid-word */
function clip(text: string, max = 200): string {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const slice = t.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > max * 0.5 ? slice.slice(0, lastSpace) : slice;
  return cut.replace(/[\s,;:.!?\u2014\u2013-]+$/, '') + '\u2026';
}

/** Strip HTML tags and return clean plain text for OG descriptions */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')       // replace tags with space
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')           // collapse whitespace
    .trim();
}

// ─── Bot detection ───

const BOT_UA_PATTERNS = [
  'facebookexternalhit', 'facebot', 'whatsapp', 'twitterbot', 'linkedinbot',
  'slackbot', 'slack-imgproxy', 'discordbot', 'telegrambot', 'googlebot',
  'bingbot', 'yandexbot', 'applebot', 'pinterestbot', 'redditbot',
  'embedly', 'quora link preview', 'outbrain', 'vkshare', 'w3c_validator',
  'semrushbot', 'ahrefsbot', 'petalbot', 'seznambot',
  // AI assistants, answer engines and LLM crawlers
  ...AI_BOT_UA_PATTERNS,
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_UA_PATTERNS.some((p) => ua.includes(p));
}

/* ─── Static page meta map ─── */

const STATIC_META: Record<string, { title: string; description: string }> = {
  '/': { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  '/discover': { title: 'Explorer — Siteviral', description: 'Découvrez les meilleures plateformes, produits numériques et campagnes sur Siteviral.' },
  '/marketplace': { title: 'Marketplace — Siteviral', description: 'Parcourez les produits numériques disponibles sur Siteviral : ebooks, formations, audio, vidéo.' },
  '/features': { title: 'Fonctionnalités — Siteviral', description: 'Découvrez toutes les fonctionnalités de Siteviral : vente de produits numériques, dons Mobile Money, affiliation, analytics et plus.' },
  '/pricing': { title: 'Tarifs — Siteviral', description: 'Siteviral est gratuit. Découvrez nos commissions transparentes et notre modèle économique.' },
  '/about': { title: 'À propos — Siteviral', description: 'Apprenez-en plus sur Siteviral, notre mission et notre équipe.' },
  '/contact': { title: 'Contact — Siteviral', description: 'Contactez l\'équipe Siteviral pour toute question ou partenariat.' },
  '/faq': { title: 'FAQ — Siteviral', description: 'Questions fréquentes sur Siteviral : inscription, paiements, affiliation, produits numériques.' },
  '/blog': { title: 'Blog — Siteviral', description: 'Articles, guides et conseils pour réussir dans le digital en Afrique.' },
  '/calculateur': { title: 'Calculateur de revenus — Siteviral', description: 'Simulez vos revenus potentiels avec Siteviral : ventes, dons, affiliation.' },
  '/comparer': { title: 'Comparer les plateformes — Siteviral', description: 'Comparez Siteviral aux autres plateformes : Gumroad, Patreon, Ko-fi et plus.' },
  '/temoignages': { title: 'Témoignages — Siteviral', description: 'Découvrez les témoignages de créateurs et organisations qui utilisent Siteviral.' },
};

/* ─── Supabase client helper ─── */

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

/* ─── Short code resolution ─── */

interface ShortLinkRow {
  target_path: string;
  title: string | null;
  description: string | null;
  image: string | null;
}

async function resolveShortCode(code: string): Promise<{ targetPath: string; meta: ShortLinkRow } | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('short_links')
    .select('target_path, title, description, image')
    .eq('id', code)
    .maybeSingle();

  if (error || !data) return null;

  // Increment clicks (fire-and-forget)
  supabase.rpc('increment_short_link_clicks', { _code: code }).then(() => {}, () => {});

  return { targetPath: data.target_path, meta: data };
}

/* ─── DB resolution for dynamic content ─── */

interface MetaResult {
  title: string;
  description: string;
  image: string;
}

async function resolveFromPath(path: string): Promise<MetaResult | null> {
  const supabase = getSupabase();
  let m: RegExpMatchArray | null;

  // /org/:slug/product/:id  OR  /org/:slug/p/:productSlug  (MUST be before /org/:slug)
  m = path.match(/^\/org\/[^\/]+\/(?:product|p)\/([^\/\?#]+)/);
  if (m) {
    const identifier = decodeURIComponent(m[1]);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    let data: any = null;
    if (isUuid) {
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
        description: clip(stripHtml(data.description || `Découvrez ${data.title}`), 200),
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
        description: clip(stripHtml(data.description || `Découvrez ${data.name} sur Siteviral`), 200),
        image: data.banner_url || data.logo_url || DEFAULT_IMAGE,
      };
  }

  // /product/:id
  m = path.match(/^\/product\/([^\/\?#]+)/);
  if (m) {
    const id = decodeURIComponent(m[1]);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      const { data } = await supabase
        .from('digital_products')
        .select('title, description, cover_image_url, organizations(name)')
        .eq('id', id)
        .eq('is_published', true)
        .maybeSingle();
      if (data) {
        const orgName = (data as any).organizations?.name || 'Siteviral';
        return {
          title: `${data.title} — ${orgName}`,
          description: clip(stripHtml(data.description || `Découvrez ${data.title}`), 200),
          image: data.cover_image_url || DEFAULT_IMAGE,
        };
      }
    }
  }

  // /campagne/:id  or  /campaign/:id
  m = path.match(/^\/campaign(?:e)?\/([^\/\?#]+)/);
  if (m) {
    const { data } = await supabase
      .from('donation_campaigns')
      .select('title, description, image_url, organizations(name)')
      .eq('id', decodeURIComponent(m[1]))
      .eq('is_published', true)
      .maybeSingle();
    if (data) {
      const orgName = (data as any).organizations?.name || 'Siteviral';
      return {
        title: `${data.title} — ${orgName}`,
        description: clip(stripHtml(data.description || `Soutenez ${data.title}`), 200),
        image: data.image_url || DEFAULT_IMAGE,
      };
    }
  }

  // /event/:id
  m = path.match(/^\/event\/([^\/\?#]+)/);
  if (m) {
    const { data } = await supabase
      .from('events')
      .select('title, description, image_url, organizations(name)')
      .eq('id', decodeURIComponent(m[1]))
      .eq('is_published', true)
      .maybeSingle();
    if (data) {
      const orgName = (data as any).organizations?.name || 'Siteviral';
      return {
        title: `${data.title} — ${orgName}`,
        description: clip(stripHtml(data.description || `Événement sur Siteviral`), 200),
        image: data.image_url || DEFAULT_IMAGE,
      };
    }
  }

  // /annonce/:id
  m = path.match(/^\/annonce\/([^\/\?#]+)/);
  if (m) {
    const { data } = await supabase
      .from('announcements')
      .select('title, body, image_url, organizations(name)')
      .eq('id', decodeURIComponent(m[1]))
      .eq('is_published', true)
      .maybeSingle();
    if (data) {
      const orgName = (data as any).organizations?.name || 'Siteviral';
      return {
        title: `${data.title} — ${orgName}`,
        description: clip(stripHtml(data.body || ''), 200),
        image: data.image_url || DEFAULT_IMAGE,
      };
    }
  }

  // /offering/:id
  m = path.match(/^\/offering\/([^\/\?#]+)/);
  if (m) {
    const { data } = await supabase
      .from('offerings')
      .select('title, description, image_url, organizations(name)')
      .eq('id', decodeURIComponent(m[1]))
      .eq('is_active', true)
      .maybeSingle();
    if (data) {
      const orgName = (data as any).organizations?.name || 'Siteviral';
      return {
        title: `${data.title} — ${orgName}`,
        description: clip(stripHtml(data.description || `Soutenez ${data.title}`), 200),
        image: data.image_url || DEFAULT_IMAGE,
      };
    }
  }

  // /blog/:slug
  m = path.match(/^\/blog\/([^\/\?#]+)/);
  if (m) {
    const slug = decodeURIComponent(m[1]);
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
    const blogMeta = BLOG_META[slug];
    if (blogMeta) {
      return { title: `${blogMeta.title} — Siteviral`, description: blogMeta.description, image: DEFAULT_IMAGE };
    }
  }

  // Static pages
  const cleanPath = path.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
  const staticMeta = STATIC_META[cleanPath];
  if (staticMeta) {
    return { ...staticMeta, image: DEFAULT_IMAGE };
  }

  return null;
}

/* ─── Allowed target validation ─── */

const isAllowedTarget = (target: URL) => {
  const host = target.hostname.toLowerCase();
  return host === 'siteviral.com' || host === 'www.siteviral.com' || host.endsWith('.lovable.app');
};

/* ─── HTML renderers ─── */

/** Static OG HTML for bots — NO redirects */
function renderBotHtml(title: string, description: string, image: string, canonicalUrl: string): string {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const img = escapeHtml(image);
  const url = escapeHtml(canonicalUrl);

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
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${url}" />
    <meta property="og:site_name" content="Siteviral" />
    <meta property="og:locale" content="fr_FR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@siteviral" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${img}" />
    <link rel="canonical" href="${url}" />
  </head>
  <body>
    <h1>${t}</h1>
    <p>${d}</p>
  </body>
</html>`;
}

/** Human redirect HTML — meta refresh + JS for instant redirect */
function renderHumanHtml(title: string, description: string, image: string, targetUrl: string): string {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const img = escapeHtml(image);
  const safeTarget = escapeHtml(targetUrl);

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>${t}</title>
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:url" content="${safeTarget}" />
    <meta http-equiv="refresh" content="0;url=${safeTarget}" />
    <script>window.location.replace(${JSON.stringify(targetUrl)});</script>
  </head>
  <body></body>
</html>`;
}

/* ─── Main handler ─── */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const reqUrl = new URL(req.url);
  const userAgent = req.headers.get('user-agent') || '';
  const botRequest = isBot(userAgent);

  // ─── Resolve target URL + meta ───

  let targetUrl = SITE_URL;
  let meta: MetaResult | null = null;
  // Public path we are describing — used to render full crawlable HTML for bots
  let resolvedPath: string | null =
    reqUrl.searchParams.get('path') ||
    req.headers.get('x-original-path') ||
    req.headers.get('x-forwarded-path') ||
    null;

  const codeParam = reqUrl.searchParams.get('code');
  const pathParam = reqUrl.searchParams.get('path');

  if (codeParam) {
    const resolved = await resolveShortCode(codeParam);
    if (resolved) {
      targetUrl = `${SITE_URL}${resolved.targetPath}`;
      resolvedPath = resolved.targetPath;

      // Always try DB resolution first for complete metadata
      let dbMeta: MetaResult | null = null;
      try { dbMeta = await resolveFromPath(resolved.targetPath); } catch { /* fallback */ }

      // Merge: short_link overrides take priority, DB fills gaps, defaults as last resort
      meta = {
        title: resolved.meta.title || dbMeta?.title || DEFAULT_TITLE,
        description: resolved.meta.description || dbMeta?.description || DEFAULT_DESCRIPTION,
        image: resolved.meta.image || dbMeta?.image || DEFAULT_IMAGE,
      };
    }
  } else if (pathParam) {
    const cleanPath = pathParam.startsWith('/') ? pathParam : `/${pathParam}`;
    targetUrl = `${SITE_URL}${cleanPath}`;
    resolvedPath = cleanPath;
    try { meta = await resolveFromPath(cleanPath); } catch { /* fallback */ }
  } else {
    const targetParam = reqUrl.searchParams.get('target');
    if (targetParam) {
      try {
        const t = new URL(targetParam);
        if (isAllowedTarget(t)) targetUrl = t.toString();
      } catch { /* use default */ }
    }
  }

  // Apply explicit overrides from query params
  const explicitTitle = reqUrl.searchParams.get('title');
  const explicitDesc = reqUrl.searchParams.get('description');
  const explicitImg = reqUrl.searchParams.get('image');

  const title = (explicitTitle || meta?.title || DEFAULT_TITLE).slice(0, 180);
  const description = clip(explicitDesc || meta?.description || DEFAULT_DESCRIPTION, 200);
  let image = explicitImg || meta?.image || DEFAULT_IMAGE;
  try { image = new URL(image).toString(); } catch { image = DEFAULT_IMAGE; }

  // ─── Bot → crawlable HTML (200, no redirect) ───
  if (botRequest) {
    // Direct endpoint hits (api.siteviral.com/functions/v1/share-meta?...) must never
    // be indexed as pages of their own — only the canonical siteviral.com URL should be.
    // Requests proxied by the Worker arrive on the public host and stay indexable.
    const isDirectEndpoint = reqUrl.hostname !== 'siteviral.com'
      && !reqUrl.hostname.endsWith('.siteviral.com')
      || reqUrl.pathname.includes('/share-meta');
    const htmlHeaders = {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=1800',
      'Vary': 'User-Agent',
      'X-Robots-Tag': isDirectEndpoint
        ? 'noindex, follow, max-image-preview:large'
        : 'index, follow, max-image-preview:large, max-snippet:-1',
    };

    // Full content rendering: real heading, prose, key facts, FAQ, links, JSON-LD
    if (resolvedPath && !explicitTitle) {
      try {
        const rich = await resolveRichPage(resolvedPath);
        if (rich) {
          return new Response(renderRichHtml(rich, targetUrl), { headers: htmlHeaders });
        }
      } catch (e) {
        console.error('rich render failed', resolvedPath, e);
      }
    }

    // Fallback: metadata-only document
    return new Response(renderBotHtml(title, description, image, targetUrl), { headers: htmlHeaders });
  }

  // ─── Human → 302 redirect ───
  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      'Location': targetUrl,
      'Cache-Control': 'no-cache, no-store',
    },
  });
});
