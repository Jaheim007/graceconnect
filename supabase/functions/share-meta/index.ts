import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

  // /product/:id
  m = path.match(/^\/product\/([^\/\?#]+)/);
  if (m) {
    const id = decodeURIComponent(m[1]);
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
        description: (data.description || `Découvrez ${data.title}`).slice(0, 300),
        image: data.cover_image_url || DEFAULT_IMAGE,
      };
    }
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
        description: (data.body || '').slice(0, 300),
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
        description: (data.description || `Soutenez ${data.title}`).slice(0, 300),
        image: data.image_url || DEFAULT_IMAGE,
      };
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

/* ─── HTML renderer ─── */

function renderMetaHtml(title: string, description: string, image: string, targetUrl: string): string {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeTarget = escapeHtml(targetUrl);

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:image" content="${safeImage}" />
    <meta property="og:url" content="${safeTarget}" />
    <meta property="og:site_name" content="Siteviral" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${safeImage}" />
    <link rel="canonical" href="${safeTarget}" />
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

  // ─── Short code resolution: ?code=xxx ───
  const codeParam = reqUrl.searchParams.get('code');
  if (codeParam) {
    const resolved = await resolveShortCode(codeParam);
    if (!resolved) {
      // Unknown code → redirect to homepage
      return new Response(renderMetaHtml(DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_IMAGE, SITE_URL), {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60' },
      });
    }

    const targetUrl = `${SITE_URL}${resolved.targetPath}`;

    // Use stored overrides OR resolve from DB
    let meta: MetaResult | null = null;
    if (resolved.meta.title || resolved.meta.description || resolved.meta.image) {
      meta = {
        title: resolved.meta.title || DEFAULT_TITLE,
        description: resolved.meta.description || DEFAULT_DESCRIPTION,
        image: resolved.meta.image || DEFAULT_IMAGE,
      };
    }
    if (!meta) {
      try { meta = await resolveFromPath(resolved.targetPath); } catch { /* fallback */ }
    }

    const title = (meta?.title || DEFAULT_TITLE).slice(0, 180);
    const description = (meta?.description || DEFAULT_DESCRIPTION).slice(0, 300);
    let image = meta?.image || DEFAULT_IMAGE;
    try { image = new URL(image).toString(); } catch { image = DEFAULT_IMAGE; }

    return new Response(renderMetaHtml(title, description, image, targetUrl), {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
    });
  }

  // ─── Legacy path-based resolution ───
  const pathParam = reqUrl.searchParams.get('path');

  let targetUrl = SITE_URL;
  if (pathParam) {
    const cleanPath = pathParam.startsWith('/') ? pathParam : `/${pathParam}`;
    targetUrl = `${SITE_URL}${cleanPath}`;
  } else {
    const targetParam = reqUrl.searchParams.get('target');
    if (targetParam) {
      try {
        const t = new URL(targetParam);
        if (isAllowedTarget(t)) targetUrl = t.toString();
      } catch { /* use default */ }
    }
  }

  let meta: MetaResult | null = null;
  if (pathParam) {
    try { meta = await resolveFromPath(pathParam); } catch { /* fallback */ }
  }

  const explicitTitle = reqUrl.searchParams.get('title');
  const explicitDesc = reqUrl.searchParams.get('description');
  const explicitImg = reqUrl.searchParams.get('image');

  const title = (explicitTitle || meta?.title || DEFAULT_TITLE).slice(0, 180);
  const description = (explicitDesc || meta?.description || DEFAULT_DESCRIPTION).slice(0, 300);

  let image = explicitImg || meta?.image || DEFAULT_IMAGE;
  try { image = new URL(image).toString(); } catch { image = DEFAULT_IMAGE; }

  return new Response(renderMetaHtml(title, description, image, targetUrl), {
    headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
});
