import { LegalFooter } from '@/components/layout/LegalPageShell';
import { LandingNav } from '@/components/landing/LandingNav';
import { HelpCircle, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';

/* ── Static fallback FAQs ── */
const faqs_fr = [
  {
    category: 'Général',
    items: [
      { q: "Qu'est-ce que Siteviral ?", a: "Siteviral est une plateforme tout-en-un qui permet aux organisations (ONG, associations, créateurs, leaders) de créer leur plateforme digitale pour gérer leur communauté, vendre des produits numériques, collecter des dons — et surtout de bénéficier d'une armée d'ambassadeurs qui diffusent leurs ressources et gagnent des commissions de 5% à 50% sur chaque vente. Sur Siteviral, tout le monde gagne et tout le monde monétise, avec ou sans contenu." },
      { q: 'Est-ce gratuit ?', a: "Oui. Il n'y a aucun abonnement. Siteviral prend une commission de 10% uniquement quand une vente est réalisée ou un don reçu. Si vous ne gagnez rien, vous ne payez rien. Aucune limite de membres." },
      { q: 'Dans quels pays Siteviral est-il disponible ?', a: "Siteviral est disponible dans plus de 150 pays grâce à Paystack (Afrique : Nigeria, Ghana, Côte d'Ivoire, Sénégal, Kenya, etc.) et Stripe (reste du monde). Les méthodes de paiement dépendent de votre pays." },
      { q: 'Combien prend Siteviral sur mes ventes ?', a: "Siteviral prend 10% de commission sur chaque transaction (vente ou don). Cette commission couvre l'infrastructure, le traitement des paiements et le support. Il n'y a aucun frais fixe ni abonnement." },
    ],
  },
  {
    category: 'Paiements & Retraits',
    items: [
      { q: 'Quels moyens de paiement sont acceptés ?', a: 'Nous acceptons les cartes bancaires (Visa, Mastercard) et le Mobile Money (Orange Money, MTN MoMo, Wave) via Paystack pour l\'Afrique, et les cartes bancaires internationales via Stripe pour le reste du monde.' },
      { q: 'Quand reçois-je mes fonds en tant que vendeur ?', a: 'Vos revenus de vente sont visibles immédiatement dans votre tableau de bord. Vous pouvez demander un retrait après une période de sécurité de 3 jours (72 heures), nécessaire pour gérer d\'éventuelles disputes. Le retrait est ensuite traité sous 3 à 8 jours ouvrés.' },
      { q: 'Quand reçois-je mes commissions en tant qu\'ambassadeur ?', a: 'Les commissions des ambassadeurs passent de "en attente" à "disponible" après une période de validation de 15 jours. Vous pouvez ensuite demander un retrait par Mobile Money, virement bancaire ou carte, selon votre pays.' },
      { q: 'Puis-je obtenir un remboursement ?', a: 'Les produits numériques sont généralement non remboursables une fois téléchargés. Un remboursement peut être accordé dans les 48h si le produit n\'a pas été consulté ou en cas de problème technique avéré.' },
    ],
  },
  {
    category: 'Programme Ambassadeur',
    items: [
      { q: 'Comment fonctionne le Programme Ambassadeur ?', a: 'Les ambassadeurs génèrent des liens de partage uniques pour les produits disponibles sur la plateforme. Chaque vente effectuée via leur lien leur rapporte une commission fixée par l\'organisation (de 5% à 50%). Le système utilise une attribution last-click avec un cookie de 7 jours : si quelqu\'un clique sur votre lien et achète dans les 7 jours, vous touchez la commission.' },
      { q: 'Quand mes commissions sont-elles disponibles ?', a: 'Après 15 jours de validation, vos commissions passent au statut "disponible". Vous pouvez ensuite demander un retrait via Mobile Money, virement bancaire ou carte selon votre pays.' },
      { q: 'Puis-je gagner sur mes propres achats ?', a: 'Non, l\'auto-parrainage est détecté et bloqué automatiquement. Les commissions sont annulées en cas de manipulation.' },
      { q: 'Dois-je créer du contenu ?', a: 'Non ! Vous partagez le contenu des autres créateurs et gagnez des commissions. Zéro création nécessaire. Bien sûr, si vous le souhaitez, vous pouvez aussi créer votre propre plateforme et vendre vos propres ressources.' },
    ],
  },
  {
    category: 'Vérification d\'identité',
    items: [
      { q: "Pourquoi vérifier mon identité ?", a: "La vérification d'identité est obligatoire pour recevoir des paiements. C'est une obligation légale pour prévenir le blanchiment d'argent et protéger tous les utilisateurs. En tant qu'organisation américaine (Delaware C-Corp), nous respectons les réglementations internationales. La vérification est assurée en interne ou par nos partenaires Paystack et Stripe." },
      { q: 'Combien de temps prend la vérification ?', a: 'La vérification est traitée sous 72 heures ouvrées. Pour les volumes élevés, une vérification renforcée peut être requise avec des documents supplémentaires.' },
      { q: 'Pourquoi mes fonds sont-ils gelés ?', a: 'Les fonds peuvent être gelés en cas de suspicion de fraude, activité suspecte, dispute en cours ou non-conformité de la vérification d\'identité. Vous serez notifié du motif et pourrez fournir des justificatifs. Ces mesures protègent l\'ensemble de l\'écosystème — vendeurs, acheteurs et ambassadeurs.' },
    ],
  },
  {
    category: 'Sécurité & Données',
    items: [
      { q: 'Mes données sont-elles en sécurité ?', a: 'Oui. Nous utilisons le chiffrement SSL/TLS, des politiques de sécurité au niveau des données (Row Level Security), et nous sommes conformes au RGPD. Les paiements sont sécurisés via Paystack (certifié PCI-DSS) et Stripe.' },
      { q: 'Qui est propriétaire des données de mon organisation ?', a: 'Votre organisation est propriétaire de ses données (Data Controller). Siteviral agit en tant que Data Processor conformément au RGPD.' },
      { q: 'Comment supprimer mon compte ?', a: 'Vous pouvez supprimer votre compte depuis les paramètres de votre profil. Les données seront supprimées sous 30 jours, sauf celles conservées pour obligations légales.' },
      { q: "Comment exercer mes droits RGPD ?", a: "Envoyez un email à privacy@siteviral.com. Nous répondrons sous 30 jours. Vous pouvez demander l'accès, la rectification, la suppression ou la portabilité de vos données." },
    ],
  },
];

const faqs_en = [
  {
    category: 'General',
    items: [
      { q: 'What is Siteviral?', a: 'Siteviral is an all-in-one platform that allows organizations and leaders to create their digital platform to manage their community, sell digital products, and collect donations — and most importantly, to benefit from an army of ambassadors who share their resources and earn commissions of 5% to 50% on every sale. On Siteviral, everyone earns and everyone monetizes, with or without content.' },
      { q: 'Is it free?', a: 'Yes. There is no subscription fee. Siteviral takes a 10% commission only when a sale is made or a donation is received. If you earn nothing, you pay nothing. No member limits.' },
      { q: 'In which countries is Siteviral available?', a: "Siteviral is available in over 150 countries through Paystack (Africa: Nigeria, Ghana, Côte d'Ivoire, Senegal, Kenya, etc.) and Stripe (rest of the world). Payment methods depend on your country." },
      { q: 'How much does Siteviral take from my sales?', a: 'Siteviral takes a 10% commission on each transaction (sale or donation). This covers infrastructure, payment processing, and support. There are no fixed fees or subscriptions.' },
    ],
  },
  {
    category: 'Payments & Withdrawals',
    items: [
      { q: 'What payment methods are accepted?', a: 'We accept bank cards (Visa, Mastercard) and Mobile Money (Orange Money, MTN MoMo, Wave) via Paystack for Africa, and international bank cards via Stripe for the rest of the world.' },
      { q: 'When do I receive my funds as a seller?', a: 'Your sales revenue is visible immediately in your dashboard. You can request a withdrawal after a 3-day (72-hour) security period, necessary to handle potential disputes. The withdrawal is then processed within 3 to 8 business days.' },
      { q: 'When do I receive my commissions as an ambassador?', a: 'Ambassador commissions move from "pending" to "available" after a 15-day validation period. You can then request a withdrawal via Mobile Money, bank transfer, or card, depending on your country.' },
      { q: 'Can I get a refund?', a: 'Digital products are generally non-refundable once downloaded. A refund may be granted within 48 hours if the product has not been accessed or in case of a verified technical issue.' },
    ],
  },
  {
    category: 'Ambassador Program',
    items: [
      { q: 'How does the Ambassador Program work?', a: "Ambassadors generate unique sharing links for products available on the platform. Each sale made via their link earns a commission set by the organization (5% to 50%). The system uses last-click attribution with a 7-day cookie: if someone clicks your link and purchases within 7 days, you earn the commission." },
      { q: 'When are my commissions available?', a: 'After 15 days of validation, your commissions move to "available" status. You can then request a withdrawal via Mobile Money, bank transfer, or card depending on your country.' },
      { q: 'Can I earn on my own purchases?', a: 'No, self-referral is automatically detected and blocked. Commissions are canceled in case of manipulation.' },
      { q: 'Do I need to create content?', a: "No! You share other creators' content and earn commissions. Zero creation needed. Of course, if you wish, you can also create your own platform and sell your own resources." },
    ],
  },
  {
    category: 'KYC & Verification',
    items: [
      { q: 'What is KYC?', a: "KYC (Know Your Customer) is a mandatory identity verification to receive payments. It's a legal obligation to prevent money laundering and protect all users. As a US corporation (Delaware C-Corp), we comply with international regulations. Verification is primarily handled by our partners Paystack and Stripe." },
      { q: 'How long does KYC verification take?', a: 'Verification is processed within 48 business hours. For high volumes, enhanced verification may be required with additional documents.' },
      { q: 'Why are my funds frozen?', a: "Funds may be frozen due to suspected fraud, suspicious activity, ongoing disputes, or KYC non-compliance. You will be notified of the reason and can provide supporting documents. These measures protect the entire ecosystem — sellers, buyers, and ambassadors." },
    ],
  },
  {
    category: 'Security & Data',
    items: [
      { q: 'Is my data secure?', a: 'Yes. We use SSL/TLS encryption, data-level security policies (Row Level Security), and are GDPR compliant. Payments are secured via Paystack (PCI-DSS certified) and Stripe.' },
      { q: "Who owns my organization's data?", a: 'Your organization owns its data (Data Controller). Siteviral acts as Data Processor in accordance with GDPR.' },
      { q: 'How do I delete my account?', a: 'You can delete your account from your profile settings. Data will be deleted within 30 days, except data retained for legal obligations.' },
      { q: 'How do I exercise my GDPR rights?', a: 'Send an email to privacy@siteviral.com. We will respond within 30 days. You can request access, rectification, deletion, or portability of your data.' },
    ],
  },
];

/* ── Hook: fetch dynamic FAQ items from DB ── */
function useDynamicFaqs(locale: string) {
  return useQuery({
    queryKey: ['faq-items', locale],
    queryFn: async () => {
      const { data, error } = await db
        .from('faq_items')
        .select('*')
        .eq('locale', locale)
        .eq('is_published', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as { id: string; category: string; question: string; answer: string; display_order: number }[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

function mergeFaqs(
  staticFaqs: { category: string; items: { q: string; a: string }[] }[],
  dynamicItems: { category: string; question: string; answer: string }[] | undefined,
) {
  if (!dynamicItems || dynamicItems.length === 0) return staticFaqs;

  // Group dynamic items by category
  const dynamicByCategory: Record<string, { q: string; a: string }[]> = {};
  for (const item of dynamicItems) {
    if (!dynamicByCategory[item.category]) dynamicByCategory[item.category] = [];
    dynamicByCategory[item.category].push({ q: item.question, a: item.answer });
  }

  // Clone static + append dynamic items at the end of matching categories
  const merged = staticFaqs.map(section => {
    const extra = dynamicByCategory[section.category] || [];
    delete dynamicByCategory[section.category];
    return { category: section.category, items: [...section.items, ...extra] };
  });

  // Add new categories from dynamic that don't exist in static
  for (const [cat, items] of Object.entries(dynamicByCategory)) {
    merged.push({ category: cat, items });
  }

  return merged;
}

export default function FAQPage() {
  const { t, locale } = useI18n();
  const staticFaqs = locale === 'fr' ? faqs_fr : faqs_en;
  const { data: dynamicItems, isLoading } = useDynamicFaqs(locale);
  const faqs = mergeFaqs(staticFaqs, dynamicItems);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={locale === 'fr' ? 'FAQ — Siteviral' : 'FAQ — Siteviral'}
        description={locale === 'fr' ? 'Trouvez les réponses à vos questions fréquentes sur Siteviral.' : 'Find answers to frequently asked questions about Siteviral.'}
        jsonLd={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.flatMap(s => s.items).map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }}
      />
      <LandingNav />

      <main className="relative z-10 container max-w-3xl px-4 pt-24 pb-16">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <HelpCircle className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">{t('faq.title')}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8 font-medium">{t('faq.subtitle')}</p>

        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

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
                      {faq.q.includes('remboursement') || faq.q.includes('refund') ? (
                        <span className="block mt-2">
                          <Link to="/refund-policy" className="text-primary hover:underline font-medium">
                            {locale === 'fr' ? '→ Consulter notre politique de remboursement' : '→ View our refund policy'}
                          </Link>
                        </span>
                      ) : null}
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
            <Link to="/support">
              <Mail className="h-4 w-4" /> {t('faq.contact_support')}
            </Link>
          </Button>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
