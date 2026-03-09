import LegalPageShell from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';

export default function DPAPage() {
  return (
    <LegalPageShell>
      <SEOHead title="Accord de traitement des données — Siteviral" description="DPA Siteviral : comment nous traitons les données pour le compte des organisations." />

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">Accord de traitement des données (DPA)</h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium">Dernière mise à jour : février 2026</p>

      <div className="max-w-none space-y-6 text-foreground text-[15px] sm:text-base font-semibold leading-relaxed">
        <p>Le présent Accord de traitement des données (« DPA ») fait partie intégrante des Conditions d'utilisation entre Hacktualiz Inc. (« Sous-traitant », « nous ») et l'Organisation (« Responsable du traitement », « vous ») utilisant la plateforme Siteviral.</p>

        <h2 className="text-xl font-extrabold mt-8 mb-3">1. Rôles</h2>
        <ul className="list-disc pl-5 space-y-1 font-medium">
          <li><strong>Responsable du traitement :</strong> L'Organisation qui utilise Siteviral pour gérer sa communauté, son contenu et ses transactions.</li>
          <li><strong>Sous-traitant :</strong> Hacktualiz Inc., opérateur de la plateforme Siteviral, traitant les données pour le compte du Responsable.</li>
        </ul>

        <h2 className="text-xl font-extrabold mt-8 mb-3">2. Données traitées</h2>
        <p className="font-medium">Nous traitons des données personnelles incluant notamment : noms, adresses e-mail, numéros de téléphone (E.164), références de paiement, adresses IP, identifiants d'appareils et relevés de transactions, strictement nécessaires à la fourniture des services de la plateforme.</p>

        <h2 className="text-xl font-extrabold mt-8 mb-3">3. Traitements autorisés</h2>
        <ul className="list-disc pl-5 space-y-1 font-medium">
          <li>Hébergement et diffusion du contenu de la plateforme</li>
          <li>Traitement des paiements via Paystack</li>
          <li>Envoi d'e-mails transactionnels via Resend</li>
          <li>Surveillance de la sécurité et prévention de la fraude</li>
          <li>Vérifications de conformité AML/KYC</li>
        </ul>

        <h2 className="text-xl font-extrabold mt-8 mb-3">4. Sous-traitants ultérieurs</h2>
        <p className="font-medium mb-3">Nous faisons appel aux sous-traitants suivants pour fournir nos services :</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-bold">Sous-traitant</th>
                <th className="text-left p-3 font-bold">Finalité</th>
                <th className="text-left p-3 font-bold">Localisation</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Supabase Inc.</td><td className="p-3">Base de données, authentification, stockage, fonctions edge</td><td className="p-3">États-Unis</td></tr>
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Paystack (Stripe)</td><td className="p-3">Traitement des paiements, vérification</td><td className="p-3">Nigeria / États-Unis</td></tr>
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Resend Inc.</td><td className="p-3">Envoi d'e-mails transactionnels</td><td className="p-3">États-Unis</td></tr>
              <tr><td className="p-3 font-medium text-foreground">Sentry</td><td className="p-3">Surveillance des erreurs</td><td className="p-3">États-Unis</td></tr>
            </tbody>
          </table>
        </div>
        <p className="font-medium mt-3">Voir la liste complète de nos <a href="/subprocessors" className="text-primary underline">sous-traitants ultérieurs</a>.</p>

        <h2 className="text-xl font-extrabold mt-8 mb-3">5. Mesures de sécurité</h2>
        <ul className="list-disc pl-5 space-y-1 font-medium">
          <li>Chiffrement en transit (TLS) et au repos</li>
          <li>Sécurité au niveau des lignes (RLS) pour l'isolation des données multi-tenant</li>
          <li>Vérification des signatures webhook HMAC</li>
          <li>Limitation du débit sur les points d'accès critiques</li>
          <li>Traitement idempotent des transactions</li>
          <li>URLs signées pour les téléchargements de fichiers protégés</li>
          <li>Journalisation d'audit sur toutes les actions sensibles</li>
        </ul>

        <h2 className="text-xl font-extrabold mt-8 mb-3">6. Durées de conservation des données</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-bold">Catégorie de données</th>
                <th className="text-left p-3 font-bold">Durée de conservation</th>
                <th className="text-left p-3 font-bold">Base légale</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Événements de paiement et journaux d'audit</td><td className="p-3">24 mois (ou plus si requis par la loi)</td><td className="p-3">Obligation légale</td></tr>
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Journaux de téléchargement</td><td className="p-3">12 mois</td><td className="p-3">Intérêt légitime</td></tr>
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Soumissions KYC</td><td className="p-3">5 ans après la fin de la relation</td><td className="p-3">Réglementation AML</td></tr>
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Tickets de support</td><td className="p-3">24 mois après résolution</td><td className="p-3">Intérêt légitime</td></tr>
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Profils utilisateurs</td><td className="p-3">Durée du compte + 30 jours</td><td className="p-3">Exécution du contrat</td></tr>
              <tr><td className="p-3 font-medium text-foreground">Relevés de transactions</td><td className="p-3">7 ans</td><td className="p-3">Conformité fiscale/financière</td></tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-extrabold mt-8 mb-3">7. Droits des personnes concernées (DSAR)</h2>
        <p className="font-medium mb-3">Nous assistons les Responsables dans l'exécution des demandes des personnes concernées :</p>
        <ul className="list-disc pl-5 space-y-1 font-medium">
          <li><strong>Droit d'accès :</strong> Les utilisateurs peuvent exporter leurs données personnelles depuis les paramètres de leur profil.</li>
          <li><strong>Droit de rectification :</strong> Les utilisateurs peuvent mettre à jour leur profil directement.</li>
          <li><strong>Droit à l'effacement :</strong> Les utilisateurs peuvent supprimer leur compte ; traitement sous 30 jours, à l'exception des données conservées légalement.</li>
          <li><strong>Droit à la portabilité :</strong> Export dans un format lisible par machine disponible sur demande.</li>
          <li><strong>Droit d'opposition :</strong> Les utilisateurs peuvent s'opposer aux traitements non essentiels.</li>
        </ul>
        <p className="font-medium mt-3">
          Soumettez une demande DSAR à <a href="mailto:privacy@siteviral.com" className="text-primary underline">privacy@siteviral.com</a>. Réponse sous 30 jours.
        </p>

        <h2 className="text-xl font-extrabold mt-8 mb-3">8. Notification de violation</h2>
        <p className="font-medium">En cas de violation de données personnelles, nous notifierons le Responsable dans les meilleurs délais et dans un délai de 72 heures, en fournissant les détails et les mesures correctives.</p>

        <h2 className="text-xl font-extrabold mt-8 mb-3">9. Contact</h2>
        <p className="font-medium">
          Hacktualiz Inc.<br />
          131 Continental Dr, Suite 305, Newark, DE 19713, États-Unis<br />
          E-mail : <a href="mailto:privacy@siteviral.com" className="text-primary underline">privacy@siteviral.com</a>
        </p>
      </div>
    </LegalPageShell>
  );
}