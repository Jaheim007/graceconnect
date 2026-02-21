import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import termsBg from '@/assets/terms-bg.jpg';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Background image — subtle, fixed */}
      <div className="fixed inset-0 z-0">
        <img src={termsBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/92 backdrop-blur-sm" />
      </div>

      {/* Nav */}
      <header className="fixed top-0 w-full z-50 glass border-b border-border/40">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="text-xl font-extrabold tracking-tight italic text-gold">Siteviral</Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 container max-w-3xl px-4 pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : 21 février 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">1. Objet</h2>
            <p>
              Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et l'utilisation
              de la plateforme Siteviral (ci-après « la Plateforme »), éditée et exploitée par Siteviral SAS,
              société de droit ivoirien dont le siège social est situé à Abidjan, Côte d'Ivoire.
            </p>
            <p>
              La Plateforme est destinée aux églises, ministères, organisations confessionnelles, leaders spirituels
              et leurs communautés pour la gestion de contenu, la collecte de fonds, la vente de ressources numériques
              et la communication communautaire.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">2. Acceptation des conditions</h2>
            <p>
              L'inscription et l'utilisation de la Plateforme impliquent l'acceptation pleine et entière des présentes CGU.
              Si vous n'acceptez pas ces conditions, vous devez cesser d'utiliser la Plateforme immédiatement.
            </p>
            <p>
              Siteviral se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés
              de toute modification par notification sur la Plateforme. La poursuite de l'utilisation après notification
              vaut acceptation des CGU modifiées.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">3. Inscription et compte utilisateur</h2>
            <p>
              Pour accéder aux fonctionnalités de la Plateforme, l'utilisateur doit créer un compte en fournissant
              des informations exactes, à jour et complètes. L'utilisateur est seul responsable de la confidentialité
              de ses identifiants de connexion et de toute activité effectuée sous son compte.
            </p>
            <p>
              L'utilisateur s'engage à notifier immédiatement Siteviral en cas d'utilisation non autorisée de son compte
              ou de toute atteinte à la sécurité de celui-ci.
            </p>
            <p>
              L'utilisateur doit être âgé d'au moins 18 ans ou disposer de l'autorisation d'un représentant légal
              pour utiliser la Plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">4. Services proposés</h2>
            <p>La Plateforme offre les services suivants :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Création et gestion de pages communautaires (églises, ministères, organisations)</li>
              <li>Publication et diffusion de contenu multimédia (vidéos, audios, reels)</li>
              <li>Collecte de dons et campagnes de financement</li>
              <li>Vente de produits numériques (ebooks, cours, ressources)</li>
              <li>Système d'affiliation et de parrainage</li>
              <li>Gestion des membres et des rôles au sein des organisations</li>
              <li>Notifications et communications communautaires</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">5. Obligations des utilisateurs</h2>
            <p>L'utilisateur s'engage à :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Utiliser la Plateforme conformément à sa destination et aux présentes CGU</li>
              <li>Ne pas publier de contenu illicite, diffamatoire, haineux, obscène ou portant atteinte aux droits des tiers</li>
              <li>Respecter les droits de propriété intellectuelle d'autrui</li>
              <li>Ne pas utiliser la Plateforme à des fins frauduleuses ou de blanchiment d'argent</li>
              <li>Fournir des informations véridiques lors de la création d'organisations et des procédures KYC</li>
              <li>Ne pas tenter de contourner les mesures de sécurité de la Plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">6. Paiements et transactions financières</h2>
            <p>
              Les transactions financières sur la Plateforme (dons, achats de produits) sont traitées par Paystack,
              prestataire de paiement agréé. Les fonds collectés sont soumis aux commissions suivantes :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Commission de la plateforme : définie selon le plan de l'organisation</li>
              <li>Frais de transaction Paystack : selon les conditions de Paystack</li>
              <li>Commission d'affiliation : définie par chaque organisation (si applicable)</li>
            </ul>
            <p>
              Les organisations doivent compléter la procédure KYC (Know Your Customer) pour recevoir des paiements.
              Siteviral se réserve le droit de retenir les fonds en cas de suspicion de fraude ou de non-conformité.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">7. Propriété intellectuelle</h2>
            <p>
              La Plateforme, son code source, son design, ses logos et marques sont la propriété exclusive de Siteviral SAS.
              Toute reproduction, représentation ou exploitation non autorisée est interdite.
            </p>
            <p>
              Les utilisateurs conservent la propriété de leur contenu publié sur la Plateforme. En publiant du contenu,
              l'utilisateur accorde à Siteviral une licence non exclusive, mondiale et gratuite pour héberger, afficher
              et distribuer ce contenu dans le cadre du fonctionnement de la Plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">8. Responsabilité</h2>
            <p>
              Siteviral s'efforce d'assurer la disponibilité et le bon fonctionnement de la Plateforme, sans toutefois
              garantir une disponibilité ininterrompue. Siteviral ne saurait être tenu responsable des dommages directs
              ou indirects résultant de l'utilisation ou de l'impossibilité d'utiliser la Plateforme.
            </p>
            <p>
              Siteviral n'est pas responsable du contenu publié par les utilisateurs et les organisations sur la Plateforme.
              Tout contenu signalé comme inapproprié fera l'objet d'une vérification et pourra être supprimé.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">9. Suspension et résiliation</h2>
            <p>
              Siteviral se réserve le droit de suspendre ou de résilier tout compte utilisateur en cas de violation
              des présentes CGU, sans préavis et sans indemnité. L'utilisateur peut supprimer son compte à tout moment
              depuis les paramètres de son profil.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">10. Droit applicable et juridiction</h2>
            <p>
              Les présentes CGU sont régies par le droit ivoirien et les règlements de l'OHADA applicables.
              Tout litige relatif à l'interprétation ou à l'exécution des présentes sera soumis à la compétence
              exclusive des tribunaux d'Abidjan, Côte d'Ivoire, après tentative de résolution amiable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">11. Contact</h2>
            <p>
              Pour toute question relative aux présentes CGU, vous pouvez nous contacter à l'adresse suivante :
            </p>
            <p className="font-medium">
              Siteviral SAS<br />
              Abidjan, Côte d'Ivoire<br />
              Email : contact@siteviral.com
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/60 py-6 px-4 bg-background/80">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <Link to="/" className="font-extrabold italic text-sm text-gold">Siteviral</Link>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">Conditions d'utilisation</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Confidentialité</Link>
          </div>
          <span>© {new Date().getFullYear()} Siteviral</span>
        </div>
      </footer>
    </div>
  );
}
