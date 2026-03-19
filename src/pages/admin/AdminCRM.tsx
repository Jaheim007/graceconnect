import { useState, useMemo } from 'react';
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
import { UserPlus, Mail, Download, Send, Trash2, Plus, Loader2, Heart, ShoppingBag, Search, Tag, Star, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { callFn } from '@/lib/api';
import { downloadCSV } from '@/lib/csvExport';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function AdminCRM() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const qc = useQueryClient();
  const orgId = currentOrg?.id;

  const [tab, setTab] = useState('contacts');
  const [showAddContact, setShowAddContact] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTags, setNewTags] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');

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
      toast({ title: `✅ ${t('crm.contact_added')}` });
      setNewEmail(''); setNewName(''); setNewTags('');
      setShowAddContact(false);
      qc.invalidateQueries({ queryKey: ['crm-contacts', orgId] });
    },
    onError: (e: any) => toast({ title: t('common.error'), description: e.message, variant: 'destructive' }),
  });

  // Delete contact
  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t('common.delete') });
      qc.invalidateQueries({ queryKey: ['crm-contacts', orgId] });
    },
  });

  // Export CSV
  const handleExportCSV = () => {
    if (contacts.length === 0) return;
    const headers = ['Email', t('crm.name'), 'Tags', 'Source', 'Date'];
    const rows = contacts.map((c: any) => [
      c.email, c.name || '', (c.tags || []).join(';'), c.source, c.created_at?.slice(0, 10),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `contacts-${currentOrg?.slug}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: `📥 ${t('crm.export_csv')}` });
  };

  // Auto-import members as contacts
  const importMembers = useMutation({
    mutationFn: async () => {
      if (!orgId) return;
      const { data: members } = await db
        .from('organization_members')
        .select('user_id, profiles(display_name)')
        .eq('organization_id', orgId);
      toast({ title: `${members?.length || 0} ${t('admin.members')}`, description: locale === 'fr' ? 'Ajoutez manuellement leurs emails pour le CRM.' : 'Manually add their emails for CRM.' });
    },
  });

  const dateFmt = locale === 'fr' ? 'fr-FR' : 'en-US';

  // Derived: all tags & sources for filters
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    contacts.forEach((c: any) => (c.tags || []).forEach((t: string) => tags.add(t)));
    return Array.from(tags).sort();
  }, [contacts]);

  const allSources = useMemo(() => {
    const sources = new Set<string>();
    contacts.forEach((c: any) => { if (c.source) sources.add(c.source); });
    return Array.from(sources).sort();
  }, [contacts]);

  // Lead scoring: contacts with purchases or donations get higher scores
  const { data: purchaseCounts = {} } = useQuery({
    queryKey: ['crm-lead-scores', orgId],
    queryFn: async () => {
      if (!orgId) return {};
      const [{ data: purchases }, { data: donations }] = await Promise.all([
        db.from('product_purchases').select('user_id').eq('organization_id', orgId).eq('status', 'completed'),
        db.from('donations').select('donor_email').eq('organization_id', orgId).eq('status', 'completed'),
      ]);
      const scores: Record<string, number> = {};
      (purchases || []).forEach((p: any) => { if (p.user_id) scores[p.user_id] = (scores[p.user_id] || 0) + 10; });
      (donations || []).forEach((d: any) => { if (d.donor_email) scores[d.donor_email] = (scores[d.donor_email] || 0) + 5; });
      return scores;
    },
    enabled: !!orgId,
  });

  // Filter & search contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c: any) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!(c.email?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q))) return false;
      }
      if (filterTag !== 'all' && !(c.tags || []).includes(filterTag)) return false;
      if (filterSource !== 'all' && c.source !== filterSource) return false;
      return true;
    });
  }, [contacts, searchQuery, filterTag, filterSource]);

  const getLeadScore = (contact: any): number => {
    return (purchaseCounts as any)[contact.email] || (purchaseCounts as any)[contact.user_id] || 0;
  };

  const getScoreBadge = (score: number) => {
    if (score >= 15) return { label: 'Hot', className: 'bg-destructive/10 text-destructive' };
    if (score >= 5) return { label: 'Warm', className: 'bg-amber-500/10 text-amber-600' };
    return null;
  };

  return (
    <AdminPageShell title={t('crm.title')} subtitle={`${contacts.length} ${t('crm.contacts').toLowerCase()}`} backRoute="/admin">
      <Tabs value={tab} onValueChange={v => setTab(v)}>
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="contacts" className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> {t('crm.contacts')}
          </TabsTrigger>
          <TabsTrigger value="donations" className="gap-1.5">
            <Heart className="h-3.5 w-3.5" /> {t('crm.donors')}
          </TabsTrigger>
          <TabsTrigger value="purchases" className="gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5" /> {t('crm.purchases')}
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5">
            <Mail className="h-3.5 w-3.5" /> {t('crm.email_campaigns')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" className="gap-1.5 text-xs bg-primary text-primary-foreground"
              onClick={() => setShowAddContact(true)}>
              <Plus className="h-3.5 w-3.5" /> {t('crm.add')}
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleExportCSV}
              disabled={contacts.length === 0}>
              <Download className="h-3.5 w-3.5" /> {t('crm.export_csv')}
            </Button>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder={locale === 'fr' ? 'Rechercher...' : 'Search...'}
                className="h-8 text-xs pl-8" />
            </div>
            {allTags.length > 0 && (
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="h-8 w-[120px] text-xs"><Tag className="h-3 w-3 mr-1" /><SelectValue placeholder="Tag" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{locale === 'fr' ? 'Tous tags' : 'All tags'}</SelectItem>
                  {allTags.map(tag => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {allSources.length > 1 && (
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="h-8 w-[120px] text-xs"><Filter className="h-3 w-3 mr-1" /><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{locale === 'fr' ? 'Toutes sources' : 'All sources'}</SelectItem>
                  {allSources.map(src => <SelectItem key={src} value={src}>{src}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {showAddContact && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible"
              className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-sm">{t('crm.new_contact')}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t('crm.email')} *</Label>
                  <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@exemple.com" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('crm.name')}</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Jean Dupont" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{locale === 'fr' ? 'Téléphone' : 'Phone'}</Label>
                  <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+225 07 00 00 00" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('crm.tags_label')}</Label>
                  <Input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="vip, newsletter" className="h-8 text-xs" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="text-xs" onClick={() => addContact.mutate()} disabled={addContact.isPending}>
                  {addContact.isPending ? t('crm.adding') : t('crm.add')}
                </Button>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowAddContact(false)}>{t('crm.cancel')}</Button>
              </div>
            </motion.div>
          )}

          {loadingContacts ? <SkeletonRow /> : filteredContacts.length === 0 ? (
            <EmptyState variant="generic" title={searchQuery || filterTag !== 'all' ? (locale === 'fr' ? 'Aucun résultat' : 'No results') : t('crm.no_contacts')} description={t('crm.no_contacts_desc')} />
          ) : (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              <p className="text-[10px] text-muted-foreground mb-1">
                {filteredContacts.length} / {contacts.length} {t('crm.contacts').toLowerCase()}
              </p>
              {filteredContacts.map((c: any) => {
                const score = getLeadScore(c);
                const scoreBadge = getScoreBadge(score);
                return (
                  <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-background/50 hover:bg-background transition-all group">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold">{(c.name || c.email)[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name || c.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    </div>
                    <div className="flex gap-1 flex-wrap items-center">
                      {scoreBadge && (
                        <Badge variant="outline" className={cn('text-[9px] border-0 gap-0.5', scoreBadge.className)}>
                          <Star className="h-2.5 w-2.5" />{scoreBadge.label}
                        </Badge>
                      )}
                      {(c.tags || []).slice(0, 2).map((tg: string) => (
                        <Badge key={tg} variant="secondary" className="text-[9px]">{tg}</Badge>
                      ))}
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{c.source}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                      onClick={() => deleteContact.mutate(c.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
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
  const { t, locale } = useI18n();
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
      if (!orgId || !subject.trim() || !body.trim()) throw new Error(locale === 'fr' ? 'Sujet et contenu requis' : 'Subject and content required');
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
      toast({ title: `✅ ${t('crm.campaign_created')}` });
      setSubject(''); setBody(''); setTags('');
      setShowNew(false);
      qc.invalidateQueries({ queryKey: ['crm-email-campaigns', orgId] });
    },
    onError: (e: any) => toast({ title: t('common.error'), description: e.message, variant: 'destructive' }),
  });

  const sendCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      return callFn('send-campaign', { campaign_id: campaignId }, true);
    },
    onSuccess: (data: any) => {
      toast({ title: `📧 ${data.sent || 0} emails ${t('crm.sent').toLowerCase()}` });
      qc.invalidateQueries({ queryKey: ['crm-email-campaigns', orgId] });
    },
    onError: (e: any) => toast({ title: t('common.error'), description: e.message, variant: 'destructive' }),
  });

  const dateFmt = locale === 'fr' ? 'fr-FR' : 'en-US';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" className="gap-1.5 text-xs bg-primary text-primary-foreground"
          onClick={() => setShowNew(true)}>
          <Plus className="h-3.5 w-3.5" /> {t('crm.new_campaign')}
        </Button>
      </div>

      {showNew && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible"
          className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold text-sm">{t('crm.new_email_campaign')}</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">{t('crm.subject')} *</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder={locale === 'fr' ? 'Votre sujet...' : 'Your subject...'} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('crm.html_content')} *</Label>
              <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="<h1>Hello {{name}}</h1>..." rows={5} className="text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('crm.recipient_tags')}</Label>
              <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="vip, newsletter" className="h-8 text-xs" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="text-xs" onClick={() => createCampaign.mutate()} disabled={createCampaign.isPending}>
              {createCampaign.isPending ? t('crm.creating') : t('crm.create_draft')}
            </Button>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowNew(false)}>{t('crm.cancel')}</Button>
          </div>
        </motion.div>
      )}

      {isLoading ? <SkeletonRow /> : campaigns.length === 0 ? (
        <EmptyState variant="generic" title={t('crm.no_campaigns')} description={t('crm.no_campaigns_desc')} />
      ) : (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          {campaigns.map((c: any) => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50 hover:bg-background transition-all group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {c.status === 'sent' ? `${t('crm.sent_on')} ${new Date(c.sent_at).toLocaleDateString(dateFmt)} · ${c.sent_count}/${c.recipient_count}` : t('crm.draft')}
                </p>
              </div>
              <Badge variant="outline" className={cn('text-[10px] border-0', c.status === 'sent' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>
                {c.status === 'sent' ? t('crm.sent') : t('crm.draft')}
              </Badge>
              {c.status === 'draft' && (
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" 
                  onClick={() => sendCampaign.mutate(c.id)} disabled={sendCampaign.isPending}>
                  {sendCampaign.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} {t('crm.send')}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { formatCurrency } from '@/lib/currency';
const fmt = (n: number, currency?: string | null) => formatCurrency(n, currency);

function DonationsSection({ orgId, orgSlug }: { orgId: string | undefined; orgSlug?: string }) {
  const { t, locale } = useI18n();
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
  const dateFmt = locale === 'fr' ? 'fr-FR' : 'en-US';

  const handleExport = () => {
    downloadCSV(
      donations.map((d: any) => ({
        Date: d.created_at?.slice(0, 10),
        [t('crm.donor')]: d.donor_name || t('crm.anonymous'),
        Email: d.donor_email || '',
        [locale === 'fr' ? 'Montant' : 'Amount']: d.amount,
        [locale === 'fr' ? 'Devise' : 'Currency']: d.currency || 'XOF',
        [locale === 'fr' ? 'Statut' : 'Status']: d.status,
        [locale === 'fr' ? 'Frais plateforme' : 'Platform fee']: d.platform_fee || 0,
        [locale === 'fr' ? 'Commission affilié' : 'Affiliate commission']: d.affiliate_commission || 0,
        [locale === 'fr' ? 'Reçu par org' : 'Received by org']: d.organization_amount || 0,
      })),
      `donations-${orgSlug || 'org'}`
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{completed.length} {completed.length > 1 ? t('crm.donation_plural') : t('crm.donation')} {t('crm.completed').toLowerCase()}</p>
          <p className="text-xs text-muted-foreground">{t('crm.total')} : {fmt(totalAmount, completed[0]?.currency)}</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleExport} disabled={donations.length === 0}>
          <Download className="h-3.5 w-3.5" /> {t('crm.export_csv')}
        </Button>
      </div>

      {isLoading ? <SkeletonRow /> : donations.length === 0 ? (
        <EmptyState variant="generic" title={t('crm.no_donors')} description={t('crm.no_donors_desc')} />
      ) : (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          {donations.map((d: any) => (
            <motion.div key={d.id} variants={fadeUp} initial="hidden" animate="visible"
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Heart className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.donor_name || t('crm.anonymous')}</p>
                <p className="text-xs text-muted-foreground">{d.donor_email || '—'} · {new Date(d.created_at).toLocaleDateString(dateFmt)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{fmt(d.amount, d.currency)}</p>
                <Badge variant="outline" className={cn('text-[10px] border-0', d.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>
                  {d.status === 'completed' ? t('crm.completed') : d.status}
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
  const { t, locale } = useI18n();
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
  const dateFmt = locale === 'fr' ? 'fr-FR' : 'en-US';

  const handleExport = () => {
    downloadCSV(
      purchases.map((p: any) => ({
        Date: p.created_at?.slice(0, 10),
        [t('crm.product')]: (p.digital_products as any)?.title || '—',
        [locale === 'fr' ? 'Montant' : 'Amount']: p.amount,
        [locale === 'fr' ? 'Devise' : 'Currency']: p.currency || 'XOF',
        [locale === 'fr' ? 'Statut' : 'Status']: p.status,
        [locale === 'fr' ? 'Remise' : 'Discount']: p.discount_amount || 0,
        [locale === 'fr' ? 'Frais plateforme' : 'Platform fee']: p.platform_fee || 0,
        [locale === 'fr' ? 'Commission affilié' : 'Affiliate commission']: p.affiliate_commission || 0,
        [locale === 'fr' ? 'Reçu par org' : 'Received by org']: p.organization_amount || 0,
      })),
      `${locale === 'fr' ? 'achats' : 'purchases'}-${orgSlug || 'org'}`
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{completed.length} {completed.length > 1 ? t('crm.purchase_plural') : t('crm.purchase')} {t('crm.completed').toLowerCase()}</p>
          <p className="text-xs text-muted-foreground">{t('crm.total')} : {fmt(totalAmount, completed[0]?.currency)}</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleExport} disabled={purchases.length === 0}>
          <Download className="h-3.5 w-3.5" /> {t('crm.export_csv')}
        </Button>
      </div>

      {isLoading ? <SkeletonRow /> : purchases.length === 0 ? (
        <EmptyState variant="generic" title={t('crm.no_purchases')} description={t('crm.no_purchases_desc')} />
      ) : (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          {purchases.map((p: any) => (
            <motion.div key={p.id} variants={fadeUp} initial="hidden" animate="visible"
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50">
              <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{(p.digital_products as any)?.title || t('crm.product')}</p>
                <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString(dateFmt)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{fmt(p.amount, p.currency)}</p>
                <Badge variant="outline" className={cn('text-[10px] border-0', p.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>
                  {p.status === 'completed' ? t('crm.completed') : p.status}
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
