import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import termsBg from '@/assets/terms-bg.jpg';

const faqs = [
  {
    category: 'Général',
    items: [
      { q: 'Qu\'est-ce que Siteviral ?', a: 'Siteviral est une plateforme tout-en-un permettant aux organisations (églises, ONG, associations, créateurs) de gérer leur communauté, vendre des produits numériques, collecter des dons et gérer un programme d\'affiliation.' },
      { q: 'Est-ce gratuit ?', a: 'Oui, le plan gratuit inclut toutes les fonctionnalités de base : page communautaire, médiathèque, dons et jusqu\'à 100 membres. Le plan Pro débloque des fonctionnalités avancées.' },
      { q: 'Dans quels pays Siteviral est-il disponible ?', a: 'Siteviral est disponible dans tous les pays couverts par Paystack : Nigeria, Ghana, Kenya, Afrique du Sud, Côte d\'Ivoire et plus. Les dons sont acceptés depuis le monde entier.' },
    ],
  },
  {
    category: 'Paiements & Dons',
    items: [
      { q: 'Quels moyens de paiement sont acceptés ?', a: 'Nous acceptons Mobile Money (MTN, Orange, Moov), cartes bancaires (Visa, Mastercard) et les virements bancaires via Paystack.' },
      { q: 'Quand reçois-je mes fonds ?', a: 'Les fonds sont disponibles pour retrait après un délai de traitement de 72h à 5 jours ouvrés. Les commissions d\'affiliation ont une période de validation de 72h.' },
      { q: 'Puis-je obtenir un remboursement ?', a: 'Les produits numériques sont généralement non remboursables une fois téléchargés. Un remboursement peut être accordé dans les 48h si le produit n\'a pas été consulté. Consultez notre politique de remboursement pour plus de détails.' },
    ],
  },
  {
    category: 'Affiliation',
    items: [
      { q: 'Comment fonctionne le programme d\'affiliation ?', a: 'Les membres d\'une organisation peuvent générer des liens de parrainage uniques. Chaque vente ou don effectué via leur lien leur rapporte une commission configurable par l\'organisation (entre 1% et 80%).' },
      { q: 'Quand mes commissions sont-elles disponibles ?', a: 'Les commissions passent de "en attente" à "disponible" après 72 heures de validation. Vous pouvez ensuite demander un retrait depuis votre tableau de bord.' },
      { q: 'Puis-je être affilié de ma propre organisation ?', a: 'Oui, mais le système empêche l\'auto-achat : vous ne pouvez pas gagner de commission sur vos propres transactions.' },
    ],
  },
  {
    category: 'Sécurité & Données',
    items: [
      { q: 'Mes données sont-elles en sécurité ?', a: 'Oui. Nous utilisons le chiffrement SSL, Supabase Row Level Security, et nous sommes conformes au RGPD. Les paiements sont sécurisés via Paystack, certifié PCI-DSS.' },
      { q: 'Qui est propriétaire des données de mon organisation ?', a: 'Votre organisation est propriétaire de ses données. Siteviral agit en tant que sous-traitant (data processor) conformément au RGPD.' },
      { q: 'Comment supprimer mon compte ?', a: 'Vous pouvez supprimer votre compte depuis les paramètres de votre profil. Toutes vos données personnelles seront supprimées conformément à notre politique de confidentialité.' },
    ],
  },
];

export default function FAQPage() {
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
            <HelpCircle className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">Centre d'aide</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8 font-medium">Questions fréquentes sur Siteviral</p>

        <div className="space-y-8">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-lg font-bold text-foreground mb-3">{section.category}</h2>
              <Accordion type="multiple" className="space-y-2">
                {section.items.map((faq, i) => (
                  <AccordionItem key={i} value={`${section.category}-${i}`} className="bg-card border border-border rounded-xl px-4 overflow-hidden">
                    <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-4">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-card border border-border rounded-2xl p-6 text-center space-y-3">
          <h3 className="font-bold text-foreground">Vous n'avez pas trouvé votre réponse ?</h3>
          <p className="text-sm text-muted-foreground">Notre équipe est disponible pour vous aider.</p>
          <Button asChild className="gold-gradient text-primary-foreground border-0 shadow-gold gap-2">
            <a href="mailto:support@siteviral.com">
              <Mail className="h-4 w-4" /> Contacter le support
            </a>
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
          <span>© {new Date().getFullYear()} Hacktualiz Inc. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
