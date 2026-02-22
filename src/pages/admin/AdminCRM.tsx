import { useState } from 'react';
import { AdminPageShell } from './AdminPageShell';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Download, Send, Trash2, Plus, Loader2, Heart, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { callFn } from '@/lib/api';
import { downloadCSV } from '@/lib/csvExport';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function AdminCRM() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const orgId = currentOrg?.id;

  const [tab, setTab] = useState('contacts');
  const [showAddContact, setShowAddContact] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newTags, setNewTags] = useState('');

  // Contacts
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['crm-contacts', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('contacts').select('*')
        .eq('organization_id', orgId).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  // Email campaigns
  const { data: emailCampaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ['crm-email-campaigns', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('email_campaigns').select('*')
        .eq('organization_id', orgId).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  // Add contact
  const addContact = useMutation({
    mutationFn: async () => {
      if (!orgId || !newEmail.trim()) throw new Error('Email requis');
      const tags = newTags.split(',').map(t => t.trim()).filter(Boolean);
      const { error } = await db.from('contacts').insert({
        organization_id: orgId,
        email: newEmail.trim().toLowerCase(),
        name: newName.trim() || null,
        tags,
        source: 'manual',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: '✅ Contact ajouté' });
      setNewEmail(''); setNewName(''); setNewTags('');
      setShowAddContact(false);
      qc.invalidateQueries({ queryKey: ['crm-contacts', orgId] });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  // Delete contact
  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Contact supprimé' });
      qc.invalidateQueries({ queryKey: ['crm-contacts', orgId] });
    },
  });

  // Export CSV
  const handleExportCSV = () => {
    if (contacts.length === 0) return;
    const headers = ['Email', 'Nom', 'Tags', 'Source', 'Date'];
    const rows = contacts.map((c: any) => [
      c.email, c.name || '', (c.tags || []).join(';'), c.source, c.created_at?.slice(0, 10),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `contacts-${currentOrg?.slug}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: '📥 Export CSV téléchargé' });
  };

  // Auto-import members as contacts
  const importMembers = useMutation({
    mutationFn: async () => {
      if (!orgId) return;
      const { data: members } = await db
        .from('organization_members')
        .select('user_id, profiles(display_name)')
        .eq('organization_id', orgId);
      // For each member with an email in auth, we'd need to get from profiles
      // For now, import display names
      const existing = new Set(contacts.map((c: any) => c.email));
      let imported = 0;
      // We can't access auth.users, so just add a toast explaining
      toast({ title: `${members?.length || 0} membres trouvés`, description: 'Ajoutez manuellement leurs emails pour le CRM.' });
    },
  });

  return (
    <AdminPageShell title="CRM Communautaire" subtitle={`${contacts.length} contacts`} backRoute="/admin">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="contacts" className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> Contacts
          </TabsTrigger>
          <TabsTrigger value="donations" className="gap-1.5">
            <Heart className="h-3.5 w-3.5" /> Donateurs
          </TabsTrigger>
          <TabsTrigger value="purchases" className="gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5" /> Achats
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Campagnes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          {/* Actions bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" className="gap-1.5 text-xs gold-gradient text-primary-foreground border-0 shadow-gold"
              onClick={() => setShowAddContact(true)}>
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleExportCSV}
              disabled={contacts.length === 0}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>

          {/* Add contact form */}
          {showAddContact && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible"
              className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-sm">Nouveau contact</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Email *</Label>
                  <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@exemple.com" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nom</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Jean Dupont" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tags (séparés par virgule)</Label>
                  <Input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="vip, newsletter" className="h-8 text-xs" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="text-xs" onClick={() => addContact.mutate()} disabled={addContact.isPending}>
                  {addContact.isPending ? 'Ajout...' : 'Ajouter'}
                </Button>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowAddContact(false)}>Annuler</Button>
              </div>
            </motion.div>
          )}

          {/* Contacts list */}
          {loadingContacts ? <SkeletonRow /> : contacts.length === 0 ? (
            <EmptyState variant="generic" title="Aucun contact" description="Ajoutez des contacts pour gérer votre communauté." />
          ) : (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              {contacts.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-background/50 hover:bg-background transition-all group">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold">{(c.name || c.email)[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name || c.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {(c.tags || []).slice(0, 2).map((t: string) => (
                      <Badge key={t} variant="secondary" className="text-[9px]">{t}</Badge>
                    ))}
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{c.source}</Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                    onClick={() => deleteContact.mutate(c.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="donations" className="space-y-4">
          <DonationsSection orgId={orgId} orgSlug={currentOrg?.slug} />
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          <PurchasesSection orgId={orgId} orgSlug={currentOrg?.slug} />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <CampaignSection orgId={orgId} />
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  );
}

function CampaignSection({ orgId }: { orgId: string | undefined }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['crm-email-campaigns', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('email_campaigns').select('*')
        .eq('organization_id', orgId).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  const createCampaign = useMutation({
    mutationFn: async () => {
      if (!orgId || !subject.trim() || !body.trim()) throw new Error('Sujet et contenu requis');
      const recipientTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      const { error } = await db.from('email_campaigns').insert({
        organization_id: orgId,
        created_by: user?.id,
        subject: subject.trim(),
        body: body.trim(),
        recipient_tags: recipientTags,
        status: 'draft',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: '✅ Campagne créée' });
      setSubject(''); setBody(''); setTags('');
      setShowNew(false);
      qc.invalidateQueries({ queryKey: ['crm-email-campaigns', orgId] });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const sendCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      return callFn('send-campaign', { campaign_id: campaignId }, true);
    },
    onSuccess: (data: any) => {
      toast({ title: `📧 ${data.sent || 0} emails envoyés` });
      qc.invalidateQueries({ queryKey: ['crm-email-campaigns', orgId] });
    },
    onError: (e: any) => toast({ title: 'Erreur envoi', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" className="gap-1.5 text-xs gold-gradient text-primary-foreground border-0 shadow-gold"
          onClick={() => setShowNew(true)}>
          <Plus className="h-3.5 w-3.5" /> Nouvelle campagne
        </Button>
      </div>

      {showNew && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible"
          className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold text-sm">Nouvelle campagne email</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Sujet *</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Votre sujet..." className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Contenu HTML *</Label>
              <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="<h1>Bonjour {{name}}</h1>..." rows={5} className="text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tags destinataires (optionnel, séparés par virgule)</Label>
              <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="vip, newsletter" className="h-8 text-xs" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="text-xs" onClick={() => createCampaign.mutate()} disabled={createCampaign.isPending}>
              {createCampaign.isPending ? 'Création...' : 'Créer brouillon'}
            </Button>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowNew(false)}>Annuler</Button>
          </div>
        </motion.div>
      )}

      {isLoading ? <SkeletonRow /> : campaigns.length === 0 ? (
        <EmptyState variant="generic" title="Aucune campagne" description="Créez votre première campagne email." />
      ) : (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          {campaigns.map((c: any) => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50 hover:bg-background transition-all group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {c.status === 'sent' ? `Envoyé le ${new Date(c.sent_at).toLocaleDateString('fr-FR')} · ${c.sent_count}/${c.recipient_count}` : 'Brouillon'}
                </p>
              </div>
              <Badge variant="outline" className={cn('text-[10px] border-0', c.status === 'sent' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>
                {c.status === 'sent' ? 'Envoyé' : 'Brouillon'}
              </Badge>
              {c.status === 'draft' && (
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" 
                  onClick={() => sendCampaign.mutate(c.id)} disabled={sendCampaign.isPending}>
                  {sendCampaign.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Envoyer
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

function DonationsSection({ orgId, orgSlug }: { orgId: string | undefined; orgSlug?: string }) {
  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['crm-donations', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('donations')
        .select('id, amount, currency, donor_name, donor_email, status, created_at, completed_at, platform_fee, affiliate_commission, organization_amount')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  const completed = donations.filter((d: any) => d.status === 'completed');
  const totalAmount = completed.reduce((s: number, d: any) => s + (d.amount || 0), 0);

  const handleExport = () => {
    downloadCSV(
      donations.map((d: any) => ({
        Date: d.created_at?.slice(0, 10),
        Donateur: d.donor_name || 'Anonyme',
        Email: d.donor_email || '',
        Montant: d.amount,
        Devise: d.currency || 'XOF',
        Statut: d.status,
        'Frais plateforme': d.platform_fee || 0,
        'Commission affilié': d.affiliate_commission || 0,
        'Reçu par org': d.organization_amount || 0,
      })),
      `donations-${orgSlug || 'org'}`
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{completed.length} don{completed.length > 1 ? 's' : ''} complété{completed.length > 1 ? 's' : ''}</p>
          <p className="text-xs text-muted-foreground">Total : {fmt(totalAmount)} XOF</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleExport} disabled={donations.length === 0}>
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      {isLoading ? <SkeletonRow /> : donations.length === 0 ? (
        <EmptyState variant="generic" title="Aucun don" description="Les dons reçus apparaîtront ici." />
      ) : (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          {donations.map((d: any) => (
            <motion.div key={d.id} variants={fadeUp} initial="hidden" animate="visible"
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Heart className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.donor_name || 'Anonyme'}</p>
                <p className="text-xs text-muted-foreground">{d.donor_email || '—'} · {new Date(d.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{fmt(d.amount)} {d.currency || 'XOF'}</p>
                <Badge variant="outline" className={cn('text-[10px] border-0', d.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>
                  {d.status === 'completed' ? 'Complété' : d.status}
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function PurchasesSection({ orgId, orgSlug }: { orgId: string | undefined; orgSlug?: string }) {
  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['crm-purchases', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('product_purchases')
        .select('id, amount, currency, status, created_at, completed_at, platform_fee, affiliate_commission, organization_amount, discount_amount, product_id, digital_products(title)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  const completed = purchases.filter((p: any) => p.status === 'completed');
  const totalAmount = completed.reduce((s: number, p: any) => s + (p.amount || 0), 0);

  const handleExport = () => {
    downloadCSV(
      purchases.map((p: any) => ({
        Date: p.created_at?.slice(0, 10),
        Produit: (p.digital_products as any)?.title || '—',
        Montant: p.amount,
        Devise: p.currency || 'XOF',
        Statut: p.status,
        Remise: p.discount_amount || 0,
        'Frais plateforme': p.platform_fee || 0,
        'Commission affilié': p.affiliate_commission || 0,
        'Reçu par org': p.organization_amount || 0,
      })),
      `achats-${orgSlug || 'org'}`
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{completed.length} achat{completed.length > 1 ? 's' : ''} complété{completed.length > 1 ? 's' : ''}</p>
          <p className="text-xs text-muted-foreground">Total : {fmt(totalAmount)} XOF</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleExport} disabled={purchases.length === 0}>
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      {isLoading ? <SkeletonRow /> : purchases.length === 0 ? (
        <EmptyState variant="generic" title="Aucun achat" description="Les achats apparaîtront ici." />
      ) : (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          {purchases.map((p: any) => (
            <motion.div key={p.id} variants={fadeUp} initial="hidden" animate="visible"
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50">
              <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{(p.digital_products as any)?.title || 'Produit'}</p>
                <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{fmt(p.amount)} {p.currency || 'XOF'}</p>
                <Badge variant="outline" className={cn('text-[10px] border-0', p.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>
                  {p.status === 'completed' ? 'Complété' : p.status}
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
