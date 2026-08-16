import { SEOHead } from '@/components/seo/SEOHead';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Upload, Download, ShoppingBag, Users, CreditCard, Eye, Settings, ArrowRight, ExternalLink, FileText, Shield } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface TutorialStep {
  title: string;
  detail: string;
}

interface Tutorial {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  steps: TutorialStep[];
}

const tutorialsFr: Tutorial[] = [
  {
    id: 'create-account',
    icon: Users,
    title: 'Créer son compte et son organisation',
    description: 'Démarrez sur Siteviral en quelques minutes. Zéro abonnement, inscription gratuite.',
    steps: [
      { title: 'Allez sur la page d\'inscription', detail: 'Cliquez sur "S\'inscrire" en haut à droite du site, ou rendez-vous directement sur la page /auth.' },
      { title: 'Créez votre compte', detail: 'Entrez votre nom, email et mot de passe. Vous pouvez aussi vous inscrire avec Google en un clic.' },
      { title: 'Vérifiez votre email', detail: 'Un email de confirmation vous sera envoyé. Cliquez sur le lien pour activer votre compte.' },
      { title: 'Créez votre organisation', detail: 'Après connexion, cliquez sur "Créer une organisation". Donnez un nom, ajoutez un logo et une description. C\'est votre boutique en ligne !' },
      { title: 'Configurez votre profil', detail: 'Ajoutez votre photo de profil, votre bio et vos coordonnées pour que les acheteurs vous fassent confiance.' },
    ],
  },
  {
    id: 'create-product',
    icon: FileText,
    title: 'Créer et publier un produit numérique',
    description: 'Apprenez à mettre en vente un ebook, cours, template ou tout autre produit numérique.',
    steps: [
      { title: 'Allez dans votre tableau de bord', detail: 'Connectez-vous et cliquez sur votre organisation dans le menu. Allez dans la section "Produits".' },
      { title: 'Cliquez sur "Nouveau produit"', detail: 'Le bouton se trouve en haut de la page des produits. Cliquez dessus pour démarrer la création.' },
      { title: 'Remplissez les informations', detail: 'Ajoutez un titre accrocheur, une description détaillée qui donne envie d\'acheter, et choisissez une catégorie.' },
      { title: 'Uploadez votre fichier', detail: 'Glissez-déposez votre fichier numérique (PDF, ZIP, vidéo, etc.) dans la zone d\'upload. Taille max : 500 Mo.' },
      { title: 'Ajoutez une couverture', detail: 'Uploadez une image de couverture attractive. C\'est la première chose que les acheteurs verront. Format recommandé : 1200x630 pixels.' },
      { title: 'Fixez votre prix', detail: 'Entrez le prix en FCFA. Vous pouvez aussi proposer un produit gratuit ou "payez ce que vous voulez".' },
      { title: 'Publiez votre produit', detail: 'Vérifiez que tout est correct, puis cliquez sur "Publier". Votre produit sera visible immédiatement sur la place de marché !' },
    ],
  },
  {
    id: 'chariow-import',
    icon: Download,
    title: 'Importer ses produits depuis Chariow',
    description: 'Migrez facilement vos produits existants de Chariow vers Siteviral en quelques clics.',
    steps: [
      { title: 'Obtenez votre clé API Chariow', detail: 'Connectez-vous à votre compte Chariow (app.chariow.com). Allez dans Paramètres → API Keys → Créer une nouvelle clé. Copiez la clé générée.' },
      { title: 'Lancez l\'import depuis Siteviral', detail: 'Dans votre tableau de bord admin, allez dans Produits et cliquez sur "Importer depuis Chariow". Collez votre clé API dans le champ prévu.' },
      { title: 'Sélectionnez vos produits', detail: 'Siteviral récupère automatiquement la liste de vos produits Chariow. Cochez ceux que vous souhaitez importer (titre, description, prix et couverture seront copiés).' },
      { title: 'Importez en un clic', detail: 'Cliquez sur "Importer". Vos produits sont créés en mode brouillon sur Siteviral avec toutes les métadonnées.' },
      { title: 'Récupérez vos fichiers numériques', detail: 'Les fichiers source (PDF, vidéos, etc.) ne sont pas transférés automatiquement. Vous devez les télécharger manuellement depuis Chariow.' },
      { title: 'Téléchargez vos fichiers depuis Chariow', detail: 'Sur Chariow, allez dans Products → cliquez sur le produit → Edit → Files (dans le menu latéral) → sous "Digital Files", cliquez sur le menu ⋮ → Download. Le fichier s\'ouvrira dans un nouvel onglet, cliquez sur "Download" pour le sauvegarder.' },
      { title: 'Uploadez les fichiers sur Siteviral', detail: 'Revenez sur Siteviral, éditez chaque produit importé et uploadez le fichier téléchargé. Une fois fait, publiez le produit.' },
    ],
  },
  {
    id: 'sell-products',
    icon: ShoppingBag,
    title: 'Vendre et recevoir ses paiements',
    description: 'Comprenez le processus de vente et de paiement sur Siteviral.',
    steps: [
      { title: 'Complétez votre vérification KYC', detail: 'Allez dans Paramètres → KYC. Uploadez votre pièce d\'identité et un selfie. La vérification prend 24 à 48h. C\'est obligatoire pour recevoir vos fonds.' },
      { title: 'Ajoutez vos coordonnées de paiement', detail: 'Dans Paramètres, ajoutez votre numéro Mobile Money (Orange, MTN, Wave) ou vos coordonnées bancaires pour recevoir vos paiements.' },
      { title: 'Partagez vos produits', detail: 'Partagez le lien de votre produit ou de votre boutique sur WhatsApp, Facebook, Instagram, TikTok... Plus vous partagez, plus vous vendez !' },
      { title: 'Suivez vos ventes en temps réel', detail: 'Votre tableau de bord affiche les ventes, revenus et analytics en direct. Vous recevez aussi des notifications à chaque vente.' },
      { title: 'Recevez vos fonds', detail: 'Les fonds sont disponibles après 72h de rétention sécuritaire. Ils sont versés automatiquement sur votre compte Mobile Money ou bancaire.' },
    ],
  },
  {
    id: 'ambassador',
    icon: Users,
    title: 'Devenir ambassadeur et gagner des commissions',
    description: 'Gagnez de l\'argent en partageant les produits des autres, sans créer de contenu.',
    steps: [
      { title: 'Inscrivez-vous sur Siteviral', detail: 'Créez votre compte gratuitement. C\'est la première étape pour devenir ambassadeur.' },
      { title: 'Parcourez les produits disponibles', detail: 'Allez sur la page "Gagner" ou "Affiliation" pour voir les produits qui offrent des commissions (généralement 10 à 30%).' },
      { title: 'Générez votre lien unique', detail: 'Cliquez sur "Promouvoir" sur un produit. Un lien unique avec votre code est créé automatiquement.' },
      { title: 'Partagez votre lien', detail: 'Partagez ce lien sur WhatsApp, Facebook, TikTok, dans vos groupes... Chaque personne qui achète via votre lien vous rapporte une commission.' },
      { title: 'Suivez vos performances', detail: 'Votre tableau de bord ambassadeur montre les clics, conversions et commissions en temps réel.' },
      { title: 'Recevez vos commissions', detail: 'Les commissions sont versées après 15 jours de validation. Configurez votre Mobile Money pour recevoir vos gains automatiquement.' },
    ],
  },
  {
    id: 'kyc',
    icon: Shield,
    title: 'Vérification d\'identité (KYC)',
    description: 'Complétez votre vérification pour débloquer les retraits et protéger votre compte.',
    steps: [
      { title: 'Accédez au KYC', detail: 'Allez dans votre tableau de bord → Paramètres → Vérification d\'identité (KYC).' },
      { title: 'Niveau 1 : Identité personnelle', detail: 'Uploadez une photo claire de votre pièce d\'identité (carte d\'identité, passeport ou permis de conduire) et prenez un selfie.' },
      { title: 'Niveau 2 : Document d\'organisation', detail: 'Si vous représentez une organisation, uploadez les documents officiels : statuts, récépissé de déclaration, etc.' },
      { title: 'Attendez la validation', detail: 'Notre équipe examine vos documents sous 24 à 48h. Vous recevrez un email de confirmation une fois approuvé.' },
      { title: 'Débloquez les retraits', detail: 'Une fois votre KYC validé, vos fonds sont automatiquement débloqués et vous pouvez recevoir vos paiements.' },
    ],
  },
];

const tutorialsEn: Tutorial[] = [
  {
    id: 'create-account',
    icon: Users,
    title: 'Create your account and organization',
    description: 'Get started on Siteviral in minutes. Zero subscription, free sign-up.',
    steps: [
      { title: 'Go to the registration page', detail: 'Click "Sign Up" in the top right corner, or go directly to /auth.' },
      { title: 'Create your account', detail: 'Enter your name, email and password. You can also sign up with Google in one click.' },
      { title: 'Verify your email', detail: 'A confirmation email will be sent. Click the link to activate your account.' },
      { title: 'Create your organization', detail: 'After logging in, click "Create an organization". Give it a name, add a logo and description. This is your online store!' },
      { title: 'Set up your profile', detail: 'Add your profile photo, bio and contact info so buyers trust you.' },
    ],
  },
  {
    id: 'create-product',
    icon: FileText,
    title: 'Create and publish a digital product',
    description: 'Learn how to sell an ebook, course, template or any digital product.',
    steps: [
      { title: 'Go to your dashboard', detail: 'Log in and click on your organization in the menu. Go to the "Products" section.' },
      { title: 'Click "New product"', detail: 'The button is at the top of the products page. Click it to start creating.' },
      { title: 'Fill in the details', detail: 'Add a catchy title, a detailed description that makes people want to buy, and choose a category.' },
      { title: 'Upload your file', detail: 'Drag and drop your digital file (PDF, ZIP, video, etc.) into the upload area. Max size: 500 MB.' },
      { title: 'Add a cover image', detail: 'Upload an attractive cover image. It\'s the first thing buyers will see. Recommended: 1200x630 pixels.' },
      { title: 'Set your price', detail: 'Enter the price in FCFA. You can also offer a free product or "pay what you want".' },
      { title: 'Publish your product', detail: 'Check that everything looks good, then click "Publish". Your product will be visible immediately on the marketplace!' },
    ],
  },
  {
    id: 'chariow-import',
    icon: Download,
    title: 'Import products from Chariow',
    description: 'Easily migrate your existing products from Chariow to Siteviral in a few clicks.',
    steps: [
      { title: 'Get your Chariow API key', detail: 'Log in to your Chariow account (app.chariow.com). Go to Settings → API Keys → Create a new key. Copy the generated key.' },
      { title: 'Start the import from Siteviral', detail: 'In your admin dashboard, go to Products and click "Import from Chariow". Paste your API key in the field.' },
      { title: 'Select your products', detail: 'Siteviral automatically fetches your Chariow product list. Check the ones you want to import (title, description, price and cover will be copied).' },
      { title: 'Import in one click', detail: 'Click "Import". Your products are created as drafts on Siteviral with all metadata.' },
      { title: 'Get your digital files', detail: 'Source files (PDFs, videos, etc.) are not transferred automatically. You need to download them manually from Chariow.' },
      { title: 'Download files from Chariow', detail: 'On Chariow, go to Products → click the product → Edit → Files (in the sidebar) → under "Digital Files", click the ⋮ menu → Download. The file will open in a new tab, click "Download" to save it.' },
      { title: 'Upload files to Siteviral', detail: 'Come back to Siteviral, edit each imported product and upload the downloaded file. Once done, publish the product.' },
    ],
  },
  {
    id: 'sell-products',
    icon: ShoppingBag,
    title: 'Sell and receive payments',
    description: 'Understand the sales and payment process on Siteviral.',
    steps: [
      { title: 'Complete your KYC verification', detail: 'Go to Settings → KYC. Upload your ID and a selfie. Verification takes 24-48h. Required to receive funds.' },
      { title: 'Add your payment details', detail: 'In Settings, add your Mobile Money number (Orange, MTN, Wave) or bank details to receive payments.' },
      { title: 'Share your products', detail: 'Share your product or store link on WhatsApp, Facebook, Instagram, TikTok... The more you share, the more you sell!' },
      { title: 'Track sales in real-time', detail: 'Your dashboard shows sales, revenue and analytics live. You also get notifications for each sale.' },
      { title: 'Receive your funds', detail: 'Funds are available after a 72h security hold. They are automatically sent to your Mobile Money or bank account.' },
    ],
  },
  {
    id: 'ambassador',
    icon: Users,
    title: 'Become an ambassador and earn commissions',
    description: 'Earn money by sharing others\' products, no content creation needed.',
    steps: [
      { title: 'Sign up on Siteviral', detail: 'Create your free account. This is the first step to becoming an ambassador.' },
      { title: 'Browse available products', detail: 'Go to the "Earn" or "Affiliation" page to see products offering commissions (typically 10-30%).' },
      { title: 'Generate your unique link', detail: 'Click "Promote" on a product. A unique link with your code is automatically created.' },
      { title: 'Share your link', detail: 'Share this link on WhatsApp, Facebook, TikTok, in your groups... Every purchase through your link earns you a commission.' },
      { title: 'Track your performance', detail: 'Your ambassador dashboard shows clicks, conversions and commissions in real-time.' },
      { title: 'Receive your commissions', detail: 'Commissions are paid after 15 days of validation. Set up your Mobile Money to receive earnings automatically.' },
    ],
  },
  {
    id: 'kyc',
    icon: Shield,
    title: 'Identity verification (KYC)',
    description: 'Complete your verification to unlock withdrawals and protect your account.',
    steps: [
      { title: 'Access KYC', detail: 'Go to your dashboard → Settings → Identity Verification (KYC).' },
      { title: 'Level 1: Personal identity', detail: 'Upload a clear photo of your ID (national ID, passport or driver\'s license) and take a selfie.' },
      { title: 'Level 2: Organization document', detail: 'If you represent an organization, upload official documents: articles of incorporation, registration receipt, etc.' },
      { title: 'Wait for validation', detail: 'Our team reviews your documents within 24-48h. You\'ll receive a confirmation email once approved.' },
      { title: 'Unlock withdrawals', detail: 'Once your KYC is validated, your funds are automatically unlocked and you can receive your payments.' },
    ],
  },
];

export default function TutorialsPage() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const isFr = locale === 'fr';
  const tutorials = isFr ? tutorialsFr : tutorialsEn;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={isFr ? 'Tutoriels & Guides — Siteviral' : 'Tutorials & Guides — Siteviral'}
        description={isFr ? 'Guides étape par étape pour utiliser Siteviral : créer un produit, importer depuis Chariow, vendre, devenir ambassadeur.' : 'Step-by-step guides to use Siteviral: create a product, import from Chariow, sell, become an ambassador.'}
        canonicalUrl="https://siteviral.com/tutoriels"
      />
      <LandingNav />

      <section className="pt-14">
        <div className="container max-w-3xl px-4 pt-24 pb-8 text-center space-y-6">
          <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full">
            {isFr ? '📖 Tutoriels' : '📖 Tutorials'}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {isFr ? 'Guides étape par étape' : 'Step-by-step guides'}
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {isFr
              ? 'Apprenez à utiliser Siteviral facilement. Chaque guide vous accompagne avec des instructions claires et détaillées.'
              : 'Learn to use Siteviral easily. Each guide walks you through with clear, detailed instructions.'}
          </p>
        </div>
      </section>

      <section className="pb-20 px-4">
        <div className="container max-w-3xl space-y-6">
          {tutorials.map((tut) => {
            const Icon = tut.icon;
            return (
              <Accordion key={tut.id} type="single" collapsible>
                <AccordionItem value={tut.id} className="border border-border rounded-2xl px-5 bg-card overflow-hidden">
                  <AccordionTrigger className="py-5 hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{tut.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{tut.description}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    {(() => {
                      const scenes = getTutorialDemo(tut.id, isFr ? 'fr' : 'en');
                      if (!scenes.length) return null;
                      return (
                        <div className="mb-5">
                          <div className="mb-2 flex items-center gap-2">
                            <PlayCircle className="h-4 w-4 text-primary" />
                            <p className="text-xs font-semibold">
                              {isFr ? 'Démo interactive' : 'Interactive demo'}
                            </p>
                          </div>
                          <DemoPlayer scenes={scenes} title={tut.title} autoPlay />
                        </div>
                      );
                    })()}
                    <ol className="space-y-4 mt-2">

                      {tut.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{step.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{step.detail}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            );
          })}
        </div>

        <div className="container max-w-3xl mt-16 text-center space-y-4">
          <h2 className="text-xl font-bold">
            {isFr ? 'Besoin d\'aide supplémentaire ?' : 'Need more help?'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isFr ? 'Consultez notre FAQ ou contactez notre équipe.' : 'Check our FAQ or contact our team.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" className="gap-2" onClick={() => navigate('/help')}>
              <BookOpen className="h-4 w-4" />
              FAQ
            </Button>
            <Button className="gap-2" onClick={() => navigate('/support')}>
              {isFr ? 'Contacter le support' : 'Contact support'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
