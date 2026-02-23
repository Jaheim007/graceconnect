import { LegalFooter } from '@/components/layout/LegalPageShell';
import { LegalBackground, LegalHeader } from '@/components/layout/LegalPageShell';
import { HelpCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useI18n } from '@/i18n/I18nContext';

const faqs_fr = [
  {
    category: 'Général',
    items: [
      { q: 'Qu\'est-ce que Siteviral ?', a: 'Siteviral est une plateforme tout-en-un permettant aux organisations (ONG, associations, créateurs, leaders) de gérer leur communauté, vendre des produits numériques, collecter des dons et gérer un programme d\'affiliation.' },
      { q: 'Est-ce gratuit ?', a: 'Oui, le plan gratuit inclut toutes les fonctionnalités de base : page communautaire, médiathèque, dons et jusqu\'à 100 membres. Le plan Pro débloque des fonctionnalités avancées.' },
      { q: 'Dans quels pays Siteviral est-il disponible ?', a: 'Siteviral est disponible dans tous les pays couverts par Paystack. Les dons sont acceptés depuis le monde entier. Les méthodes de paiement dépendent de la disponibilité régionale ; des fournisseurs supplémentaires pourront être ajoutés.' },
    ],
  },
  {
    category: 'Paiements & Dons',
    items: [
      { q: 'Quels moyens de paiement sont acceptés ?', a: 'Nous acceptons Mobile Money (MTN, Orange, Moov), cartes bancaires (Visa, Mastercard) et les virements bancaires via Paystack. Les méthodes disponibles dépendent de votre pays.' },
      { q: 'Quand reçois-je mes fonds ?', a: 'Les fonds sont disponibles pour retrait après un délai de traitement de 72h à 5 jours ouvrés. Les commissions d\'affiliation ont une période de validation de 72h.' },
      { q: 'Puis-je obtenir un remboursement ?', a: 'Les produits numériques sont généralement non remboursables une fois téléchargés. Un remboursement peut être accordé dans les 48h si le produit n\'a pas été consulté. Consultez notre politique de remboursement.' },
    ],
  },
  {
    category: 'Affiliation',
    items: [
      { q: 'Comment fonctionne le programme d\'affiliation ?', a: 'Les membres d\'une organisation peuvent générer des liens de parrainage uniques. Chaque vente ou don effectué via leur lien leur rapporte une commission configurable par l\'organisation. Attribution last-click, cookie 7 jours.' },
      { q: 'Quand mes commissions sont-elles disponibles ?', a: 'Les commissions passent de "en attente" à "disponible" après 72 heures de validation. Vous pouvez ensuite demander un retrait.' },
      { q: 'Puis-je gagner sur mes propres achats ?', a: 'Non, l\'auto-parrainage est détecté et bloqué automatiquement. Les commissions sont annulées en cas de manipulation.' },
    ],
  },
  {
    category: 'KYC & Payout',
    items: [
      { q: 'Qu\'est-ce que le KYC ?', a: 'Le KYC (Know Your Customer) est une vérification d\'identité obligatoire pour les organisations souhaitant recevoir des paiements. Niveau 1 : pièce d\'identité + document de l\'organisation. Niveau 2 : informations bancaires vérifiées.' },
      { q: 'Combien de temps prend la vérification KYC ?', a: 'La vérification KYC est traitée sous 48 heures ouvrées par notre équipe. Une vérification renforcée peut être requise pour les volumes élevés.' },
      { q: 'Pourquoi mes fonds sont-ils gelés ?', a: 'Les fonds peuvent être gelés en cas de suspicion de fraude, activité AML, dispute en cours ou non-conformité KYC. Vous serez notifié du motif et pourrez fournir des justificatifs.' },
    ],
  },
  {
    category: 'Sécurité & Données',
    items: [
      { q: 'Mes données sont-elles en sécurité ?', a: 'Oui. Nous utilisons le chiffrement SSL, Supabase Row Level Security, et nous sommes conformes au RGPD. Les paiements sont sécurisés via Paystack, certifié PCI-DSS.' },
      { q: 'Qui est propriétaire des données de mon organisation ?', a: 'Votre organisation est propriétaire de ses données (Data Controller). Siteviral agit en tant que Data Processor conformément au RGPD.' },
      { q: 'Comment supprimer mon compte ?', a: 'Vous pouvez supprimer votre compte depuis les paramètres de votre profil. Les données seront supprimées sous 30 jours, sauf celles conservées pour obligations légales.' },
      { q: 'Comment exercer mes droits RGPD ?', a: 'Envoyez un email à privacy@siteviral.com. Nous répondrons sous 30 jours. Vous pouvez demander l\'accès, la rectification, la suppression ou la portabilité de vos données.' },
    ],
  },
];

const faqs_en = [
  {
    category: 'General',
    items: [
      { q: 'What is Siteviral?', a: 'Siteviral is an all-in-one platform for organizations (NGOs, associations, creators, leaders) to manage their community, sell digital products, collect donations, and run an affiliate program.' },
      { q: 'Is it free?', a: 'Yes, the free plan includes all basic features: community page, media library, donations, and up to 100 members. The Pro plan unlocks advanced features.' },
      { q: 'In which countries is Siteviral available?', a: 'Siteviral is available in all countries covered by Paystack. Donations are accepted worldwide. Payment methods depend on regional availability; additional providers may be added.' },
    ],
  },
  {
    category: 'Payments & Donations',
    items: [
      { q: 'What payment methods are accepted?', a: 'We accept Mobile Money (MTN, Orange, Moov), bank cards (Visa, Mastercard), and bank transfers via Paystack. Available methods depend on your country.' },
      { q: 'When do I receive my funds?', a: 'Funds are available for withdrawal after a processing delay of 72 hours to 5 business days. Affiliate commissions have a 72-hour validation period.' },
      { q: 'Can I get a refund?', a: 'Digital products are generally non-refundable once downloaded. A refund may be granted within 48 hours if the product has not been accessed. See our refund policy.' },
    ],
  },
  {
    category: 'Affiliation',
    items: [
      { q: 'How does the affiliate program work?', a: 'Organization members can generate unique referral links. Each sale or donation made via their link earns a commission configurable by the organization. Last-click attribution, 7-day cookie.' },
      { q: 'When are my commissions available?', a: 'Commissions move from "pending" to "available" after 72 hours of validation. You can then request a withdrawal.' },
      { q: 'Can I earn on my own purchases?', a: 'No, self-referral is automatically detected and blocked. Commissions are canceled in case of manipulation.' },
    ],
  },
  {
    category: 'KYC & Payout',
    items: [
      { q: 'What is KYC?', a: 'KYC (Know Your Customer) is a mandatory identity verification for organizations wishing to receive payments. Level 1: ID document + organization document. Level 2: verified bank information.' },
      { q: 'How long does KYC verification take?', a: 'KYC verification is processed within 48 business hours by our team. Enhanced verification may be required for high volumes.' },
      { q: 'Why are my funds frozen?', a: 'Funds may be frozen due to suspected fraud, AML activity, ongoing disputes, or KYC non-compliance. You will be notified of the reason and can provide supporting documents.' },
    ],
  },
  {
    category: 'Security & Data',
    items: [
      { q: 'Is my data secure?', a: 'Yes. We use SSL encryption, Supabase Row Level Security, and are GDPR compliant. Payments are secured via Paystack, PCI-DSS certified.' },
      { q: 'Who owns my organization\'s data?', a: 'Your organization owns its data (Data Controller). Siteviral acts as Data Processor in accordance with GDPR.' },
      { q: 'How do I delete my account?', a: 'You can delete your account from your profile settings. Data will be deleted within 30 days, except data retained for legal obligations.' },
      { q: 'How do I exercise my GDPR rights?', a: 'Send an email to privacy@siteviral.com. We will respond within 30 days. You can request access, rectification, deletion, or portability of your data.' },
    ],
  },
];

export default function FAQPage() {
  const { t, locale } = useI18n();
  const faqs = locale === 'fr' ? faqs_fr : faqs_en;

  return (
    <div className="min-h-screen bg-background">
      <LegalBackground />
      <LegalHeader />

      <main className="relative z-10 container max-w-3xl px-4 pt-24 pb-16">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <HelpCircle className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">{t('faq.title')}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8 font-medium">{t('faq.subtitle')}</p>

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
          <h3 className="font-bold text-foreground">{t('faq.not_found')}</h3>
          <p className="text-sm text-muted-foreground">{t('faq.not_found_desc')}</p>
          <Button asChild className="bg-primary text-primary-foreground gap-2">
            <a href="mailto:support@siteviral.com">
              <Mail className="h-4 w-4" /> {t('faq.contact_support')}
            </a>
          </Button>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
