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

    const body = await req.json();
    const { action, org_id, template_id, template_data } = body;

    if (!action) return jsonError('action required (list, get, create, update, delete)', 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // --- Check superadmin ---
    const { data: isSuperadmin } = await admin.rpc('is_superadmin', { _user_id: user.id });

    switch (action) {
      // ======== LIST ========
      case 'list': {
        let query = admin.from('ai_templates').select('*').eq('is_active', true);

        if (org_id) {
          // Org templates + global templates
          query = admin.from('ai_templates')
            .select('*')
            .eq('is_active', true)
            .or(`organization_id.eq.${org_id},is_global.eq.true`);
        } else if (isSuperadmin) {
          // All templates for superadmin
          query = admin.from('ai_templates').select('*');
        } else {
          return jsonError('org_id required for non-superadmin', 400);
        }

        const { data: templates, error } = await query.order('created_at', { ascending: false });
        if (error) return jsonError('Failed to fetch templates', 500);

        return jsonOk({ templates });
      }

      // ======== GET ========
      case 'get': {
        if (!template_id) return jsonError('template_id required', 400);
        const { data: template, error } = await admin
          .from('ai_templates')
          .select('*')
          .eq('id', template_id)
          .single();

        if (error || !template) return jsonError('Template not found', 404);

        // Permission: must be superadmin or member of template org
        if (!template.is_global && template.organization_id) {
          const { data: member } = await admin
            .from('organization_members')
            .select('role')
            .eq('user_id', user.id)
            .eq('organization_id', template.organization_id)
            .maybeSingle();
          if (!member && !isSuperadmin) return jsonError('Forbidden', 403);
        }

        return jsonOk({ template });
      }

      // ======== CREATE ========
      case 'create': {
        if (!template_data) return jsonError('template_data required', 400);

        const isGlobal = template_data.is_global === true;

        // Global templates: superadmin only
        if (isGlobal && !isSuperadmin) {
          return jsonError('Only superadmin can create global templates', 403);
        }

        // Org templates: owner/admin only
        if (!isGlobal) {
          if (!org_id) return jsonError('org_id required for org templates', 400);
          const { data: member } = await admin
            .from('organization_members')
            .select('role')
            .eq('user_id', user.id)
            .eq('organization_id', org_id)
            .maybeSingle();

          if (!member || !['owner', 'admin'].includes(member.role)) {
            return jsonError('Only owner/admin can create org templates', 403);
          }
        }

        const { data: created, error } = await admin
          .from('ai_templates')
          .insert({
            organization_id: isGlobal ? null : org_id,
            name: template_data.name,
            project_type: template_data.project_type || 'ebook',
            template_type: template_data.template_type || template_data.project_type || 'ebook',
            prompt_template: template_data.prompt_template,
            prompt_system: template_data.prompt_system,
            prompt_user_pattern: template_data.prompt_user_pattern,
            default_params: template_data.default_params || {},
            policy_profile_id: template_data.policy_profile_id || null,
            is_global: isGlobal,
            is_active: true,
            created_by: user.id,
          })
          .select('id')
          .single();

        if (error) {
          console.error('Template creation error:', error);
          return jsonError('Failed to create template', 500);
        }

        return jsonOk({ ok: true, template_id: created?.id });
      }

      // ======== UPDATE ========
      case 'update': {
        if (!template_id || !template_data) return jsonError('template_id and template_data required', 400);

        // Load existing template
        const { data: existing } = await admin
          .from('ai_templates')
          .select('organization_id, is_global')
          .eq('id', template_id)
          .single();

        if (!existing) return jsonError('Template not found', 404);

        // Permission check
        if (existing.is_global && !isSuperadmin) {
          return jsonError('Only superadmin can edit global templates', 403);
        }

        if (!existing.is_global && existing.organization_id) {
          const { data: member } = await admin
            .from('organization_members')
            .select('role')
            .eq('user_id', user.id)
            .eq('organization_id', existing.organization_id)
            .maybeSingle();

          if (!member || !['owner', 'admin'].includes(member.role)) {
            return jsonError('Only owner/admin can edit org templates', 403);
          }
        }

        const updates: any = { updated_at: new Date().toISOString() };
        if (template_data.name !== undefined) updates.name = template_data.name;
        if (template_data.prompt_system !== undefined) updates.prompt_system = template_data.prompt_system;
        if (template_data.prompt_user_pattern !== undefined) updates.prompt_user_pattern = template_data.prompt_user_pattern;
        if (template_data.prompt_template !== undefined) updates.prompt_template = template_data.prompt_template;
        if (template_data.default_params !== undefined) updates.default_params = template_data.default_params;
        if (template_data.policy_profile_id !== undefined) updates.policy_profile_id = template_data.policy_profile_id;
        if (template_data.is_active !== undefined) updates.is_active = template_data.is_active;
        if (template_data.template_type !== undefined) updates.template_type = template_data.template_type;

        const { error } = await admin.from('ai_templates').update(updates).eq('id', template_id);
        if (error) return jsonError('Failed to update template', 500);

        return jsonOk({ ok: true });
      }

      // ======== DELETE ========
      case 'delete': {
        if (!template_id) return jsonError('template_id required', 400);

        const { data: existing } = await admin
          .from('ai_templates')
          .select('organization_id, is_global')
          .eq('id', template_id)
          .single();

        if (!existing) return jsonError('Template not found', 404);

        if (existing.is_global && !isSuperadmin) {
          return jsonError('Only superadmin can delete global templates', 403);
        }

        if (!existing.is_global && existing.organization_id) {
          const { data: member } = await admin
            .from('organization_members')
            .select('role')
            .eq('user_id', user.id)
            .eq('organization_id', existing.organization_id)
            .maybeSingle();

          if (!member || !['owner', 'admin'].includes(member.role)) {
            return jsonError('Forbidden', 403);
          }
        }

        // Soft delete (deactivate)
        const { error } = await admin
          .from('ai_templates')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', template_id);

        if (error) return jsonError('Failed to delete template', 500);

        return jsonOk({ ok: true, deleted: true });
      }

      default:
        return jsonError(`Unknown action: ${action}`, 400);
    }

  } catch (e) {
    console.error('ai-template-manager error:', e);
    return jsonError(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function jsonOk(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
