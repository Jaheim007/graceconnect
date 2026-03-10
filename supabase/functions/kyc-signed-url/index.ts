import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user is superadmin
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check superadmin
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isSA } = await adminClient.rpc('is_superadmin', { _user_id: user.id });
    if (!isSA) {
      return new Response(JSON.stringify({ error: 'Superadmin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { url, org_id, document_type } = await req.json();

    if (!url || !org_id) {
      return new Response(JSON.stringify({ error: 'Missing url or org_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract storage path from URL
    // URL format: .../storage/v1/object/public/kyc-documents/path/to/file
    // or it could be a path directly
    let storagePath = url;
    const bucketPrefix = '/kyc-documents/';
    const idx = url.indexOf(bucketPrefix);
    if (idx !== -1) {
      storagePath = url.substring(idx + bucketPrefix.length);
    }

    // Generate signed URL (expires in 5 minutes)
    const { data: signedData, error: signError } = await adminClient.storage
      .from('kyc-documents')
      .createSignedUrl(storagePath, 300); // 5 minutes

    if (signError) {
      console.error('Signed URL error:', signError);
      return new Response(JSON.stringify({ error: 'Failed to generate signed URL' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log access in audit_logs
    await adminClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'kyc.document_accessed',
      resource_type: 'organization',
      resource_id: org_id,
      metadata: {
        document_type: document_type || 'unknown',
        accessed_at: new Date().toISOString(),
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return new Response(JSON.stringify({ signedUrl: signedData.signedUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('KYC signed URL error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
