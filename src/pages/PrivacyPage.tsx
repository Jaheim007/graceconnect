import { Link } from 'react-router-dom';
import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';

export default function PrivacyPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <LegalPageShell>
      <SEOHead
        title={isFr ? 'Politique de Confidentialité — Siteviral' : 'Privacy Policy — Siteviral'}
        description={isFr ? 'Découvrez comment Siteviral protège vos données personnelles. Transparence, RGPD, droits des utilisateurs.' : 'Learn how Siteviral protects your personal data. Transparency, GDPR, user rights.'}
        canonicalUrl="https://siteviral.com/privacy"
      />
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">
        {isFr ? 'Politique de Confidentialité' : 'Privacy Policy'}
      </h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium">
        {isFr ? 'Dernière mise à jour : 22 février 2026' : 'Last updated: February 22, 2026'}
      </p>

      <div className={proseClasses}>
        <section>
          <h2>1. Introduction</h2>
          <p>
            <strong>Hacktualiz Inc.</strong> {isFr
              ? "(ci-après « Siteviral », « nous »), société de droit américain (Delaware C-Corp), s'engage à protéger la vie privée de ses utilisateurs. La présente Politique de Confidentialité décrit comment nous collectons, utilisons, stockons et protégeons vos données personnelles lors de votre utilisation de la plateforme Siteviral."
              : '(hereinafter "Siteviral", "we"), a U.S. corporation (Delaware C-Corp), is committed to protecting the privacy of its users. This Privacy Policy describes how we collect, use, store, and protect your personal data when using the Siteviral platform.'}
          </p>
          <p>
            {isFr
              ? "Cette politique est conforme au Règlement Général sur la Protection des Données (RGPD), au California Consumer Privacy Act (CCPA), ainsi qu'aux lois applicables en matière de protection des données dans les juridictions où nous opérons."
              : 'This policy complies with the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), and applicable data protection laws in jurisdictions where we operate.'}
          </p>
        </section>

        <section>
          <h2>{isFr ? '2. Données collectées' : '2. Data Collected'}</h2>

          <h3 className="text-lg font-bold mt-4 mb-2">{isFr ? '2.1 Données de compte' : '2.1 Account Data'}</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Adresse email' : 'Email address'}</li>
            <li>{isFr ? 'Nom et prénom' : 'First and last name'}</li>
            <li>{isFr ? 'Photo de profil (optionnel)' : 'Profile picture (optional)'}</li>
            <li>{isFr ? 'Pays de résidence' : 'Country of residence'}</li>
          </ul>

          <h3 className="text-lg font-bold mt-4 mb-2">{isFr ? '2.2 Numéro de téléphone' : '2.2 Phone Number'}</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Stocké au format international E.164' : 'Stored in international E.164 format'}</li>
            <li>{isFr ? 'Utilisé pour la vérification KYC et les notifications optionnelles' : 'Used for KYC verification and optional notifications'}</li>
          </ul>

          <h3 className="text-lg font-bold mt-4 mb-2">{isFr ? '2.3 Données transactionnelles' : '2.3 Transaction Data'}</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Montants des dons et achats' : 'Donation and purchase amounts'}</li>
            <li>{isFr ? 'Références de paiement Paystack' : 'Paystack payment references'}</li>
            <li>{isFr ? "Historique des transactions et commissions ambassadeur" : 'Transaction history and ambassador commissions'}</li>
            <li>{isFr ? "Adresse IP et empreinte appareil (device hash) pour la détection de fraude" : 'IP address and device hash for fraud detection'}</li>
          </ul>

          <h3 className="text-lg font-bold mt-4 mb-2">{isFr ? '2.4 Logs techniques' : '2.4 Technical Logs'}</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? "Logs d'audit (actions sensibles : KYC, payouts, modifications de compte)" : 'Audit logs (sensitive actions: KYC, payouts, account changes)'}</li>
            <li>{isFr ? 'Logs de téléchargement (preuve de livraison pour les produits numériques)' : 'Download logs (proof of delivery for digital products)'}</li>
            <li>{isFr ? 'Adresse IP, user-agent, horodatage' : 'IP address, user-agent, timestamp'}</li>
          </ul>

          <h3 className="text-lg font-bold mt-4 mb-2">2.5 Cookies</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? "Cookie de session (authentification)" : 'Session cookie (authentication)'}</li>
            <li>{isFr ? 'Cookie ambassadeur (durée : 7 jours, attribution last-click)' : 'Ambassador cookie (duration: 7 days, last-click attribution)'}</li>
            <li>{isFr ? 'Cookies fonctionnels (langue, thème)' : 'Functional cookies (language, theme)'}</li>
          </ul>

          <h3 className="text-lg font-bold mt-4 mb-2">{isFr ? '2.6 Documents KYC' : '2.6 KYC Documents'}</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? "Pièce d'identité (CNI, passeport)" : 'Identity document (national ID, passport)'}</li>
            <li>{isFr ? "Documents de l'organisation" : 'Organization documents'}</li>
            <li>{isFr ? 'Informations bancaires (nom, numéro de compte, banque)' : 'Banking information (name, account number, bank)'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '3. Finalités du traitement' : '3. Processing Purposes'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Fourniture et gestion des services de la Plateforme' : 'Provision and management of Platform services'}</li>
            <li>{isFr ? 'Traitement des paiements et des retraits' : 'Processing payments and withdrawals'}</li>
            <li>{isFr ? "Sécurité, prévention de la fraude et détection d'activités suspectes" : 'Security, fraud prevention, and detection of suspicious activities'}</li>
            <li>{isFr ? 'Conformité AML (Anti-Money Laundering) et obligations légales' : 'AML (Anti-Money Laundering) compliance and legal obligations'}</li>
            <li>{isFr ? 'Support client et résolution des litiges' : 'Customer support and dispute resolution'}</li>
            <li>{isFr ? 'Gestion du Programme Ambassadeur et attribution des commissions' : 'Ambassador Program management and commission attribution'}</li>
            <li>{isFr ? 'Amélioration de nos services' : 'Improvement of our services'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '4. Base légale' : '4. Legal Basis'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>{isFr ? 'Exécution contractuelle :' : 'Contractual performance:'}</strong> {isFr ? 'fourniture des services auxquels vous avez souscrit' : 'provision of services you subscribed to'}</li>
            <li><strong>{isFr ? 'Intérêt légitime :' : 'Legitimate interest:'}</strong> {isFr ? 'prévention de la fraude, amélioration des services, sécurité' : 'fraud prevention, service improvement, security'}</li>
            <li><strong>{isFr ? 'Consentement :' : 'Consent:'}</strong> {isFr ? 'cookies non essentiels, communications marketing' : 'non-essential cookies, marketing communications'}</li>
            <li><strong>{isFr ? 'Obligation légale :' : 'Legal obligation:'}</strong> {isFr ? 'réglementations AML, fiscales et comptables' : 'AML, tax, and accounting regulations'}</li>
          </ul>
        </section>

        <section>
          <h2>5. Cookies & Tracking</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>{isFr ? "Cookie d'affiliation :" : 'Affiliate cookie:'}</strong> {isFr ? "durée 7 jours, stocke le code d'affiliation pour l'attribution last-click des commissions" : 'duration 7 days, stores affiliate code for last-click commission attribution'}</li>
            <li><strong>{isFr ? 'Cookie de session :' : 'Session cookie:'}</strong> {isFr ? "nécessaire au fonctionnement de l'authentification" : 'required for authentication'}</li>
            <li><strong>{isFr ? 'Cookies fonctionnels :' : 'Functional cookies:'}</strong> {isFr ? 'préférences de langue et de thème' : 'language and theme preferences'}</li>
            <li>{isFr ? "Aucun cookie publicitaire tiers n'est utilisé" : 'No third-party advertising cookies are used'}</li>
            <li>{isFr ? 'Vous pouvez gérer vos préférences de cookies depuis les paramètres de votre navigateur' : 'You can manage your cookie preferences from your browser settings'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '6. Partage avec sous-traitants' : '6. Sharing with Sub-processors'}</h2>
          <p>{isFr ? 'Vos données peuvent être partagées avec les sous-traitants suivants :' : 'Your data may be shared with the following sub-processors:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase Inc.</strong> — {isFr ? 'hébergement, base de données, authentification, stockage de fichiers' : 'hosting, database, authentication, file storage'}</li>
            <li><strong>Paystack (Stripe Inc.)</strong> — {isFr ? 'traitement des paiements et vérification des transactions' : 'payment processing and transaction verification'}</li>
            <li><strong>Resend Inc.</strong> — {isFr ? "envoi d'emails transactionnels et de campagnes" : 'transactional and campaign email delivery'}</li>
            <li><strong>Sentry (Functional Software Inc.)</strong> — {isFr ? "monitoring d'erreurs frontend" : 'frontend error monitoring'}</li>
          </ul>
          <p>
            {isFr
              ? <>Nous ne vendons jamais vos données personnelles. Consultez notre <Link to="/subprocessors" className="text-primary underline">liste complète des sous-traitants</Link>.</>
              : <>We never sell your personal data. See our <Link to="/subprocessors" className="text-primary underline">full list of sub-processors</Link>.</>}
          </p>
        </section>

        <section>
          <h2>{isFr ? '7. Transferts internationaux' : '7. International Transfers'}</h2>
          <p>
            {isFr
              ? <>Vos données sont hébergées sur des serveurs situés aux <strong>États-Unis</strong> (Supabase / AWS). Les paiements sont traités via Paystack (Nigeria / États-Unis).</>
              : <>Your data is hosted on servers located in the <strong>United States</strong> (Supabase / AWS). Payments are processed via Paystack (Nigeria / United States).</>}
          </p>
          <p>
            {isFr
              ? "Pour les utilisateurs de l'Union européenne, nous nous assurons que des garanties appropriées sont en place, y compris les clauses contractuelles types de la Commission européenne."
              : 'For European Union users, we ensure appropriate safeguards are in place, including the European Commission\'s standard contractual clauses.'}
          </p>
        </section>

        <section>
          <h2>{isFr ? '8. Conservation des données' : '8. Data Retention'}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-lg">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-bold text-foreground">{isFr ? 'Catégorie' : 'Category'}</th>
                  <th className="text-left p-3 font-bold text-foreground">{isFr ? 'Durée' : 'Duration'}</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">{isFr ? 'Données de compte' : 'Account data'}</td><td className="p-3">{isFr ? "Durée de l'inscription + 30 jours après suppression" : 'Duration of registration + 30 days after deletion'}</td></tr>
                <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">{isFr ? 'Transactions & paiements' : 'Transactions & payments'}</td><td className="p-3">{isFr ? '7 ans (obligations comptables et fiscales)' : '7 years (accounting and tax obligations)'}</td></tr>
                <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Payment events & audit logs</td><td className="p-3">{isFr ? '24 mois (ou plus si exigence légale)' : '24 months (or more if legally required)'}</td></tr>
                <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Download logs</td><td className="p-3">{isFr ? '12 mois' : '12 months'}</td></tr>
                <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">{isFr ? 'Documents KYC' : 'KYC documents'}</td><td className="p-3">{isFr ? '5 ans après fin de la relation (réglementation AML)' : '5 years after end of relationship (AML regulation)'}</td></tr>
                <tr><td className="p-3 font-medium text-foreground">Support tickets</td><td className="p-3">{isFr ? '24 mois après résolution' : '24 months after resolution'}</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>{isFr ? '9. Droits des utilisateurs (DSAR)' : '9. User Rights (DSAR)'}</h2>
          <p>{isFr ? 'Conformément au RGPD et aux lois applicables, vous disposez des droits suivants :' : 'Under the GDPR and applicable laws, you have the following rights:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>{isFr ? "Droit d'accès :" : 'Right of access:'}</strong> {isFr ? 'obtenir une copie de vos données personnelles' : 'obtain a copy of your personal data'}</li>
            <li><strong>{isFr ? 'Droit de rectification :' : 'Right to rectification:'}</strong> {isFr ? 'corriger vos données inexactes ou incomplètes' : 'correct inaccurate or incomplete data'}</li>
            <li><strong>{isFr ? "Droit à l'effacement :" : 'Right to erasure:'}</strong> {isFr ? 'demander la suppression de vos données (sous réserve des obligations légales de conservation)' : 'request deletion of your data (subject to legal retention obligations)'}</li>
            <li><strong>{isFr ? 'Droit à la portabilité :' : 'Right to portability:'}</strong> {isFr ? 'recevoir vos données dans un format structuré et lisible' : 'receive your data in a structured, readable format'}</li>
            <li><strong>{isFr ? "Droit d'opposition :" : 'Right to object:'}</strong> {isFr ? 'vous opposer au traitement de vos données pour des motifs légitimes' : 'object to data processing on legitimate grounds'}</li>
          </ul>
          <p>
            {isFr
              ? <>Pour exercer vos droits, envoyez un email à <strong><a href="mailto:privacy@siteviral.com" className="text-primary underline">privacy@siteviral.com</a></strong>. Nous répondrons dans un délai de <strong>30 jours</strong>.</>
              : <>To exercise your rights, send an email to <strong><a href="mailto:privacy@siteviral.com" className="text-primary underline">privacy@siteviral.com</a></strong>. We will respond within <strong>30 days</strong>.</>}
          </p>
        </section>

        <section>
          <h2>{isFr ? '10. Sécurité' : '10. Security'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Row Level Security (RLS) sur toutes les tables — isolation multi-tenant' : 'Row Level Security (RLS) on all tables — multi-tenant isolation'}</li>
            <li>{isFr ? 'Vérification HMAC SHA-512 des webhooks Paystack' : 'HMAC SHA-512 verification of Paystack webhooks'}</li>
            <li>{isFr ? 'URLs signées et temporaires pour les fichiers protégés' : 'Signed and temporary URLs for protected files'}</li>
            <li>{isFr ? 'Audit logs permanents sur les actions sensibles' : 'Permanent audit logs on sensitive actions'}</li>
            <li>{isFr ? 'Chiffrement SSL/TLS sur toutes les communications' : 'SSL/TLS encryption on all communications'}</li>
            <li>{isFr
              ? <Link to="/security" className="text-primary underline">Consultez notre page Sécurité pour plus de détails</Link>
              : <Link to="/security" className="text-primary underline">See our Security page for more details</Link>}</li>
          </ul>
        </section>

        <section>
          <h2>11. Contact</h2>
          <p>{isFr ? 'Pour toute question relative à la présente Politique de Confidentialité :' : 'For any questions regarding this Privacy Policy:'}</p>
          <p className="font-medium">
            Hacktualiz Inc. — Data Protection Officer<br />
            131 Continental Dr, Suite 305, Newark, DE 19713, USA<br />
            Email : <a href="mailto:privacy@siteviral.com" className="text-primary underline">privacy@siteviral.com</a>
          </p>
        </section>
      </div>
    </LegalPageShell>
  );
}
