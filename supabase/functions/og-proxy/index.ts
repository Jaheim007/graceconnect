import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * og-proxy — Universal bot-aware OG proxy for SPA social previews.
 *
 * Deployment:
 *   Point your CDN (Cloudflare Worker, Vercel Edge Middleware, etc.) to route
 *   requests from social-crawler User-Agents to:
 *     https://api.siteviral.com/functions/v1/og-proxy/<path>
 *
 *   Human users are 302-redirected to the SPA at siteviral.com/<path>.
 *   Bots receive a full OG HTML page, then are also meta-refreshed to the SPA.
 *
 * Can also be called directly:
 *     /og-proxy/org/my-church
 *     /og-proxy/campaign/abc-123
 *     /og-proxy/blog/comment-vendre-ebook-afrique
 */

const SITE_URL = 'https://siteviral.com';
const DEFAULT_TITLE = 'Siteviral — Créez votre plateforme digitale, vendez et gagnez';
const DEFAULT_DESCRIPTION =
  'Créez votre plateforme digitale, vendez vos produits numériques, collectez des dons via Mobile Money et gagnez en partageant du contenu.';
const DEFAULT_IMAGE = 'https://siteviral.com/og-image.png';

// ─── Bot detection ───

const BOT_UA_PATTERNS = [
  'facebookexternalhit',
  'facebot',
  'whatsapp',
  'twitterbot',
  'linkedinbot',
  'slackbot',
  'slack-imgproxy',
  'discordbot',
  'telegrambot',
  'googlebot',
  'bingbot',
  'yandexbot',
  'baiduspider',
  'duckduckbot',
  'applebot',
  'pinterestbot',
  'redditbot',
  'rogerbot',
  'embedly',
  'quora link preview',
  'outbrain',
  'vkshare',
  'w3c_validator',
  'ia_archiver',
  'semrushbot',
  'ahrefsbot',
  'mj12bot',
  'dotbot',
  'petalbot',
  'seznambot',
  'megaindex',
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_UA_PATTERNS.some((pattern) => ua.includes(pattern));
}

// ─── HTML helpers ───

const escapeHtml = (v: string) =>
  v
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

function renderOgHtml(title: string, description: string, image: string, canonicalUrl: string): string {
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
    <meta http-equiv="refresh" content="0;url=${url}" />
    <script>window.location.replace(${JSON.stringify(canonicalUrl)});</script>
  </head>
  <body>
    <h1>${t}</h1>
    <p>${d}</p>
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

// Blog articles meta (hardcoded since they're in client code — mirrors blogArticles.ts)
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

  // /org/:slug
  m = path.match(/^\/org\/([^\/\?#]+)/);
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
        description: (data.description || `Découvrez ${data.name} sur Siteviral`).slice(0, 300),
        image: data.banner_url || data.logo_url || DEFAULT_IMAGE,
      };
  }

  // /org/:slug/product/:id  OR  /org/:slug/p/:productSlug
  m = path.match(/^\/org\/[^\/]+\/(?:product|p)\/([^\/\?#]+)/);
  if (m) {
    const identifier = decodeURIComponent(m[1]);
    let { data } = await supabase
      .from('digital_products')
      .select('title, description, cover_image_url, organizations(name)')
      .eq('id', identifier)
      .eq('is_published', true)
      .maybeSingle();
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
        description: (data.description || `Découvrez ${data.title}`).slice(0, 300),
        image: data.cover_image_url || DEFAULT_IMAGE,
      };
    }
  }

  // /product/:id
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
        description: (data.description || `Découvrez ${data.title}`).slice(0, 300),
        image: data.cover_image_url || DEFAULT_IMAGE,
      };
    }
  }

  // /campaign/:id
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
        description: (data.description || `Soutenez ${data.title}`).slice(0, 300),
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
        description: (data.description || `Événement sur Siteviral`).slice(0, 300),
        image: data.image_url || DEFAULT_IMAGE,
      };
    }
  }

  // /blog/:slug
  m = path.match(/^\/blog\/([^\/\?#]+)/);
  if (m) {
    const slug = decodeURIComponent(m[1]);
    const blogMeta = BLOG_META[slug];
    if (blogMeta) {
      return { title: `${blogMeta.title} — Siteviral`, description: blogMeta.description, image: DEFAULT_IMAGE };
    }
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
  const userAgent = req.headers.get('user-agent') || '';

  // Extract the path after /og-proxy (or use ?path= param)
  // Edge function path: /og-proxy/org/my-slug → contentPath = /org/my-slug
  let contentPath = reqUrl.searchParams.get('path');
  if (!contentPath) {
    // Strip the function prefix from the URL path
    const fullPath = reqUrl.pathname;
    const proxyIdx = fullPath.indexOf('/og-proxy');
    if (proxyIdx !== -1) {
      contentPath = fullPath.substring(proxyIdx + '/og-proxy'.length) || '/';
    } else {
      contentPath = fullPath || '/';
    }
  }

  // Ensure leading slash
  if (!contentPath.startsWith('/')) contentPath = `/${contentPath}`;

  const canonicalUrl = `${SITE_URL}${contentPath}`;

  // ─── Human user → 302 redirect to SPA ───
  if (!isBot(userAgent)) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: canonicalUrl,
        'Cache-Control': 'no-cache, no-store',
      },
    });
  }

  // ─── Bot → serve OG HTML ───
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

  return new Response(renderOgHtml(title, description, image, canonicalUrl), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=600',
      'Vary': 'User-Agent',
      'X-Robots-Tag': 'noindex',
    },
  });
});
