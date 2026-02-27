import { SEOGuidePage } from '@/components/landing/SEOGuidePage';
export default function GuideAffiliationSansInvestissementPage() {
  return <SEOGuidePage
    seo={{ title: 'Programme d\'affiliation sans investissement en Afrique', description: 'Comment gagner de l\'argent en Afrique avec un programme d\'affiliation sans aucun investissement. Guide complet du programme ambassadeur Siteviral.', url: 'https://siteviral.com/guide/affiliation-sans-investissement' }}
    badge="🤝 Guide SEO"
    title="Programme d'affiliation sans investissement en Afrique"
    intro="Pas de capital ? Pas de produit ? Pas de compétence technique ? Le programme ambassadeur Siteviral vous permet de gagner de l'argent en partageant simplement des liens."
    sections={[
      { heading: '1. Qu\'est-ce que l\'affiliation ?', content: 'L\'affiliation consiste à recommander les produits d\'autres personnes et toucher une commission sur chaque vente générée par votre recommandation. Pas de stock, pas d\'investissement, pas de risque.' },
      { heading: '2. Pourquoi c\'est différent du MLM', content: 'Pas de recrutement en chaîne. Pas d\'investissement initial. Pas de pyramide. Vous partagez un lien → quelqu\'un achète → vous gagnez une commission. C\'est tout. Transparent et éthique.' },
      { heading: '3. Comment ça marche sur Siteviral', content: 'Inscrivez-vous (gratuit) → Parcourez les organisations et produits → Générez votre lien ambassadeur unique → Partagez-le sur WhatsApp, Facebook, TikTok → Touchez votre commission sur chaque vente.' },
      { heading: '4. Combien peut-on gagner ?', content: 'Commissions de 10 à 30% selon les organisations. Exemples :\n- Ebook à 3 000 FCFA avec 20% de commission = 600 FCFA par vente\n- Formation à 15 000 FCFA avec 15% = 2 250 FCFA par vente\n- 10 ventes/jour = 6 000 à 22 500 FCFA/jour' },
      { heading: '5. Les meilleures stratégies', content: 'Rejoignez des groupes WhatsApp thématiques. Créez du contenu court sur TikTok. Écrivez des avis sincères. Soyez authentique — ne recommandez que ce que vous avez testé.' },
      { heading: '6. Le versement', content: 'Les commissions sont sécurisées pendant 15 jours (anti-fraude) puis versées sur votre Mobile Money. Vous suivez vos gains en temps réel sur votre tableau de bord.' },
    ]}
    cta={{ label: 'Devenir ambassadeur', path: '/auth?mode=signup' }}
  />;
}
