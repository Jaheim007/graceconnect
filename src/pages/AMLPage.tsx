import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import termsBg from '@/assets/terms-bg.jpg';

export default function AMLPage() {
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
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">Politique Anti-Blanchiment (AML)</h1>
        <p className="text-sm text-muted-foreground mb-8 font-medium">Dernière mise à jour : 22 février 2026</p>

        <div className="max-w-none space-y-6 text-foreground text-[15px] sm:text-base font-semibold leading-relaxed [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-extrabold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_ul]:font-medium [&_li]:font-medium">
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
            </ul>
          </section>

          <section>
            <h2>4. Surveillance des transactions</h2>
            <p>Siteviral met en œuvre des mécanismes automatiques de surveillance :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Détection de volumes anormalement élevés</li>
              <li>Identification de transactions suspectes (montants, fréquence, patterns)</li>
              <li>Signalement automatique (fraud flags) pour examen manuel</li>
              <li>Blocage automatique des transactions dépassant les seuils définis</li>
            </ul>
          </section>

          <section>
            <h2>5. Gel et suspension</h2>
            <p>
              Siteviral se réserve le droit de geler les fonds et suspendre toute organisation en cas de suspicion
              de blanchiment d'argent ou d'activité frauduleuse, et ce sans préavis. Les fonds gelés seront libérés
              uniquement après résolution satisfaisante de l'enquête.
            </p>
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
              de 5 ans après la fin de la relation commerciale, conformément aux obligations réglementaires.
            </p>
          </section>

          <section>
            <h2>8. Sanctions, Embargoes &amp; Restricted Countries</h2>
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
      </main>

      <footer className="relative z-10 border-t border-border/60 py-6 px-4 bg-background/80">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <Link to="/" className="font-extrabold italic text-sm text-gold">Siteviral</Link>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">Conditions</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Confidentialité</Link>
            <Link to="/aml" className="hover:text-foreground transition-colors">AML</Link>
          </div>
          <span>© {new Date().getFullYear()} Hacktualiz Inc. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
