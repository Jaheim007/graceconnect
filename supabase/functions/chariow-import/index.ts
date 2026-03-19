const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CHARIOW_BASE = 'https://api.chariow.com/v1';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, cursor, per_page, product_id, api_key } = await req.json();

    // API key is now provided by the user, not stored server-side
    if (!api_key) {
      return new Response(
        JSON.stringify({ error: 'API key is required. Please provide your Chariow API key.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let url: string;
    if (action === 'list') {
      const params = new URLSearchParams({ per_page: String(per_page || 50) });
      if (cursor) params.set('cursor', cursor);
      url = `${CHARIOW_BASE}/products?${params}`;
    } else if (action === 'detail' && product_id) {
      url = `${CHARIOW_BASE}/products/${product_id}`;
    } else if (action === 'store') {
      url = `${CHARIOW_BASE}/store`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${api_key}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data.message || `Chariow API error (${res.status})` }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('chariow-import error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
