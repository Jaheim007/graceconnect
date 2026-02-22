import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import termsBg from '@/assets/terms-bg.jpg';

export default function CompliancePage() {
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
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl gold-gradient flex items-center justify-center shadow-gold">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">Conformité & Sécurité</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8 font-medium">Comment Siteviral protège vos données et respecte les réglementations</p>

        <div className="space-y-8 text-foreground text-[15px] sm:text-base leading-relaxed">
          <section>
            <h2 className="text-xl font-extrabold mb-3">Entité juridique</h2>
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="font-semibold">Hacktualiz Inc.</p>
              <p className="text-muted-foreground text-sm mt-1">
                Delaware C-Corporation, registered in the State of Delaware (USA).<br />
                131 Continental Dr, Suite 305, Newark, DE 19713, United States.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">Cadre réglementaire</h2>
            <div className="space-y-3">
              {[
                { title: 'RGPD (Union Européenne)', desc: 'Protection des données personnelles des utilisateurs européens. Droit d\'accès, rectification, suppression et portabilité.' },
                { title: 'US Privacy Laws', desc: 'Conformité avec les réglementations fédérales et étatiques américaines en matière de protection des données.' },
                { title: 'PCI-DSS', desc: 'Les paiements sont traités par Paystack, certifié PCI-DSS Level 1, garantissant la sécurité des transactions.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-muted-foreground text-sm mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">Mesures de sécurité</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                'Chiffrement SSL/TLS sur toutes les communications',
                'Row Level Security (RLS) sur toutes les tables de données',
                'Vérification KYC multi-niveaux pour les organisations',
                'Détection de fraude automatique',
                'Audit trail permanent sur toutes les actions sensibles',
                'Isolation des données par organisation (multi-tenant)',
                'Validation côté serveur de tous les paiements',
                'Webhooks Paystack signés (HMAC SHA-512)',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm bg-card border border-border rounded-lg p-3">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">Lutte contre le blanchiment (AML)</h2>
            <p className="text-muted-foreground">
              Siteviral applique une politique stricte de lutte contre le blanchiment d'argent. 
              Les organisations dont les volumes de transactions dépassent certains seuils sont soumises à 
              une vérification KYC renforcée. Toute activité suspecte est signalée et peut entraîner 
              le gel temporaire du compte.{' '}
              <Link to="/aml" className="text-primary underline">Lire notre politique AML complète</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">Contact Conformité</h2>
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-sm text-muted-foreground">
                Pour toute question relative à la conformité, la sécurité ou la protection des données :
              </p>
              <p className="font-semibold text-sm mt-2">
                Email : <a href="mailto:compliance@siteviral.com" className="text-primary">compliance@siteviral.com</a>
              </p>
            </div>
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
