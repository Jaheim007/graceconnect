import { SEOHead } from '@/components/seo/SEOHead';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, MessageCircle, BookOpen, CreditCard, Shield, Users, Settings, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { useI18n } from '@/i18n/I18nContext';

const categoriesFr = [
  {
    icon: BookOpen, title: 'Premiers pas',
    items: [
      { q: 'Comment créer mon compte ?', a: 'Allez sur /auth, inscrivez-vous avec votre email ou Google. C\'est gratuit et prend 30 secondes.' },
      { q: 'Comment créer mon organisation ?', a: 'Après inscription, allez dans "Créer une organisation". Donnez un nom, ajoutez un logo et une description.' },
      { q: 'Comment ajouter mon premier produit ?', a: 'Dans le tableau de bord admin de votre organisation, cliquez sur "Produits" puis "Nouveau produit". Uploadez votre fichier et fixez un prix.' },
      { q: 'C\'est vraiment gratuit ?', a: 'Oui, zéro abonnement. Siteviral prend 10% uniquement sur les ventes réalisées. Si vous ne vendez rien, vous ne payez rien.' },
    ],
  },
  {
    icon: CreditCard, title: 'Paiements & Revenus',
    items: [
      { q: 'Quels moyens de paiement sont acceptés ?', a: 'Mobile Money (Orange, MTN, Wave, Moov), cartes bancaires (Visa, Mastercard) et paiements internationaux.' },
      { q: 'Quand est-ce que je reçois mon argent ?', a: 'Les revenus sont versés après un hold de sécurité de 72h pour les vendeurs et 15 jours pour les commissions ambassadeur.' },
      { q: 'Comment configurer mon paiement ?', a: 'Complétez votre vérification d\'identité dans les paramètres de votre organisation. Ajoutez votre numéro Mobile Money ou compte bancaire.' },
      { q: 'Quels sont les frais ?', a: '10% de commission Siteviral sur les ventes. Les frais de la passerelle de paiement (Paystack/Stripe) sont inclus.' },
    ],
  },
  {
    icon: Shield, title: 'Sécurité & Protection',
    items: [
      { q: 'Mes contenus sont-ils protégés ?', a: 'Oui, watermark automatique avec le nom de l\'acheteur sur les PDF. Accès sécurisé aux fichiers.' },
      { q: 'Mes données sont-elles en sécurité ?', a: 'Toutes les données sont chiffrées en transit et au repos. Infrastructure hébergée sur des serveurs sécurisés. Conformité RGPD.' },
      { q: 'Que faire en cas de fraude ?', a: 'Notre système anti-fraude détecte automatiquement les activités suspectes. Contactez le support pour signaler tout problème.' },
      { q: 'Comment fonctionne le remboursement ?', a: 'Les remboursements sont gérés au cas par cas. Consultez notre politique de remboursement pour les détails.' },
    ],
  },
  {
    icon: Users, title: 'Programme Ambassadeur',
    items: [
      { q: 'Comment devenir ambassadeur ?', a: 'Inscrivez-vous, puis allez dans "Ambassadeur" depuis le menu. Générez vos liens de partage et commencez à gagner.' },
      { q: 'Combien puis-je gagner ?', a: 'La commission varie par organisation (généralement 10-30% du prix de vente). Utilisez notre calculateur pour estimer vos gains.' },
      { q: 'Comment recevoir mes commissions ?', a: 'Les commissions sont versées après un hold de 15 jours. Configurez votre Mobile Money dans votre profil.' },
      { q: 'Puis-je être ambassadeur sans créer de contenu ?', a: 'Oui, c\'est le principe ! Vous partagez les produits des autres et touchez une commission sur chaque vente.' },
    ],
  },
  {
    icon: Settings, title: 'Gestion & Administration',
    items: [
      { q: 'Comment gérer mon organisation ?', a: 'Accédez au tableau de bord admin depuis le menu latéral. Vous y trouverez tous vos outils : produits, ventes, analytics, etc.' },
      { q: 'Puis-je avoir plusieurs administrateurs ?', a: 'Oui, invitez des membres avec le rôle "admin" ou "moderator" depuis les paramètres de votre organisation.' },
      { q: 'Comment personnaliser ma page ?', a: 'Dans les paramètres de votre organisation, modifiez le logo, la bannière, la description et les couleurs.' },
      { q: 'Comment voir mes statistiques ?', a: 'Le tableau de bord admin affiche vues, ventes, revenus et analytics en temps réel.' },
    ],
  },
];

const categoriesEn = [
  {
    icon: BookOpen, title: 'Getting Started',
    items: [
      { q: 'How do I create my account?', a: 'Go to /auth, sign up with your email or Google. It\'s free and takes 30 seconds.' },
      { q: 'How do I create my organization?', a: 'After signing up, go to "Create an organization". Give it a name, add a logo and description.' },
      { q: 'How do I add my first product?', a: 'In your organization\'s admin dashboard, click "Products" then "New product". Upload your file and set a price.' },
      { q: 'Is it really free?', a: 'Yes, zero subscription. Siteviral takes 10% only on completed sales. If you don\'t sell anything, you pay nothing.' },
    ],
  },
  {
    icon: CreditCard, title: 'Payments & Revenue',
    items: [
      { q: 'What payment methods are accepted?', a: 'Mobile Money (Orange, MTN, Wave, Moov), credit cards (Visa, Mastercard) and international payments.' },
      { q: 'When do I receive my money?', a: 'Revenue is paid out after a 72h security hold for sellers and 15 days for ambassador commissions.' },
      { q: 'How do I set up my payment?', a: 'Complete your identity verification in your organization settings. Add your Mobile Money number or bank account.' },
      { q: 'What are the fees?', a: '10% Siteviral commission on sales. Payment gateway fees (Paystack/Stripe) are included.' },
    ],
  },
  {
    icon: Shield, title: 'Security & Protection',
    items: [
      { q: 'Is my content protected?', a: 'Yes, automatic watermarking with the buyer\'s name on PDFs. Secure file access.' },
      { q: 'Is my data secure?', a: 'All data is encrypted in transit and at rest. Infrastructure hosted on secure servers. GDPR compliant.' },
      { q: 'What if there\'s fraud?', a: 'Our anti-fraud system automatically detects suspicious activity. Contact support to report any issues.' },
      { q: 'How do refunds work?', a: 'Refunds are handled on a case-by-case basis. See our refund policy for details.' },
    ],
  },
  {
    icon: Users, title: 'Ambassador Program',
    items: [
      { q: 'How do I become an ambassador?', a: 'Sign up, then go to "Ambassador" from the menu. Generate your share links and start earning.' },
      { q: 'How much can I earn?', a: 'Commission varies by organization (typically 10-30% of sale price). Use our calculator to estimate your earnings.' },
      { q: 'How do I receive my commissions?', a: 'Commissions are paid out after a 15-day hold. Set up your Mobile Money in your profile.' },
      { q: 'Can I be an ambassador without creating content?', a: 'Yes, that\'s the point! You share others\' products and earn a commission on each sale.' },
    ],
  },
  {
    icon: Settings, title: 'Management & Administration',
    items: [
      { q: 'How do I manage my organization?', a: 'Access the admin dashboard from the side menu. You\'ll find all your tools: products, sales, analytics, etc.' },
      { q: 'Can I have multiple admins?', a: 'Yes, invite members with the "admin" or "moderator" role from your organization settings.' },
      { q: 'How do I customize my page?', a: 'In your organization settings, edit the logo, banner, description and colors.' },
      { q: 'How do I view my statistics?', a: 'The admin dashboard shows views, sales, revenue and real-time analytics.' },
    ],
  },
];

export default function HelpPage() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const categories = isFr ? categoriesFr : categoriesEn;

  const filtered = categories.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) =>
      item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={isFr ? "Centre d'aide — Siteviral" : "Help Center — Siteviral"}
        description={isFr ? "Trouvez des réponses à toutes vos questions sur Siteviral. Guides, tutoriels et FAQ." : "Find answers to all your questions about Siteviral. Guides, tutorials and FAQ."}
        canonicalUrl="https://siteviral.com/help"
      />
      <LandingNav />

      <section className="pt-14">
        <div className="container max-w-3xl px-4 pt-24 pb-8 text-center space-y-6">
          <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full">{isFr ? '❓ Centre d\'aide' : '❓ Help Center'}</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{isFr ? 'Comment pouvons-nous vous aider ?' : 'How can we help you?'}</h1>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={isFr ? 'Rechercher une question...' : 'Search a question...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </section>

      <section className="pb-20 px-4">
        <div className="container max-w-3xl space-y-10">
          {filtered.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.title}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">{cat.title}</h2>
                </div>
                <Accordion type="single" collapsible className="space-y-2">
                  {cat.items.map((item, i) => (
                    <AccordionItem key={i} value={`${cat.title}-${i}`} className="border border-border rounded-xl px-5 bg-card">
                      <AccordionTrigger className="text-sm font-medium text-left py-4">{item.q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">{item.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              {isFr ? `Aucun résultat pour « ${search} ». Essayez un autre terme ou contactez le support.` : `No results for "${search}". Try another term or contact support.`}
            </p>
          )}
        </div>

        <div className="container max-w-3xl mt-16 text-center space-y-4">
          <h2 className="text-xl font-bold">{isFr ? 'Vous n\'avez pas trouvé votre réponse ?' : 'Didn\'t find your answer?'}</h2>
          <p className="text-sm text-muted-foreground">{isFr ? 'Consultez nos tutoriels détaillés ou contactez notre équipe.' : 'Check our detailed tutorials or contact our team.'}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button variant="outline" className="gap-2" onClick={() => navigate('/tutoriels')}>
              <BookOpen className="h-4 w-4" /> {isFr ? 'Tutoriels & Guides' : 'Tutorials & Guides'}
            </Button>
            <Button className="gap-2" onClick={() => navigate('/contact')}>
              <MessageCircle className="h-4 w-4" /> {isFr ? 'Contacter le support' : 'Contact support'}
            </Button>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
