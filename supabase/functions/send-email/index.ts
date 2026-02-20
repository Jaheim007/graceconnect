import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type EmailTemplate = 'welcome' | 'donation_receipt' | 'purchase_confirmation' | 'kyc_approved' | 'kyc_rejected';

interface SendEmailBody {
  template: EmailTemplate;
  to: string;
  data: Record<string, string | number>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

  try {
    // Only allow internal service calls (check service role key in header or token)
    const authHeader = req.headers.get('Authorization');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body: SendEmailBody = await req.json();
    const { template, to, data } = body;

    const templates: Record<EmailTemplate, { subject: string; html: string }> = {
      welcome: {
        subject: '👋 Welcome to GraceConnect',
        html: `<div style="font-family:sans-serif;padding:32px"><h1 style="color:#c9a84c">Welcome to GraceConnect!</h1><p>Hi ${data.name || 'there'},</p><p>Your account is ready. Start exploring faith communities today.</p></div>`,
      },
      donation_receipt: {
        subject: `Donation Receipt – ${data.org_name}`,
        html: `<div style="font-family:sans-serif;padding:32px"><h1 style="color:#c9a84c">🙏 Donation Receipt</h1><p>Thank you for donating <strong>${data.amount} ${data.currency}</strong> to <strong>${data.org_name}</strong>.</p><p>Reference: <code>${data.reference}</code></p><p>Date: ${data.date}</p></div>`,
      },
      purchase_confirmation: {
        subject: `Purchase Confirmed – ${data.product_name}`,
        html: `<div style="font-family:sans-serif;padding:32px"><h1 style="color:#c9a84c">✅ Purchase Confirmed</h1><p>You purchased <strong>${data.product_name}</strong> from <strong>${data.org_name}</strong>.</p><p>Amount: ${data.amount} ${data.currency}</p><p>Reference: <code>${data.reference}</code></p>${data.access_link ? `<p><a href="${data.access_link}" style="color:#c9a84c">Access your purchase →</a></p>` : ''}</div>`,
      },
      kyc_approved: {
        subject: `KYC Approved – ${data.org_name}`,
        html: `<div style="font-family:sans-serif;padding:32px"><h1 style="color:#22c55e">✅ KYC Approved</h1><p>Congratulations! Your KYC for <strong>${data.org_name}</strong> has been approved.</p><p>You can now enable monetization features including donations and digital products.</p></div>`,
      },
      kyc_rejected: {
        subject: `KYC Update – ${data.org_name}`,
        html: `<div style="font-family:sans-serif;padding:32px"><h1 style="color:#ef4444">❌ KYC Requires Attention</h1><p>Your KYC submission for <strong>${data.org_name}</strong> was not approved.</p><p>Reason: ${data.reason || 'Please contact support.'}</p><p>You may resubmit with the correct documents.</p></div>`,
      },
    };

    const tpl = templates[template];
    if (!tpl) return new Response(JSON.stringify({ error: 'Unknown template' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'GraceConnect <noreply@graceconnect.app>',
        to: [to],
        subject: tpl.subject,
        html: tpl.html,
      }),
    });
    const result = await res.json();

    return new Response(JSON.stringify({ ok: res.ok, message_id: result.id, error: result.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('send_email error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
