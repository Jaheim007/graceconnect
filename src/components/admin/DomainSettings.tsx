import { useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { useOrgDomains, useAddOrgDomain, useSetPrimaryDomain, useDeleteOrgDomain } from '@/hooks/useOrgDomains';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Globe, Star, Trash2, Plus, CheckCircle, Clock, AlertCircle, Copy, ExternalLink } from 'lucide-react';

export function DomainSettings() {
  const { currentOrg } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { data: domains = [], isLoading } = useOrgDomains(currentOrg?.id);
  const addDomain = useAddOrgDomain();
  const setPrimary = useSetPrimaryDomain();
  const deleteDomain = useDeleteOrgDomain();

  const [subdomainInput, setSubdomainInput] = useState('');
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [checking, setChecking] = useState(false);

  const orgId = currentOrg?.id;
  if (!orgId) return null;

  const subdomains = domains.filter(d => d.domain_type === 'subdomain');
  const customDomains = domains.filter(d => d.domain_type === 'custom');

  const handleAddSubdomain = async () => {
    const slug = subdomainInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!slug || slug.length < 3) {
      toast.error(isFr ? 'Le sous-domaine doit faire au moins 3 caractères' : 'Subdomain must be at least 3 characters');
      return;
    }

    const domain = `${slug}.siteviral.com`;
    setChecking(true);
    try {
      // Check availability
      const { data: existing } = await db
        .from('org_domains')
        .select('id')
        .eq('domain', domain)
        .limit(1)
        .single();

      if (existing) {
        toast.error(isFr ? 'Ce sous-domaine est déjà pris' : 'This subdomain is already taken');
        return;
      }

      await addDomain.mutateAsync({ orgId, domain, domainType: 'subdomain' });
      toast.success(isFr ? 'Sous-domaine ajouté !' : 'Subdomain added!');
      setSubdomainInput('');
    } catch (e: any) {
      toast.error(e.message || 'Error');
    } finally {
      setChecking(false);
    }
  };

  const handleAddCustomDomain = async () => {
    const domain = customDomainInput.trim().toLowerCase();
    if (!domain || !domain.includes('.')) {
      toast.error(isFr ? 'Entrez un domaine valide (ex: monsite.com)' : 'Enter a valid domain (e.g. mysite.com)');
      return;
    }

    setChecking(true);
    try {
      const { data: existing } = await db
        .from('org_domains')
        .select('id')
        .eq('domain', domain)
        .limit(1)
        .single();

      if (existing) {
        toast.error(isFr ? 'Ce domaine est déjà enregistré' : 'This domain is already registered');
        return;
      }

      await addDomain.mutateAsync({ orgId, domain, domainType: 'custom' });
      toast.success(isFr ? 'Domaine ajouté ! Configurez vos DNS.' : 'Domain added! Configure your DNS.');
      setCustomDomainInput('');
    } catch (e: any) {
      toast.error(e.message || 'Error');
    } finally {
      setChecking(false);
    }
  };

  const handleSetPrimary = async (domainId: string) => {
    try {
      await setPrimary.mutateAsync({ orgId, domainId });
      toast.success(isFr ? 'Domaine principal mis à jour' : 'Primary domain updated');
    } catch {
      toast.error('Error');
    }
  };

  const handleDelete = async (domainId: string, domainName: string) => {
    if (!confirm(isFr ? `Supprimer ${domainName} ?` : `Delete ${domainName}?`)) return;
    try {
      await deleteDomain.mutateAsync({ orgId, domainId });
      toast.success(isFr ? 'Domaine supprimé' : 'Domain removed');
    } catch {
      toast.error('Error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(isFr ? 'Copié !' : 'Copied!');
  };

  const StatusBadge = ({ verified, ssl }: { verified: boolean; ssl: string }) => {
    if (verified && ssl === 'active') {
      return <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />{isFr ? 'Actif' : 'Active'}</Badge>;
    }
    if (!verified) {
      return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" />{isFr ? 'En attente' : 'Pending'}</Badge>;
    }
    return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />{isFr ? 'Erreur' : 'Error'}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {isFr ? 'Domaines & Sous-domaines' : 'Domains & Subdomains'}
        </CardTitle>
        <CardDescription>
          {isFr
            ? 'Configurez votre adresse personnalisée pour votre page publique'
            : 'Configure your custom address for your public page'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="subdomain" className="space-y-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="subdomain">
              {isFr ? 'Sous-domaine gratuit' : 'Free Subdomain'}
            </TabsTrigger>
            <TabsTrigger value="custom">
              {isFr ? 'Domaine personnalisé' : 'Custom Domain'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subdomain" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isFr
                ? 'Choisissez un sous-domaine gratuit : votrenom.siteviral.com'
                : 'Choose a free subdomain: yourname.siteviral.com'}
            </p>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-0">
                <Input
                  placeholder={isFr ? 'votrenom' : 'yourname'}
                  value={subdomainInput}
                  onChange={e => setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="rounded-r-none"
                />
                <span className="px-3 py-2 bg-muted border border-l-0 border-input rounded-r-md text-sm text-muted-foreground whitespace-nowrap">
                  .siteviral.com
                </span>
              </div>
              <Button onClick={handleAddSubdomain} disabled={checking || !subdomainInput.trim()} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                {isFr ? 'Ajouter' : 'Add'}
              </Button>
            </div>

            {subdomains.length > 0 && (
              <div className="space-y-2">
                {subdomains.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2">
                      {d.is_primary && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                      <a href={`https://${d.domain}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline flex items-center gap-1">
                        {d.domain} <ExternalLink className="h-3 w-3" />
                      </a>
                      <StatusBadge verified={d.is_verified} ssl={d.ssl_status} />
                    </div>
                    <div className="flex items-center gap-1">
                      {!d.is_primary && (
                        <Button variant="ghost" size="sm" onClick={() => handleSetPrimary(d.id)} title={isFr ? 'Définir comme principal' : 'Set as primary'}>
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id, d.domain)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isFr
                ? 'Connectez votre propre domaine (ex: monsite.com). Vous devrez configurer vos DNS.'
                : 'Connect your own domain (e.g. mysite.com). You\'ll need to configure your DNS.'}
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="monsite.com"
                value={customDomainInput}
                onChange={e => setCustomDomainInput(e.target.value.toLowerCase().trim())}
                className="flex-1"
              />
              <Button onClick={handleAddCustomDomain} disabled={checking || !customDomainInput.trim()} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                {isFr ? 'Connecter' : 'Connect'}
              </Button>
            </div>

            {/* DNS Instructions */}
            <Card className="border-dashed">
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm font-medium">{isFr ? 'Instructions DNS' : 'DNS Instructions'}</p>
                <p className="text-xs text-muted-foreground">
                  {isFr
                    ? 'Ajoutez ces enregistrements DNS chez votre registrar :'
                    : 'Add these DNS records at your registrar:'}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-muted rounded text-xs font-mono">
                    <span>CNAME → siteviral.com</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => copyToClipboard('siteviral.com')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isFr ? 'Ou un A Record pointant vers :' : 'Or an A Record pointing to:'}
                  </p>
                  <div className="flex items-center justify-between p-2 bg-muted rounded text-xs font-mono">
                    <span>A → 185.158.133.1</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => copyToClipboard('185.158.133.1')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {customDomains.length > 0 && (
              <div className="space-y-2">
                {customDomains.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2">
                      {d.is_primary && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                      <span className="text-sm font-medium">{d.domain}</span>
                      <StatusBadge verified={d.is_verified} ssl={d.ssl_status} />
                    </div>
                    <div className="flex items-center gap-1">
                      {!d.is_primary && d.is_verified && (
                        <Button variant="ghost" size="sm" onClick={() => handleSetPrimary(d.id)}>
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id, d.domain)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
