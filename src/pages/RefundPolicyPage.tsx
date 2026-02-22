import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';

export default function RefundPolicyPage() {
  return (
    <LegalPageShell>
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">Politique de Remboursement</h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium">Dernière mise à jour : 22 février 2026</p>

      <div className={proseClasses}>
        <section>
          <h2>1. Principes généraux</h2>
          <p>
            Siteviral agit en tant qu'intermédiaire technique entre les organisations et leurs clients/donateurs.
            Les remboursements sont traités conformément aux conditions suivantes.
          </p>
        </section>

        <section>
          <h2>2. Produits numériques</h2>
          <p>En raison de la nature immédiatement accessible des produits numériques :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Les achats de produits numériques sont <strong>généralement non remboursables</strong> une fois le contenu téléchargé ou consulté</li>
            <li>Un remboursement peut être accordé dans les <strong>48 heures</strong> suivant l'achat si le produit n'a pas été téléchargé et si le contenu est défectueux ou ne correspond pas à la description</li>
            <li>Les produits avec lien externe ne sont pas éligibles au remboursement via Siteviral</li>
          </ul>
        </section>

        <section>
          <h2>3. Dons</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Les dons sont par nature volontaires et <strong>non remboursables</strong></li>
            <li>En cas d'erreur technique avérée (double débit, montant incorrect), un remboursement sera traité sous 72 heures</li>
            <li>Les demandes doivent être adressées à support@siteviral.com avec la référence de transaction</li>
          </ul>
        </section>

        <section>
          <h2>4. Procédure de demande et délais</h2>
          <p>Pour demander un remboursement :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Envoyez un email à <strong>support@siteviral.com</strong> dans les 48h suivant l'achat</li>
            <li>Incluez votre référence de transaction (format SV-XXXXX)</li>
            <li>Décrivez le motif de votre demande</li>
          </ul>
          <p className="mt-3">Délais de traitement :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Accusé de réception :</strong> 24 heures ouvrées</li>
            <li><strong>Décision :</strong> 5 jours ouvrés maximum</li>
            <li><strong>Remboursement effectif :</strong> 5 à 10 jours ouvrés après décision favorable</li>
          </ul>
        </section>

        <section>
          <h2>5. Rôles dans le processus</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Organisation (Admin) :</strong> Premier niveau de résolution — peut approuver les remboursements directs pour ses produits</li>
            <li><strong>Superadmin (Siteviral) :</strong> Arbitrage en cas de litige, validation des remboursements importants, décision finale</li>
            <li><strong>Preuve de livraison :</strong> En cas de contestation, les <em>download logs</em> (historique de téléchargement avec IP, date, user-agent) sont utilisés pour vérifier la livraison effective du produit numérique</li>
          </ul>
        </section>

        <section>
          <h2>6. Modalités de remboursement</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Le remboursement sera effectué via le même moyen de paiement utilisé lors de l'achat</li>
            <li>Les frais de transaction Paystack ne sont pas remboursables</li>
            <li>Le montant remboursé est le montant net (hors frais de plateforme et commissions d'affiliation déjà versées)</li>
          </ul>
        </section>

        <section>
          <h2>7. Cas de fraude</h2>
          <p>
            En cas de transaction frauduleuse avérée, Siteviral procédera au remboursement intégral
            et prendra les mesures nécessaires (gel du compte de l'organisation, signalement aux autorités).
          </p>
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
