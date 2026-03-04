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
  | 'affiliate_new_product' | 'affiliate_new_campaign' | 'affiliate_new_program'
  | 'affiliate_price_changed' | 'affiliate_content_unpublished'
  // Partners
  | 'partner_welcome' | 'partner_rejected' | 'partner_suspended' | 'partner_unsuspended'
  | 'partner_kyc_approved' | 'partner_kyc_rejected' | 'partner_payout_sent'
  | 'partner_new_referral' | 'partner_commission_earned'
  | 'partner_application_received' | 'partner_level_up'
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
  | 'new_program_published'
  // Comments
  | 'new_comment_received' | 'comment_reply'
  // Subscriptions
  | 'subscription_renewed' | 'subscription_expiring' | 'subscription_cancelled'
  // Offerings
  | 'offering_received' | 'offering_receipt'
  // Programs
  | 'program_enrolled' | 'program_completed' | 'program_new_lesson'
  // Gamification
  | 'badge_earned'
  // Abandoned cart
  | 'abandoned_cart_reminder'
  // Event reminders
  | 'event_reminder_24h'
  // Recaps
  | 'weekly_recap_user' | 'daily_recap_admin' | 'daily_recap_superadmin'
  | 'monthly_recap_org' | 'weekly_ambassador_recap'
  // Superadmin alerts
  | 'fraud_alert' | 'new_org_alert'
  // Misc
  | 'flash_sale_alert' | 'promo_code_used' | 'org_verified'
  | 'waitlist_spot_available' | 'referral_reward'
  // Org creator onboarding sequence
  | 'org_welcome_j0' | 'org_onboarding_j1' | 'org_onboarding_j3';

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
      return { subject: '👋 Bienvenue sur Siteviral', html: wrap(`<h1 style="color:${blue}">Bienvenue sur Siteviral !</h1><p>Bonjour ${d.name || ''},</p><p>Votre compte est prêt. Commencez dès maintenant à explorer la plateforme.</p>${cta('https://siteviral.com/dashboard', 'Accéder à mon espace')}`) };
    case 'onboarding_day1':
      return { subject: '🚀 Complétez votre profil – Siteviral', html: wrap(`<h1 style="color:${blue}">🚀 Plus qu'une étape !</h1><p>Bonjour ${d.name || ''},</p><p>Complétez votre profil pour profiter de toutes les fonctionnalités : ajoutez une photo et une bio.</p>${cta('https://siteviral.com/profile', 'Compléter mon profil')}`) };
    case 'onboarding_day3':
      return { subject: '🏢 Découvrez les organisations – Siteviral', html: wrap(`<h1 style="color:${blue}">🏢 Prêt à vous lancer ?</h1><p>Bonjour ${d.name || ''},</p><p>Créez votre première organisation ou explorez celles qui existent déjà.</p>${cta('https://siteviral.com/marketplace', 'Explorer')}`) };
    case 'onboarding_day7':
      return { subject: '💡 Astuces pour réussir – Siteviral', html: wrap(`<h1 style="color:${blue}">💡 Astuces de croissance</h1><p>Bonjour ${d.name || ''},</p><p>Voici comment tirer le meilleur parti de Siteviral :</p><ul style="color:#ccc"><li>Publiez du contenu pour engager votre audience</li><li>Lancez une campagne de collecte</li><li>Activez les ambassadeurs pour étendre votre portée</li><li>Utilisez les campagnes email pour rester connecté</li></ul>${cta('https://siteviral.com/dashboard', 'Commencer')}`) };
    case 'new_device_login':
      return { subject: '🔒 Nouvelle connexion détectée – Siteviral', html: wrap(`<h1 style="color:${orange}">🔒 Nouvelle Connexion Détectée</h1><p>Une nouvelle connexion à votre compte a été détectée.</p><p><strong>Appareil :</strong> ${d.device || 'Inconnu'}</p><p><strong>Heure :</strong> ${d.time || 'À l\'instant'}</p><p style="color:#999">Si ce n'était pas vous, changez votre mot de passe immédiatement.</p>`) };
    case 'password_changed':
      return { subject: '🔑 Mot de passe modifié – Siteviral', html: wrap(`<h1 style="color:${info}">🔑 Mot de passe modifié</h1><p>Votre mot de passe a été modifié avec succès.</p><p style="color:#999">Si vous n'êtes pas à l'origine de ce changement, contactez <a href="mailto:support@siteviral.com" style="color:${blue}">support@siteviral.com</a> immédiatement.</p>`) };
    case 'email_changed':
      return { subject: '📧 Email mis à jour – Siteviral', html: wrap(`<h1 style="color:${info}">📧 Email mis à jour</h1><p>Votre email a été changé pour <strong>${d.new_email}</strong>.</p><p style="color:#999">Si vous n'êtes pas à l'origine de ce changement, contactez le support immédiatement.</p>`) };
    case 'account_deleted':
      return { subject: '👋 Compte supprimé – Siteviral', html: wrap(`<h1 style="color:${red}">👋 Compte Supprimé</h1><p>Votre compte Siteviral a été définitivement supprimé comme demandé.</p><p>Toutes vos données ont été effacées. Nous sommes désolés de vous voir partir.</p>`) };
    case 'data_export_ready':
      return { subject: '📦 Vos données sont prêtes – Siteviral', html: wrap(`<h1 style="color:${blue}">📦 Export de données prêt</h1><p>Votre export de données est prêt à être téléchargé.</p><p style="color:#999">Le lien expire dans 48 heures.</p>${cta(String(d.download_link || '#'), 'Télécharger mes données')}`) };

    // ═══ RE-ENGAGEMENT ═══
    case 'inactive_7d':
      return { subject: '👀 Vous nous manquez ! – Siteviral', html: wrap(`<h1 style="color:${blue}">👀 Vous nous manquez !</h1><p>Bonjour ${d.name || ''},</p><p>Cela fait une semaine que vous ne vous êtes pas connecté. Voici ce que vous avez peut-être manqué :</p><p>• ${d.updates || 'Du nouveau contenu vous attend'}</p>${cta('https://siteviral.com/marketplace', 'Voir les nouveautés')}`) };
    case 'inactive_14d':
      return { subject: '🔔 Vos communautés vous attendent – Siteviral', html: wrap(`<h1 style="color:${orange}">🔔 Vos communautés vous attendent</h1><p>Bonjour ${d.name || ''},</p><p>Cela fait 2 semaines ! De nouveaux contenus, événements et mises à jour vous attendent.</p>${cta('https://siteviral.com/marketplace', 'Revenir')}`) };
    case 'inactive_30d':
      return { subject: '❤️ Revenez sur Siteviral', html: wrap(`<h1 style="color:${red}">❤️ Revenez nous voir</h1><p>Bonjour ${d.name || ''},</p><p>Cela fait un mois depuis votre dernière visite. Votre communauté vous attend !</p><p>Besoin d'aide ? Répondez à cet email ou contactez <a href="mailto:support@siteviral.com" style="color:${blue}">support@siteviral.com</a>.</p>${cta('https://siteviral.com', 'Se reconnecter')}`) };
    case 'anniversary_1y':
      return { subject: '🎂 1 an sur Siteviral !', html: wrap(`<h1 style="color:${green}">🎂 Joyeux anniversaire !</h1><p>Bonjour ${d.name || ''},</p><p>Cela fait <strong>1 an</strong> que vous avez rejoint Siteviral ! Voici votre année en résumé :</p><ul style="color:#ccc"><li>Organisations rejointes : ${d.orgs_count || 0}</li></ul><p>Merci de faire partie de la communauté ! 🎉</p>`) };

    // ═══ DONATIONS ═══
    case 'donation_receipt':
      return { subject: `Reçu de don – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🙏 Reçu de Don</h1><p>Merci pour votre don de <strong>${d.amount} ${d.currency}</strong> à <strong>${d.org_name}</strong>.</p><p>Référence : <code>${d.reference}</code></p><p>Date : ${d.date}</p><p>Merci pour votre générosité.</p>`) };
    case 'new_donation_received':
      return { subject: `💰 Nouveau don – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">💰 Nouveau Don Reçu</h1><p><strong>${d.donor_name || 'Anonyme'}</strong> a fait un don de <strong>${d.amount} ${d.currency}</strong> à <strong>${d.org_name}</strong>.</p><p>Campagne : ${d.campaign_name || 'Général'}</p><p>Référence : <code>${d.reference}</code></p>`) };
    case 'first_donation_milestone':
      return { subject: `🎉 Premier don reçu ! – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🎉 Premier Don !</h1><p>Félicitations ! <strong>${d.org_name}</strong> a reçu son tout premier don de <strong>${d.amount} ${d.currency}</strong>.</p><p>Ce n'est que le début ! 🚀</p>`) };
    case 'campaign_goal_reached':
      return { subject: `🏆 Objectif atteint – ${d.campaign_name}`, html: wrap(`<h1 style="color:${green}">🏆 Objectif Atteint !</h1><p>La campagne <strong>"${d.campaign_name}"</strong> pour <strong>${d.org_name}</strong> a atteint son objectif de <strong>${d.goal_amount} ${d.currency}</strong> !</p><p>Montant actuel : ${d.current_amount} ${d.currency}</p>`) };
    case 'campaign_expiring_soon':
      return { subject: `⏰ Campagne bientôt terminée – ${d.campaign_name}`, html: wrap(`<h1 style="color:${orange}">⏰ Campagne Bientôt Terminée</h1><p>La campagne <strong>"${d.campaign_name}"</strong> pour <strong>${d.org_name}</strong> se termine dans <strong>${d.days_left} jours</strong>.</p><p>Progression : ${d.current_amount}/${d.goal_amount} ${d.currency}</p>`) };
    case 'payment_failed':
      return { subject: `❌ Échec du paiement – ${d.reference || ''}`, html: wrap(`<h1 style="color:${red}">❌ Échec du Paiement</h1><p>Votre paiement de <strong>${d.amount} ${d.currency}</strong> n'a pas pu être traité.</p><p>Référence : <code>${d.reference}</code></p><p>Veuillez réessayer ou utiliser un autre moyen de paiement.</p>${cta('https://siteviral.com', 'Réessayer')}`) };

    // ═══ PRODUCTS & PURCHASES ═══
    case 'purchase_confirmation':
      return { subject: `Achat confirmé – ${d.product_name}`, html: wrap(`<h1 style="color:${blue}">✅ Achat Confirmé</h1><p>Vous avez acheté <strong>${d.product_name}</strong> auprès de <strong>${d.org_name}</strong>.</p><p>Montant : ${d.amount} ${d.currency}</p><p>Référence : <code>${d.reference}</code></p>${d.access_link ? cta(String(d.access_link), 'Accéder à mon achat →') : ''}<p style="color:#999">Votre ressource est disponible dans votre bibliothèque « Mes achats ».</p>`) };
    case 'new_purchase_received':
      return { subject: `🛒 Nouvelle vente – ${d.product_name}`, html: wrap(`<h1 style="color:${green}">🛒 Nouvelle Vente</h1><p><strong>${d.buyer_name || 'Un client'}</strong> a acheté <strong>${d.product_name}</strong> pour <strong>${d.amount} ${d.currency}</strong>.</p><p>Référence : <code>${d.reference}</code></p>`) };
    case 'download_ready':
      return { subject: `📥 Votre téléchargement est prêt – ${d.product_name}`, html: wrap(`<h1 style="color:${blue}">📥 Téléchargement Prêt</h1><p>Votre achat de <strong>${d.product_name}</strong> est prêt à être téléchargé.</p>${cta(String(d.download_link), 'Télécharger maintenant →')}<p style="font-size:12px;color:#999">Ce lien expire dans 24 heures.</p>`) };
    case 'first_sale_milestone':
      return { subject: `🎉 Première vente ! – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🎉 Première Vente !</h1><p>Félicitations ! <strong>${d.org_name}</strong> a réalisé sa première vente : <strong>${d.product_name}</strong> pour <strong>${d.amount} ${d.currency}</strong>.</p><p>Continuez comme ça ! 🚀</p>`) };

    // ═══ KYC ═══
    case 'kyc_submitted':
      return { subject: `KYC soumis – ${d.org_name}`, html: wrap(`<h1 style="color:${info}">📄 KYC Soumis</h1><p>Vos documents KYC pour <strong>${d.org_name}</strong> ont été soumis avec succès.</p><p>Nous les examinerons sous 2 à 3 jours ouvrés.</p>`) };
    case 'kyc_approved':
      return { subject: `KYC approuvé – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">✅ KYC Approuvé</h1><p>Votre vérification KYC pour <strong>${d.org_name}</strong> a été approuvée.</p><p>Vous pouvez maintenant activer les fonctions de monétisation.</p>`) };
    case 'kyc_rejected':
      return { subject: `KYC – Action requise – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">❌ KYC Non Approuvé</h1><p>Votre soumission KYC pour <strong>${d.org_name}</strong> n'a pas été approuvée.</p><p>Raison : ${d.reason || 'Veuillez contacter le support.'}</p>`) };

    // ═══ ORG LIFECYCLE ═══
    case 'org_created':
      return { subject: `🏢 Organisation créée – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🏢 Organisation Créée</h1><p>Votre organisation <strong>${d.org_name}</strong> a été créée avec succès.</p><p>Prochaines étapes : complétez votre profil, invitez des membres et commencez à publier du contenu.</p>`) };
    case 'org_deleted':
      return { subject: `Organisation supprimée – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">🗑 Organisation Supprimée</h1><p>L'organisation <strong>${d.org_name}</strong> a été définitivement supprimée.</p>${d.reason ? `<p>Raison : ${d.reason}</p>` : ''}`) };
    case 'org_suspended':
      return { subject: `⚠️ Organisation suspendue – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">⚠️ Organisation Suspendue</h1><p>Votre organisation <strong>${d.org_name}</strong> a été suspendue.</p><p>Raison : ${d.reason || 'Violation des conditions d\'utilisation.'}</p>${d.until ? `<p>Suspendue jusqu'au : ${d.until}</p>` : ''}<p>Contactez <a href="mailto:support@siteviral.com" style="color:${blue}">support@siteviral.com</a>.</p>`) };
    case 'org_unsuspended':
      return { subject: `✅ Suspension levée – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">✅ Suspension Levée</h1><p>Votre organisation <strong>${d.org_name}</strong> est de nouveau active.</p>`) };
    case 'org_inactive_30d':
      return { subject: `📊 Votre organisation a besoin d'attention – ${d.org_name}`, html: wrap(`<h1 style="color:${orange}">📊 Organisation Inactive</h1><p>Bonjour,</p><p>Votre organisation <strong>${d.org_name}</strong> n'a eu aucune activité depuis 30 jours.</p><p>Publiez du contenu, créez des événements ou lancez une campagne pour réengager vos membres !</p>${cta('https://siteviral.com/admin', 'Accéder au tableau de bord')}`) };
    case 'member_milestone':
      return { subject: `🎉 ${d.count} membres ! – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🎉 Cap franchi !</h1><p><strong>${d.org_name}</strong> compte désormais <strong>${d.count} membres</strong> !</p><p>Continuez à grandir ! 🚀</p>`) };

    // ═══ ORG CREATOR ONBOARDING SEQUENCE ═══
    case 'org_welcome_j0':
      return { subject: `🚀 Votre plateforme est prête – ${d.name}`, html: wrap(`<h1 style="color:${blue}">🚀 Bienvenue, créateur !</h1><p>Votre plateforme <strong>${d.name}</strong> vient d'être créée sur Siteviral.</p><p>Voici vos 3 premières étapes :</p><ol style="color:#ccc"><li><strong>Ajoutez votre logo</strong> – les visuels inspirent confiance</li><li><strong>Cliquez sur « Démarrage Express »</strong> pour créer un produit + campagne en 1 clic</li><li><strong>Partagez votre lien</strong> : <code>siteviral.com/org/${d.slug}</code></li></ol>${cta('https://siteviral.com/admin', 'Accéder à mon tableau de bord')}<p style="font-size:12px;color:#999">Vous pouvez publier et recevoir des paiements immédiatement. La vérification KYC n'est requise que pour les retraits.</p>`) };
    case 'org_onboarding_j1':
      return { subject: `📌 Avez-vous publié votre premier contenu ? – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📌 Jour 1 — Premiers pas</h1><p>Bonjour,</p><p>Votre plateforme <strong>${d.org_name}</strong> a été créée hier. Avez-vous ajouté votre premier contenu ?</p><p style="background:#222;padding:12px;border-radius:8px;color:#ffdd57;font-size:13px">💡 ${d.tip}</p><p>Voici ce que vous pouvez faire aujourd'hui :</p><ul style="color:#ccc"><li>Publier un média (vidéo, audio, article)</li><li>Créer un produit ou un ebook</li><li>Lancer votre première campagne de dons</li></ul>${cta('https://siteviral.com/admin', 'Ouvrir mon dashboard')}`) };
    case 'org_onboarding_j3':
      return { subject: `🤝 Activez vos ambassadeurs – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🤝 Jour 3 — Passez à la vitesse supérieure</h1><p>Bonjour,</p><p>Votre plateforme <strong>${d.org_name}</strong> a 3 jours. C'est le moment d'activer la croissance virale !</p><p style="background:#222;padding:12px;border-radius:8px;color:#ffdd57;font-size:13px">💡 ${d.tip}</p><p><strong>Le Programme Ambassadeur</strong> permet à chaque visiteur de devenir promoteur de vos ressources et de gagner des commissions sur chaque vente.</p><ul style="color:#ccc"><li>Commission par défaut : 10%</li><li>Lien unique pour chaque ambassadeur</li><li>Suivi en temps réel des ventes</li></ul>${cta('https://siteviral.com/admin/settings', 'Activer les Ambassadeurs')}<p style="font-size:12px;color:#999">Programme Ambassadeur actuellement : <strong>${d.affiliation_enabled === 'oui' ? '✅ Activé' : '❌ Désactivé'}</strong></p>`) };

    // ═══ MEMBERS ═══
    case 'new_member_joined':
      return { subject: `👤 Nouveau membre – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">👤 Nouveau Membre</h1><p><strong>${d.member_name || 'Quelqu\'un'}</strong> vient de rejoindre <strong>${d.org_name}</strong>.</p><p>Total membres : ${d.total_members || 'N/A'}</p>`) };
    case 'member_left':
      return { subject: `Membre parti – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">👋 Départ d'un Membre</h1><p><strong>${d.member_name || 'Un membre'}</strong> a quitté <strong>${d.org_name}</strong>.</p>`) };
    case 'invite_to_org':
      return { subject: `Invitation à rejoindre ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📩 Vous êtes invité</h1><p><strong>${d.inviter_name || 'Quelqu\'un'}</strong> vous invite à rejoindre <strong>${d.org_name}</strong> sur Siteviral.</p>${cta(String(d.invite_link || 'https://siteviral.com'), 'Accepter l\'invitation →')}`) };
    case 'role_changed':
      return { subject: `Rôle mis à jour – ${d.org_name}`, html: wrap(`<h1 style="color:${info}">🔄 Rôle Mis à Jour</h1><p>Votre rôle dans <strong>${d.org_name}</strong> a été changé en <strong>${d.new_role}</strong>.</p>${d.old_role ? `<p>Ancien rôle : ${d.old_role}</p>` : ''}`) };
    case 'invite_accepted':
      return { subject: `✅ Invitation acceptée – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">✅ Invitation Acceptée</h1><p><strong>${d.member_name}</strong> a accepté votre invitation à rejoindre <strong>${d.org_name}</strong>.</p>`) };

    // ═══ PAYOUTS ═══
    case 'payout_requested':
      return { subject: `💸 Retrait demandé – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${blue}">💸 Retrait Demandé</h1><p>Un retrait de <strong>${d.amount} ${d.currency}</strong> a été demandé pour <strong>${d.org_name}</strong>.</p><p>Délai de traitement : 3 à 5 jours ouvrés.</p>`) };
    case 'payout_approved':
      return { subject: `✅ Retrait approuvé – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">✅ Retrait Approuvé</h1><p>Votre retrait de <strong>${d.amount} ${d.currency}</strong> pour <strong>${d.org_name}</strong> a été approuvé et est en cours de traitement.</p>`) };
    case 'payout_rejected':
      return { subject: `Retrait refusé – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">❌ Retrait Refusé</h1><p>Votre demande de retrait pour <strong>${d.org_name}</strong> a été refusée.</p><p>Raison : ${d.reason || 'Veuillez contacter le support.'}</p>`) };
    case 'payouts_frozen':
      return { subject: `⚠️ Retraits gelés – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">🧊 Retraits Gelés</h1><p>Les retraits pour <strong>${d.org_name}</strong> ont été temporairement gelés.</p><p>Raison : ${d.reason || 'En cours de vérification.'}</p>${d.until ? `<p>Gelés jusqu'au : ${d.until}</p>` : ''}<p>Contactez <a href="mailto:support@siteviral.com" style="color:${blue}">support@siteviral.com</a>.</p>`) };

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

    // ═══ AFFILIATE CONTENT NOTIFICATIONS ═══
    case 'affiliate_new_product':
      return { subject: `🚀 Nouveau produit à promouvoir – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🚀 Nouveau Produit Disponible !</h1><p><strong>${d.org_name}</strong> vient d'ajouter un nouveau produit :</p><p style="font-size:18px;font-weight:bold;color:#fff">"${d.content_title}"</p>${d.price ? `<p>Prix : <strong>${d.price} ${d.currency || 'XOF'}</strong></p>` : ''}<p>Partagez-le avec votre audience pour gagner des commissions sur chaque vente !</p>${cta(d.org_link || 'https://siteviral.com', 'Voir le produit')}`) };
    case 'affiliate_new_program':
      return { subject: `🎓 Nouvelle formation à promouvoir – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🎓 Nouvelle Formation Disponible</h1><p><strong>${d.org_name}</strong> propose une nouvelle formation :</p><p style="font-size:18px;font-weight:bold;color:#fff">"${d.content_title}"</p><p>Partagez-la pour gagner des commissions sur chaque inscription !</p>${cta(d.org_link || 'https://siteviral.com', 'Voir la formation')}`) };
    case 'affiliate_price_changed':
      return { subject: `💲 Changement de prix – "${d.content_title}"`, html: wrap(`<h1 style="color:${orange}">💲 Prix Modifié</h1><p>Le prix de <strong>"${d.content_title}"</strong> chez <strong>${d.org_name}</strong> a changé :</p><p style="font-size:16px">Ancien prix : <span style="text-decoration:line-through">${d.old_price} ${d.currency}</span></p><p style="font-size:18px;color:${green}">Nouveau prix : <strong>${d.new_price} ${d.currency}</strong></p><p>Mettez à jour vos communications en conséquence.</p>`) };
    case 'affiliate_content_unpublished':
      return { subject: `⚠️ Contenu retiré – "${d.content_title}"`, html: wrap(`<h1 style="color:${orange}">⚠️ Contenu Dépublié</h1><p>Le ${d.content_type} <strong>"${d.content_title}"</strong> de <strong>${d.org_name}</strong> a été retiré de la vente.</p><p>Veuillez retirer ce contenu de vos promotions et liens de partage.</p>`) };

    // ═══ PARTNERS ═══
    case 'partner_welcome':
      return { subject: `🤝 Bienvenue, Partenaire ! – Siteviral`, html: wrap(`<h1 style="color:${green}">🤝 Bienvenue au Programme Partenaires !</h1><p>Bonjour <strong>${d.name}</strong>,</p><p>Votre candidature au Programme Partenaires Siteviral a été <strong>approuvée</strong> ! 🎉</p><p>Voici votre code d'invitation :</p><code style="display:block;background:#222;padding:16px;border-radius:8px;text-align:center;font-size:18px;letter-spacing:2px;margin:16px 0;color:${blue}">${d.invite_code}</code><p>Partagez ce code avec les responsables d'organisations. Chaque plateforme créée avec votre code vous génère des commissions récurrentes.</p><h3 style="color:#ccc;margin-top:20px">📊 Votre niveau actuel : <span style="color:#cd7f32">Bronze</span></h3><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr style="background:#222"><td style="padding:10px;border:1px solid #333;color:#cd7f32;font-weight:bold">🥉 Bronze</td><td style="padding:10px;border:1px solid #333;color:#ccc">10+ orgs</td><td style="padding:10px;border:1px solid #333;color:#fff;font-weight:bold">5%</td></tr><tr style="background:#1a1a1a"><td style="padding:10px;border:1px solid #333;color:#c0c0c0;font-weight:bold">🥈 Argent</td><td style="padding:10px;border:1px solid #333;color:#ccc">50+ orgs</td><td style="padding:10px;border:1px solid #333;color:#fff;font-weight:bold">8%</td></tr><tr style="background:#222"><td style="padding:10px;border:1px solid #333;color:#ffd700;font-weight:bold">🥇 Or</td><td style="padding:10px;border:1px solid #333;color:#ccc">150+ orgs</td><td style="padding:10px;border:1px solid #333;color:#fff;font-weight:bold">10%</td></tr><tr style="background:#1a1a1a"><td style="padding:10px;border:1px solid #333;color:#60a5fa;font-weight:bold">💎 Platine</td><td style="padding:10px;border:1px solid #333;color:#ccc">300+ orgs</td><td style="padding:10px;border:1px solid #333;color:#fff;font-weight:bold">12%</td></tr><tr style="background:#222"><td style="padding:10px;border:1px solid #333;color:#a78bfa;font-weight:bold">👑 Diamant</td><td style="padding:10px;border:1px solid #333;color:#ccc">1 000+ orgs</td><td style="padding:10px;border:1px solid #333;color:#fff;font-weight:bold">15%</td></tr></table><h3 style="color:#ccc;margin-top:24px">Prochaines étapes :</h3><ol style="color:#ccc"><li>Connectez-vous à votre <a href="https://siteviral.com/partner" style="color:${blue}">Espace Partenaire</a></li><li>Complétez votre <strong>vérification KYC</strong> (requise avant le premier paiement)</li><li>Configurez votre méthode de paiement</li><li>Commencez à inviter des organisations !</li></ol>${cta('https://siteviral.com/partner', 'Accéder à mon Espace Partenaire')}`) };
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

    case 'partner_application_received':
      return { subject: `📩 Candidature partenaire reçue – Siteviral`, html: wrap(`<h1 style="color:${blue}">📩 Candidature Reçue</h1><p>Bonjour <strong>${d.name}</strong>,</p><p>Nous avons bien reçu votre candidature au <strong>Programme Partenaires Siteviral</strong>. Notre équipe l'examinera dans un délai de <strong>24 à 48 heures</strong>.</p><h3 style="color:#ccc;margin-top:20px">📊 Niveaux du Programme Partenaires</h3><p style="color:#999">Vous démarrez au niveau <strong style="color:#cd7f32">Bronze</strong>. Voici comment progresser :</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr style="background:#222"><td style="padding:10px;border:1px solid #333;color:#cd7f32;font-weight:bold">🥉 Bronze</td><td style="padding:10px;border:1px solid #333;color:#ccc">10+ orgs actives</td><td style="padding:10px;border:1px solid #333;color:#fff;font-weight:bold">5%</td></tr><tr style="background:#1a1a1a"><td style="padding:10px;border:1px solid #333;color:#c0c0c0;font-weight:bold">🥈 Argent</td><td style="padding:10px;border:1px solid #333;color:#ccc">50+ orgs actives</td><td style="padding:10px;border:1px solid #333;color:#fff;font-weight:bold">8%</td></tr><tr style="background:#222"><td style="padding:10px;border:1px solid #333;color:#ffd700;font-weight:bold">🥇 Or</td><td style="padding:10px;border:1px solid #333;color:#ccc">150+ orgs actives</td><td style="padding:10px;border:1px solid #333;color:#fff;font-weight:bold">10%</td></tr><tr style="background:#1a1a1a"><td style="padding:10px;border:1px solid #333;color:#60a5fa;font-weight:bold">💎 Platine</td><td style="padding:10px;border:1px solid #333;color:#ccc">300+ orgs actives</td><td style="padding:10px;border:1px solid #333;color:#fff;font-weight:bold">12%</td></tr><tr style="background:#222"><td style="padding:10px;border:1px solid #333;color:#a78bfa;font-weight:bold">👑 Diamant</td><td style="padding:10px;border:1px solid #333;color:#ccc">1 000+ orgs actives</td><td style="padding:10px;border:1px solid #333;color:#fff;font-weight:bold">15%</td></tr></table><p style="color:#999;font-size:12px">Les commissions sont calculées sur les <strong>frais de plateforme</strong> uniquement. Les dons sont exclus.</p><h3 style="color:#ccc;margin-top:20px">Prochaines étapes</h3><ol style="color:#ccc"><li>Notre équipe examine votre candidature</li><li>Vous recevrez un email de confirmation (approuvé ou non)</li><li>Si approuvé, vous accéderez à votre Espace Partenaire</li></ol><p style="color:#999">En attendant, vous pouvez consulter le <a href="https://siteviral.com/partner-terms" style="color:${blue}">contrat de partenariat</a>.</p>`) };

    case 'partner_level_up':
      return { subject: `🎉 Félicitations ! Vous passez au niveau ${d.new_level_name} – Siteviral`, html: wrap(`<h1 style="color:${green}">🎉 Niveau Supérieur Atteint !</h1><p>Bonjour <strong>${d.name}</strong>,</p><p>Félicitations ! Vous avez atteint le niveau <strong style="color:${d.new_level_color || '#fff'}">${d.new_level_name}</strong> dans le Programme Partenaires Siteviral ! 🚀</p><p>Votre nouveau taux de commission : <strong style="font-size:24px;color:${green}">${d.new_rate}%</strong></p><h3 style="color:#ccc;margin-top:20px">📊 Votre progression</h3><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr style="background:#222"><td style="padding:10px;border:1px solid #333;color:#ccc">Ancien niveau</td><td style="padding:10px;border:1px solid #333;color:#fff;font-weight:bold">${d.old_level_name}</td></tr><tr style="background:#1a1a1a"><td style="padding:10px;border:1px solid #333;color:#ccc">Nouveau niveau</td><td style="padding:10px;border:1px solid #333;color:${green};font-weight:bold">${d.new_level_name}</td></tr><tr style="background:#222"><td style="padding:10px;border:1px solid #333;color:#ccc">Organisations actives</td><td style="padding:10px;border:1px solid #333;color:#fff;font-weight:bold">${d.active_orgs}</td></tr><tr style="background:#1a1a1a"><td style="padding:10px;border:1px solid #333;color:#ccc">Taux de commission</td><td style="padding:10px;border:1px solid #333;color:${green};font-weight:bold">${d.new_rate}%</td></tr></table><h3 style="color:#ccc;margin-top:20px">📊 Tous les niveaux</h3><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr style="background:#222"><td style="padding:10px;border:1px solid #333;color:#cd7f32;font-weight:bold">🥉 Bronze</td><td style="padding:10px;border:1px solid #333;color:#ccc">10+ orgs</td><td style="padding:10px;border:1px solid #333;color:#fff">5%</td></tr><tr style="background:#1a1a1a"><td style="padding:10px;border:1px solid #333;color:#c0c0c0;font-weight:bold">🥈 Argent</td><td style="padding:10px;border:1px solid #333;color:#ccc">50+ orgs</td><td style="padding:10px;border:1px solid #333;color:#fff">8%</td></tr><tr style="background:#222"><td style="padding:10px;border:1px solid #333;color:#ffd700;font-weight:bold">🥇 Or</td><td style="padding:10px;border:1px solid #333;color:#ccc">150+ orgs</td><td style="padding:10px;border:1px solid #333;color:#fff">10%</td></tr><tr style="background:#1a1a1a"><td style="padding:10px;border:1px solid #333;color:#60a5fa;font-weight:bold">💎 Platine</td><td style="padding:10px;border:1px solid #333;color:#ccc">300+ orgs</td><td style="padding:10px;border:1px solid #333;color:#fff">12%</td></tr><tr style="background:#222"><td style="padding:10px;border:1px solid #333;color:#a78bfa;font-weight:bold">👑 Diamant</td><td style="padding:10px;border:1px solid #333;color:#ccc">1 000+ orgs</td><td style="padding:10px;border:1px solid #333;color:#fff">15%</td></tr></table>${cta('https://siteviral.com/portail-partenaire', 'Mon Espace Partenaire')}`) };

    // ═══ DIRECTORY ═══
    case 'directory_approved':
      return { subject: `🌟 Référencement approuvé – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🌟 Référencement Approuvé</h1><p>Votre organisation <strong>${d.org_name}</strong> a été approuvée pour le répertoire Siteviral.</p>`) };
    case 'directory_rejected':
      return { subject: `Référencement – Mise à jour – ${d.org_name}`, html: wrap(`<h1 style="color:${red}">❌ Demande de Référencement Refusée</h1><p>Votre demande de référencement pour <strong>${d.org_name}</strong> n'a pas été approuvée.</p><p>Raison : ${d.reason || 'Ne remplit pas les critères de référencement.'}</p>`) };

    // ═══ SUPPORT ═══
    case 'ticket_created':
      return { subject: `🎫 Ticket #${d.ticket_id || ''} créé`, html: wrap(`<h1 style="color:${blue}">🎫 Ticket Créé</h1><p>Votre ticket de support a été créé.</p><p><strong>Sujet :</strong> ${d.subject}</p><p><strong>Catégorie :</strong> ${d.category}</p><p>Notre équipe vous répondra sous 24 à 48 heures.</p>`) };
    case 'ticket_replied':
      return { subject: `💬 Réponse au ticket #${d.ticket_id || ''}`, html: wrap(`<h1 style="color:${info}">💬 Nouvelle Réponse</h1><p>Un agent de support a répondu à votre ticket :</p><div style="background:#222;border-radius:8px;padding:16px;margin:12px 0;border-left:3px solid ${blue}">${d.reply_preview || 'Consultez la réponse complète dans votre Centre de Support.'}</div>${cta('https://siteviral.com/support', 'Voir le ticket →')}`) };
    case 'ticket_resolved':
      return { subject: `✅ Ticket résolu #${d.ticket_id || ''}`, html: wrap(`<h1 style="color:${green}">✅ Ticket Résolu</h1><p>Votre ticket de support <strong>${d.subject}</strong> a été marqué comme résolu.</p>`) };

    // ═══ REFUNDS ═══
    case 'refund_initiated':
      return { subject: `🔄 Demande de remboursement reçue – ${d.reference || ''}`, html: wrap(`<h1 style="color:${info}">🔄 Demande de Remboursement Reçue</h1><p>Nous avons reçu votre demande de remboursement de <strong>${d.amount} ${d.currency}</strong>.</p><p>Produit/Don : ${d.item_name || 'N/A'}</p><p>Référence : <code>${d.reference}</code></p><p>Examen sous 3 à 5 jours ouvrés.</p>`) };
    case 'refund_completed':
      return { subject: `✅ Remboursement traité – ${d.amount} ${d.currency}`, html: wrap(`<h1 style="color:${green}">✅ Remboursement Traité</h1><p>Votre remboursement de <strong>${d.amount} ${d.currency}</strong> a été traité.</p><p>Référence : <code>${d.reference}</code></p><p>Les fonds seront visibles sous 5 à 10 jours ouvrés.</p>`) };

    // ═══ CONTENT & SOCIAL ═══
    case 'content_report_resolved':
      return { subject: `Signalement traité`, html: wrap(`<h1 style="color:${info}">📋 Signalement Traité</h1><p>Votre signalement de contenu a été examiné et traité.</p><p>Type de contenu : ${d.content_type}</p><p>Action prise : ${d.action_taken || 'Examiné et traité.'}</p>`) };
    case 'content_liked':
      return { subject: `❤️ Quelqu'un a aimé votre contenu`, html: wrap(`<h1 style="color:${red}">❤️ Nouveau Like</h1><p><strong>${d.liker_name || 'Quelqu\'un'}</strong> a aimé votre ${d.content_type || 'contenu'} : <strong>"${d.content_title}"</strong>.</p>`) };
    case 'content_saved':
      return { subject: `🔖 Quelqu'un a sauvegardé votre contenu`, html: wrap(`<h1 style="color:${blue}">🔖 Contenu Sauvegardé</h1><p><strong>${d.saver_name || 'Quelqu\'un'}</strong> a sauvegardé votre ${d.content_type || 'contenu'} : <strong>"${d.content_title}"</strong>.</p>`) };
    case 'new_event_published':
      return { subject: `📅 Nouvel événement – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📅 Nouvel Événement</h1><p><strong>${d.org_name}</strong> a publié un nouvel événement : <strong>"${d.event_title}"</strong>.</p>${d.event_date ? `<p>Date : ${d.event_date}</p>` : ''}${cta(String(d.event_link || '#'), 'Voir l\'événement')}`) };
    case 'new_announcement_published':
      return { subject: `📢 Nouvelle annonce – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📢 Nouvelle Annonce</h1><p><strong>${d.org_name}</strong> a publié : <strong>"${d.announcement_title}"</strong>.</p>${cta(String(d.org_link || '#'), 'Lire la suite')}`) };
    case 'new_media_published':
      return { subject: `🎬 Nouveau contenu – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🎬 Nouveau Contenu</h1><p><strong>${d.org_name}</strong> a publié : <strong>"${d.media_title}"</strong>.</p>${cta(String(d.media_link || '#'), 'Regarder maintenant')}`) };
    case 'new_product_published':
      return { subject: `🛍 Nouveau produit – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🛍 Nouveau Produit</h1><p><strong>${d.org_name}</strong> a mis en ligne un nouveau produit : <strong>"${d.product_name}"</strong>.</p>${d.price ? `<p>Prix : ${d.price} ${d.currency || 'XOF'}</p>` : '<p>Gratuit !</p>'}${cta(String(d.product_link || '#'), 'Voir le produit')}`) };
    case 'new_campaign_published':
      return { subject: `🎯 Nouvelle campagne – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🎯 Nouvelle Campagne</h1><p><strong>${d.org_name}</strong> a lancé : <strong>"${d.campaign_name}"</strong>.</p>${d.goal_amount ? `<p>Objectif : ${d.goal_amount} ${d.currency || 'XOF'}</p>` : ''}${cta(String(d.campaign_link || '#'), 'Contribuer')}`) };
    case 'new_program_published':
      return { subject: `🎓 Nouveau programme – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🎓 Nouveau Programme</h1><p><strong>${d.org_name}</strong> a lancé : <strong>"${d.program_name}"</strong>.</p>${cta(String(d.program_link || '#'), 'S\'inscrire')}`) };

    // ═══ RECAPS ═══
    case 'weekly_recap_user':
      return { subject: `📬 Votre récap hebdomadaire – Siteviral`, html: wrap(`<h1 style="color:${blue}">📬 Récap Hebdomadaire</h1><p>Bonjour ${d.name || ''}, voici votre semaine en résumé :</p><ul style="color:#ccc"><li>Nouveaux contenus : ${d.new_content || 0}</li><li>Événements à venir : ${d.upcoming_events || 0}</li><li>Notifications : ${d.unread_notifications || 0}</li></ul>${cta('https://siteviral.com/marketplace', 'Voir les nouveautés')}`) };
    case 'daily_recap_admin':
      return { subject: `📊 Rapport quotidien – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📊 Rapport Quotidien</h1><p><strong>${d.org_name}</strong> – ${d.date}</p><ul style="color:#ccc"><li>Revenus : ${d.revenue || 0} ${d.currency || 'XOF'}</li><li>Nouveaux membres : ${d.new_members || 0}</li><li>Transactions : ${d.transactions || 0}</li><li>Vues : ${d.page_views || 0}</li></ul>`) };
    case 'daily_recap_superadmin':
      return { subject: `🔷 Rapport quotidien plateforme – Siteviral`, html: wrap(`<h1 style="color:${blue}">🔷 Rapport Plateforme – ${d.date}</h1><ul style="color:#ccc"><li>GMV : ${d.gmv || 0} XOF</li><li>Frais plateforme : ${d.platform_fees || 0} XOF</li><li>Nouveaux utilisateurs : ${d.new_users || 0}</li><li>Nouvelles organisations : ${d.new_orgs || 0}</li><li>Transactions totales : ${d.total_transactions || 0}</li></ul>`) };

    // ═══ SUPERADMIN ALERTS ═══
    case 'fraud_alert':
      return { subject: `🚨 Alerte fraude – ${d.org_name || 'Plateforme'}`, html: wrap(`<h1 style="color:${red}">🚨 Alerte Fraude</h1><p>Activité suspecte détectée :</p><p><strong>Type :</strong> ${d.reason}</p><p><strong>Organisation :</strong> ${d.org_name || 'N/A'}</p><p><strong>Utilisateur :</strong> ${d.user_email || 'N/A'}</p>${cta('https://siteviral.com/superadmin/risk', 'Examiner maintenant')}`) };
    case 'new_org_alert':
      return { subject: `🏢 Nouvelle organisation créée – ${d.org_name}`, html: wrap(`<h1 style="color:${info}">🏢 Nouvelle Organisation</h1><p>Une nouvelle organisation a été créée :</p><p><strong>Nom :</strong> ${d.org_name}</p><p><strong>Catégorie :</strong> ${d.category || 'N/A'}</p><p><strong>Propriétaire :</strong> ${d.owner_email || 'N/A'}</p>${cta('https://siteviral.com/superadmin/directory', 'Examiner')}`) };

    // ═══ COMMENTS ═══
    case 'new_comment_received':
      return { subject: `💬 Nouveau commentaire – ${d.content_title}`, html: wrap(`<h1 style="color:${blue}">💬 Nouveau Commentaire</h1><p><strong>${d.commenter_name || 'Quelqu\'un'}</strong> a commenté votre ${d.content_type || 'contenu'} : <strong>"${d.content_title}"</strong>.</p><div style="background:#222;border-radius:8px;padding:12px;margin:12px 0;border-left:3px solid ${blue};color:#ccc">${d.comment_preview || ''}</div>${cta('https://siteviral.com/feed', 'Voir le commentaire')}`) };
    case 'comment_reply':
      return { subject: `↩️ Réponse à votre commentaire`, html: wrap(`<h1 style="color:${blue}">↩️ Réponse à Votre Commentaire</h1><p><strong>${d.replier_name || 'Quelqu\'un'}</strong> a répondu à votre commentaire sur <strong>"${d.content_title}"</strong>.</p><div style="background:#222;border-radius:8px;padding:12px;margin:12px 0;border-left:3px solid ${blue};color:#ccc">${d.reply_preview || ''}</div>${cta('https://siteviral.com/feed', 'Voir la réponse')}`) };

    // ═══ SUBSCRIPTIONS ═══
    case 'subscription_renewed':
      return { subject: `🔄 Abonnement renouvelé – ${d.plan_name}`, html: wrap(`<h1 style="color:${green}">🔄 Abonnement Renouvelé</h1><p>Votre abonnement <strong>"${d.plan_name}"</strong> sur <strong>${d.org_name}</strong> a été renouvelé.</p><p>Montant : ${d.amount} ${d.currency}</p><p>Prochain renouvellement : ${d.next_date}</p>`) };
    case 'subscription_expiring':
      return { subject: `⏰ Abonnement bientôt expiré – ${d.plan_name}`, html: wrap(`<h1 style="color:${orange}">⏰ Abonnement Bientôt Expiré</h1><p>Votre abonnement <strong>"${d.plan_name}"</strong> sur <strong>${d.org_name}</strong> expire le <strong>${d.expiry_date}</strong>.</p><p>Renouvelez maintenant pour ne pas perdre l'accès.</p>${cta('https://siteviral.com/dashboard', 'Renouveler')}`) };
    case 'subscription_cancelled':
      return { subject: `🚫 Abonnement annulé – ${d.plan_name}`, html: wrap(`<h1 style="color:${red}">🚫 Abonnement Annulé</h1><p>Votre abonnement <strong>"${d.plan_name}"</strong> sur <strong>${d.org_name}</strong> a été annulé.</p><p>Vous conservez l'accès jusqu'à la fin de la période en cours.</p>`) };

    // ═══ OFFERINGS ═══
    case 'offering_received':
      return { subject: `🙏 Offrande reçue – ${d.offering_title}`, html: wrap(`<h1 style="color:${green}">🙏 Offrande Reçue</h1><p><strong>${d.donor_name || 'Quelqu\'un'}</strong> a fait une offrande de <strong>${d.amount} ${d.currency}</strong> pour <strong>"${d.offering_title}"</strong> sur <strong>${d.org_name}</strong>.</p>`) };
    case 'offering_receipt':
      return { subject: `Reçu d'offrande – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">🙏 Reçu d'Offrande</h1><p>Merci pour votre offrande de <strong>${d.amount} ${d.currency}</strong> à <strong>${d.org_name}</strong> pour <strong>"${d.offering_title}"</strong>.</p><p>Merci pour votre générosité. 🙏</p>`) };

    // ═══ PROGRAMS ═══
    case 'program_enrolled':
      return { subject: `🎓 Inscription confirmée – ${d.program_name}`, html: wrap(`<h1 style="color:${blue}">🎓 Inscription Confirmée</h1><p>Vous êtes inscrit au programme <strong>"${d.program_name}"</strong> de <strong>${d.org_name}</strong>.</p><p>Commencez dès maintenant à suivre les modules !</p>${cta('https://siteviral.com/dashboard', 'Commencer le programme')}`) };
    case 'program_completed':
      return { subject: `🏆 Programme terminé – ${d.program_name}`, html: wrap(`<h1 style="color:${green}">🏆 Félicitations !</h1><p>Vous avez complété le programme <strong>"${d.program_name}"</strong> de <strong>${d.org_name}</strong>.</p><p>Continuez à apprendre et grandir ! 🚀</p>`) };
    case 'program_new_lesson':
      return { subject: `📚 Nouvelle leçon – ${d.program_name}`, html: wrap(`<h1 style="color:${blue}">📚 Nouvelle Leçon Disponible</h1><p>Une nouvelle leçon <strong>"${d.lesson_title}"</strong> a été ajoutée au programme <strong>"${d.program_name}"</strong> de <strong>${d.org_name}</strong>.</p>${cta('https://siteviral.com/dashboard', 'Suivre la leçon')}`) };

    // ═══ GAMIFICATION ═══
    case 'badge_earned':
      return { subject: `🏅 Badge obtenu – ${d.badge_name}`, html: wrap(`<h1 style="color:${green}">🏅 Nouveau Badge !</h1><p>Félicitations ! Vous avez obtenu le badge :</p><div style="text-align:center;padding:20px"><p style="font-size:28px;margin:0">🏅</p><p style="font-size:18px;font-weight:bold;color:${blue};margin:8px 0">${d.badge_name}</p><p style="color:#999">${d.badge_description || ''}</p></div>`) };

    // ═══ ABANDONED CART ═══
    case 'abandoned_cart_reminder':
      return { subject: `🛒 Vous avez oublié quelque chose – ${d.product_name}`, html: wrap(`<h1 style="color:${orange}">🛒 Panier Abandonné</h1><p>Vous étiez sur le point d'acquérir <strong>"${d.product_name}"</strong> de <strong>${d.org_name}</strong>.</p><p>Ne manquez pas cette opportunité !</p>${cta(String(d.checkout_link || 'https://siteviral.com'), 'Finaliser mon achat →')}<p style="font-size:12px;color:#999">Si vous avez déjà finalisé votre achat, ignorez ce message.</p>`) };

    // ═══ EVENT REMINDER ═══
    case 'event_reminder_24h':
      return { subject: `📅 Rappel – ${d.event_title} demain !`, html: wrap(`<h1 style="color:${blue}">📅 Événement Demain !</h1><p>L'événement <strong>"${d.event_title}"</strong> de <strong>${d.org_name}</strong> a lieu demain.</p><p>📍 Lieu : ${d.event_location || 'Non précisé'}</p><p>🕐 Date : ${d.event_date}</p>${cta('https://siteviral.com/feed', 'Voir les détails')}`) };

    // ═══ PARTNERS (REFERRALS) ═══
    case 'partner_new_referral':
      return { subject: `🤝 Nouveau referral – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">🤝 Nouveau Referral !</h1><p>Bonjour <strong>${d.partner_name}</strong>,</p><p>L'organisation <strong>"${d.org_name}"</strong> a été créée avec votre code d'invitation.</p><p>Elle génère désormais des commissions pour vous sur chaque transaction sur la plateforme.</p>${cta('https://siteviral.com/partner', 'Voir mon espace partenaire')}`) };
    case 'partner_commission_earned':
      return { subject: `💰 Commission partenaire – ${d.commission} ${d.currency}`, html: wrap(`<h1 style="color:${green}">💰 Commission Gagnée</h1><p>Vous avez gagné <strong>${d.commission} ${d.currency}</strong> de commission grâce à l'activité de <strong>${d.org_name}</strong>.</p><p>Votre solde est automatiquement mis à jour.</p>${cta('https://siteviral.com/partner', 'Voir mes gains')}`) };

    // ═══ RECAPS (ORG & AMBASSADOR) ═══
    case 'monthly_recap_org':
      return { subject: `📊 Récap mensuel – ${d.org_name}`, html: wrap(`<h1 style="color:${blue}">📊 Récap Mensuel</h1><p><strong>${d.org_name}</strong> – ${d.month}</p><ul style="color:#ccc"><li>Revenus : ${d.revenue || 0} ${d.currency || 'XOF'}</li><li>Nouveaux membres : ${d.new_members || 0}</li><li>Ventes : ${d.sales || 0}</li><li>Dons : ${d.donations || 0}</li><li>Vues : ${d.page_views || 0}</li></ul>${cta('https://siteviral.com/admin/analytics', 'Voir les détails')}`) };
    case 'weekly_ambassador_recap':
      return { subject: `📊 Récap ambassadeur – Semaine`, html: wrap(`<h1 style="color:${blue}">📊 Récap Ambassadeur</h1><p>Voici votre résumé de la semaine :</p><ul style="color:#ccc"><li>Clics : ${d.clicks || 0}</li><li>Conversions : ${d.conversions || 0}</li><li>Gains : ${d.earnings || 0} ${d.currency || 'XOF'}</li><li>Classement : #${d.rank || 'N/A'}</li></ul>${cta('https://siteviral.com/affiliation', 'Mon espace ambassadeur')}`) };

    // ═══ MISC ═══
    case 'flash_sale_alert':
      return { subject: `⚡ Promo flash – ${d.product_name}`, html: wrap(`<h1 style="color:${red}">⚡ Promo Flash !</h1><p><strong>"${d.product_name}"</strong> de <strong>${d.org_name}</strong> est en promotion !</p><p><span style="text-decoration:line-through;color:#999">${d.original_price} ${d.currency}</span> → <strong style="color:${green}">${d.sale_price} ${d.currency}</strong></p><p>Se termine le : ${d.ends_at}</p>${cta('https://siteviral.com', 'En profiter →')}`) };
    case 'promo_code_used':
      return { subject: `🎟️ Code promo utilisé – ${d.promo_code}`, html: wrap(`<h1 style="color:${blue}">🎟️ Code Promo Utilisé</h1><p><strong>${d.buyer_name || 'Un acheteur'}</strong> a utilisé le code promo <strong>"${d.promo_code}"</strong> sur <strong>${d.org_name}</strong>.</p><p>Réduction : ${d.discount}</p>`) };
    case 'org_verified':
      return { subject: `✅ Organisation vérifiée – ${d.org_name}`, html: wrap(`<h1 style="color:${green}">✅ Organisation Vérifiée !</h1><p>Félicitations ! <strong>${d.org_name}</strong> est maintenant une organisation vérifiée sur Siteviral.</p><p>Le badge de vérification apparaîtra sur votre page publique.</p>`) };
    case 'waitlist_spot_available':
      return { subject: `🎉 Place disponible – ${d.item_name}`, html: wrap(`<h1 style="color:${green}">🎉 Place Disponible !</h1><p>Bonne nouvelle ! Une place est disponible pour <strong>"${d.item_name}"</strong>.</p><p>Ne tardez pas, les places sont limitées !</p>${cta('https://siteviral.com', 'Réserver maintenant')}`) };
    case 'referral_reward':
      return { subject: `🎁 Récompense de parrainage`, html: wrap(`<h1 style="color:${green}">🎁 Récompense !</h1><p><strong>${d.referred_name || 'Quelqu\'un'}</strong> s'est inscrit grâce à vous !</p><p>${d.reward_description || 'Votre récompense a été créditée.'}</p>`) };

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
