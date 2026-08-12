/**
 * import-content
 *
 * "Bring your own content": an external assistant (ChatGPT / Claude / Gemini)
 * sends text the creator already wrote, and SiteViral ASSEMBLES it into a book
 * or course draft. Nothing is rewritten by our AI.
 *
 * Credit policy (deliberate):
 *  - assembling costs a single small `import_assemble` fee, charged ONCE per
 *    draft (appends are free),
 *  - visuals are the only generative work and use the exact same action keys
 *    and prices as the in-app flows (`generate_cover`, `generate_illustration`,
 *    `ai_course_image`),
 *  - the response NEVER contains a credit amount. Only an insufficient-credits
 *    error mentions credits at all.
 */
import { requireAuth, corsHeaders, jsonResp, adminClient } from '../_shared/auth.ts';
import {
  consumeCreditsOrThrow,
  refundCreditsAsBonus,
  normalizeTier,
  type CreditTier,
} from '../_shared/credits.ts';
import { aiGenerateImageBase64 } from '../_shared/ai-fallback.ts';

const MIN_CHAPTER_CHARS = 400;
const MIN_LESSON_CHARS = 300;
const MAX_ITEMS_PER_CALL = 12;
const MAX_TOTAL_ITEMS = 20;
const MAX_IMAGES_PER_CALL = 6;

const INSUFFICIENT =
  'Not enough credits on your SiteViral account. Add credits at https://siteviral.com/credits, then try again.';

type Kind = 'book' | 'course';

interface IncomingItem {
  title?: string;
  content?: string;
  order?: number;
}

function plain(text: string) {
  return String(text || '').replace(/\r\n/g, '\n').trim();
}

/** Verbatim paragraph split — used to turn a lesson into text slides. */
function toSlides(content: string, lessonTitle: string) {
  const paragraphs = plain(content)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buffer = '';
  for (const p of paragraphs) {
    if ((buffer + '\n\n' + p).trim().length > 900 && buffer) {
      chunks.push(buffer.trim());
      buffer = p;
    } else {
      buffer = buffer ? `${buffer}\n\n${p}` : p;
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim());
  if (chunks.length === 0) chunks.push(plain(content));

  return chunks.map((body, i) => ({
    slide_type: 'text',
    title: chunks.length > 1 ? `${lessonTitle} (${i + 1}/${chunks.length})` : lessonTitle,
    body,
    duration_seconds: 45,
  }));
}

function bookTier(count: number): CreditTier {
  return count > 8 ? 'premium' : 'standard';
}
function courseTier(count: number): CreditTier {
  return count > 12 ? 'premium' : 'standard';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json().catch(() => ({}));
    const kind: Kind = body?.kind === 'course' ? 'course' : 'book';
    const orgId = typeof body?.org_id === 'string' ? body.org_id : '';
    const projectId = typeof body?.project_id === 'string' ? body.project_id : '';
    const items: IncomingItem[] = Array.isArray(body?.items) ? body.items : [];
    const wantCover = body?.cover === true;
    const illustrations = body?.illustrations === true;
    const declaredTotal = Number.isFinite(Number(body?.total_items))
      ? Math.min(MAX_TOTAL_ITEMS, Math.max(1, Math.round(Number(body.total_items))))
      : 0;

    if (!orgId) return jsonResp({ error: 'org_id required' }, 400);
    if (items.length === 0 && !projectId) return jsonResp({ error: 'items required' }, 400);
    if (items.length > MAX_ITEMS_PER_CALL) {
      return jsonResp(
        { error: `Send at most ${MAX_ITEMS_PER_CALL} ${kind === 'book' ? 'chapters' : 'lessons'} per call, then append the rest.` },
        400,
      );
    }

    const admin = adminClient(auth.supabaseUrl, auth.serviceKey);

    // --- Permission (owner/admin/editor) ---
    const { data: member } = await admin
      .from('organization_members')
      .select('role')
      .eq('user_id', auth.userId)
      .eq('organization_id', orgId)
      .maybeSingle();
    if (!member || !['owner', 'admin', 'editor'].includes(member.role)) {
      return jsonResp({ error: 'Forbidden' }, 403);
    }

    // --- Validate payload verbatim-ness (a summary is not an import) ---
    const minChars = kind === 'book' ? MIN_CHAPTER_CHARS : MIN_LESSON_CHARS;
    const clean = items.map((it, i) => ({
      title: plain(it.title || '').slice(0, 200) || (kind === 'book' ? `Chapitre ${i + 1}` : `Leçon ${i + 1}`),
      content: plain(it.content || ''),
      order: Number.isFinite(Number(it.order)) ? Number(it.order) : -1,
    }));
    const thin = clean.find((it) => it.content.length < minChars);
    if (thin) {
      return jsonResp(
        {
          error:
            `"${thin.title}" is too short to be imported (${thin.content.length} characters). ` +
            'Imports must carry the full text the user wrote. Send the complete text, or use the generation tool instead.',
        },
        400,
      );
    }

    // --- Resolve or create the draft project ---
    let project: any = null;
    let feeCharged = false;

    if (projectId) {
      const { data } = await admin
        .from('ai_content_projects')
        .select('*')
        .eq('id', projectId)
        .eq('organization_id', orgId)
        .maybeSingle();
      if (!data) return jsonResp({ error: 'Draft not found' }, 404);
      project = data;
    } else {
      const title = plain(body?.title || '').slice(0, 200);
      if (title.length < 2) return jsonResp({ error: 'title required' }, 400);
      const language = (typeof body?.language === 'string' ? body.language : 'fr').slice(0, 5).toLowerCase();

      // --- Dedupe: never create a second draft for the same import ---
      // An assistant that lost the ids and calls the import tool again must land
      // on the SAME draft, otherwise chapters split across two drafts.
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await admin
        .from('ai_content_projects')
        .select('*')
        .eq('organization_id', orgId)
        .eq('created_by', auth.userId)
        .eq('project_type', kind === 'book' ? 'ebook' : 'course_pack')
        .ilike('title', title)
        .gte('created_at', since)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recent && (recent.data_json as any)?.created_via === 'mcp_import') {
        project = recent;
      }
    }

    if (!project) {
      const title = plain(body?.title || '').slice(0, 200);
      const language = (typeof body?.language === 'string' ? body.language : 'fr').slice(0, 5).toLowerCase();


      // Small assembly fee — charged once per draft, idempotent on the caller key.
      try {
        await consumeCreditsOrThrow({
          admin,
          userId: auth.userId,
          actionKey: 'import_assemble',
          tier: 'standard',
          idempotencyKey: typeof body?.idempotency_key === 'string' ? body.idempotency_key : undefined,
          metadata: { source: 'mcp_import', kind },
        });
        feeCharged = true;
      } catch (e: any) {
        if (e?.status === 402) return jsonResp({ error: INSUFFICIENT }, 402);
        throw e;
      }

      const { data, error } = await admin
        .from('ai_content_projects')
        .insert({
          organization_id: orgId,
          created_by: auth.userId,
          project_type: kind === 'book' ? 'ebook' : 'course_pack',
          status: 'draft',
          title,
          description: plain(body?.description || '').slice(0, 2000) || null,
          language,
          target_audience: plain(body?.target_audience || '').slice(0, 500) || null,
          data_json: {
            topic: plain(body?.description || ''),
            style: kind === 'book' ? 'ebook' : 'course',
            imported: true,
            import_source: plain(body?.source_assistant || 'external assistant').slice(0, 60),
            created_via: 'mcp_import',
            ...(declaredTotal ? { import_expected_count: declaredTotal } : {}),
            ...(kind === 'course' ? { course: { lessons: [] } } : { chapters: [] }),
          },
          structure_json: kind === 'book' ? { step: 4, chapters: [] } : { step: 2 },
        })
        .select('*')
        .single();

      if (error || !data) {
        if (feeCharged) {
          try {
            await refundCreditsAsBonus({ admin, userId: auth.userId, amount: 1, source: 'import_assemble', expiresInDays: 30 });
          } catch (_) { /* best effort */ }
        }
        return jsonResp({ error: `Could not create the draft: ${error?.message ?? 'unknown error'}` }, 500);
      }
      project = data;
    }

    const dataJson = (project.data_json || {}) as any;
    const structJson = (project.structure_json || {}) as any;
    const expectedTotal = declaredTotal || Number(dataJson.import_expected_count) || 0;
    if (declaredTotal) dataJson.import_expected_count = declaredTotal;

    // --- Append items idempotently by order index ---
    if (kind === 'book') {
      const existing: any[] = Array.isArray(structJson.chapters) && structJson.chapters.length > 0
        ? structJson.chapters
        : Array.isArray(dataJson.chapters) ? dataJson.chapters : [];

      const merged = [...existing];
      for (const it of clean) {
        const index = it.order >= 0 ? it.order : merged.length;
        merged[index] = {
          id: `ch-${index + 1}`,
          title: it.title,
          content: it.content,
          order: index,
        };
      }
      const chapters = merged.filter(Boolean).map((c: any, i: number) => ({ ...c, id: c.id || `ch-${i + 1}`, order: i }));
      if (chapters.length > MAX_TOTAL_ITEMS) {
        return jsonResp({ error: `A book can hold at most ${MAX_TOTAL_ITEMS} chapters.` }, 400);
      }

      await admin
        .from('ai_content_projects')
        .update({
          structure_json: { ...structJson, step: 4, chapters },
          data_json: { ...dataJson, chapters },
          status: 'review',
        })
        .eq('id', project.id);

      const tier = bookTier(chapters.length);
      const visuals = await generateVisuals({
        admin, auth, orgId, project, kind, tier,
        items: chapters,
        wantCover, illustrations,
        coverActionKey: 'generate_cover',
        imageActionKey: 'generate_illustration',
      });

      return jsonResp({
        ok: true,
        kind,
        project_id: project.id,
        org_id: orgId,
        item_count: chapters.length,
        expected_item_count: expectedTotal || null,
        remaining: expectedTotal ? Math.max(0, expectedTotal - chapters.length) : null,
        complete: expectedTotal ? chapters.length >= expectedTotal : null,
        tier,
        tier_label: tier === 'premium' ? 'Premium import' : 'Standard import',
        draft_url: `https://siteviral.com/ecrire?project=${project.id}`,
        verbatim: true,
        ...visuals,
      });
    }

    // --- Course ---
    const course = (dataJson.course || {}) as any;
    const existingLessons: any[] = Array.isArray(course.lessons) ? course.lessons : [];
    const mergedLessons = [...existingLessons];
    for (const it of clean) {
      const index = it.order >= 0 ? it.order : mergedLessons.length;
      mergedLessons[index] = {
        title: it.title,
        image_url: mergedLessons[index]?.image_url || null,
        slides: toSlides(it.content, it.title),
        raw_text: it.content,
      };
    }
    const lessons = mergedLessons.filter(Boolean);
    if (lessons.length > MAX_TOTAL_ITEMS) {
      return jsonResp({ error: `A course can hold at most ${MAX_TOTAL_ITEMS} lessons.` }, 400);
    }

    await admin
      .from('ai_content_projects')
      .update({
        data_json: { ...dataJson, course: { ...course, lessons } },
        structure_json: { ...structJson, step: 2 },
        status: 'review',
      })
      .eq('id', project.id);

    const tier = courseTier(lessons.length);
    const visuals = await generateVisuals({
      admin, auth, orgId, project, kind, tier,
      items: lessons,
      wantCover, illustrations,
      coverActionKey: 'generate_cover',
      imageActionKey: 'ai_course_image',
    });

    return jsonResp({
      ok: true,
      kind,
      project_id: project.id,
      org_id: orgId,
      item_count: lessons.length,
      expected_item_count: expectedTotal || null,
      remaining: expectedTotal ? Math.max(0, expectedTotal - lessons.length) : null,
      complete: expectedTotal ? lessons.length >= expectedTotal : null,
      tier,
      tier_label: tier === 'premium' ? 'Premium import' : 'Standard import',
      draft_url: `https://siteviral.com/admin/programs/draft/${project.id}`,
      verbatim: true,
      ...visuals,
    });
  } catch (e) {
    console.error('import-content error:', e);
    const message = e instanceof Error ? e.message : 'Internal error';
    if ((e as any)?.status === 402 || /crédits insuffisants|insufficient/i.test(message)) {
      return jsonResp({ error: INSUFFICIENT }, 402);
    }
    return jsonResp({ error: message }, 500);
  }
});

/**
 * Cover + per-item illustrations. Same action keys/prices as the in-app flows.
 * Failures never break the import: the draft stays, the credits come back.
 */
async function generateVisuals(opts: {
  admin: any;
  auth: { userId: string };
  orgId: string;
  project: any;
  kind: Kind;
  tier: CreditTier;
  items: any[];
  wantCover: boolean;
  illustrations: boolean;
  coverActionKey: string;
  imageActionKey: string;
}) {
  const { admin, auth, orgId, project, kind, tier, items, wantCover, illustrations } = opts;
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  const result = { cover_generated: false, images_generated: 0, images_missing: 0, visuals_stopped_for_credits: false };
  if (!geminiKey || (!wantCover && !illustrations)) return result;

  const styleGuide =
    kind === 'book'
      ? 'Editorial book illustration, clean, professional, no text in the image.'
      : 'Modern educational illustration, clean, professional, no text in the image.';

  const upload = async (base64: string, mimeType: string, path: string) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    await admin.storage.from('org-uploads').upload(path, bytes, { contentType: mimeType, upsert: true });
    const { data } = admin.storage.from('org-uploads').getPublicUrl(path);
    return data?.publicUrl as string | undefined;
  };

  // --- Cover ---
  if (wantCover) {
    let debited = 0;
    try {
      const debit = await consumeCreditsOrThrow({
        admin, userId: auth.userId, actionKey: opts.coverActionKey, tier,
        metadata: { source: 'mcp_import', project_id: project.id },
      });
      if (!('skipped' in debit)) debited = debit.debited;

      const { base64, mimeType } = await aiGenerateImageBase64({
        geminiKey,
        prompt: `Create a striking cover image for "${project.title}". ${styleGuide}`,
        timeoutMs: 60_000,
      });
      const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
      const url = await upload(base64, mimeType, `${orgId}/${project.id}/cover-${Date.now()}.${ext}`);
      if (url) {
        const { data: fresh } = await admin.from('ai_content_projects').select('data_json').eq('id', project.id).single();
        const dj = (fresh?.data_json || {}) as any;
        await admin
          .from('ai_content_projects')
          .update({ data_json: { ...dj, cover_url: url, settings: { ...(dj.settings || {}), cover_image_url: url } } })
          .eq('id', project.id);
        result.cover_generated = true;
      }
    } catch (e: any) {
      if (e?.status === 402) {
        result.visuals_stopped_for_credits = true;
      } else if (debited > 0) {
        try { await refundCreditsAsBonus({ admin, userId: auth.userId, amount: debited, source: opts.coverActionKey, expiresInDays: 30 }); } catch (_) { /* best effort */ }
      }
    }
  }

  // --- One image per chapter / lesson ---
  if (illustrations && !result.visuals_stopped_for_credits) {
    // Only the items that still have no image, and at most MAX_IMAGES_PER_CALL
    // per invocation so the function never times out mid-way (that is what used
    // to leave a 16-chapter book with only 6 illustrations).
    const { data: current } = await admin
      .from('ai_content_projects')
      .select('data_json')
      .eq('id', project.id)
      .single();
    const currentJson = (current?.data_json || {}) as any;
    const existingBookImages = (currentJson.chapter_illustrations || {}) as Record<string, string>;

    const hasImage = (item: any, index: number) =>
      kind === 'book'
        ? !!existingBookImages[item?.id || `ch-${index + 1}`]
        : !!item?.image_url;

    const pending = items
      .map((item, index) => ({ item, index }))
      .filter(({ item, index }) => !hasImage(item, index));

    result.images_missing = Math.max(0, pending.length - MAX_IMAGES_PER_CALL);
    const batch = pending.slice(0, MAX_IMAGES_PER_CALL);

    const images: Record<number, string> = {};
    for (let b = 0; b < batch.length; b++) {
      const { item, index: i } = batch[b];
      let debited = 0;
      try {
        const debit = await consumeCreditsOrThrow({
          admin, userId: auth.userId, actionKey: opts.imageActionKey, tier,
          metadata: { source: 'mcp_import', project_id: project.id, index: i },
        });
        if (!('skipped' in debit)) debited = debit.debited;

        const snippet = String(item?.raw_text || item?.content || '').replace(/<[^>]*>/g, ' ').slice(0, 300);
        const { base64, mimeType } = await aiGenerateImageBase64({
          geminiKey,
          prompt: `Illustration for "${item?.title || `Part ${i + 1}`}". ${styleGuide} Scene: ${snippet}`,
          timeoutMs: 60_000,
        });
        const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
        const url = await upload(base64, mimeType, `${orgId}/${project.id}/images/part-${i}-${Date.now()}.${ext}`);
        if (url) {
          images[i] = url;
          result.images_generated += 1;
        }
      } catch (e: any) {
        if (e?.status === 402) {
          result.visuals_stopped_for_credits = true;
          break;
        }
        if (debited > 0) {
          try { await refundCreditsAsBonus({ admin, userId: auth.userId, amount: debited, source: opts.imageActionKey, expiresInDays: 30 }); } catch (_) { /* best effort */ }
        }
      }
      if (b < batch.length - 1) await new Promise((r) => setTimeout(r, 400));
    }

    if (Object.keys(images).length > 0) {
      const { data: fresh } = await admin
        .from('ai_content_projects')
        .select('data_json, structure_json')
        .eq('id', project.id)
        .single();
      const dj = (fresh?.data_json || {}) as any;

      if (kind === 'book') {
        const chapterIllustrations = { ...(dj.chapter_illustrations || {}) };
        (dj.chapters || []).forEach((ch: any, index: number) => {
          if (images[index]) chapterIllustrations[ch.id || `ch-${index + 1}`] = images[index];
        });
        await admin
          .from('ai_content_projects')
          .update({ data_json: { ...dj, chapter_illustrations: chapterIllustrations } })
          .eq('id', project.id);
      } else {
        const lessons = ((dj.course?.lessons || []) as any[]).map((l, index) =>
          images[index] ? { ...l, image_url: images[index] } : l,
        );
        await admin
          .from('ai_content_projects')
          .update({ data_json: { ...dj, course: { ...(dj.course || {}), lessons } } })
          .eq('id', project.id);
      }
    }
  }

  return result;
}
