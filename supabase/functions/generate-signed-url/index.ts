import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getUser();
    // Allow anonymous access (anon key) for preview mode
    const userId = claimsData?.user?.id || null;

    const { product_id, preview } = await req.json();

    if (!product_id) {
      return new Response(JSON.stringify({ error: 'product_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Get the product
    const { data: product } = await supabaseAdmin
      .from('digital_products')
      .select('file_url, title, is_free')
      .eq('id', product_id)
      .maybeSingle();

    if (!product?.file_url) {
      return new Response(
        JSON.stringify({ error: 'No file available' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If NOT preview mode, enforce purchase check
    if (!preview) {
      if (userId) {
        const { data: purchase } = await supabaseAdmin
          .from('product_purchases')
          .select('id')
          .eq('product_id', product_id)
          .eq('user_id', userId)
          .eq('status', 'completed')
          .maybeSingle();

        if (!purchase && !product.is_free) {
          return new Response(
            JSON.stringify({ error: 'Purchase required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else if (!product.is_free) {
        return new Response(
          JSON.stringify({ error: 'Purchase required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // If file is in private-products bucket, generate signed URL
    if (product.file_url.includes('private-products')) {
      const urlParts = product.file_url.split('/private-products/');
      const filePath = urlParts[1] || '';

      // Preview gets shorter expiry
      const expiry = preview ? 600 : 3600;

      const { data: signedUrl, error: signError } = await supabaseAdmin.storage
        .from('private-products')
        .createSignedUrl(filePath, expiry);

      if (signError) {
        return new Response(
          JSON.stringify({ error: 'Failed to generate download link' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ url: signedUrl.signedUrl, title: product.title }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If file is a direct URL (external or public bucket), return as-is
    return new Response(
      JSON.stringify({ url: product.file_url, title: product.title }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Signed URL error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
