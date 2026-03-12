import LegalPageShell from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';

export default function DPAPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <LegalPageShell>
      <SEOHead
        title={isFr ? 'Accord de traitement des données — Siteviral' : 'Data Processing Agreement — Siteviral'}
        description={isFr ? 'DPA Siteviral : comment nous traitons les données pour le compte des organisations.' : 'Siteviral DPA: how we process data on behalf of organizations.'}
      />

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">
        {isFr ? 'Accord de traitement des données (DPA)' : 'Data Processing Agreement (DPA)'}
      </h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium">
        {isFr ? 'Dernière mise à jour : février 2026' : 'Last updated: February 2026'}
      </p>

      <div className="max-w-none space-y-6 text-foreground text-[15px] sm:text-base font-semibold leading-relaxed">
        <p>{isFr ? 'Le présent Accord de traitement des données (« DPA ») fait partie intégrante des Conditions d\'utilisation entre Hacktualiz Inc. (« Sous-traitant », « nous ») et l\'Organisation (« Responsable du traitement », « vous ») utilisant la plateforme Siteviral.' : 'This Data Processing Agreement ("DPA") forms an integral part of the Terms of Service between Hacktualiz Inc. ("Processor", "we") and the Organization ("Data Controller", "you") using the Siteviral platform.'}</p>

        <h2 className="text-xl font-extrabold mt-8 mb-3">{isFr ? '1. Rôles' : '1. Roles'}</h2>
        <ul className="list-disc pl-5 space-y-1 font-medium">
          <li><strong>{isFr ? 'Responsable du traitement :' : 'Data Controller:'}</strong> {isFr ? 'L\'Organisation qui utilise Siteviral pour gérer sa communauté, son contenu et ses transactions.' : 'The Organization that uses Siteviral to manage its community, content, and transactions.'}</li>
          <li><strong>{isFr ? 'Sous-traitant :' : 'Processor:'}</strong> {isFr ? 'Hacktualiz Inc., opérateur de la plateforme Siteviral, traitant les données pour le compte du Responsable.' : 'Hacktualiz Inc., operator of the Siteviral platform, processing data on behalf of the Controller.'}</li>
        </ul>

        <h2 className="text-xl font-extrabold mt-8 mb-3">{isFr ? '2. Données traitées' : '2. Data Processed'}</h2>
        <p className="font-medium">{isFr ? 'Nous traitons des données personnelles incluant notamment : noms, adresses e-mail, numéros de téléphone (E.164), références de paiement, adresses IP, identifiants d\'appareils et relevés de transactions, strictement nécessaires à la fourniture des services de la plateforme.' : 'We process personal data including: names, email addresses, phone numbers (E.164), payment references, IP addresses, device identifiers, and transaction records, strictly necessary for providing platform services.'}</p>

        <h2 className="text-xl font-extrabold mt-8 mb-3">{isFr ? '3. Traitements autorisés' : '3. Authorized Processing'}</h2>
        <ul className="list-disc pl-5 space-y-1 font-medium">
          <li>{isFr ? 'Hébergement et diffusion du contenu de la plateforme' : 'Hosting and distributing platform content'}</li>
          <li>{isFr ? 'Traitement des paiements via Paystack' : 'Payment processing via Paystack'}</li>
          <li>{isFr ? 'Envoi d\'e-mails transactionnels via Resend' : 'Transactional email delivery via Resend'}</li>
          <li>{isFr ? 'Surveillance de la sécurité et prévention de la fraude' : 'Security monitoring and fraud prevention'}</li>
          <li>{isFr ? 'Vérifications de conformité AML/KYC' : 'AML/KYC compliance checks'}</li>
        </ul>

        <h2 className="text-xl font-extrabold mt-8 mb-3">{isFr ? '4. Sous-traitants ultérieurs' : '4. Sub-processors'}</h2>
        <p className="font-medium mb-3">{isFr ? 'Nous faisons appel aux sous-traitants suivants pour fournir nos services :' : 'We use the following sub-processors to provide our services:'}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-bold">{isFr ? 'Sous-traitant' : 'Sub-processor'}</th>
                <th className="text-left p-3 font-bold">{isFr ? 'Finalité' : 'Purpose'}</th>
                <th className="text-left p-3 font-bold">{isFr ? 'Localisation' : 'Location'}</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Supabase Inc.</td><td className="p-3">{isFr ? 'Base de données, authentification, stockage, fonctions edge' : 'Database, authentication, storage, edge functions'}</td><td className="p-3">{isFr ? 'États-Unis' : 'United States'}</td></tr>
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Paystack (Stripe)</td><td className="p-3">{isFr ? 'Traitement des paiements, vérification' : 'Payment processing, verification'}</td><td className="p-3">{isFr ? 'Nigeria / États-Unis' : 'Nigeria / United States'}</td></tr>
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Resend Inc.</td><td className="p-3">{isFr ? 'Envoi d\'e-mails transactionnels' : 'Transactional email delivery'}</td><td className="p-3">{isFr ? 'États-Unis' : 'United States'}</td></tr>
              <tr><td className="p-3 font-medium text-foreground">Sentry</td><td className="p-3">{isFr ? 'Surveillance des erreurs' : 'Error monitoring'}</td><td className="p-3">{isFr ? 'États-Unis' : 'United States'}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="font-medium mt-3">{isFr ? <>Voir la liste complète de nos <a href="/subprocessors" className="text-primary underline">sous-traitants ultérieurs</a>.</> : <>See the full list of our <a href="/subprocessors" className="text-primary underline">sub-processors</a>.</>}</p>

        <h2 className="text-xl font-extrabold mt-8 mb-3">{isFr ? '5. Mesures de sécurité' : '5. Security Measures'}</h2>
        <ul className="list-disc pl-5 space-y-1 font-medium">
          <li>{isFr ? 'Chiffrement en transit (TLS) et au repos' : 'Encryption in transit (TLS) and at rest'}</li>
          <li>{isFr ? 'Sécurité au niveau des lignes (RLS) pour l\'isolation des données multi-tenant' : 'Row Level Security (RLS) for multi-tenant data isolation'}</li>
          <li>{isFr ? 'Vérification des signatures webhook HMAC' : 'HMAC webhook signature verification'}</li>
          <li>{isFr ? 'Limitation du débit sur les points d\'accès critiques' : 'Rate limiting on critical endpoints'}</li>
          <li>{isFr ? 'Traitement idempotent des transactions' : 'Idempotent transaction processing'}</li>
          <li>{isFr ? 'URLs signées pour les téléchargements de fichiers protégés' : 'Signed URLs for protected file downloads'}</li>
          <li>{isFr ? 'Journalisation d\'audit sur toutes les actions sensibles' : 'Audit logging on all sensitive actions'}</li>
        </ul>

        <h2 className="text-xl font-extrabold mt-8 mb-3">{isFr ? '6. Durées de conservation des données' : '6. Data Retention Periods'}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-bold">{isFr ? 'Catégorie de données' : 'Data Category'}</th>
                <th className="text-left p-3 font-bold">{isFr ? 'Durée de conservation' : 'Retention Period'}</th>
                <th className="text-left p-3 font-bold">{isFr ? 'Base légale' : 'Legal Basis'}</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">{isFr ? 'Événements de paiement et journaux d\'audit' : 'Payment events and audit logs'}</td><td className="p-3">{isFr ? '24 mois (ou plus si requis par la loi)' : '24 months (or longer if required by law)'}</td><td className="p-3">{isFr ? 'Obligation légale' : 'Legal obligation'}</td></tr>
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">{isFr ? 'Journaux de téléchargement' : 'Download logs'}</td><td className="p-3">{isFr ? '12 mois' : '12 months'}</td><td className="p-3">{isFr ? 'Intérêt légitime' : 'Legitimate interest'}</td></tr>
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">{isFr ? 'Soumissions KYC' : 'KYC submissions'}</td><td className="p-3">{isFr ? '5 ans après la fin de la relation' : '5 years after end of relationship'}</td><td className="p-3">{isFr ? 'Réglementation AML' : 'AML regulation'}</td></tr>
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">{isFr ? 'Tickets de support' : 'Support tickets'}</td><td className="p-3">{isFr ? '24 mois après résolution' : '24 months after resolution'}</td><td className="p-3">{isFr ? 'Intérêt légitime' : 'Legitimate interest'}</td></tr>
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">{isFr ? 'Profils utilisateurs' : 'User profiles'}</td><td className="p-3">{isFr ? 'Durée du compte + 30 jours' : 'Account duration + 30 days'}</td><td className="p-3">{isFr ? 'Exécution du contrat' : 'Contract performance'}</td></tr>
              <tr><td className="p-3 font-medium text-foreground">{isFr ? 'Relevés de transactions' : 'Transaction records'}</td><td className="p-3">{isFr ? '7 ans' : '7 years'}</td><td className="p-3">{isFr ? 'Conformité fiscale/financière' : 'Tax/financial compliance'}</td></tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-extrabold mt-8 mb-3">{isFr ? '7. Droits des personnes concernées (DSAR)' : '7. Data Subject Rights (DSAR)'}</h2>
        <p className="font-medium mb-3">{isFr ? 'Nous assistons les Responsables dans l\'exécution des demandes des personnes concernées :' : 'We assist Controllers in fulfilling data subject requests:'}</p>
        <ul className="list-disc pl-5 space-y-1 font-medium">
          <li><strong>{isFr ? 'Droit d\'accès :' : 'Right of access:'}</strong> {isFr ? 'Les utilisateurs peuvent exporter leurs données personnelles depuis les paramètres de leur profil.' : 'Users can export their personal data from their profile settings.'}</li>
          <li><strong>{isFr ? 'Droit de rectification :' : 'Right to rectification:'}</strong> {isFr ? 'Les utilisateurs peuvent mettre à jour leur profil directement.' : 'Users can update their profile directly.'}</li>
          <li><strong>{isFr ? 'Droit à l\'effacement :' : 'Right to erasure:'}</strong> {isFr ? 'Les utilisateurs peuvent supprimer leur compte ; traitement sous 30 jours, à l\'exception des données conservées légalement.' : 'Users can delete their account; processed within 30 days, except data retained legally.'}</li>
          <li><strong>{isFr ? 'Droit à la portabilité :' : 'Right to portability:'}</strong> {isFr ? 'Export dans un format lisible par machine disponible sur demande.' : 'Export in machine-readable format available on request.'}</li>
          <li><strong>{isFr ? 'Droit d\'opposition :' : 'Right to object:'}</strong> {isFr ? 'Les utilisateurs peuvent s\'opposer aux traitements non essentiels.' : 'Users can object to non-essential processing.'}</li>
        </ul>
        <p className="font-medium mt-3">
          {isFr ? <>Soumettez une demande DSAR à <a href="mailto:privacy@siteviral.com" className="text-primary underline">privacy@siteviral.com</a>. Réponse sous 30 jours.</> : <>Submit a DSAR request to <a href="mailto:privacy@siteviral.com" className="text-primary underline">privacy@siteviral.com</a>. Response within 30 days.</>}
        </p>

        <h2 className="text-xl font-extrabold mt-8 mb-3">{isFr ? '8. Notification de violation' : '8. Breach Notification'}</h2>
        <p className="font-medium">{isFr ? 'En cas de violation de données personnelles, nous notifierons le Responsable dans les meilleurs délais et dans un délai de 72 heures, en fournissant les détails et les mesures correctives.' : 'In the event of a personal data breach, we will notify the Controller without undue delay and within 72 hours, providing details and remediation measures.'}</p>

        <h2 className="text-xl font-extrabold mt-8 mb-3">9. Contact</h2>
        <p className="font-medium">
          Hacktualiz Inc.<br />
          131 Continental Dr, Suite 305, Newark, DE 19713, {isFr ? 'États-Unis' : 'United States'}<br />
          {isFr ? 'E-mail' : 'Email'} : <a href="mailto:privacy@siteviral.com" className="text-primary underline">privacy@siteviral.com</a>
        </p>
      </div>
    </LegalPageShell>
  );
}
