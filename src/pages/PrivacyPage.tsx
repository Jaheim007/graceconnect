import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 glass border-b border-border/40">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="text-xl font-extrabold tracking-tight italic text-gold">Siteviral</Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-3xl px-4 pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-2">Politique de Confidentialité</h1>
        <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : 21 février 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">1. Introduction</h2>
            <p>
              Hacktualiz Inc. (ci-après « Siteviral », « nous ») s'engage à protéger la vie privée de ses utilisateurs.
              La présente Politique de Confidentialité décrit comment nous collectons, utilisons, stockons et protégeons
              vos données personnelles lors de votre utilisation de la plateforme Siteviral.
            </p>
            <p>
              Cette politique est conforme au Règlement Général sur la Protection des Données (RGPD)
              de l'Union européenne, ainsi qu'aux lois applicables en matière de protection des données
              dans les juridictions où nous opérons.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">2. Données collectées</h2>
            <p>Nous collectons les catégories de données suivantes :</p>

            <h3 className="text-lg font-medium mt-4 mb-2">2.1 Données d'identification</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone</li>
              <li>Photo de profil (optionnel)</li>
              <li>Pays de résidence</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">2.2 Données d'organisation</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nom et description de l'organisation</li>
              <li>Logo et bannière</li>
              <li>Catégorie (église, ministère, etc.)</li>
              <li>Informations de contact (site web, WhatsApp)</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">2.3 Données KYC (Know Your Customer)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Pièce d'identité (CNI, passeport)</li>
              <li>Documents de l'organisation</li>
              <li>Informations bancaires (nom, numéro de compte, banque)</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">2.4 Données transactionnelles</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Montants des dons et achats</li>
              <li>Références de paiement</li>
              <li>Historique des transactions</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">2.5 Données d'utilisation</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Historique de visionnage et interactions</li>
              <li>Adresse IP et données de navigation</li>
              <li>Type d'appareil et système d'exploitation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">3. Finalités du traitement</h2>
            <p>Vos données sont traitées pour les finalités suivantes :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Création et gestion de votre compte utilisateur</li>
              <li>Fourniture des services de la Plateforme</li>
              <li>Traitement des transactions financières</li>
              <li>Vérification d'identité (KYC) des organisations</li>
              <li>Communication de notifications et mises à jour</li>
              <li>Amélioration de nos services et analyse d'utilisation</li>
              <li>Prévention de la fraude et respect des obligations légales</li>
              <li>Gestion du programme d'affiliation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">4. Base légale du traitement</h2>
            <p>Le traitement de vos données repose sur :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Exécution du contrat</strong> : pour fournir les services auxquels vous avez souscrit</li>
              <li><strong>Consentement</strong> : pour les communications marketing et les cookies non essentiels</li>
              <li><strong>Obligation légale</strong> : pour le respect des lois anti-blanchiment et fiscales</li>
              <li><strong>Intérêt légitime</strong> : pour l'amélioration de nos services et la prévention de la fraude</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">5. Partage des données</h2>
            <p>Vos données peuvent être partagées avec :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Paystack</strong> : pour le traitement des paiements</li>
              <li><strong>Supabase</strong> : pour l'hébergement et le stockage des données</li>
              <li><strong>Resend</strong> : pour l'envoi d'emails transactionnels</li>
              <li><strong>Les organisations</strong> : dont vous êtes membre (données limitées au rôle)</li>
              <li><strong>Autorités compétentes</strong> : en cas d'obligation légale ou de demande judiciaire</li>
            </ul>
            <p>
              Nous ne vendons jamais vos données personnelles à des tiers. Les sous-traitants avec lesquels nous
              travaillons sont contractuellement tenus de protéger vos données.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">6. Sécurité des données</h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Chiffrement des données en transit (TLS/SSL) et au repos</li>
              <li>Contrôle d'accès basé sur les rôles (Row Level Security)</li>
              <li>Sauvegardes régulières et plans de reprise d'activité</li>
              <li>Surveillance continue des tentatives d'accès non autorisées</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">7. Durée de conservation</h2>
            <p>Vos données sont conservées pendant les durées suivantes :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Données de compte</strong> : pendant la durée de votre inscription + 12 mois après suppression</li>
              <li><strong>Données transactionnelles</strong> : 10 ans (obligations comptables et fiscales)</li>
              <li><strong>Documents KYC</strong> : 5 ans après la fin de la relation commerciale</li>
              <li><strong>Données de navigation</strong> : 13 mois maximum</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">8. Vos droits</h2>
            <p>
              Conformément au RGPD et aux lois applicables, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification</strong> : corriger vos données inexactes ou incomplètes</li>
              <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données</li>
              <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition</strong> : vous opposer au traitement de vos données</li>
              <li><strong>Droit à la limitation</strong> : restreindre le traitement de vos données</li>
            </ul>
            <p>
              Pour exercer vos droits, envoyez un email à <strong>privacy@siteviral.com</strong> avec une copie
              de votre pièce d'identité. Nous répondrons dans un délai de 30 jours.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">9. Transferts internationaux</h2>
            <p>
              Vos données peuvent être transférées et stockées sur des serveurs situés dans différents pays.
              Dans ce cas, nous nous assurons que des garanties appropriées sont mises en place conformément
              à la législation applicable, y compris les clauses contractuelles types de la Commission européenne.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">10. Cookies</h2>
            <p>
              La Plateforme utilise des cookies techniques nécessaires au fonctionnement du service.
              Les cookies d'analyse et de performance ne sont utilisés qu'avec votre consentement.
              Vous pouvez gérer vos préférences de cookies depuis les paramètres de votre navigateur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">11. Autorité de contrôle</h2>
            <p>
              En cas de réclamation, vous pouvez contacter l'autorité de protection des données compétente
              dans votre juridiction. Pour les utilisateurs de l'UE, il s'agit de la CNIL (France)
              ou de l'autorité équivalente dans votre pays de résidence.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">12. Contact</h2>
            <p>
              Pour toute question relative à la présente Politique de Confidentialité :
            </p>
            <p className="font-medium">
              Hacktualiz Inc. — Data Protection Officer<br />
              131 Continental Dr, Suite 305, Newark, DE 19713, USA<br />
              Email : privacy@siteviral.com
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 px-4">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <Link to="/" className="font-extrabold italic text-sm text-gold">Siteviral</Link>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">Conditions d'utilisation</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Confidentialité</Link>
          </div>
          <span>© {new Date().getFullYear()} Hacktualiz Inc. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
