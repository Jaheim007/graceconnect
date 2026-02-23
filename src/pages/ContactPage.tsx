import { LegalFooter } from '@/components/layout/LegalPageShell';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Globe, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LegalBackground, LegalHeader } from '@/components/layout/LegalPageShell';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <LegalBackground />
      <LegalHeader />

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
              Hacktualiz Inc.<br />
              131 Continental Dr, Suite 305<br />
              Newark, DE 19713<br />
              United States
            </p>
          </div>
        </div>

        <div className="mt-10 bg-card border border-border rounded-2xl p-6 text-center space-y-3">
          <h3 className="font-bold text-foreground">Besoin d'aide rapidement ?</h3>
          <p className="text-sm text-muted-foreground">Consultez notre centre d'aide pour des réponses instantanées.</p>
          <Button asChild className="bg-primary text-primary-foreground gap-2">
            <Link to="/faq">Consulter la FAQ</Link>
          </Button>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
