import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const faqs = [
  {
    q: 'Qu\'est-ce que Siteviral ?',
    a: 'Siteviral est une plateforme tout-en-un qui permet aux organisations et leaders de créer leur plateforme digitale pour vendre, collecter des dons et gérer leur communauté — et surtout de bénéficier d\'une armée d\'ambassadeurs qui diffusent leurs ressources et gagnent des commissions de 5% à 50%. Sur Siteviral, tout le monde gagne et tout le monde monétise, avec ou sans contenu.',
  },
  {
    q: 'Combien coûte Siteviral ?',
    a: 'Zéro franc d\'abonnement. Siteviral prend une commission de 10% uniquement quand une vente est réalisée ou un don reçu. Si vous ne gagnez rien, vous ne payez rien.',
  },
  {
    q: 'Comment fonctionne le module Dons & Offrandes ?',
    a: 'Chaque organisation peut activer le module « Dons » depuis ses paramètres. Elle choisit son propre vocabulaire (dons, offrandes, dîmes, contributions…), configure des montants suggérés ou libres, et propose des dons ponctuels ou récurrents (hebdomadaire, mensuel, annuel). Les donateurs paient par Mobile Money ou carte bancaire.',
  },
  {
    q: 'Comment fonctionne le Programme Ambassadeur ?',
    a: 'Inscrivez-vous gratuitement, parcourez les ressources disponibles, et générez votre lien unique. Chaque achat via votre lien vous rapporte entre 5% et 50% de commission fixée par l\'organisation. Aucun contenu à créer de votre côté.',
  },
  {
    q: 'Les ambassadeurs gagnent-ils des commissions sur les dons ?',
    a: 'Non. Les commissions ambassadeurs et partenaires s\'appliquent uniquement aux ventes de ressources numériques (ebooks, audio, vidéos, etc.). Il n\'y a aucune commission sur les dons, les offrandes et les campagnes de collecte. Seule la plateforme prend ses 10% de frais de service sur ces transactions.',
  },
  {
    q: 'Quels moyens de paiement sont acceptés ?',
    a: 'Cartes bancaires (Visa, Mastercard) et Mobile Money (Orange Money, MTN MoMo, Wave) via Paystack pour l\'Afrique, et cartes bancaires internationales via Stripe pour le reste du monde.',
  },
  {
    q: 'Quand est-ce que je reçois mes paiements ?',
    a: 'Si vous êtes vendeur, vos revenus sont visibles immédiatement. Vous pouvez demander un retrait après 3 jours (72h). Si vous êtes ambassadeur, vos commissions sont disponibles après 15 jours de validation. Le retrait se fait par Mobile Money, virement bancaire ou carte, selon votre pays.',
  },
  {
    q: 'Est-ce que mon contenu est protégé ?',
    a: 'Oui. Chaque document téléchargé inclut un watermark automatique avec le nom de l\'acheteur. Vous pouvez aussi suivre les téléchargements dans votre tableau de bord.',
  },
];

export function LandingFAQ() {
  return (
    <section className="py-20 px-4">
      <div className="container max-w-3xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
          <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">FAQ</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Questions <span className="text-primary">fréquentes</span>
          </h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-5 data-[state=open]:border-primary/30 transition-colors">
                <AccordionTrigger className="text-sm font-semibold text-left py-4 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
