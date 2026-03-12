import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';

export default function AmbassadorTermsPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <LegalPageShell>
      <SEOHead
        title={isFr ? 'Conditions du Programme Ambassadeur — Siteviral' : 'Ambassador Program Terms — Siteviral'}
        description={isFr ? "Conditions d'utilisation du Programme Ambassadeur Siteviral. Commissions, obligations, paiements et résiliation." : 'Siteviral Ambassador Program terms. Commissions, obligations, payments, and termination.'}
      />

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
        {isFr ? 'Conditions du Programme Ambassadeur' : 'Ambassador Program Terms'}
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        {isFr ? 'Dernière mise à jour : 25 février 2026' : 'Last updated: February 25, 2026'}
      </p>

      <div className={proseClasses}>
        <p>
          {isFr
            ? 'Les présentes Conditions Générales (« CGU Ambassadeur ») régissent votre participation au Programme Ambassadeur proposé par Siteviral, opéré par Hacktualiz Inc., 131 Continental Dr, Suite 305, Newark, DE 19713, États-Unis.'
            : 'These Terms ("Ambassador Terms") govern your participation in the Ambassador Program offered by Siteviral, operated by Hacktualiz Inc., 131 Continental Dr, Suite 305, Newark, DE 19713, United States.'}
        </p>

        <h2>{isFr ? '1. Définitions' : '1. Definitions'}</h2>
        <ul>
          <li><strong>{isFr ? '« Ambassadeur »' : '"Ambassador"'}</strong> : {isFr ? "tout utilisateur inscrit sur Siteviral ayant activé un lien d'affiliation pour une ou plusieurs Plateformes." : 'any registered Siteviral user who has activated an affiliate link for one or more Platforms.'}</li>
          <li><strong>{isFr ? '« Plateforme »' : '"Platform"'}</strong> : {isFr ? "une organisation inscrite sur Siteviral ayant activé le programme d'affiliation." : 'an organization registered on Siteviral that has activated the affiliate program.'}</li>
          <li><strong>{isFr ? "« Lien d'affiliation »" : '"Affiliate Link"'}</strong> : {isFr ? "URL unique contenant un code de tracking attribué à l'Ambassadeur." : 'unique URL containing a tracking code assigned to the Ambassador.'}</li>
          <li><strong>{isFr ? '« Commission »' : '"Commission"'}</strong> : {isFr ? "la rémunération versée à l'Ambassadeur pour chaque vente réalisée via son Lien d'affiliation." : 'the compensation paid to the Ambassador for each sale made via their Affiliate Link.'}</li>
          <li><strong>{isFr ? '« Conversion »' : '"Conversion"'}</strong> : {isFr ? "un achat ou un don effectué par un visiteur ayant cliqué sur un Lien d'affiliation dans la fenêtre d'attribution." : 'a purchase or donation made by a visitor who clicked on an Affiliate Link within the attribution window.'}</li>
        </ul>

        <h2>{isFr ? '2. Adhésion au Programme' : '2. Program Enrollment'}</h2>
        <p>
          {isFr
            ? "L'adhésion au Programme Ambassadeur est gratuite et ouverte à tout utilisateur inscrit sur Siteviral. L'Ambassadeur active son statut en créant un lien d'affiliation pour une Plateforme ayant activé le programme. Aucune approbation préalable n'est requise. L'Ambassadeur accepte les présentes CGU dès la création de son premier lien."
            : 'Enrollment in the Ambassador Program is free and open to any registered Siteviral user. The Ambassador activates their status by creating an affiliate link for a Platform that has enabled the program. No prior approval is required. The Ambassador accepts these Terms upon creating their first link.'}
        </p>

        <h2>{isFr ? "3. Fonctionnement de l'Attribution" : '3. Attribution Mechanism'}</h2>
        <p>{isFr ? 'Siteviral utilise un modèle d\'attribution « last-click » avec une fenêtre de 7 jours :' : 'Siteviral uses a "last-click" attribution model with a 7-day window:'}</p>
        <ul>
          <li>{isFr ? "Lorsqu'un visiteur clique sur un Lien d'affiliation, un cookie de tracking est déposé pour 7 jours." : 'When a visitor clicks on an Affiliate Link, a tracking cookie is set for 7 days.'}</li>
          <li>{isFr ? "Si le visiteur effectue un achat ou un don dans cette fenêtre, la commission est attribuée à l'Ambassadeur." : 'If the visitor makes a purchase or donation within this window, the commission is attributed to the Ambassador.'}</li>
          <li>{isFr ? 'En cas de clics multiples sur différents liens, le dernier clic (« last-click ») l\'emporte.' : 'In case of multiple clicks on different links, the last click prevails.'}</li>
          <li>{isFr ? "Les attributions sont vérifiées côté serveur pour garantir l'exactitude." : 'Attributions are verified server-side to ensure accuracy.'}</li>
        </ul>

        <h2>{isFr ? '4. Taux de Commission' : '4. Commission Rate'}</h2>
        <p>
          {isFr
            ? 'Le taux de commission est défini par chaque Plateforme et peut varier de 5% à 50% du montant brut de la transaction. Le taux applicable est affiché sur la page de la Plateforme et dans l\'espace Ambassadeur. Siteviral se réserve le droit de plafonner les taux à 50%.'
            : 'The commission rate is defined by each Platform and can range from 5% to 50% of the gross transaction amount. The applicable rate is displayed on the Platform page and in the Ambassador dashboard. Siteviral reserves the right to cap rates at 50%.'}
        </p>

        <h2>{isFr ? '5. Délai de Sécurité et Disponibilité' : '5. Holding Period and Availability'}</h2>
        <p>
          {isFr
            ? 'Les commissions sont soumises à un délai de sécurité de 15 jours après la transaction. Pendant cette période, la commission reste en statut « En attente ». Ce délai permet de traiter les éventuels remboursements, litiges ou contestations. Après ce délai, la commission passe en statut « Disponible ».'
            : 'Commissions are subject to a 15-day holding period after the transaction. During this period, the commission remains in "Pending" status. This delay allows for processing potential refunds, disputes, or contestations. After this period, the commission moves to "Available" status.'}
        </p>

        <h2>{isFr ? "6. Vérification d'Identité (KYC)" : '6. Identity Verification (KYC)'}</h2>
        <p>
          {isFr
            ? "Avant tout premier retrait, l'Ambassadeur doit compléter une vérification d'identité (KYC). Cette vérification est réalisée au niveau de la Plateforme dont l'Ambassadeur est membre. Aucun paiement ne sera effectué tant que la vérification n'est pas approuvée."
            : "Before any first withdrawal, the Ambassador must complete an identity verification (KYC). This verification is performed at the Platform level where the Ambassador is a member. No payment will be made until verification is approved."}
        </p>

        <h2>{isFr ? '7. Paiement des Commissions' : '7. Commission Payments'}</h2>
        <p>{isFr ? 'Les paiements sont effectués via la plateforme Paystack selon les modalités suivantes :' : 'Payments are made via the Paystack platform according to the following terms:'}</p>
        <ul>
          <li><strong>{isFr ? 'Méthodes de paiement :' : 'Payment methods:'}</strong> {isFr ? 'Mobile Money (Orange, MTN, Moov) ou virement bancaire selon le pays.' : 'Mobile Money (Orange, MTN, Moov) or bank transfer depending on the country.'}</li>
          <li><strong>{isFr ? 'Seuil minimum :' : 'Minimum threshold:'}</strong> {isFr ? 'le retrait est possible dès que le solde disponible atteint le seuil défini.' : 'withdrawal is possible once the available balance reaches the defined threshold.'}</li>
          <li><strong>{isFr ? 'Délai de traitement :' : 'Processing time:'}</strong> {isFr ? '3 à 8 jours ouvrés après la demande de retrait.' : '3 to 8 business days after withdrawal request.'}</li>
          <li><strong>{isFr ? 'Verrouillage :' : 'Lock:'}</strong> {isFr ? 'après le premier paiement réussi, la méthode de paiement est automatiquement verrouillée pour des raisons de sécurité.' : 'after the first successful payment, the payment method is automatically locked for security reasons.'}</li>
        </ul>

        <h2>{isFr ? "8. Obligations de l'Ambassadeur" : '8. Ambassador Obligations'}</h2>
        <p>{isFr ? "L'Ambassadeur s'engage à :" : 'The Ambassador agrees to:'}</p>
        <ul>
          <li>{isFr ? 'Promouvoir les Plateformes et leurs produits de manière honnête et éthique.' : 'Promote Platforms and their products honestly and ethically.'}</li>
          <li>{isFr ? 'Ne pas utiliser de méthodes trompeuses (spam, fausses promesses, publicité mensongère).' : 'Not use deceptive methods (spam, false promises, misleading advertising).'}</li>
          <li>{isFr ? "Ne pas s'auto-référencer (les propriétaires d'une Plateforme ne peuvent pas être Ambassadeurs de leur propre Plateforme)." : 'Not self-refer (Platform owners cannot be Ambassadors for their own Platform).'}</li>
          <li>{isFr ? 'Respecter les lois applicables en matière de publicité et de protection des consommateurs.' : 'Comply with applicable advertising and consumer protection laws.'}</li>
          <li>{isFr ? "Mentionner clairement son statut d'Ambassadeur lorsque la réglementation l'exige." : 'Clearly disclose Ambassador status when required by regulations.'}</li>
          <li>{isFr ? 'Ne pas manipuler les clics, générer du trafic frauduleux, ou utiliser des bots.' : 'Not manipulate clicks, generate fraudulent traffic, or use bots.'}</li>
        </ul>

        <h2>{isFr ? '9. Interdictions et Fraude' : '9. Prohibitions and Fraud'}</h2>
        <p>{isFr ? 'Les pratiques suivantes sont strictement interdites et entraîneront la suspension immédiate :' : 'The following practices are strictly prohibited and will result in immediate suspension:'}</p>
        <ul>
          <li>{isFr ? 'Auto-référencement sous quelque forme que ce soit.' : 'Self-referral in any form.'}</li>
          <li>{isFr ? 'Utilisation de trafic artificiel, bots, ou fermes de clics.' : 'Use of artificial traffic, bots, or click farms.'}</li>
          <li>{isFr ? 'Création de comptes multiples pour contourner les restrictions.' : 'Creating multiple accounts to bypass restrictions.'}</li>
          <li>{isFr ? 'Utilisation de marques déposées dans les liens publicitaires payants sans autorisation.' : 'Use of trademarks in paid advertising links without authorization.'}</li>
          <li>{isFr ? "Toute manipulation du système de tracking ou d'attribution." : 'Any manipulation of the tracking or attribution system.'}</li>
        </ul>
        <p>
          {isFr
            ? "En cas de fraude détectée, Siteviral se réserve le droit de suspendre ou résilier le compte, annuler les commissions non payées, et engager des poursuites si nécessaire."
            : 'In case of detected fraud, Siteviral reserves the right to suspend or terminate the account, cancel unpaid commissions, and pursue legal action if necessary.'}
        </p>

        <h2>{isFr ? '10. Suspension et Gel des Paiements' : '10. Suspension and Payment Freeze'}</h2>
        <p>
          {isFr
            ? "Siteviral ou la Plateforme peut geler les paiements d'un Ambassadeur en cas de suspicion de fraude, de litige en cours, ou de violation des présentes CGU. L'Ambassadeur sera notifié par email. Les fonds gelés seront libérés ou annulés selon l'issue de l'investigation."
            : "Siteviral or the Platform may freeze an Ambassador's payments in case of suspected fraud, ongoing dispute, or violation of these Terms. The Ambassador will be notified by email. Frozen funds will be released or cancelled depending on the investigation outcome."}
        </p>

        <h2>{isFr ? '11. Résiliation' : '11. Termination'}</h2>
        <p>
          {isFr
            ? "L'Ambassadeur peut cesser sa participation à tout moment en supprimant ses liens d'affiliation. Les commissions acquises et disponibles resteront payables. Siteviral se réserve le droit de résilier la participation d'un Ambassadeur à tout moment, avec ou sans motif, moyennant notification par email."
            : "The Ambassador may cease participation at any time by deleting their affiliate links. Earned and available commissions will remain payable. Siteviral reserves the right to terminate an Ambassador's participation at any time, with or without cause, upon email notification."}
        </p>

        <h2>{isFr ? '12. Responsabilité et Garanties' : '12. Liability and Warranties'}</h2>
        <p>
          {isFr
            ? "Siteviral fournit le Programme Ambassadeur « en l'état ». Siteviral ne garantit pas un niveau minimum de revenus. Les Plateformes peuvent modifier ou supprimer leur programme à tout moment. Siteviral n'est pas responsable des décisions des Plateformes concernant les taux de commission."
            : 'Siteviral provides the Ambassador Program "as is". Siteviral does not guarantee a minimum level of income. Platforms may modify or cancel their program at any time. Siteviral is not responsible for Platform decisions regarding commission rates.'}
        </p>

        <h2>{isFr ? '13. Droit Applicable et Juridiction' : '13. Governing Law and Jurisdiction'}</h2>
        <p>
          {isFr
            ? "Les présentes CGU sont régies par les lois de l'État du Delaware, États-Unis. Tout litige sera soumis à la juridiction exclusive des tribunaux de l'État du Delaware."
            : 'These Terms are governed by the laws of the State of Delaware, United States. Any dispute shall be subject to the exclusive jurisdiction of the courts of the State of Delaware.'}
        </p>

        <hr />
        <p className="text-sm text-muted-foreground">
          {isFr
            ? 'En participant au Programme Ambassadeur, vous confirmez avoir lu et accepté les présentes Conditions.'
            : 'By participating in the Ambassador Program, you confirm that you have read and accepted these Terms.'}
          {' '}Contact : <a href="mailto:support@siteviral.com" className="text-primary hover:underline">support@siteviral.com</a>.
        </p>
      </div>
    </LegalPageShell>
  );
}
