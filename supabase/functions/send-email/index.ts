import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type EmailTemplate =
  | 'welcome'
  | 'donation_receipt' | 'new_donation_received'
  | 'purchase_confirmation' | 'new_purchase_received' | 'download_ready'
  | 'program_enrolled' | 'program_completed'
  | 'kyc_submitted' | 'kyc_approved' | 'kyc_rejected'
  | 'org_created' | 'org_deleted' | 'org_suspended' | 'org_unsuspended'
  | 'new_member_joined' | 'member_left' | 'invite_to_org' | 'role_changed'
  | 'payout_requested' | 'payout_approved' | 'payout_rejected' | 'payouts_frozen'
  | 'affiliate_sale' | 'affiliate_payout_requested' | 'affiliate_payout_completed'
  | 'directory_approved' | 'directory_rejected'
  | 'ticket_created' | 'ticket_replied' | 'ticket_resolved'
  | 'refund_initiated' | 'refund_completed'
  | 'content_report_resolved';

interface SendEmailBody {
  template: EmailTemplate;
  to: string;
  data: Record<string, string | number>;
  organization_id?: string;
}

const FOOTER = `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #333;font-size:11px;color:#777">
  <p>Siteviral — Operated by Hacktualiz Inc.</p>
  <p>131 Continental Dr, Suite 305, Newark, DE 19713, United States</p>
  <p><a href="https://siteviral.com/terms" style="color:#1a66e6">Terms</a> · <a href="https://siteviral.com/privacy" style="color:#1a66e6">Privacy</a> · <a href="https://siteviral.com/refund-policy" style="color:#1a66e6">Refund Policy</a></p>
</div>`;

const wrap = (content: string) => `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0f0f0f;color:#eee;padding:32px">
<div style="max-width:520px;margin:0 auto;background:#1a1a1a;border-radius:16px;padding:32px;border:1px solid #333">
${content}${FOOTER}
</div></body></html>`;

const blue = '#1a66e6';
const green = '#22c55e';
const red = '#ef4444';
const info = '#3b82f6';

function buildTemplate(template: EmailTemplate, d: Record<string, string | number>): { subject: string; html: string } {
  switch (template) {
    case 'welcome':
      return { subject: '👋 Welcome to Siteviral', html: wrap(`<h1 style="color:${blue}">Welcome to Siteviral!</h1><p>Hi ${d.name || 'there'},</p><p>Your account is ready. Start building and growing your community today.</p>`) };
    case 'donation_receipt':
      return { subject: `Donation Receipt – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🙏 Donation Receipt</h1><p>Thank you for donating <strong>${d.amount} ${d.currency}</strong> to <strong>${d.org_name}</strong>.</p><p>Reference: <code>${d.reference}</code></p><p>Date: ${d.date}</p>`) };
    case 'new_donation_received':
      return { subject: `💰 New Donation – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">💰 New Donation Received</h1><p><strong>${d.donor_name || 'Anonymous'}</strong> donated <strong>${d.amount} ${d.currency}</strong> to <strong>${d.org_name}</strong>.</p><p>Campaign: ${d.campaign_name || 'General'}</p><p>Reference: <code>${d.reference}</code></p>`) };
    case 'purchase_confirmation':
      return { subject: `Purchase Confirmed – ${d.product_name}`, html: wrap(`<h1 style="color:${blue}">✅ Purchase Confirmed</h1><p>You purchased <strong>${d.product_name}</strong> from <strong>${d.org_name}</strong>.</p><p>Amount: ${d.amount} ${d.currency}</p><p>Reference: <code>${d.reference}</code></p>${d.access_link ? `<p><a href="${d.access_link}" style="color:${blue}">Access your purchase →</a></p>` : ''}`) };
    case 'new_purchase_received':
      return { subject: `🛒 New Sale – ${d.product_name}`, html: wrap(`<h1 style="color:${green}">🛒 New Sale</h1><p><strong>${d.buyer_name || 'A customer'}</strong> purchased <strong>${d.product_name}</strong> for <strong>${d.amount} ${d.currency}</strong>.</p><p>Reference: <code>${d.reference}</code></p>`) };
    case 'download_ready':
      return { subject: `📥 Your download is ready – ${d.product_name}`, html: wrap(`<h1 style="color:${blue}">📥 Download Ready</h1><p>Your purchase of <strong>${d.product_name}</strong> is ready for download.</p><p><a href="${d.download_link}" style="color:${blue};font-weight:bold">Download Now →</a></p><p style="font-size:12px;color:#999">This link expires in 24 hours.</p>`) };
    case 'program_enrolled':
      return { subject: `🎓 Enrolled – ${d.program_name}`, html: wrap(`<h1 style="color:${blue}">🎓 Enrollment Confirmed</h1><p>You are now enrolled in <strong>${d.program_name}</strong> by <strong>${d.org_name}</strong>.</p><p><a href="${d.program_link || '#'}" style="color:${blue}">Start Learning →</a></p>`) };
    case 'program_completed':
      return { subject: `🏆 Congratulations! – ${d.program_name}`, html: wrap(`<h1 style="color:${green}">🏆 Program Completed</h1><p>Congratulations! You have completed <strong>${d.program_name}</strong>.</p><p>Keep up the great work!</p>`) };
    case 'kyc_submitted':
      return { subject: `KYC Submitted – ${d.org_name}`, html: wrap(`<h1 style="color:${info}">📄 KYC Submitted</h1><p>Your KYC documents for <strong>${d.org_name}</strong> have been submitted successfully.</p><p>We'll review them within 2–3 business days.</p>`) };
    case 'kyc_approved':
      return { subject: `KYC Approved – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">✅ KYC Approved</h1><p>Congratulations! Your KYC for <strong>${d.org_name}</strong> has been approved.</p><p>You can now enable monetization features.</p>`) };
    case 'kyc_rejected':
      return { subject: `KYC Update – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">❌ KYC Requires Attention</h1><p>Your KYC submission for <strong>${d.org_name}</strong> was not approved.</p><p>Reason: ${d.reason || 'Please contact support.'}</p><p>You may resubmit with the correct documents.</p>`) };
    case 'org_created':
      return { subject: `🏢 Organization Created – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🏢 Organization Created</h1><p>Your organization <strong>${d.org_name}</strong> has been created successfully.</p><p>Next steps: complete your profile, invite members, and start publishing content.</p>`) };
    case 'org_deleted':
      return { subject: `Organization Deleted – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">🗑 Organization Deleted</h1><p>The organization <strong>${d.org_name}</strong> has been permanently deleted.</p>${d.reason ? `<p>Reason: ${d.reason}</p>` : ''}`) };
    case 'org_suspended':
      return { subject: `⚠️ Organization Suspended – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">⚠️ Organization Suspended</h1><p>Your organization <strong>${d.org_name}</strong> has been suspended.</p><p>Reason: ${d.reason || 'Policy violation.'}</p>${d.until ? `<p>Suspended until: ${d.until}</p>` : ''}<p>Contact <a href="mailto:support@siteviral.com" style="color:${blue}">support@siteviral.com</a>.</p>`) };
    case 'org_unsuspended':
      return { subject: `✅ Suspension Lifted – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">✅ Suspension Lifted</h1><p>Your organization <strong>${d.org_name}</strong> is now active again.</p>`) };
    case 'new_member_joined':
      return { subject: `👤 New Member – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">👤 New Member</h1><p><strong>${d.member_name || 'Someone'}</strong> just joined <strong>${d.org_name}</strong>.</p><p>Total members: ${d.total_members || 'N/A'}</p>`) };
    case 'member_left':
      return { subject: `Member Left – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">👋 Member Left</h1><p><strong>${d.member_name || 'A member'}</strong> has left <strong>${d.org_name}</strong>.</p>`) };
    case 'invite_to_org':
      return { subject: `You're invited to join ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📩 You're Invited</h1><p><strong>${d.inviter_name || 'Someone'}</strong> invited you to join <strong>${d.org_name}</strong> on Siteviral.</p><p><a href="${d.invite_link || 'https://siteviral.com'}" style="display:inline-block;background:${blue};color:#fff;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">Accept Invitation →</a></p>`) };
    case 'role_changed':
      return { subject: `Role Updated – ${d.org_name}`, html: wrap(`<h1 style="color:${info}">🔄 Role Updated</h1><p>Your role in <strong>${d.org_name}</strong> has been changed to <strong>${d.new_role}</strong>.</p>${d.old_role ? `<p>Previous role: ${d.old_role}</p>` : ''}`) };
    case 'payout_requested':
      return { subject: `💸 Payout Requested – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${blue}">💸 Payout Requested</h1><p>A payout of <strong>${d.amount} ${d.currency}</strong> has been requested for <strong>${d.org_name}</strong>.</p><p>Processing time: 3–5 business days.</p>`) };
    case 'payout_approved':
      return { subject: `✅ Payout Approved – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">✅ Payout Approved</h1><p>Your payout of <strong>${d.amount} ${d.currency}</strong> for <strong>${d.org_name}</strong> has been approved and is being processed.</p>`) };
    case 'payout_rejected':
      return { subject: `Payout Rejected – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">❌ Payout Rejected</h1><p>Your payout request for <strong>${d.org_name}</strong> was rejected.</p><p>Reason: ${d.reason || 'Please contact support.'}</p>`) };
    case 'payouts_frozen':
      return { subject: `⚠️ Payouts Frozen – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">🧊 Payouts Frozen</h1><p>Payouts for <strong>${d.org_name}</strong> have been temporarily frozen.</p><p>Reason: ${d.reason || 'Under review.'}</p>${d.until ? `<p>Frozen until: ${d.until}</p>` : ''}<p>Contact <a href="mailto:support@siteviral.com" style="color:${blue}">support@siteviral.com</a>.</p>`) };
    case 'affiliate_sale':
      return { subject: `🎉 Commission Earned – ${d.commission} ${d.currency}`, html: wrap(`<h1 style="color:${green}">🎉 Commission Earned</h1><p>You earned <strong>${d.commission} ${d.currency}</strong> from a ${d.transaction_type || 'sale'} on <strong>${d.org_name}</strong>.</p><p>Gross: ${d.gross_amount} ${d.currency} · Rate: ${d.commission_percent}%</p><p>Payable after 72h hold.</p>`) };
    case 'affiliate_payout_requested':
      return { subject: `💸 Affiliate Payout Requested`, html: wrap(`<h1 style="color:${blue}">💸 Affiliate Payout Requested</h1><p>Your affiliate payout of <strong>${d.amount} ${d.currency}</strong> from <strong>${d.org_name}</strong> has been submitted.</p><p>Processing time: 3–5 business days.</p>`) };
    case 'affiliate_payout_completed':
      return { subject: `✅ Affiliate Payout Sent – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">✅ Payout Sent</h1><p>Your affiliate payout of <strong>${d.amount} ${d.currency}</strong> from <strong>${d.org_name}</strong> has been sent to your bank account.</p>`) };
    case 'directory_approved':
      return { subject: `🌟 Directory Approved – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🌟 Directory Listing Approved</h1><p>Your organization <strong>${d.org_name}</strong> has been approved for the Siteviral directory.</p>`) };
    case 'directory_rejected':
      return { subject: `Directory Application Update – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">❌ Directory Application Declined</h1><p>Your directory application for <strong>${d.org_name}</strong> was not approved.</p><p>Reason: ${d.reason || 'Does not meet listing criteria.'}</p>`) };
    case 'ticket_created':
      return { subject: `🎫 Support Ticket #${d.ticket_id || ''} Created`, html: wrap(`<h1 style="color:${blue}">🎫 Ticket Created</h1><p>Your support ticket has been created.</p><p><strong>Subject:</strong> ${d.subject}</p><p><strong>Category:</strong> ${d.category}</p><p>Our team will respond within 24–48 hours.</p>`) };
    case 'ticket_replied':
      return { subject: `💬 Reply to Ticket #${d.ticket_id || ''}`, html: wrap(`<h1 style="color:${info}">💬 New Reply</h1><p>A support agent has replied to your ticket:</p><div style="background:#222;border-radius:8px;padding:16px;margin:12px 0;border-left:3px solid ${blue}">${d.reply_preview || 'View the full reply in your Support Center.'}</div><p><a href="https://siteviral.com/support" style="color:${blue}">View Ticket →</a></p>`) };
    case 'ticket_resolved':
      return { subject: `✅ Ticket Resolved #${d.ticket_id || ''}`, html: wrap(`<h1 style="color:${green}">✅ Ticket Resolved</h1><p>Your support ticket <strong>${d.subject}</strong> has been marked as resolved.</p><p><a href="https://siteviral.com/support" style="color:${blue}">Support Center</a></p>`) };
    case 'refund_initiated':
      return { subject: `🔄 Refund Request Received – ${d.reference || ''}`, html: wrap(`<h1 style="color:${info}">🔄 Refund Request Received</h1><p>We received your refund request for <strong>${d.amount} ${d.currency}</strong>.</p><p>Product/Donation: ${d.item_name || 'N/A'}</p><p>Reference: <code>${d.reference}</code></p><p>Review within 3–5 business days.</p>`) };
    case 'refund_completed':
      return { subject: `✅ Refund Processed – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">✅ Refund Processed</h1><p>Your refund of <strong>${d.amount} ${d.currency}</strong> has been processed.</p><p>Reference: <code>${d.reference}</code></p><p>Funds should appear within 5–10 business days.</p>`) };
    case 'content_report_resolved':
      return { subject: `Content Report Update`, html: wrap(`<h1 style="color:${info}">📋 Report Update</h1><p>Your content report has been reviewed and resolved.</p><p>Content type: ${d.content_type}</p><p>Action taken: ${d.action_taken || 'Reviewed and addressed.'}</p>`) };
    default:
      throw new Error(`Unknown template: ${template}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body: SendEmailBody = await req.json();
    const { template, to, data, organization_id } = body;

    if (!template) {
      return new Response(JSON.stringify({ error: 'Missing template' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let tpl: { subject: string; html: string };
    try {
      tpl = buildTemplate(template, data);
    } catch {
      return new Response(JSON.stringify({ error: 'Unknown template' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // If `to` is empty but org_id provided, send to all org admins/owners
    let recipients: string[] = [];
    if (to) {
      recipients = [to];
    } else if (organization_id) {
      const { data: admins } = await supabaseAdmin.from('organization_members')
        .select('user_id')
        .eq('organization_id', organization_id)
        .in('role', ['owner', 'admin']);
      if (admins?.length) {
        for (const admin of admins) {
          const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(admin.user_id);
          if (user?.email) recipients.push(user.email);
        }
      }
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: 'No recipients' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let lastResult: any = {};
    let allOk = true;
    for (const recipient of recipients) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Siteviral <noreply@siteviral.com>',
          to: [recipient],
          subject: tpl.subject,
          html: tpl.html,
        }),
      });
      const result = await res.json();
      lastResult = result;
      if (!res.ok) allOk = false;

      // Log each email
      await supabaseAdmin.from('email_logs').insert({
        template,
        recipient,
        subject: tpl.subject,
        status: res.ok ? 'sent' : 'failed',
        resend_message_id: result.id || null,
        error_message: res.ok ? null : (result.message || 'Unknown error'),
        organization_id: organization_id || null,
        metadata: data || {},
      });
    }

    return new Response(JSON.stringify({ ok: allOk, message_id: lastResult.id, recipients: recipients.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('send_email error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
