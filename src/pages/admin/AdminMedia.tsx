import { useOrg } from '@/contexts/OrgContext';
import { useOrgMedia, useDeleteMedia } from '@/hooks/useMedia';
import { AdminPageShell } from './AdminPageShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function AdminMedia() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: media = [], isLoading } = useOrgMedia(currentOrg?.id, false);
  const deleteMutation = useDeleteMedia();

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media?')) return;
    await deleteMutation.mutateAsync({ id, orgId: currentOrg!.id });
    toast({ title: 'Media deleted' });
  };

  return (
    <AdminPageShell title="Media Library" newRoute="/admin/media/new" backRoute="/admin">
      {isLoading ? <SkeletonRow count={5} /> : media.length === 0 ? (
        <EmptyState variant="content" action={{ label: 'Add media', onClick: () => navigate('/admin/media/new') }} />
      ) : (
        <div className="space-y-2">
          {media.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <div className="h-12 w-20 rounded-lg bg-muted overflow-hidden shrink-0">
                {m.thumbnail_url ? <img src={m.thumbnail_url} alt={m.title} className="w-full h-full object-cover" /> : <div className="w-full h-full hero-gradient" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className="text-[10px] px-1 capitalize">{m.media_type}</Badge>
                  <Badge variant={m.is_published ? 'secondary' : 'outline'} className={`text-[10px] px-1 ${m.is_published ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {m.is_published ? '● Live' : '○ Draft'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/admin/media/${m.id}/edit`)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(m.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
