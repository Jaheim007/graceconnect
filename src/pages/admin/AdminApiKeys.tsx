import { useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { listOrgApiKeys, createOrgApiKey, revokeOrgApiKey } from '@/lib/api-keys/apiKeys.functions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Key, Plus, Trash2, Copy, Check, AlertTriangle, Code2 } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export default function AdminApiKeys() {
  const { currentOrg } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { toast } = useToast();
  const qc = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>(['read']);
  const [newKeyDialog, setNewKeyDialog] = useState<{ raw: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const orgId = currentOrg?.id;
  const fetchKeys = useServerFn(listOrgApiKeys);
  const createKeyFn = useServerFn(createOrgApiKey);
  const revokeKeyFn = useServerFn(revokeOrgApiKey);

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['api-keys', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await fetchKeys({ data: { org_id: orgId } });
      return (res.keys ?? []) as ApiKey[];
    },
    enabled: !!orgId,
  });

  const createKey = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('no_org');
      return await createKeyFn({ data: { org_id: orgId, name, scopes } }) as { key: ApiKey; raw_key: string };
    },
    onSuccess: (res) => {
      setCreateOpen(false);
      setName('');
      setScopes(['read']);
      setNewKeyDialog({ raw: res.raw_key });
      qc.invalidateQueries({ queryKey: ['api-keys', orgId] });
    },
    onError: (e: Error) => {
      toast({
        title: isFr ? 'Erreur' : 'Error',
        description: e.message,
        variant: 'destructive',
      });
    },
  });

  const revokeKey = useMutation({
    mutationFn: async (keyId: string) => {
      if (!orgId) throw new Error('no_org');
      return await revokeKeyFn({ data: { org_id: orgId, key_id: keyId } });
    },
    onSuccess: () => {
      toast({ title: isFr ? 'Clé révoquée' : 'Key revoked' });
      qc.invalidateQueries({ queryKey: ['api-keys', orgId] });
    },
  });

  const toggleScope = (scope: string) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const copyKey = async (raw: string) => {
    await navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Key className="h-7 w-7" />
            {isFr ? 'Clés API' : 'API Keys'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isFr
              ? 'Connectez vos outils à SiteViral via notre API REST publique.'
              : 'Connect your tools to SiteViral via our public REST API.'}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {isFr ? 'Nouvelle clé' : 'New key'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Code2 className="h-4 w-4" />
            {isFr ? 'Documentation rapide' : 'Quick docs'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            {isFr ? 'Endpoint de base :' : 'Base endpoint:'}
          </p>
          <code className="block bg-muted p-3 rounded font-mono text-xs break-all">
            {import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-api/v1/...
          </code>
          <p className="text-muted-foreground">
            {isFr ? 'En-tête d\'authentification :' : 'Authentication header:'}
          </p>
          <code className="block bg-muted p-3 rounded font-mono text-xs">
            Authorization: Bearer sv_live_xxxxxxxxxxxx
          </code>
          <p className="text-muted-foreground pt-2">
            {isFr ? 'Routes disponibles :' : 'Available routes:'}
          </p>
          <ul className="text-xs font-mono space-y-1 pl-4">
            <li>GET /v1/products</li>
            <li>GET /v1/products/:id</li>
            <li>GET /v1/orders?limit=50</li>
            <li>GET /v1/analytics/summary</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isFr ? 'Vos clés' : 'Your keys'}</CardTitle>
          <CardDescription>
            {isFr
              ? 'La clé secrète n\'est affichée qu\'une seule fois lors de la création.'
              : 'The secret key is shown only once at creation time.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{isFr ? 'Chargement…' : 'Loading…'}</p>
          ) : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {isFr
                ? 'Aucune clé API. Créez-en une pour démarrer.'
                : 'No API keys yet. Create one to get started.'}
            </p>
          ) : (
            <div className="space-y-3">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-lg border"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{k.name}</p>
                      {k.revoked_at && (
                        <Badge variant="destructive" className="text-xs">
                          {isFr ? 'Révoquée' : 'Revoked'}
                        </Badge>
                      )}
                      {k.scopes.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {k.key_prefix}…
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isFr ? 'Dernière utilisation : ' : 'Last used: '}
                      {k.last_used_at
                        ? new Date(k.last_used_at).toLocaleString(isFr ? 'fr-FR' : 'en-US')
                        : isFr ? 'jamais' : 'never'}
                    </p>
                  </div>
                  {!k.revoked_at && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => revokeKey.mutate(k.id)}
                      disabled={revokeKey.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isFr ? 'Nouvelle clé API' : 'New API key'}</DialogTitle>
            <DialogDescription>
              {isFr
                ? 'Donnez un nom descriptif et choisissez les permissions.'
                : 'Pick a descriptive name and choose permissions.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="key-name">{isFr ? 'Nom' : 'Name'}</Label>
              <Input
                id="key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isFr ? 'ex. Intégration Zapier' : 'e.g. Zapier integration'}
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label>{isFr ? 'Permissions' : 'Permissions'}</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={scopes.includes('read')}
                    onCheckedChange={() => toggleScope('read')}
                  />
                  <span className="text-sm">
                    <span className="font-medium">read</span>
                    <span className="text-muted-foreground ml-2">
                      {isFr ? '— lecture des données' : '— read data'}
                    </span>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer opacity-60">
                  <Checkbox
                    checked={scopes.includes('write')}
                    onCheckedChange={() => toggleScope('write')}
                    disabled
                  />
                  <span className="text-sm">
                    <span className="font-medium">write</span>
                    <span className="text-muted-foreground ml-2">
                      {isFr ? '— bientôt disponible' : '— coming soon'}
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {isFr ? 'Annuler' : 'Cancel'}
            </Button>
            <Button
              onClick={() => createKey.mutate()}
              disabled={!name.trim() || scopes.length === 0 || createKey.isPending}
            >
              {createKey.isPending
                ? isFr ? 'Création…' : 'Creating…'
                : isFr ? 'Créer' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Newly created key dialog (shown ONCE) */}
      <Dialog open={!!newKeyDialog} onOpenChange={(o) => !o && setNewKeyDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {isFr ? 'Copiez votre clé maintenant' : 'Copy your key now'}
            </DialogTitle>
            <DialogDescription>
              {isFr
                ? 'Cette clé ne sera plus jamais affichée. Stockez-la dans un endroit sûr.'
                : 'This key will never be shown again. Store it somewhere safe.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <code className="block bg-muted p-3 rounded font-mono text-xs break-all">
              {newKeyDialog?.raw}
            </code>
          </div>
          <DialogFooter>
            <Button onClick={() => newKeyDialog && copyKey(newKeyDialog.raw)}>
              {copied ? (
                <><Check className="h-4 w-4 mr-2" />{isFr ? 'Copiée' : 'Copied'}</>
              ) : (
                <><Copy className="h-4 w-4 mr-2" />{isFr ? 'Copier' : 'Copy'}</>
              )}
            </Button>
            <Button variant="outline" onClick={() => setNewKeyDialog(null)}>
              {isFr ? 'Fermer' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
