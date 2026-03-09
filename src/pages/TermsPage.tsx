import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';

export default function TermsPage() {
  return (
    <LegalPageShell>
      <SEOHead title="Conditions d'utilisation — Siteviral" description="Lisez les Conditions d'utilisation de Siteviral. Règles d'usage, droits et responsabilités pour tous les utilisateurs." canonicalUrl="https://siteviral.com/terms" />
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">Conditions d'utilisation</h1>
      <p className="text-lg font-bold text-foreground mb-1">SITEVIRAL</p>
      <p className="text-sm text-muted-foreground mb-8 font-medium">Dernière mise à jour : 22 février 2026</p>

      <div className={proseClasses}>
        <section>
          <h2>1. Introduction</h2>
          <p>
            Les présentes Conditions d'utilisation (« Conditions ») régissent l'accès et l'utilisation de la plateforme Siteviral, y compris tous les sites web associés,
            sous-domaines (dont siteviral.com et siteviral.co), applications et services (collectivement, le « Service »).
          </p>
          <p>Le Service est opéré par <strong>Hacktualiz Inc.</strong>, une société du Delaware (C-Corporation), dont le siège social est situé au :</p>
          <p className="font-medium">
            Hacktualiz Inc.<br />
            131 Continental Dr, Suite 305<br />
            Newark, DE 19713<br />
            États-Unis
          </p>
          <p>Dans les présentes Conditions :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>« Société », « nous », « notre »</strong> désigne Hacktualiz Inc.</li>
            <li><strong>« Siteviral »</strong> désigne le produit et la plateforme opérée par la Société.</li>
            <li><strong>« Utilisateur », « vous », « votre »</strong> désigne toute personne physique ou morale accédant au Service ou l'utilisant.</li>
            <li><strong>« Organisation »</strong> désigne toute entité, communauté, entreprise, ONG, organisme religieux ou leader opérant au sein de Siteviral.</li>
            <li><strong>« Membre »</strong> désigne un utilisateur qui rejoint ou interagit avec une Organisation.</li>
            <li><strong>« Affilié »</strong> désigne un utilisateur participant au programme d'affiliation Siteviral.</li>
          </ul>
          <p>
            En accédant au Service ou en l'utilisant, vous acceptez d'être lié par les présentes Conditions.
            <strong> Si vous n'acceptez pas, vous ne devez pas accéder au Service ni l'utiliser.</strong>
          </p>
        </section>

        <section>
          <h2>2. Description du Service</h2>
          <p>Siteviral est une infrastructure SaaS multi-tenant qui permet aux Organisations de :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Publier et distribuer du contenu numérique (vidéos, audio, médias)</li>
            <li>Vendre des produits numériques</li>
            <li>Accepter des dons</li>
            <li>Opérer des programmes de marketing d'affiliation</li>
            <li>Gérer des membres et des communications</li>
            <li>Traiter des versements sous réserve de conformité et vérification KYC</li>
          </ul>
          <p>
            La Société fournit l'infrastructure et les outils de facilitation de paiement.
            <strong> La Société n'agit pas en tant que vendeur de produits, destinataire de dons (sauf frais de plateforme) ou fournisseur du contenu des Organisations.</strong>
          </p>
          <p>Les Organisations restent seules responsables de leur contenu, de leurs offres et de leur conformité aux lois applicables.</p>
        </section>

        <section>
          <h2>3. Éligibilité</h2>
          <p>Pour utiliser le Service :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Vous devez avoir au moins <strong>18 ans</strong> ou l'âge de la majorité légale dans votre juridiction.</li>
            <li>Vous devez avoir la capacité juridique de conclure des contrats contraignants.</li>
            <li>Si vous agissez au nom d'une Organisation, vous devez avoir l'autorité pour engager cette Organisation.</li>
          </ul>
          <p>La Société peut refuser le service à toute personne ou entité à sa seule discrétion.</p>
        </section>

        <section>
          <h2>4. Inscription du compte</h2>
          <p>Pour accéder à certaines fonctionnalités, vous devez créer un compte. Vous acceptez de :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Fournir des informations exactes et complètes.</li>
            <li>Maintenir la sécurité de vos identifiants de connexion.</li>
            <li>Nous notifier immédiatement en cas d'utilisation non autorisée.</li>
            <li>Accepter l'entière responsabilité de toute activité sous votre compte.</li>
          </ul>
          <p>La Société n'est pas responsable des pertes résultant d'un accès non autorisé dû à votre défaut de protection de vos identifiants.</p>
        </section>

        <section>
          <h2>5. Organisations & Responsabilité du contenu</h2>
          <p>Les Organisations peuvent créer des pages publiques et proposer des produits, dons et liens d'affiliation.</p>
          <p>Chaque Organisation déclare et garantit que :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Elle a le droit légal de proposer son contenu, ses produits et ses services.</li>
            <li>Ses activités sont conformes à toutes les lois et réglementations applicables.</li>
            <li>Son contenu ne porte pas atteinte aux droits de propriété intellectuelle.</li>
            <li>Ses activités ne violent pas les lois AML, anti-fraude, sanctions ou exportation.</li>
          </ul>
          <p>La Société n'examine pas l'ensemble du contenu et n'est pas responsable de la légalité, l'exactitude ou la qualité des contenus des Organisations.</p>
          <p>La Société se réserve le droit de suspendre, restreindre ou supprimer tout contenu ou Organisation en violation des présentes Conditions.</p>
        </section>

        <section>
          <h2>6. Paiements</h2>
          <h3 className="text-lg font-bold text-foreground mt-4 mb-2">6.1 Traitement des paiements</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Les paiements sont traités par des prestataires de paiement tiers, notamment Paystack.</li>
            <li>La disponibilité des moyens de paiement peut varier selon le pays et la juridiction.</li>
            <li>La Société ne stocke pas les données complètes de carte bancaire.</li>
          </ul>
          <h3 className="text-lg font-bold text-foreground mt-4 mb-2">6.2 Frais de plateforme</h3>
          <p>La Société peut facturer des frais de plateforme sur les transactions traitées via le Service. Ces frais peuvent varier selon le plan ou la configuration.</p>
          <h3 className="text-lg font-bold text-foreground mt-4 mb-2">6.3 Répartition des transactions</h3>
          <p>Pour les transactions éligibles :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Des frais de plateforme sont retenus par la Société.</li>
            <li>Une commission d'affiliation (le cas échéant) est allouée.</li>
            <li>Le montant restant est alloué à l'Organisation.</li>
          </ul>
          <p>Toutes les répartitions sont automatisées.</p>
        </section>

        <section>
          <h2>7. Programme d'affiliation</h2>
          <p>Le système d'affiliation permet aux utilisateurs de promouvoir des Organisations et de percevoir des commissions.</p>
          <p>Les commissions d'affiliation :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Sont soumises à l'attribution au dernier clic dans une fenêtre de cookie définie.</li>
            <li>Peuvent faire l'objet d'un examen pour fraude ou abus.</li>
            <li>Deviennent payables uniquement après une période de rétention (minimum 15 jours).</li>
          </ul>
          <p>L'auto-parrainage, les activités frauduleuses, le trafic artificiel ou la manipulation des mécanismes d'attribution sont <strong>strictement interdits</strong>.</p>
          <p>La Société peut annuler les commissions jugées frauduleuses.</p>
        </section>

        <section>
          <h2>8. KYC & Versements</h2>
          <p>Pour recevoir des versements, les Organisations et Affiliés peuvent être tenus de compléter une vérification d'identité (« KYC »).</p>
          <p>La Société se réserve le droit de :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Demander des documents supplémentaires.</li>
            <li>Retarder les versements pour examen.</li>
            <li>Geler les versements en cas de fraude, litige, examen AML ou rétrofacturation.</li>
            <li>Refuser les versements si les normes de conformité ne sont pas respectées.</li>
          </ul>
          <p>Les délais de versement peuvent varier en fonction de l'examen de conformité et du traitement par le prestataire de paiement.</p>
        </section>

        <section>
          <h2>9. Remboursements & Rétrofacturations</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Les biens numériques sont généralement <strong>non remboursables</strong> sauf indication contraire explicite.</li>
            <li>Les Organisations sont responsables du respect de leurs politiques de remboursement applicables.</li>
          </ul>
          <p>La Société peut :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Geler les versements en cas de rétrofacturations excessives.</li>
            <li>Déduire les montants de rétrofacturation des versements futurs.</li>
            <li>Utiliser les journaux de transactions et de téléchargements comme preuve de livraison en cas de litige.</li>
          </ul>
        </section>

        <section>
          <h2>10. Activités interdites</h2>
          <p>Les Utilisateurs et Organisations ne peuvent pas utiliser le Service pour :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>La fraude ou la tromperie</li>
            <li>Le blanchiment d'argent</li>
            <li>Le financement du terrorisme</li>
            <li>La violation de propriété intellectuelle</li>
            <li>La vente de biens ou services illégaux</li>
            <li>Les discours de haine ou contenus violents</li>
            <li>La distribution de logiciels malveillants</li>
            <li>L'usurpation d'identité ou la fraude à l'identité</li>
            <li>Les violations de sanctions</li>
          </ul>
          <p>Toute violation peut entraîner une suspension immédiate et un signalement aux autorités.</p>
        </section>

        <section>
          <h2>11. Suspension & Résiliation</h2>
          <p>La Société peut suspendre ou résilier l'accès à sa seule discrétion, notamment en cas de :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Violation des présentes Conditions</li>
            <li>Indicateurs de fraude</li>
            <li>Préoccupations réglementaires</li>
            <li>Risques de sécurité</li>
          </ul>
          <p>En cas de résiliation, l'accès au Service peut cesser immédiatement.</p>
        </section>

        <section>
          <h2>12. Propriété intellectuelle</h2>
          <p>La plateforme Siteviral, y compris le design, le logiciel, les marques et l'image de marque, est la propriété de <strong>Hacktualiz Inc.</strong></p>
          <p>Les Utilisateurs conservent la propriété de leur contenu mais accordent à la Société une licence limitée pour héberger et afficher ce contenu dans le cadre du fonctionnement du Service.</p>
        </section>

        <section>
          <h2>13. Exclusions de garantie</h2>
          <p>Le Service est fourni <strong>« EN L'ÉTAT »</strong> et <strong>« SELON DISPONIBILITÉ ».</strong></p>
          <p>La Société ne fournit aucune garantie concernant :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>La disponibilité</li>
            <li>La fiabilité</li>
            <li>Les résultats financiers</li>
            <li>La génération de revenus</li>
            <li>La conformité légale des Organisations</li>
          </ul>
        </section>

        <section>
          <h2>14. Limitation de responsabilité</h2>
          <p>Dans la mesure maximale permise par la loi, Hacktualiz Inc. ne saurait être tenue responsable de :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Dommages indirects ou consécutifs</li>
            <li>Perte de bénéfices</li>
            <li>Perte de données</li>
            <li>Interruption d'activité</li>
          </ul>
          <p>La responsabilité totale ne saurait excéder les frais payés à la Société au cours des 12 mois précédents.</p>
        </section>

        <section>
          <h2>15. Indemnisation</h2>
          <p>Vous acceptez d'<strong>indemniser et de dégager de toute responsabilité</strong> Hacktualiz Inc., ses dirigeants, employés et affiliés de toute réclamation découlant de :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Votre utilisation du Service</li>
            <li>Votre contenu</li>
            <li>Votre violation des présentes Conditions</li>
            <li>Votre violation de la loi</li>
          </ul>
        </section>

        <section>
          <h2>16. Droit applicable</h2>
          <p>
            Les présentes Conditions sont régies par les <strong>lois de l'État du Delaware</strong>, États-Unis, sans égard aux principes de conflits de lois.
          </p>
          <p>
            Tout litige sera résolu devant les tribunaux compétents du Delaware, sauf exigence contraire du droit applicable.
          </p>
        </section>

        <section>
          <h2>17. Modifications</h2>
          <p>La Société peut modifier les présentes Conditions à tout moment. L'utilisation continue du Service constitue l'acceptation des Conditions mises à jour.</p>
        </section>

        <section>
          <h2>18. Contact</h2>
          <p>Pour toute question juridique :</p>
          <p className="font-medium">
            Hacktualiz Inc.<br />
            131 Continental Dr, Suite 305<br />
            Newark, DE 19713<br />
            États-Unis
          </p>
          <p className="font-medium mt-2">
            Contact : <a href="mailto:legal@siteviral.com" className="text-primary underline">legal@siteviral.com</a><br />
            Confidentialité : <a href="mailto:privacy@siteviral.com" className="text-primary underline">privacy@siteviral.com</a>
          </p>
        </section>

        <p className="text-sm text-muted-foreground mt-10 text-center">© 2026 Hacktualiz Inc. Tous droits réservés.</p>
      </div>
    </LegalPageShell>
  );
}