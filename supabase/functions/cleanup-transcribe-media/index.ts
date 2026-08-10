/**
 * cleanup-transcribe-media — scheduled safety net for raw transcription uploads.
 *
 * transcribe-source deletes each uploaded audio file immediately after a
 * successful transcription. This job removes anything left behind (aborted
 * uploads, failed transcriptions, network drops) under `transcribe/` in the
 * `org-uploads` bucket once it is older than the retention window (24 hours).
 *
 * Only raw media is deleted — transcripts and generated books/courses are
 * stored in the database and are never touched here.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RETENTION_HOURS = 24;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const cutoff = Date.now() - RETENTION_HOURS * 3600 * 1000;
  const removed: string[] = [];

  try {
    let offset = 0;
    for (let page = 0; page < 20; page++) {
      const { data, error } = await db.storage.from('org-uploads').list('transcribe', {
        limit: 100,
        offset,
        sortBy: { column: 'created_at', order: 'asc' },
      });
      if (error) throw error;
      if (!data?.length) break;

      const stale = data
        .filter((f) => new Date(f.created_at || f.updated_at || 0).getTime() < cutoff)
        .map((f) => `transcribe/${f.name}`);

      if (stale.length) {
        const { error: rmErr } = await db.storage.from('org-uploads').remove(stale);
        if (rmErr) console.error('[cleanup-transcribe-media] remove failed', rmErr);
        else removed.push(...stale);
      }

      if (data.length < 100) break;
      offset += 100;
    }

    console.log(`[cleanup-transcribe-media] deleted ${removed.length} file(s) older than ${RETENTION_HOURS}h`);
    return new Response(JSON.stringify({ ok: true, retention_hours: RETENTION_HOURS, deleted: removed.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[cleanup-transcribe-media] ERROR', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
