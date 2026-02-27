const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_TITLE = 'Siteviral — Créez votre plateforme digitale, vendez et gagnez';
const DEFAULT_DESCRIPTION = 'Créez votre plateforme digitale, vendez vos produits numériques, collectez des dons via Mobile Money et gagnez en partageant du contenu.';
const DEFAULT_IMAGE = 'https://siteviral.com/og-image.png';
const DEFAULT_TARGET = 'https://siteviral.com';

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const isAllowedTarget = (target: URL) => {
  const host = target.hostname.toLowerCase();
  return host === 'siteviral.com' || host === 'www.siteviral.com' || host.endsWith('.lovable.app');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const reqUrl = new URL(req.url);
  const targetParam = reqUrl.searchParams.get('target') || DEFAULT_TARGET;

  let target: URL;
  try {
    target = new URL(targetParam);
  } catch {
    target = new URL(DEFAULT_TARGET);
  }

  if (!isAllowedTarget(target)) {
    target = new URL(DEFAULT_TARGET);
  }

  const title = (reqUrl.searchParams.get('title') || DEFAULT_TITLE).slice(0, 180);
  const description = (reqUrl.searchParams.get('description') || DEFAULT_DESCRIPTION).slice(0, 300);

  let image = reqUrl.searchParams.get('image') || DEFAULT_IMAGE;
  try {
    image = new URL(image).toString();
  } catch {
    image = DEFAULT_IMAGE;
  }

  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeTarget = escapeHtml(target.toString());

  const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:image" content="${safeImage}" />
    <meta property="og:url" content="${safeTarget}" />
    <meta property="og:site_name" content="Siteviral" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${safeImage}" />
    <link rel="canonical" href="${safeTarget}" />
    <meta http-equiv="refresh" content="0;url=${safeTarget}" />
    <script>window.location.replace(${JSON.stringify(target.toString())});</script>
  </head>
  <body></body>
</html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
});
