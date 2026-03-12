import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';
import { Shield } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';

export default function SecurityPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <LegalPageShell>
      <SEOHead
        title={isFr ? 'Sécurité — Siteviral' : 'Security — Siteviral'}
        description={isFr ? 'Comment Siteviral protège vos données. Chiffrement, conformité, sécurité de l\'infrastructure.' : 'How Siteviral protects your data. Encryption, compliance, infrastructure security.'}
        canonicalUrl="https://siteviral.com/security"
      />
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">{isFr ? 'Sécurité' : 'Security'}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8 font-medium">
        {isFr ? 'Comment Siteviral protège vos données et l\'intégrité de votre organisation' : 'How Siteviral protects your data and your organization\'s integrity'}
      </p>

      <div className={proseClasses}>
        <section>
          <h2>{isFr ? '1. Architecture générale' : '1. Architecture Overview'}</h2>
          <p>
            {isFr
              ? 'Siteviral est construit sur une architecture moderne axée sur la sécurité. Toutes les données sont hébergées sur Supabase (AWS) avec une isolation multi-tenant stricte. Les Edge Functions exécutent la logique côté serveur dans des isolats Deno, empêchant tout accès direct à la base de données depuis le client.'
              : 'Siteviral is built on a modern, security-first architecture. All data is hosted on Supabase (backed by AWS) with strict multi-tenant isolation. Edge Functions run server-side logic in Deno isolates, ensuring no direct database access from the client.'}
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Tout le trafic chiffré via TLS 1.2+' : 'All traffic encrypted via TLS 1.2+'}</li>
            <li>{isFr ? 'Isolation des données multi-tenant via Row Level Security (RLS) sur chaque table' : 'Multi-tenant data isolation via Row Level Security (RLS) on every table'}</li>
            <li>{isFr ? 'Vérification des paiements côté serveur — aucune confiance côté client' : 'Server-side payment verification — no client-side trust'}</li>
            <li>{isFr ? 'URLs signées pour tous les téléchargements de fichiers protégés' : 'Signed URLs for all protected file downloads'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '2. Sécurité au niveau des lignes (RLS)' : '2. Row Level Security (RLS)'}</h2>
          <p>
            {isFr
              ? 'Chaque table de notre base de données applique des politiques RLS. Les utilisateurs ne peuvent accéder qu\'aux données de leur organisation ou de leur propre profil. Les requêtes d\'administration sont restreintes aux utilisateurs avec des rôles vérifiés.'
              : 'Every table in our database enforces RLS policies. Users can only access data belonging to their organization or their own profile. Admin-level queries are restricted to users with verified roles. Superadmin access is limited to designated platform operators.'}
          </p>
        </section>

        <section>
          <h2>{isFr ? '3. Sécurité des paiements' : '3. Payment Security'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Tous les paiements traités côté serveur via Paystack (certifié PCI-DSS Level 1)' : 'All payments processed server-side via Paystack (PCI-DSS Level 1 certified)'}</li>
            <li>{isFr ? 'Signatures webhook vérifiées par HMAC SHA-512 avant traitement' : 'Webhook signatures verified using HMAC SHA-512 before processing'}</li>
            <li>{isFr ? 'Traitement idempotent des transactions via la table payment_events' : 'Idempotent transaction processing via payment_events table to prevent double-processing'}</li>
            <li>{isFr ? 'Références de transaction préfixées SV- pour traçabilité' : 'Transaction references prefixed with SV- for traceability'}</li>
            <li>{isFr ? 'Limitation de débit sur les endpoints de paiement' : 'Rate limiting on payment endpoints to prevent abuse'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '4. Authentification' : '4. Authentication'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Magic Link (authentification sans mot de passe par email)' : 'Magic Link (passwordless email authentication)'}</li>
            <li>Google OAuth 2.0</li>
            <li>{isFr ? 'Aucun mot de passe stocké — zéro risque de compromission de base de mots de passe' : 'No passwords stored — zero risk of password database compromise'}</li>
            <li>{isFr ? 'Jetons de session gérés par Supabase Auth avec rafraîchissement automatique' : 'Session tokens managed by Supabase Auth with automatic refresh'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '5. Monitoring & Audit' : '5. Monitoring & Audit'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Piste d\'audit permanente sur toutes les actions sensibles (vérification d\'identité, retraits, modifications de compte)' : 'Permanent audit trail on all sensitive actions (identity verification, payouts, account changes)'}</li>
            <li>{isFr ? 'Détection de fraude avec alertes automatiques pour les patterns de transactions suspects' : 'Fraud detection flags with automatic alerts for suspicious transaction patterns'}</li>
            <li>{isFr ? 'Logs de téléchargement pour preuve de livraison en résolution de litiges' : 'Download logs for proof-of-delivery in dispute resolution'}</li>
            <li>{isFr ? 'Monitoring d\'erreurs Sentry sur le frontend pour détection rapide d\'incidents' : 'Sentry error monitoring on frontend for rapid incident detection'}</li>
            <li>{isFr ? 'Logs structurés avec IDs de corrélation sur les Edge Functions' : 'Structured logs with correlation IDs on Edge Functions'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '6. Réponse aux incidents' : '6. Incident Response'}</h2>
          <p>{isFr ? 'En cas d\'incident de sécurité, Siteviral suit un processus de réponse structuré :' : 'In the event of a security incident, Siteviral follows a structured response process:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>{isFr ? 'Détection :' : 'Detection:'}</strong> {isFr ? 'Monitoring automatisé + revue manuelle' : 'Automated monitoring + manual review'}</li>
            <li><strong>{isFr ? 'Confinement :' : 'Containment:'}</strong> {isFr ? 'Isolation immédiate des systèmes/comptes affectés' : 'Immediate isolation of affected systems/accounts'}</li>
            <li><strong>{isFr ? 'Notification :' : 'Notification:'}</strong> {isFr ? 'Utilisateurs et organisations affectés notifiés sous 72 heures' : 'Affected users and organizations notified within 72 hours'}</li>
            <li><strong>{isFr ? 'Remédiation :' : 'Remediation:'}</strong> {isFr ? 'Analyse des causes et déploiement de correctifs' : 'Root cause analysis and patch deployment'}</li>
            <li><strong>{isFr ? 'Post-mortem :' : 'Post-mortem:'}</strong> {isFr ? 'Revue interne et amélioration des processus' : 'Internal review and process improvement'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '7. Protection des données' : '7. Data Protection'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Documents de vérification d\'identité stockés dans des buckets privés à accès contrôlé' : 'Identity verification documents stored in private, access-controlled storage buckets'}</li>
            <li>{isFr ? 'Téléchargements de fichiers nécessitant des URLs signées à durée limitée' : 'File downloads require time-limited signed URLs'}</li>
            <li>{isFr ? 'Aucune donnée sensible exposée dans le code côté client ou les réponses API' : 'No sensitive data exposed in client-side code or API responses'}</li>
            <li>{isFr ? 'Clés API et secrets stockés dans des variables d\'environnement chiffrées' : 'API keys and secrets stored in encrypted environment variables'}</li>
            <li>{isFr ? 'Rotation des secrets supportée sans interruption de service' : 'Secret rotation supported without service interruption'}</li>
          </ul>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>{isFr ? 'Pour signaler une vulnérabilité de sécurité :' : 'To report a security vulnerability or concern:'}</p>
          <p className="font-medium">
            Hacktualiz Inc.<br />
            {isFr ? 'Équipe Sécurité' : 'Security Team'}<br />
            131 Continental Dr, Suite 305, Newark, DE 19713, USA<br />
            Email : security@siteviral.com
          </p>
        </section>
      </div>
    </LegalPageShell>
  );
}
