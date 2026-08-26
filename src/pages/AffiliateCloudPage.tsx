import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity, ArrowRight, BarChart3, Check, Clipboard, Code2, ExternalLink,
  Globe2, KeyRound, Network, Plus, Settings2, Users2, Wallet,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

type Program = {
  id: string;
  name: string;
  slug: string;
  platform_url: string | null;
  currency: string;
  default_commission_percent: number;
  hold_days: number;
  payout_mode: string;
  is_active: boolean;
  wallet_balance: number;
};

type Conversion = {
  id: string;
  amount: number;
  commission_amount: number;
  currency: string;
  status: string;
  external_reference: string;
  created_at: string;
};

const SDK_URL = 'https://siteviral.com/affiliate.js';

export default function AffiliateCloudPage() {
  const { currentOrg, canManage } = useOrg();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({ name: '', platformUrl: '', currency: 'XOF', commission: '10' });
  const orgId = currentOrg?.id;
  const canManageCurrentOrg = orgId ? canManage(orgId) : false;

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['affiliate-cloud-programs', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('affiliate_programs')
        .select('id,name,slug,platform_url,currency,default_commission_percent,hold_days,payout_mode,is_active,wallet_balance')
        .eq('owner_org_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Program[];
    },
    enabled: !!orgId && canManageCurrentOrg,
  });

  const activeProgram = programs.find((program) => program.id === selectedId) ?? programs[0];

  const { data: conversions = [] } = useQuery({
    queryKey: ['affiliate-cloud-conversions', activeProgram?.id],
    queryFn: async () => {
      if (!activeProgram) return [];
      const { data, error } = await supabase
        .from('affiliate_conversions')
        .select('id,amount,commission_amount,currency,status,external_reference,created_at')
        .eq('program_id', activeProgram.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Conversion[];
    },
    enabled: !!activeProgram,
  });

  const { data: ambassadorCount = 0 } = useQuery({
    queryKey: ['affiliate-cloud-ambassadors', activeProgram?.id],
    queryFn: async () => {
      if (!activeProgram) return 0;
      const { count, error } = await supabase
        .from('affiliate_links')
        .select('id', { count: 'exact', head: true })
        .eq('program_id', activeProgram.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!activeProgram,
  });

  const totals = useMemo(() => conversions.reduce((acc, conversion) => ({
    sales: acc.sales + conversion.amount,
    commissions: acc.commissions + conversion.commission_amount,
  }), { sales: 0, commissions: 0 }), [conversions]);

  const createProgram = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('missing_workspace');
      const slugBase = form.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'programme';
      const slug = `${slugBase}-${crypto.randomUUID().slice(0, 5)}`;
      const { data, error } = await supabase.from('affiliate_programs').insert({
        owner_org_id: orgId,
        name: form.name.trim(),
        slug,
        platform_url: form.platformUrl.trim() || null,
        allowed_origins: form.platformUrl.trim() ? [form.platformUrl.trim()] : [],
        currency: form.currency,
        default_commission_percent: Math.min(100, Math.max(0, Number(form.commission) || 10)),
        payout_mode: 'reporting',
      }).select('id').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setSelectedId(data.id);
      setCreateOpen(false);
      setForm({ name: '', platformUrl: '', currency: 'XOF', commission: '10' });
      qc.invalidateQueries({ queryKey: ['affiliate-cloud-programs', orgId] });
      toast({ title: fr ? 'Programme créé' : 'Program created' });
    },
    onError: () => toast({
      title: fr ? 'Création impossible' : 'Could not create program',
      description: fr ? 'Vérifiez les informations et réessayez.' : 'Check the details and try again.',
      variant: 'destructive',
    }),
  });

  const copy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1800);
  };

  const money = (value: number) => new Intl.NumberFormat(fr ? 'fr-FR' : 'en-US', {
    style: 'currency', currency: activeProgram?.currency ?? 'XOF', maximumFractionDigits: 0,
  }).format(value);

  const snippet = activeProgram
    ? `<script src="${SDK_URL}" data-program="${activeProgram.slug}" async></script>`
    : '';

  if (!orgId || !canManageCurrentOrg) {
    return (
      <main className="container max-w-5xl px-4 py-8 sm:py-12">
        <div className="border bg-card p-6 sm:p-10 text-center rounded-lg">
          <Network className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">SiteViral Affiliate Cloud</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            {fr
              ? 'Créez d’abord un espace pour rattacher et sécuriser votre programme d’affiliation SaaS.'
              : 'Create a workspace first to own and secure your SaaS affiliate program.'}
          </p>
          <Button asChild className="mt-6"><Link to="/create-org">{fr ? 'Créer mon espace' : 'Create my workspace'}</Link></Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container max-w-7xl px-4 py-6 sm:py-8 space-y-6">
      <header className="border-b pb-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-3 gap-1.5"><Network className="h-3.5 w-3.5" /> Affiliate Cloud</Badge>
            <h1 className="text-3xl font-bold sm:text-4xl">{fr ? 'Affiliation pour votre SaaS' : 'Affiliation for your SaaS'}</h1>
            <p className="mt-2 text-muted-foreground">
              {fr
                ? 'Branchez SiteViral à votre application, suivez les recommandations et gérez les commissions de vos propres ambassadeurs.'
                : 'Connect SiteViral to your app, track referrals, and manage commissions for your own ambassadors.'}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" asChild><Link to="/gagner">{fr ? 'Gagner avec SiteViral' : 'Earn with SiteViral'}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />{fr ? 'Nouveau programme' : 'New program'}</Button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : programs.length === 0 ? (
        <section className="border border-dashed p-7 sm:p-10 rounded-lg">
          <div className="max-w-2xl">
            <Globe2 className="h-9 w-9 text-primary" />
            <h2 className="mt-4 text-xl font-bold">{fr ? 'Lancez votre premier programme' : 'Launch your first program'}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {fr ? 'Ajoutez votre SaaS, choisissez la commission, puis installez le script de suivi et votre clé API.' : 'Add your SaaS, choose the commission, then install the tracking script and your API key.'}
            </p>
            <Button className="mt-5" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />{fr ? 'Créer un programme' : 'Create a program'}</Button>
          </div>
        </section>
      ) : activeProgram ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">{fr ? 'Programme actif' : 'Active program'}</p>
              <Select value={activeProgram.id} onValueChange={setSelectedId}>
                <SelectTrigger className="mt-1 w-full sm:w-72"><SelectValue /></SelectTrigger>
                <SelectContent>{programs.map((program) => <SelectItem key={program.id} value={program.id}>{program.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={activeProgram.is_active ? 'default' : 'secondary'}>{activeProgram.is_active ? (fr ? 'Actif' : 'Active') : (fr ? 'En pause' : 'Paused')}</Badge>
              {activeProgram.platform_url && <Button variant="outline" size="sm" asChild><a href={activeProgram.platform_url} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />{fr ? 'Voir le SaaS' : 'View SaaS'}</a></Button>}
            </div>
          </div>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: BarChart3, label: fr ? 'Ventes attribuées' : 'Attributed sales', value: money(totals.sales) },
              { icon: Wallet, label: fr ? 'Commissions' : 'Commissions', value: money(totals.commissions) },
              { icon: Users2, label: fr ? 'Ambassadeurs' : 'Ambassadors', value: ambassadorCount.toLocaleString() },
              { icon: Activity, label: fr ? 'Conversions' : 'Conversions', value: conversions.length.toLocaleString() },
            ].map((stat) => (
              <Card key={stat.label}><CardContent className="p-5"><stat.icon className="h-5 w-5 text-primary" /><p className="mt-4 text-2xl font-bold">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></CardContent></Card>
            ))}
          </section>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">{fr ? 'Activité' : 'Activity'}</TabsTrigger>
              <TabsTrigger value="install">{fr ? 'Installation' : 'Installation'}</TabsTrigger>
              <TabsTrigger value="settings">{fr ? 'Configuration' : 'Settings'}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader><CardTitle className="text-base">{fr ? 'Dernières conversions' : 'Recent conversions'}</CardTitle></CardHeader>
                <CardContent>
                  {conversions.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{fr ? 'Aucune conversion reçue pour le moment.' : 'No conversions received yet.'}</p> : (
                    <div className="divide-y">
                      {conversions.slice(0, 12).map((conversion) => (
                        <div key={conversion.id} className="grid grid-cols-[1fr_auto] gap-3 py-3 text-sm sm:grid-cols-[1fr_140px_140px]">
                          <div className="min-w-0"><p className="truncate font-medium">{conversion.external_reference}</p><p className="text-xs text-muted-foreground">{new Date(conversion.created_at).toLocaleDateString(fr ? 'fr-FR' : 'en-US')}</p></div>
                          <p className="hidden text-right sm:block">{money(conversion.amount)}</p>
                          <div className="text-right"><p className="font-semibold text-primary">{money(conversion.commission_amount)}</p><p className="text-xs capitalize text-muted-foreground">{conversion.status}</p></div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="install" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Code2 className="h-4 w-4" />{fr ? '1. Suivi des clics' : '1. Click tracking'}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{fr ? 'Collez ce script avant la fermeture de la balise body de votre SaaS.' : 'Paste this script before your SaaS closing body tag.'}</p>
                  <div className="flex items-start gap-2 rounded-md bg-muted p-3"><code className="min-w-0 flex-1 break-all text-xs">{snippet}</code><Button size="icon" variant="ghost" onClick={() => copy(snippet, 'sdk')} aria-label={fr ? 'Copier le script' : 'Copy script'}>{copied === 'sdk' ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}</Button></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><KeyRound className="h-4 w-4" />{fr ? '2. Envoyer les conversions' : '2. Send conversions'}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{fr ? 'Créez une clé avec accès lecture + écriture, puis envoyez les ventes depuis votre serveur.' : 'Create a read + write key, then send sales from your server.'}</p>
                  <Button asChild><Link to="/admin/api-keys">{fr ? 'Gérer mes clés API' : 'Manage API keys'}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                  <div className="rounded-md border p-3 text-xs text-muted-foreground">
                    <p className="font-mono text-foreground">POST /functions/v1/affiliate-api/v1/conversions</p>
                    <p className="mt-2">program_id: {activeProgram.id}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Settings2 className="h-4 w-4" />{fr ? 'Règles du programme' : 'Program rules'}</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div><p className="text-xs text-muted-foreground">{fr ? 'Commission par défaut' : 'Default commission'}</p><p className="mt-1 font-semibold">{activeProgram.default_commission_percent}%</p></div>
                  <div><p className="text-xs text-muted-foreground">{fr ? 'Délai de validation' : 'Validation delay'}</p><p className="mt-1 font-semibold">{activeProgram.hold_days} {fr ? 'jours' : 'days'}</p></div>
                  <div><p className="text-xs text-muted-foreground">{fr ? 'Mode de paiement' : 'Payout mode'}</p><p className="mt-1 font-semibold capitalize">{activeProgram.payout_mode}</p></div>
                  <div><p className="text-xs text-muted-foreground">{fr ? 'Devise' : 'Currency'}</p><p className="mt-1 font-semibold">{activeProgram.currency}</p></div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{fr ? 'Créer un programme SaaS' : 'Create a SaaS program'}</DialogTitle>
            <DialogDescription>{fr ? 'Ce programme est indépendant de “Gagner”, qui reste réservé au programme ambassadeur SiteViral.' : 'This program is separate from “Earn”, which remains SiteViral’s ambassador program.'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2"><Label htmlFor="program-name">{fr ? 'Nom du programme' : 'Program name'}</Label><Input id="program-name" value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} placeholder="Noctely Partners" /></div>
            <div className="space-y-2"><Label htmlFor="platform-url">{fr ? 'URL de votre SaaS' : 'Your SaaS URL'}</Label><Input id="platform-url" type="url" value={form.platformUrl} onChange={(event) => setForm((value) => ({ ...value, platformUrl: event.target.value }))} placeholder="https://app.example.com" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>{fr ? 'Devise' : 'Currency'}</Label><Select value={form.currency} onValueChange={(currency) => setForm((value) => ({ ...value, currency }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="XOF">XOF</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="commission">{fr ? 'Commission (%)' : 'Commission (%)'}</Label><Input id="commission" type="number" min="0" max="100" value={form.commission} onChange={(event) => setForm((value) => ({ ...value, commission: event.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>{fr ? 'Annuler' : 'Cancel'}</Button><Button disabled={!form.name.trim() || createProgram.isPending} onClick={() => createProgram.mutate()}>{createProgram.isPending ? (fr ? 'Création…' : 'Creating…') : (fr ? 'Créer le programme' : 'Create program')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}