import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';

export default function RefundPolicyPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <LegalPageShell>
      <SEOHead
        title={isFr ? 'Politique de Remboursement — Siteviral' : 'Refund Policy — Siteviral'}
        description={isFr ? 'Conditions de remboursement sur Siteviral. Produits numériques, dons, délais et procédures.' : 'Refund conditions on Siteviral. Digital products, donations, timelines and procedures.'}
        canonicalUrl="https://siteviral.com/refund-policy"
      />
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">
        {isFr ? 'Politique de Remboursement' : 'Refund Policy'}
      </h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium">
        {isFr ? 'Dernière mise à jour : 22 février 2026' : 'Last updated: February 22, 2026'}
      </p>

      <div className={proseClasses}>
        <section>
          <h2>{isFr ? '1. Principes généraux' : '1. General Principles'}</h2>
          <p>{isFr ? 'Siteviral agit en tant qu\'intermédiaire technique entre les organisations et leurs clients/donateurs. Les remboursements sont traités conformément aux conditions suivantes.' : 'Siteviral acts as a technical intermediary between organizations and their clients/donors. Refunds are processed in accordance with the following conditions.'}</p>
        </section>

        <section>
          <h2>{isFr ? '2. Produits numériques' : '2. Digital Products'}</h2>
          <p>{isFr ? 'En raison de la nature immédiatement accessible des produits numériques :' : 'Due to the immediately accessible nature of digital products:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? <>Les achats de produits numériques sont <strong>généralement non remboursables</strong> une fois le contenu téléchargé ou consulté</> : <>Digital product purchases are <strong>generally non-refundable</strong> once the content has been downloaded or accessed</>}</li>
            <li>{isFr ? <>Un remboursement peut être accordé dans les <strong>48 heures</strong> suivant l'achat si le produit n'a pas été téléchargé et si le contenu est défectueux</> : <>A refund may be granted within <strong>48 hours</strong> of purchase if the product has not been downloaded and the content is defective or does not match the description</>}</li>
            <li>{isFr ? 'Les produits avec lien externe ne sont pas éligibles au remboursement via Siteviral' : 'Products with external links are not eligible for refund via Siteviral'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '3. Dons' : '3. Donations'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? <>Les dons sont par nature volontaires et <strong>non remboursables</strong></> : <>Donations are voluntary by nature and <strong>non-refundable</strong></>}</li>
            <li>{isFr ? 'En cas d\'erreur technique avérée (double débit, montant incorrect), un remboursement sera traité sous 72 heures' : 'In case of a verified technical error (double charge, incorrect amount), a refund will be processed within 72 hours'}</li>
            <li>{isFr ? 'Les demandes doivent être adressées à support@siteviral.com avec la référence de transaction' : 'Requests must be sent to support@siteviral.com with the transaction reference'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '4. Procédure de demande et délais' : '4. Request Procedure and Timelines'}</h2>
          <p>{isFr ? 'Pour demander un remboursement :' : 'To request a refund:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? <>Envoyez un email à <strong>support@siteviral.com</strong> dans les 48h suivant l'achat</> : <>Send an email to <strong>support@siteviral.com</strong> within 48 hours of purchase</>}</li>
            <li>{isFr ? 'Incluez votre référence de transaction (format SV-XXXXX)' : 'Include your transaction reference (format SV-XXXXX)'}</li>
            <li>{isFr ? 'Décrivez le motif de votre demande' : 'Describe the reason for your request'}</li>
          </ul>
          <p className="mt-3">{isFr ? 'Délais de traitement :' : 'Processing timelines:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>{isFr ? 'Accusé de réception :' : 'Acknowledgment:'}</strong> {isFr ? '24 heures ouvrées' : '24 business hours'}</li>
            <li><strong>{isFr ? 'Décision :' : 'Decision:'}</strong> {isFr ? '5 jours ouvrés maximum' : '5 business days maximum'}</li>
            <li><strong>{isFr ? 'Remboursement effectif :' : 'Effective refund:'}</strong> {isFr ? '5 à 10 jours ouvrés après décision favorable' : '5 to 10 business days after favorable decision'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '5. Rôles dans le processus' : '5. Roles in the Process'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>{isFr ? 'Organisation (Admin) :' : 'Organization (Admin):'}</strong> {isFr ? 'Premier niveau de résolution — peut approuver les remboursements directs pour ses produits' : 'First level of resolution — can approve direct refunds for their products'}</li>
            <li><strong>Superadmin (Siteviral) :</strong> {isFr ? 'Arbitrage en cas de litige, validation des remboursements importants, décision finale' : 'Arbitration in case of dispute, validation of large refunds, final decision'}</li>
            <li><strong>{isFr ? 'Preuve de livraison :' : 'Proof of delivery:'}</strong> {isFr ? 'En cas de contestation, les download logs sont utilisés pour vérifier la livraison effective du produit numérique' : 'In case of dispute, download logs are used to verify actual delivery of the digital product'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '6. Modalités de remboursement' : '6. Refund Methods'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Le remboursement sera effectué via le même moyen de paiement utilisé lors de l\'achat' : 'The refund will be made via the same payment method used for the purchase'}</li>
            <li>{isFr ? 'Les frais de transaction Paystack ne sont pas remboursables' : 'Paystack transaction fees are non-refundable'}</li>
            <li>{isFr ? 'Le montant remboursé est le montant net (hors frais de plateforme et commissions d\'affiliation déjà versées)' : 'The refunded amount is the net amount (excluding platform fees and affiliate commissions already paid)'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '7. Cas de fraude' : '7. Fraud Cases'}</h2>
          <p>{isFr ? 'En cas de transaction frauduleuse avérée, Siteviral procédera au remboursement intégral et prendra les mesures nécessaires (gel du compte de l\'organisation, signalement aux autorités).' : 'In case of verified fraudulent transaction, Siteviral will process a full refund and take necessary measures (freezing the organization\'s account, reporting to authorities).'}</p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p className="font-medium">
            Hacktualiz Inc.<br />
            Support & Refunds<br />
            131 Continental Dr, Suite 305, Newark, DE 19713, USA<br />
            Email : support@siteviral.com
          </p>
        </section>
      </div>
    </LegalPageShell>
  );
}
