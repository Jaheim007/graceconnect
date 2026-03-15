import { useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgPrograms, useDeleteProgram, useCreateProgram } from '@/hooks/usePrograms';
import { AdminPageShell } from './AdminPageShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, BookOpen, Edit, Trash2, Eye, EyeOff, Layers, ChevronRight,
  Sparkles, FileUp, PenLine, ChevronDown
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { CreateWithAIDialog } from '@/components/programs/CreateWithAIDialog';
import { CreateBlankDialog } from '@/components/programs/CreateBlankDialog';
import { ConvertDocumentDialog } from '@/components/programs/ConvertDocumentDialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };

export default function AdminPrograms() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { data: programs = [], isLoading } = useOrgPrograms(currentOrg?.id);
  const deleteProgram = useDeleteProgram();
  const createProgram = useCreateProgram();

  const [showAI, setShowAI] = useState(false);
  const [showBlank, setShowBlank] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProgram.mutateAsync(deleteTarget.id);
      toast({ title: isFr ? 'Programme supprimé' : 'Program deleted' });
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleCreateBlank = async (data: { title: string; description?: string; coverUrl?: string }) => {
    if (!currentOrg || !user) return;
    try {
      const result = await createProgram.mutateAsync({
        organization_id: currentOrg.id,
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        cover_image_url: data.coverUrl || undefined,
        created_by: user.id,
      });
      toast({ title: isFr ? '✅ Cours créé' : '✅ Course created' });
      navigate(`/admin/programs/${result.id}/edit`);
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleAICreated = (programId: string) => {
    navigate(`/admin/programs/${programId}/edit`);
  };

  return (
    <AdminPageShell
      title={isFr ? "Programmes & Formations" : "Programs & Courses"}
      subtitle={isFr ? "Créez des parcours d'apprentissage structurés avec modules et leçons." : "Create structured learning paths with modules and lessons."}
      backRoute="/admin"
      actions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {isFr ? 'Créer un cours' : 'Create course'}
              <ChevronDown className="h-3 w-3 ml-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setShowAI(true)} className="gap-2.5 py-2.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{isFr ? 'Créer avec l\'IA' : 'Create with AI'}</p>
                <p className="text-[10px] text-muted-foreground">{isFr ? 'L\'IA génère la structure' : 'AI generates the structure'}</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowConvert(true)} className="gap-2.5 py-2.5">
              <FileUp className="h-4 w-4 text-primary" />
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">{isFr ? 'Convertir un document' : 'Convert document'}</p>
                  <Badge variant="secondary" className="text-[8px] px-1 py-0">NEW</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{isFr ? 'PDF, Word, PowerPoint' : 'PDF, Word, PowerPoint'}</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowBlank(true)} className="gap-2.5 py-2.5">
              <PenLine className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{isFr ? 'Créer vide' : 'Create blank'}</p>
                <p className="text-[10px] text-muted-foreground">{isFr ? 'Partir de zéro' : 'Start from scratch'}</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">
            {programs.length} {isFr ? `cours` : `course${programs.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {isLoading ? <SkeletonRow count={3} /> : programs.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <BookOpen className="h-10 w-10 text-primary/60" />
            </div>
            <div>
              <p className="text-base font-semibold">{isFr ? 'Aucun cours' : 'No courses yet'}</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                {isFr
                  ? "Créez votre premier cours de formation. Utilisez l'IA, importez un document, ou partez de zéro."
                  : "Create your first training course. Use AI, import a document, or start from scratch."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowAI(true)} className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> {isFr ? 'Créer avec l\'IA' : 'Create with AI'}
              </Button>
              <Button onClick={() => setShowBlank(true)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> {isFr ? 'Créer vide' : 'Create blank'}
              </Button>
            </div>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((prog: any) => (
              <motion.div
                key={prog.id}
                variants={fadeUp}
                className="relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all group cursor-pointer"
                onClick={() => navigate(`/admin/programs/${prog.id}/edit`)}
              >
                {/* Cover image */}
                {prog.cover_image_url ? (
                  <img src={prog.cover_image_url} alt="" className="h-32 w-full object-cover" />
                ) : (
                  <div className="h-32 w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-primary/30" />
                  </div>
                )}

                <div className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-tight line-clamp-2">{prog.title}</p>
                    <Badge variant={prog.is_published ? 'default' : 'secondary'} className="text-[9px] shrink-0">
                      {prog.is_published ? (isFr ? 'Publié' : 'Live') : (isFr ? 'Brouillon' : 'Draft')}
                    </Badge>
                  </div>

                  {prog.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{prog.description?.replace(/<[^>]*>/g, '')}</p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Layers className="h-3 w-3" /> {prog.module_count} module{prog.module_count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); navigate(`/admin/programs/${prog.id}/edit`); }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(prog.id, prog.title); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Dialogs */}
      <CreateWithAIDialog open={showAI} onOpenChange={setShowAI} onCreated={handleAICreated} />
      <CreateBlankDialog open={showBlank} onOpenChange={setShowBlank} onCreate={handleCreateBlank} />
      <ConvertDocumentDialog open={showConvert} onOpenChange={setShowConvert} onCreated={handleAICreated} />
    </AdminPageShell>
  );
}
