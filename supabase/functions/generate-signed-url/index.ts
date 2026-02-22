import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getUser();
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.user.id;
    const { product_id } = await req.json();

    if (!product_id) {
      return new Response(JSON.stringify({ error: 'product_id required' }), { status: 400, headers: corsHeaders });
    }

    // Use service role for admin queries
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Verify user has purchased this product
    const { data: purchase } = await supabaseAdmin
      .from('product_purchases')
      .select('id')
      .eq('product_id', product_id)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .maybeSingle();

    if (!purchase) {
      // Check if product is free
      const { data: product } = await supabaseAdmin
        .from('digital_products')
        .select('is_free, file_url')
        .eq('id', product_id)
        .maybeSingle();

      if (!product?.is_free) {
        return new Response(
          JSON.stringify({ error: 'Purchase required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get the product file path
    const { data: product } = await supabaseAdmin
      .from('digital_products')
      .select('file_url, title')
      .eq('id', product_id)
      .maybeSingle();

    if (!product?.file_url) {
      return new Response(
        JSON.stringify({ error: 'No file available' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If file is in private-products bucket, generate signed URL
    if (product.file_url.includes('private-products')) {
      // Extract path from full URL
      const urlParts = product.file_url.split('/private-products/');
      const filePath = urlParts[1] || '';

      const { data: signedUrl, error: signError } = await supabaseAdmin.storage
        .from('private-products')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

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
