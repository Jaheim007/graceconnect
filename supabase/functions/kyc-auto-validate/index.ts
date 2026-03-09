import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * KYC Auto-Validate: Basic automated checks on KYC submissions.
 * - Validates file URLs are accessible
 * - Checks file size (> 50KB)
 * - Auto-rejects clearly invalid submissions with clear messages
 * - Runs on cron (every hour) or on-demand
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get pending KYC submissions
    const { data: submissions, error } = await supabase
      .from('kyc_submissions')
      .select('id, organization_id, id_document_url, selfie_url, org_document_url, kyc_level, submitted_by')
      .eq('status', 'pending')
      .limit(50);

    if (error) throw error;
    if (!submissions || submissions.length === 0) {
      return new Response(JSON.stringify({ ok: true, checked: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let autoRejected = 0;
    let validated = 0;

    for (const sub of submissions) {
      const issues: string[] = [];

      // Check ID document
      if (sub.id_document_url) {
        const check = await checkFileUrl(sub.id_document_url, supabase);
        if (!check.ok) issues.push(`Document d'identité : ${check.reason}`);
      } else if (sub.kyc_level === 1) {
        issues.push("Document d'identité manquant");
      }

      // Check org document for level 2
      if (sub.kyc_level === 2 && sub.org_document_url) {
        const check = await checkFileUrl(sub.org_document_url, supabase);
        if (!check.ok) issues.push(`Document d'organisation : ${check.reason}`);
      } else if (sub.kyc_level === 2 && !sub.org_document_url) {
        issues.push("Document d'organisation manquant pour le niveau 2");
      }

      if (issues.length > 0) {
        // Auto-reject with clear reason
        const reason = issues.join(' | ');
        await supabase
          .from('kyc_submissions')
          .update({
            status: 'rejected',
            rejection_reason: `[Auto] ${reason}. Veuillez soumettre à nouveau avec des documents valides.`,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', sub.id);

        // Update org status
        await supabase
          .from('organizations')
          .update({ kyc_status: 'rejected' })
          .eq('id', sub.organization_id);

        // Notify user
        if (sub.submitted_by) {
          await supabase.from('user_notifications').insert({
            user_id: sub.submitted_by,
            organization_id: sub.organization_id,
            title: '⚠️ Vérification KYC rejetée automatiquement',
            body: `Votre soumission KYC a été rejetée : ${reason}. Veuillez soumettre à nouveau des documents clairs et lisibles.`,
            notification_type: 'kyc_rejected',
            action_url: '/admin/kyc',
          });
        }

        autoRejected++;
      } else {
        validated++;
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      checked: submissions.length,
      auto_rejected: autoRejected,
      passed_validation: validated,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error('kyc-auto-validate error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function checkFileUrl(url: string, supabase: any): Promise<{ ok: boolean; reason?: string }> {
  try {
    // For Supabase storage URLs, check via HEAD request
    const res = await fetch(url, { method: 'HEAD' });
    if (!res.ok) return { ok: false, reason: 'Fichier inaccessible ou supprimé' };

    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength) < 50000) {
      return { ok: false, reason: 'Fichier trop petit (< 50 Ko). Veuillez prendre une photo plus nette.' };
    }

    const contentType = res.headers.get('content-type') || '';
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.some(t => contentType.includes(t))) {
      return { ok: false, reason: `Type de fichier non accepté (${contentType}). Formats acceptés : JPEG, PNG, PDF.` };
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: 'Impossible de vérifier le fichier. URL invalide.' };
  }
}
