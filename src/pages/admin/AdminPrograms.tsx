import { useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgPrograms, useDeleteProgram } from '@/hooks/usePrograms';
import { AdminPageShell } from './AdminPageShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Edit, Trash2, Eye, EyeOff, Layers, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };

export default function AdminPrograms() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: programs = [], isLoading } = useOrgPrograms(currentOrg?.id);
  const deleteMutation = useDeleteProgram();

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer le programme « ${title} » et tout son contenu ?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: '🗑️ Programme supprimé' });
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  return (
    <AdminPageShell title="Programmes & Formations" subtitle="Créez des parcours d'apprentissage structurés avec modules et leçons." backRoute="/admin">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">{programs.length} programme{programs.length !== 1 ? 's' : ''}</span>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => navigate('/admin/programs/new')}>
            <Plus className="h-3.5 w-3.5" /> Nouveau programme
          </Button>
        </div>

        {isLoading ? <SkeletonRow count={3} /> : programs.length === 0 ? (
          <EmptyState
            variant="generic"
            title="Aucun programme"
            description="Créez votre premier programme de formation pour structurer votre contenu éducatif."
          />
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
            {programs.map((prog: any) => (
              <motion.div
                key={prog.id}
                variants={fadeUp}
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all group cursor-pointer"
                onClick={() => navigate(`/admin/programs/${prog.id}/edit`)}
              >
                {prog.cover_image_url ? (
                  <img src={prog.cover_image_url} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{prog.title}</p>
                    <Badge variant={prog.is_published ? 'default' : 'secondary'} className="text-[10px]">
                      {prog.is_published ? <><Eye className="h-2.5 w-2.5 mr-0.5" /> Publié</> : <><EyeOff className="h-2.5 w-2.5 mr-0.5" /> Brouillon</>}
                    </Badge>
                  </div>
                  {prog.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{prog.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Layers className="h-3 w-3" /> {prog.module_count} module{prog.module_count !== 1 ? 's' : ''}</span>
                    <span>{new Date(prog.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigate(`/admin/programs/${prog.id}/edit`); }}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(prog.id, prog.title); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </AdminPageShell>
  );
}
