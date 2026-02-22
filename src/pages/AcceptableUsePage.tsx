import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import termsBg from '@/assets/terms-bg.jpg';

export default function AcceptableUsePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 z-0">
        <img src={termsBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm" />
      </div>

      <header className="fixed top-0 w-full z-50 glass border-b border-border/40">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="text-xl font-extrabold tracking-tight italic text-gold">Siteviral</Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 container max-w-3xl px-4 pt-24 pb-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">Politique d'Utilisation Acceptable</h1>
        <p className="text-sm text-muted-foreground mb-8 font-medium">Dernière mise à jour : 22 février 2026</p>

        <div className="max-w-none space-y-6 text-foreground text-[15px] sm:text-base font-semibold leading-relaxed [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-extrabold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_ul]:font-medium [&_li]:font-medium">
          <section>
            <h2>1. Objet</h2>
            <p>
              Cette Politique d'Utilisation Acceptable définit les règles de conduite que tous les utilisateurs
              de Siteviral doivent respecter. Elle vise à maintenir un environnement sûr, professionnel et respectueux
              pour toutes les communautés.
            </p>
          </section>

          <section>
            <h2>2. Contenus interdits</h2>
            <p>Les utilisateurs s'engagent à ne pas publier, partager ou promouvoir :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Contenu illégal, diffamatoire, ou incitant à la haine</li>
              <li>Contenu à caractère pornographique, violent ou choquant</li>
              <li>Contenu portant atteinte aux droits de propriété intellectuelle d'autrui</li>
              <li>Informations personnelles de tiers sans leur consentement</li>
              <li>Spam, publicités non sollicitées ou contenus trompeurs</li>
              <li>Logiciels malveillants, virus ou code destructeur</li>
              <li>Contenu promouvant des activités frauduleuses ou illégales</li>
            </ul>
          </section>

          <section>
            <h2>3. Activités commerciales interdites</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Vente de produits contrefaits ou volés</li>
              <li>Schémas de Ponzi, systèmes pyramidaux ou MLM frauduleux</li>
              <li>Blanchiment d'argent ou financement d'activités illicites</li>
              <li>Manipulation des systèmes de commission ou d'affiliation</li>
              <li>Auto-achat ou auto-référencement frauduleux</li>
              <li>Création de fausses organisations pour collecter des fonds</li>
            </ul>
          </section>

          <section>
            <h2>4. Comportements interdits</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Harcèlement, intimidation ou menaces envers d'autres utilisateurs</li>
              <li>Usurpation d'identité ou représentation frauduleuse</li>
              <li>Tentatives d'accès non autorisé aux comptes d'autres utilisateurs</li>
              <li>Exploitation de failles de sécurité de la plateforme</li>
              <li>Utilisation de bots ou scripts automatisés non autorisés</li>
              <li>Manipulation des métriques (vues, likes, membres fictifs)</li>
            </ul>
          </section>

          <section>
            <h2>5. Obligations des organisations</h2>
            <p>Les organisations utilisant Siteviral doivent :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fournir des informations véridiques et à jour</li>
              <li>Respecter les lois et réglementations applicables dans leur juridiction</li>
              <li>Protéger les données de leurs membres et donateurs</li>
              <li>Utiliser les fonds collectés conformément aux objectifs déclarés</li>
              <li>Répondre aux demandes de vérification KYC dans les délais impartis</li>
            </ul>
          </section>

          <section>
            <h2>6. Signalement</h2>
            <p>
              Tout utilisateur peut signaler un contenu ou comportement violant cette politique via le système
              de signalement intégré à la plateforme ou par email à <strong>abuse@siteviral.com</strong>.
            </p>
            <p>
              Les signalements sont traités sous 48 heures ouvrées. L'identité du signaleur est protégée.
            </p>
          </section>

          <section>
            <h2>7. Sanctions</h2>
            <p>En cas de violation de cette politique, Siteviral peut appliquer les mesures suivantes :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Avertissement</strong> : premier manquement mineur</li>
              <li><strong>Suppression de contenu</strong> : contenu non conforme retiré</li>
              <li><strong>Suspension temporaire</strong> : accès restreint pour une durée déterminée</li>
              <li><strong>Suspension définitive</strong> : fermeture du compte et de l'organisation</li>
              <li><strong>Signalement aux autorités</strong> : en cas d'activité criminelle</li>
            </ul>
          </section>

          <section>
            <h2>8. Contact</h2>
            <p className="font-medium">
              Hacktualiz Inc.<br />
              Trust & Safety<br />
              131 Continental Dr, Suite 305, Newark, DE 19713, USA<br />
              Email : abuse@siteviral.com
            </p>
          </section>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/60 py-6 px-4 bg-background/80">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <Link to="/" className="font-extrabold italic text-sm text-gold">Siteviral</Link>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">Conditions</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Confidentialité</Link>
          </div>
          <span>© {new Date().getFullYear()} Hacktualiz Inc. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
