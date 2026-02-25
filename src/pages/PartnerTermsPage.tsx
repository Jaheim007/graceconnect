import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';

export default function PartnerTermsPage() {
  return (
    <LegalPageShell>
      <SEOHead title="Contrat de Partenariat – Siteviral" description="Conditions du Programme Partenaires Officiel Siteviral." />

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">Contrat de Partenariat</h1>
      <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : 25 février 2026</p>

      <div className={proseClasses}>
        <p>
          Le présent contrat (« Contrat ») est conclu entre <strong>Hacktualiz Inc.</strong>, société C-Corp enregistrée au
          Delaware, États-Unis (« Siteviral », « la Plateforme », « nous ») et toute personne physique ou morale acceptant
          les termes ci-dessous (« le Partenaire », « vous »).
        </p>

        <h2>1. Objet</h2>
        <p>
          Le Programme Partenaires permet au Partenaire de référer des organisations tierces à la Plateforme en échange
          de commissions récurrentes calculées sur les frais de plateforme générés par ces organisations.
        </p>

        <h2>2. Conditions d'éligibilité</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Être âgé d'au moins 18 ans.</li>
          <li>Fournir des informations exactes lors de l'inscription.</li>
          <li>Compléter la vérification d'identité (KYC) avant le premier paiement.</li>
          <li>Ne pas être propriétaire ni administrateur des organisations référées.</li>
          <li>Respecter les Conditions Générales et la Politique d'Utilisation Acceptable de Siteviral.</li>
        </ul>

        <h2>3. Fonctionnement</h2>
        <p>
          <strong>3.1 Code d'invitation.</strong> Chaque Partenaire approuvé reçoit un code d'invitation unique. Lorsqu'une
          organisation est créée en utilisant ce code, elle est automatiquement attribuée au Partenaire.
        </p>
        <p>
          <strong>3.2 Attribution.</strong> L'attribution est permanente et exclusive : une organisation ne peut être attribuée
          qu'à un seul Partenaire. Les auto-référencements sont détectés et interdits.
        </p>
        <p>
          <strong>3.3 Activation.</strong> Une organisation référée devient « active » lorsqu'elle réalise sa première
          transaction monétisée sur la Plateforme.
        </p>

        <h2>4. Rémunération</h2>
        <p>
          <strong>4.1 Base de calcul.</strong> Les commissions sont calculées exclusivement sur la part des <strong>frais de
          plateforme</strong> (platform fee) collectés sur chaque transaction monétisée. Les donations pures ne génèrent
          pas de commission partenaire.
        </p>
        <p>
          <strong>4.2 Taux de commission.</strong> Le taux varie selon le niveau du Partenaire :
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Bronze</strong> (10+ orgs actives) : 5%</li>
          <li><strong>Argent</strong> (50+) : 8%</li>
          <li><strong>Or</strong> (150+) : 10%</li>
          <li><strong>Platine</strong> (300+) : 12%</li>
          <li><strong>Diamant</strong> (1 000+) : 15%</li>
        </ul>
        <p>Siteviral se réserve le droit d'accorder un taux personnalisé à tout Partenaire.</p>

        <p>
          <strong>4.3 Période de rétention.</strong> Chaque commission est retenue pendant <strong>15 jours calendaires</strong> après
          la transaction pour couvrir les éventuels remboursements ou litiges. Après cette période, la commission devient
          « payable ».
        </p>
        <p>
          <strong>4.4 Seuil minimum.</strong> Le seuil minimum de retrait est de <strong>5 000 XOF</strong> (ou équivalent).
        </p>
        <p>
          <strong>4.5 Méthodes de paiement.</strong> Les paiements sont effectués via virement bancaire ou Mobile Money
          (Orange Money, MTN Mobile Money, Moov Money) selon la disponibilité dans votre pays.
        </p>

        <h2>5. Vérification d'identité (KYC)</h2>
        <p>
          Avant tout premier paiement, le Partenaire doit compléter la vérification d'identité en fournissant une pièce
          d'identité valide (carte nationale d'identité, passeport ou permis de conduire). Les informations fournies
          sont traitées conformément à notre Politique de Confidentialité.
        </p>

        <h2>6. Obligations du Partenaire</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Ne pas utiliser de méthodes trompeuses, de spam ou de pratiques abusives pour recruter des organisations.</li>
          <li>Ne pas créer de faux comptes ou d'organisations fictives.</li>
          <li>Ne pas usurper l'identité de Siteviral ou prétendre être un employé.</li>
          <li>Respecter toutes les lois applicables, y compris les réglementations anti-blanchiment (AML).</li>
          <li>Informer immédiatement Siteviral de tout changement dans ses coordonnées bancaires.</li>
        </ul>

        <h2>7. Suspension et résiliation</h2>
        <p>
          <strong>7.1</strong> Siteviral peut suspendre ou résilier le compte d'un Partenaire à tout moment en cas de
          violation du présent Contrat, d'activité frauduleuse, ou de non-respect des lois applicables.
        </p>
        <p>
          <strong>7.2</strong> En cas de résiliation, les commissions « payables » déjà acquises seront versées dans un
          délai de 30 jours. Les commissions « en attente » (held) seront annulées.
        </p>
        <p>
          <strong>7.3</strong> Le Partenaire peut résilier sa participation au programme à tout moment en contactant
          support@siteviral.com. Les commissions payables seront versées selon les conditions ci-dessus.
        </p>

        <h2>8. Limitation de responsabilité</h2>
        <p>
          Siteviral ne garantit aucun niveau de revenu. Les commissions dépendent de l'activité commerciale des
          organisations référées. Siteviral ne sera pas responsable des pertes indirectes liées à la participation
          au Programme.
        </p>

        <h2>9. Propriété intellectuelle</h2>
        <p>
          Le Partenaire n'acquiert aucun droit sur les marques, logos ou contenus de Siteviral. L'utilisation de la
          marque Siteviral à des fins promotionnelles doit être préalablement autorisée par écrit.
        </p>

        <h2>10. Confidentialité</h2>
        <p>
          Le Partenaire s'engage à ne pas divulguer les informations confidentielles auxquelles il pourrait avoir accès,
          notamment les données financières, les taux personnalisés ou les informations sur d'autres partenaires.
        </p>

        <h2>11. Modifications</h2>
        <p>
          Siteviral peut modifier le présent Contrat à tout moment. Les modifications entrent en vigueur 30 jours après
          notification par email. La poursuite de la participation au Programme après ce délai vaut acceptation.
        </p>

        <h2>12. Droit applicable</h2>
        <p>
          Le présent Contrat est régi par les lois de l'État du Delaware, États-Unis. Tout litige sera soumis à la
          juridiction exclusive des tribunaux du Delaware.
        </p>

        <h2>13. Contact</h2>
        <p>
          Pour toute question relative au Programme Partenaires :<br />
          <strong>Email :</strong> partners@siteviral.com<br />
          <strong>Adresse :</strong> Hacktualiz Inc., 131 Continental Dr, Suite 305, Newark, DE 19713, United States
        </p>
      </div>
    </LegalPageShell>
  );
}
