import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import termsBg from '@/assets/terms-bg.jpg';

export default function PayoutPolicyPage() {
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
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">Politique de Retrait (Payout Policy)</h1>
        <p className="text-sm text-muted-foreground mb-8 font-medium">Dernière mise à jour : 22 février 2026</p>

        <div className="max-w-none space-y-6 text-foreground text-[15px] sm:text-base font-semibold leading-relaxed [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-extrabold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_ul]:font-medium [&_li]:font-medium">
          <section>
            <h2>1. Éligibilité aux retraits</h2>
            <p>Pour pouvoir retirer des fonds, une organisation doit :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Avoir complété la vérification KYC (Know Your Customer)</li>
              <li>Disposer d'un compte bancaire vérifié</li>
              <li>Avoir un solde minimum de <strong>5 000 XOF</strong></li>
              <li>Ne pas être sous suspension ou investigation</li>
            </ul>
          </section>

          <section>
            <h2>2. Statuts des retraits</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Pending (En attente)</strong> : La demande a été soumise</li>
              <li><strong>Approved (Approuvé)</strong> : La demande a été validée par l'équipe</li>
              <li><strong>Sent (Envoyé)</strong> : Le virement a été initié</li>
              <li><strong>Rejected (Rejeté)</strong> : La demande a été refusée (motif communiqué)</li>
            </ul>
          </section>

          <section>
            <h2>3. Délais de traitement (SLA)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Examen de la demande : <strong>72 heures</strong> ouvrées</li>
              <li>Exécution du virement après approbation : <strong>3 à 5 jours</strong> ouvrés</li>
              <li>Délai total estimé : <strong>5 à 8 jours</strong> ouvrés</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Note : Les délais peuvent être prolongés en cas de vérification supplémentaire requise.
            </p>
          </section>

          <section>
            <h2>4. Commissions d'affiliation</h2>
            <p>Les commissions des affiliés suivent un calendrier spécifique :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Période de validation : <strong>72 heures</strong> après la transaction</li>
              <li>Les commissions passent de « pending » à « payable » après la période de validation</li>
              <li>Montant minimum de retrait affilié : <strong>2 500 XOF</strong></li>
            </ul>
          </section>

          <section>
            <h2>5. Frais de retrait</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Frais de plateforme : déduits automatiquement lors de chaque transaction</li>
              <li>Frais de virement bancaire : selon les conditions de Paystack</li>
              <li>Aucun frais supplémentaire appliqué par Siteviral lors du retrait</li>
            </ul>
          </section>

          <section>
            <h2>6. Séparation des fonds</h2>
            <p>
              Les fonds des organisations sont séparés des fonds de la plateforme. Siteviral agit en tant que
              processeur de paiements et ne détient pas les fonds des organisations au-delà du délai de traitement nécessaire.
            </p>
          </section>

          <section>
            <h2>7. Gel des fonds</h2>
            <p>
              Siteviral se réserve le droit de geler les fonds en cas de suspicion de fraude, d'activité illicite
              ou de violation des conditions d'utilisation. L'organisation sera notifiée et pourra fournir des justificatifs.
            </p>
          </section>

          <section>
            <h2>8. Contact</h2>
            <p className="font-medium">
              Hacktualiz Inc.<br />
              Finance & Payouts<br />
              131 Continental Dr, Suite 305, Newark, DE 19713, USA<br />
              Email : payouts@siteviral.com
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
