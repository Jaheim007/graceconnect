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
import { UserPlus, Mail, Download, Send, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        <TabsList className="mb-4">
          <TabsTrigger value="contacts" className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> Contacts
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Campagnes Email
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

        <TabsContent value="campaigns" className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-3">
            <Mail className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="font-semibold text-sm">Campagnes Email</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Envoyez des emails ciblés à vos contacts. Créez des campagnes segmentées par tags.
            </p>
            <p className="text-xs text-muted-foreground">🚧 Module disponible prochainement</p>
          </div>
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  );
}
