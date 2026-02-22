import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';

export default function TermsPage() {
  return (
    <LegalPageShell>
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">Conditions Générales d'Utilisation</h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium">Dernière mise à jour : 22 février 2026</p>

      <div className={proseClasses}>
        <section>
          <h2>1. Introduction</h2>
          <p>
            Les présentes Conditions Générales d'Utilisation (« CGU ») régissent l'accès et l'utilisation de <strong>Siteviral</strong> (« la Plateforme »),
            un produit édité et exploité par <strong>Hacktualiz Inc.</strong>, société de droit américain (Delaware C-Corporation), dont le siège social est situé au :
          </p>
          <p className="font-medium">
            131 Continental Dr, Suite 305, Newark, DE 19713, United States.
          </p>
          <p>
            En accédant ou en utilisant la Plateforme, vous acceptez les présentes CGU dans leur intégralité.
            Si vous n'acceptez pas ces conditions, vous devez cesser d'utiliser la Plateforme immédiatement.
          </p>
        </section>

        <section>
          <h2>2. Description du Service</h2>
          <p>Siteviral est une plateforme SaaS multi-tenant qui offre les services suivants :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Création et gestion de pages communautaires pour organisations, associations et leaders</li>
            <li>Vente de produits numériques (ebooks, cours, formations, ressources)</li>
            <li>Collecte de dons et campagnes de financement</li>
            <li>Programmes de formation structurés (modules, leçons, progression)</li>
            <li>Système d'affiliation et de parrainage</li>
            <li>Publication et diffusion de contenu multimédia (vidéos, audios, reels)</li>
            <li>Traitement des paiements via Paystack</li>
            <li>Gestion des membres et des rôles au sein des organisations</li>
          </ul>
        </section>

        <section>
          <h2>3. Éligibilité</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>L'utilisateur doit être âgé d'au moins <strong>18 ans</strong> ou disposer de l'autorisation d'un représentant légal</li>
            <li>L'utilisation de la Plateforme à des fins illégales, frauduleuses ou contraires aux lois applicables est strictement interdite</li>
            <li>Les organisations situées dans des pays sous sanctions internationales (OFAC, UE, ONU) ne sont pas autorisées à utiliser la Plateforme</li>
          </ul>
        </section>

        <section>
          <h2>4. Comptes Utilisateurs</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>L'utilisateur s'engage à fournir des informations exactes, à jour et complètes lors de l'inscription</li>
            <li>L'utilisateur est seul responsable de la sécurité de ses identifiants de connexion et de toute activité effectuée sous son compte</li>
            <li>L'utilisateur doit notifier immédiatement Siteviral en cas d'utilisation non autorisée de son compte</li>
            <li>Siteviral se réserve le droit de suspendre ou de supprimer tout compte en cas de violation des présentes CGU</li>
          </ul>
        </section>

        <section>
          <h2>5. Organisations (Multi-tenant)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Chaque organisation est responsable du contenu qu'elle publie sur la Plateforme</li>
            <li>L'organisation est responsable des produits qu'elle vend et des fonds qu'elle collecte</li>
            <li><strong>Siteviral agit en tant qu'infrastructure technique et intermédiaire de paiement, et non en tant que vendeur direct.</strong> Siteviral ne garantit pas la qualité, la légalité ou la conformité des produits et services proposés par les organisations</li>
            <li>Les organisations doivent respecter les lois et réglementations applicables dans leur juridiction</li>
          </ul>
        </section>

        <section>
          <h2>6. Paiements</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Les transactions financières sont traitées par <strong>Paystack</strong>, prestataire de paiement agréé</li>
            <li>Les fonds collectés font l'objet d'un <strong>split automatique</strong> : commission de la plateforme + commission d'affiliation (le cas échéant) + montant net pour l'organisation</li>
            <li>Les frais de transaction Paystack sont à la charge de l'organisation ou de l'acheteur selon la configuration</li>
            <li>Les <strong>taxes et obligations fiscales</strong> sont à la charge de l'organisation. Siteviral ne fournit pas de conseil fiscal</li>
            <li>Les méthodes de paiement disponibles dépendent de la couverture régionale de Paystack. Des fournisseurs supplémentaires pourront être ajoutés</li>
          </ul>
        </section>

        <section>
          <h2>7. Affiliation</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Le système d'affiliation utilise l'<strong>attribution last-click</strong></li>
            <li>Le cookie d'affiliation a une durée de <strong>7 jours</strong></li>
            <li>L'<strong>auto-parrainage</strong> (gagner une commission sur ses propres achats) est interdit et détecté automatiquement</li>
            <li>Siteviral se réserve le droit d'<strong>annuler des commissions</strong> en cas de fraude, manipulation ou violation des CGU</li>
            <li>Les commissions d'affiliation sont soumises à une période de validation de 72 heures avant d'être disponibles pour retrait</li>
          </ul>
        </section>

        <section>
          <h2>8. KYC & Payout</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>La <strong>vérification KYC</strong> (Know Your Customer) est obligatoire pour toute organisation souhaitant recevoir des paiements</li>
            <li>Le délai minimum de retrait est de <strong>72 heures</strong> après approbation de la demande</li>
            <li>Siteviral se réserve le droit de <strong>geler les retraits</strong> en cas de suspicion de fraude, activité suspecte ou non-conformité AML</li>
            <li>Consultez notre <a href="/payout-policy" className="text-primary underline">Politique de Retrait</a> pour les détails complets</li>
          </ul>
        </section>

        <section>
          <h2>9. Remboursements</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Les produits numériques sont <strong>généralement non remboursables</strong> une fois téléchargés ou consultés, sauf en cas de défaut technique avéré</li>
            <li>Les dons sont par nature volontaires et non remboursables, sauf erreur technique</li>
            <li>Consultez notre <a href="/refund-policy" className="text-primary underline">Politique de Remboursement</a> pour les conditions détaillées, délais et procédures</li>
          </ul>
        </section>

        <section>
          <h2>10. Activités interdites</h2>
          <p>Les utilisateurs et organisations s'engagent à ne pas :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Utiliser la Plateforme pour le <strong>blanchiment d'argent</strong> ou le financement d'activités illicites</li>
            <li>Créer des organisations fictives ou frauduleuses pour collecter des fonds</li>
            <li>Publier du contenu illégal, diffamatoire, haineux, violent ou portant atteinte aux droits d'autrui</li>
            <li>Pratiquer l'<strong>usurpation d'identité</strong> ou la représentation frauduleuse</li>
            <li>Vendre des produits contrefaits, volés ou en violation des droits de propriété intellectuelle</li>
            <li>Manipuler les systèmes de commission, d'affiliation ou de métriques</li>
            <li>Consultez notre <a href="/acceptable-use" className="text-primary underline">Politique d'Utilisation Acceptable</a> pour la liste complète</li>
          </ul>
        </section>

        <section>
          <h2>11. Suspension & Résiliation</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Siteviral se réserve le droit de <strong>suspendre</strong> tout compte ou organisation en cas de violation des CGU, sans préavis ni indemnité</li>
            <li>En cas de suspension, les <strong>retraits sont gelés</strong> jusqu'à résolution de l'enquête</li>
            <li>Les fonds gelés seront libérés uniquement après résolution satisfaisante, ou transmis aux autorités compétentes si requis par la loi</li>
            <li>L'utilisateur peut <strong>supprimer son compte</strong> à tout moment depuis les paramètres de son profil</li>
          </ul>
        </section>

        <section>
          <h2>12. Limitation de responsabilité</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Siteviral fournit la Plateforme « en l'état » et ne garantit pas une disponibilité ininterrompue</li>
            <li>Siteviral <strong>n'est pas responsable</strong> du contenu publié par les organisations sur la Plateforme</li>
            <li>Siteviral ne saurait être tenu responsable des <strong>dommages indirects</strong>, pertes de revenus, pertes de données ou dommages consécutifs résultant de l'utilisation de la Plateforme</li>
            <li>La responsabilité maximale de Siteviral est limitée au montant des frais de plateforme payés par l'utilisateur au cours des 12 derniers mois</li>
          </ul>
        </section>

        <section>
          <h2>13. Indemnisation</h2>
          <p>
            L'utilisateur s'engage à <strong>indemniser et dégager de toute responsabilité</strong> Hacktualiz Inc., ses dirigeants, employés et agents,
            contre toute réclamation, perte, dommage, coût ou dépense (y compris les honoraires d'avocats raisonnables) résultant de :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Son utilisation de la Plateforme en violation des présentes CGU</li>
            <li>Son contenu publié sur la Plateforme</li>
            <li>Sa violation des droits de tiers</li>
            <li>Sa violation des lois et réglementations applicables</li>
          </ul>
        </section>

        <section>
          <h2>14. Loi applicable & Juridiction</h2>
          <p>
            Les présentes CGU sont régies par les <strong>lois de l'État du Delaware</strong> (États-Unis d'Amérique).
          </p>
          <p>
            Tout litige relatif à l'interprétation ou à l'exécution des présentes sera soumis à la
            <strong> compétence exclusive des tribunaux de l'État du Delaware</strong>, après tentative de résolution amiable
            dans un délai de 30 jours.
          </p>
        </section>

        <section>
          <h2>15. Modifications des conditions</h2>
          <p>
            Siteviral se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés
            de toute modification substantielle par notification sur la Plateforme et/ou par email. La poursuite de
            l'utilisation après notification vaut acceptation des CGU modifiées.
          </p>
        </section>

        <section>
          <h2>16. Contact</h2>
          <p>Pour toute question relative aux présentes CGU :</p>
          <p className="font-medium">
            Hacktualiz Inc.<br />
            131 Continental Dr, Suite 305<br />
            Newark, DE 19713, United States<br />
            Email : legal@siteviral.com
          </p>
        </section>
      </div>
    </LegalPageShell>
  );
}
