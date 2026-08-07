import { Link } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { ArrowRight, GraduationCap, PenLine, Zap, Clock, BookOpen, Baby, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export default function AdminCreateHub() {
  const { currentOrg } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const { data: recentProjects } = useQuery({
    queryKey: ['ai-recent-projects', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data } = await db.from('ai_content_projects')
        .select('id, title, project_type, status, updated_at')
        .eq('organization_id', currentOrg.id)
        .order('updated_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!currentOrg?.id,
    staleTime: 60_000,
  });

  const PROJECT_TYPE_META: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {
    ebook: { label: isFr ? 'Ebook' : 'Ebook', icon: BookOpen, color: 'text-blue-500' },
    kids_book: { label: isFr ? 'Livre Enfant' : 'Kids Book', icon: Baby, color: 'text-pink-500' },
    coloring_book: { label: isFr ? 'Coloriage' : 'Coloring', icon: Palette, color: 'text-orange-500' },
    course_pack: { label: isFr ? 'Cours' : 'Course', icon: GraduationCap, color: 'text-emerald-500' },
  };

  const STATUS_LABEL: Record<string, { fr: string; en: string; cls: string }> = {
    draft: { fr: 'Brouillon', en: 'Draft', cls: 'bg-muted text-muted-foreground' },
    generating: { fr: 'Génération...', en: 'Generating...', cls: 'bg-primary/20 text-primary' },
    review: { fr: 'En revue', en: 'In Review', cls: 'bg-accent/20 text-accent-foreground' },
    ready: { fr: 'Prêt', en: 'Ready', cls: 'bg-emerald-500/20 text-emerald-500' },
    published: { fr: 'Publié', en: 'Published', cls: 'bg-emerald-500/20 text-emerald-500' },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Viral AI Studio
          </h1>
          <p className="text-sm text-muted-foreground">
            {isFr ? 'Créez vos contenus avec Viral AI Studio' : 'Create your content with Viral AI Studio'}
          </p>
        </div>
      </div>

      {/* AI Writer CTA — Write a book */}
      <Link
        to="/ecrire"
        className="relative flex items-center gap-3 p-3.5 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 hover:border-primary/50 transition-all group overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
        />
        <motion.div
          className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-lg shadow-primary/30"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PenLine className="h-5 w-5 text-primary-foreground" />
        </motion.div>
        <div className="relative flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-sm leading-tight">
              {isFr ? 'Écrire un livre' : 'Write a book'}
            </h3>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/20 text-primary whitespace-nowrap">AI</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
            {isFr ? 'Créez un ebook en 5 minutes avec Viral AI Studio' : 'Create an ebook in 5 minutes with Viral AI Studio'}
          </p>
        </div>
        <ArrowRight className="relative h-4 w-4 text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* AI Course CTA */}
      <Link
        to="/admin/programs"
        className="relative flex items-center gap-3 p-3.5 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-accent/5 to-emerald-500/5 hover:border-emerald-500/50 transition-all group overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'linear', repeatDelay: 2.5 }}
        />
        <motion.div
          className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <GraduationCap className="h-5 w-5 text-white" />
        </motion.div>
        <div className="relative flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-sm leading-tight">
              {isFr ? 'Créer une formation' : 'Create a course'}
            </h3>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 whitespace-nowrap">AI</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
            {isFr ? 'Créez une formation en 5 min avec Viral AI Studio' : 'Create a course in 5 min with Viral AI Studio'}
          </p>
        </div>
        <ArrowRight className="relative h-4 w-4 text-emerald-500 shrink-0 group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* Recent AI Projects — no "View all" */}
      {recentProjects && recentProjects.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {isFr ? 'Mes dernières créations' : 'My latest creations'}
          </h2>
          <div className="space-y-1.5">
            {recentProjects.map(project => {
              const meta = PROJECT_TYPE_META[project.project_type] || PROJECT_TYPE_META.ebook;
              const Icon = meta.icon;
              const st = STATUS_LABEL[project.status] || STATUS_LABEL.draft;
              return (
                <Link
                  key={project.id}
                  to="/ecrire"
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <Icon className={cn('h-4 w-4 shrink-0', meta.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{project.title}</p>
                    <p className="text-[10px] text-muted-foreground">{meta.label}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded-full', st.cls)}>
                      {isFr ? st.fr : st.en}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(project.updated_at).toLocaleDateString(isFr ? 'fr' : 'en', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!recentProjects || recentProjects.length === 0) && (
        <div className="text-center py-8 rounded-2xl border border-dashed border-border">
          
          <p className="text-sm font-medium text-muted-foreground">
            {isFr ? 'Aucune création encore' : 'No creations yet'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isFr ? 'Commencez par écrire un livre ou créer une formation avec Viral AI Studio' : 'Start by writing a book or creating a course with Viral AI Studio'}
          </p>
        </div>
      )}
    </div>
  );
}
