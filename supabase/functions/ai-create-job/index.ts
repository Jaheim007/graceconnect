import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // --- Auth ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonError('Unauthorized', 401);
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return jsonError('Unauthorized', 401);

    // --- Input ---
    const body = await req.json();
    let { org_id, project_id, template_id, job_type, input_params } = body;
    if (!job_type) return jsonError('job_type required', 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // Resolve org_id from project_id if not provided
    if (!org_id && project_id) {
      const { data: proj } = await admin
        .from('ai_content_projects')
        .select('organization_id')
        .eq('id', project_id)
        .single();
      if (!proj) return jsonError('Project not found', 404);
      org_id = proj.organization_id;
    }
    if (!org_id) return jsonError('org_id or project_id required', 400);


    // --- Permission ---
    const { data: canUse } = await admin.rpc('can_use_studio', { _org_id: org_id });
    // Fallback: check manually if RPC doesn't work with service key context
    const { data: member } = await admin
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', org_id)
      .maybeSingle();

    if (!member || !['owner', 'admin', 'editor'].includes(member.role)) {
      return jsonError('Forbidden: not a studio member', 403);
    }

    // --- Resolve template ---
    let templateData = null;
    if (template_id) {
      const { data: t } = await admin
        .from('ai_templates')
        .select('*')
        .eq('id', template_id)
        .single();
      if (t) templateData = t;
    }

    // --- Determine provider ---
    const provider = input_params?.provider || templateData?.default_params?.provider || 'gemini';

    // --- Create job ---
    const { data: job, error: jobErr } = await admin
      .from('ai_generation_jobs')
      .insert({
        organization_id: org_id,
        created_by: user.id,
        project_id: project_id || null,
        template_id: template_id || null,
        job_type,
        input_params: input_params || {},
        status: 'queued',
        provider,
        progress: 0,
        estimated_cost_units: estimateCost(job_type, input_params),
        result_summary: {},
      })
      .select('id')
      .single();

    if (jobErr) {
      console.error('Job creation error:', jobErr);
      return jsonError('Failed to create job', 500);
    }

    // --- Update project status if linked ---
    if (project_id) {
      await admin
        .from('ai_content_projects')
        .update({ status: 'generating', updated_at: new Date().toISOString() })
        .eq('id', project_id)
        .eq('organization_id', org_id);
    }

    // --- Audit ---
    await admin.from('audit_logs').insert({
      user_id: user.id,
      action: 'studio.job_created',
      resource_type: 'ai_generation_job',
      resource_id: job.id,
      organization_id: org_id,
      metadata: { job_type, project_id, template_id },
    });

    // --- Trigger ai-run-job (fire-and-forget) ---
    const runUrl = `${supabaseUrl}/functions/v1/ai-run-job`;
    fetch(runUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'apikey': anonKey,
      },
      body: JSON.stringify({ job_id: job.id }),
    }).catch(err => console.error('Failed to trigger ai-run-job:', err));

    return new Response(JSON.stringify({ ok: true, job_id: job.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('ai-create-job error:', e);
    return jsonError(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function estimateCost(jobType: string, params: any): number {
  switch (jobType) {
    case 'text':
    case 'generate_outline':
    case 'generate_chapter':
    case 'generate_description':
      return 1;
    case 'image':
      return params?.count ? params.count * 2 : 2;
    case 'audio':
      return 3;
    case 'pdf':
      return 2;
    case 'quality_check':
      return 1;
    case 'multi':
      return 5;
    default:
      return 1;
  }
}
