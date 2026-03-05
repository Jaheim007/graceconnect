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
    if (!authHeader?.startsWith('Bearer ')) return jsonError('Unauthorized', 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return jsonError('Unauthorized', 401);

    const { org_id, project_id, publish_now } = await req.json();
    if (!org_id || !project_id) return jsonError('org_id and project_id required', 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // --- Permission (owner/admin/editor) ---
    const { data: member } = await admin
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', org_id)
      .maybeSingle();

    if (!member || !['owner', 'admin', 'editor'].includes(member.role)) {
      return jsonError('Forbidden', 403);
    }

    // --- Load project ---
    const { data: project, error: projErr } = await admin
      .from('ai_content_projects')
      .select('*')
      .eq('id', project_id)
      .eq('organization_id', org_id)
      .single();

    if (projErr || !project) return jsonError('Project not found', 404);

    // --- Quality gate ---
    const { data: qualityScores } = await admin
      .from('ai_quality_scores')
      .select('review_required, review_status')
      .eq('project_id', project_id)
      .eq('org_id', org_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (qualityScores && qualityScores.length > 0) {
      const latest = qualityScores[0];
      if (latest.review_required && latest.review_status !== 'approved') {
        return jsonError('Quality gate: review must be approved', 422);
      }
    }

    // --- Parse chapters ---
    const dataJson = (project.data_json || project.structure_json || {}) as any;
    const chapters = dataJson.chapters || [];

    if (chapters.length === 0) {
      return jsonError('No chapters found in project', 400);
    }

    // --- Get cover ---
    const { data: coverAsset } = await admin
      .from('ai_project_assets')
      .select('file_url')
      .eq('project_id', project_id)
      .eq('is_cover', true)
      .maybeSingle();

    // --- Create Program ---
    const { data: program, error: progErr } = await admin
      .from('programs')
      .insert({
        organization_id: org_id,
        created_by: user.id,
        title: project.title,
        description: project.objective || project.description || '',
        cover_image_url: coverAsset?.file_url || null,
        is_published: publish_now ?? false,
        publication_status: publish_now ? 'published' : 'draft',
        is_free: true,
      })
      .select('id')
      .single();

    if (progErr || !program) {
      console.error('Program creation error:', progErr);
      return jsonError('Failed to create program', 500);
    }

    // --- Create single Module ---
    const { data: mod, error: modErr } = await admin
      .from('program_modules')
      .insert({
        program_id: program.id,
        title: project.title,
        display_order: 0,
      })
      .select('id')
      .single();

    if (modErr || !mod) {
      console.error('Module creation error:', modErr);
      return jsonError('Failed to create module', 500);
    }

    // --- Create Lessons from chapters ---
    const lessons = chapters.map((ch: any, i: number) => ({
      module_id: mod.id,
      title: ch.title || `Leçon ${i + 1}`,
      content: ch.content || '',
      display_order: i,
      is_published: publish_now ?? false,
      publication_status: publish_now ? 'published' : 'draft',
    }));

    const { error: lessonsErr } = await admin
      .from('program_lessons')
      .insert(lessons);

    if (lessonsErr) {
      console.error('Lessons creation error:', lessonsErr);
      return jsonError('Failed to create lessons', 500);
    }

    // --- Link project ---
    await admin.from('ai_content_projects').update({
      linked_program_id: program.id,
      status: publish_now ? 'published' : project.status,
      published_at: publish_now ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', project_id);

    // --- Audit ---
    await admin.from('audit_logs').insert({
      user_id: user.id,
      action: 'studio.project_published_as_program',
      resource_type: 'ai_content_project',
      resource_id: project_id,
      organization_id: org_id,
      metadata: {
        program_id: program.id,
        lessons_count: lessons.length,
        publish_now,
      },
    });

    return new Response(JSON.stringify({
      ok: true,
      program_id: program.id,
      lessons_count: lessons.length,
      published: publish_now ?? false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('ai-project-to-program error:', e);
    return jsonError(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
