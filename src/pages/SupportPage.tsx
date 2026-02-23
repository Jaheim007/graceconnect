import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { HelpCircle, Plus, ArrowLeft, Send, Clock, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { PageTour } from '@/components/onboarding/PageTour';

const FAQS_EN = [
  {
    category: 'General',
    items: [
      { q: 'What is Siteviral?', a: 'Siteviral is an all-in-one platform for organizations (NGOs, associations, creators, leaders) to manage their community, sell digital products, collect donations, and run an affiliate program.' },
      { q: 'Is it free?', a: 'Yes, the free plan includes all basic features: community page, media library, donations, and up to 100 members. The Pro plan unlocks advanced features.' },
      { q: 'How do I join an organization?', a: 'Go to Explorer, find the organization you want, and click "Join." You can also use an invite link shared by a member.' },
    ],
  },
  {
    category: 'Payments & Donations',
    items: [
      { q: 'What payment methods are accepted?', a: 'Mobile Money (MTN, Orange, Moov), bank cards (Visa, Mastercard), and bank transfers via Paystack. Available methods depend on your country.' },
      { q: 'When do I receive my funds?', a: 'Funds are available for withdrawal after a processing delay of 72 hours to 5 business days.' },
      { q: 'Can I get a refund?', a: 'Digital products are generally non-refundable once downloaded. A refund may be granted within 48 hours if the product has not been accessed.' },
    ],
  },
  {
    category: 'Affiliation',
    items: [
      { q: 'How does affiliation work?', a: 'Generate unique referral links. Each sale or donation made via your link earns you a configurable commission. Last-click attribution, 7-day cookie.' },
      { q: 'When are my commissions available?', a: 'Commissions move from "pending" to "available" after 72 hours of validation. You can then request a withdrawal.' },
    ],
  },
  {
    category: 'Account & Security',
    items: [
      { q: 'Is my data secure?', a: 'Yes. We use SSL encryption, Supabase Row Level Security, and are GDPR compliant. Payments are secured via Paystack, PCI-DSS certified.' },
      { q: 'How do I delete my account?', a: 'You can delete your account from your profile settings. Data will be deleted within 30 days.' },
    ],
  },
];

const FAQS_FR = [
  {
    category: 'Général',
    items: [
      { q: "Qu'est-ce que Siteviral ?", a: "Siteviral est une plateforme tout-en-un permettant aux organisations (ONG, associations, créateurs, leaders) de gérer leur communauté, vendre des produits numériques, collecter des dons et gérer un programme d'affiliation." },
      { q: 'Est-ce gratuit ?', a: "Oui, le plan gratuit inclut toutes les fonctionnalités de base : page communautaire, médiathèque, dons et jusqu'à 100 membres. Le plan Pro débloque des fonctionnalités avancées." },
      { q: 'Comment rejoindre une organisation ?', a: "Rendez-vous dans l'Explorer, trouvez l'organisation souhaitée et cliquez sur « Rejoindre ». Vous pouvez aussi utiliser un lien d'invitation partagé par un membre." },
    ],
  },
  {
    category: 'Paiements & Dons',
    items: [
      { q: 'Quels moyens de paiement sont acceptés ?', a: "Mobile Money (MTN, Orange, Moov), cartes bancaires (Visa, Mastercard) et virements bancaires via Paystack. Les méthodes disponibles dépendent de votre pays." },
      { q: 'Quand reçois-je mes fonds ?', a: "Les fonds sont disponibles pour retrait après un délai de traitement de 72h à 5 jours ouvrés." },
      { q: 'Puis-je obtenir un remboursement ?', a: "Les produits numériques sont généralement non remboursables une fois téléchargés. Un remboursement peut être accordé dans les 48h si le produit n'a pas été consulté." },
    ],
  },
  {
    category: 'Affiliation',
    items: [
      { q: "Comment fonctionne l'affiliation ?", a: "Générez des liens de parrainage uniques. Chaque vente ou don effectué via votre lien vous rapporte une commission configurable par l'organisation. Attribution last-click, cookie 7 jours." },
      { q: 'Quand mes commissions sont-elles disponibles ?', a: "Les commissions passent de « en attente » à « disponible » après 72 heures de validation. Vous pouvez ensuite demander un retrait." },
    ],
  },
  {
    category: 'Compte & Sécurité',
    items: [
      { q: 'Mes données sont-elles en sécurité ?', a: "Oui. Nous utilisons le chiffrement SSL, Supabase Row Level Security, et nous sommes conformes au RGPD. Les paiements sont sécurisés via Paystack, certifié PCI-DSS." },
      { q: 'Comment supprimer mon compte ?', a: "Vous pouvez supprimer votre compte depuis les paramètres de votre profil. Les données seront supprimées sous 30 jours." },
    ],
  },
];

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-500/15 text-amber-600',
  in_progress: 'bg-blue-500/15 text-blue-600',
  resolved: 'bg-emerald-500/15 text-emerald-600',
  closed: 'bg-muted text-muted-foreground',
};

type View = 'faq' | 'tickets' | 'new-ticket';

const TOUR_STEPS = [
  { titleKey: 'tour.help_1_title', descKey: 'tour.help_1_desc', icon: <HelpCircle className="h-4 w-4" /> },
  { titleKey: 'tour.help_2_title', descKey: 'tour.help_2_desc', icon: <Send className="h-4 w-4" /> },
];

export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const qc = useQueryClient();
  const [view, setView] = useState<View>('faq');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('technical');

  const FAQS = locale === 'fr' ? FAQS_FR : FAQS_EN;

  const CATEGORIES = [
    { value: 'billing', label: t('page.help_tcat_billing') },
    { value: 'account', label: t('page.help_tcat_account') },
    { value: 'technical', label: t('page.help_tcat_technical') },
    { value: 'content', label: t('page.help_tcat_content') },
    { value: 'payout', label: t('page.help_tcat_payout') },
    { value: 'other', label: t('page.help_tcat_other') },
  ];

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['my-support-tickets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const createTicket = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await db.from('support_tickets').insert({
        user_id: user.id,
        subject: subject.trim(),
        message: message.trim(),
        category,
        status: 'open',
        priority: 'normal',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t('page.help_submitted') });
      setView('tickets');
      setSubject('');
      setMessage('');
      qc.invalidateQueries({ queryKey: ['my-support-tickets'] });
    },
    onError: () => toast({ title: t('page.help_error'), variant: 'destructive' }),
  });

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      <SEOHead title={`${t('page.help')} — Siteviral`} description={t('page.help_desc')} />

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">{t('page.help')}</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t('page.help_desc')}</p>
        </div>
      </div>

      <PageTour pageId="help" steps={TOUR_STEPS} />

      {/* Tab-like navigation */}
      <div className="flex gap-2">
        <Button size="sm" variant={view === 'faq' ? 'default' : 'outline'} onClick={() => setView('faq')} className="gap-1.5">
          <HelpCircle className="h-3.5 w-3.5" /> {t('page.help_faq')}
        </Button>
        <Button size="sm" variant={view === 'tickets' || view === 'new-ticket' ? 'default' : 'outline'} onClick={() => setView('tickets')} className="gap-1.5">
          <MessageCircle className="h-3.5 w-3.5" /> {t('page.help_my_requests')}
          {tickets.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{tickets.length}</Badge>}
        </Button>
      </div>

      {/* FAQ View */}
      {view === 'faq' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <p className="text-sm text-muted-foreground">{t('page.help_faq_intro')}</p>

          {FAQS.map((section) => (
            <div key={section.category}>
              <h2 className="text-sm font-bold text-foreground mb-2">{section.category}</h2>
              <Accordion type="multiple" className="space-y-1.5">
                {section.items.map((faq, i) => (
                  <AccordionItem key={i} value={`${section.category}-${i}`} className="bg-card border border-border rounded-xl px-4 overflow-hidden">
                    <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-3">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-3">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}

          <div className="bg-card border border-border rounded-2xl p-5 text-center space-y-3">
            <h3 className="font-bold text-foreground text-sm">{t('page.help_not_found')}</h3>
            <p className="text-xs text-muted-foreground">{t('page.help_not_found_desc')}</p>
            <Button size="sm" onClick={() => setView('new-ticket')} className="gap-1.5">
              <Send className="h-3.5 w-3.5" /> {t('page.help_send_request')}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Ticket list */}
      {view === 'tickets' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t('page.help_your_requests')}</p>
            <Button size="sm" variant="outline" onClick={() => setView('new-ticket')} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> {t('page.help_new_request')}
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl skeleton-shimmer" />)}</div>
          ) : tickets.length === 0 ? (
            <EmptyState variant="generic" title={t('page.help_no_requests')} description={t('page.help_no_requests_desc')}
              action={{ label: t('page.help_send_request'), onClick: () => setView('new-ticket') }} />
          ) : (
            <div className="space-y-2">
              {tickets.map((t2: any) => (
                <div key={t2.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/20 transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t2.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(t2.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}{CATEGORIES.find(c => c.value === t2.category)?.label || t2.category}
                    </p>
                  </div>
                  <Badge className={`text-[10px] border-0 capitalize ${STATUS_COLORS[t2.status] || STATUS_COLORS.open}`}>
                    {t2.status?.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* New ticket form */}
      {view === 'new-ticket' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <button onClick={() => setView('tickets')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> {t('page.help_back')}
          </button>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-sm">{t('page.help_describe')}</h2>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('page.help_category')}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('page.help_subject')}</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder={t('page.help_subject_placeholder')} maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('page.help_message')}</Label>
              <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={t('page.help_message_placeholder')} rows={5} maxLength={2000} />
            </div>
            <Button onClick={() => createTicket.mutate()} disabled={!subject.trim() || !message.trim() || createTicket.isPending}
              className="w-full gap-1.5">
              <Send className="h-4 w-4" /> {t('page.help_submit')}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
