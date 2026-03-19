import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { onContentPublished } from '@/lib/notifications';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { useQuery } from '@tanstack/react-query';
import { AdminPageShell } from './AdminPageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useToast } from '@/hooks/use-toast';
import { ContentTemplateSelector } from '@/components/admin/ContentTemplateSelector';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { AIWritingAssistant } from '@/components/admin/AIWritingAssistant';

import type { CampaignTemplate } from '@/lib/contentTemplates';

const schema = z.object({
  title: z.string().min(2, 'Required'),
  description: z.string().optional(),
  image_url: z.string().optional(),
  goal_amount: z.coerce.number().min(0).optional(),
  end_date: z.string().optional(),
  is_active: z.boolean().default(true),
  is_published: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

export function CampaignForm() {
  const { id } = useParams<{ id: string }>();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(!isEdit);
  const [showAI, setShowAI] = useState(false);
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  

  const { data: item } = useQuery({
    queryKey: ['campaign-item', id],
    queryFn: async () => {
      const { data } = await db.from('donation_campaigns').select('*').eq('id', id).single();
      return data;
    },
    enabled: isEdit,
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_active: true, is_published: true },
  });

  useEffect(() => {
    if (item) {
      reset({
        title: item.title,
        description: item.description || '',
        image_url: item.image_url || '',
        goal_amount: item.goal_amount ?? undefined,
        end_date: item.end_date ? item.end_date.slice(0, 10) : '',
        is_active: item.is_active ?? true,
        is_published: item.is_published ?? true,
      });
    }
  }, [item, reset]);

  const onSubmit = async (data: FormData) => {
    if (!currentOrg || !user) { toast({ title: isFr ? 'Erreur' : 'Error', description: isFr ? 'Aucune organisation sélectionnée.' : 'No organization selected.', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const payload = { ...data, organization_id: currentOrg.id, created_by: user.id, currency: currentOrg.currency || 'XOF', image_url: data.image_url || null, goal_amount: data.goal_amount || null, end_date: data.end_date ? new Date(data.end_date).toISOString() : null, is_express_demo: false };
      let error;
      if (isEdit) { ({ error } = await db.from('donation_campaigns').update(payload).eq('id', id)); }
      else { ({ error } = await db.from('donation_campaigns').insert(payload as any)); }
      if (error) throw error;
      if (!isEdit && payload.is_published) onContentPublished(currentOrg.id, currentOrg.name, 'campaign', payload.title, '', { goal_amount: String(payload.goal_amount || 0), currency: payload.currency }, user.id);
      if (isEdit && item && !item.is_published && payload.is_published) onContentPublished(currentOrg.id, currentOrg.name, 'campaign', payload.title, id!, {}, user.id);
      toast({ title: isEdit ? (isFr ? 'Mis à jour ✅' : 'Updated ✅') : (isFr ? 'Créé ✅' : 'Created ✅') });
      navigate('/admin/campaigns');
    } catch (err: any) { toast({ title: isFr ? 'Erreur' : 'Error', description: err.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const applyCampaignTemplate = (tpl: CampaignTemplate) => {
    setValue('title', tpl.fields.title);
    setValue('description', tpl.fields.description);
    setValue('goal_amount', tpl.fields.goal_amount);
    setShowTemplates(false);
  };

  return (
    <AdminPageShell title={isEdit ? (isFr ? 'Modifier la campagne' : 'Edit Campaign') : (isFr ? 'Nouvelle campagne de dons' : 'New Donation Campaign')} backRoute="/admin/campaigns">
      {!isEdit && <ContentTemplateSelector type="campaign" open={showTemplates} onClose={() => setShowTemplates(false)} onSelect={(tpl) => applyCampaignTemplate(tpl as CampaignTemplate)} />}
      {!isEdit && !showTemplates && (<div className="mb-4"><Button variant="outline" size="sm" onClick={() => setShowTemplates(true)} className="gap-1.5 text-xs"><Sparkles className="h-3.5 w-3.5" /> {isFr ? 'Utiliser un modèle' : 'Use a template'}</Button></div>)}

      <AIWritingAssistant open={showAI} onClose={() => setShowAI(false)} onInsert={(html) => setValue('description', (watch('description') || '') + html, { shouldDirty: true, shouldTouch: true })} context={isFr ? 'description de campagne de dons' : 'donation campaign description'} />
      

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <Label>{isFr ? 'Titre de la campagne *' : 'Campaign Title *'}</Label>
          <Input {...register('title')} placeholder={isFr ? 'Ex: Construction d\'un nouveau bâtiment...' : 'E.g.: Building a new facility...'} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <RichTextEditor
            value={watch('description') || ''}
            onChange={(html) => setValue('description', html)}
            placeholder={isFr ? 'Décrivez l\'objectif de cette campagne...' : 'Describe the goal of this campaign...'}
            onAIAssist={() => setShowAI(true)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>{isFr ? 'Objectif' : 'Goal'} ({currentOrg?.currency || 'XOF'})</Label>
            <Input type="number" {...register('goal_amount')} placeholder={isFr ? 'Ex: 5000000' : 'E.g.: 5000000'} />
          </div>
          <div className="space-y-1.5">
            <Label>{isFr ? 'Date de fin (optionnel)' : 'End date (optional)'}</Label>
            <Input type="date" {...register('end_date')} />
          </div>
        </div>

        <div className="space-y-2">
          <ImageUploader value={watch('image_url') || ''} onChange={(url) => setValue('image_url', url)} folder="campaigns" label={isFr ? 'Image de couverture' : 'Cover image'} hint={isFr ? 'Recommandé: 1200×630px' : 'Recommended: 1200×630px'} aspectRatio="video" />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2"><Switch checked={watch('is_active')} onCheckedChange={v => setValue('is_active', v)} /><Label className="text-sm cursor-pointer">{isFr ? 'Active' : 'Active'}</Label></div>
          <div className="flex items-center gap-2"><Switch checked={watch('is_published')} onCheckedChange={v => setValue('is_published', v)} /><Label className="text-sm cursor-pointer">{isFr ? 'Publié' : 'Published'}</Label></div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/campaigns')}>{isFr ? 'Annuler' : 'Cancel'}</Button>
          <Button type="submit" className="bg-primary text-primary-foreground" disabled={loading}>{loading ? (isFr ? 'Enregistrement...' : 'Saving...') : isEdit ? (isFr ? 'Mettre à jour' : 'Update') : (isFr ? 'Créer' : 'Create')}</Button>
        </div>
      </form>
    </AdminPageShell>
  );
}
