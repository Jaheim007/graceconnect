import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Shared email helper for edge functions.
 * Sends via Resend and logs to email_logs table.
 */

interface SendEmailOptions {
  template: string;
  to: string;
  data: Record<string, string | number>;
  organization_id?: string;
}

export async function sendEmail(
  options: SendEmailOptions,
  deps?: { resendApiKey?: string; supabaseUrl?: string; supabaseServiceKey?: string }
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  try {
    const RESEND_API_KEY = deps?.resendApiKey || Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = deps?.supabaseUrl || Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = deps?.supabaseServiceKey || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || '';

    if (!RESEND_API_KEY) {
      console.warn('sendEmail: RESEND_API_KEY not set, skipping');
      return { ok: false, error: 'RESEND_API_KEY not configured' };
    }

    // Delegate to send-email edge function for template rendering
    const fnUrl = `${SUPABASE_URL}/functions/v1/send-email`;
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify(options),
    });

    const result = await res.json();
    return { ok: result.ok || res.ok, messageId: result.message_id, error: result.error };
  } catch (err) {
    console.error('sendEmail helper error:', err);
    return { ok: false, error: String(err) };
  }
}

/**
 * Send email to all admins/owners of an org
 */
export async function sendEmailToOrgAdmins(
  template: string,
  organizationId: string,
  data: Record<string, string | number>,
): Promise<void> {
  try {
    // Use the send-email function with empty `to` and org_id — it resolves admins automatically
    await sendEmail({ template, to: '', data, organization_id: organizationId });
  } catch (err) {
    console.error('sendEmailToOrgAdmins error:', err);
  }
}

/**
 * Get email for a user ID
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: { user } } = await db.auth.admin.getUserById(userId);
    return user?.email || null;
  } catch {
    return null;
  }
}
