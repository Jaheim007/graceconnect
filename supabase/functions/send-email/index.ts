import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type EmailTemplate =
  // Auth & onboarding
  | 'welcome'
  // Donations (buyer + admin)
  | 'donation_receipt'
  | 'new_donation_received'
  // Purchases (buyer + admin)
  | 'purchase_confirmation'
  | 'new_purchase_received'
  | 'download_ready'
  // Programs
  | 'program_enrolled'
  | 'program_completed'
  // KYC
  | 'kyc_submitted'
  | 'kyc_approved'
  | 'kyc_rejected'
  // Org lifecycle
  | 'org_created'
  | 'org_deleted'
  | 'org_suspended'
  | 'org_unsuspended'
  // Members
  | 'new_member_joined'
  | 'member_left'
  | 'invite_to_org'
  | 'role_changed'
  // Payouts (org)
  | 'payout_requested'
  | 'payout_approved'
  | 'payout_rejected'
  | 'payouts_frozen'
  // Affiliate
  | 'affiliate_sale'
  | 'affiliate_payout_requested'
  | 'affiliate_payout_completed'
  // Directory
  | 'directory_approved'
  | 'directory_rejected'
  // Support
  | 'ticket_created'
  | 'ticket_replied'
  | 'ticket_resolved'
  // Refunds
  | 'refund_initiated'
  | 'refund_completed'
  // Content moderation
  | 'content_report_resolved';

interface SendEmailBody {
  template: EmailTemplate;
  to: string;
  data: Record<string, string | number>;
}

const FOOTER = `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #333;font-size:11px;color:#777">
  <p>Siteviral — Operated by Hacktualiz Inc.</p>
  <p>131 Continental Dr, Suite 305, Newark, DE 19713, United States</p>
  <p><a href="https://siteviral.com/terms" style="color:#c9a84c">Terms</a> · <a href="https://siteviral.com/privacy" style="color:#c9a84c">Privacy</a> · <a href="https://siteviral.com/refund-policy" style="color:#c9a84c">Refund Policy</a></p>
</div>`;

const wrap = (content: string) => `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0f0f0f;color:#eee;padding:32px">
<div style="max-width:520px;margin:0 auto;background:#1a1a1a;border-radius:16px;padding:32px;border:1px solid #333">
${content}${FOOTER}
</div></body></html>`;

const gold = '#c9a84c';
const green = '#22c55e';
const red = '#ef4444';
const blue = '#3b82f6';

function buildTemplate(template: EmailTemplate, d: Record<string, string | number>): { subject: string; html: string } {
  switch (template) {
    // ─── AUTH & ONBOARDING ───
    case 'welcome':
      return {
        subject: '👋 Welcome to Siteviral',
        html: wrap(`<h1 style="color:${gold}">Welcome to Siteviral!</h1><p>Hi ${d.name || 'there'},</p><p>Your account is ready. Start building and growing your community today.</p>`),
      };

    // ─── DONATIONS ───
    case 'donation_receipt':
      return {
        subject: `Donation Receipt – ${d.org_name}`,
        html: wrap(`<h1 style="color:${gold}">🙏 Donation Receipt</h1><p>Thank you for donating <strong>${d.amount} ${d.currency}</strong> to <strong>${d.org_name}</strong>.</p><p>Reference: <code>${d.reference}</code></p><p>Date: ${d.date}</p>`),
      };
    case 'new_donation_received':
      return {
        subject: `💰 New Donation – ${d.amount} ${d.currency}`,
        html: wrap(`<h1 style="color:${green}">💰 New Donation Received</h1><p><strong>${d.donor_name || 'Anonymous'}</strong> donated <strong>${d.amount} ${d.currency}</strong> to <strong>${d.org_name}</strong>.</p><p>Campaign: ${d.campaign_name || 'General'}</p><p>Reference: <code>${d.reference}</code></p>`),
      };

    // ─── PURCHASES ───
    case 'purchase_confirmation':
      return {
        subject: `Purchase Confirmed – ${d.product_name}`,
        html: wrap(`<h1 style="color:${gold}">✅ Purchase Confirmed</h1><p>You purchased <strong>${d.product_name}</strong> from <strong>${d.org_name}</strong>.</p><p>Amount: ${d.amount} ${d.currency}</p><p>Reference: <code>${d.reference}</code></p>${d.access_link ? `<p><a href="${d.access_link}" style="color:${gold}">Access your purchase →</a></p>` : ''}`),
      };
    case 'new_purchase_received':
      return {
        subject: `🛒 New Sale – ${d.product_name}`,
        html: wrap(`<h1 style="color:${green}">🛒 New Sale</h1><p><strong>${d.buyer_name || 'A customer'}</strong> purchased <strong>${d.product_name}</strong> for <strong>${d.amount} ${d.currency}</strong>.</p><p>Reference: <code>${d.reference}</code></p>`),
      };
    case 'download_ready':
      return {
        subject: `📥 Your download is ready – ${d.product_name}`,
        html: wrap(`<h1 style="color:${gold}">📥 Download Ready</h1><p>Your purchase of <strong>${d.product_name}</strong> is ready for download.</p><p><a href="${d.download_link}" style="color:${gold};font-weight:bold">Download Now →</a></p><p style="font-size:12px;color:#999">This link expires in 24 hours.</p>`),
      };

    // ─── PROGRAMS ───
    case 'program_enrolled':
      return {
        subject: `🎓 Enrolled – ${d.program_name}`,
        html: wrap(`<h1 style="color:${gold}">🎓 Enrollment Confirmed</h1><p>You are now enrolled in <strong>${d.program_name}</strong> by <strong>${d.org_name}</strong>.</p><p><a href="${d.program_link || '#'}" style="color:${gold}">Start Learning →</a></p>`),
      };
    case 'program_completed':
      return {
        subject: `🏆 Congratulations! – ${d.program_name}`,
        html: wrap(`<h1 style="color:${green}">🏆 Program Completed</h1><p>Congratulations! You have completed <strong>${d.program_name}</strong>.</p><p>Keep up the great work!</p>`),
      };

    // ─── KYC ───
    case 'kyc_submitted':
      return {
        subject: `KYC Submitted – ${d.org_name}`,
        html: wrap(`<h1 style="color:${blue}">📄 KYC Submitted</h1><p>Your KYC documents for <strong>${d.org_name}</strong> have been submitted successfully.</p><p>We'll review them within 2–3 business days and notify you of the result.</p>`),
      };
    case 'kyc_approved':
      return {
        subject: `KYC Approved – ${d.org_name}`,
        html: wrap(`<h1 style="color:${green}">✅ KYC Approved</h1><p>Congratulations! Your KYC for <strong>${d.org_name}</strong> has been approved.</p><p>You can now enable monetization features including donations and digital products.</p>`),
      };
    case 'kyc_rejected':
      return {
        subject: `KYC Update – ${d.org_name}`,
        html: wrap(`<h1 style="color:${red}">❌ KYC Requires Attention</h1><p>Your KYC submission for <strong>${d.org_name}</strong> was not approved.</p><p>Reason: ${d.reason || 'Please contact support.'}</p><p>You may resubmit with the correct documents.</p>`),
      };

    // ─── ORG LIFECYCLE ───
    case 'org_created':
      return {
        subject: `🏢 Organization Created – ${d.org_name}`,
        html: wrap(`<h1 style="color:${gold}">🏢 Organization Created</h1><p>Your organization <strong>${d.org_name}</strong> has been created successfully.</p><p>Next steps: complete your profile, invite members, and start publishing content.</p>`),
      };
    case 'org_deleted':
      return {
        subject: `Organization Deleted – ${d.org_name}`,
        html: wrap(`<h1 style="color:${red}">🗑 Organization Deleted</h1><p>The organization <strong>${d.org_name}</strong> has been permanently deleted.</p><p>All associated data (members, content, transactions) has been removed.</p>${d.reason ? `<p>Reason: ${d.reason}</p>` : ''}`),
      };
    case 'org_suspended':
      return {
        subject: `⚠️ Organization Suspended – ${d.org_name}`,
        html: wrap(`<h1 style="color:${red}">⚠️ Organization Suspended</h1><p>Your organization <strong>${d.org_name}</strong> has been suspended.</p><p>Reason: ${d.reason || 'Policy violation.'}</p>${d.until ? `<p>Suspended until: ${d.until}</p>` : ''}<p>Please contact <a href="mailto:support@siteviral.com" style="color:${gold}">support@siteviral.com</a> for more information.</p>`),
      };
    case 'org_unsuspended':
      return {
        subject: `✅ Suspension Lifted – ${d.org_name}`,
        html: wrap(`<h1 style="color:${green}">✅ Suspension Lifted</h1><p>Your organization <strong>${d.org_name}</strong> is now active again.</p><p>All features have been restored. Please ensure compliance with our terms of service.</p>`),
      };

    // ─── MEMBERS ───
    case 'new_member_joined':
      return {
        subject: `👤 New Member – ${d.org_name}`,
        html: wrap(`<h1 style="color:${gold}">👤 New Member</h1><p><strong>${d.member_name || 'Someone'}</strong> just joined <strong>${d.org_name}</strong>.</p><p>Total members: ${d.total_members || 'N/A'}</p>`),
      };
    case 'member_left':
      return {
        subject: `Member Left – ${d.org_name}`,
        html: wrap(`<h1 style="color:${red}">👋 Member Left</h1><p><strong>${d.member_name || 'A member'}</strong> has left <strong>${d.org_name}</strong>.</p>`),
      };
    case 'invite_to_org':
      return {
        subject: `You're invited to join ${d.org_name}`,
        html: wrap(`<h1 style="color:${gold}">📩 You're Invited</h1><p><strong>${d.inviter_name || 'Someone'}</strong> invited you to join <strong>${d.org_name}</strong> on Siteviral.</p><p><a href="${d.invite_link || 'https://siteviral.com'}" style="display:inline-block;background:${gold};color:#000;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">Accept Invitation →</a></p>`),
      };
    case 'role_changed':
      return {
        subject: `Role Updated – ${d.org_name}`,
        html: wrap(`<h1 style="color:${blue}">🔄 Role Updated</h1><p>Your role in <strong>${d.org_name}</strong> has been changed to <strong>${d.new_role}</strong>.</p>${d.old_role ? `<p>Previous role: ${d.old_role}</p>` : ''}`),
      };

    // ─── PAYOUTS ───
    case 'payout_requested':
      return {
        subject: `💸 Payout Requested – ${d.amount} ${d.currency}`,
        html: wrap(`<h1 style="color:${gold}">💸 Payout Requested</h1><p>A payout of <strong>${d.amount} ${d.currency}</strong> has been requested for <strong>${d.org_name}</strong>.</p><p>Processing time: 3–5 business days.</p>`),
      };
    case 'payout_approved':
      return {
        subject: `✅ Payout Approved – ${d.amount} ${d.currency}`,
        html: wrap(`<h1 style="color:${green}">✅ Payout Approved</h1><p>Your payout of <strong>${d.amount} ${d.currency}</strong> for <strong>${d.org_name}</strong> has been approved and is being processed.</p>`),
      };
    case 'payout_rejected':
      return {
        subject: `Payout Rejected – ${d.org_name}`,
        html: wrap(`<h1 style="color:${red}">❌ Payout Rejected</h1><p>Your payout request for <strong>${d.org_name}</strong> was rejected.</p><p>Reason: ${d.reason || 'Please contact support.'}</p>`),
      };
    case 'payouts_frozen':
      return {
        subject: `⚠️ Payouts Frozen – ${d.org_name}`,
        html: wrap(`<h1 style="color:${red}">🧊 Payouts Frozen</h1><p>Payouts for <strong>${d.org_name}</strong> have been temporarily frozen.</p><p>Reason: ${d.reason || 'Under review.'}</p>${d.until ? `<p>Frozen until: ${d.until}</p>` : ''}<p>Contact <a href="mailto:support@siteviral.com" style="color:${gold}">support@siteviral.com</a> for details.</p>`),
      };

    // ─── AFFILIATE ───
    case 'affiliate_sale':
      return {
        subject: `🎉 Commission Earned – ${d.commission} ${d.currency}`,
        html: wrap(`<h1 style="color:${green}">🎉 Commission Earned</h1><p>You earned a commission of <strong>${d.commission} ${d.currency}</strong> from a ${d.transaction_type || 'sale'} on <strong>${d.org_name}</strong>.</p><p>Gross amount: ${d.gross_amount} ${d.currency}</p><p>Commission rate: ${d.commission_percent}%</p><p>Payable after the 72h hold period.</p>`),
      };
    case 'affiliate_payout_requested':
      return {
        subject: `💸 Affiliate Payout Requested`,
        html: wrap(`<h1 style="color:${gold}">💸 Affiliate Payout Requested</h1><p>Your affiliate payout of <strong>${d.amount} ${d.currency}</strong> from <strong>${d.org_name}</strong> has been submitted.</p><p>Processing time: 3–5 business days.</p>`),
      };
    case 'affiliate_payout_completed':
      return {
        subject: `✅ Affiliate Payout Sent – ${d.amount} ${d.currency}`,
        html: wrap(`<h1 style="color:${green}">✅ Payout Sent</h1><p>Your affiliate payout of <strong>${d.amount} ${d.currency}</strong> from <strong>${d.org_name}</strong> has been sent to your bank account.</p>`),
      };

    // ─── DIRECTORY ───
    case 'directory_approved':
      return {
        subject: `🌟 Directory Approved – ${d.org_name}`,
        html: wrap(`<h1 style="color:${green}">🌟 Directory Listing Approved</h1><p>Your organization <strong>${d.org_name}</strong> has been approved for the Siteviral directory.</p><p>You're now visible to a wider audience.</p>`),
      };
    case 'directory_rejected':
      return {
        subject: `Directory Application Update – ${d.org_name}`,
        html: wrap(`<h1 style="color:${red}">❌ Directory Application Declined</h1><p>Your directory application for <strong>${d.org_name}</strong> was not approved at this time.</p><p>Reason: ${d.reason || 'Does not meet current listing criteria.'}</p><p>You may reapply after addressing the feedback.</p>`),
      };

    // ─── SUPPORT ───
    case 'ticket_created':
      return {
        subject: `🎫 Support Ticket #${d.ticket_id || ''} Created`,
        html: wrap(`<h1 style="color:${gold}">🎫 Ticket Created</h1><p>Your support ticket has been created.</p><p><strong>Subject:</strong> ${d.subject}</p><p><strong>Category:</strong> ${d.category}</p><p>Our team will respond within 24–48 hours. You can track your ticket in the <a href="https://siteviral.com/support" style="color:${gold}">Support Center</a>.</p>`),
      };
    case 'ticket_replied':
      return {
        subject: `💬 Reply to Ticket #${d.ticket_id || ''} – ${d.subject || ''}`,
        html: wrap(`<h1 style="color:${blue}">💬 New Reply</h1><p>A support agent has replied to your ticket:</p><p><strong>${d.subject}</strong></p><div style="background:#222;border-radius:8px;padding:16px;margin:12px 0;border-left:3px solid ${gold}">${d.reply_preview || 'View the full reply in your Support Center.'}</div><p><a href="https://siteviral.com/support" style="color:${gold}">View Ticket →</a></p>`),
      };
    case 'ticket_resolved':
      return {
        subject: `✅ Ticket Resolved #${d.ticket_id || ''} – ${d.subject || ''}`,
        html: wrap(`<h1 style="color:${green}">✅ Ticket Resolved</h1><p>Your support ticket <strong>${d.subject}</strong> has been marked as resolved.</p><p>If you still need help, you can reopen it from the <a href="https://siteviral.com/support" style="color:${gold}">Support Center</a>.</p>`),
      };

    // ─── REFUNDS ───
    case 'refund_initiated':
      return {
        subject: `🔄 Refund Request Received – ${d.reference || ''}`,
        html: wrap(`<h1 style="color:${blue}">🔄 Refund Request Received</h1><p>We received your refund request for <strong>${d.amount} ${d.currency}</strong>.</p><p>Product/Donation: ${d.item_name || 'N/A'}</p><p>Reference: <code>${d.reference}</code></p><p>We'll review it within 3–5 business days.</p>`),
      };
    case 'refund_completed':
      return {
        subject: `✅ Refund Processed – ${d.amount} ${d.currency}`,
        html: wrap(`<h1 style="color:${green}">✅ Refund Processed</h1><p>Your refund of <strong>${d.amount} ${d.currency}</strong> has been processed.</p><p>Reference: <code>${d.reference}</code></p><p>The funds should appear in your account within 5–10 business days depending on your bank.</p>`),
      };

    // ─── CONTENT MODERATION ───
    case 'content_report_resolved':
      return {
        subject: `Content Report Update`,
        html: wrap(`<h1 style="color:${blue}">📋 Report Update</h1><p>Your content report has been reviewed and resolved.</p><p>Content type: ${d.content_type}</p><p>Action taken: ${d.action_taken || 'Reviewed and addressed.'}</p><p>Thank you for helping keep Siteviral safe.</p>`),
      };

    default:
      throw new Error(`Unknown template: ${template}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body: SendEmailBody = await req.json();
    const { template, to, data } = body;

    if (!template || !to) {
      return new Response(JSON.stringify({ error: 'Missing template or to' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let tpl: { subject: string; html: string };
    try {
      tpl = buildTemplate(template, data);
    } catch {
      return new Response(JSON.stringify({ error: 'Unknown template' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Siteviral <noreply@siteviral.com>',
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
