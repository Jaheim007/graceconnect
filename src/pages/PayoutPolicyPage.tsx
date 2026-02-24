import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';

export default function PayoutPolicyPage() {
  return (
    <LegalPageShell>
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">Politique de Retrait (Payout Policy)</h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium">Dernière mise à jour : 22 février 2026</p>

      <div className={proseClasses}>
        <section>
          <h2>1. Éligibilité aux retraits</h2>
          <p>Pour pouvoir retirer des fonds, une organisation doit :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Avoir complété la vérification KYC (Know Your Customer)</li>
            <li>Disposer d'un compte bancaire vérifié</li>
            <li>Avoir un solde minimum de <strong>5 000 XOF</strong></li>
            <li>Ne pas être sous suspension, investigation ou gel de fonds</li>
            <li>Ne pas avoir de fraud flags actifs non résolus</li>
          </ul>
        </section>

        <section>
          <h2>2. Statuts des retraits</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Pending :</strong> La demande a été soumise</li>
            <li><strong>Approved :</strong> La demande a été validée par l'équipe</li>
            <li><strong>Sent :</strong> Le virement a été initié</li>
            <li><strong>Rejected :</strong> La demande a été refusée (motif communiqué)</li>
          </ul>
        </section>

        <section>
          <h2>3. Délais de traitement (SLA)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Examen de la demande : <strong>72 heures</strong> ouvrées</li>
            <li>Exécution du virement après approbation : <strong>3 à 5 jours</strong> ouvrés</li>
            <li>Délai total estimé : <strong>5 à 8 jours</strong> ouvrés</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            Note : Les délais peuvent être prolongés en cas de vérification supplémentaire requise.
          </p>
        </section>

        <section>
          <h2>4. Commissions d'affiliation</h2>
          <p>Les commissions des affiliés suivent un calendrier spécifique :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Période de validation : <strong>15 jours</strong> après la transaction</li>
            <li>Les commissions passent de « pending » à « payable » après la période de validation</li>
            <li>Montant minimum de retrait affilié : <strong>2 500 XOF</strong></li>
          </ul>
        </section>

        <section>
          <h2>5. Frais de retrait</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Frais de plateforme : déduits automatiquement lors de chaque transaction</li>
            <li>Frais de virement bancaire : selon les conditions de Paystack</li>
            <li>Aucun frais supplémentaire appliqué par Siteviral lors du retrait</li>
          </ul>
        </section>

        <section>
          <h2>6. Séparation des fonds</h2>
          <p>
            Les fonds des organisations sont séparés des fonds de la plateforme. Siteviral agit en tant que
            processeur de paiements et ne détient pas les fonds des organisations au-delà du délai de traitement nécessaire.
          </p>
        </section>

        <section>
          <h2>7. Gel des fonds</h2>
          <p>Siteviral se réserve le droit de geler les fonds dans les cas suivants :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Suspicion de fraude ou d'activité AML</li>
            <li>Dispute ou demande de remboursement en cours</li>
            <li>Chargeback initié par un acheteur</li>
            <li>Non-conformité KYC ou documents expirés</li>
          </ul>
          <p>L'organisation sera notifiée et pourra fournir des justificatifs.</p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p className="font-medium">
            Hacktualiz Inc.<br />
            Finance & Payouts<br />
            131 Continental Dr, Suite 305, Newark, DE 19713, USA<br />
            Email : payouts@siteviral.com
          </p>
        </section>
      </div>
    </LegalPageShell>
  );
}
