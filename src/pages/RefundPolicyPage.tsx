import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import termsBg from '@/assets/terms-bg.jpg';

export default function RefundPolicyPage() {
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
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">Politique de Remboursement</h1>
        <p className="text-sm text-muted-foreground mb-8 font-medium">Dernière mise à jour : 22 février 2026</p>

        <div className="max-w-none space-y-6 text-foreground text-[15px] sm:text-base font-semibold leading-relaxed [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-extrabold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_ul]:font-medium [&_li]:font-medium">
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
              <li>Les achats de produits numériques (ebooks, formations, ressources) sont <strong>généralement non remboursables</strong> une fois le contenu téléchargé ou consulté</li>
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
            <h2>4. Procédure de demande</h2>
            <p>Pour demander un remboursement :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Envoyez un email à <strong>support@siteviral.com</strong> dans les 48h suivant l'achat</li>
              <li>Incluez votre référence de transaction (format SV-XXXXX)</li>
              <li>Décrivez le motif de votre demande</li>
              <li>Délai de traitement : 5 à 10 jours ouvrés</li>
            </ul>
          </section>

          <section>
            <h2>5. Modalités de remboursement</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Le remboursement sera effectué via le même moyen de paiement utilisé lors de l'achat</li>
              <li>Les frais de transaction Paystack ne sont pas remboursables</li>
              <li>Le montant remboursé est le montant net (hors frais de plateforme et commissions d'affiliation déjà versées)</li>
            </ul>
          </section>

          <section>
            <h2>6. Cas de fraude</h2>
            <p>
              En cas de transaction frauduleuse avérée, Siteviral procédera au remboursement intégral
              et prendra les mesures nécessaires (gel du compte de l'organisation, signalement aux autorités).
            </p>
          </section>

          <section>
            <h2>7. Contact</h2>
            <p className="font-medium">
              Hacktualiz Inc.<br />
              Support & Refunds<br />
              131 Continental Dr, Suite 305, Newark, DE 19713, USA<br />
              Email : support@siteviral.com
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
