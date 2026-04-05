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
import {
  UserPlus, Mail, Download, Send, Trash2, Plus, Loader2, Heart, ShoppingBag,
  Search, Tag, Star, Filter, Users, MessageSquare, Megaphone, TrendingUp,
  ArrowUpRight, Calendar, DollarSign, Eye, EyeOff, MoreHorizontal, Globe,
  CheckSquare, UserCheck, Construction
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { callFn } from '@/lib/api';
import { downloadCSV } from '@/lib/csvExport';
import { useI18n } from '@/i18n/I18nContext';
import { formatCurrency } from '@/lib/currency';

const springIn = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 28, delay: i * 0.04 },
  }),
};

/** Mask email for GDPR: j***@gmail.com */
function maskEmail(email: string): string {
  if (!email) return '—';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local[0]}${'•'.repeat(Math.min(local.length - 1, 4))}@${domain}`;
}

export default function AdminCRM() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const qc = useQueryClient();
  const orgId = currentOrg?.id;
  const isFr = locale === 'fr';
  const currency = currentOrg?.currency || 'XOF';

  const [tab, setTab] = useState('contacts');
  const [showAddContact, setShowAddContact] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTags, setNewTags] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');

  // Contacts from contacts table
  const { data: rawContacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['crm-contacts', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('contacts').select('*')
        .eq('organization_id', orgId).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  // Members of the community (two-step: members then profiles)
  const { data: members = [] } = useQuery({
    queryKey: ['crm-members', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data: rows } = await db.from('organization_members')
        .select('user_id, role, joined_at')
        .eq('organization_id', orgId);
      if (!rows?.length) return [];
      const userIds = rows.map((r: any) => r.user_id);
      const { data: profiles } = await db.from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);
      const pMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { pMap[p.id] = p; });
      return rows.map((r: any) => ({ ...r, profiles: pMap[r.user_id] || null }));
    },
    enabled: !!orgId,
  });

  // Merge: contacts + members (deduplicate by name)
  const contacts = useMemo(() => {
    const contactEmails = new Set(rawContacts.map((c: any) => c.email?.toLowerCase()));
    const memberContacts = members
      .filter((m: any) => {
        // Exclude the org owner (current user) — they're not a "contact"
        if (m.user_id === user?.id) return false;
        const name = m.profiles?.display_name;
        return name && !contactEmails.has(name?.toLowerCase());
      })
      .map((m: any) => ({
        id: `member-${m.user_id}`,
        name: m.profiles?.display_name || null,
        email: null,
        phone: null,
        tags: ['member'],
        source: 'member',
        is_subscribed: true,
        created_at: m.joined_at,
        avatar_url: m.profiles?.avatar_url,
        _isMember: true,
      }));
    return [...rawContacts.map((c: any) => ({ ...c, _isMember: false })), ...memberContacts];
  }, [rawContacts, members]);

  // Add contact
  const addContact = useMutation({
    mutationFn: async () => {
      if (!orgId || !newEmail.trim()) throw new Error('Email requis');
      const tags = newTags.split(',').map(t => t.trim()).filter(Boolean);
      const { error } = await db.from('contacts').insert({
        organization_id: orgId,
        email: newEmail.trim().toLowerCase(),
        name: newName.trim() || null,
        phone: newPhone.trim() || null,
        tags,
        source: 'manual',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: `✅ ${t('crm.contact_added')}` });
      setNewEmail(''); setNewName(''); setNewPhone(''); setNewTags('');
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
    downloadCSV(
      contacts.map((c: any) => ({
        [t('crm.name')]: c.name || '',
        Email: c.email,
        Tags: (c.tags || []).join(';'),
        Source: c.source,
        Date: c.created_at?.slice(0, 10),
      })),
      `contacts-${currentOrg?.slug || 'org'}`
    );
    toast({ title: `📥 ${t('crm.export_csv')}` });
  };

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

  // Lead scoring
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
    if (score >= 15) return { label: 'Hot 🔥', className: 'bg-destructive/10 text-destructive border-destructive/20' };
    if (score >= 5) return { label: isFr ? 'Chaud' : 'Warm', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
    return null;
  };

  // Stats
  const totalContacts = contacts.length;
  const subscribedCount = contacts.filter((c: any) => c.is_subscribed).length;
  const taggedCount = contacts.filter((c: any) => (c.tags || []).length > 0).length;

  return (
    <AdminPageShell title={t('crm.title')} subtitle={`${contacts.length} ${t('crm.contacts').toLowerCase()}`} backRoute="/admin">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatMiniCard icon={Users} label={isFr ? 'Contacts' : 'Contacts'} value={totalContacts} color="text-primary bg-primary/10" />
        <StatMiniCard icon={Mail} label={isFr ? 'Abonnés' : 'Subscribed'} value={subscribedCount} color="text-emerald-500 bg-emerald-500/10" />
        <StatMiniCard icon={Tag} label={isFr ? 'Étiquetés' : 'Tagged'} value={taggedCount} color="text-violet-500 bg-violet-500/10" />
        <StatMiniCard icon={Globe} label={isFr ? 'Sources' : 'Sources'} value={allSources.length} color="text-amber-500 bg-amber-500/10" />
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v)}>
        <TabsList className="bg-muted/50 p-1 rounded-xl gap-1 mb-6 flex-wrap">
          <TabsTrigger value="contacts" className="gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all text-xs">
            <UserPlus className="h-3.5 w-3.5" /> {t('crm.contacts')}
          </TabsTrigger>
          <TabsTrigger value="donations" className="gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all text-xs">
            <Heart className="h-3.5 w-3.5" /> {t('crm.donors')}
          </TabsTrigger>
          <TabsTrigger value="purchases" className="gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all text-xs">
            <ShoppingBag className="h-3.5 w-3.5" /> {t('crm.purchases')}
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all text-xs">
            <Megaphone className="h-3.5 w-3.5" /> {t('crm.email_campaigns')}
          </TabsTrigger>
        </TabsList>

        {/* ─── CONTACTS ─── */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" className="gap-1.5 text-xs rounded-xl shadow-sm"
              onClick={() => setShowAddContact(true)}>
              <Plus className="h-3.5 w-3.5" /> {t('crm.add')}
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-xl" onClick={handleExportCSV}
              disabled={contacts.length === 0}>
              <Download className="h-3.5 w-3.5" /> {t('crm.export_csv')}
            </Button>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder={isFr ? 'Rechercher par nom ou email...' : 'Search by name or email...'}
                className="h-9 text-xs pl-9 rounded-xl bg-card border-border/50" />
            </div>
            {allTags.length > 0 && (
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="h-9 w-[130px] text-xs rounded-xl"><Tag className="h-3 w-3 mr-1" /><SelectValue placeholder="Tag" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isFr ? 'Tous tags' : 'All tags'}</SelectItem>
                  {allTags.map(tag => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {allSources.length > 1 && (
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="h-9 w-[130px] text-xs rounded-xl"><Filter className="h-3 w-3 mr-1" /><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isFr ? 'Toutes sources' : 'All sources'}</SelectItem>
                  {allSources.map(src => <SelectItem key={src} value={src}>{src}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {showAddContact && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="font-bold text-sm">{t('crm.new_contact')}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{t('crm.email')} *</Label>
                  <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@exemple.com" className="h-9 text-xs rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{t('crm.name')}</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Jean Dupont" className="h-9 text-xs rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{isFr ? 'Téléphone' : 'Phone'}</Label>
                  <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+225 07 00 00 00" className="h-9 text-xs rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{t('crm.tags_label')}</Label>
                  <Input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="vip, newsletter" className="h-9 text-xs rounded-xl" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="text-xs rounded-xl" onClick={() => addContact.mutate()} disabled={addContact.isPending}>
                  {addContact.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  {addContact.isPending ? (isFr ? 'Ajout...' : 'Adding...') : t('crm.add')}
                </Button>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowAddContact(false)}>{t('crm.cancel')}</Button>
              </div>
            </motion.div>
          )}

          {loadingContacts ? <SkeletonRow /> : filteredContacts.length === 0 ? (
            <EmptyState variant="generic" title={searchQuery || filterTag !== 'all' ? (isFr ? 'Aucun résultat' : 'No results') : t('crm.no_contacts')} description={t('crm.no_contacts_desc')} />
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground px-1">
                {filteredContacts.length} / {contacts.length} {t('crm.contacts').toLowerCase()}
              </p>
              {filteredContacts.map((c: any, i: number) => {
                const score = getLeadScore(c);
                const scoreBadge = getScoreBadge(score);
                return (
                  <motion.div key={c.id} custom={i} variants={springIn} initial="hidden" animate="visible"
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/40 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold text-primary shrink-0 overflow-hidden">
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (c.name || c.email || '?')[0].toUpperCase()
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                          {c.name || (isFr ? 'Contact' : 'Contact')}
                        </p>
                        {c._isMember && (
                          <Badge variant="outline" className="text-[9px] rounded-md bg-primary/10 text-primary border-primary/20">
                            {isFr ? 'Membre' : 'Member'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {c.email ? (
                          <p className="text-[11px] text-muted-foreground truncate">{maskEmail(c.email)}</p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic">{isFr ? 'Membre communauté' : 'Community member'}</p>
                        )}
                        {c.phone && <span className="text-[11px] text-muted-foreground">· {c.phone}</span>}
                      </div>
                    </div>
                    {/* Tags & Score */}
                    <div className="flex gap-1.5 flex-wrap items-center">
                      {scoreBadge && (
                        <Badge variant="outline" className={cn('text-[10px] gap-0.5 rounded-lg', scoreBadge.className)}>
                          <Star className="h-2.5 w-2.5" />{scoreBadge.label}
                        </Badge>
                      )}
                      {(c.tags || []).slice(0, 2).map((tg: string) => (
                        <Badge key={tg} variant="secondary" className="text-[10px] rounded-lg">{tg}</Badge>
                      ))}
                    </div>
                    <Badge variant="outline" className="text-[10px] rounded-lg shrink-0 capitalize">{c.source}</Badge>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── DONATIONS ─── */}
        <TabsContent value="donations" className="space-y-4">
          <DonationsSection orgId={orgId} orgSlug={currentOrg?.slug} currency={currency} />
        </TabsContent>

        {/* ─── PURCHASES ─── */}
        <TabsContent value="purchases" className="space-y-4">
          <PurchasesSection orgId={orgId} orgSlug={currentOrg?.slug} currency={currency} />
        </TabsContent>

        {/* ─── CAMPAIGNS ─── */}
        <TabsContent value="campaigns" className="space-y-4">
          <CampaignSection orgId={orgId} />
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  );
}

/* ═══════════ STAT MINI CARD ═══════════ */
function StatMiniCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/40">
      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xl font-extrabold tabular-nums">{value}</p>
        <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
      </div>
    </div>
  );
}

/* ═══════════ DONATIONS SECTION ═══════════ */
function DonationsSection({ orgId, orgSlug, currency }: { orgId: string | undefined; orgSlug?: string; currency: string }) {
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';
  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['crm-donations', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('donations')
        .select('id, amount, currency, donor_name, donor_email, status, created_at, completed_at, platform_fee, affiliate_commission, organization_amount, gateway')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  const completed = donations.filter((d: any) => d.status === 'completed');
  const totalAmount = completed.reduce((s: number, d: any) => s + (d.organization_amount || d.amount || 0), 0);

  const handleExport = () => {
    downloadCSV(
      donations.map((d: any) => ({
        Date: d.created_at?.slice(0, 10),
        [isFr ? 'Donateur' : 'Donor']: d.donor_name || (isFr ? 'Anonyme' : 'Anonymous'),
        [isFr ? 'Montant' : 'Amount']: d.amount,
        [isFr ? 'Reçu' : 'Received']: d.organization_amount || 0,
        [isFr ? 'Statut' : 'Status']: d.status,
      })),
      `donations-${orgSlug || 'org'}`
    );
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatMiniCard icon={Heart} label={isFr ? 'Dons complétés' : 'Completed'} value={completed.length} color="text-rose-500 bg-rose-500/10" />
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/40">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-emerald-500 bg-emerald-500/10">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-extrabold tabular-nums">{formatCurrency(totalAmount, currency, locale)}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{isFr ? 'Total net reçu' : 'Total net received'}</p>
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1 flex justify-end items-start">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-xl" onClick={handleExport} disabled={donations.length === 0}>
            <Download className="h-3.5 w-3.5" /> {t('crm.export_csv')}
          </Button>
        </div>
      </div>

      {isLoading ? <SkeletonRow /> : donations.length === 0 ? (
        <EmptyState variant="generic" title={t('crm.no_donors')} description={t('crm.no_donors_desc')} />
      ) : (
        <div className="space-y-2">
          {donations.map((d: any, i: number) => (
            <motion.div key={d.id} custom={i} variants={springIn} initial="hidden" animate="visible"
              className="group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/40 hover:border-rose-500/20 hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-300">
              {/* Icon */}
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-500/5 flex items-center justify-center shrink-0">
                <Heart className="h-5 w-5 text-rose-500" />
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate group-hover:text-rose-500 transition-colors">
                  {d.donor_name || d.donor_email?.split('@')[0] || (isFr ? 'Donateur' : 'Donor')}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                  {d.donor_email && <span>{maskEmail(d.donor_email)}</span>}
                  <span>·</span>
                  <Calendar className="h-3 w-3 inline" />
                  <span>{new Date(d.created_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}</span>
                  {d.gateway && <><span>·</span><span className="capitalize">{d.gateway}</span></>}
                </div>
              </div>
              {/* Amount */}
              <div className="text-right shrink-0">
                <p className={cn('text-base font-extrabold tabular-nums', d.status === 'completed' ? 'text-foreground' : 'text-muted-foreground')}>
                  {formatCurrency(d.amount, d.currency || currency, locale)}
                </p>
                {d.organization_amount != null && d.organization_amount !== d.amount && (
                  <p className="text-[10px] text-muted-foreground">
                    {isFr ? 'Net' : 'Net'}: {formatCurrency(d.organization_amount, d.currency || currency, locale)}
                  </p>
                )}
              </div>
              {/* Status */}
              <Badge variant="outline" className={cn(
                'text-[10px] border-0 rounded-lg font-bold',
                d.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
              )}>
                {d.status === 'completed' ? (isFr ? 'Complété' : 'Completed') : d.status}
              </Badge>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════ PURCHASES SECTION ═══════════ */
function PurchasesSection({ orgId, orgSlug, currency }: { orgId: string | undefined; orgSlug?: string; currency: string }) {
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';
  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['crm-purchases', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('product_purchases')
        .select('id, amount, currency, status, created_at, completed_at, platform_fee, affiliate_commission, organization_amount, discount_amount, product_id, buyer_name, buyer_email, gateway, digital_products(title, cover_image_url)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  const completed = purchases.filter((p: any) => p.status === 'completed');
  const totalAmount = completed.reduce((s: number, p: any) => s + (p.organization_amount || p.amount || 0), 0);
  const uniqueBuyers = new Set(purchases.map((p: any) => p.buyer_email || p.user_id)).size;

  const handleExport = () => {
    downloadCSV(
      purchases.map((p: any) => ({
        Date: p.created_at?.slice(0, 10),
        [isFr ? 'Produit' : 'Product']: (p.digital_products as any)?.title || '—',
        [isFr ? 'Acheteur' : 'Buyer']: p.buyer_name || '—',
        [isFr ? 'Montant' : 'Amount']: p.amount,
        [isFr ? 'Reçu' : 'Received']: p.organization_amount || 0,
        [isFr ? 'Statut' : 'Status']: p.status,
      })),
      `${isFr ? 'achats' : 'purchases'}-${orgSlug || 'org'}`
    );
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatMiniCard icon={ShoppingBag} label={isFr ? 'Achats' : 'Purchases'} value={completed.length} color="text-amber-500 bg-amber-500/10" />
        <StatMiniCard icon={Users} label={isFr ? 'Acheteurs' : 'Buyers'} value={uniqueBuyers} color="text-blue-500 bg-blue-500/10" />
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/40">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-emerald-500 bg-emerald-500/10">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-extrabold tabular-nums">{formatCurrency(totalAmount, currency, locale)}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{isFr ? 'Revenus nets' : 'Net revenue'}</p>
          </div>
        </div>
        <div className="flex justify-end items-start">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-xl" onClick={handleExport} disabled={purchases.length === 0}>
            <Download className="h-3.5 w-3.5" /> {t('crm.export_csv')}
          </Button>
        </div>
      </div>

      {isLoading ? <SkeletonRow /> : purchases.length === 0 ? (
        <EmptyState variant="generic" title={t('crm.no_purchases')} description={t('crm.no_purchases_desc')} />
      ) : (
        <div className="space-y-2">
          {purchases.map((p: any, i: number) => {
            const product = p.digital_products as any;
            return (
              <motion.div key={p.id} custom={i} variants={springIn} initial="hidden" animate="visible"
                className="group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/40 hover:border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
                {/* Product thumbnail */}
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center shrink-0 overflow-hidden">
                  {product?.cover_image_url ? (
                    <img src={product.cover_image_url} alt="" className="h-full w-full object-cover rounded-xl" />
                  ) : (
                    <ShoppingBag className="h-5 w-5 text-amber-500" />
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {product?.title || (isFr ? 'Produit' : 'Product')}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                    <span className="font-medium">{p.buyer_name || (isFr ? 'Acheteur' : 'Buyer')}</span>
                    {p.buyer_email && <><span>·</span><span>{maskEmail(p.buyer_email)}</span></>}
                    <span>·</span>
                    <Calendar className="h-3 w-3 inline" />
                    <span>{new Date(p.created_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}</span>
                    {p.gateway && <><span>·</span><span className="capitalize">{p.gateway}</span></>}
                  </div>
                </div>
                {/* Amount details */}
                <div className="text-right shrink-0">
                  <p className={cn('text-base font-extrabold tabular-nums', p.status === 'completed' ? 'text-foreground' : 'text-muted-foreground')}>
                    {formatCurrency(p.amount, p.currency || currency, locale)}
                  </p>
                  {p.organization_amount != null && p.organization_amount !== p.amount && (
                    <p className="text-[10px] text-muted-foreground">
                      {isFr ? 'Net' : 'Net'}: {formatCurrency(p.organization_amount, p.currency || currency, locale)}
                    </p>
                  )}
                  {p.discount_amount > 0 && (
                    <p className="text-[10px] text-rose-500">
                      -{formatCurrency(p.discount_amount, p.currency || currency, locale)}
                    </p>
                  )}
                </div>
                {/* Status */}
                <Badge variant="outline" className={cn(
                  'text-[10px] border-0 rounded-lg font-bold shrink-0',
                  p.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                )}>
                  {p.status === 'completed' ? (isFr ? 'Complété' : 'Completed') : p.status}
                </Badge>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════ CAMPAIGNS SECTION ═══════════ */
function CampaignSection({ orgId }: { orgId: string | undefined }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [campaignType, setCampaignType] = useState<'email' | 'sms'>('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [recipientMode, setRecipientMode] = useState<'all' | 'tags' | 'individual'>('all');
  const [selectedContact, setSelectedContact] = useState('');

  // Fetch contacts for recipient selection
  const { data: allContacts = [] } = useQuery({
    queryKey: ['crm-contacts-for-campaign', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('contacts').select('id, name, email, tags')
        .eq('organization_id', orgId).order('name', { ascending: true });
      return data || [];
    },
    enabled: !!orgId,
  });

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
      if (!orgId || !subject.trim() || !body.trim()) throw new Error(isFr ? 'Sujet et contenu requis' : 'Subject and content required');
      const recipientTags = recipientMode === 'tags' ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
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
      setSubject(''); setBody(''); setTags(''); setSelectedContact('');
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

  const sentCampaigns = campaigns.filter((c: any) => c.status === 'sent');
  const draftCampaigns = campaigns.filter((c: any) => c.status === 'draft');

  // All unique tags from contacts
  const contactTags = useMemo(() => {
    const tagSet = new Set<string>();
    allContacts.forEach((c: any) => (c.tags || []).forEach((t: string) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [allContacts]);

  return (
    <div className="space-y-5">
      {/* Coming soon banner */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
          <Construction className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
            {isFr ? 'Fonctionnalité en développement' : 'Feature in development'}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {isFr
              ? 'Les campagnes email et SMS seront bientôt entièrement fonctionnelles. Vous pouvez déjà préparer vos brouillons.'
              : 'Email and SMS campaigns will be fully functional soon. You can already prepare your drafts.'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatMiniCard icon={Megaphone} label={isFr ? 'Campagnes' : 'Campaigns'} value={campaigns.length} color="text-primary bg-primary/10" />
        <StatMiniCard icon={Send} label={isFr ? 'Envoyées' : 'Sent'} value={sentCampaigns.length} color="text-emerald-500 bg-emerald-500/10" />
        <StatMiniCard icon={Mail} label={isFr ? 'Brouillons' : 'Drafts'} value={draftCampaigns.length} color="text-muted-foreground bg-muted" />
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" className="gap-1.5 text-xs rounded-xl shadow-sm"
          onClick={() => setShowNew(true)}>
          <Plus className="h-3.5 w-3.5" /> {t('crm.new_campaign')}
        </Button>
      </div>

      {showNew && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="font-bold text-sm">{t('crm.new_email_campaign')}</h3>

          {/* Campaign type selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setCampaignType('email')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all',
                campaignType === 'email'
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/30'
              )}
            >
              <Mail className="h-4 w-4" /> Email
            </button>
            <button
              onClick={() => setCampaignType('sms')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all',
                campaignType === 'sms'
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/30'
              )}
            >
              <MessageSquare className="h-4 w-4" /> SMS
              <Badge variant="outline" className="text-[9px] ml-1 rounded-md">{isFr ? 'Bientôt' : 'Soon'}</Badge>
            </button>
          </div>

          {campaignType === 'sms' ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">{isFr ? 'Campagnes SMS bientôt disponibles' : 'SMS campaigns coming soon'}</p>
              <p className="text-xs mt-1 opacity-70">
                {isFr ? 'Envoyez des SMS personnalisés à vos contacts. Cette fonctionnalité arrive bientôt.' : 'Send personalized SMS to your contacts. This feature is coming soon.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Recipient selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">{isFr ? 'Destinataires' : 'Recipients'} *</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setRecipientMode('all')}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl text-[11px] font-semibold border transition-all',
                      recipientMode === 'all'
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-card border-border text-muted-foreground hover:border-primary/20'
                    )}
                  >
                    <Users className="h-5 w-5" />
                    {isFr ? 'Tous les contacts' : 'All contacts'}
                    <span className="text-[10px] opacity-60">({allContacts.length})</span>
                  </button>
                  <button
                    onClick={() => setRecipientMode('tags')}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl text-[11px] font-semibold border transition-all',
                      recipientMode === 'tags'
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-card border-border text-muted-foreground hover:border-primary/20'
                    )}
                  >
                    <Tag className="h-5 w-5" />
                    {isFr ? 'Par tag' : 'By tag'}
                  </button>
                  <button
                    onClick={() => setRecipientMode('individual')}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl text-[11px] font-semibold border transition-all',
                      recipientMode === 'individual'
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-card border-border text-muted-foreground hover:border-primary/20'
                    )}
                  >
                    <UserCheck className="h-5 w-5" />
                    {isFr ? 'Contact spécifique' : 'Specific contact'}
                  </button>
                </div>

                {recipientMode === 'tags' && (
                  <div className="space-y-1.5">
                    <Input value={tags} onChange={e => setTags(e.target.value)}
                      placeholder={isFr ? 'Tags (séparés par des virgules): vip, newsletter' : 'Tags (comma separated): vip, newsletter'}
                      className="h-9 text-xs rounded-xl" />
                    {contactTags.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {contactTags.map(tag => (
                          <button key={tag} onClick={() => setTags(prev => prev ? `${prev}, ${tag}` : tag)}
                            className="text-[10px] px-2 py-1 rounded-lg bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {recipientMode === 'individual' && (
                  <Select value={selectedContact} onValueChange={setSelectedContact}>
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue placeholder={isFr ? 'Sélectionner un contact...' : 'Select a contact...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {allContacts.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name || c.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('crm.subject')} *</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder={isFr ? 'Votre sujet...' : 'Your subject...'}
                  className="h-9 text-xs rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('crm.html_content')} *</Label>
                <Textarea value={body} onChange={e => setBody(e.target.value)}
                  placeholder="<h1>Hello {{name}}</h1>..."
                  rows={6} className="text-xs rounded-xl" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="text-xs rounded-xl" onClick={() => createCampaign.mutate()} disabled={createCampaign.isPending}>
                  {createCampaign.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  {createCampaign.isPending ? (isFr ? 'Création...' : 'Creating...') : t('crm.create_draft')}
                </Button>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowNew(false)}>{t('crm.cancel')}</Button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {isLoading ? <SkeletonRow /> : campaigns.length === 0 ? (
        <EmptyState variant="generic" title={t('crm.no_campaigns')} description={t('crm.no_campaigns_desc')} />
      ) : (
        <div className="space-y-2">
          {campaigns.map((c: any, i: number) => (
            <motion.div key={c.id} custom={i} variants={springIn} initial="hidden" animate="visible"
              className="group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/40 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              {/* Icon */}
              <div className={cn(
                'h-11 w-11 rounded-xl flex items-center justify-center shrink-0',
                c.status === 'sent' ? 'bg-emerald-500/10' : 'bg-muted'
              )}>
                {c.status === 'sent' ? <Send className="h-5 w-5 text-emerald-500" /> : <Mail className="h-5 w-5 text-muted-foreground" />}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{c.subject}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                  {c.status === 'sent' ? (
                    <>
                      <span>{isFr ? 'Envoyé le' : 'Sent on'} {new Date(c.sent_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}</span>
                      <span>·</span>
                      <span className="font-medium">{c.sent_count}/{c.recipient_count} {isFr ? 'envoyés' : 'sent'}</span>
                    </>
                  ) : (
                    <span>{isFr ? 'Brouillon' : 'Draft'} · {new Date(c.created_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}</span>
                  )}
                </div>
              </div>
              {/* Status badge */}
              <Badge variant="outline" className={cn(
                'text-[10px] border-0 rounded-lg font-bold',
                c.status === 'sent' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              )}>
                {c.status === 'sent' ? (isFr ? 'Envoyé' : 'Sent') : (isFr ? 'Brouillon' : 'Draft')}
              </Badge>
              {/* Send button */}
              {c.status === 'draft' && (
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 rounded-xl"
                  onClick={() => sendCampaign.mutate(c.id)} disabled={sendCampaign.isPending}>
                  {sendCampaign.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  {isFr ? 'Envoyer' : 'Send'}
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
