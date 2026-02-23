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
import { HelpCircle, Plus, ArrowLeft, Send, Clock, MessageCircle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';

const FAQS = [
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

const CATEGORIES = [
  { value: 'billing', label: 'Paiements & Facturation' },
  { value: 'account', label: 'Compte & Connexion' },
  { value: 'technical', label: 'Problème technique' },
  { value: 'content', label: 'Contenu & Produits' },
  { value: 'payout', label: 'Retraits & KYC' },
  { value: 'other', label: 'Autre' },
];

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-500/15 text-amber-600',
  in_progress: 'bg-blue-500/15 text-blue-600',
  resolved: 'bg-emerald-500/15 text-emerald-600',
  closed: 'bg-muted text-muted-foreground',
};

type View = 'faq' | 'tickets' | 'new-ticket';

export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [view, setView] = useState<View>('faq');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('technical');

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
      toast({ title: 'Demande envoyée ✅' });
      setView('tickets');
      setSubject('');
      setMessage('');
      qc.invalidateQueries({ queryKey: ['my-support-tickets'] });
    },
    onError: () => toast({ title: 'Erreur lors de la création', variant: 'destructive' }),
  });

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      <SEOHead title="Aide — Siteviral" description="Centre d'aide Siteviral. Trouvez des réponses ou contactez-nous." />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Aide</h1>
        </div>
      </div>

      {/* Tab-like navigation */}
      <div className="flex gap-2">
        <Button size="sm" variant={view === 'faq' ? 'default' : 'outline'} onClick={() => setView('faq')} className="gap-1.5">
          <HelpCircle className="h-3.5 w-3.5" /> FAQ
        </Button>
        <Button size="sm" variant={view === 'tickets' || view === 'new-ticket' ? 'default' : 'outline'} onClick={() => setView('tickets')} className="gap-1.5">
          <MessageCircle className="h-3.5 w-3.5" /> Mes demandes
          {tickets.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{tickets.length}</Badge>}
        </Button>
      </div>

      {/* FAQ View */}
      {view === 'faq' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <p className="text-sm text-muted-foreground">Trouvez rapidement des réponses aux questions les plus courantes.</p>

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
            <h3 className="font-bold text-foreground text-sm">Vous n'avez pas trouvé votre réponse ?</h3>
            <p className="text-xs text-muted-foreground">Décrivez votre situation et notre équipe vous répondra rapidement.</p>
            <Button size="sm" onClick={() => setView('new-ticket')} className="gap-1.5">
              <Send className="h-3.5 w-3.5" /> Envoyer une demande
            </Button>
          </div>
        </motion.div>
      )}

      {/* Ticket list */}
      {view === 'tickets' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Vos demandes d'aide précédentes.</p>
            <Button size="sm" variant="outline" onClick={() => setView('new-ticket')} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Nouvelle demande
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl skeleton-shimmer" />)}</div>
          ) : tickets.length === 0 ? (
            <EmptyState variant="generic" title="Aucune demande" description="Vous n'avez pas encore envoyé de demande d'aide."
              action={{ label: 'Envoyer une demande', onClick: () => setView('new-ticket') }} />
          ) : (
            <div className="space-y-2">
              {tickets.map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/20 transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(t.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}{CATEGORIES.find(c => c.value === t.category)?.label || t.category}
                    </p>
                  </div>
                  <Badge className={`text-[10px] border-0 capitalize ${STATUS_COLORS[t.status] || STATUS_COLORS.open}`}>
                    {t.status?.replace('_', ' ')}
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
            <ArrowLeft className="h-3.5 w-3.5" /> Retour
          </button>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-sm">Décrivez votre problème</h2>
            <div className="space-y-1.5">
              <Label className="text-xs">Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sujet</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Résumé de votre problème" maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Message</Label>
              <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Décrivez votre situation en détail..." rows={5} maxLength={2000} />
            </div>
            <Button onClick={() => createTicket.mutate()} disabled={!subject.trim() || !message.trim() || createTicket.isPending}
              className="w-full gap-1.5">
              <Send className="h-4 w-4" /> Envoyer
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
