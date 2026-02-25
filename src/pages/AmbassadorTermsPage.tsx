import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';

export default function AmbassadorTermsPage() {
  return (
    <LegalPageShell>
      <SEOHead
        title="Conditions du Programme Ambassadeur — Siteviral"
        description="Conditions d'utilisation du Programme Ambassadeur Siteviral. Commissions, obligations, paiements et résiliation."
      />

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">Conditions du Programme Ambassadeur</h1>
      <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : 25 février 2026</p>

      <div className={proseClasses}>
        <p>
          Les présentes Conditions Générales (« CGU Ambassadeur ») régissent votre participation au Programme Ambassadeur
          proposé par Siteviral, opéré par <strong>Hacktualiz Inc.</strong>, 131 Continental Dr, Suite 305, Newark, DE 19713, États-Unis.
        </p>

        <h2>1. Définitions</h2>
        <ul>
          <li><strong>« Ambassadeur »</strong> : tout utilisateur inscrit sur Siteviral ayant activé un lien d'affiliation pour une ou plusieurs Plateformes.</li>
          <li><strong>« Plateforme »</strong> : une organisation inscrite sur Siteviral ayant activé le programme d'affiliation.</li>
          <li><strong>« Lien d'affiliation »</strong> : URL unique contenant un code de tracking attribué à l'Ambassadeur.</li>
          <li><strong>« Commission »</strong> : la rémunération versée à l'Ambassadeur pour chaque vente réalisée via son Lien d'affiliation.</li>
          <li><strong>« Conversion »</strong> : un achat ou un don effectué par un visiteur ayant cliqué sur un Lien d'affiliation dans la fenêtre d'attribution.</li>
        </ul>

        <h2>2. Adhésion au Programme</h2>
        <p>
          L'adhésion au Programme Ambassadeur est gratuite et ouverte à tout utilisateur inscrit sur Siteviral.
          L'Ambassadeur active son statut en créant un lien d'affiliation pour une Plateforme ayant activé le programme.
          Aucune approbation préalable n'est requise. L'Ambassadeur accepte les présentes CGU dès la création de son premier lien.
        </p>

        <h2>3. Fonctionnement de l'Attribution</h2>
        <p>Siteviral utilise un modèle d'attribution « last-click » avec une fenêtre de 7 jours :</p>
        <ul>
          <li>Lorsqu'un visiteur clique sur un Lien d'affiliation, un cookie de tracking est déposé pour 7 jours.</li>
          <li>Si le visiteur effectue un achat ou un don dans cette fenêtre, la commission est attribuée à l'Ambassadeur.</li>
          <li>En cas de clics multiples sur différents liens, le dernier clic (« last-click ») l'emporte.</li>
          <li>Les attributions sont vérifiées côté serveur pour garantir l'exactitude.</li>
        </ul>

        <h2>4. Taux de Commission</h2>
        <p>
          Le taux de commission est défini par chaque Plateforme et peut varier de <strong>5% à 50%</strong> du montant brut
          de la transaction. Le taux applicable est affiché sur la page de la Plateforme et dans l'espace Ambassadeur.
          Siteviral se réserve le droit de plafonner les taux à 50%.
        </p>

        <h2>5. Délai de Sécurité et Disponibilité</h2>
        <p>
          Les commissions sont soumises à un <strong>délai de sécurité de 15 jours</strong> après la transaction.
          Pendant cette période, la commission reste en statut « En attente ». Ce délai permet de traiter les éventuels
          remboursements, litiges ou contestations. Après ce délai, la commission passe en statut « Disponible ».
        </p>

        <h2>6. Vérification d'Identité (KYC)</h2>
        <p>
          Avant tout premier retrait, l'Ambassadeur doit compléter une <strong>vérification d'identité (KYC)</strong>.
          Cette vérification est réalisée au niveau de la Plateforme dont l'Ambassadeur est membre.
          Aucun paiement ne sera effectué tant que la vérification n'est pas approuvée.
        </p>

        <h2>7. Paiement des Commissions</h2>
        <p>Les paiements sont effectués via la plateforme Paystack selon les modalités suivantes :</p>
        <ul>
          <li><strong>Méthodes de paiement :</strong> Mobile Money (Orange, MTN, Moov) ou virement bancaire selon le pays.</li>
          <li><strong>Seuil minimum :</strong> le retrait est possible dès que le solde disponible atteint le seuil défini.</li>
          <li><strong>Délai de traitement :</strong> 3 à 8 jours ouvrés après la demande de retrait.</li>
          <li><strong>Verrouillage :</strong> après le premier paiement réussi, la méthode de paiement est automatiquement verrouillée pour des raisons de sécurité.</li>
        </ul>

        <h2>8. Obligations de l'Ambassadeur</h2>
        <p>L'Ambassadeur s'engage à :</p>
        <ul>
          <li>Promouvoir les Plateformes et leurs produits de manière honnête et éthique.</li>
          <li>Ne pas utiliser de méthodes trompeuses (spam, fausses promesses, publicité mensongère).</li>
          <li>Ne pas s'auto-référencer (les propriétaires d'une Plateforme ne peuvent pas être Ambassadeurs de leur propre Plateforme).</li>
          <li>Respecter les lois applicables en matière de publicité et de protection des consommateurs.</li>
          <li>Mentionner clairement son statut d'Ambassadeur lorsque la réglementation l'exige.</li>
          <li>Ne pas manipuler les clics, générer du trafic frauduleux, ou utiliser des bots.</li>
        </ul>

        <h2>9. Interdictions et Fraude</h2>
        <p>Les pratiques suivantes sont strictement interdites et entraîneront la suspension immédiate :</p>
        <ul>
          <li>Auto-référencement sous quelque forme que ce soit.</li>
          <li>Utilisation de trafic artificiel, bots, ou fermes de clics.</li>
          <li>Création de comptes multiples pour contourner les restrictions.</li>
          <li>Utilisation de marques déposées dans les liens publicitaires payants sans autorisation.</li>
          <li>Toute manipulation du système de tracking ou d'attribution.</li>
        </ul>
        <p>
          En cas de fraude détectée, Siteviral se réserve le droit de suspendre ou résilier le compte, annuler les commissions
          non payées, et engager des poursuites si nécessaire.
        </p>

        <h2>10. Suspension et Gel des Paiements</h2>
        <p>
          Siteviral ou la Plateforme peut geler les paiements d'un Ambassadeur en cas de suspicion de fraude,
          de litige en cours, ou de violation des présentes CGU. L'Ambassadeur sera notifié par email.
          Les fonds gelés seront libérés ou annulés selon l'issue de l'investigation.
        </p>

        <h2>11. Résiliation</h2>
        <p>
          L'Ambassadeur peut cesser sa participation à tout moment en supprimant ses liens d'affiliation.
          Les commissions acquises et disponibles resteront payables. Siteviral se réserve le droit de résilier
          la participation d'un Ambassadeur à tout moment, avec ou sans motif, moyennant notification par email.
        </p>

        <h2>12. Responsabilité et Garanties</h2>
        <p>
          Siteviral fournit le Programme Ambassadeur « en l'état ». Siteviral ne garantit pas un niveau minimum de revenus.
          Les Plateformes peuvent modifier ou supprimer leur programme à tout moment.
          Siteviral n'est pas responsable des décisions des Plateformes concernant les taux de commission.
        </p>

        <h2>13. Droit Applicable et Juridiction</h2>
        <p>
          Les présentes CGU sont régies par les lois de l'État du Delaware, États-Unis. Tout litige sera soumis
          à la juridiction exclusive des tribunaux de l'État du Delaware.
        </p>

        <hr />
        <p className="text-sm text-muted-foreground">
          En participant au Programme Ambassadeur, vous confirmez avoir lu et accepté les présentes Conditions.
          Contact : <a href="mailto:support@siteviral.com" className="text-primary hover:underline">support@siteviral.com</a>.
        </p>
      </div>
    </LegalPageShell>
  );
}
