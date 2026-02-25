import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';

export default function PrivacyPage() {
  return (
    <LegalPageShell>
      <SEOHead title="Politique de Confidentialité — Siteviral" description="Découvrez comment Siteviral protège vos données personnelles. Transparence, RGPD, droits des utilisateurs." canonicalUrl="https://siteviral.com/privacy" />
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">Politique de Confidentialité</h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium">Dernière mise à jour : 22 février 2026</p>

      <div className={proseClasses}>
        <section>
          <h2>1. Introduction</h2>
          <p>
            <strong>Hacktualiz Inc.</strong> (ci-après « Siteviral », « nous »), société de droit américain (Delaware C-Corp),
            s'engage à protéger la vie privée de ses utilisateurs. La présente Politique de Confidentialité décrit comment nous
            collectons, utilisons, stockons et protégeons vos données personnelles lors de votre utilisation de la plateforme Siteviral.
          </p>
          <p>
            Cette politique est conforme au Règlement Général sur la Protection des Données (RGPD), au California Consumer Privacy Act (CCPA),
            ainsi qu'aux lois applicables en matière de protection des données dans les juridictions où nous opérons.
          </p>
        </section>

        <section>
          <h2>2. Données collectées</h2>

          <h3 className="text-lg font-bold mt-4 mb-2">2.1 Données de compte</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Adresse email</li>
            <li>Nom et prénom</li>
            <li>Photo de profil (optionnel)</li>
            <li>Pays de résidence</li>
          </ul>

          <h3 className="text-lg font-bold mt-4 mb-2">2.2 Numéro de téléphone</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Stocké au format international E.164</li>
            <li>Utilisé pour la vérification KYC et les notifications optionnelles</li>
          </ul>

          <h3 className="text-lg font-bold mt-4 mb-2">2.3 Données transactionnelles</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Montants des dons et achats</li>
            <li>Références de paiement Paystack</li>
            <li>Historique des transactions et commissions d'affiliation</li>
            <li>Adresse IP et empreinte appareil (device hash) pour la détection de fraude</li>
          </ul>

          <h3 className="text-lg font-bold mt-4 mb-2">2.4 Logs techniques</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Logs d'audit (actions sensibles : KYC, payouts, modifications de compte)</li>
            <li>Logs de téléchargement (preuve de livraison pour les produits numériques)</li>
            <li>Adresse IP, user-agent, horodatage</li>
          </ul>

          <h3 className="text-lg font-bold mt-4 mb-2">2.5 Cookies</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Cookie de session (authentification)</li>
            <li>Cookie d'affiliation (durée : 7 jours, attribution last-click)</li>
            <li>Cookies fonctionnels (langue, thème)</li>
          </ul>

          <h3 className="text-lg font-bold mt-4 mb-2">2.6 Documents KYC</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Pièce d'identité (CNI, passeport)</li>
            <li>Documents de l'organisation</li>
            <li>Informations bancaires (nom, numéro de compte, banque)</li>
          </ul>
        </section>

        <section>
          <h2>3. Finalités du traitement</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Fourniture et gestion des services de la Plateforme</li>
            <li>Traitement des paiements et des retraits</li>
            <li>Sécurité, prévention de la fraude et détection d'activités suspectes</li>
            <li>Conformité AML (Anti-Money Laundering) et obligations légales</li>
            <li>Support client et résolution des litiges</li>
            <li>Gestion du programme d'affiliation et attribution des commissions</li>
            <li>Amélioration de nos services</li>
          </ul>
        </section>

        <section>
          <h2>4. Base légale</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Exécution contractuelle :</strong> fourniture des services auxquels vous avez souscrit</li>
            <li><strong>Intérêt légitime :</strong> prévention de la fraude, amélioration des services, sécurité</li>
            <li><strong>Consentement :</strong> cookies non essentiels, communications marketing</li>
            <li><strong>Obligation légale :</strong> réglementations AML, fiscales et comptables</li>
          </ul>
        </section>

        <section>
          <h2>5. Cookies & Tracking</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Cookie d'affiliation :</strong> durée 7 jours, stocke le code d'affiliation pour l'attribution last-click des commissions</li>
            <li><strong>Cookie de session :</strong> nécessaire au fonctionnement de l'authentification</li>
            <li><strong>Cookies fonctionnels :</strong> préférences de langue et de thème</li>
            <li>Aucun cookie publicitaire tiers n'est utilisé</li>
            <li>Vous pouvez gérer vos préférences de cookies depuis les paramètres de votre navigateur</li>
          </ul>
        </section>

        <section>
          <h2>6. Partage avec sous-traitants</h2>
          <p>Vos données peuvent être partagées avec les sous-traitants suivants :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase Inc.</strong> — hébergement, base de données, authentification, stockage de fichiers</li>
            <li><strong>Paystack (Stripe Inc.)</strong> — traitement des paiements et vérification des transactions</li>
            <li><strong>Resend Inc.</strong> — envoi d'emails transactionnels et de campagnes</li>
            <li><strong>Sentry (Functional Software Inc.)</strong> — monitoring d'erreurs frontend</li>
          </ul>
          <p>
            Nous ne vendons jamais vos données personnelles. Consultez notre <a href="/subprocessors" className="text-primary underline">liste complète des sous-traitants</a>.
          </p>
        </section>

        <section>
          <h2>7. Transferts internationaux</h2>
          <p>
            Vos données sont hébergées sur des serveurs situés aux <strong>États-Unis</strong> (Supabase / AWS).
            Les paiements sont traités via Paystack (Nigeria / États-Unis).
          </p>
          <p>
            Pour les utilisateurs de l'Union européenne, nous nous assurons que des garanties appropriées sont en place,
            y compris les clauses contractuelles types de la Commission européenne.
          </p>
        </section>

        <section>
          <h2>8. Conservation des données</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-lg">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-bold text-foreground">Catégorie</th>
                  <th className="text-left p-3 font-bold text-foreground">Durée</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Données de compte</td><td className="p-3">Durée de l'inscription + 30 jours après suppression</td></tr>
                <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Transactions & paiements</td><td className="p-3">7 ans (obligations comptables et fiscales)</td></tr>
                <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Payment events & audit logs</td><td className="p-3">24 mois (ou plus si exigence légale)</td></tr>
                <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Download logs</td><td className="p-3">12 mois</td></tr>
                <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Documents KYC</td><td className="p-3">5 ans après fin de la relation (réglementation AML)</td></tr>
                <tr><td className="p-3 font-medium text-foreground">Support tickets</td><td className="p-3">24 mois après résolution</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>9. Droits des utilisateurs (DSAR)</h2>
          <p>Conformément au RGPD et aux lois applicables, vous disposez des droits suivants :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
            <li><strong>Droit de rectification :</strong> corriger vos données inexactes ou incomplètes</li>
            <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données (sous réserve des obligations légales de conservation)</li>
            <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré et lisible</li>
            <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données pour des motifs légitimes</li>
          </ul>
          <p>
            Pour exercer vos droits, envoyez un email à <strong><a href="mailto:privacy@siteviral.com" className="text-primary underline">privacy@siteviral.com</a></strong>.
            Nous répondrons dans un délai de <strong>30 jours</strong>.
          </p>
        </section>

        <section>
          <h2>10. Sécurité</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Row Level Security (RLS) sur toutes les tables — isolation multi-tenant</li>
            <li>Vérification HMAC SHA-512 des webhooks Paystack</li>
            <li>URLs signées et temporaires pour les fichiers protégés</li>
            <li>Audit logs permanents sur les actions sensibles</li>
            <li>Chiffrement SSL/TLS sur toutes les communications</li>
            <li>Consultez notre <a href="/security" className="text-primary underline">page Sécurité</a> pour plus de détails</li>
          </ul>
        </section>

        <section>
          <h2>11. Contact</h2>
          <p>Pour toute question relative à la présente Politique de Confidentialité :</p>
          <p className="font-medium">
            Hacktualiz Inc. — Data Protection Officer<br />
            131 Continental Dr, Suite 305, Newark, DE 19713, USA<br />
            Email : <a href="mailto:privacy@siteviral.com" className="text-primary underline">privacy@siteviral.com</a>
          </p>
        </section>
      </div>
    </LegalPageShell>
  );
}
