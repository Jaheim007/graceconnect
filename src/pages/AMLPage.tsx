import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';

export default function AMLPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <LegalPageShell>
      <SEOHead
        title={isFr ? 'Politique Anti-Blanchiment (AML) — Siteviral' : 'Anti-Money Laundering (AML) Policy — Siteviral'}
        description={isFr ? 'Engagement de Siteviral contre le blanchiment d\'argent et le financement du terrorisme.' : 'Siteviral\'s commitment against money laundering and terrorism financing.'}
        canonicalUrl="https://siteviral.com/aml"
      />
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">
        {isFr ? 'Politique Anti-Blanchiment (AML)' : 'Anti-Money Laundering (AML) Policy'}
      </h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium">
        {isFr ? 'Dernière mise à jour : 22 février 2026' : 'Last updated: February 22, 2026'}
      </p>

      <div className={proseClasses}>
        <section>
          <h2>{isFr ? '1. Engagement' : '1. Commitment'}</h2>
          <p>{isFr ? 'Siteviral, opéré par Hacktualiz Inc. (Delaware, USA), s\'engage fermement à lutter contre le blanchiment d\'argent, le financement du terrorisme et toute activité financière illicite sur sa plateforme.' : 'Siteviral, operated by Hacktualiz Inc. (Delaware, USA), is firmly committed to combating money laundering, terrorism financing, and any illicit financial activity on its platform.'}</p>
        </section>

        <section>
          <h2>{isFr ? '2. Cadre réglementaire' : '2. Regulatory Framework'}</h2>
          <p>{isFr ? 'Notre politique AML est conforme aux réglementations suivantes :' : 'Our AML policy complies with the following regulations:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Bank Secrecy Act (BSA) et réglementations FinCEN (États-Unis)' : 'Bank Secrecy Act (BSA) and FinCEN regulations (United States)'}</li>
            <li>{isFr ? 'Directives du Groupe d\'Action Financière (GAFI/FATF)' : 'Financial Action Task Force (FATF) guidelines'}</li>
            <li>{isFr ? 'Réglementations applicables dans les juridictions où nous opérons' : 'Applicable regulations in jurisdictions where we operate'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '3. Procédure KYC (Know Your Customer)' : '3. KYC (Know Your Customer) Procedure'}</h2>
          <p>{isFr ? 'Toute organisation souhaitant recevoir des paiements doit compléter une vérification d\'identité :' : 'Any organization wishing to receive payments must complete identity verification:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>{isFr ? 'Niveau 1' : 'Level 1'}</strong> : {isFr ? 'Pièce d\'identité du responsable + document de l\'organisation' : 'ID of the responsible person + organization document'}</li>
            <li><strong>{isFr ? 'Niveau 2' : 'Level 2'}</strong> : {isFr ? 'Informations bancaires vérifiées pour les retraits' : 'Verified banking information for withdrawals'}</li>
            <li>{isFr ? 'Vérification renforcée pour les volumes supérieurs à 5 000 000 XOF/mois' : 'Enhanced verification for volumes exceeding 5,000,000 XOF/month'}</li>
            <li>{isFr ? 'Vérification superadmin obligatoire avant approbation' : 'Mandatory superadmin verification before approval'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '4. Surveillance des transactions' : '4. Transaction Monitoring'}</h2>
          <p>{isFr ? 'Siteviral met en œuvre des mécanismes automatiques de surveillance :' : 'Siteviral implements automatic monitoring mechanisms:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Détection de volumes anormalement élevés (velocity limits)' : 'Detection of abnormally high volumes (velocity limits)'}</li>
            <li>{isFr ? 'Identification de transactions suspectes (montants, fréquence, patterns)' : 'Identification of suspicious transactions (amounts, frequency, patterns)'}</li>
            <li>{isFr ? 'Signalement automatique (fraud flags) pour examen manuel' : 'Automatic flagging (fraud flags) for manual review'}</li>
            <li>{isFr ? 'Blocage automatique des transactions dépassant les seuils définis' : 'Automatic blocking of transactions exceeding defined thresholds'}</li>
            <li>{isFr ? 'Revue manuelle systématique des demandes de retrait' : 'Systematic manual review of withdrawal requests'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '5. Gel et suspension' : '5. Freeze and Suspension'}</h2>
          <p>{isFr ? 'Siteviral se réserve le droit de geler les fonds et suspendre toute organisation en cas de suspicion de blanchiment d\'argent ou d\'activité frauduleuse, et ce sans préavis. Le gel inclut :' : 'Siteviral reserves the right to freeze funds and suspend any organization in case of suspected money laundering or fraudulent activity, without prior notice. The freeze includes:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Motif documenté' : 'Documented reason'}</li>
            <li>{isFr ? 'Durée estimée' : 'Estimated duration'}</li>
            <li>{isFr ? 'Les fonds gelés seront libérés uniquement après résolution satisfaisante de l\'enquête' : 'Frozen funds will only be released after satisfactory resolution of the investigation'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '6. Déclaration de soupçon' : '6. Suspicious Activity Reporting'}</h2>
          <p>{isFr ? 'Conformément à nos obligations légales, toute transaction suspecte sera signalée aux autorités compétentes, y compris le FinCEN aux États-Unis et les organismes équivalents dans les juridictions où l\'activité suspecte a eu lieu.' : 'In accordance with our legal obligations, any suspicious transaction will be reported to the relevant authorities, including FinCEN in the United States and equivalent agencies in jurisdictions where the suspicious activity occurred.'}</p>
        </section>

        <section>
          <h2>{isFr ? '7. Conservation des données' : '7. Data Retention'}</h2>
          <p>{isFr ? <>Les données relatives aux vérifications KYC et aux transactions sont conservées pendant une durée minimale de <strong>5 ans</strong> après la fin de la relation commerciale, conformément aux obligations réglementaires.</> : <>Data related to KYC verifications and transactions is retained for a minimum of <strong>5 years</strong> after the end of the business relationship, in accordance with regulatory obligations.</>}</p>
        </section>

        <section>
          <h2>8. {isFr ? 'Sanctions, Embargos & Pays Restreints' : 'Sanctions, Embargoes & Restricted Countries'}</h2>
          <p>{isFr ? 'En tant qu\'entité américaine, Hacktualiz Inc. se conforme à tous les programmes de sanctions applicables administrés par l\'OFAC, l\'Union européenne et les autres autorités compétentes.' : 'As a US-incorporated entity, Hacktualiz Inc. complies with all applicable sanctions programs administered by OFAC, the European Union, and other relevant authorities.'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Nous ne fournissons pas de services aux personnes ou entités figurant sur la liste SDN de l\'OFAC ou les listes de sanctions internationales équivalentes' : 'We do not provide services to individuals or entities on OFAC\'s SDN list or equivalent international sanctions lists'}</li>
            <li>{isFr ? 'Les organisations situées dans des pays/régions sous sanctions globales ne peuvent pas utiliser la plateforme' : 'Organizations located in comprehensively sanctioned countries/regions are prohibited from using the platform'}</li>
            <li>{isFr ? 'Toutes les demandes de retrait sont soumises à une revue manuelle et peuvent être gelées si des risques de sanctions sont identifiés' : 'All payout requests are subject to manual review and may be frozen if sanctions risks are identified'}</li>
            <li>{isFr ? 'Nous nous réservons le droit de refuser le service, geler les fonds et signaler toute activité suspecte aux autorités compétentes' : 'We reserve the right to refuse service, freeze funds, and report suspicious activity to relevant authorities'}</li>
          </ul>
          <p className="mt-3">{isFr ? 'Si nous déterminons qu\'une organisation ou un individu opère en violation des sanctions applicables, son compte sera immédiatement suspendu et les fonds gelés en attente d\'investigation.' : 'If we determine that an organization or individual is operating in violation of applicable sanctions, their account will be immediately suspended and funds frozen pending investigation.'}</p>
        </section>

        <section>
          <h2>{isFr ? '9. Formation et sensibilisation' : '9. Training and Awareness'}</h2>
          <p>{isFr ? 'L\'équipe Siteviral reçoit une formation régulière sur les procédures AML et les indicateurs de transactions suspectes.' : 'The Siteviral team receives regular training on AML procedures and suspicious transaction indicators.'}</p>
        </section>

        <section>
          <h2>10. Contact</h2>
          <p>{isFr ? 'Pour signaler une activité suspecte ou pour toute question relative à notre politique AML :' : 'To report suspicious activity or for any questions regarding our AML policy:'}</p>
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
