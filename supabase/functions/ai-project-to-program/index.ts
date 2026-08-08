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

    const { org_id, project_id, publish_now, settings, price, currency } = await req.json();
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

    // --- Parse draft ---
    // Two shapes are supported:
    //  - `course.lessons[].slides[]`  → new slide-native pipeline (course-from-document)
    //  - `chapters[]`                 → legacy chapter/HTML projects
    const dataJson = (project.data_json || project.structure_json || {}) as any;
    // Course rules chosen on the review screen (passing score, retries, …).
    const rules = { ...(dataJson?.settings || {}), ...(settings || {}) } as any;
    const clampInt = (v: any, min: number, max: number, dflt: number) => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : dflt;
    };
    const passingScore = clampInt(rules.passing_score, 0, 100, 70);
    const maxQuizAttempts = clampInt(rules.max_quiz_attempts, 1, 10, 3);
    const courseLessons: any[] = Array.isArray(dataJson?.course?.lessons) ? dataJson.course.lessons : [];
    const chapters = courseLessons.length === 0 ? (dataJson.chapters || []) : [];

    if (courseLessons.length === 0 && chapters.length === 0) {
      return jsonError('No lessons or chapters found in project', 400);
    }

    // AI-generated courses are always paid. Enforce this on the server so a
    // client interruption can never leave a published, zero-price course.
    const courseCurrency = typeof currency === 'string' && currency.trim() ? currency.trim().toUpperCase() : 'XOF';
    const minimums: Record<string, number> = {
      XOF: 1000, XAF: 1000, NGN: 1500, GHS: 20, KES: 200, ZAR: 40,
      MAD: 20, TND: 5, USD: 2, EUR: 2, GBP: 2,
    };
    const minimumPrice = minimums[courseCurrency] ?? minimums.USD;
    const coursePrice = Number(price);
    if (!Number.isFinite(coursePrice) || coursePrice < minimumPrice) {
      return jsonError(`AI course price must be at least ${minimumPrice} ${courseCurrency}`, 400);
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
        description: rules.description || project.objective || project.description || '',
        cover_image_url: rules.cover_image_url || coverAsset?.file_url || courseLessons.find((l: any) => l?.image_url)?.image_url || null,
        passing_score: passingScore,
        max_quiz_attempts: maxQuizAttempts,
        require_sequential_lessons: rules.require_sequential_lessons !== false,
        gamification_enabled: rules.gamification_enabled !== false,
        certificate_enabled: rules.certificate_enabled !== false,
        // Materialise privately first. It is made visible only after every
        // module, lesson, slide and checkout product has been created.
        is_published: false,
        publication_status: 'draft',
        is_free: false,
        price: coursePrice,
        currency: courseCurrency,
        ai_generated: true,
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
        order_index: 0,
      })
      .select('id')
      .single();

    if (modErr || !mod) {
      console.error('Module creation error:', modErr);
      await cleanupProgram(admin, program.id);
      return jsonError('Failed to create module', 500);
    }

    // --- Create Lessons (+ real slides for the slide-native pipeline) ---
    let lessonsCount = 0;
    let slidesCount = 0;

    if (courseLessons.length > 0) {
      const lessonRows = courseLessons.map((l: any, i: number) => ({
        module_id: mod.id,
        title: l.title || `Leçon ${i + 1}`,
        // legacy HTML fallback so older players keep working.
        // The lesson illustration is emitted as a `lesson-hero-image` block:
        // the player lifts it out and uses it as the slide backdrop.
        content: [
          l.image_url
            ? `<div class="lesson-hero-image"><img src="${escapeAttr(l.image_url)}" alt="${escapeAttr(l.title || '')}" /></div>`
            : '',
          ...(Array.isArray(l.slides) ? l.slides : [])
            .filter((s: any) => s.slide_type !== 'quiz' && s.slide_type !== 'flashcard')
            .map((s: any) => `${s.title ? `<h2>${escapeHtml(s.title)}</h2>` : ''}<p>${escapeHtml(s.body || '')}</p>`),
        ].filter(Boolean).join('\n'),
        display_order: i,
        publication_status: publish_now ? 'published' : 'draft',
      }));


      const { data: insertedLessons, error: lessonsErr } = await admin
        .from('program_lessons')
        .insert(lessonRows)
        .select('id, display_order');

      if (lessonsErr || !insertedLessons) {
        console.error('Lessons creation error:', lessonsErr);
        await cleanupProgram(admin, program.id);
        return jsonError('Failed to create lessons', 500);
      }
      lessonsCount = insertedLessons.length;

      const byOrder = new Map<number, string>();
      insertedLessons.forEach((l: any) => byOrder.set(l.display_order, l.id));

      const slideRows: any[] = [];
      courseLessons.forEach((l: any, i: number) => {
        const lessonId = byOrder.get(i);
        if (!lessonId) return;
        (Array.isArray(l.slides) ? l.slides : []).forEach((s: any, j: number) => {
          slideRows.push({
            lesson_id: lessonId,
            display_order: j,
            slide_type: ['quiz', 'flashcard', 'image', 'video'].includes(s.slide_type) ? s.slide_type : 'text',
            title: s.title || null,
            body: s.slide_type === 'quiz'
              ? null
              : s.slide_type === 'flashcard'
                ? (s.body || null)
                : `<p>${escapeHtml(s.body || '')}</p>`,
            media_url: s.media_url || null,
            caption: s.caption || null,
            data: s.data || {},
            duration_seconds: s.duration_seconds ?? 30,
          });
        });
      });

      if (slideRows.length > 0) {
        const { error: slidesErr } = await admin.from('program_slides').insert(slideRows);
        if (slidesErr) {
          console.error('Slides creation error:', slidesErr);
          await cleanupProgram(admin, program.id);
          return jsonError('Failed to create slides', 500);
        }
        slidesCount = slideRows.length;
      }
    } else {
      const lessons = chapters.map((ch: any, i: number) => ({
        module_id: mod.id,
        title: ch.title || `Leçon ${i + 1}`,
        content: ch.content || '',
        display_order: i,
        publication_status: publish_now ? 'published' : 'draft',
      }));

      const { error: lessonsErr } = await admin
        .from('program_lessons')
        .insert(lessons);

      if (lessonsErr) {
        console.error('Lessons creation error:', lessonsErr);
        await cleanupProgram(admin, program.id);
        return jsonError('Failed to create lessons', 500);
      }
      lessonsCount = lessons.length;
    }


    // --- Create the mirrored checkout product before making the course live ---
    const { data: product, error: productErr } = await admin
      .from('digital_products')
      .insert({
        organization_id: org_id,
        created_by: user.id,
        title: project.title,
        description: rules.description || project.objective || project.description || '',
        cover_image_url: rules.cover_image_url || coverAsset?.file_url || courseLessons.find((l: any) => l?.image_url)?.image_url || null,
        product_type: 'course',
        price: coursePrice,
        currency: courseCurrency,
        is_free: false,
        ai_generated: true,
        ai_project_id: project_id,
        is_published: publish_now ?? false,
        publication_status: publish_now ? 'published' : 'draft',
        external_link: `/program/${program.id}`,
      })
      .select('id')
      .single();

    if (productErr || !product) {
      console.error('Course product creation error:', productErr);
      await cleanupProgram(admin, program.id);
      return jsonError('Failed to create paid course checkout', 500);
    }

    const { error: finalizeErr } = await admin.from('programs').update({
      linked_product_id: product.id,
      is_published: publish_now ?? false,
      publication_status: publish_now ? 'published' : 'draft',
    }).eq('id', program.id);
    if (finalizeErr) {
      console.error('Program finalization error:', finalizeErr);
      await admin.from('digital_products').delete().eq('id', product.id);
      await cleanupProgram(admin, program.id);
      return jsonError('Failed to finalize course', 500);
    }

    // --- Link project ---
    const { error: linkErr } = await admin.from('ai_content_projects').update({
      linked_program_id: program.id,
      status: publish_now ? 'published' : project.status,
      published_at: publish_now ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', project_id);
    if (linkErr) {
      console.error('Project link error:', linkErr);
      return jsonError('Course created but project link failed', 500);
    }

    // --- Audit ---
    await admin.from('audit_logs').insert({
      user_id: user.id,
      action: 'studio.project_published_as_program',
      resource_type: 'ai_content_project',
      resource_id: project_id,
      organization_id: org_id,
      metadata: {
        program_id: program.id,
        lessons_count: lessonsCount,
        slides_count: slidesCount,
        publish_now,
      },
    });

    return new Response(JSON.stringify({
      ok: true,
      program_id: program.id,
      lessons_count: lessonsCount,
      slides_count: slidesCount,
      published: publish_now ?? false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('ai-project-to-program error:', e);
    return jsonError(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, '&quot;');
}

async function cleanupProgram(admin: ReturnType<typeof createClient>, programId: string) {
  const { data: modules } = await admin.from('program_modules').select('id').eq('program_id', programId);
  const moduleIds = (modules || []).map((module: any) => module.id);
  if (moduleIds.length > 0) {
    const { data: lessons } = await admin.from('program_lessons').select('id').in('module_id', moduleIds);
    const lessonIds = (lessons || []).map((lesson: any) => lesson.id);
    if (lessonIds.length > 0) await admin.from('program_slides').delete().in('lesson_id', lessonIds);
    await admin.from('program_lessons').delete().in('module_id', moduleIds);
    await admin.from('program_modules').delete().eq('program_id', programId);
  }
  await admin.from('programs').delete().eq('id', programId);
}


function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

