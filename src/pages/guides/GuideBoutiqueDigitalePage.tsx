import { SEOGuidePage } from '@/components/landing/SEOGuidePage';
export default function GuideBoutiqueDigitalePage() {
  return <SEOGuidePage
    seo={{ title: 'Créer une boutique digitale gratuite — Guide complet', description: 'Comment créer votre boutique en ligne gratuite pour vendre des produits numériques en Afrique. Aucune compétence technique requise.', url: 'https://siteviral.com/guide/boutique-digitale-gratuite' }}
    badge="🛒 Guide SEO"
    title="Créer une boutique digitale gratuite"
    intro="Vous voulez vendre des produits numériques mais vous n'avez pas de budget pour un site web ? Voici comment créer votre boutique en ligne gratuitement en moins de 10 minutes."
    sections={[
      { heading: '1. Pourquoi une boutique digitale ?', content: 'Les produits numériques (ebooks, cours, templates, musique) n\'ont pas de coût de stock, pas de livraison, et des marges de 90%. C\'est le business le plus rentable à lancer sans investissement.' },
      { heading: '2. Les alternatives et leurs limites', content: 'Shopify : 29$/mois minimum, pas de Mobile Money. WordPress : complexe, hébergement payant. Gumroad : pas adapté à l\'Afrique. Siteviral : gratuit, Mobile Money natif, pensé pour l\'Afrique.' },
      { heading: '3. Créer votre boutique en 10 minutes', content: 'Étape 1 : Inscrivez-vous gratuitement sur Siteviral.\nÉtape 2 : Créez votre organisation (nom, logo, description).\nÉtape 3 : Ajoutez vos produits (upload fichier + prix).\nÉtape 4 : Partagez votre lien.' },
      { heading: '4. Personnaliser votre boutique', content: 'Ajoutez votre logo et bannière. Rédigez une bio professionnelle. Organisez vos produits par catégorie. Activez les sections : produits, dons, événements, médias.' },
      { heading: '5. Recevoir des paiements', content: 'Complétez votre vérification d\'identité (pièce d\'identité + numéro Mobile Money). Vos clients payent par Orange Money, MTN, Wave ou carte. L\'argent est versé automatiquement.' },
      { heading: '6. Développer votre boutique', content: 'Activez le programme ambassadeur. Créez des codes promo. Lancez des ventes flash. Utilisez les analytics pour comprendre ce qui fonctionne.' },
    ]}
    cta={{ label: 'Créer ma boutique gratuite', path: '/auth?mode=signup' }}
  />;
}
