import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * KYC Auto-Validate: Basic automated checks on KYC submissions.
 * - Validates file URLs using signed URLs (private bucket support)
 * - Checks file size (> 50KB)
 * - NEVER auto-rejects — flags issues and notifies superadmins
 * - Keeps submissions in "pending" status for manual review
 * - Runs on cron (every hour) or on-demand
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get pending KYC submissions that haven't been auto-validated yet
    const { data: submissions, error } = await supabase
      .from('kyc_submissions')
      .select('id, organization_id, id_document_url, selfie_url, org_document_url, kyc_level, submitted_by, organizations!left(name)')
      .eq('status', 'pending')
      .limit(50);

    if (error) throw error;
    if (!submissions || submissions.length === 0) {
      return new Response(JSON.stringify({ ok: true, checked: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let flagged = 0;
    let validated = 0;

    for (const sub of submissions) {
      const warnings: string[] = [];
      const orgName = (sub.organizations as any)?.name || 'Inconnue';

      // Check ID document using signed URLs
      if (sub.id_document_url) {
        const check = await checkFileUrl(sub.id_document_url, supabase);
        if (!check.ok) warnings.push(`Document d'identité : ${check.reason}`);
      } else if (sub.kyc_level === 1) {
        warnings.push("Document d'identité manquant");
      }

      // Check org document for level 2
      if (sub.kyc_level === 2 && sub.org_document_url) {
        const check = await checkFileUrl(sub.org_document_url, supabase);
        if (!check.ok) warnings.push(`Document d'organisation : ${check.reason}`);
      } else if (sub.kyc_level === 2 && !sub.org_document_url) {
        warnings.push("Document d'organisation manquant pour le niveau 2");
      }

      if (warnings.length > 0) {
        // DO NOT auto-reject — keep pending and notify superadmins
        flagged++;

        // Notify all superadmins about the flagged submission
        const { data: superadmins } = await supabase
          .from('user_platform_roles')
          .select('user_id')
          .eq('role', 'superadmin');

        if (superadmins && superadmins.length > 0) {
          const alerts = superadmins.map((sa: any) => ({
            user_id: sa.user_id,
            title: `⚠️ KYC à vérifier manuellement – ${orgName}`,
            body: `La soumission KYC de "${orgName}" a des avertissements : ${warnings.join(' | ')}. Vérification manuelle requise.`,
            notification_type: 'kyc_review_needed',
            action_url: '/superadmin/kyc',
          }));
          await supabase.from('user_notifications').insert(alerts);
        }

        // Send email to superadmins about the flagged KYC
        try {
          await sendKycAlertEmail(supabase, orgName, warnings);
        } catch (emailErr) {
          console.warn('Failed to send KYC alert email:', emailErr);
        }
      } else {
        validated++;
      }

      // Always notify superadmins when a new KYC submission arrives (first check)
      // This ensures they know about every submission
    }

    // Notify superadmins about the batch results
    if (submissions.length > 0) {
      const { data: superadmins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (superadmins && superadmins.length > 0 && flagged > 0) {
        const summary = superadmins.map((sa: any) => ({
          user_id: sa.user_id,
          title: `📋 Rapport KYC : ${submissions.length} soumission(s) vérifiée(s)`,
          body: `${validated} validée(s), ${flagged} avec avertissement(s). Veuillez examiner les soumissions signalées dans le tableau de bord KYC.`,
          notification_type: 'kyc_batch_report',
          action_url: '/superadmin/kyc',
        }));
        await supabase.from('user_notifications').insert(summary);
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      checked: submissions.length,
      flagged,
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
    // For Supabase storage URLs in private buckets, generate signed URL first
    let checkUrl = url;
    
    // Handle org-uploads bucket (private)
    const orgUploadsMatch = url.match(/\/org-uploads\/(.+)$/);
    if (orgUploadsMatch) {
      const { data } = await supabase.storage
        .from('org-uploads')
        .createSignedUrl(orgUploadsMatch[1], 300);
      if (data?.signedUrl) {
        checkUrl = data.signedUrl;
      } else {
        // Can't generate signed URL — don't reject, just warn
        return { ok: false, reason: 'Impossible de générer un accès temporaire au fichier. Vérification manuelle requise.' };
      }
    }

    // Handle kyc-documents bucket (private)
    const kycMatch = url.match(/\/kyc-documents\/(.+)$/);
    if (kycMatch) {
      const { data } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(kycMatch[1], 300);
      if (data?.signedUrl) {
        checkUrl = data.signedUrl;
      } else {
        return { ok: false, reason: 'Impossible de générer un accès temporaire au fichier. Vérification manuelle requise.' };
      }
    }

    const res = await fetch(checkUrl, { method: 'HEAD' });
    if (!res.ok) return { ok: false, reason: 'Fichier potentiellement inaccessible. Vérification manuelle recommandée.' };

    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength) < 50000) {
      return { ok: false, reason: 'Fichier très petit (< 50 Ko). La qualité pourrait être insuffisante.' };
    }

    const contentType = res.headers.get('content-type') || '';
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.some(t => contentType.includes(t))) {
      return { ok: false, reason: `Type de fichier inhabituel (${contentType}). Vérification manuelle recommandée.` };
    }

    return { ok: true };
  } catch {
    // Network errors should NOT cause auto-rejection
    return { ok: false, reason: 'Vérification automatique échouée. Le fichier sera vérifié manuellement.' };
  }
}

async function sendKycAlertEmail(supabase: any, orgName: string, warnings: string[]) {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Call the send-email function for superadmin alert
  const fnUrl = `${SUPABASE_URL}/functions/v1/send-email`;
  await fetch(fnUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({
      template: 'fraud_alert',
      to: '', // Will be resolved to superadmins
      data: {
        org_name: orgName,
        alert_type: 'KYC Review Needed',
        details: `Avertissements: ${warnings.join(' | ')}`,
      },
    }),
  });
}
