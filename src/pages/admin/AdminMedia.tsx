import { useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgMedia, useDeleteMedia, useUpdateMedia } from '@/hooks/useMedia';
import { AdminPageShell } from './AdminPageShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VideoImportButton } from '@/components/admin/VideoImportButton';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function AdminMedia() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  const { data: media = [], isLoading } = useOrgMedia(currentOrg?.id, false);
  const deleteMutation = useDeleteMedia();
  const updateMutation = useUpdateMedia();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({ id: deleteTarget.id, orgId: currentOrg!.id });
    toast({ title: t('admin_media.deleted') });
    setDeleteTarget(null);
  };

  const handleTogglePublish = async (m: any) => {
    await updateMutation.mutateAsync({ id: m.id, updates: { is_published: !m.is_published } });
    toast({ title: m.is_published ? 'Média dépublié' : 'Média publié ✅' });
  };

  return (
    <AdminPageShell title={t('admin_media.title')} newRoute="/admin/media/new" newLabel={t('admin_media.new')} backRoute="/admin">
      {isLoading ? <SkeletonRow count={5} /> : media.length === 0 ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <VideoImportButton />
          </div>
          <EmptyState variant="content" action={{ label: t('admin_media.add'), onClick: () => navigate('/admin/media/new') }} />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-base">{media.length} {media.length > 1 ? t('admin_media.count_plural') : t('admin_media.count')}</h2>
            <VideoImportButton />
          </div>
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2.5">
            {media.map((m) => (
              <motion.div
                key={m.id}
                variants={fadeUp}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background/50 hover:bg-background hover:border-primary/20 transition-all group"
              >
                <div className="h-16 w-28 rounded-lg bg-muted overflow-hidden shrink-0">
                  {m.thumbnail_url ? <img src={m.thumbnail_url} alt={m.title} className="w-full h-full object-cover" /> : <div className="w-full h-full hero-gradient" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium truncate">{m.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs px-2 capitalize border-0 bg-muted">{m.media_type}</Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs px-2 border-0',
                        m.is_published ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {m.is_published ? t('admin_media.published') : t('admin_media.draft')}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-9 w-9" title={m.is_published ? 'Dépublier' : 'Publier'}
                    onClick={() => handleTogglePublish(m)}>
                    {m.is_published ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(`/admin/media/${m.id}/edit`)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setDeleteTarget({ id: m.id, title: m.title })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce média ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {deleteTarget?.title} » sera supprimé définitivement. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}