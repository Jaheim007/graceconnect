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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = userData.user.id;
    const { product_id } = await req.json();

    if (!product_id) {
      return new Response(JSON.stringify({ error: 'product_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Verify user can manage this product's org
    const { data: product } = await supabaseAdmin
      .from('digital_products')
      .select('id, file_url, organization_id, product_type, title')
      .eq('id', product_id)
      .single();

    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check user is org member with management rights
    const { data: member } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', product.organization_id)
      .maybeSingle();

    if (!member || !['owner', 'admin', 'editor'].includes(member.role)) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!product.file_url) {
      return new Response(JSON.stringify({ error: 'No file uploaded for this product' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve the file URL (handle private bucket signed URLs)
    let fileUrl = product.file_url;
    if (fileUrl.includes('private-products')) {
      const urlParts = fileUrl.split('/private-products/');
      const filePath = urlParts[1] || '';
      const { data: signedUrl, error: signError } = await supabaseAdmin.storage
        .from('private-products')
        .createSignedUrl(filePath, 600);
      if (signError || !signedUrl) {
        return new Response(JSON.stringify({ error: 'Failed to access file' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      fileUrl = signedUrl.signedUrl;
    }

    // Fetch the file to determine page count
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch file' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contentType = fileResponse.headers.get('content-type') || '';
    const fileBuffer = await fileResponse.arrayBuffer();
    let pageCount: number | null = null;

    // Extract page count for PDFs
    if (contentType.includes('pdf') || product.file_url.toLowerCase().includes('.pdf')) {
      try {
        // Simple PDF page count extraction by counting /Type /Page entries
        const bytes = new Uint8Array(fileBuffer);
        const text = new TextDecoder('latin1').decode(bytes);
        
        // Count /Type /Page (but not /Type /Pages) occurrences
        const pageMatches = text.match(/\/Type\s*\/Page(?!s)/g);
        if (pageMatches) {
          pageCount = pageMatches.length;
        }
        
        // Fallback: look for /Count N in the page tree
        if (!pageCount || pageCount === 0) {
          const countMatch = text.match(/\/Count\s+(\d+)/);
          if (countMatch) {
            pageCount = parseInt(countMatch[1], 10);
          }
        }
      } catch (e) {
        console.error('PDF page count extraction failed:', e);
      }
    }

    // For Office documents, try to extract page/slide count from metadata
    if (contentType.includes('presentationml') || product.file_url.toLowerCase().match(/\.pptx?$/)) {
      // PPTX files - count slides from [Content_Types].xml or slide references
      // This is approximate for edge function context
      pageCount = null; // Will be set to null, client will show "Document" without count
    }

    // Calculate preview page count (20% of total, min 1, max 5)
    let previewPageCount: number | null = null;
    if (pageCount && pageCount > 0) {
      previewPageCount = Math.max(1, Math.min(5, Math.ceil(pageCount * 0.2)));
      // If document is very small (5 pages or less), show max 1 page
      if (pageCount <= 5) {
        previewPageCount = 1;
      } else if (pageCount <= 10) {
        previewPageCount = 2;
      }
    }

    // Update the product with metadata
    const updateData: Record<string, unknown> = {};
    if (pageCount !== null) updateData.page_count = pageCount;
    if (previewPageCount !== null) updateData.preview_page_count = previewPageCount;

    if (Object.keys(updateData).length > 0) {
      await supabaseAdmin
        .from('digital_products')
        .update(updateData)
        .eq('id', product_id);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        page_count: pageCount,
        preview_page_count: previewPageCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Generate preview error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
