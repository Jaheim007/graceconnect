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
    q: 'Combien coûte Siteviral ?',
    a: 'Zéro franc d\'abonnement. Vous ne payez qu\'une commission de 10% uniquement quand vous réalisez une vente ou recevez un don. Si vous ne gagnez rien, vous ne payez rien.',
  },
  {
    q: 'Comment fonctionne le programme ambassadeur ?',
    a: 'Vous vous inscrivez gratuitement, vous parcourez les ressources disponibles, et vous générez votre lien unique. Chaque fois que quelqu\'un achète via votre lien, vous touchez entre 5% et 50% de commission selon le créateur. Aucun contenu à créer de votre côté.',
  },
  {
    q: 'Quels moyens de paiement sont acceptés ?',
    a: 'Cartes bancaires (Visa, Mastercard) et Mobile Money (Orange Money, MTN MoMo, Wave, etc.). Les paiements sont traités par Paystack et Stripe, deux processeurs internationaux de confiance.',
  },
  {
    q: 'Quand est-ce que je reçois mes paiements ?',
    a: 'Les fonds sont disponibles après une période de sécurité de 72 heures. Vous pouvez ensuite demander un retrait par Mobile Money ou virement bancaire. Le KYC (vérification d\'identité) est requis pour les retraits mais pas pour commencer à vendre.',
  },
  {
    q: 'Est-ce que mon contenu est protégé ?',
    a: 'Oui. Chaque document téléchargé inclut un watermark automatique avec le nom de l\'acheteur, empêchant la redistribution non autorisée. Vous pouvez aussi suivre les téléchargements dans votre tableau de bord.',
  },
  {
    q: 'Puis-je utiliser Siteviral pour mon église ou mon ONG ?',
    a: 'Absolument. Des centaines d\'églises et d\'ONG utilisent Siteviral pour recevoir des offrandes, vendre des prédications, lancer des campagnes de collecte de fonds et gérer leur communauté.',
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
