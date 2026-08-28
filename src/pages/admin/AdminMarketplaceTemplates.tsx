import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, supabase } from '@/lib/db';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Download, Star } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_review: 'bg-yellow-500/10 text-yellow-700',
  approved: 'bg-green-500/10 text-green-700',
  rejected: 'bg-destructive/10 text-destructive',
  archived: 'bg-muted text-muted-foreground',
};

export default function AdminMarketplaceTemplates() {
  const { currentOrg } = useOrg();
  const activeOrgId = currentOrg?.id;
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    source_product_id: '',
    kind: 'ebook',
    clone_price: 0,
    currency: 'XOF',
    author_commission_percent: 50,
    description: '',
    tags: '',
  });

  // List org's templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin-marketplace-templates', activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data } = await db.from('marketplace_templates')
        .select('*')
        .eq('author_org_id', activeOrgId!)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Eligible products (published)
  const { data: products = [] } = useQuery({
    queryKey: ['org-products-publishable', activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data } = await db.from('digital_products')
        .select('id, title, product_type')
        .eq('organization_id', activeOrgId!)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      return await publishMarketplaceTemplate({
        data: {
          source_product_id: form.source_product_id,
          kind: form.kind,
          clone_price: Number(form.clone_price),
          currency: form.currency,
          author_commission_percent: Number(form.author_commission_percent),
          description: form.description,
          tags,
          language: locale,
        },
      });

    },
    onSuccess: () => {
      toast.success(fr ? 'Template soumis pour modération !' : 'Template submitted for review!');
      qc.invalidateQueries({ queryKey: ['admin-marketplace-templates'] });
      setDialogOpen(false);
      setForm({ source_product_id: '', kind: 'ebook', clone_price: 0, currency: 'XOF', author_commission_percent: 50, description: '', tags: '' });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{fr ? 'Mes Templates Marketplace' : 'My Marketplace Templates'}</h1>
          <p className="text-sm text-muted-foreground">
            {fr ? 'Publiez vos meilleurs contenus et touchez une commission à chaque clone.' : 'Publish your best content and earn commission on each clone.'}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />{fr ? 'Publier un template' : 'Publish template'}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{fr ? 'Publier un template' : 'Publish template'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>{fr ? 'Produit source' : 'Source product'}</Label>
                <Select value={form.source_product_id} onValueChange={(v) => setForm({ ...form, source_product_id: v })}>
                  <SelectTrigger><SelectValue placeholder={fr ? 'Choisir...' : 'Choose...'} /></SelectTrigger>
                  <SelectContent>
                    {products.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{fr ? 'Type' : 'Type'}</Label>
                  <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formation">🎓 {fr ? 'Formation' : 'Course'}</SelectItem>
                      <SelectItem value="ebook">📘 Ebook</SelectItem>
                      <SelectItem value="prompt">🪄 Prompt AI</SelectItem>
                      <SelectItem value="landing">🚀 Landing</SelectItem>
                      <SelectItem value="email_sequence">✉️ {fr ? 'Séq. email' : 'Email seq.'}</SelectItem>
                      <SelectItem value="other">🔷 {fr ? 'Autre' : 'Other'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{fr ? 'Devise' : 'Currency'}</Label>
                  <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XOF">XOF</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{fr ? 'Prix de clonage' : 'Clone price'}</Label>
                  <Input type="number" min={0} value={form.clone_price} onChange={(e) => setForm({ ...form, clone_price: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>{fr ? 'Commission (%)' : 'Commission (%)'}</Label>
                  <Input type="number" min={30} max={70} value={form.author_commission_percent} onChange={(e) => setForm({ ...form, author_commission_percent: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>{fr ? 'Description marketing' : 'Marketing description'}</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div>
                <Label>{fr ? 'Tags (séparés par virgule)' : 'Tags (comma separated)'}</Label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="business, marketing, ai" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{fr ? 'Annuler' : 'Cancel'}</Button>
              <Button onClick={() => publishMutation.mutate()} disabled={!form.source_product_id || publishMutation.isPending}>
                {publishMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {fr ? 'Soumettre' : 'Submit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-center py-12 text-muted-foreground">{fr ? 'Chargement...' : 'Loading...'}</p>
      ) : !templates.length ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {fr ? 'Aucun template publié. Partagez votre savoir-faire !' : 'No templates published yet. Share your know-how!'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {templates.map((t: any) => (
            <Card key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{t.title}</h3>
                  <Badge className={STATUS_COLORS[t.status]}>{t.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {Number(t.clone_price) === 0 ? (fr ? 'Gratuit' : 'Free') : formatCurrency(Number(t.clone_price), t.currency)}
                  {' · '}{t.author_commission_percent}% {fr ? 'commission' : 'commission'}
                </p>
                {t.rejection_reason && (
                  <p className="text-xs text-destructive mt-1">⚠ {t.rejection_reason}</p>
                )}
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Download className="w-4 h-4" />{t.clones_count}</span>
                {t.avg_rating && (
                  <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />{Number(t.avg_rating).toFixed(1)}</span>
                )}
                <span className="font-medium text-foreground">{formatCurrency(Number(t.total_revenue), t.currency)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
