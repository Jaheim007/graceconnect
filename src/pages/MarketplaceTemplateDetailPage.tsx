import { useParams, Link, useNavigate } from '@/lib/router-compat';
import { cloneMarketplaceTemplate } from '@/lib/marketplace/templates.functions';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { db, supabase } from '@/lib/db';
import { useI18n } from '@/i18n/I18nContext';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export default function MarketplaceTemplateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const { user } = useAuth();
  const { userOrgs, canManage } = useOrg();
  const ownedOrgs = userOrgs.filter((o: any) => canManage(o.id));
  const [targetOrg, setTargetOrg] = useState<string>('');
  const [cloning, setCloning] = useState(false);

  const { data: template, isLoading } = useQuery({
    queryKey: ['marketplace-template', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await db.from('marketplace_templates')
        .select('*, organizations:author_org_id(name, slug, logo_url)')
        .eq('id', id!)
        .eq('status', 'approved')
        .maybeSingle();
      return data;
    },
  });

  const handleClone = async () => {
    if (!user) {
      navigate(`/auth?returnTo=/marketplace/templates/${id}`);
      return;
    }
    if (!targetOrg) {
      toast.error(fr ? 'Choisissez une organisation' : 'Choose an organization');
      return;
    }
    setCloning(true);
    try {
      const isFreeClone = Number(template?.clone_price) === 0;
      if (isFreeClone) {
        await cloneMarketplaceTemplate({
          data: { template_id: id!, target_org_id: targetOrg },
        });
        toast.success(fr ? 'Template cloné !' : 'Template cloned!');
        navigate(`/admin/products`);
      } else {
        const { data, error } = await supabase.functions.invoke('checkout-template-clone', {
          body: { template_id: id, target_org_id: targetOrg, callback_url: `${window.location.origin}/admin/products` },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        if (data?.url) {
          window.location.href = data.url;
        } else {
          throw new Error(fr ? 'Aucune URL de paiement reçue' : 'No checkout URL received');
        }
      }

    } catch (e: any) {
      toast.error(e.message || (fr ? 'Erreur lors du clonage' : 'Clone failed'));
    } finally {
      setCloning(false);
    }
  };

  if (isLoading) return <div className="container py-12 text-center">{fr ? 'Chargement...' : 'Loading...'}</div>;
  if (!template) return <div className="container py-12 text-center">{fr ? 'Template introuvable' : 'Template not found'}</div>;

  const isFree = Number(template.clone_price) === 0;

  return (
    <div className="container max-w-4xl py-8 px-4">
      <Link to="/marketplace/templates" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6 hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> {fr ? 'Retour' : 'Back'}
      </Link>

      <div className="grid md:grid-cols-[1fr,320px] gap-6">
        <div>
          {template.cover_image_url && (
            <img src={template.cover_image_url} alt={template.title} className="w-full aspect-video object-cover rounded-lg mb-4" />
          )}
          <h1 className="text-3xl font-bold mb-2">{template.title}</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {fr ? 'Par' : 'By'} <strong>{template.organizations?.name}</strong>
          </p>
          <div className="flex gap-4 text-sm mb-4">
            {template.avg_rating && (
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                {Number(template.avg_rating).toFixed(1)} ({template.reviews_count})
              </span>
            )}
            <span className="flex items-center gap-1 text-muted-foreground">
              <Download className="w-4 h-4" /> {template.clones_count} {fr ? 'clones' : 'clones'}
            </span>
          </div>
          {(template.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {(template.tags ?? []).map((tag: string) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}
          <p className="text-foreground/80 whitespace-pre-wrap">{template.description}</p>
        </div>

        <Card className="p-5 h-fit sticky top-4">
          <p className="text-3xl font-bold text-primary mb-1">
            {isFree ? (fr ? 'Gratuit' : 'Free') : formatCurrency(Number(template.clone_price), template.currency)}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {fr
              ? `L'auteur reçoit ${template.author_commission_percent}% de chaque clone.`
              : `Author receives ${template.author_commission_percent}% of each clone.`}
          </p>

          {!user ? (
            <Button className="w-full" onClick={() => navigate(`/auth?returnTo=/marketplace/templates/${id}`)}>
              {fr ? 'Se connecter pour cloner' : 'Sign in to clone'}
            </Button>
          ) : ownedOrgs.length === 0 ? (
            <Button className="w-full" onClick={() => navigate('/create-org')}>
              {fr ? 'Créer une organisation' : 'Create organization'}
            </Button>
          ) : (
            <>
              <Select value={targetOrg} onValueChange={setTargetOrg}>
                <SelectTrigger className="mb-3">
                  <SelectValue placeholder={fr ? 'Cloner dans...' : 'Clone into...'} />
                </SelectTrigger>
                <SelectContent>
                  {ownedOrgs.map((o: any) => (
                    <SelectItem key={o.id} value={o.id} disabled={o.id === template.author_org_id}>
                      {o.name} {o.id === template.author_org_id && (fr ? '(votre template)' : '(your template)')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={handleClone} disabled={cloning || !targetOrg}>
                {cloning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isFree ? (fr ? 'Cloner gratuitement' : 'Clone for free') : (fr ? 'Acheter & cloner' : 'Buy & clone')}
              </Button>
              {!isFree && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {fr ? 'Paiement sécurisé via Paystack/Stripe' : 'Secure payment via Paystack/Stripe'}
                </p>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
