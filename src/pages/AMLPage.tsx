import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';

export default function AMLPage() {
  return (
    <LegalPageShell>
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">Politique Anti-Blanchiment (AML)</h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium">Dernière mise à jour : 22 février 2026</p>

      <div className={proseClasses}>
        <section>
          <h2>1. Engagement</h2>
          <p>
            Siteviral, opéré par Hacktualiz Inc. (Delaware, USA), s'engage fermement à lutter contre le blanchiment d'argent,
            le financement du terrorisme et toute activité financière illicite sur sa plateforme.
          </p>
        </section>

        <section>
          <h2>2. Cadre réglementaire</h2>
          <p>Notre politique AML est conforme aux réglementations suivantes :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Bank Secrecy Act (BSA) et réglementations FinCEN (États-Unis)</li>
            <li>Directives du Groupe d'Action Financière (GAFI/FATF)</li>
            <li>Réglementations applicables dans les juridictions où nous opérons</li>
          </ul>
        </section>

        <section>
          <h2>3. Procédure KYC (Know Your Customer)</h2>
          <p>Toute organisation souhaitant recevoir des paiements doit compléter une vérification d'identité :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Niveau 1</strong> : Pièce d'identité du responsable + document de l'organisation</li>
            <li><strong>Niveau 2</strong> : Informations bancaires vérifiées pour les retraits</li>
            <li>Vérification renforcée pour les volumes supérieurs à 5 000 000 XOF/mois</li>
            <li>Vérification superadmin obligatoire avant approbation</li>
          </ul>
        </section>

        <section>
          <h2>4. Surveillance des transactions</h2>
          <p>Siteviral met en œuvre des mécanismes automatiques de surveillance :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Détection de volumes anormalement élevés (velocity limits)</li>
            <li>Identification de transactions suspectes (montants, fréquence, patterns)</li>
            <li>Signalement automatique (fraud flags) pour examen manuel</li>
            <li>Blocage automatique des transactions dépassant les seuils définis</li>
            <li>Revue manuelle systématique des demandes de retrait</li>
          </ul>
        </section>

        <section>
          <h2>5. Gel et suspension</h2>
          <p>
            Siteviral se réserve le droit de geler les fonds (<code>payouts_frozen</code>) et suspendre toute organisation en cas de suspicion
            de blanchiment d'argent ou d'activité frauduleuse, et ce sans préavis. Le gel inclut :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Motif documenté (<code>payout_freeze_reason</code>)</li>
            <li>Durée estimée (<code>payouts_frozen_until</code>)</li>
            <li>Les fonds gelés seront libérés uniquement après résolution satisfaisante de l'enquête</li>
          </ul>
        </section>

        <section>
          <h2>6. Déclaration de soupçon</h2>
          <p>
            Conformément à nos obligations légales, toute transaction suspecte sera signalée aux autorités compétentes,
            y compris le FinCEN aux États-Unis et les organismes équivalents dans les juridictions
            où l'activité suspecte a eu lieu.
          </p>
        </section>

        <section>
          <h2>7. Conservation des données</h2>
          <p>
            Les données relatives aux vérifications KYC et aux transactions sont conservées pendant une durée minimale
            de <strong>5 ans</strong> après la fin de la relation commerciale, conformément aux obligations réglementaires.
          </p>
        </section>

        <section>
          <h2>8. Sanctions, Embargoes & Restricted Countries</h2>
          <p>
            As a US-incorporated entity, Hacktualiz Inc. complies with all applicable sanctions programs administered by the
            Office of Foreign Assets Control (OFAC), the European Union, and other relevant authorities.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>We do not provide services to individuals or entities on OFAC's Specially Designated Nationals (SDN) list or equivalent international sanctions lists</li>
            <li>Organizations located in comprehensively sanctioned countries/regions are prohibited from using the platform</li>
            <li>All payout requests are subject to manual review and may be frozen if sanctions risks are identified</li>
            <li>We reserve the right to refuse service, freeze funds, and report suspicious activity to relevant authorities</li>
          </ul>
          <p className="mt-3">
            If we determine that an organization or individual is operating in violation of applicable sanctions,
            their account will be immediately suspended and funds frozen pending investigation.
          </p>
        </section>

        <section>
          <h2>9. Formation et sensibilisation</h2>
          <p>
            L'équipe Siteviral reçoit une formation régulière sur les procédures AML et les indicateurs de transactions suspectes.
          </p>
        </section>

        <section>
          <h2>10. Contact</h2>
          <p>Pour signaler une activité suspecte ou pour toute question relative à notre politique AML :</p>
          <p className="font-medium">
            Hacktualiz Inc.<br />
            Compliance Department<br />
            131 Continental Dr, Suite 305, Newark, DE 19713, USA<br />
            Email : compliance@siteviral.com
          </p>
        </section>
      </div>
    </LegalPageShell>
  );
}
