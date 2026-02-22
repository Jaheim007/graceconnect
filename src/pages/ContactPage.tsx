import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, Globe, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import termsBg from '@/assets/terms-bg.jpg';

export default function ContactPage() {
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
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">Contactez-nous</h1>
        <p className="text-sm text-muted-foreground mb-10 font-medium">Nous sommes là pour vous aider</p>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-foreground">Support Général</h3>
            <p className="text-sm text-muted-foreground">Pour toute question sur la plateforme, votre compte ou vos transactions.</p>
            <a href="mailto:support@siteviral.com" className="text-sm font-semibold text-primary hover:underline">
              support@siteviral.com
            </a>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-foreground">Partenariats & Entreprise</h3>
            <p className="text-sm text-muted-foreground">Plan Enterprise, intégrations API ou partenariats stratégiques.</p>
            <a href="mailto:business@siteviral.com" className="text-sm font-semibold text-primary hover:underline">
              business@siteviral.com
            </a>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-foreground">Données & Confidentialité</h3>
            <p className="text-sm text-muted-foreground">Pour les demandes RGPD, suppression de données ou exercice de vos droits.</p>
            <a href="mailto:privacy@siteviral.com" className="text-sm font-semibold text-primary hover:underline">
              privacy@siteviral.com
            </a>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-foreground">Siège Social</h3>
            <p className="text-sm text-muted-foreground">
              HACKTUALIZ Inc.<br />
              8 The Green, Suite A<br />
              Dover, DE 19901<br />
              United States
            </p>
          </div>
        </div>

        <div className="mt-10 bg-card border border-border rounded-2xl p-6 text-center space-y-3">
          <h3 className="font-bold text-foreground">Besoin d'aide rapidement ?</h3>
          <p className="text-sm text-muted-foreground">Consultez notre centre d'aide pour des réponses instantanées.</p>
          <Button asChild className="gold-gradient text-primary-foreground border-0 shadow-gold gap-2">
            <Link to="/faq">Consulter la FAQ</Link>
          </Button>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/60 py-6 px-4 bg-background/80">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <Link to="/" className="font-extrabold italic text-sm text-gold">Siteviral</Link>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">Conditions</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Confidentialité</Link>
          </div>
          <span>© {new Date().getFullYear()} Siteviral — Operated by HACKTUALIZ Inc.</span>
        </div>
      </footer>
    </div>
  );
}
