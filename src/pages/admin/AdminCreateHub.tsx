import { Link } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import {
  ArrowRight, GraduationCap, PenLine, Clock, BookOpen, Baby, Palette,
  LayoutGrid, ShieldCheck, Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const STUDIO_NAME = 'Creators Studio';

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
    ebook: { label: isFr ? 'Ebook' : 'Ebook', icon: BookOpen, color: 'text-primary' },
    kids_book: { label: isFr ? 'Livre enfant' : 'Kids book', icon: Baby, color: 'text-pink-500' },
    coloring_book: { label: isFr ? 'Coloriage' : 'Coloring', icon: Palette, color: 'text-orange-500' },
    course_pack: { label: isFr ? 'Formation' : 'Course', icon: GraduationCap, color: 'text-emerald-500' },
  };

  const STATUS_LABEL: Record<string, { fr: string; en: string; cls: string }> = {
    draft: { fr: 'Brouillon', en: 'Draft', cls: 'bg-muted text-muted-foreground' },
    generating: { fr: 'Génération…', en: 'Generating…', cls: 'bg-primary/15 text-primary' },
    review: { fr: 'En revue', en: 'In review', cls: 'bg-accent/20 text-accent-foreground' },
    ready: { fr: 'Prêt', en: 'Ready', cls: 'bg-emerald-500/15 text-emerald-500' },
    published: { fr: 'Publié', en: 'Published', cls: 'bg-emerald-500/15 text-emerald-500' },
  };

  const actions = [
    {
      to: '/ecrire',
      icon: PenLine,
      title: isFr ? 'Écrire un livre' : 'Write a book',
      desc: isFr ? 'Ebook prêt à vendre en quelques minutes.' : 'A sellable ebook in minutes.',
      accent: 'primary' as const,
    },
    {
      to: '/admin/programs',
      icon: GraduationCap,
      title: isFr ? 'Créer une formation' : 'Create a course',
      desc: isFr ? 'Leçons, quiz et certificat générés pour toi.' : 'Lessons, quizzes and certificate generated for you.',
      accent: 'emerald' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-accent/15 blur-3xl"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Wand2 className="h-3 w-3 text-primary" />
            {isFr ? 'Création assistée' : 'Assisted creation'}
          </span>
          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {STUDIO_NAME}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {isFr
              ? 'Ton atelier de production : transforme une idée en livre ou en formation professionnelle, prête à publier et à vendre.'
              : 'Your production workshop: turn an idea into a professional book or course, ready to publish and sell.'}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              {isFr ? 'Tu valides avant publication' : 'You approve before publishing'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5 text-primary" />
              {isFr ? 'Brouillons sauvegardés automatiquement' : 'Drafts saved automatically'}
            </span>
          </div>
        </div>
      </section>

      {/* Primary actions */}
      <section className="grid gap-3 sm:grid-cols-2">
        {actions.map((a, i) => (
          <motion.div
            key={a.to}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
          >
            <Link
              to={a.to}
              className={cn(
                'group relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-2xl border p-5 transition-all',
                a.accent === 'primary'
                  ? 'border-primary/25 bg-primary/[0.04] hover:border-primary/50'
                  : 'border-emerald-500/25 bg-emerald-500/[0.04] hover:border-emerald-500/50',
              )}
            >
              <div>
                <div
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-xl',
                    a.accent === 'primary'
                      ? 'bg-primary/12 text-primary'
                      : 'bg-emerald-500/12 text-emerald-500',
                  )}
                >
                  <a.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-heading text-lg font-semibold tracking-tight">{a.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{a.desc}</p>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 text-sm font-medium',
                  a.accent === 'primary' ? 'text-primary' : 'text-emerald-500',
                )}
              >
                {isFr ? 'Commencer' : 'Get started'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.div>
        ))}
      </section>

      {/* Recent creations */}
      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {isFr ? 'Mes dernières créations' : 'My latest creations'}
        </h2>

        {recentProjects && recentProjects.length > 0 ? (
          <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card/40">
            {recentProjects.map((project) => {
              const meta = PROJECT_TYPE_META[project.project_type] || PROJECT_TYPE_META.ebook;
              const Icon = meta.icon;
              const st = STATUS_LABEL[project.status] || STATUS_LABEL.draft;
              return (
                <Link
                  key={project.id}
                  to="/ecrire"
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <Icon className={cn('h-4 w-4 shrink-0', meta.color)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{project.title}</p>
                    <p className="text-[11px] text-muted-foreground">{meta.label}</p>
                  </div>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', st.cls)}>
                    {isFr ? st.fr : st.en}
                  </span>
                  <span className="hidden shrink-0 items-center gap-1 text-[11px] text-muted-foreground sm:flex">
                    <Clock className="h-3 w-3" />
                    {new Date(project.updated_at).toLocaleDateString(isFr ? 'fr' : 'en', { day: 'numeric', month: 'short' })}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 px-6 py-10 text-center">
            <p className="text-sm font-medium">{isFr ? 'Aucune création encore' : 'No creations yet'}</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
              {isFr
                ? `Commence par écrire un livre ou créer une formation avec ${STUDIO_NAME}.`
                : `Start by writing a book or creating a course with ${STUDIO_NAME}.`}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
