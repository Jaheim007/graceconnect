import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type EmailTemplate =
  // Auth & Onboarding
  | 'welcome' | 'onboarding_day1' | 'onboarding_day3' | 'onboarding_day7'
  | 'account_deleted' | 'new_device_login' | 'password_changed' | 'email_changed'
  | 'data_export_ready'
  // Re-engagement
  | 'inactive_7d' | 'inactive_14d' | 'inactive_30d' | 'anniversary_1y'
  // Donations
  | 'donation_receipt' | 'new_donation_received' | 'first_donation_milestone'
  | 'campaign_goal_reached' | 'campaign_expiring_soon' | 'payment_failed'
  // Products & Purchases
  | 'purchase_confirmation' | 'new_purchase_received' | 'download_ready'
  | 'first_sale_milestone'
  // KYC
  | 'kyc_submitted' | 'kyc_approved' | 'kyc_rejected'
  // Org lifecycle
  | 'org_created' | 'org_deleted' | 'org_suspended' | 'org_unsuspended'
  | 'org_inactive_30d' | 'member_milestone'
  // Members
  | 'new_member_joined' | 'member_left' | 'invite_to_org' | 'role_changed'
  | 'invite_accepted'
  // Payouts
  | 'payout_requested' | 'payout_approved' | 'payout_rejected' | 'payouts_frozen'
  // Affiliates
  | 'affiliate_sale' | 'affiliate_payout_requested' | 'affiliate_payout_completed'
  | 'affiliate_welcome' | 'affiliate_first_click' | 'affiliate_first_conversion'
  | 'affiliate_commission_payable' | 'affiliate_monthly_recap'
  // Partners
  | 'partner_welcome' | 'partner_rejected' | 'partner_suspended' | 'partner_unsuspended'
  | 'partner_kyc_approved' | 'partner_kyc_rejected' | 'partner_payout_sent'
  // Directory
  | 'directory_approved' | 'directory_rejected'
  // Support
  | 'ticket_created' | 'ticket_replied' | 'ticket_resolved'
  // Refunds
  | 'refund_initiated' | 'refund_completed'
  // Content & Social
  | 'content_report_resolved' | 'content_liked' | 'content_saved'
  | 'new_event_published' | 'new_announcement_published'
  | 'new_media_published' | 'new_product_published' | 'new_campaign_published'
  // Recaps
  | 'weekly_recap_user' | 'daily_recap_admin' | 'daily_recap_superadmin'
  // Superadmin alerts
  | 'fraud_alert' | 'new_org_alert';

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
const orange = '#f59e0b';

const cta = (href: string, text: string) =>
  `<p style="margin:20px 0"><a href="${href}" style="display:inline-block;background:${blue};color:#fff;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">${text}</a></p>`;

function buildTemplate(template: EmailTemplate, d: Record<string, string | number>): { subject: string; html: string } {
  switch (template) {
    // ═══ AUTH & ONBOARDING ═══
    case 'welcome':
      return { subject: '👋 Welcome to Siteviral', html: wrap(`<h1 style="color:${blue}">Welcome to Siteviral!</h1><p>Hi ${d.name || 'there'},</p><p>Your account is ready. Start building and growing your community today.</p>${cta('https://siteviral.com/dashboard', 'Go to Dashboard')}`) };
    case 'onboarding_day1':
      return { subject: '🚀 Complete your profile – Siteviral', html: wrap(`<h1 style="color:${blue}">🚀 One step to go!</h1><p>Hi ${d.name || 'there'},</p><p>Complete your profile to unlock all features: add a photo, bio, and join an organization.</p>${cta('https://siteviral.com/profile', 'Complete Profile')}`) };
    case 'onboarding_day3':
      return { subject: '🏢 Join or create an organization – Siteviral', html: wrap(`<h1 style="color:${blue}">🏢 Ready to build?</h1><p>Hi ${d.name || 'there'},</p><p>Create your first organization or discover existing ones to join.</p>${cta('https://siteviral.com/discover', 'Discover Organizations')}`) };
    case 'onboarding_day7':
      return { subject: '💡 Tips to grow your community – Siteviral', html: wrap(`<h1 style="color:${blue}">💡 Growth Tips</h1><p>Hi ${d.name || 'there'},</p><p>Here's how to make the most of Siteviral:</p><ul style="color:#ccc"><li>Publish media content to engage your members</li><li>Launch a donation campaign</li><li>Enable affiliates to grow your reach</li><li>Use email campaigns to stay connected</li></ul>${cta('https://siteviral.com/dashboard', 'Get Started')}`) };
    case 'new_device_login':
      return { subject: '🔒 New login detected – Siteviral', html: wrap(`<h1 style="color:${orange}">🔒 New Login Detected</h1><p>A new login to your account was detected.</p><p><strong>Device:</strong> ${d.device || 'Unknown'}</p><p><strong>Time:</strong> ${d.time || 'Just now'}</p><p style="color:#999">If this wasn't you, please change your password immediately.</p>`) };
    case 'password_changed':
      return { subject: '🔑 Password changed – Siteviral', html: wrap(`<h1 style="color:${info}">🔑 Password Changed</h1><p>Your password was successfully changed.</p><p style="color:#999">If you didn't make this change, contact <a href="mailto:support@siteviral.com" style="color:${blue}">support@siteviral.com</a> immediately.</p>`) };
    case 'email_changed':
      return { subject: '📧 Email updated – Siteviral', html: wrap(`<h1 style="color:${info}">📧 Email Updated</h1><p>Your email has been changed to <strong>${d.new_email}</strong>.</p><p style="color:#999">If you didn't make this change, contact support immediately.</p>`) };
    case 'account_deleted':
      return { subject: '👋 Account deleted – Siteviral', html: wrap(`<h1 style="color:${red}">👋 Account Deleted</h1><p>Your Siteviral account has been permanently deleted as requested.</p><p>All your data has been removed. We're sorry to see you go.</p>`) };
    case 'data_export_ready':
      return { subject: '📦 Your data export is ready – Siteviral', html: wrap(`<h1 style="color:${blue}">📦 Data Export Ready</h1><p>Your data export is ready for download.</p><p style="color:#999">The link expires in 48 hours.</p>${cta(String(d.download_link || '#'), 'Download Data')}`) };

    // ═══ RE-ENGAGEMENT ═══
    case 'inactive_7d':
      return { subject: '👀 We miss you! – Siteviral', html: wrap(`<h1 style="color:${blue}">👀 We Miss You!</h1><p>Hi ${d.name || 'there'},</p><p>It's been a week since your last visit. Here's what you may have missed:</p><p>• ${d.updates || 'New content from your organizations'}</p>${cta('https://siteviral.com/feed', 'Check What\'s New')}`) };
    case 'inactive_14d':
      return { subject: '🔔 Your communities are waiting – Siteviral', html: wrap(`<h1 style="color:${orange}">🔔 Your Communities Need You</h1><p>Hi ${d.name || 'there'},</p><p>It's been 2 weeks! Your organizations have new content, events, and updates waiting for you.</p>${cta('https://siteviral.com/feed', 'Come Back')}`) };
    case 'inactive_30d':
      return { subject: '❤️ Come back to Siteviral', html: wrap(`<h1 style="color:${red}">❤️ We'd Love You Back</h1><p>Hi ${d.name || 'there'},</p><p>It's been a month since your last visit. Your community misses you!</p><p>Need help? Reply to this email or contact <a href="mailto:support@siteviral.com" style="color:${blue}">support@siteviral.com</a>.</p>${cta('https://siteviral.com', 'Reconnect')}`) };
    case 'anniversary_1y':
      return { subject: '🎂 Happy 1 Year on Siteviral!', html: wrap(`<h1 style="color:${green}">🎂 Happy Anniversary!</h1><p>Hi ${d.name || 'there'},</p><p>It's been <strong>1 year</strong> since you joined Siteviral! Here's your year in review:</p><ul style="color:#ccc"><li>Organizations joined: ${d.orgs_count || 0}</li></ul><p>Thank you for being part of the community! 🎉</p>`) };

    // ═══ DONATIONS ═══
    case 'donation_receipt':
      return { subject: `Donation Receipt – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🙏 Donation Receipt</h1><p>Thank you for donating <strong>${d.amount} ${d.currency}</strong> to <strong>${d.org_name}</strong>.</p><p>Reference: <code>${d.reference}</code></p><p>Date: ${d.date}</p>`) };
    case 'new_donation_received':
      return { subject: `💰 New Donation – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">💰 New Donation Received</h1><p><strong>${d.donor_name || 'Anonymous'}</strong> donated <strong>${d.amount} ${d.currency}</strong> to <strong>${d.org_name}</strong>.</p><p>Campaign: ${d.campaign_name || 'General'}</p><p>Reference: <code>${d.reference}</code></p>`) };
    case 'first_donation_milestone':
      return { subject: `🎉 First donation received! – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🎉 First Donation!</h1><p>Congratulations! <strong>${d.org_name}</strong> has received its very first donation of <strong>${d.amount} ${d.currency}</strong>.</p><p>This is just the beginning! 🚀</p>`) };
    case 'campaign_goal_reached':
      return { subject: `🏆 Campaign goal reached – ${d.campaign_name}`, html: wrap(`<h1 style="color:${green}">🏆 Goal Reached!</h1><p>The campaign <strong>"${d.campaign_name}"</strong> for <strong>${d.org_name}</strong> has reached its goal of <strong>${d.goal_amount} ${d.currency}</strong>!</p><p>Current: ${d.current_amount} ${d.currency}</p>`) };
    case 'campaign_expiring_soon':
      return { subject: `⏰ Campaign ending soon – ${d.campaign_name}`, html: wrap(`<h1 style="color:${orange}">⏰ Campaign Ending Soon</h1><p>The campaign <strong>"${d.campaign_name}"</strong> for <strong>${d.org_name}</strong> ends in <strong>${d.days_left} days</strong>.</p><p>Progress: ${d.current_amount}/${d.goal_amount} ${d.currency}</p>`) };
    case 'payment_failed':
      return { subject: `❌ Payment failed – ${d.reference || ''}`, html: wrap(`<h1 style="color:${red}">❌ Payment Failed</h1><p>Your payment of <strong>${d.amount} ${d.currency}</strong> could not be processed.</p><p>Reference: <code>${d.reference}</code></p><p>Please try again or use a different payment method.</p>${cta('https://siteviral.com', 'Try Again')}`) };

    // ═══ PRODUCTS & PURCHASES ═══
    case 'purchase_confirmation':
      return { subject: `Purchase Confirmed – ${d.product_name}`, html: wrap(`<h1 style="color:${blue}">✅ Purchase Confirmed</h1><p>You purchased <strong>${d.product_name}</strong> from <strong>${d.org_name}</strong>.</p><p>Amount: ${d.amount} ${d.currency}</p><p>Reference: <code>${d.reference}</code></p>${d.access_link ? cta(String(d.access_link), 'Access Purchase →') : ''}`) };
    case 'new_purchase_received':
      return { subject: `🛒 New Sale – ${d.product_name}`, html: wrap(`<h1 style="color:${green}">🛒 New Sale</h1><p><strong>${d.buyer_name || 'A customer'}</strong> purchased <strong>${d.product_name}</strong> for <strong>${d.amount} ${d.currency}</strong>.</p><p>Reference: <code>${d.reference}</code></p>`) };
    case 'download_ready':
      return { subject: `📥 Your download is ready – ${d.product_name}`, html: wrap(`<h1 style="color:${blue}">📥 Download Ready</h1><p>Your purchase of <strong>${d.product_name}</strong> is ready for download.</p>${cta(String(d.download_link), 'Download Now →')}<p style="font-size:12px;color:#999">This link expires in 24 hours.</p>`) };
    case 'first_sale_milestone':
      return { subject: `🎉 First sale! – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🎉 First Sale!</h1><p>Congratulations! <strong>${d.org_name}</strong> made its first sale: <strong>${d.product_name}</strong> for <strong>${d.amount} ${d.currency}</strong>.</p><p>Keep it up! 🚀</p>`) };

    // ═══ KYC ═══
    case 'kyc_submitted':
      return { subject: `KYC Submitted – ${d.org_name}`, html: wrap(`<h1 style="color:${info}">📄 KYC Submitted</h1><p>Your KYC documents for <strong>${d.org_name}</strong> have been submitted successfully.</p><p>We'll review them within 2–3 business days.</p>`) };
    case 'kyc_approved':
      return { subject: `KYC Approved – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">✅ KYC Approved</h1><p>Your KYC for <strong>${d.org_name}</strong> has been approved.</p><p>You can now enable monetization features.</p>`) };
    case 'kyc_rejected':
      return { subject: `KYC Update – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">❌ KYC Requires Attention</h1><p>Your KYC submission for <strong>${d.org_name}</strong> was not approved.</p><p>Reason: ${d.reason || 'Please contact support.'}</p>`) };

    // ═══ ORG LIFECYCLE ═══
    case 'org_created':
      return { subject: `🏢 Organization Created – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🏢 Organization Created</h1><p>Your organization <strong>${d.org_name}</strong> has been created successfully.</p><p>Next steps: complete your profile, invite members, and start publishing content.</p>`) };
    case 'org_deleted':
      return { subject: `Organization Deleted – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">🗑 Organization Deleted</h1><p>The organization <strong>${d.org_name}</strong> has been permanently deleted.</p>${d.reason ? `<p>Reason: ${d.reason}</p>` : ''}`) };
    case 'org_suspended':
      return { subject: `⚠️ Organization Suspended – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">⚠️ Organization Suspended</h1><p>Your organization <strong>${d.org_name}</strong> has been suspended.</p><p>Reason: ${d.reason || 'Policy violation.'}</p>${d.until ? `<p>Suspended until: ${d.until}</p>` : ''}<p>Contact <a href="mailto:support@siteviral.com" style="color:${blue}">support@siteviral.com</a>.</p>`) };
    case 'org_unsuspended':
      return { subject: `✅ Suspension Lifted – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">✅ Suspension Lifted</h1><p>Your organization <strong>${d.org_name}</strong> is now active again.</p>`) };
    case 'org_inactive_30d':
      return { subject: `📊 Your organization needs attention – ${d.org_name}`, html: wrap(`<h1 style="color:${orange}">📊 Inactive Organization</h1><p>Hi,</p><p>Your organization <strong>${d.org_name}</strong> has had no activity in the last 30 days.</p><p>Publish content, create events, or launch a campaign to re-engage your members!</p>${cta('https://siteviral.com/admin', 'Go to Dashboard')}`) };
    case 'member_milestone':
      return { subject: `🎉 ${d.count} members! – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🎉 Milestone Reached!</h1><p><strong>${d.org_name}</strong> now has <strong>${d.count} members</strong>!</p><p>Keep growing! 🚀</p>`) };

    // ═══ MEMBERS ═══
    case 'new_member_joined':
      return { subject: `👤 New Member – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">👤 New Member</h1><p><strong>${d.member_name || 'Someone'}</strong> just joined <strong>${d.org_name}</strong>.</p><p>Total members: ${d.total_members || 'N/A'}</p>`) };
    case 'member_left':
      return { subject: `Member Left – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">👋 Member Left</h1><p><strong>${d.member_name || 'A member'}</strong> has left <strong>${d.org_name}</strong>.</p>`) };
    case 'invite_to_org':
      return { subject: `You're invited to join ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📩 You're Invited</h1><p><strong>${d.inviter_name || 'Someone'}</strong> invited you to join <strong>${d.org_name}</strong> on Siteviral.</p>${cta(String(d.invite_link || 'https://siteviral.com'), 'Accept Invitation →')}`) };
    case 'role_changed':
      return { subject: `Role Updated – ${d.org_name}`, html: wrap(`<h1 style="color:${info}">🔄 Role Updated</h1><p>Your role in <strong>${d.org_name}</strong> has been changed to <strong>${d.new_role}</strong>.</p>${d.old_role ? `<p>Previous role: ${d.old_role}</p>` : ''}`) };
    case 'invite_accepted':
      return { subject: `✅ Invitation accepted – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">✅ Invitation Accepted</h1><p><strong>${d.member_name}</strong> has accepted your invitation to join <strong>${d.org_name}</strong>.</p>`) };

    // ═══ PAYOUTS ═══
    case 'payout_requested':
      return { subject: `💸 Payout Requested – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${blue}">💸 Payout Requested</h1><p>A payout of <strong>${d.amount} ${d.currency}</strong> has been requested for <strong>${d.org_name}</strong>.</p><p>Processing time: 3–5 business days.</p>`) };
    case 'payout_approved':
      return { subject: `✅ Payout Approved – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">✅ Payout Approved</h1><p>Your payout of <strong>${d.amount} ${d.currency}</strong> for <strong>${d.org_name}</strong> has been approved and is being processed.</p>`) };
    case 'payout_rejected':
      return { subject: `Payout Rejected – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">❌ Payout Rejected</h1><p>Your payout request for <strong>${d.org_name}</strong> was rejected.</p><p>Reason: ${d.reason || 'Please contact support.'}</p>`) };
    case 'payouts_frozen':
      return { subject: `⚠️ Payouts Frozen – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">🧊 Payouts Frozen</h1><p>Payouts for <strong>${d.org_name}</strong> have been temporarily frozen.</p><p>Reason: ${d.reason || 'Under review.'}</p>${d.until ? `<p>Frozen until: ${d.until}</p>` : ''}<p>Contact <a href="mailto:support@siteviral.com" style="color:${blue}">support@siteviral.com</a>.</p>`) };

    // ═══ AFFILIATES ═══
    case 'affiliate_sale':
      return { subject: `🎉 Commission gagnée – ${d.commission} ${d.currency}`, html: wrap(`<h1 style="color:${green}">🎉 Commission Gagnée</h1><p>Vous avez gagné <strong>${d.commission} ${d.currency}</strong> grâce à une ${d.transaction_type || 'vente'} sur <strong>${d.org_name}</strong>.</p><p>Brut : ${d.gross_amount} ${d.currency} · Taux : ${d.commission_percent}%</p><p>Payable après un délai de sécurité de 15 jours.</p>`) };
    case 'affiliate_payout_requested':
      return { subject: `💸 Retrait ambassadeur demandé`, html: wrap(`<h1 style="color:${blue}">💸 Retrait Demandé</h1><p>Votre demande de retrait de <strong>${d.amount} ${d.currency}</strong> depuis <strong>${d.org_name}</strong> a été soumise.</p><p>Délai de traitement : 3 à 8 jours ouvrés.</p>`) };
    case 'affiliate_payout_completed':
      return { subject: `✅ Retrait ambassadeur envoyé – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">✅ Paiement Envoyé</h1><p>Votre retrait de <strong>${d.amount} ${d.currency}</strong> depuis <strong>${d.org_name}</strong> a été envoyé sur votre compte.</p>`) };
    case 'affiliate_welcome':
      return { subject: `🤝 Bienvenue, Ambassadeur ! – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🤝 Lien Ambassadeur Créé</h1><p>Vous avez créé votre premier lien ambassadeur pour <strong>${d.org_name}</strong>.</p><p>Partagez votre lien et gagnez <strong>${d.commission_percent}%</strong> sur chaque vente !</p><p>Votre code : <code>${d.code}</code></p><h3 style="color:#ccc;margin-top:16px">Prochaines étapes :</h3><ol style="color:#ccc"><li>Partagez votre lien sur vos réseaux sociaux</li><li>Configurez votre <a href="https://siteviral.com/affiliation" style="color:${blue}">méthode de paiement</a></li><li>Consultez les <a href="https://siteviral.com/ambassador-terms" style="color:${blue}">conditions du programme</a></li></ol>${cta('https://siteviral.com/affiliation', 'Mon Espace Ambassadeur')}`) };
    case 'affiliate_first_click':
      return { subject: `👆 Premier clic sur votre lien ambassadeur !`, html: wrap(`<h1 style="color:${blue}">👆 Premier Clic !</h1><p>Quelqu'un a cliqué sur votre lien ambassadeur pour <strong>${d.org_name}</strong>.</p><p>Continuez à partager pour obtenir des conversions ! 🚀</p>`) };
    case 'affiliate_first_conversion':
      return { subject: `🎯 Première conversion ! – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🎯 Première Conversion !</h1><p>Votre premier filleul a effectué un achat sur <strong>${d.org_name}</strong> !</p><p>Commission : <strong>${d.commission} ${d.currency}</strong></p>`) };
    case 'affiliate_commission_payable':
      return { subject: `💰 Commission disponible – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">💰 Commission Disponible</h1><p>Votre commission de <strong>${d.amount} ${d.currency}</strong> depuis <strong>${d.org_name}</strong> a passé le délai de sécurité de 15 jours et est maintenant disponible pour retrait.</p>${cta('https://siteviral.com/affiliation', 'Demander un retrait')}`) };
     case 'affiliate_monthly_recap':
      return { subject: `📊 Récap mensuel ambassadeur`, html: wrap(`<h1 style="color:${blue}">📊 Récap Mensuel Ambassadeur</h1><p>Voici votre résumé pour <strong>${d.month}</strong> :</p><ul style="color:#ccc"><li>Clics : ${d.clicks || 0}</li><li>Conversions : ${d.conversions || 0}</li><li>Gains : ${d.earnings || 0} ${d.currency || 'XOF'}</li></ul>`) };

    // ═══ PARTNERS ═══
    case 'partner_welcome':
      return { subject: `🤝 Bienvenue, Partenaire ! – Siteviral`, html: wrap(`<h1 style="color:${green}">🤝 Bienvenue au Programme Partenaires !</h1><p>Bonjour <strong>${d.name}</strong>,</p><p>Votre candidature au Programme Partenaires Siteviral a été <strong>approuvée</strong> ! 🎉</p><p>Voici votre code d'invitation :</p><code style="display:block;background:#222;padding:16px;border-radius:8px;text-align:center;font-size:18px;letter-spacing:2px;margin:16px 0;color:${blue}">${d.invite_code}</code><p>Partagez ce code avec les responsables d'organisations. Chaque plateforme créée avec votre code vous génère des commissions récurrentes.</p><h3 style="color:#ccc;margin-top:24px">Prochaines étapes :</h3><ol style="color:#ccc"><li>Connectez-vous à votre <a href="https://siteviral.com/partner" style="color:${blue}">Espace Partenaire</a></li><li>Complétez votre <strong>vérification KYC</strong> (requise avant le premier paiement)</li><li>Configurez votre méthode de paiement</li><li>Commencez à inviter des organisations !</li></ol>${cta('https://siteviral.com/partner', 'Accéder à mon Espace Partenaire')}`) };
    case 'partner_rejected':
      return { subject: `Candidature Partenaire – Mise à jour`, html: wrap(`<h1 style="color:${red}">Candidature non retenue</h1><p>Bonjour <strong>${d.name}</strong>,</p><p>Après examen, votre candidature au Programme Partenaires n'a pas été retenue.</p>${d.reason ? `<p>Raison : ${d.reason}</p>` : ''}<p>Vous pouvez nous contacter à <a href="mailto:partners@siteviral.com" style="color:${blue}">partners@siteviral.com</a> pour plus d'informations.</p>`) };
    case 'partner_suspended':
      return { subject: `⚠️ Compte Partenaire suspendu`, html: wrap(`<h1 style="color:${red}">⚠️ Compte Suspendu</h1><p>Bonjour <strong>${d.name}</strong>,</p><p>Votre compte partenaire a été suspendu.</p>${d.reason ? `<p>Raison : ${d.reason}</p>` : ''}<p>Contact : <a href="mailto:partners@siteviral.com" style="color:${blue}">partners@siteviral.com</a></p>`) };
    case 'partner_unsuspended':
      return { subject: `✅ Compte Partenaire réactivé`, html: wrap(`<h1 style="color:${green}">✅ Compte Réactivé</h1><p>Bonjour <strong>${d.name}</strong>,</p><p>Votre compte partenaire est de nouveau actif. Vous pouvez continuer à inviter des organisations.</p>${cta('https://siteviral.com/partner', 'Mon Espace Partenaire')}`) };
    case 'partner_kyc_approved':
      return { subject: `✅ KYC Partenaire approuvé`, html: wrap(`<h1 style="color:${green}">✅ Vérification KYC Approuvée</h1><p>Bonjour <strong>${d.name}</strong>,</p><p>Votre identité a été vérifiée avec succès. Vous pouvez désormais demander des paiements depuis votre Espace Partenaire.</p>${cta('https://siteviral.com/partner', 'Configurer mon paiement')}`) };
    case 'partner_kyc_rejected':
      return { subject: `KYC Partenaire – Action requise`, html: wrap(`<h1 style="color:${red}">❌ KYC Non Approuvé</h1><p>Bonjour <strong>${d.name}</strong>,</p><p>Votre vérification KYC n'a pas été approuvée.</p>${d.reason ? `<p>Raison : ${d.reason}</p>` : ''}<p>Vous pouvez soumettre de nouveaux documents depuis votre Espace Partenaire.</p>${cta('https://siteviral.com/partner', 'Resoumettre')}`) };
    case 'partner_payout_sent':
      return { subject: `💸 Paiement envoyé – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">💸 Paiement Envoyé</h1><p>Bonjour <strong>${d.name}</strong>,</p><p>Un paiement de <strong>${d.amount} ${d.currency}</strong> a été envoyé sur votre compte.</p><p>Les fonds seront disponibles sous 1–3 jours ouvrés.</p>`) };

    // ═══ DIRECTORY ═══
    case 'directory_approved':
      return { subject: `🌟 Directory Approved – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🌟 Directory Listing Approved</h1><p>Your organization <strong>${d.org_name}</strong> has been approved for the Siteviral directory.</p>`) };
    case 'directory_rejected':
      return { subject: `Directory Application Update – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">❌ Directory Application Declined</h1><p>Your directory application for <strong>${d.org_name}</strong> was not approved.</p><p>Reason: ${d.reason || 'Does not meet listing criteria.'}</p>`) };

    // ═══ SUPPORT ═══
    case 'ticket_created':
      return { subject: `🎫 Support Ticket #${d.ticket_id || ''} Created`, html: wrap(`<h1 style="color:${blue}">🎫 Ticket Created</h1><p>Your support ticket has been created.</p><p><strong>Subject:</strong> ${d.subject}</p><p><strong>Category:</strong> ${d.category}</p><p>Our team will respond within 24–48 hours.</p>`) };
    case 'ticket_replied':
      return { subject: `💬 Reply to Ticket #${d.ticket_id || ''}`, html: wrap(`<h1 style="color:${info}">💬 New Reply</h1><p>A support agent has replied to your ticket:</p><div style="background:#222;border-radius:8px;padding:16px;margin:12px 0;border-left:3px solid ${blue}">${d.reply_preview || 'View the full reply in your Support Center.'}</div>${cta('https://siteviral.com/support', 'View Ticket →')}`) };
    case 'ticket_resolved':
      return { subject: `✅ Ticket Resolved #${d.ticket_id || ''}`, html: wrap(`<h1 style="color:${green}">✅ Ticket Resolved</h1><p>Your support ticket <strong>${d.subject}</strong> has been marked as resolved.</p>`) };

    // ═══ REFUNDS ═══
    case 'refund_initiated':
      return { subject: `🔄 Refund Request Received – ${d.reference || ''}`, html: wrap(`<h1 style="color:${info}">🔄 Refund Request Received</h1><p>We received your refund request for <strong>${d.amount} ${d.currency}</strong>.</p><p>Product/Donation: ${d.item_name || 'N/A'}</p><p>Reference: <code>${d.reference}</code></p><p>Review within 3–5 business days.</p>`) };
    case 'refund_completed':
      return { subject: `✅ Refund Processed – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">✅ Refund Processed</h1><p>Your refund of <strong>${d.amount} ${d.currency}</strong> has been processed.</p><p>Reference: <code>${d.reference}</code></p><p>Funds should appear within 5–10 business days.</p>`) };

    // ═══ CONTENT & SOCIAL ═══
    case 'content_report_resolved':
      return { subject: `Content Report Update`, html: wrap(`<h1 style="color:${info}">📋 Report Update</h1><p>Your content report has been reviewed and resolved.</p><p>Content type: ${d.content_type}</p><p>Action taken: ${d.action_taken || 'Reviewed and addressed.'}</p>`) };
    case 'content_liked':
      return { subject: `❤️ Someone liked your content`, html: wrap(`<h1 style="color:${red}">❤️ New Like</h1><p><strong>${d.liker_name || 'Someone'}</strong> liked your ${d.content_type || 'content'}: <strong>"${d.content_title}"</strong>.</p>`) };
    case 'content_saved':
      return { subject: `🔖 Someone saved your content`, html: wrap(`<h1 style="color:${blue}">🔖 Content Saved</h1><p><strong>${d.saver_name || 'Someone'}</strong> saved your ${d.content_type || 'content'}: <strong>"${d.content_title}"</strong>.</p>`) };
    case 'new_event_published':
      return { subject: `📅 New Event – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📅 New Event</h1><p><strong>${d.org_name}</strong> published a new event: <strong>"${d.event_title}"</strong>.</p>${d.event_date ? `<p>Date: ${d.event_date}</p>` : ''}${cta(String(d.event_link || '#'), 'View Event')}`) };
    case 'new_announcement_published':
      return { subject: `📢 New Announcement – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📢 New Announcement</h1><p><strong>${d.org_name}</strong> posted: <strong>"${d.announcement_title}"</strong>.</p>${cta(String(d.org_link || '#'), 'Read More')}`) };
    case 'new_media_published':
      return { subject: `🎬 New Content – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🎬 New Content</h1><p><strong>${d.org_name}</strong> published: <strong>"${d.media_title}"</strong>.</p>${cta(String(d.media_link || '#'), 'Watch Now')}`) };
    case 'new_product_published':
      return { subject: `🛍 New Product – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🛍 New Product</h1><p><strong>${d.org_name}</strong> released a new product: <strong>"${d.product_name}"</strong>.</p>${d.price ? `<p>Price: ${d.price} ${d.currency || 'XOF'}</p>` : '<p>Free!</p>'}${cta(String(d.product_link || '#'), 'View Product')}`) };
    case 'new_campaign_published':
      return { subject: `🎯 New Campaign – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🎯 New Campaign</h1><p><strong>${d.org_name}</strong> launched: <strong>"${d.campaign_name}"</strong>.</p>${d.goal_amount ? `<p>Goal: ${d.goal_amount} ${d.currency || 'XOF'}</p>` : ''}${cta(String(d.campaign_link || '#'), 'Donate Now')}`) };
    case 'new_program_published':
      return { subject: `🎓 New Program – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🎓 New Program</h1><p><strong>${d.org_name}</strong> launched: <strong>"${d.program_name}"</strong>.</p>${cta(String(d.program_link || '#'), 'Enroll Now')}`) };

    // ═══ RECAPS ═══
    case 'weekly_recap_user':
      return { subject: `📬 Your Weekly Recap – Siteviral`, html: wrap(`<h1 style="color:${blue}">📬 Weekly Recap</h1><p>Hi ${d.name || 'there'}, here's your week in review:</p><ul style="color:#ccc"><li>New content: ${d.new_content || 0}</li><li>Events coming up: ${d.upcoming_events || 0}</li><li>Notifications: ${d.unread_notifications || 0}</li></ul>${cta('https://siteviral.com/feed', 'See What\'s New')}`) };
    case 'daily_recap_admin':
      return { subject: `📊 Daily Report – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📊 Daily Report</h1><p><strong>${d.org_name}</strong> – ${d.date}</p><ul style="color:#ccc"><li>Revenue: ${d.revenue || 0} ${d.currency || 'XOF'}</li><li>New members: ${d.new_members || 0}</li><li>Transactions: ${d.transactions || 0}</li><li>Page views: ${d.page_views || 0}</li></ul>`) };
    case 'daily_recap_superadmin':
      return { subject: `🔷 Platform Daily Report – Siteviral`, html: wrap(`<h1 style="color:${blue}">🔷 Platform Report – ${d.date}</h1><ul style="color:#ccc"><li>GMV: ${d.gmv || 0} XOF</li><li>Platform fees: ${d.platform_fees || 0} XOF</li><li>New users: ${d.new_users || 0}</li><li>New orgs: ${d.new_orgs || 0}</li><li>Total transactions: ${d.total_transactions || 0}</li></ul>`) };

    // ═══ SUPERADMIN ALERTS ═══
    case 'fraud_alert':
      return { subject: `🚨 Fraud Alert – ${d.org_name || 'Platform'}`, html: wrap(`<h1 style="color:${red}">🚨 Fraud Alert</h1><p>Suspicious activity detected:</p><p><strong>Type:</strong> ${d.reason}</p><p><strong>Organization:</strong> ${d.org_name || 'N/A'}</p><p><strong>User:</strong> ${d.user_email || 'N/A'}</p>${cta('https://siteviral.com/superadmin/risk', 'Review Now')}`) };
    case 'new_org_alert':
      return { subject: `🏢 New Organization Created – ${d.org_name}`, html: wrap(`<h1 style="color:${info}">🏢 New Organization</h1><p>A new organization has been created:</p><p><strong>Name:</strong> ${d.org_name}</p><p><strong>Category:</strong> ${d.category || 'N/A'}</p><p><strong>Owner:</strong> ${d.owner_email || 'N/A'}</p>${cta('https://siteviral.com/superadmin/directory', 'Review')}`) };

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
