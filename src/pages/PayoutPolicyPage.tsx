import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';

export default function PayoutPolicyPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <LegalPageShell>
      <SEOHead
        title={isFr ? 'Politique de Retrait — Siteviral' : 'Payout Policy — Siteviral'}
        description={isFr ? 'Conditions de retrait des fonds sur Siteviral. Délais, KYC, méthodes de paiement et seuils minimums.' : 'Fund withdrawal conditions on Siteviral. Timelines, KYC, payment methods and minimum thresholds.'}
        canonicalUrl="https://siteviral.com/payout-policy"
      />
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">
        {isFr ? 'Politique de Retrait (Payout Policy)' : 'Payout Policy'}
      </h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium">
        {isFr ? 'Dernière mise à jour : 22 février 2026' : 'Last updated: February 22, 2026'}
      </p>

      <div className={proseClasses}>
        <section>
          <h2>{isFr ? '1. Éligibilité aux retraits' : '1. Withdrawal Eligibility'}</h2>
          <p>{isFr ? 'Pour pouvoir retirer des fonds, une organisation doit :' : 'To withdraw funds, an organization must:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Avoir complété la vérification KYC (Know Your Customer)' : 'Have completed KYC (Know Your Customer) verification'}</li>
            <li>{isFr ? 'Disposer d\'un compte bancaire vérifié' : 'Have a verified bank account'}</li>
            <li>{isFr ? <>Avoir un solde minimum de <strong>5 000 XOF</strong></> : <>Have a minimum balance of <strong>5,000 XOF</strong></>}</li>
            <li>{isFr ? 'Ne pas être sous suspension, investigation ou gel de fonds' : 'Not be under suspension, investigation, or fund freeze'}</li>
            <li>{isFr ? 'Ne pas avoir de fraud flags actifs non résolus' : 'Not have active unresolved fraud flags'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '2. Statuts des retraits' : '2. Withdrawal Statuses'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Pending :</strong> {isFr ? 'La demande a été soumise' : 'The request has been submitted'}</li>
            <li><strong>Approved :</strong> {isFr ? 'La demande a été validée par l\'équipe' : 'The request has been approved by the team'}</li>
            <li><strong>Sent :</strong> {isFr ? 'Le virement a été initié' : 'The transfer has been initiated'}</li>
            <li><strong>Rejected :</strong> {isFr ? 'La demande a été refusée (motif communiqué)' : 'The request was rejected (reason communicated)'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '3. Délais de traitement (SLA)' : '3. Processing Timelines (SLA)'}</h2>
          <p><strong>{isFr ? 'Organisations (vendeurs) :' : 'Organizations (sellers):'}</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? <>Période de rétention des fonds : <strong>72 heures</strong> après chaque transaction confirmée</> : <>Fund retention period: <strong>72 hours</strong> after each confirmed transaction</>}</li>
            <li>{isFr ? <>Examen de la demande de retrait : <strong>72 heures</strong> ouvrées</> : <>Withdrawal request review: <strong>72 business hours</strong></>}</li>
            <li>{isFr ? <>Exécution du virement après approbation : <strong>3 à 5 jours</strong> ouvrés</> : <>Transfer execution after approval: <strong>3 to 5 business days</strong></>}</li>
            <li>{isFr ? <>Délai total estimé : <strong>6 à 8 jours</strong> ouvrés</> : <>Estimated total timeline: <strong>6 to 8 business days</strong></>}</li>
          </ul>
          <p><strong>{isFr ? 'Affiliés :' : 'Affiliates:'}</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? <>Période de validation des commissions : <strong>15 jours</strong> après la transaction</> : <>Commission validation period: <strong>15 days</strong> after the transaction</>}</li>
            <li>{isFr ? <>Examen de la demande de retrait : <strong>72 heures</strong> ouvrées</> : <>Withdrawal request review: <strong>72 business hours</strong></>}</li>
            <li>{isFr ? <>Exécution du virement après approbation : <strong>3 à 5 jours</strong> ouvrés</> : <>Transfer execution after approval: <strong>3 to 5 business days</strong></>}</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            {isFr ? 'Note : Les délais peuvent être prolongés en cas de vérification supplémentaire requise.' : 'Note: Timelines may be extended if additional verification is required.'}
          </p>
        </section>

        <section>
          <h2>{isFr ? '4. Commissions d\'affiliation' : '4. Affiliate Commissions'}</h2>
          <p>{isFr ? 'Les commissions des affiliés suivent un calendrier spécifique :' : 'Affiliate commissions follow a specific schedule:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? <>Période de validation : <strong>15 jours</strong> après la transaction</> : <>Validation period: <strong>15 days</strong> after the transaction</>}</li>
            <li>{isFr ? 'Les commissions passent de « pending » à « payable » après la période de validation' : 'Commissions move from "pending" to "payable" after the validation period'}</li>
            <li>{isFr ? <>Montant minimum de retrait affilié : <strong>2 500 XOF</strong></> : <>Minimum affiliate withdrawal amount: <strong>2,500 XOF</strong></>}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '5. Frais de retrait' : '5. Withdrawal Fees'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Frais de plateforme : déduits automatiquement lors de chaque transaction' : 'Platform fees: automatically deducted on each transaction'}</li>
            <li>{isFr ? 'Frais de virement bancaire : selon les conditions de Paystack' : 'Bank transfer fees: per Paystack terms'}</li>
            <li>{isFr ? 'Aucun frais supplémentaire appliqué par Siteviral lors du retrait' : 'No additional fees charged by Siteviral on withdrawal'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '6. Séparation des fonds' : '6. Fund Segregation'}</h2>
          <p>{isFr ? 'Les fonds des organisations sont séparés des fonds de la plateforme. Siteviral agit en tant que processeur de paiements et ne détient pas les fonds des organisations au-delà du délai de traitement nécessaire.' : 'Organization funds are segregated from platform funds. Siteviral acts as a payment processor and does not hold organization funds beyond the necessary processing period.'}</p>
        </section>

        <section>
          <h2>{isFr ? '7. Gel des fonds' : '7. Fund Freeze'}</h2>
          <p>{isFr ? 'Siteviral se réserve le droit de geler les fonds dans les cas suivants :' : 'Siteviral reserves the right to freeze funds in the following cases:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Suspicion de fraude ou d\'activité AML' : 'Suspected fraud or AML activity'}</li>
            <li>{isFr ? 'Dispute ou demande de remboursement en cours' : 'Ongoing dispute or refund request'}</li>
            <li>{isFr ? 'Chargeback initié par un acheteur' : 'Chargeback initiated by a buyer'}</li>
            <li>{isFr ? 'Non-conformité KYC ou documents expirés' : 'KYC non-compliance or expired documents'}</li>
          </ul>
          <p>{isFr ? 'L\'organisation sera notifiée et pourra fournir des justificatifs.' : 'The organization will be notified and may provide supporting documents.'}</p>
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
