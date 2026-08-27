import { SEOHead } from '@/components/seo/SEOHead';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from '@/lib/router-compat';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const caseStudiesFr = [
  { icon: '⛪', flag: '🇨🇮', category: 'Église', title: 'Comment l\'Église Grâce Divine a multiplié ses collectes par 3', summary: 'Passant de collectes manuelles en espèces à des dons digitaux par Mobile Money, cette église de 800 membres a triplé ses revenus mensuels en 4 mois.', metrics: [{ value: '3x', label: 'collectes' }, { value: '800', label: 'membres' }, { value: '4 mois', label: 'résultat' }], quote: 'Nos fidèles donnent maintenant depuis chez eux. Les dîmes sont régulières et traçables.', author: 'Pasteur K. A.' },
  { icon: '📚', flag: '🇸🇳', category: 'Formateur', title: 'Comment Coach Mariama gagne 2M FCFA/mois en vendant des PDFs', summary: 'Formatrice en développement personnel, elle est passée des envois WhatsApp manuels à une boutique automatisée. Ses ebooks se vendent 24h/24.', metrics: [{ value: '2M FCFA', label: '/mois' }, { value: '1 200', label: 'ventes' }, { value: '6 mois', label: 'résultat' }], quote: 'Je dormais pendant que mes ebooks se vendaient. Siteviral a changé mon business.', author: 'Coach Mariama D.' },
  { icon: '🌍', flag: '🇧🇫', category: 'ONG', title: 'Comment l\'ONG Espoir Sahel a levé 5M FCFA en une campagne', summary: 'Une campagne de collecte pour un projet éducatif dans le Sahel. Les dons de la diaspora en EUR/USD ont représenté 60% du total.', metrics: [{ value: '5M FCFA', label: 'levés' }, { value: '60%', label: 'diaspora' }, { value: '3 sem.', label: 'durée' }], quote: 'La barre de progression publique a motivé les donateurs. Chacun voyait l\'objectif avancer.', author: 'Directrice F. O.' },
  { icon: '📸', flag: '🇨🇲', category: 'Photographe', title: 'Comment un photographe de Douala vend ses presets Lightroom', summary: 'Photographe professionnel, il a packageé ses presets en produits digitaux. 400 ventes en 2 mois via sa bio Instagram.', metrics: [{ value: '400', label: 'ventes' }, { value: '2 mois', label: 'résultat' }, { value: '0 FCFA', label: 'investissement' }], quote: 'Mes presets se vendaient sur WhatsApp un par un. Maintenant c\'est automatique.', author: 'Chris M.' },
  { icon: '🎓', flag: '🇸🇳', category: 'Enseignant', title: 'Comment un préparateur de concours touche 10x plus d\'étudiants', summary: 'Ses annales corrigées étaient en photocopies. En les vendant en ligne, il touche des étudiants dans tout le pays.', metrics: [{ value: '10x', label: 'portée' }, { value: '500+', label: 'étudiants' }, { value: '5x', label: 'revenus' }], quote: 'Mes annales corrigées se vendent dans tout le Sénégal. Mes revenus ont été multipliés par 5.', author: 'Prof. A. T.' },
  { icon: '🤝', flag: '🇬🇳', category: 'Ambassadeur', title: 'Comment un étudiant gagne 500 000 FCFA/mois sans contenu', summary: 'Étudiant en dernière année, il partage les ressources d\'autres créateurs sur WhatsApp et TikTok. Les commissions s\'accumulent.', metrics: [{ value: '500K', label: 'FCFA/mois' }, { value: '0', label: 'contenu créé' }, { value: '3 mois', label: 'pour y arriver' }], quote: 'Je partage des liens dans mes groupes WhatsApp. Chaque vente me rapporte une commission.', author: 'Amadou S.' },
];

const caseStudiesEn = [
  { icon: '⛪', flag: '🇨🇮', category: 'Church', title: 'How Grace Divine Church tripled their collections', summary: 'Moving from manual cash collections to digital Mobile Money donations, this 800-member church tripled its monthly revenue in 4 months.', metrics: [{ value: '3x', label: 'collections' }, { value: '800', label: 'members' }, { value: '4 months', label: 'result' }], quote: 'Our faithful now give from home. Tithes are regular and traceable.', author: 'Pastor K. A.' },
  { icon: '📚', flag: '🇸🇳', category: 'Coach', title: 'How Coach Mariama earns 2M FCFA/month selling PDFs', summary: 'A personal development coach, she went from manual WhatsApp sends to an automated store. Her ebooks sell 24/7.', metrics: [{ value: '2M FCFA', label: '/month' }, { value: '1,200', label: 'sales' }, { value: '6 months', label: 'result' }], quote: 'I was sleeping while my ebooks were selling. Siteviral changed my business.', author: 'Coach Mariama D.' },
  { icon: '🌍', flag: '🇧🇫', category: 'NGO', title: 'How NGO Espoir Sahel raised 5M FCFA in one campaign', summary: 'A fundraising campaign for an educational project in the Sahel. Diaspora donations in EUR/USD represented 60% of the total.', metrics: [{ value: '5M FCFA', label: 'raised' }, { value: '60%', label: 'diaspora' }, { value: '3 weeks', label: 'duration' }], quote: 'The public progress bar motivated donors. Everyone could see the goal advancing.', author: 'Director F. O.' },
  { icon: '📸', flag: '🇨🇲', category: 'Photographer', title: 'How a Douala photographer sells Lightroom presets', summary: 'A professional photographer packaged his presets as digital products. 400 sales in 2 months via his Instagram bio.', metrics: [{ value: '400', label: 'sales' }, { value: '2 months', label: 'result' }, { value: '$0', label: 'investment' }], quote: 'My presets were selling on WhatsApp one by one. Now it\'s automatic.', author: 'Chris M.' },
  { icon: '🎓', flag: '🇸🇳', category: 'Teacher', title: 'How an exam prep teacher reaches 10x more students', summary: 'His corrected exam papers were photocopied. By selling them online, he reaches students across the country.', metrics: [{ value: '10x', label: 'reach' }, { value: '500+', label: 'students' }, { value: '5x', label: 'revenue' }], quote: 'My corrected papers sell all over Senegal. My revenue has been multiplied by 5.', author: 'Prof. A. T.' },
  { icon: '🤝', flag: '🇬🇳', category: 'Ambassador', title: 'How a student earns 500,000 FCFA/month without content', summary: 'A final-year student, he shares other creators\' resources on WhatsApp and TikTok. Commissions add up.', metrics: [{ value: '500K', label: 'FCFA/month' }, { value: '0', label: 'content created' }, { value: '3 months', label: 'to achieve' }], quote: 'I share links in my WhatsApp groups. Every sale earns me a commission.', author: 'Amadou S.' },
];

export default function EtudesDeCasPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const caseStudies = isFr ? caseStudiesFr : caseStudiesEn;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={isFr ? 'Études de cas — Siteviral' : 'Case Studies — Siteviral'} description={isFr ? 'Découvrez comment des leaders, créateurs et organisations utilisent Siteviral.' : 'Discover how leaders, creators and organizations use Siteviral.'} canonicalUrl="https://siteviral.com/etudes-de-cas" />
      <LandingNav />

      <section className="pt-14">
        <div className="container max-w-5xl px-4 pt-24 pb-16 text-center">
          <Badge variant="secondary" className="mb-4 text-xs px-4 py-1.5 rounded-full">{isFr ? '📊 Études de cas' : '📊 Case Studies'}</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">{isFr ? <>Ils l'ont fait. <span className="text-primary">Vous aussi.</span></> : <>They did it. <span className="text-primary">You can too.</span></>}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{isFr ? 'Des histoires réelles de leaders, créateurs et organisations qui utilisent Siteviral pour transformer leur impact en revenus.' : 'Real stories of leaders, creators and organizations using Siteviral to turn their impact into revenue.'}</p>
        </div>
      </section>

      <section className="pb-20 px-4">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="container max-w-5xl grid gap-8">
          {caseStudies.map((cs) => (
            <motion.div key={cs.title} variants={fadeUp} className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-3xl">{cs.icon}</span>
                <Badge variant="outline" className="text-xs">{cs.category}</Badge>
                <span className="text-xl">{cs.flag}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold leading-tight">{cs.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{cs.summary}</p>
              <div className="flex flex-wrap gap-6">
                {cs.metrics.map((m) => (
                  <div key={m.label} className="text-center">
                    <p className="text-xl font-extrabold text-primary">{m.value}</p>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>
              <blockquote className="border-l-2 border-primary/30 pl-4 italic text-sm text-muted-foreground">« {cs.quote} » — <strong>{cs.author}</strong></blockquote>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container max-w-3xl text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold">{isFr ? 'Votre success story commence ici' : 'Your success story starts here'}</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto">{isFr ? 'Créez votre plateforme gratuitement en moins de 2 minutes.' : 'Create your platform for free in under 2 minutes.'}</p>
          <Button size="lg" variant="secondary" className="px-10 h-13 text-base gap-2 group" onClick={() => navigate('/auth?mode=signup')}>
            {isFr ? 'Commencer gratuitement' : 'Get started for free'} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
