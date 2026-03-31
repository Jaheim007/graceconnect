import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type EmailTemplate =
  | 'notification_reminder'
  | 'welcome' | 'onboarding_day1' | 'onboarding_day3' | 'onboarding_day7'
  | 'account_deleted' | 'new_device_login' | 'password_changed' | 'email_changed'
  | 'data_export_ready'
  | 'inactive_7d' | 'inactive_14d' | 'inactive_30d' | 'anniversary_1y'
  | 'donation_receipt' | 'new_donation_received' | 'first_donation_milestone'
  | 'campaign_goal_reached' | 'campaign_expiring_soon' | 'payment_failed'
  | 'purchase_confirmation' | 'new_purchase_received' | 'download_ready'
  | 'first_sale_milestone'
  | 'kyc_submitted' | 'kyc_approved' | 'kyc_rejected'
  | 'org_created' | 'org_deleted' | 'org_suspended' | 'org_unsuspended'
  | 'org_inactive_30d' | 'member_milestone'
  | 'new_member_joined' | 'member_left' | 'invite_to_org' | 'role_changed'
  | 'invite_accepted'
  | 'payout_requested' | 'payout_approved' | 'payout_processing' | 'payout_completed' | 'payout_rejected' | 'payouts_frozen'
  | 'affiliate_sale' | 'affiliate_payout_requested' | 'affiliate_payout_completed'
  | 'affiliate_welcome' | 'affiliate_first_click' | 'affiliate_first_conversion'
  | 'affiliate_commission_payable' | 'affiliate_monthly_recap'
  | 'affiliate_new_product' | 'affiliate_new_campaign' | 'affiliate_new_program'
  | 'affiliate_price_changed' | 'affiliate_content_unpublished'
  | 'partner_welcome' | 'partner_rejected' | 'partner_suspended' | 'partner_unsuspended'
  | 'partner_kyc_approved' | 'partner_kyc_rejected' | 'partner_payout_sent'
  | 'partner_new_referral' | 'partner_commission_earned'
  | 'partner_application_received' | 'partner_level_up'
  | 'directory_approved' | 'directory_rejected'
  | 'ticket_created' | 'ticket_replied' | 'ticket_resolved'
  | 'refund_initiated' | 'refund_completed'
  | 'content_report_resolved' | 'content_liked' | 'content_saved'
  | 'new_event_published' | 'new_announcement_published'
  | 'new_media_published' | 'new_product_published' | 'new_campaign_published'
  | 'new_program_published'
  | 'new_comment_received' | 'comment_reply'
  | 'subscription_renewed' | 'subscription_expiring' | 'subscription_cancelled'
  | 'offering_received' | 'offering_receipt'
  | 'program_enrolled' | 'program_completed' | 'program_new_lesson'
  | 'badge_earned'
  | 'abandoned_cart_reminder'
  | 'event_reminder_24h'
  | 'weekly_recap_user' | 'daily_recap_admin' | 'daily_recap_superadmin'
  | 'monthly_recap_org' | 'weekly_ambassador_recap'
  | 'fraud_alert' | 'new_org_alert' | 'moderation_action'
  | 'flash_sale_alert' | 'promo_code_used' | 'org_verified'
  | 'waitlist_spot_available' | 'referral_reward'
  | 'review_request'
  | 'org_welcome_j0' | 'org_onboarding_j1' | 'org_onboarding_j3'
  | 'post_purchase_ambassador_j1' | 'post_purchase_ambassador_j5' | 'post_purchase_ambassador_j10'
  | 'buyer_to_creator' | 'visitor_to_creator' | 'first_commission_earned' | 'trending_product_nudge';

type Lang = 'fr' | 'en';

interface SendEmailBody {
  template: EmailTemplate;
  to: string;
  data: Record<string, string | number>;
  organization_id?: string;
  locale?: Lang;
}

const FOOTER_FR = `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #333;font-size:11px;color:#777">
  <p>Siteviral — Operated by Hacktualiz Inc.</p>
  <p>131 Continental Dr, Suite 305, Newark, DE 19713, United States</p>
  <p><a href="https://siteviral.com/terms" style="color:#1a66e6">Conditions</a> · <a href="https://siteviral.com/privacy" style="color:#1a66e6">Confidentialité</a> · <a href="https://siteviral.com/refund-policy" style="color:#1a66e6">Remboursement</a></p>
</div>`;

const FOOTER_EN = `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #333;font-size:11px;color:#777">
  <p>Siteviral — Operated by Hacktualiz Inc.</p>
  <p>131 Continental Dr, Suite 305, Newark, DE 19713, United States</p>
  <p><a href="https://siteviral.com/terms" style="color:#1a66e6">Terms</a> · <a href="https://siteviral.com/privacy" style="color:#1a66e6">Privacy</a> · <a href="https://siteviral.com/refund-policy" style="color:#1a66e6">Refund Policy</a></p>
</div>`;

const wrap = (content: string, lang: Lang) => `<!DOCTYPE html><html lang="${lang}"><body style="font-family:sans-serif;background:#0f0f0f;color:#eee;padding:32px">
<div style="max-width:520px;margin:0 auto;background:#1a1a1a;border-radius:16px;padding:32px;border:1px solid #333">
${content}${lang === 'en' ? FOOTER_EN : FOOTER_FR}
</div></body></html>`;

const blue = '#1a66e6';
const green = '#22c55e';
const red = '#ef4444';
const info = '#3b82f6';
const orange = '#f59e0b';

const cta = (href: string, text: string) =>
  `<p style="margin:20px 0"><a href="${href}" style="display:inline-block;background:${blue};color:#fff;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">${text}</a></p>`;

// ═══════════════════════════════════════
// Bilingual template builder
// ═══════════════════════════════════════
function buildTemplate(template: EmailTemplate, d: Record<string, string | number>, lang: Lang): { subject: string; html: string } {
  const isFr = lang === 'fr';

  switch (template) {
    // ═══ AUTH & ONBOARDING ═══
    case 'welcome':
      return isFr
        ? { subject: '👋 Bienvenue sur Siteviral', html: wrap(`<h1 style="color:${blue}">Bienvenue sur Siteviral !</h1><p>Bonjour ${d.name || ''},</p><p>Votre compte est prêt. Commencez dès maintenant à explorer la plateforme.</p>${cta('https://siteviral.com/dashboard', 'Accéder à mon espace')}`, lang) }
        : { subject: '👋 Welcome to Siteviral', html: wrap(`<h1 style="color:${blue}">Welcome to Siteviral!</h1><p>Hello ${d.name || ''},</p><p>Your account is ready. Start exploring the platform now.</p>${cta('https://siteviral.com/dashboard', 'Go to my dashboard')}`, lang) };

    case 'onboarding_day1':
      return isFr
        ? { subject: '🚀 Complétez votre profil – Siteviral', html: wrap(`<h1 style="color:${blue}">🚀 Plus qu'une étape !</h1><p>Bonjour ${d.name || ''},</p><p>Complétez votre profil pour profiter de toutes les fonctionnalités : ajoutez une photo et une bio.</p>${cta('https://siteviral.com/profile', 'Compléter mon profil')}`, lang) }
        : { subject: '🚀 Complete your profile – Siteviral', html: wrap(`<h1 style="color:${blue}">🚀 Just one more step!</h1><p>Hello ${d.name || ''},</p><p>Complete your profile to unlock all features: add a photo and bio.</p>${cta('https://siteviral.com/profile', 'Complete my profile')}`, lang) };

    case 'onboarding_day3':
      return isFr
        ? { subject: '🏢 Découvrez les organisations – Siteviral', html: wrap(`<h1 style="color:${blue}">🏢 Prêt à vous lancer ?</h1><p>Bonjour ${d.name || ''},</p><p>Créez votre première organisation ou explorez celles qui existent déjà.</p>${cta('https://siteviral.com/marketplace', 'Explorer')}`, lang) }
        : { subject: '🏢 Discover organizations – Siteviral', html: wrap(`<h1 style="color:${blue}">🏢 Ready to get started?</h1><p>Hello ${d.name || ''},</p><p>Create your first organization or explore existing ones.</p>${cta('https://siteviral.com/marketplace', 'Explore')}`, lang) };

    case 'onboarding_day7':
      return isFr
        ? { subject: '💡 Astuces pour réussir – Siteviral', html: wrap(`<h1 style="color:${blue}">💡 Astuces de croissance</h1><p>Bonjour ${d.name || ''},</p><p>Voici comment tirer le meilleur parti de Siteviral :</p><ul style="color:#ccc"><li>Publiez du contenu pour engager votre audience</li><li>Lancez une campagne de collecte</li><li>Activez les ambassadeurs pour étendre votre portée</li><li>Utilisez les campagnes email pour rester connecté</li></ul>${cta('https://siteviral.com/dashboard', 'Commencer')}`, lang) }
        : { subject: '💡 Tips for success – Siteviral', html: wrap(`<h1 style="color:${blue}">💡 Growth tips</h1><p>Hello ${d.name || ''},</p><p>Here's how to get the most out of Siteviral:</p><ul style="color:#ccc"><li>Publish content to engage your audience</li><li>Launch a fundraising campaign</li><li>Activate ambassadors to extend your reach</li><li>Use email campaigns to stay connected</li></ul>${cta('https://siteviral.com/dashboard', 'Get started')}`, lang) };

    case 'new_device_login':
      return isFr
        ? { subject: '🔒 Nouvelle connexion détectée – Siteviral', html: wrap(`<h1 style="color:${orange}">🔒 Nouvelle Connexion Détectée</h1><p>Une nouvelle connexion à votre compte a été détectée.</p><p><strong>Appareil :</strong> ${d.device || 'Inconnu'}</p><p><strong>Heure :</strong> ${d.time || 'À l\'instant'}</p><p style="color:#999">Si ce n'était pas vous, changez votre mot de passe immédiatement.</p>`, lang) }
        : { subject: '🔒 New login detected – Siteviral', html: wrap(`<h1 style="color:${orange}">🔒 New Login Detected</h1><p>A new login to your account was detected.</p><p><strong>Device:</strong> ${d.device || 'Unknown'}</p><p><strong>Time:</strong> ${d.time || 'Just now'}</p><p style="color:#999">If this wasn't you, change your password immediately.</p>`, lang) };

    case 'password_changed':
      return isFr
        ? { subject: '🔑 Mot de passe modifié – Siteviral', html: wrap(`<h1 style="color:${info}">🔑 Mot de passe modifié</h1><p>Votre mot de passe a été modifié avec succès.</p><p style="color:#999">Si vous n'êtes pas à l'origine de ce changement, contactez <a href="mailto:support@siteviral.com" style="color:${blue}">support@siteviral.com</a> immédiatement.</p>`, lang) }
        : { subject: '🔑 Password changed – Siteviral', html: wrap(`<h1 style="color:${info}">🔑 Password Changed</h1><p>Your password was changed successfully.</p><p style="color:#999">If you didn't make this change, contact <a href="mailto:support@siteviral.com" style="color:${blue}">support@siteviral.com</a> immediately.</p>`, lang) };

    case 'email_changed':
      return isFr
        ? { subject: '📧 Email mis à jour – Siteviral', html: wrap(`<h1 style="color:${info}">📧 Email mis à jour</h1><p>Votre email a été changé pour <strong>${d.new_email}</strong>.</p><p style="color:#999">Si vous n'êtes pas à l'origine de ce changement, contactez le support immédiatement.</p>`, lang) }
        : { subject: '📧 Email updated – Siteviral', html: wrap(`<h1 style="color:${info}">📧 Email Updated</h1><p>Your email has been changed to <strong>${d.new_email}</strong>.</p><p style="color:#999">If you didn't make this change, contact support immediately.</p>`, lang) };

    case 'account_deleted':
      return isFr
        ? { subject: '👋 Compte supprimé – Siteviral', html: wrap(`<h1 style="color:${red}">👋 Compte Supprimé</h1><p>Votre compte Siteviral a été définitivement supprimé comme demandé.</p><p>Toutes vos données ont été effacées. Nous sommes désolés de vous voir partir.</p>`, lang) }
        : { subject: '👋 Account deleted – Siteviral', html: wrap(`<h1 style="color:${red}">👋 Account Deleted</h1><p>Your Siteviral account has been permanently deleted as requested.</p><p>All your data has been erased. We're sorry to see you go.</p>`, lang) };

    case 'data_export_ready':
      return isFr
        ? { subject: '📦 Vos données sont prêtes – Siteviral', html: wrap(`<h1 style="color:${blue}">📦 Export de données prêt</h1><p>Votre export de données est prêt à être téléchargé.</p><p style="color:#999">Le lien expire dans 48 heures.</p>${cta(String(d.download_link || '#'), 'Télécharger mes données')}`, lang) }
        : { subject: '📦 Your data is ready – Siteviral', html: wrap(`<h1 style="color:${blue}">📦 Data Export Ready</h1><p>Your data export is ready to download.</p><p style="color:#999">The link expires in 48 hours.</p>${cta(String(d.download_link || '#'), 'Download my data')}`, lang) };

    // ═══ RE-ENGAGEMENT ═══
    case 'inactive_7d':
      return isFr
        ? { subject: '👀 Vous nous manquez ! – Siteviral', html: wrap(`<h1 style="color:${blue}">👀 Vous nous manquez !</h1><p>Bonjour ${d.name || ''},</p><p>Cela fait une semaine que vous ne vous êtes pas connecté. Voici ce que vous avez peut-être manqué :</p><p>• ${d.updates || 'Du nouveau contenu vous attend'}</p>${cta('https://siteviral.com/marketplace', 'Voir les nouveautés')}`, lang) }
        : { subject: '👀 We miss you! – Siteviral', html: wrap(`<h1 style="color:${blue}">👀 We miss you!</h1><p>Hello ${d.name || ''},</p><p>It's been a week since you last logged in. Here's what you might have missed:</p><p>• ${d.updates || 'New content is waiting for you'}</p>${cta('https://siteviral.com/marketplace', 'See what\'s new')}`, lang) };

    case 'inactive_14d':
      return isFr
        ? { subject: '🔔 Vos communautés vous attendent – Siteviral', html: wrap(`<h1 style="color:${orange}">🔔 Vos communautés vous attendent</h1><p>Bonjour ${d.name || ''},</p><p>Cela fait 2 semaines ! De nouveaux contenus, événements et mises à jour vous attendent.</p>${cta('https://siteviral.com/marketplace', 'Revenir')}`, lang) }
        : { subject: '🔔 Your communities are waiting – Siteviral', html: wrap(`<h1 style="color:${orange}">🔔 Your communities are waiting</h1><p>Hello ${d.name || ''},</p><p>It's been 2 weeks! New content, events, and updates are waiting for you.</p>${cta('https://siteviral.com/marketplace', 'Come back')}`, lang) };

    case 'inactive_30d':
      return isFr
        ? { subject: '❤️ Revenez sur Siteviral', html: wrap(`<h1 style="color:${red}">❤️ Revenez nous voir</h1><p>Bonjour ${d.name || ''},</p><p>Cela fait un mois depuis votre dernière visite. Votre communauté vous attend !</p><p>Besoin d'aide ? Répondez à cet email ou contactez <a href="mailto:support@siteviral.com" style="color:${blue}">support@siteviral.com</a>.</p>${cta('https://siteviral.com', 'Se reconnecter')}`, lang) }
        : { subject: '❤️ Come back to Siteviral', html: wrap(`<h1 style="color:${red}">❤️ Come back to us</h1><p>Hello ${d.name || ''},</p><p>It's been a month since your last visit. Your community is waiting!</p><p>Need help? Reply to this email or contact <a href="mailto:support@siteviral.com" style="color:${blue}">support@siteviral.com</a>.</p>${cta('https://siteviral.com', 'Log back in')}`, lang) };

    case 'anniversary_1y':
      return isFr
        ? { subject: '🎂 1 an sur Siteviral !', html: wrap(`<h1 style="color:${green}">🎂 Joyeux anniversaire !</h1><p>Bonjour ${d.name || ''},</p><p>Cela fait <strong>1 an</strong> que vous avez rejoint Siteviral ! Voici votre année en résumé :</p><ul style="color:#ccc"><li>Organisations rejointes : ${d.orgs_count || 0}</li></ul><p>Merci de faire partie de la communauté ! 🎉</p>`, lang) }
        : { subject: '🎂 1 year on Siteviral!', html: wrap(`<h1 style="color:${green}">🎂 Happy Anniversary!</h1><p>Hello ${d.name || ''},</p><p>It's been <strong>1 year</strong> since you joined Siteviral! Here's your year in review:</p><ul style="color:#ccc"><li>Organizations joined: ${d.orgs_count || 0}</li></ul><p>Thank you for being part of the community! 🎉</p>`, lang) };

    // ═══ DONATIONS ═══
    case 'donation_receipt':
      return isFr
        ? { subject: `Reçu de don – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🙏 Reçu de Don</h1><p>Merci pour votre don de <strong>${d.amount} ${d.currency}</strong> à <strong>${d.org_name}</strong>.</p><p>Référence : <code>${d.reference}</code></p><p>Date : ${d.date}</p><p>Merci pour votre générosité.</p>`, lang) }
        : { subject: `Donation receipt – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🙏 Donation Receipt</h1><p>Thank you for your donation of <strong>${d.amount} ${d.currency}</strong> to <strong>${d.org_name}</strong>.</p><p>Reference: <code>${d.reference}</code></p><p>Date: ${d.date}</p><p>Thank you for your generosity.</p>`, lang) };

    case 'new_donation_received':
      return isFr
        ? { subject: `💰 Nouveau don – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">💰 Nouveau Don Reçu</h1><p><strong>${d.donor_name || 'Anonyme'}</strong> a fait un don de <strong>${d.amount} ${d.currency}</strong> à <strong>${d.org_name}</strong>.</p><p>Campagne : ${d.campaign_name || 'Général'}</p><p>Référence : <code>${d.reference}</code></p>`, lang) }
        : { subject: `💰 New donation – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">💰 New Donation Received</h1><p><strong>${d.donor_name || 'Anonymous'}</strong> donated <strong>${d.amount} ${d.currency}</strong> to <strong>${d.org_name}</strong>.</p><p>Campaign: ${d.campaign_name || 'General'}</p><p>Reference: <code>${d.reference}</code></p>`, lang) };

    case 'first_donation_milestone':
      return isFr
        ? { subject: `🎉 Premier don reçu ! – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🎉 Premier Don !</h1><p>Félicitations ! <strong>${d.org_name}</strong> a reçu son tout premier don de <strong>${d.amount} ${d.currency}</strong>.</p><p>Ce n'est que le début ! 🚀</p>`, lang) }
        : { subject: `🎉 First donation received! – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🎉 First Donation!</h1><p>Congratulations! <strong>${d.org_name}</strong> received its very first donation of <strong>${d.amount} ${d.currency}</strong>.</p><p>This is just the beginning! 🚀</p>`, lang) };

    case 'campaign_goal_reached':
      return isFr
        ? { subject: `🏆 Objectif atteint – ${d.campaign_name}`, html: wrap(`<h1 style="color:${green}">🏆 Objectif Atteint !</h1><p>La campagne <strong>"${d.campaign_name}"</strong> pour <strong>${d.org_name}</strong> a atteint son objectif de <strong>${d.goal_amount} ${d.currency}</strong> !</p><p>Montant actuel : ${d.current_amount} ${d.currency}</p>`, lang) }
        : { subject: `🏆 Goal reached – ${d.campaign_name}`, html: wrap(`<h1 style="color:${green}">🏆 Goal Reached!</h1><p>The campaign <strong>"${d.campaign_name}"</strong> for <strong>${d.org_name}</strong> reached its goal of <strong>${d.goal_amount} ${d.currency}</strong>!</p><p>Current amount: ${d.current_amount} ${d.currency}</p>`, lang) };

    case 'campaign_expiring_soon':
      return isFr
        ? { subject: `⏰ Campagne bientôt terminée – ${d.campaign_name}`, html: wrap(`<h1 style="color:${orange}">⏰ Campagne Bientôt Terminée</h1><p>La campagne <strong>"${d.campaign_name}"</strong> pour <strong>${d.org_name}</strong> se termine dans <strong>${d.days_left} jours</strong>.</p><p>Progression : ${d.current_amount}/${d.goal_amount} ${d.currency}</p>`, lang) }
        : { subject: `⏰ Campaign ending soon – ${d.campaign_name}`, html: wrap(`<h1 style="color:${orange}">⏰ Campaign Ending Soon</h1><p>The campaign <strong>"${d.campaign_name}"</strong> for <strong>${d.org_name}</strong> ends in <strong>${d.days_left} days</strong>.</p><p>Progress: ${d.current_amount}/${d.goal_amount} ${d.currency}</p>`, lang) };

    case 'payment_failed':
      return isFr
        ? { subject: `❌ Échec du paiement – ${d.reference || ''}`, html: wrap(`<h1 style="color:${red}">❌ Échec du Paiement</h1><p>Votre paiement de <strong>${d.amount} ${d.currency}</strong> n'a pas pu être traité.</p><p>Référence : <code>${d.reference}</code></p><p>Veuillez réessayer ou utiliser un autre moyen de paiement.</p>${cta('https://siteviral.com', 'Réessayer')}`, lang) }
        : { subject: `❌ Payment failed – ${d.reference || ''}`, html: wrap(`<h1 style="color:${red}">❌ Payment Failed</h1><p>Your payment of <strong>${d.amount} ${d.currency}</strong> could not be processed.</p><p>Reference: <code>${d.reference}</code></p><p>Please try again or use a different payment method.</p>${cta('https://siteviral.com', 'Try again')}`, lang) };

    // ═══ PRODUCTS & PURCHASES ═══
    case 'purchase_confirmation':
      return isFr
        ? { subject: `Achat confirmé – ${d.product_name}`, html: wrap(`<h1 style="color:${blue}">✅ Achat Confirmé</h1><p>Vous avez acheté <strong>${d.product_name}</strong> auprès de <strong>${d.org_name}</strong>.</p><p>Montant : ${d.amount} ${d.currency}</p><p>Référence : <code>${d.reference}</code></p>${d.access_link ? cta(String(d.access_link), 'Accéder à mon achat →') : ''}<p style="color:#999">Votre ressource est disponible dans votre bibliothèque « Mes achats ».</p>`, lang) }
        : { subject: `Purchase confirmed – ${d.product_name}`, html: wrap(`<h1 style="color:${blue}">✅ Purchase Confirmed</h1><p>You purchased <strong>${d.product_name}</strong> from <strong>${d.org_name}</strong>.</p><p>Amount: ${d.amount} ${d.currency}</p><p>Reference: <code>${d.reference}</code></p>${d.access_link ? cta(String(d.access_link), 'Access my purchase →') : ''}<p style="color:#999">Your resource is available in your "My Purchases" library.</p>`, lang) };

    case 'new_purchase_received':
      return isFr
        ? { subject: `🛒 Nouvelle vente – ${d.product_name}`, html: wrap(`<h1 style="color:${green}">🛒 Nouvelle Vente</h1><p><strong>${d.buyer_name || 'Un client'}</strong> a acheté <strong>${d.product_name}</strong> pour <strong>${d.amount} ${d.currency}</strong>.</p><p>Référence : <code>${d.reference}</code></p>`, lang) }
        : { subject: `🛒 New sale – ${d.product_name}`, html: wrap(`<h1 style="color:${green}">🛒 New Sale</h1><p><strong>${d.buyer_name || 'A customer'}</strong> purchased <strong>${d.product_name}</strong> for <strong>${d.amount} ${d.currency}</strong>.</p><p>Reference: <code>${d.reference}</code></p>`, lang) };

    case 'download_ready':
      return isFr
        ? { subject: `📥 Votre téléchargement est prêt – ${d.product_name}`, html: wrap(`<h1 style="color:${blue}">📥 Téléchargement Prêt</h1><p>Votre achat de <strong>${d.product_name}</strong> est prêt à être téléchargé.</p>${cta(String(d.download_link), 'Télécharger maintenant →')}<p style="font-size:12px;color:#999">Ce lien expire dans 24 heures.</p>`, lang) }
        : { subject: `📥 Your download is ready – ${d.product_name}`, html: wrap(`<h1 style="color:${blue}">📥 Download Ready</h1><p>Your purchase of <strong>${d.product_name}</strong> is ready to download.</p>${cta(String(d.download_link), 'Download now →')}<p style="font-size:12px;color:#999">This link expires in 24 hours.</p>`, lang) };

    case 'first_sale_milestone':
      return isFr
        ? { subject: `🎉 Première vente ! – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🎉 Première Vente !</h1><p>Félicitations ! <strong>${d.org_name}</strong> a réalisé sa première vente : <strong>${d.product_name}</strong> pour <strong>${d.amount} ${d.currency}</strong>.</p><p>Continuez comme ça ! 🚀</p>`, lang) }
        : { subject: `🎉 First sale! – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🎉 First Sale!</h1><p>Congratulations! <strong>${d.org_name}</strong> made its first sale: <strong>${d.product_name}</strong> for <strong>${d.amount} ${d.currency}</strong>.</p><p>Keep it up! 🚀</p>`, lang) };

    // ═══ KYC ═══
    case 'kyc_submitted':
      return isFr
        ? { subject: `Vérification soumise – ${d.org_name}`, html: wrap(`<h1 style="color:${info}">📄 Vérification Soumise</h1><p>Vos documents de vérification d'identité pour <strong>${d.org_name}</strong> ont été soumis avec succès.</p><p>Nous les examinerons sous 2 à 3 jours ouvrés.</p>`, lang) }
        : { subject: `Verification submitted – ${d.org_name}`, html: wrap(`<h1 style="color:${info}">📄 Verification Submitted</h1><p>Your identity verification documents for <strong>${d.org_name}</strong> have been submitted successfully.</p><p>We'll review them within 2-3 business days.</p>`, lang) };

    case 'kyc_approved':
      return isFr
        ? { subject: `Identité vérifiée – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">✅ Identité Vérifiée</h1><p>Votre vérification d'identité pour <strong>${d.org_name}</strong> a été approuvée.</p><p>Vous pouvez maintenant activer les fonctions de monétisation.</p>`, lang) }
        : { subject: `Identity verified – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">✅ Identity Verified</h1><p>Your identity verification for <strong>${d.org_name}</strong> has been approved.</p><p>You can now activate monetization features.</p>`, lang) };

    case 'kyc_rejected':
      return isFr
        ? { subject: `Vérification – Action requise – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">❌ Vérification Non Approuvée</h1><p>Votre vérification d'identité pour <strong>${d.org_name}</strong> n'a pas été approuvée.</p><p>Raison : ${d.reason || 'Veuillez contacter le support.'}</p>`, lang) }
        : { subject: `Verification – Action required – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">❌ Verification Not Approved</h1><p>Your identity verification for <strong>${d.org_name}</strong> was not approved.</p><p>Reason: ${d.reason || 'Please contact support.'}</p>`, lang) };

    // ═══ ORG LIFECYCLE ═══
    case 'org_created':
      return isFr
        ? { subject: `🏢 Organisation créée – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🏢 Organisation Créée</h1><p>Votre organisation <strong>${d.org_name}</strong> a été créée avec succès.</p><p>Prochaines étapes : complétez votre profil, invitez des membres et commencez à publier du contenu.</p>`, lang) }
        : { subject: `🏢 Organization created – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🏢 Organization Created</h1><p>Your organization <strong>${d.org_name}</strong> has been created successfully.</p><p>Next steps: complete your profile, invite members, and start publishing content.</p>`, lang) };

    case 'org_deleted':
      return isFr
        ? { subject: `Organisation supprimée – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">🗑 Organisation Supprimée</h1><p>L'organisation <strong>${d.org_name}</strong> a été définitivement supprimée.</p>${d.reason ? `<p>Raison : ${d.reason}</p>` : ''}`, lang) }
        : { subject: `Organization deleted – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">🗑 Organization Deleted</h1><p>The organization <strong>${d.org_name}</strong> has been permanently deleted.</p>${d.reason ? `<p>Reason: ${d.reason}</p>` : ''}`, lang) };

    case 'org_suspended':
      return isFr
        ? { subject: `⚠️ Organisation suspendue – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">⚠️ Organisation Suspendue</h1><p>Votre organisation <strong>${d.org_name}</strong> a été suspendue.</p><p>Raison : ${d.reason || 'Violation des conditions d\'utilisation.'}</p>${d.until ? `<p>Suspendue jusqu'au : ${d.until}</p>` : ''}<p>Contactez <a href="mailto:support@siteviral.com" style="color:${blue}">support@siteviral.com</a>.</p>`, lang) }
        : { subject: `⚠️ Organization suspended – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">⚠️ Organization Suspended</h1><p>Your organization <strong>${d.org_name}</strong> has been suspended.</p><p>Reason: ${d.reason || 'Terms of service violation.'}</p>${d.until ? `<p>Suspended until: ${d.until}</p>` : ''}<p>Contact <a href="mailto:support@siteviral.com" style="color:${blue}">support@siteviral.com</a>.</p>`, lang) };

    case 'org_unsuspended':
      return isFr
        ? { subject: `✅ Suspension levée – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">✅ Suspension Levée</h1><p>Votre organisation <strong>${d.org_name}</strong> est de nouveau active.</p>`, lang) }
        : { subject: `✅ Suspension lifted – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">✅ Suspension Lifted</h1><p>Your organization <strong>${d.org_name}</strong> is active again.</p>`, lang) };

    case 'org_inactive_30d':
      return isFr
        ? { subject: `📊 Votre organisation a besoin d'attention – ${d.org_name}`, html: wrap(`<h1 style="color:${orange}">📊 Organisation Inactive</h1><p>Bonjour,</p><p>Votre organisation <strong>${d.org_name}</strong> n'a eu aucune activité depuis 30 jours.</p><p>Publiez du contenu, créez des événements ou lancez une campagne pour réengager vos membres !</p>${cta('https://siteviral.com/admin', 'Accéder au tableau de bord')}`, lang) }
        : { subject: `📊 Your organization needs attention – ${d.org_name}`, html: wrap(`<h1 style="color:${orange}">📊 Inactive Organization</h1><p>Hello,</p><p>Your organization <strong>${d.org_name}</strong> has had no activity for 30 days.</p><p>Publish content, create events, or launch a campaign to re-engage your members!</p>${cta('https://siteviral.com/admin', 'Go to dashboard')}`, lang) };

    case 'member_milestone':
      return isFr
        ? { subject: `🎉 ${d.count} membres ! – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🎉 Cap franchi !</h1><p><strong>${d.org_name}</strong> compte désormais <strong>${d.count} membres</strong> !</p><p>Continuez à grandir ! 🚀</p>`, lang) }
        : { subject: `🎉 ${d.count} members! – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🎉 Milestone reached!</h1><p><strong>${d.org_name}</strong> now has <strong>${d.count} members</strong>!</p><p>Keep growing! 🚀</p>`, lang) };

    // ═══ ORG CREATOR ONBOARDING ═══
    case 'org_welcome_j0':
      return isFr
        ? { subject: `🚀 Votre plateforme est prête – ${d.name}`, html: wrap(`<h1 style="color:${blue}">🚀 Bienvenue, créateur !</h1><p>Votre plateforme <strong>${d.name}</strong> vient d'être créée sur Siteviral.</p><p>Voici vos 3 premières étapes :</p><ol style="color:#ccc"><li><strong>Ajoutez votre logo</strong> – les visuels inspirent confiance</li><li><strong>Cliquez sur « Démarrage Express »</strong> pour créer un produit + campagne en 1 clic</li><li><strong>Partagez votre lien</strong> : <code>siteviral.com/org/${d.slug}</code></li></ol>${cta('https://siteviral.com/admin', 'Accéder à mon tableau de bord')}<p style="font-size:12px;color:#999">Vous pouvez publier et recevoir des paiements immédiatement. La vérification d'identité n'est requise que pour les retraits.</p>`, lang) }
        : { subject: `🚀 Your platform is ready – ${d.name}`, html: wrap(`<h1 style="color:${blue}">🚀 Welcome, creator!</h1><p>Your platform <strong>${d.name}</strong> has just been created on Siteviral.</p><p>Here are your first 3 steps:</p><ol style="color:#ccc"><li><strong>Add your logo</strong> – visuals build trust</li><li><strong>Click "Quick Start"</strong> to create a product + campaign in 1 click</li><li><strong>Share your link</strong>: <code>siteviral.com/org/${d.slug}</code></li></ol>${cta('https://siteviral.com/admin', 'Go to my dashboard')}<p style="font-size:12px;color:#999">You can publish and receive payments immediately. Identity verification is only required for withdrawals.</p>`, lang) };

    case 'org_onboarding_j1':
      return isFr
        ? { subject: `📌 Avez-vous publié votre premier contenu ? – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📌 Jour 1 — Premiers pas</h1><p>Bonjour,</p><p>Votre plateforme <strong>${d.org_name}</strong> a été créée hier. Avez-vous ajouté votre premier contenu ?</p><p style="background:#222;padding:12px;border-radius:8px;color:#ffdd57;font-size:13px">💡 ${d.tip}</p><p>Voici ce que vous pouvez faire aujourd'hui :</p><ul style="color:#ccc"><li>Publier un média (vidéo, audio, article)</li><li>Créer un produit ou un ebook</li><li>Lancer votre première campagne de dons</li></ul>${cta('https://siteviral.com/admin', 'Ouvrir mon dashboard')}`, lang) }
        : { subject: `📌 Did you publish your first content? – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📌 Day 1 — First steps</h1><p>Hello,</p><p>Your platform <strong>${d.org_name}</strong> was created yesterday. Have you added your first content?</p><p style="background:#222;padding:12px;border-radius:8px;color:#ffdd57;font-size:13px">💡 ${d.tip}</p><p>Here's what you can do today:</p><ul style="color:#ccc"><li>Publish media (video, audio, article)</li><li>Create a product or ebook</li><li>Launch your first fundraising campaign</li></ul>${cta('https://siteviral.com/admin', 'Open my dashboard')}`, lang) };

    case 'org_onboarding_j3':
      return isFr
        ? { subject: `🤝 Activez vos ambassadeurs – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🤝 Jour 3 — Passez à la vitesse supérieure</h1><p>Bonjour,</p><p>Votre plateforme <strong>${d.org_name}</strong> a 3 jours. C'est le moment d'activer la croissance virale !</p><p style="background:#222;padding:12px;border-radius:8px;color:#ffdd57;font-size:13px">💡 ${d.tip}</p><p><strong>Le Programme Ambassadeur</strong> permet à chaque visiteur de devenir promoteur de vos ressources et de gagner des commissions sur chaque vente.</p><ul style="color:#ccc"><li>Commission par défaut : 10%</li><li>Lien unique pour chaque ambassadeur</li><li>Suivi en temps réel des ventes</li></ul>${cta('https://siteviral.com/admin/settings', 'Activer les Ambassadeurs')}<p style="font-size:12px;color:#999">Programme Ambassadeur actuellement : <strong>${d.affiliation_enabled === 'oui' ? '✅ Activé' : '❌ Désactivé'}</strong></p>`, lang) }
        : { subject: `🤝 Activate your ambassadors – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🤝 Day 3 — Level up</h1><p>Hello,</p><p>Your platform <strong>${d.org_name}</strong> is 3 days old. Time to activate viral growth!</p><p style="background:#222;padding:12px;border-radius:8px;color:#ffdd57;font-size:13px">💡 ${d.tip}</p><p><strong>The Ambassador Program</strong> lets every visitor become a promoter and earn commissions on each sale.</p><ul style="color:#ccc"><li>Default commission: 10%</li><li>Unique link for each ambassador</li><li>Real-time sales tracking</li></ul>${cta('https://siteviral.com/admin/settings', 'Activate Ambassadors')}<p style="font-size:12px;color:#999">Ambassador Program currently: <strong>${d.affiliation_enabled === 'oui' || d.affiliation_enabled === 'yes' ? '✅ Enabled' : '❌ Disabled'}</strong></p>`, lang) };

    // ═══ POST-PURCHASE → AMBASSADOR ═══
    case 'post_purchase_ambassador_j1':
      return isFr
        ? { subject: '💰 Gagne de l\'argent en partageant ce que tu as acheté', html: wrap(`<h1 style="color:${green}">💰 Gagne en partageant</h1><p>Bonjour ${d.name || ''},</p><p>Tu as acheté <strong>« ${d.product_title} »</strong> — excellent choix !</p><p>Savais-tu que tu peux <strong>gagner de l'argent</strong> en le partageant ? Un seul partage WhatsApp peut te rapporter <span style="color:${green};font-size:18px;font-weight:bold">${d.commission} FCFA</span> par vente.</p>${cta('https://siteviral.com/gagner', 'Obtenir mon lien ambassadeur →')}<p style="font-size:12px;color:#999">Partage → Quelqu'un achète → Tu gagnes. C'est aussi simple que ça !</p>`, lang) }
        : { subject: '💰 Earn money by sharing what you bought', html: wrap(`<h1 style="color:${green}">💰 Earn by sharing</h1><p>Hello ${d.name || ''},</p><p>You bought <strong>"${d.product_title}"</strong> — great choice!</p><p>Did you know you can <strong>earn money</strong> by sharing it? A single WhatsApp share can earn you <span style="color:${green};font-size:18px;font-weight:bold">${d.commission} XOF</span> per sale.</p>${cta('https://siteviral.com/gagner', 'Get my ambassador link →')}<p style="font-size:12px;color:#999">Share → Someone buys → You earn. It's that simple!</p>`, lang) };

    case 'post_purchase_ambassador_j5':
      return isFr
        ? { subject: '🔥 Des gens cherchent ce que tu as acheté', html: wrap(`<h1 style="color:${orange}">🔥 Produit tendance</h1><p>Bonjour ${d.name || ''},</p><p><strong>« ${d.product_title} »</strong> se vend bien en ce moment !</p><p>Partage ton lien ambassadeur sur WhatsApp et gagne <span style="color:${green};font-weight:bold">${d.commission} FCFA</span> par vente.</p><p style="background:#222;padding:12px;border-radius:8px;color:#ffdd57;font-size:13px">🤳 Astuce : envoie le lien dans 3 groupes WhatsApp — les ambassadeurs actifs gagnent en moyenne 25 000 FCFA par semaine.</p>${cta('https://siteviral.com/gagner', 'Mon lien ambassadeur →')}`, lang) }
        : { subject: '🔥 People are looking for what you bought', html: wrap(`<h1 style="color:${orange}">🔥 Trending product</h1><p>Hello ${d.name || ''},</p><p><strong>"${d.product_title}"</strong> is selling well right now!</p><p>Share your ambassador link on WhatsApp and earn <span style="color:${green};font-weight:bold">${d.commission} XOF</span> per sale.</p><p style="background:#222;padding:12px;border-radius:8px;color:#ffdd57;font-size:13px">🤳 Tip: send your link to 3 WhatsApp groups — active ambassadors earn an average of $50/week.</p>${cta('https://siteviral.com/gagner', 'My ambassador link →')}`, lang) };

    case 'post_purchase_ambassador_j10':
      return isFr
        ? { subject: '⏳ Tu n\'as pas encore partagé ?', html: wrap(`<h1 style="color:${orange}">⏳ Dernière chance</h1><p>Bonjour ${d.name || ''},</p><p>Tu as acheté <strong>« ${d.product_title} »</strong> il y a 10 jours, mais tu n'as pas encore partagé.</p><p>Pourtant, un seul partage peut te rapporter <span style="color:${green};font-weight:bold">${d.commission} FCFA</span> par vente.</p><p style="font-size:16px;font-weight:bold;color:#fff;text-align:center">Si 10 personnes achètent = <span style="color:${green}">${(d.commission as number) * 10} FCFA</span> pour toi !</p><p>💡 Tu n'as rien à investir, rien à créer. Tu partages, tu gagnes.</p>${cta('https://siteviral.com/gagner', 'Partager maintenant →')}`, lang) }
        : { subject: '⏳ You haven\'t shared yet?', html: wrap(`<h1 style="color:${orange}">⏳ Last chance</h1><p>Hello ${d.name || ''},</p><p>You bought <strong>"${d.product_title}"</strong> 10 days ago, but haven't shared it yet.</p><p>Just one share can earn you <span style="color:${green};font-weight:bold">${d.commission} XOF</span> per sale.</p><p style="font-size:16px;font-weight:bold;color:#fff;text-align:center">If 10 friends buy = <span style="color:${green}">${(d.commission as number) * 10} XOF</span> for you!</p><p>💡 No investment, no creation needed. Share and earn.</p>${cta('https://siteviral.com/gagner', 'Share now →')}`, lang) };

    // ═══ BUYER → CREATOR ═══
    case 'buyer_to_creator':
      return isFr
        ? { subject: '✨ Tu as acheté ${d.purchase_count} produits — crée le tien !', html: wrap(`<h1 style="color:${blue}">✨ Et si tu créais le tien ?</h1><p>Bonjour ${d.name || ''},</p><p>Tu as déjà acheté <strong>${d.purchase_count} produits</strong> sur SiteViral — tu connais bien ce qui se vend !</p><p style="font-size:15px;font-weight:bold;color:#fff">🤖 Crée ton propre livre en 5 minutes avec l'IA :</p><ul style="color:#ccc"><li>Choisis un sujet → L'IA écrit pour toi</li><li>Couverture générée automatiquement</li><li>Vends immédiatement sur SiteViral</li></ul><p style="background:#222;padding:12px;border-radius:8px;color:#ffdd57;font-size:13px">💡 Les créateurs sur SiteViral gagnent en moyenne 150 000 FCFA/mois. Tu n'as aucune excuse !</p>${cta('https://siteviral.com/ecrire', 'Créer mon livre avec l\'IA →')}`, lang) }
        : { subject: '✨ You bought ${d.purchase_count} products — create yours!', html: wrap(`<h1 style="color:${blue}">✨ Why not create your own?</h1><p>Hello ${d.name || ''},</p><p>You've already bought <strong>${d.purchase_count} products</strong> on SiteViral — you know what sells!</p><p style="font-size:15px;font-weight:bold;color:#fff">🤖 Create your own book in 5 minutes with AI:</p><ul style="color:#ccc"><li>Pick a topic → AI writes for you</li><li>Cover generated automatically</li><li>Sell immediately on SiteViral</li></ul><p style="background:#222;padding:12px;border-radius:8px;color:#ffdd57;font-size:13px">💡 Creators on SiteViral earn an average of $250/month. You have no excuse!</p>${cta('https://siteviral.com/ecrire', 'Create my book with AI →')}`, lang) };

    case 'visitor_to_creator':
      return isFr
        ? { subject: '💡 Tu reviens souvent — crée ton contenu !', html: wrap(`<h1 style="color:${blue}">💡 Tu as sûrement une expertise</h1><p>Bonjour ${d.name || ''},</p><p>Tu as visité SiteViral <strong>${d.visits} fois</strong> ces derniers jours. Tu aimes le contenu de qualité !</p><p style="font-size:15px;font-weight:bold;color:#fff">Et si tu créais le tien ?</p><p>Avec le <strong>Viral AI Studio</strong>, tu peux :</p><ul style="color:#ccc"><li>📚 Écrire un ebook complet en 5 minutes</li><li>🎓 Créer une formation avec quiz</li><li>📖 Créer un livre pour enfants illustré</li></ul><p>Zéro rédaction. L'IA écrit, illustre et met en page pour toi.</p>${cta('https://siteviral.com/ecrire', 'Essayer le Studio IA →')}`, lang) }
        : { subject: '💡 You visit often — create your content!', html: wrap(`<h1 style="color:${blue}">💡 You have expertise to share</h1><p>Hello ${d.name || ''},</p><p>You've visited SiteViral <strong>${d.visits} times</strong> recently. You love quality content!</p><p style="font-size:15px;font-weight:bold;color:#fff">Why not create your own?</p><p>With the <strong>Viral AI Studio</strong>, you can:</p><ul style="color:#ccc"><li>📚 Write a complete ebook in 5 minutes</li><li>🎓 Create a course with quizzes</li><li>📖 Create an illustrated children's book</li></ul><p>Zero writing. AI writes, illustrates and formats for you.</p>${cta('https://siteviral.com/ecrire', 'Try the AI Studio →')}`, lang) };

    case 'first_commission_earned':
      return isFr
        ? { subject: '🎉 Tu viens de gagner ta première commission !', html: wrap(`<h1 style="color:${green}">🎉 Première commission !</h1><p>Bonjour ${d.name || ''},</p><p>Félicitations ! Tu viens de gagner ta <strong>première commission d'ambassadeur</strong> :</p><p style="text-align:center;font-size:28px;font-weight:bold;color:${green};padding:20px 0">${d.amount} ${d.currency || 'XOF'}</p><p>via <strong>${d.org_name}</strong></p><p>🔥 Continue de partager pour gagner encore plus ! Les meilleurs ambassadeurs gagnent des centaines de milliers de FCFA par mois.</p>${cta('https://siteviral.com/gagner', 'Voir mes gains →')}`, lang) }
        : { subject: '🎉 You just earned your first commission!', html: wrap(`<h1 style="color:${green}">🎉 First commission!</h1><p>Hello ${d.name || ''},</p><p>Congratulations! You just earned your <strong>first ambassador commission</strong>:</p><p style="text-align:center;font-size:28px;font-weight:bold;color:${green};padding:20px 0">${d.amount} ${d.currency || 'XOF'}</p><p>via <strong>${d.org_name}</strong></p><p>🔥 Keep sharing to earn even more!</p>${cta('https://siteviral.com/gagner', 'View my earnings →')}`, lang) };

    case 'trending_product_nudge':
      return isFr
        ? { subject: '📈 Un produit tendance à partager !', html: wrap(`<h1 style="color:${orange}">📈 Produit tendance</h1><p>Bonjour ${d.name || ''},</p><p><strong>« ${d.product_title} »</strong> se vend très bien cette semaine !</p><p>Partage-le et gagne des commissions sur chaque vente.</p>${cta('https://siteviral.com/gagner', 'Partager et gagner →')}`, lang) }
        : { subject: '📈 A trending product to share!', html: wrap(`<h1 style="color:${orange}">📈 Trending product</h1><p>Hello ${d.name || ''},</p><p><strong>"${d.product_title}"</strong> is selling well this week!</p><p>Share it and earn commissions on each sale.</p>${cta('https://siteviral.com/gagner', 'Share and earn →')}`, lang) };

    // ═══ MEMBERS ═══
    case 'new_member_joined':
      return isFr
        ? { subject: `👤 Nouveau membre – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">👤 Nouveau Membre</h1><p><strong>${d.member_name || 'Quelqu\'un'}</strong> vient de rejoindre <strong>${d.org_name}</strong>.</p><p>Total membres : ${d.total_members || 'N/A'}</p>`, lang) }
        : { subject: `👤 New member – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">👤 New Member</h1><p><strong>${d.member_name || 'Someone'}</strong> just joined <strong>${d.org_name}</strong>.</p><p>Total members: ${d.total_members || 'N/A'}</p>`, lang) };

    case 'member_left':
      return isFr
        ? { subject: `Membre parti – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">👋 Départ d'un Membre</h1><p><strong>${d.member_name || 'Un membre'}</strong> a quitté <strong>${d.org_name}</strong>.</p>`, lang) }
        : { subject: `Member left – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">👋 Member Left</h1><p><strong>${d.member_name || 'A member'}</strong> left <strong>${d.org_name}</strong>.</p>`, lang) };

    case 'invite_to_org':
      return isFr
        ? { subject: `Invitation à rejoindre ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📩 Vous êtes invité</h1><p><strong>${d.inviter_name || 'Quelqu\'un'}</strong> vous invite à rejoindre <strong>${d.org_name}</strong> sur Siteviral.</p>${cta(String(d.invite_link || 'https://siteviral.com'), 'Accepter l\'invitation →')}`, lang) }
        : { subject: `Invitation to join ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📩 You're Invited</h1><p><strong>${d.inviter_name || 'Someone'}</strong> invites you to join <strong>${d.org_name}</strong> on Siteviral.</p>${cta(String(d.invite_link || 'https://siteviral.com'), 'Accept invitation →')}`, lang) };

    case 'role_changed':
      return isFr
        ? { subject: `Rôle mis à jour – ${d.org_name}`, html: wrap(`<h1 style="color:${info}">🔄 Rôle Mis à Jour</h1><p>Votre rôle dans <strong>${d.org_name}</strong> a été changé en <strong>${d.new_role}</strong>.</p>${d.old_role ? `<p>Ancien rôle : ${d.old_role}</p>` : ''}`, lang) }
        : { subject: `Role updated – ${d.org_name}`, html: wrap(`<h1 style="color:${info}">🔄 Role Updated</h1><p>Your role in <strong>${d.org_name}</strong> has been changed to <strong>${d.new_role}</strong>.</p>${d.old_role ? `<p>Previous role: ${d.old_role}</p>` : ''}`, lang) };

    case 'invite_accepted':
      return isFr
        ? { subject: `✅ Invitation acceptée – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">✅ Invitation Acceptée</h1><p><strong>${d.member_name}</strong> a accepté votre invitation à rejoindre <strong>${d.org_name}</strong>.</p>`, lang) }
        : { subject: `✅ Invitation accepted – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">✅ Invitation Accepted</h1><p><strong>${d.member_name}</strong> accepted your invitation to join <strong>${d.org_name}</strong>.</p>`, lang) };

    // ═══ PAYOUTS ═══
    case 'payout_requested':
      return isFr
        ? { subject: `💸 Retrait demandé – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${blue}">💸 Retrait Demandé</h1><p>Un retrait de <strong>${d.amount} ${d.currency}</strong> a été demandé pour <strong>${d.org_name}</strong>.</p><p>Délai de traitement : 3 à 5 jours ouvrés.</p>`, lang) }
        : { subject: `💸 Withdrawal requested – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${blue}">💸 Withdrawal Requested</h1><p>A withdrawal of <strong>${d.amount} ${d.currency}</strong> has been requested for <strong>${d.org_name}</strong>.</p><p>Processing time: 3-5 business days.</p>`, lang) };

    case 'payout_approved':
      return isFr
        ? { subject: `✅ Retrait approuvé – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">✅ Retrait Approuvé</h1><p>Votre retrait de <strong>${d.amount} ${d.currency}</strong> pour <strong>${d.org_name}</strong> a été approuvé et est en cours de traitement.</p>`, lang) }
        : { subject: `✅ Withdrawal approved – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">✅ Withdrawal Approved</h1><p>Your withdrawal of <strong>${d.amount} ${d.currency}</strong> for <strong>${d.org_name}</strong> has been approved and is being processed.</p>`, lang) };

    case 'payout_processing':
      return isFr
        ? { subject: `⏳ Retrait en cours de traitement – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${blue}">⏳ Retrait En Cours</h1><p>Bonne nouvelle ! Votre demande de retrait de <strong>${d.amount} ${d.currency}</strong> pour <strong>${d.org_name}</strong> a été approuvée et est <strong>en cours de traitement</strong>.</p><p>Le transfert sera effectué dans les prochaines heures. Vous recevrez un email de confirmation une fois le paiement envoyé.</p>`, lang) }
        : { subject: `⏳ Withdrawal being processed – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${blue}">⏳ Withdrawal In Progress</h1><p>Good news! Your withdrawal request of <strong>${d.amount} ${d.currency}</strong> for <strong>${d.org_name}</strong> has been approved and is <strong>being processed</strong>.</p><p>The transfer will be completed within the next few hours. You will receive a confirmation email once the payment is sent.</p>`, lang) };

    case 'payout_completed':
      return isFr
        ? { subject: `✅ Retrait effectué – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">✅ Paiement Envoyé</h1><p>Votre retrait de <strong>${d.amount} ${d.currency}</strong> pour <strong>${d.org_name}</strong> a été <strong>effectué avec succès</strong>.</p><p>Le montant a été envoyé sur votre compte. Veuillez vérifier la réception dans les prochaines minutes.</p><p>Merci pour votre confiance !</p>`, lang) }
        : { subject: `✅ Withdrawal completed – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">✅ Payment Sent</h1><p>Your withdrawal of <strong>${d.amount} ${d.currency}</strong> for <strong>${d.org_name}</strong> has been <strong>successfully completed</strong>.</p><p>The amount has been sent to your account. Please check for receipt within the next few minutes.</p><p>Thank you for your trust!</p>`, lang) };

    case 'payout_rejected':
      return isFr
        ? { subject: `Retrait refusé – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">❌ Retrait Refusé</h1><p>Votre demande de retrait pour <strong>${d.org_name}</strong> a été refusée.</p><p>Raison : ${d.reason || 'Veuillez contacter le support.'}</p>`, lang) }
        : { subject: `Withdrawal rejected – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">❌ Withdrawal Rejected</h1><p>Your withdrawal request for <strong>${d.org_name}</strong> has been rejected.</p><p>Reason: ${d.reason || 'Please contact support.'}</p>`, lang) };

    case 'payouts_frozen':
      return isFr
        ? { subject: `⚠️ Retraits gelés – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">🧊 Retraits Gelés</h1><p>Les retraits pour <strong>${d.org_name}</strong> ont été temporairement gelés.</p><p>Raison : ${d.reason || 'En cours de vérification.'}</p>${d.until ? `<p>Gelés jusqu'au : ${d.until}</p>` : ''}<p>Contactez <a href="mailto:support@siteviral.com" style="color:${blue}">support@siteviral.com</a>.</p>`, lang) }
        : { subject: `⚠️ Withdrawals frozen – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">🧊 Withdrawals Frozen</h1><p>Withdrawals for <strong>${d.org_name}</strong> have been temporarily frozen.</p><p>Reason: ${d.reason || 'Under review.'}</p>${d.until ? `<p>Frozen until: ${d.until}</p>` : ''}<p>Contact <a href="mailto:support@siteviral.com" style="color:${blue}">support@siteviral.com</a>.</p>`, lang) };

    // ═══ AFFILIATES ═══
    case 'affiliate_sale':
      return isFr
        ? { subject: `🎉 Commission gagnée – ${d.commission} ${d.currency}`, html: wrap(`<h1 style="color:${green}">🎉 Commission Gagnée</h1><p>Vous avez gagné <strong>${d.commission} ${d.currency}</strong> grâce à une ${d.transaction_type || 'vente'} sur <strong>${d.org_name}</strong>.</p><p>Brut : ${d.gross_amount} ${d.currency} · Taux : ${d.commission_percent}%</p><p>Payable après un délai de sécurité de 15 jours.</p>`, lang) }
        : { subject: `🎉 Commission earned – ${d.commission} ${d.currency}`, html: wrap(`<h1 style="color:${green}">🎉 Commission Earned</h1><p>You earned <strong>${d.commission} ${d.currency}</strong> from a ${d.transaction_type || 'sale'} on <strong>${d.org_name}</strong>.</p><p>Gross: ${d.gross_amount} ${d.currency} · Rate: ${d.commission_percent}%</p><p>Payable after a 15-day security delay.</p>`, lang) };

    case 'affiliate_payout_requested':
      return isFr
        ? { subject: `💸 Retrait ambassadeur demandé`, html: wrap(`<h1 style="color:${blue}">💸 Retrait Demandé</h1><p>Votre demande de retrait de <strong>${d.amount} ${d.currency}</strong> depuis <strong>${d.org_name}</strong> a été soumise.</p><p>Délai de traitement : 3 à 8 jours ouvrés.</p>`, lang) }
        : { subject: `💸 Ambassador withdrawal requested`, html: wrap(`<h1 style="color:${blue}">💸 Withdrawal Requested</h1><p>Your withdrawal request of <strong>${d.amount} ${d.currency}</strong> from <strong>${d.org_name}</strong> has been submitted.</p><p>Processing time: 3-8 business days.</p>`, lang) };

    case 'affiliate_payout_completed':
      return isFr
        ? { subject: `✅ Retrait ambassadeur envoyé – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">✅ Paiement Envoyé</h1><p>Votre retrait de <strong>${d.amount} ${d.currency}</strong> depuis <strong>${d.org_name}</strong> a été envoyé sur votre compte.</p>`, lang) }
        : { subject: `✅ Ambassador withdrawal sent – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">✅ Payment Sent</h1><p>Your withdrawal of <strong>${d.amount} ${d.currency}</strong> from <strong>${d.org_name}</strong> has been sent to your account.</p>`, lang) };

    case 'affiliate_welcome':
      return isFr
        ? { subject: `🤝 Bienvenue, Ambassadeur ! – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🤝 Lien Ambassadeur Créé</h1><p>Vous avez créé votre premier lien ambassadeur pour <strong>${d.org_name}</strong>.</p><p>Partagez votre lien et gagnez <strong>${d.commission_percent}%</strong> sur chaque vente !</p><p>Votre code : <code>${d.code}</code></p>${cta('https://siteviral.com/affiliation', 'Mon Espace Ambassadeur')}`, lang) }
        : { subject: `🤝 Welcome, Ambassador! – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🤝 Ambassador Link Created</h1><p>You created your first ambassador link for <strong>${d.org_name}</strong>.</p><p>Share your link and earn <strong>${d.commission_percent}%</strong> on every sale!</p><p>Your code: <code>${d.code}</code></p>${cta('https://siteviral.com/affiliation', 'My Ambassador Space')}`, lang) };

    case 'affiliate_first_click':
      return isFr
        ? { subject: `👆 Premier clic sur votre lien ambassadeur !`, html: wrap(`<h1 style="color:${blue}">👆 Premier Clic !</h1><p>Quelqu'un a cliqué sur votre lien ambassadeur pour <strong>${d.org_name}</strong>.</p><p>Continuez à partager pour obtenir des conversions ! 🚀</p>`, lang) }
        : { subject: `👆 First click on your ambassador link!`, html: wrap(`<h1 style="color:${blue}">👆 First Click!</h1><p>Someone clicked your ambassador link for <strong>${d.org_name}</strong>.</p><p>Keep sharing to get conversions! 🚀</p>`, lang) };

    case 'affiliate_first_conversion':
      return isFr
        ? { subject: `🎯 Première conversion ! – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🎯 Première Conversion !</h1><p>Votre premier filleul a effectué un achat sur <strong>${d.org_name}</strong> !</p><p>Commission : <strong>${d.commission} ${d.currency}</strong></p>`, lang) }
        : { subject: `🎯 First conversion! – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🎯 First Conversion!</h1><p>Your first referral made a purchase on <strong>${d.org_name}</strong>!</p><p>Commission: <strong>${d.commission} ${d.currency}</strong></p>`, lang) };

    case 'affiliate_commission_payable':
      return isFr
        ? { subject: `💰 Commission disponible – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">💰 Commission Disponible</h1><p>Votre commission de <strong>${d.amount} ${d.currency}</strong> depuis <strong>${d.org_name}</strong> a passé le délai de sécurité de 15 jours et est maintenant disponible pour retrait.</p>${cta('https://siteviral.com/affiliation', 'Demander un retrait')}`, lang) }
        : { subject: `💰 Commission available – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">💰 Commission Available</h1><p>Your commission of <strong>${d.amount} ${d.currency}</strong> from <strong>${d.org_name}</strong> has passed the 15-day security delay and is now available for withdrawal.</p>${cta('https://siteviral.com/affiliation', 'Request withdrawal')}`, lang) };

    case 'affiliate_monthly_recap':
      return isFr
        ? { subject: `📊 Récap mensuel ambassadeur`, html: wrap(`<h1 style="color:${blue}">📊 Récap Mensuel Ambassadeur</h1><p>Voici votre résumé pour <strong>${d.month}</strong> :</p><ul style="color:#ccc"><li>Clics : ${d.clicks || 0}</li><li>Conversions : ${d.conversions || 0}</li><li>Gains : ${d.earnings || 0} ${d.currency || 'XOF'}</li></ul>`, lang) }
        : { subject: `📊 Monthly ambassador recap`, html: wrap(`<h1 style="color:${blue}">📊 Monthly Ambassador Recap</h1><p>Here's your summary for <strong>${d.month}</strong>:</p><ul style="color:#ccc"><li>Clicks: ${d.clicks || 0}</li><li>Conversions: ${d.conversions || 0}</li><li>Earnings: ${d.earnings || 0} ${d.currency || 'XOF'}</li></ul>`, lang) };

    case 'affiliate_new_product':
      return isFr
        ? { subject: `🚀 Nouveau produit à promouvoir – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🚀 Nouveau Produit Disponible !</h1><p><strong>${d.org_name}</strong> vient d'ajouter un nouveau produit :</p><p style="font-size:18px;font-weight:bold;color:#fff">"${d.content_title}"</p>${d.price ? `<p>Prix : <strong>${d.price} ${d.currency || 'XOF'}</strong></p>` : ''}<p>Partagez-le avec votre audience pour gagner des commissions sur chaque vente !</p>${cta(d.org_link || 'https://siteviral.com', 'Voir le produit')}`, lang) }
        : { subject: `🚀 New product to promote – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🚀 New Product Available!</h1><p><strong>${d.org_name}</strong> just added a new product:</p><p style="font-size:18px;font-weight:bold;color:#fff">"${d.content_title}"</p>${d.price ? `<p>Price: <strong>${d.price} ${d.currency || 'XOF'}</strong></p>` : ''}<p>Share it with your audience to earn commissions on every sale!</p>${cta(d.org_link || 'https://siteviral.com', 'View product')}`, lang) };

    case 'affiliate_new_campaign':
      return isFr
        ? { subject: `🎯 Nouvelle campagne – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🎯 Nouvelle Campagne</h1><p><strong>${d.org_name}</strong> a lancé une nouvelle campagne. Partagez-la !</p>${cta(d.org_link || 'https://siteviral.com', 'Voir la campagne')}`, lang) }
        : { subject: `🎯 New campaign – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🎯 New Campaign</h1><p><strong>${d.org_name}</strong> launched a new campaign. Share it!</p>${cta(d.org_link || 'https://siteviral.com', 'View campaign')}`, lang) };

    case 'affiliate_new_program':
      return isFr
        ? { subject: `🎓 Nouvelle formation à promouvoir – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🎓 Nouvelle Formation Disponible</h1><p><strong>${d.org_name}</strong> propose une nouvelle formation :</p><p style="font-size:18px;font-weight:bold;color:#fff">"${d.content_title}"</p><p>Partagez-la pour gagner des commissions sur chaque inscription !</p>${cta(d.org_link || 'https://siteviral.com', 'Voir la formation')}`, lang) }
        : { subject: `🎓 New program to promote – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🎓 New Program Available</h1><p><strong>${d.org_name}</strong> offers a new program:</p><p style="font-size:18px;font-weight:bold;color:#fff">"${d.content_title}"</p><p>Share it to earn commissions on every enrollment!</p>${cta(d.org_link || 'https://siteviral.com', 'View program')}`, lang) };

    case 'affiliate_price_changed':
      return isFr
        ? { subject: `💲 Changement de prix – "${d.content_title}"`, html: wrap(`<h1 style="color:${orange}">💲 Prix Modifié</h1><p>Le prix de <strong>"${d.content_title}"</strong> chez <strong>${d.org_name}</strong> a changé :</p><p style="font-size:16px">Ancien prix : <span style="text-decoration:line-through">${d.old_price} ${d.currency}</span></p><p style="font-size:18px;color:${green}">Nouveau prix : <strong>${d.new_price} ${d.currency}</strong></p>`, lang) }
        : { subject: `💲 Price change – "${d.content_title}"`, html: wrap(`<h1 style="color:${orange}">💲 Price Changed</h1><p>The price of <strong>"${d.content_title}"</strong> at <strong>${d.org_name}</strong> has changed:</p><p style="font-size:16px">Old price: <span style="text-decoration:line-through">${d.old_price} ${d.currency}</span></p><p style="font-size:18px;color:${green}">New price: <strong>${d.new_price} ${d.currency}</strong></p>`, lang) };

    case 'affiliate_content_unpublished':
      return isFr
        ? { subject: `⚠️ Contenu retiré – "${d.content_title}"`, html: wrap(`<h1 style="color:${orange}">⚠️ Contenu Dépublié</h1><p>Le ${d.content_type} <strong>"${d.content_title}"</strong> de <strong>${d.org_name}</strong> a été retiré de la vente.</p><p>Veuillez retirer ce contenu de vos promotions et liens de partage.</p>`, lang) }
        : { subject: `⚠️ Content removed – "${d.content_title}"`, html: wrap(`<h1 style="color:${orange}">⚠️ Content Unpublished</h1><p>The ${d.content_type} <strong>"${d.content_title}"</strong> from <strong>${d.org_name}</strong> has been removed from sale.</p><p>Please remove this content from your promotions and share links.</p>`, lang) };

    // ═══ PARTNERS ═══
    case 'partner_welcome': {
      const inviteLink = `https://siteviral.com/create-org?partner=${encodeURIComponent(d.invite_code || '')}`;
      return isFr
        ? { subject: `🤝 Bienvenue, Partenaire ! – Siteviral`, html: wrap(`<h1 style="color:${green}">🤝 Bienvenue au Programme Partenaires !</h1><p>Bonjour <strong>${d.name}</strong>,</p><p>Votre candidature a été <strong>approuvée</strong> ! 🎉</p><p>Votre <strong>lien d'invitation</strong> :</p><a href="${inviteLink}" style="display:block;background:#222;padding:16px;border-radius:8px;text-align:center;font-size:14px;margin:16px 0;color:${blue};word-break:break-all;text-decoration:none">${inviteLink}</a><p>Partagez ce lien avec les responsables d'organisations pour gagner des commissions récurrentes.</p>${cta('https://siteviral.com/partner', 'Accéder à mon Espace Partenaire')}`, lang) }
        : { subject: `🤝 Welcome, Partner! – Siteviral`, html: wrap(`<h1 style="color:${green}">🤝 Welcome to the Partner Program!</h1><p>Hello <strong>${d.name}</strong>,</p><p>Your application has been <strong>approved</strong>! 🎉</p><p>Your <strong>invite link</strong>:</p><a href="${inviteLink}" style="display:block;background:#222;padding:16px;border-radius:8px;text-align:center;font-size:14px;margin:16px 0;color:${blue};word-break:break-all;text-decoration:none">${inviteLink}</a><p>Share this link with organization leaders to earn recurring commissions.</p>${cta('https://siteviral.com/partner', 'Go to my Partner Space')}`, lang) };
    }

    case 'partner_rejected':
      return isFr
        ? { subject: `Candidature Partenaire – Mise à jour`, html: wrap(`<h1 style="color:${red}">Candidature non retenue</h1><p>Bonjour <strong>${d.name}</strong>,</p><p>Après examen, votre candidature au Programme Partenaires n'a pas été retenue.</p>${d.reason ? `<p>Raison : ${d.reason}</p>` : ''}`, lang) }
        : { subject: `Partner Application – Update`, html: wrap(`<h1 style="color:${red}">Application Not Accepted</h1><p>Hello <strong>${d.name}</strong>,</p><p>After review, your Partner Program application was not accepted.</p>${d.reason ? `<p>Reason: ${d.reason}</p>` : ''}`, lang) };

    case 'partner_suspended':
      return isFr
        ? { subject: `⚠️ Compte Partenaire suspendu`, html: wrap(`<h1 style="color:${red}">⚠️ Compte Suspendu</h1><p>Bonjour <strong>${d.name}</strong>,</p><p>Votre compte partenaire a été suspendu.</p>${d.reason ? `<p>Raison : ${d.reason}</p>` : ''}`, lang) }
        : { subject: `⚠️ Partner Account suspended`, html: wrap(`<h1 style="color:${red}">⚠️ Account Suspended</h1><p>Hello <strong>${d.name}</strong>,</p><p>Your partner account has been suspended.</p>${d.reason ? `<p>Reason: ${d.reason}</p>` : ''}`, lang) };

    case 'partner_unsuspended':
      return isFr
        ? { subject: `✅ Compte Partenaire réactivé`, html: wrap(`<h1 style="color:${green}">✅ Compte Réactivé</h1><p>Bonjour <strong>${d.name}</strong>,</p><p>Votre compte partenaire est de nouveau actif.</p>${cta('https://siteviral.com/partner', 'Mon Espace Partenaire')}`, lang) }
        : { subject: `✅ Partner Account reactivated`, html: wrap(`<h1 style="color:${green}">✅ Account Reactivated</h1><p>Hello <strong>${d.name}</strong>,</p><p>Your partner account is active again.</p>${cta('https://siteviral.com/partner', 'My Partner Space')}`, lang) };

    case 'partner_kyc_approved':
      return isFr
        ? { subject: `✅ KYC Partenaire approuvé`, html: wrap(`<h1 style="color:${green}">✅ Vérification KYC Approuvée</h1><p>Bonjour <strong>${d.name}</strong>,</p><p>Votre identité a été vérifiée. Vous pouvez demander des paiements.</p>${cta('https://siteviral.com/partner', 'Configurer mon paiement')}`, lang) }
        : { subject: `✅ Partner KYC approved`, html: wrap(`<h1 style="color:${green}">✅ KYC Verification Approved</h1><p>Hello <strong>${d.name}</strong>,</p><p>Your identity has been verified. You can now request payouts.</p>${cta('https://siteviral.com/partner', 'Set up my payment')}`, lang) };

    case 'partner_kyc_rejected':
      return isFr
        ? { subject: `KYC Partenaire – Action requise`, html: wrap(`<h1 style="color:${red}">❌ KYC Non Approuvé</h1><p>Bonjour <strong>${d.name}</strong>,</p><p>Votre vérification KYC n'a pas été approuvée.</p>${d.reason ? `<p>Raison : ${d.reason}</p>` : ''}${cta('https://siteviral.com/partner', 'Resoumettre')}`, lang) }
        : { subject: `Partner KYC – Action required`, html: wrap(`<h1 style="color:${red}">❌ KYC Not Approved</h1><p>Hello <strong>${d.name}</strong>,</p><p>Your KYC verification was not approved.</p>${d.reason ? `<p>Reason: ${d.reason}</p>` : ''}${cta('https://siteviral.com/partner', 'Resubmit')}`, lang) };

    case 'partner_payout_sent':
      return isFr
        ? { subject: `💸 Paiement envoyé – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">💸 Paiement Envoyé</h1><p>Bonjour <strong>${d.name}</strong>,</p><p>Un paiement de <strong>${d.amount} ${d.currency}</strong> a été envoyé sur votre compte.</p><p>Disponible sous 1–3 jours ouvrés.</p>`, lang) }
        : { subject: `💸 Payment sent – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">💸 Payment Sent</h1><p>Hello <strong>${d.name}</strong>,</p><p>A payment of <strong>${d.amount} ${d.currency}</strong> has been sent to your account.</p><p>Available within 1-3 business days.</p>`, lang) };

    case 'partner_application_received':
      return isFr
        ? { subject: `📩 Candidature partenaire reçue – Siteviral`, html: wrap(`<h1 style="color:${blue}">📩 Candidature Reçue</h1><p>Bonjour <strong>${d.name}</strong>,</p><p>Nous avons reçu votre candidature au <strong>Programme Partenaires</strong>. Notre équipe l'examinera sous <strong>24 à 48 heures</strong>.</p>${cta('https://siteviral.com/partner-terms', 'Voir le contrat')}`, lang) }
        : { subject: `📩 Partner application received – Siteviral`, html: wrap(`<h1 style="color:${blue}">📩 Application Received</h1><p>Hello <strong>${d.name}</strong>,</p><p>We received your application to the <strong>Partner Program</strong>. Our team will review it within <strong>24-48 hours</strong>.</p>${cta('https://siteviral.com/partner-terms', 'View contract')}`, lang) };

    case 'partner_level_up':
      return isFr
        ? { subject: `🎉 Niveau ${d.new_level_name} atteint ! – Siteviral`, html: wrap(`<h1 style="color:${green}">🎉 Niveau Supérieur !</h1><p>Bonjour <strong>${d.name}</strong>,</p><p>Vous êtes passé au niveau <strong>${d.new_level_name}</strong> ! 🚀</p><p>Nouveau taux de commission : <strong style="font-size:24px;color:${green}">${d.new_rate}%</strong></p>${cta('https://siteviral.com/partner', 'Mon Espace Partenaire')}`, lang) }
        : { subject: `🎉 Level ${d.new_level_name} reached! – Siteviral`, html: wrap(`<h1 style="color:${green}">🎉 Level Up!</h1><p>Hello <strong>${d.name}</strong>,</p><p>You've reached <strong>${d.new_level_name}</strong> level! 🚀</p><p>New commission rate: <strong style="font-size:24px;color:${green}">${d.new_rate}%</strong></p>${cta('https://siteviral.com/partner', 'My Partner Space')}`, lang) };

    case 'partner_new_referral':
      return isFr
        ? { subject: `🤝 Nouveau referral – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🤝 Nouveau Referral !</h1><p>Bonjour <strong>${d.partner_name}</strong>,</p><p>L'organisation <strong>"${d.org_name}"</strong> a été créée avec votre code d'invitation.</p>${cta('https://siteviral.com/partner', 'Voir mon espace partenaire')}`, lang) }
        : { subject: `🤝 New referral – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🤝 New Referral!</h1><p>Hello <strong>${d.partner_name}</strong>,</p><p>The organization <strong>"${d.org_name}"</strong> was created using your invite code.</p>${cta('https://siteviral.com/partner', 'View my partner space')}`, lang) };

    case 'partner_commission_earned':
      return isFr
        ? { subject: `💰 Commission partenaire – ${d.commission} ${d.currency}`, html: wrap(`<h1 style="color:${green}">💰 Commission Gagnée</h1><p>Vous avez gagné <strong>${d.commission} ${d.currency}</strong> grâce à l'activité de <strong>${d.org_name}</strong>.</p>${cta('https://siteviral.com/partner', 'Voir mes gains')}`, lang) }
        : { subject: `💰 Partner commission – ${d.commission} ${d.currency}`, html: wrap(`<h1 style="color:${green}">💰 Commission Earned</h1><p>You earned <strong>${d.commission} ${d.currency}</strong> from the activity of <strong>${d.org_name}</strong>.</p>${cta('https://siteviral.com/partner', 'View my earnings')}`, lang) };

    // ═══ DIRECTORY ═══
    case 'directory_approved':
      return isFr
        ? { subject: `🌟 Référencement approuvé – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🌟 Référencement Approuvé</h1><p>Votre organisation <strong>${d.org_name}</strong> a été approuvée pour le répertoire Siteviral.</p>`, lang) }
        : { subject: `🌟 Directory listing approved – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🌟 Directory Listing Approved</h1><p>Your organization <strong>${d.org_name}</strong> has been approved for the Siteviral directory.</p>`, lang) };

    case 'directory_rejected':
      return isFr
        ? { subject: `Référencement – Mise à jour – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">❌ Demande de Référencement Refusée</h1><p>Votre demande de référencement pour <strong>${d.org_name}</strong> n'a pas été approuvée.</p><p>Raison : ${d.reason || 'Ne remplit pas les critères.'}</p>`, lang) }
        : { subject: `Directory listing – Update – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">❌ Directory Listing Rejected</h1><p>Your directory listing request for <strong>${d.org_name}</strong> was not approved.</p><p>Reason: ${d.reason || 'Does not meet criteria.'}</p>`, lang) };

    // ═══ SUPPORT ═══
    case 'ticket_created':
      return isFr
        ? { subject: `🎫 Ticket #${d.ticket_id || ''} créé`, html: wrap(`<h1 style="color:${blue}">🎫 Ticket Créé</h1><p>Votre ticket de support a été créé.</p><p><strong>Sujet :</strong> ${d.subject}</p><p>Notre équipe vous répondra sous 24 à 48 heures.</p>`, lang) }
        : { subject: `🎫 Ticket #${d.ticket_id || ''} created`, html: wrap(`<h1 style="color:${blue}">🎫 Ticket Created</h1><p>Your support ticket has been created.</p><p><strong>Subject:</strong> ${d.subject}</p><p>Our team will respond within 24-48 hours.</p>`, lang) };

    case 'ticket_replied':
      return isFr
        ? { subject: `💬 Réponse au ticket #${d.ticket_id || ''}`, html: wrap(`<h1 style="color:${info}">💬 Nouvelle Réponse</h1><p>Un agent a répondu à votre ticket :</p><div style="background:#222;border-radius:8px;padding:16px;margin:12px 0;border-left:3px solid ${blue}">${d.reply_preview || ''}</div>${cta('https://siteviral.com/support', 'Voir le ticket →')}`, lang) }
        : { subject: `💬 Reply to ticket #${d.ticket_id || ''}`, html: wrap(`<h1 style="color:${info}">💬 New Reply</h1><p>An agent replied to your ticket:</p><div style="background:#222;border-radius:8px;padding:16px;margin:12px 0;border-left:3px solid ${blue}">${d.reply_preview || ''}</div>${cta('https://siteviral.com/support', 'View ticket →')}`, lang) };

    case 'ticket_resolved':
      return isFr
        ? { subject: `✅ Ticket résolu #${d.ticket_id || ''}`, html: wrap(`<h1 style="color:${green}">✅ Ticket Résolu</h1><p>Votre ticket <strong>${d.subject}</strong> a été marqué comme résolu.</p>`, lang) }
        : { subject: `✅ Ticket resolved #${d.ticket_id || ''}`, html: wrap(`<h1 style="color:${green}">✅ Ticket Resolved</h1><p>Your ticket <strong>${d.subject}</strong> has been marked as resolved.</p>`, lang) };

    // ═══ REFUNDS ═══
    case 'refund_initiated':
      return isFr
        ? { subject: `🔄 Demande de remboursement – ${d.reference || ''}`, html: wrap(`<h1 style="color:${info}">🔄 Demande de Remboursement Reçue</h1><p>Nous avons reçu votre demande de remboursement de <strong>${d.amount} ${d.currency}</strong>.</p><p>Examen sous 3 à 5 jours ouvrés.</p>`, lang) }
        : { subject: `🔄 Refund request – ${d.reference || ''}`, html: wrap(`<h1 style="color:${info}">🔄 Refund Request Received</h1><p>We received your refund request for <strong>${d.amount} ${d.currency}</strong>.</p><p>Review within 3-5 business days.</p>`, lang) };

    case 'refund_completed':
      return isFr
        ? { subject: `✅ Remboursement traité – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">✅ Remboursement Traité</h1><p>Votre remboursement de <strong>${d.amount} ${d.currency}</strong> a été traité.</p><p>Les fonds seront visibles sous 5 à 10 jours ouvrés.</p>`, lang) }
        : { subject: `✅ Refund processed – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">✅ Refund Processed</h1><p>Your refund of <strong>${d.amount} ${d.currency}</strong> has been processed.</p><p>Funds will be available within 5-10 business days.</p>`, lang) };

    // ═══ CONTENT & SOCIAL ═══
    case 'content_report_resolved':
      return isFr
        ? { subject: `Signalement traité`, html: wrap(`<h1 style="color:${info}">📋 Signalement Traité</h1><p>Votre signalement de contenu a été examiné et traité.</p>`, lang) }
        : { subject: `Report resolved`, html: wrap(`<h1 style="color:${info}">📋 Report Resolved</h1><p>Your content report has been reviewed and resolved.</p>`, lang) };

    case 'content_liked':
      return isFr
        ? { subject: `❤️ Quelqu'un a aimé votre contenu`, html: wrap(`<h1 style="color:${red}">❤️ Nouveau Like</h1><p><strong>${d.liker_name || 'Quelqu\'un'}</strong> a aimé votre ${d.content_type || 'contenu'} : <strong>"${d.content_title}"</strong>.</p>`, lang) }
        : { subject: `❤️ Someone liked your content`, html: wrap(`<h1 style="color:${red}">❤️ New Like</h1><p><strong>${d.liker_name || 'Someone'}</strong> liked your ${d.content_type || 'content'}: <strong>"${d.content_title}"</strong>.</p>`, lang) };

    case 'content_saved':
      return isFr
        ? { subject: `🔖 Quelqu'un a sauvegardé votre contenu`, html: wrap(`<h1 style="color:${blue}">🔖 Contenu Sauvegardé</h1><p><strong>${d.saver_name || 'Quelqu\'un'}</strong> a sauvegardé votre ${d.content_type || 'contenu'} : <strong>"${d.content_title}"</strong>.</p>`, lang) }
        : { subject: `🔖 Someone saved your content`, html: wrap(`<h1 style="color:${blue}">🔖 Content Saved</h1><p><strong>${d.saver_name || 'Someone'}</strong> saved your ${d.content_type || 'content'}: <strong>"${d.content_title}"</strong>.</p>`, lang) };

    case 'new_event_published':
      return isFr
        ? { subject: `📅 Nouvel événement – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📅 Nouvel Événement</h1><p><strong>${d.org_name}</strong> a publié un nouvel événement : <strong>"${d.event_title}"</strong>.</p>${d.event_date ? `<p>Date : ${d.event_date}</p>` : ''}${cta(String(d.event_link || '#'), 'Voir l\'événement')}`, lang) }
        : { subject: `📅 New event – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📅 New Event</h1><p><strong>${d.org_name}</strong> published a new event: <strong>"${d.event_title}"</strong>.</p>${d.event_date ? `<p>Date: ${d.event_date}</p>` : ''}${cta(String(d.event_link || '#'), 'View event')}`, lang) };

    case 'new_announcement_published':
      return isFr
        ? { subject: `📢 Nouvelle annonce – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📢 Nouvelle Annonce</h1><p><strong>${d.org_name}</strong> a publié : <strong>"${d.announcement_title}"</strong>.</p>${cta(String(d.org_link || '#'), 'Lire la suite')}`, lang) }
        : { subject: `📢 New announcement – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📢 New Announcement</h1><p><strong>${d.org_name}</strong> published: <strong>"${d.announcement_title}"</strong>.</p>${cta(String(d.org_link || '#'), 'Read more')}`, lang) };

    case 'new_media_published':
      return isFr
        ? { subject: `🎬 Nouveau contenu – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🎬 Nouveau Contenu</h1><p><strong>${d.org_name}</strong> a publié : <strong>"${d.media_title}"</strong>.</p>${cta(String(d.media_link || '#'), 'Regarder maintenant')}`, lang) }
        : { subject: `🎬 New content – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🎬 New Content</h1><p><strong>${d.org_name}</strong> published: <strong>"${d.media_title}"</strong>.</p>${cta(String(d.media_link || '#'), 'Watch now')}`, lang) };

    case 'new_product_published':
      return isFr
        ? { subject: `🛍 Nouveau produit – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🛍 Nouveau Produit</h1><p><strong>${d.org_name}</strong> a mis en ligne : <strong>"${d.product_name}"</strong>.</p>${d.price ? `<p>Prix : ${d.price} ${d.currency || 'XOF'}</p>` : '<p>Gratuit !</p>'}${cta(String(d.product_link || '#'), 'Voir le produit')}`, lang) }
        : { subject: `🛍 New product – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🛍 New Product</h1><p><strong>${d.org_name}</strong> published: <strong>"${d.product_name}"</strong>.</p>${d.price ? `<p>Price: ${d.price} ${d.currency || 'XOF'}</p>` : '<p>Free!</p>'}${cta(String(d.product_link || '#'), 'View product')}`, lang) };

    case 'new_campaign_published':
      return isFr
        ? { subject: `🎯 Nouvelle campagne – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🎯 Nouvelle Campagne</h1><p><strong>${d.org_name}</strong> a lancé : <strong>"${d.campaign_name}"</strong>.</p>${cta(String(d.campaign_link || '#'), 'Contribuer')}`, lang) }
        : { subject: `🎯 New campaign – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🎯 New Campaign</h1><p><strong>${d.org_name}</strong> launched: <strong>"${d.campaign_name}"</strong>.</p>${cta(String(d.campaign_link || '#'), 'Contribute')}`, lang) };

    case 'new_program_published':
      return isFr
        ? { subject: `🎓 Nouveau programme – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🎓 Nouveau Programme</h1><p><strong>${d.org_name}</strong> a lancé : <strong>"${d.program_name}"</strong>.</p>${cta(String(d.program_link || '#'), 'S\'inscrire')}`, lang) }
        : { subject: `🎓 New program – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🎓 New Program</h1><p><strong>${d.org_name}</strong> launched: <strong>"${d.program_name}"</strong>.</p>${cta(String(d.program_link || '#'), 'Enroll')}`, lang) };

    // ═══ COMMENTS ═══
    case 'new_comment_received':
      return isFr
        ? { subject: `💬 Nouveau commentaire – ${d.content_title}`, html: wrap(`<h1 style="color:${blue}">💬 Nouveau Commentaire</h1><p><strong>${d.commenter_name || 'Quelqu\'un'}</strong> a commenté votre ${d.content_type || 'contenu'} : <strong>"${d.content_title}"</strong>.</p><div style="background:#222;border-radius:8px;padding:12px;margin:12px 0;border-left:3px solid ${blue};color:#ccc">${d.comment_preview || ''}</div>`, lang) }
        : { subject: `💬 New comment – ${d.content_title}`, html: wrap(`<h1 style="color:${blue}">💬 New Comment</h1><p><strong>${d.commenter_name || 'Someone'}</strong> commented on your ${d.content_type || 'content'}: <strong>"${d.content_title}"</strong>.</p><div style="background:#222;border-radius:8px;padding:12px;margin:12px 0;border-left:3px solid ${blue};color:#ccc">${d.comment_preview || ''}</div>`, lang) };

    case 'comment_reply':
      return isFr
        ? { subject: `↩️ Réponse à votre commentaire`, html: wrap(`<h1 style="color:${blue}">↩️ Réponse à Votre Commentaire</h1><p><strong>${d.replier_name || 'Quelqu\'un'}</strong> a répondu à votre commentaire sur <strong>"${d.content_title}"</strong>.</p><div style="background:#222;border-radius:8px;padding:12px;margin:12px 0;border-left:3px solid ${blue};color:#ccc">${d.reply_preview || ''}</div>`, lang) }
        : { subject: `↩️ Reply to your comment`, html: wrap(`<h1 style="color:${blue}">↩️ Reply to Your Comment</h1><p><strong>${d.replier_name || 'Someone'}</strong> replied to your comment on <strong>"${d.content_title}"</strong>.</p><div style="background:#222;border-radius:8px;padding:12px;margin:12px 0;border-left:3px solid ${blue};color:#ccc">${d.reply_preview || ''}</div>`, lang) };

    // ═══ SUBSCRIPTIONS ═══
    case 'subscription_renewed':
      return isFr
        ? { subject: `🔄 Abonnement renouvelé – ${d.plan_name}`, html: wrap(`<h1 style="color:${green}">🔄 Abonnement Renouvelé</h1><p>Votre abonnement <strong>"${d.plan_name}"</strong> sur <strong>${d.org_name}</strong> a été renouvelé.</p><p>Montant : ${d.amount} ${d.currency}</p>`, lang) }
        : { subject: `🔄 Subscription renewed – ${d.plan_name}`, html: wrap(`<h1 style="color:${green}">🔄 Subscription Renewed</h1><p>Your subscription <strong>"${d.plan_name}"</strong> on <strong>${d.org_name}</strong> has been renewed.</p><p>Amount: ${d.amount} ${d.currency}</p>`, lang) };

    case 'subscription_expiring':
      return isFr
        ? { subject: `⏰ Abonnement bientôt expiré – ${d.plan_name}`, html: wrap(`<h1 style="color:${orange}">⏰ Abonnement Bientôt Expiré</h1><p>Votre abonnement <strong>"${d.plan_name}"</strong> expire le <strong>${d.expiry_date}</strong>.</p>${cta('https://siteviral.com/dashboard', 'Renouveler')}`, lang) }
        : { subject: `⏰ Subscription expiring – ${d.plan_name}`, html: wrap(`<h1 style="color:${orange}">⏰ Subscription Expiring</h1><p>Your subscription <strong>"${d.plan_name}"</strong> expires on <strong>${d.expiry_date}</strong>.</p>${cta('https://siteviral.com/dashboard', 'Renew')}`, lang) };

    case 'subscription_cancelled':
      return isFr
        ? { subject: `🚫 Abonnement annulé – ${d.plan_name}`, html: wrap(`<h1 style="color:${red}">🚫 Abonnement Annulé</h1><p>Votre abonnement <strong>"${d.plan_name}"</strong> sur <strong>${d.org_name}</strong> a été annulé.</p>`, lang) }
        : { subject: `🚫 Subscription cancelled – ${d.plan_name}`, html: wrap(`<h1 style="color:${red}">🚫 Subscription Cancelled</h1><p>Your subscription <strong>"${d.plan_name}"</strong> on <strong>${d.org_name}</strong> has been cancelled.</p>`, lang) };

    // ═══ OFFERINGS ═══
    case 'offering_received':
      return isFr
        ? { subject: `🙏 Offrande reçue – ${d.offering_title}`, html: wrap(`<h1 style="color:${green}">🙏 Offrande Reçue</h1><p><strong>${d.donor_name || 'Quelqu\'un'}</strong> a fait une offrande de <strong>${d.amount} ${d.currency}</strong> pour <strong>"${d.offering_title}"</strong>.</p>`, lang) }
        : { subject: `🙏 Offering received – ${d.offering_title}`, html: wrap(`<h1 style="color:${green}">🙏 Offering Received</h1><p><strong>${d.donor_name || 'Someone'}</strong> made an offering of <strong>${d.amount} ${d.currency}</strong> for <strong>"${d.offering_title}"</strong>.</p>`, lang) };

    case 'offering_receipt':
      return isFr
        ? { subject: `Reçu d'offrande – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🙏 Reçu d'Offrande</h1><p>Merci pour votre offrande de <strong>${d.amount} ${d.currency}</strong> à <strong>${d.org_name}</strong>. 🙏</p>`, lang) }
        : { subject: `Offering receipt – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🙏 Offering Receipt</h1><p>Thank you for your offering of <strong>${d.amount} ${d.currency}</strong> to <strong>${d.org_name}</strong>. 🙏</p>`, lang) };

    // ═══ PROGRAMS ═══
    case 'program_enrolled':
      return isFr
        ? { subject: `🎓 Inscription confirmée – ${d.program_name}`, html: wrap(`<h1 style="color:${blue}">🎓 Inscription Confirmée</h1><p>Vous êtes inscrit au programme <strong>"${d.program_name}"</strong> de <strong>${d.org_name}</strong>.</p>${cta('https://siteviral.com/dashboard', 'Commencer le programme')}`, lang) }
        : { subject: `🎓 Enrollment confirmed – ${d.program_name}`, html: wrap(`<h1 style="color:${blue}">🎓 Enrollment Confirmed</h1><p>You are enrolled in the program <strong>"${d.program_name}"</strong> from <strong>${d.org_name}</strong>.</p>${cta('https://siteviral.com/dashboard', 'Start the program')}`, lang) };

    case 'program_completed':
      return isFr
        ? { subject: `🏆 Programme terminé – ${d.program_name}`, html: wrap(`<h1 style="color:${green}">🏆 Félicitations !</h1><p>Vous avez complété le programme <strong>"${d.program_name}"</strong> de <strong>${d.org_name}</strong>. 🚀</p>`, lang) }
        : { subject: `🏆 Program completed – ${d.program_name}`, html: wrap(`<h1 style="color:${green}">🏆 Congratulations!</h1><p>You completed the program <strong>"${d.program_name}"</strong> from <strong>${d.org_name}</strong>. 🚀</p>`, lang) };

    case 'program_new_lesson':
      return isFr
        ? { subject: `📚 Nouvelle leçon – ${d.program_name}`, html: wrap(`<h1 style="color:${blue}">📚 Nouvelle Leçon</h1><p>Une nouvelle leçon <strong>"${d.lesson_title}"</strong> a été ajoutée au programme <strong>"${d.program_name}"</strong>.</p>${cta('https://siteviral.com/dashboard', 'Suivre la leçon')}`, lang) }
        : { subject: `📚 New lesson – ${d.program_name}`, html: wrap(`<h1 style="color:${blue}">📚 New Lesson</h1><p>A new lesson <strong>"${d.lesson_title}"</strong> has been added to the program <strong>"${d.program_name}"</strong>.</p>${cta('https://siteviral.com/dashboard', 'Take the lesson')}`, lang) };

    // ═══ GAMIFICATION ═══
    case 'badge_earned':
      return isFr
        ? { subject: `🏅 Badge obtenu – ${d.badge_name}`, html: wrap(`<h1 style="color:${green}">🏅 Nouveau Badge !</h1><p>Félicitations ! Vous avez obtenu le badge :</p><div style="text-align:center;padding:20px"><p style="font-size:28px;margin:0">🏅</p><p style="font-size:18px;font-weight:bold;color:${blue};margin:8px 0">${d.badge_name}</p></div>`, lang) }
        : { subject: `🏅 Badge earned – ${d.badge_name}`, html: wrap(`<h1 style="color:${green}">🏅 New Badge!</h1><p>Congratulations! You earned the badge:</p><div style="text-align:center;padding:20px"><p style="font-size:28px;margin:0">🏅</p><p style="font-size:18px;font-weight:bold;color:${blue};margin:8px 0">${d.badge_name}</p></div>`, lang) };

    // ═══ ABANDONED CART ═══
    case 'abandoned_cart_reminder':
      return isFr
        ? { subject: `🛒 Vous avez oublié quelque chose – ${d.product_name}`, html: wrap(`<h1 style="color:${orange}">🛒 Panier Abandonné</h1><p>Vous étiez sur le point d'acquérir <strong>"${d.product_name}"</strong> de <strong>${d.org_name}</strong>.</p>${cta(String(d.checkout_link || 'https://siteviral.com'), 'Finaliser mon achat →')}`, lang) }
        : { subject: `🛒 You left something behind – ${d.product_name}`, html: wrap(`<h1 style="color:${orange}">🛒 Abandoned Cart</h1><p>You were about to get <strong>"${d.product_name}"</strong> from <strong>${d.org_name}</strong>.</p>${cta(String(d.checkout_link || 'https://siteviral.com'), 'Complete my purchase →')}`, lang) };

    // ═══ EVENT REMINDER ═══
    case 'event_reminder_24h':
      return isFr
        ? { subject: `📅 Rappel – ${d.event_title} demain !`, html: wrap(`<h1 style="color:${blue}">📅 Événement Demain !</h1><p>L'événement <strong>"${d.event_title}"</strong> de <strong>${d.org_name}</strong> a lieu demain.</p><p>📍 ${d.event_location || 'Non précisé'}</p><p>🕐 ${d.event_date}</p>`, lang) }
        : { subject: `📅 Reminder – ${d.event_title} tomorrow!`, html: wrap(`<h1 style="color:${blue}">📅 Event Tomorrow!</h1><p>The event <strong>"${d.event_title}"</strong> from <strong>${d.org_name}</strong> is tomorrow.</p><p>📍 ${d.event_location || 'Not specified'}</p><p>🕐 ${d.event_date}</p>`, lang) };

    // ═══ RECAPS ═══
    case 'weekly_recap_user':
      return isFr
        ? { subject: `📬 Votre récap hebdomadaire – Siteviral`, html: wrap(`<h1 style="color:${blue}">📬 Récap Hebdomadaire</h1><p>Bonjour ${d.name || ''}, voici votre semaine :</p><ul style="color:#ccc"><li>Nouveaux contenus : ${d.new_content || 0}</li><li>Événements à venir : ${d.upcoming_events || 0}</li><li>Notifications : ${d.unread_notifications || 0}</li></ul>${cta('https://siteviral.com/marketplace', 'Voir les nouveautés')}`, lang) }
        : { subject: `📬 Your weekly recap – Siteviral`, html: wrap(`<h1 style="color:${blue}">📬 Weekly Recap</h1><p>Hello ${d.name || ''}, here's your week:</p><ul style="color:#ccc"><li>New content: ${d.new_content || 0}</li><li>Upcoming events: ${d.upcoming_events || 0}</li><li>Notifications: ${d.unread_notifications || 0}</li></ul>${cta('https://siteviral.com/marketplace', 'See what\'s new')}`, lang) };

    case 'daily_recap_admin':
      return isFr
        ? { subject: `📊 Rapport quotidien – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📊 Rapport Quotidien</h1><p><strong>${d.org_name}</strong> – ${d.date}</p><ul style="color:#ccc"><li>Revenus : ${d.revenue || 0} ${d.currency || 'XOF'}</li><li>Nouveaux membres : ${d.new_members || 0}</li><li>Transactions : ${d.transactions || 0}</li></ul>`, lang) }
        : { subject: `📊 Daily report – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📊 Daily Report</h1><p><strong>${d.org_name}</strong> – ${d.date}</p><ul style="color:#ccc"><li>Revenue: ${d.revenue || 0} ${d.currency || 'XOF'}</li><li>New members: ${d.new_members || 0}</li><li>Transactions: ${d.transactions || 0}</li></ul>`, lang) };

    case 'daily_recap_superadmin':
      return isFr
        ? { subject: `🔷 Rapport plateforme – Siteviral`, html: wrap(`<h1 style="color:${blue}">🔷 Rapport Plateforme – ${d.date}</h1><ul style="color:#ccc"><li>GMV : ${d.gmv || 0} XOF</li><li>Frais plateforme : ${d.platform_fees || 0} XOF</li><li>Nouveaux utilisateurs : ${d.new_users || 0}</li><li>Nouvelles organisations : ${d.new_orgs || 0}</li></ul>`, lang) }
        : { subject: `🔷 Platform report – Siteviral`, html: wrap(`<h1 style="color:${blue}">🔷 Platform Report – ${d.date}</h1><ul style="color:#ccc"><li>GMV: ${d.gmv || 0} XOF</li><li>Platform fees: ${d.platform_fees || 0} XOF</li><li>New users: ${d.new_users || 0}</li><li>New organizations: ${d.new_orgs || 0}</li></ul>`, lang) };

    case 'monthly_recap_org':
      return isFr
        ? { subject: `📊 Récap mensuel – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📊 Récap Mensuel</h1><p><strong>${d.org_name}</strong> – ${d.month}</p><ul style="color:#ccc"><li>Revenus : ${d.revenue || 0} ${d.currency || 'XOF'}</li><li>Nouveaux membres : ${d.new_members || 0}</li><li>Ventes : ${d.sales || 0}</li></ul>${cta('https://siteviral.com/admin/analytics', 'Voir les détails')}`, lang) }
        : { subject: `📊 Monthly recap – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📊 Monthly Recap</h1><p><strong>${d.org_name}</strong> – ${d.month}</p><ul style="color:#ccc"><li>Revenue: ${d.revenue || 0} ${d.currency || 'XOF'}</li><li>New members: ${d.new_members || 0}</li><li>Sales: ${d.sales || 0}</li></ul>${cta('https://siteviral.com/admin/analytics', 'View details')}`, lang) };

    case 'weekly_ambassador_recap':
      return isFr
        ? { subject: `📊 Récap ambassadeur – Semaine`, html: wrap(`<h1 style="color:${blue}">📊 Récap Ambassadeur</h1><p>Voici votre résumé de la semaine :</p><ul style="color:#ccc"><li>Clics : ${d.clicks || 0}</li><li>Conversions : ${d.conversions || 0}</li><li>Gains : ${d.earnings || 0} ${d.currency || 'XOF'}</li></ul>${cta('https://siteviral.com/affiliation', 'Mon espace ambassadeur')}`, lang) }
        : { subject: `📊 Ambassador recap – Week`, html: wrap(`<h1 style="color:${blue}">📊 Ambassador Recap</h1><p>Here's your weekly summary:</p><ul style="color:#ccc"><li>Clicks: ${d.clicks || 0}</li><li>Conversions: ${d.conversions || 0}</li><li>Earnings: ${d.earnings || 0} ${d.currency || 'XOF'}</li></ul>${cta('https://siteviral.com/affiliation', 'My ambassador space')}`, lang) };

    // ═══ SUPERADMIN ALERTS ═══
    case 'fraud_alert':
      return isFr
        ? { subject: `🚨 Alerte fraude – ${d.org_name || 'Plateforme'}`, html: wrap(`<h1 style="color:${red}">🚨 Alerte Fraude</h1><p><strong>Type :</strong> ${d.reason}</p><p><strong>Organisation :</strong> ${d.org_name || 'N/A'}</p>${cta('https://siteviral.com/superadmin/risk', 'Examiner')}`, lang) }
        : { subject: `🚨 Fraud alert – ${d.org_name || 'Platform'}`, html: wrap(`<h1 style="color:${red}">🚨 Fraud Alert</h1><p><strong>Type:</strong> ${d.reason}</p><p><strong>Organization:</strong> ${d.org_name || 'N/A'}</p>${cta('https://siteviral.com/superadmin/risk', 'Review')}`, lang) };

    case 'new_org_alert':
      return isFr
        ? { subject: `🏢 Nouvelle organisation – ${d.org_name}`, html: wrap(`<h1 style="color:${info}">🏢 Nouvelle Organisation</h1><p><strong>Nom :</strong> ${d.org_name}</p><p><strong>Catégorie :</strong> ${d.category || 'N/A'}</p>${cta('https://siteviral.com/superadmin/directory', 'Examiner')}`, lang) }
        : { subject: `🏢 New organization – ${d.org_name}`, html: wrap(`<h1 style="color:${info}">🏢 New Organization</h1><p><strong>Name:</strong> ${d.org_name}</p><p><strong>Category:</strong> ${d.category || 'N/A'}</p>${cta('https://siteviral.com/superadmin/directory', 'Review')}`, lang) };

    // ═══ MISC ═══
    case 'flash_sale_alert':
      return isFr
        ? { subject: `⚡ Promo flash – ${d.product_name}`, html: wrap(`<h1 style="color:${red}">⚡ Promo Flash !</h1><p><strong>"${d.product_name}"</strong> de <strong>${d.org_name}</strong> est en promotion !</p><p><span style="text-decoration:line-through;color:#999">${d.original_price} ${d.currency}</span> → <strong style="color:${green}">${d.sale_price} ${d.currency}</strong></p>${cta('https://siteviral.com', 'En profiter →')}`, lang) }
        : { subject: `⚡ Flash sale – ${d.product_name}`, html: wrap(`<h1 style="color:${red}">⚡ Flash Sale!</h1><p><strong>"${d.product_name}"</strong> from <strong>${d.org_name}</strong> is on sale!</p><p><span style="text-decoration:line-through;color:#999">${d.original_price} ${d.currency}</span> → <strong style="color:${green}">${d.sale_price} ${d.currency}</strong></p>${cta('https://siteviral.com', 'Get it now →')}`, lang) };

    case 'promo_code_used':
      return isFr
        ? { subject: `🎟️ Code promo utilisé – ${d.promo_code}`, html: wrap(`<h1 style="color:${blue}">🎟️ Code Promo Utilisé</h1><p><strong>${d.buyer_name || 'Un acheteur'}</strong> a utilisé le code <strong>"${d.promo_code}"</strong> sur <strong>${d.org_name}</strong>.</p>`, lang) }
        : { subject: `🎟️ Promo code used – ${d.promo_code}`, html: wrap(`<h1 style="color:${blue}">🎟️ Promo Code Used</h1><p><strong>${d.buyer_name || 'A buyer'}</strong> used the code <strong>"${d.promo_code}"</strong> on <strong>${d.org_name}</strong>.</p>`, lang) };

    case 'org_verified':
      return isFr
        ? { subject: `✅ Organisation vérifiée – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">✅ Organisation Vérifiée !</h1><p><strong>${d.org_name}</strong> est maintenant vérifiée sur Siteviral.</p>`, lang) }
        : { subject: `✅ Organization verified – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">✅ Organization Verified!</h1><p><strong>${d.org_name}</strong> is now verified on Siteviral.</p>`, lang) };

    case 'waitlist_spot_available':
      return isFr
        ? { subject: `🎉 Place disponible – ${d.item_name}`, html: wrap(`<h1 style="color:${green}">🎉 Place Disponible !</h1><p>Une place est disponible pour <strong>"${d.item_name}"</strong>.</p>${cta('https://siteviral.com', 'Réserver maintenant')}`, lang) }
        : { subject: `🎉 Spot available – ${d.item_name}`, html: wrap(`<h1 style="color:${green}">🎉 Spot Available!</h1><p>A spot is available for <strong>"${d.item_name}"</strong>.</p>${cta('https://siteviral.com', 'Reserve now')}`, lang) };

    case 'referral_reward':
      return isFr
        ? { subject: `🎁 Récompense de parrainage`, html: wrap(`<h1 style="color:${green}">🎁 Récompense !</h1><p><strong>${d.referred_name || 'Quelqu\'un'}</strong> s'est inscrit grâce à vous !</p><p>${d.reward_description || 'Votre récompense a été créditée.'}</p>`, lang) }
        : { subject: `🎁 Referral reward`, html: wrap(`<h1 style="color:${green}">🎁 Reward!</h1><p><strong>${d.referred_name || 'Someone'}</strong> signed up thanks to you!</p><p>${d.reward_description || 'Your reward has been credited.'}</p>`, lang) };

    // ═══ NOTIFICATION REMINDER ═══
    case 'notification_reminder': {
      const ctaLabelsFr: Record<string, string> = {
        new_product: 'Voir le produit →', new_program: 'Voir le programme →',
        new_event: 'Voir l\'événement →', new_campaign: 'Voir la campagne →',
        purchase: 'Voir mes achats →', sale_celebration: 'Voir mes ventes →',
      };
      const ctaLabelsEn: Record<string, string> = {
        new_product: 'View product →', new_program: 'View program →',
        new_event: 'View event →', new_campaign: 'View campaign →',
        purchase: 'View my purchases →', sale_celebration: 'View my sales →',
      };
      const labels = isFr ? ctaLabelsFr : ctaLabelsEn;
      const ctaText = labels[String(d.notification_type)] || (isFr ? 'Voir la notification →' : 'View notification →');
      const manageText = isFr ? 'Gérer mes préférences' : 'Manage my preferences';
      const fallbackCta = isFr ? 'Voir mes notifications →' : 'View my notifications →';
      return {
        subject: `${d.title || '🔔 Notification'}`,
        html: wrap(`<h1 style="color:${blue}">${d.title || '🔔 Notification'}</h1><p>${d.body || (isFr ? 'Vous avez une nouvelle notification sur Siteviral.' : 'You have a new notification on Siteviral.')}</p>${d.action_url ? cta(String(d.action_url), ctaText) : cta('https://siteviral.com/notifications', fallbackCta)}<p style="font-size:12px;color:#999">${isFr ? 'Vous recevez cet email car vous avez activé les notifications email.' : 'You receive this email because you enabled email notifications.'} <a href="https://siteviral.com/notification-preferences" style="color:${blue}">${manageText}</a></p>`, lang),
      };
    }

    // ═══ REVIEW REQUEST (J+3 after purchase) ═══
    case 'review_request':
      return isFr
        ? {
            subject: `⭐ Votre avis sur "${d.product_title}" nous intéresse !`,
            html: wrap(`
              <h1 style="color:${blue}">⭐ Partagez votre expérience</h1>
              <p>Bonjour ${d.buyer_name || ''},</p>
              <p>Nous espérons que vous profitez pleinement de votre achat <strong>"${d.product_title}"</strong> sur <strong>${d.org_name}</strong> !</p>
              <p>En tant qu'acheteur récent, votre retour d'expérience est particulièrement précieux. Il aidera non seulement <strong>${d.org_name}</strong> à s'améliorer, mais guidera aussi les futurs acheteurs dans leurs choix.</p>
              <p style="font-weight:600">Pourriez-vous prendre un instant pour partager votre avis ?</p>
              ${cta(String(d.review_url || 'https://siteviral.com'), 'Laisser un avis ⭐')}
              <p style="color:#999;font-size:12px">C'est simple et rapide — 10 secondes suffisent pour faire la différence !</p>
              <p style="margin-top:24px">À très bientôt,<br/>L'équipe <strong>${d.org_name}</strong></p>
            `, lang)
          }
        : {
            subject: `⭐ How was "${d.product_title}"? Share your review!`,
            html: wrap(`
              <h1 style="color:${blue}">⭐ Share Your Experience</h1>
              <p>Hello ${d.buyer_name || ''},</p>
              <p>We hope you're enjoying your purchase of <strong>"${d.product_title}"</strong> from <strong>${d.org_name}</strong>!</p>
              <p>As a recent buyer, your feedback is incredibly valuable. It will help <strong>${d.org_name}</strong> improve and guide future buyers in their decisions.</p>
              <p style="font-weight:600">Could you take a moment to share your review?</p>
              ${cta(String(d.review_url || 'https://siteviral.com'), 'Leave a Review ⭐')}
              <p style="color:#999;font-size:12px">It's quick and easy — just 10 seconds to make a difference!</p>
              <p style="margin-top:24px">See you soon,<br/>The <strong>${d.org_name}</strong> team</p>
            `, lang)
          };

    // ═══ MODERATION (no bilingual — moderator writes the exact text) ═══
    case 'moderation_action': {
      const actionEmojis: Record<string, string> = {
        unpublish: '⛔', delete: '🗑️', warn: '⚠️', suspend_org: '🚫',
      };
      const emoji = actionEmojis[String(d.action)] || '⚠️';
      const emailSubject = d.subject ? String(d.subject) : `${emoji} Moderation – "${d.content_title}"`;
      const descriptionHtml = d.description
        ? `<div style="background:#222;border-radius:8px;padding:16px;margin:16px 0;color:#ddd;font-size:14px;line-height:1.6;white-space:pre-wrap">${d.description}</div>`
        : '';
      const reasonHtml = d.reason
        ? `<p style="color:#ccc;font-size:13px;margin:12px 0"><strong style="color:#eee">Reason:</strong> ${d.reason}</p>`
        : '';

      return {
        subject: emailSubject,
        html: wrap(`
          <h1 style="color:${red}">${emoji} ${emailSubject}</h1>
          <p style="color:#ccc">Content affected: <strong style="color:#eee">"${d.content_title}"</strong></p>
          ${reasonHtml}
          ${descriptionHtml}
          <p style="color:#999;font-size:12px;margin-top:20px">If you believe this decision was made in error, please contact our support team at <a href="mailto:support@siteviral.com" style="color:#999">support@siteviral.com</a> or <a href="mailto:team@siteviral.com" style="color:#999">team@siteviral.com</a>.</p>
          ${cta('https://siteviral.com/admin/products', 'View my content')}
        `, lang),
        fromOverride: 'Siteviral Team <team@siteviral.com>',
      };
    }

    default:
      throw new Error(`Unknown template: ${template}`);
  }
}

// ═══════════════════════════════════════
// Resolve org's primary custom domain
// ═══════════════════════════════════════
async function resolveOrgDomain(
  supabaseAdmin: ReturnType<typeof createClient>,
  organizationId: string,
): Promise<{ baseUrl: string; orgName: string } | null> {
  try {
    // Get primary domain for the org
    const { data: domainRow } = await supabaseAdmin
      .from('org_domains')
      .select('domain, organizations(name, slug)')
      .eq('organization_id', organizationId)
      .eq('is_primary', true)
      .eq('is_verified', true)
      .limit(1)
      .maybeSingle();

    if (domainRow?.domain) {
      const orgName = (domainRow as any).organizations?.name || 'Siteviral';
      return { baseUrl: `https://${domainRow.domain}`, orgName };
    }

    // Fallback: get org slug for siteviral.com/org/slug
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('name, slug')
      .eq('id', organizationId)
      .single();

    if (org) {
      return { baseUrl: `https://siteviral.com/org/${org.slug}`, orgName: org.name };
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Replace hardcoded siteviral.com/org/... URLs in email HTML with the org's base URL.
 * Only replaces org-specific paths (not platform paths like /terms, /privacy).
 */
function rewriteOrgLinks(html: string, orgSlug: string, orgBaseUrl: string): string {
  // Replace siteviral.com/org/{slug}/... → orgBaseUrl/...
  const orgPathPattern = new RegExp(`https://siteviral\\.com/org/${orgSlug}(/[^"'<\\s]*)`, 'g');
  html = html.replace(orgPathPattern, `${orgBaseUrl}$1`);

  // Replace siteviral.com/org/{slug}" → orgBaseUrl"
  const orgPathExact = new RegExp(`https://siteviral\\.com/org/${orgSlug}(["'<\\s])`, 'g');
  html = html.replace(orgPathExact, `${orgBaseUrl}$1`);

  return html;
}

// ═══════════════════════════════════════
// Resolve user's preferred language from email
// ═══════════════════════════════════════
async function resolveUserLang(
  supabaseAdmin: ReturnType<typeof createClient>,
  email: string,
): Promise<Lang> {
  try {
    // Look up user by email → get preferred_language from profile
    const { data: users } = await supabaseAdmin.rpc('get_user_id_by_email_for_lang', { p_email: email });
    if (users) {
      // Try direct profile lookup via auth
      const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
      // Fallback: query profiles by joining with auth
    }
  } catch { /* ignore */ }

  // Simpler approach: look up profile preferred_language by email
  try {
    const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const authUser = allUsers?.find((u: any) => u.email === email);
    if (authUser) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('preferred_language')
        .eq('id', authUser.id)
        .single();
      if (profile?.preferred_language === 'en') return 'en';
      if (profile?.preferred_language === 'fr') return 'fr';
    }
  } catch { /* ignore */ }

  return 'fr'; // Default to French
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
    const { template, to, data, organization_id, locale: requestLocale } = body;

    if (!template) {
      return new Response(JSON.stringify({ error: 'Missing template' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // If `to` is empty but org_id provided, send to org admins/owners
    const ownerOnly = data?.__owner_only === 1 || data?.__owner_only === '1';
    if (data?.__owner_only !== undefined) delete data.__owner_only;

    let recipients: string[] = [];
    if (to) {
      recipients = [to];
    } else if (organization_id) {
      let query = supabaseAdmin.from('organization_members')
        .select('user_id')
        .eq('organization_id', organization_id);
      if (ownerOnly) {
        query = query.eq('role', 'owner');
      } else {
        query = query.in('role', ['owner', 'admin']);
      }
      const { data: admins } = await query;
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

    // Resolve org domain for link rewriting and sender branding
    let orgDomainInfo: { baseUrl: string; orgName: string } | null = null;
    let orgSlug = '';
    if (organization_id) {
      orgDomainInfo = await resolveOrgDomain(supabaseAdmin, organization_id);
      // Also fetch slug for link rewriting
      const { data: orgData } = await supabaseAdmin
        .from('organizations')
        .select('slug')
        .eq('id', organization_id)
        .single();
      orgSlug = orgData?.slug || '';
    }

    // Pre-render all emails for each recipient
    const renderedEmails: Array<{ recipient: string; from: string; subject: string; html: string; lang: Lang }> = [];
    for (const recipient of recipients) {
      let lang: Lang = requestLocale || 'fr';
      if (!requestLocale) {
        lang = await resolveUserLang(supabaseAdmin, recipient);
      }

      let tpl: { subject: string; html: string; fromOverride?: string };
      try {
        tpl = buildTemplate(template, data, lang);
      } catch {
        return new Response(JSON.stringify({ error: 'Unknown template' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (orgDomainInfo && orgSlug && !orgDomainInfo.baseUrl.includes('siteviral.com/org/')) {
        tpl.html = rewriteOrgLinks(tpl.html, orgSlug, orgDomainInfo.baseUrl);
      }

      const senderName = orgDomainInfo?.orgName || 'Siteviral';
      const fromAddress = tpl.fromOverride || `${senderName} <noreply@siteviral.com>`;

      renderedEmails.push({ recipient, from: fromAddress, subject: tpl.subject, html: tpl.html, lang });
    }

    // Send via Resend Batch API (up to 100 per call) instead of individual calls
    const BATCH_SIZE = 100;
    let allOk = true;
    let lastMessageId = '';

    for (let i = 0; i < renderedEmails.length; i += BATCH_SIZE) {
      const batch = renderedEmails.slice(i, i + BATCH_SIZE);

      const batchPayload = batch.map(e => ({
        from: e.from,
        to: [e.recipient],
        subject: e.subject,
        html: e.html,
      }));

      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(batchPayload),
      });

      const result = await res.json();

      // Batch API returns { data: [{ id }, { id }, ...] } on success
      const batchResults = result.data || [];

      for (let j = 0; j < batch.length; j++) {
        const email = batch[j];
        const emailResult = batchResults[j];
        const ok = res.ok && !!emailResult?.id;
        if (!ok) allOk = false;
        if (emailResult?.id) lastMessageId = emailResult.id;

        await supabaseAdmin.from('email_logs').insert({
          template,
          recipient: email.recipient,
          subject: email.subject,
          status: ok ? 'sent' : 'failed',
          resend_message_id: emailResult?.id || null,
          error_message: ok ? null : (result.message || result.error || 'Batch send failed'),
          organization_id: organization_id || null,
          metadata: { ...data, _lang: email.lang, _org_domain: orgDomainInfo?.baseUrl || null },
        });
      }
    }

    return new Response(JSON.stringify({ ok: allOk, message_id: lastMessageId, recipients: recipients.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('send_email error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
